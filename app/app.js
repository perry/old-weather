(function (angular) {
    'use strict';

    var module = angular.module('app', [
        'ui.router',
        'ui.bootstrap',
        'fitVids',
        '404',
        'content',
        'ships',
        'annotate',
        'transcribe',
        'zooniverse',
        'auth',
        'classificationViewer',
        'navTool'
    ]);

    module.config(
        function ($stateProvider, usSpinnerConfigProvider) {
            $stateProvider
                .state('home', {
                    url: '/',
                    views: {
                        main: {
                            controller: 'HomeController',
                            templateUrl: 'templates/app/home.html'
                        }
                    }
                });

            usSpinnerConfigProvider.setDefaults({color: '#fff'});
        }
    );

    module.run(function ($rootScope) {
        $rootScope.$on('$stateChangeStart', function () {
            $rootScope.bodyClass = null;
        });
    });

}(window.angular));

(function (angular) {
    'use strict';

    var module = angular.module('app');

    module.controller('HomeController',
        function ($rootScope, zooAPIProject, $scope, $modal) {
            $rootScope.bodyClass = 'home';

            zooAPIProject.get()
                .then(function (response) {
                    $scope.project = response;
                });

            $scope.openHomeVideo = function (size) {
                $modal.open({
                    template: '<div fit-vids><iframe src="https://player.vimeo.com/video/15153640?color=00cfd7" width="540" height="304" frameborder="0"></iframe></div> <a class="btn btn-skeleton white uppercase more-video-modal" ui-sref="about.why" ng-click="cancel()">See more videos about Old Weather</a>',
                    controller: 'HomeVideoController',
                    size: 'lg'
                });
            };
        });

    module.controller('HomeVideoController', function ($scope, $modalInstance) {
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    });

}(window.angular));

(function (angular) {
    'use strict';

    angular.module('zooAPI', [
        'LocalStorageModule'
    ]);

}(window.angular));

(function (angular, _) {
    'use strict';

    // use to determine if in production or staging
    var isProd = window.location.hostname === 'www.oldweather.org' || window.location.hostname === 'oldweather.org';

    var module = angular.module('zooAPI');

    var upsert = function (arr, key, newVal) {
        var match = _.find(arr, key);
        if (match) {
            var index = _.indexOf(arr, match);
            arr.splice(index, 1, newVal);
        } else {
            arr.push(newVal);
        }
    };

    module.constant('zooAPIConfig', {
        display_name: 'oldweather',
        // set up params based on production/staging env
        app_id: isProd ?
          '2b10a14e8f11eefb130a275f01898c8406600834bff1063bb1b7938795acc8a3' : // production
          '0cee9a29027e78cc7f9df99a3d6b0d00aaf3bbfad014a4bb73bf29f30b46575f',  // staging
        url: isProd ?
          'https://panoptes.zooniverse.org/api' :
          'https://panoptes-staging.zooniverse.org/api'
    });

    module.factory('zooAPI', function ($window, zooAPIConfig) {
      console.log('zooAPIConfig = ', zooAPIConfig);
      $window.zooOAuth.init(zooAPIConfig.app_id);
      return $window.zooAPI;
    });

    module.filter('removeCircularDeps', function () {
        return function (val) {
            var process = function (object) {
                return _.omit(object, function (value, key) { return key.charAt(0) === '_'; });
            };

            if (_.isArray(val)) {
                _.each(val, function (item, index) {
                    val[index] = process(val[index]);
                });
            } else {
                val = process(val);
            }

            return val;
        };
    });

    module.factory('zooAPIProject', function ($filter, $q, localStorageService, zooAPIConfig, zooAPI) {
        var get = function () {
            var deferred = $q.defer();

            zooAPI.type('projects').get({display_name: zooAPIConfig.display_name})
                .then(function (response) {
                    var data = $filter('removeCircularDeps')(response[0]);
                    deferred.resolve(data);
                });

            return deferred.promise;
        };

        return {
            get: get
        };
    });

    module.factory('zooAPIWorkflows', function ($q, $filter, localStorageService, zooAPIConfig, zooAPI) {
        var get = function (filter) {
            var deferred = $q.defer();

            zooAPI.type('workflows').get(filter)
                .then(function (response) {
                    deferred.resolve($filter('removeCircularDeps')(response));
                });

            return deferred.promise;
        };

        return {
            get: get
        };
    });

    module.factory('zooAPISubjectSets', function ($q, $filter, localStorageService, zooAPI, zooAPIProject) {
        var get = function (filter) {
            var deferred = $q.defer();

            zooAPIProject.get()
                .then(function (response) {
                    var options = {
                        project_id: response.id,
                        'metadata.active': true
                    };
                    // An array that will contain subject sets returned from out API call.
                    var subjectSets = [];

                    if (angular.isDefined(filter)) {
                        options = angular.extend(options, filter);
                    }

                    var loadPages = function (opts) {
                        zooAPI.type('subject_sets').get(opts)
                            .then(processResponse, deferred.reject);
                    };

                    var processResponse = function (sets) {

                        sets = _.sortBy(sets, 'display_name');

                        var meta = sets[0]._meta.subject_sets;

                        angular.forEach(sets, function (s) {
                            upsert(subjectSets, {'id': s.id}, s);
                        });

                        if (meta.next_page) {
                            deferred.notify(subjectSets);
                            loadPages(angular.extend({}, options, {page: meta.next_page}));
                        } else {
                            deferred.resolve($filter('removeCircularDeps')(subjectSets));
                        }
                    };

                    loadPages(options);
                });

            return deferred.promise;
        };

        return {
            get: get
        };
    });

}(window.angular, window._));

(function (angular, zooAuth) {
    'use strict';

    var module = angular.module('auth', []);


    module.config(function ($stateProvider, $urlRouterProvider) {

        $urlRouterProvider.when(/\/access_token/, fixAuthUrl);

        $stateProvider.state('completeAuth', {
            url: '/auth',
            views: {
                main: {
                    template: '<div class="logging-in">Logging in...</div>',
                    controller: CompleteAuthController
                }
            }
        });

        function CompleteAuthController($location, authFactory) {
            authFactory.completeSignIn($location.search());
        }

        function fixAuthUrl($match) {
            return '/auth?' + $match.input.substr(1);
        }

    });

    module.factory('authFactory', function ($filter, $interval, $location, $modal, $rootScope, $window, localStorageService, zooAPI, zooAPIConfig) {

        if (localStorageService.get('user') === null) {
            localStorageService.set('user', null);
        }

        if (localStorageService.get('auth') === null) {
            localStorageService.set('auth', null);
        } else {
            var auth = localStorageService.get('auth');
            if (0 < (Math.floor(Date.now() / 1000) - auth.token_start) < auth.expires_in) {
                _setToken(auth.access_token);
                _setUserData();
            } else {
                signOut();
            }
        }

        function completeSignIn(params) {
            localStorageService.set('auth', {
                access_token: params.access_token,
                token_start: Date.now(),
                // Convert to milliseconds for consistency
                expires_in: params.expires_in * 1000
            });
            _setToken(params.access_token);
            return _setUserData()
                .then(function () {
                    $window.location.href = localStorageService.get('redirectOnSignIn');
                });
        }

        function signIn() {
            localStorageService.set('redirectOnSignIn', $location.absUrl());
            $window.zooOAuth.signIn($location.absUrl().match(/.+?(?=\#\/)/)[0]);
        }

        function _setToken(token) {
            zooAPI.headers.Authorization = 'Bearer ' + token;
        }

        function _setUserData() {
            return zooAPI.type('me').get()
                .then(function (response) {

                    var data = $filter('removeCircularDeps')(response[0]);
                    localStorageService.set('user', data);
                    $rootScope.$broadcast('auth:signin');

                    return response[0].get('avatar')
                        .then(function (avatar) {
                            var avatarData = $filter('removeCircularDeps')(avatar[0]);
                            localStorageService.set('avatar', avatarData);
                            $rootScope.$broadcast('auth:avatar');
                        }, function () {
                            return;
                        });
                }, function (error) {
                    console.warn('Error logging in', error);
                    return;
                });
        }

        function signOut() {
            delete zooAPI.headers.Authorization;
            localStorageService.set('auth', null);
            localStorageService.set('user', null);
            localStorageService.set('avatar', null);
            $window.zooAuth.signOut();
            $rootScope.$broadcast('auth:signout');
        }

        return {
            signIn: signIn,
            signOut: signOut,
            completeSignIn: completeSignIn,
            getUser: function () { return localStorageService.get('user'); },
            getAvatar: function () { return localStorageService.get('avatar'); }
        };
    });

    module.controller('SessionExpiredModalController', function ($scope, $modalInstance) {
        $scope.close = $modalInstance.dismiss;
    });

    module.controller('HeaderUserCtrl', function ($timeout, $scope, authFactory, $modal) {
        $scope.user = authFactory.getUser();
        $scope.avatar = authFactory.getAvatar();

        $scope.$on('auth:signin', function () {
            $timeout(function () {
                $scope.user = authFactory.getUser();
            });
        });

        $scope.$on('auth:avatar', function () {
            $timeout(function () {
                $scope.avatar = authFactory.getAvatar();
            });
        });

        $scope.$on('auth:signout', function () {
            $timeout(function () {
                $scope.user = null;
            });
        });

        $scope.signOut = authFactory.signOut;
        $scope.signIn = authFactory.signIn;
    });

}(window.angular, window.zooAuth));

(function (angular) {
    'use strict';

    var module = angular.module('404', [
        'ui.router'
    ]);

    module.config([
        '$stateProvider',
        '$urlRouterProvider',
        function ($stateProvider, $urlRouterProvider) {
            $urlRouterProvider.when('', '/');
            $urlRouterProvider.otherwise('/404');

            $stateProvider
                .state('404', {
                    url: '/404',
                    views: {
                        main: {
                            templateUrl: 'templates/404/404.html'
                        }
                    }
                });
        }
    ]);

}(window.angular));

(function (angular) {
    'use strict';

    var module = angular.module('content', [
        'ui.router'
    ]);

    module.config([
        '$stateProvider',
        function ($stateProvider) {
            $stateProvider
                .state('about', {
                    url: '/about',
                    abstract: true,
                    views: {
                        main: {
                            template: '<div class="content-section"><div class="container"><ui-view></div></div>'
                        }
                    }
                })
                .state('about.partners', {
                    url: '/partners',
                    templateUrl: 'templates/content/partners.html'
                })
                .state('about.team', {
                    url: '/team',
                    templateUrl: 'templates/content/team.html'
                })
                .state('about.why', {
                    url: '/why',
                    templateUrl: 'templates/content/why.html'
                })
                .state('about.faq', {
                    url: '/faq',
                    templateUrl: 'templates/content/faq.html'
                });
        }
    ]);

}(window.angular));

(function (angular) {
    'use strict';

    var module = angular.module('ships', [
        'ui.router',
        'zooAPI'
    ]);

    module.config([
        '$stateProvider',
        '$urlRouterProvider',
        function ($stateProvider, $urlRouterProvider) {
            $stateProvider
                .state('ships-list', {
                    url: '/ships',
                    views: {
                        main: {
                            templateUrl: 'templates/ships/list.html',
                            controller: 'ShipsListCtrl'
                        },
                        'header-bottom': {
                            templateUrl: 'templates/ships/list-header.html'
                        }
                    }
                })
                .state('ships-detail', {
                    url: '/ships/:id',
                    views: {
                        main: {
                            templateUrl: 'templates/ships/detail.html',
                            controller: 'ShipsDetailCtrl'
                        },
                        'header-bottom': {
                            templateUrl: 'templates/ships/list-header.html'
                        }
                    }
                });

            $urlRouterProvider.when('/classify', '/ships');
        }
    ]);

}(window.angular));

(function (angular, Packery, _) {
    'use strict';

    var module = angular.module('ships');

    /**
     * @ngdoc controller
     * @name ships.controller:ShipsListCtrl
     *
     * @description
     * Controller for ships listing.
     */
    module.controller('ShipsListCtrl',
        function ($scope, zooAPISubjectSets, ShipsDetailConstants) {

            // An array of objects containing the table header information.
            $scope.headers = [
                {name: 'Ship', key: 'display_name'},
                {name: 'Travel', key: 'travel'},
                {name: 'Difficulty', key: 'difficulty'},
                {name: 'Crew', key: 'users'}
            ];

            // Default sort for the columns.
            $scope.columnSort = {key: $scope.headers[0].key, reverse: false};

            /**
             * @ngdoc function
             * @name sort
             * @methodOf ships.controller:ShipsListCtrl
             * @param {number} index
             * The index of the header you wish to sort.
             */
            $scope.sort = function (index) {
                if (angular.isUndefined(index) || angular.isUndefined($scope.headers[index])) {
                    return;
                }

                if ($scope.columnSort.key !== $scope.headers[index].key) {
                    $scope.columnSort.reverse = false;
                } else {
                    $scope.columnSort.reverse = !$scope.columnSort.reverse;
                }

                $scope.columnSort.key = $scope.headers[index].key;
            };

            // Get all the ships.
            $scope.loading = true;
            $scope.ships = [];
            zooAPISubjectSets.get()
                .then(function (response) {
                    $scope.ships = response;
                }, function () {
                    $scope.ships = [];
                }, function (response) {
                    $scope.loading = false;
                    $scope.ships = response;

                })
                ['finally'](function () {
                    $scope.loading = false;
                    $scope.ships = $scope.ships.map(function (ship) {
                        var extraInfo = ShipsDetailConstants[ship.metadata.shortName] ||
                            ShipsDetailConstants[ship.display_name.split(' ')[0].toLowerCase()] ||
                            {};
                        ship.metadata = _.extend(ship.metadata, extraInfo);
                        return ship;
                    });
                });
        }
    );

    module.directive('shipsList', function ($timeout) {
        return {
            link: function (scope, element, attrs) {
                var pckry = new Packery(element[0], {
                    columnWidth: '.grid-sizer',
                    gutter: '.gutter-sizer',
                    itemSelector: '.item',
                    percentPosition: true,
                    transitionDuration: 0
                });

                scope.$watch('ships', function () {
                    $timeout(function () {
                        pckry.reloadItems();
                        pckry.layout();
                    });
                });
            }
        };
    });
}(window.angular, window.Packery, window._));

(function (angular) {
    'use strict';

    var module = angular.module('ships');

    /**
     * @ngdoc controller
     * @name ships.controller:ShipsDetailCtrl
     *
     * @description
     *
     */
    module.controller('ShipsDetailCtrl',
        function ($scope, $stateParams, $state, ShipsDetailConstants, zooAPISubjectSets) {
            if (angular.isDefined($stateParams.id)) {
                zooAPISubjectSets.get({id: $stateParams.id})
                    .then(function (response) {
                        $scope.ship = response[0];
                        $scope.shipInfo = ShipsDetailConstants[$scope.ship.metadata.shortName] || ShipsDetailConstants[$scope.ship.display_name.split(' ')[0].toLowerCase()] || false;
                    }, function () {
                        $state.go('404');
                    });

            } else {
                $state.go('ships-list');
            }
        }
    );
}(window.angular));


(function (angular) {
    'use strict';

    var module = angular.module('ships');

    /**
     * @ngdoc object
     * @name ships.constant:ShipsDetailConstant
     *
     * @description
     * Provides ship names, histories and links.
     *
     */
    module.constant('ShipsDetailConstants', {
        'ammen': {
            fullName: 'USS Ammen',
            shipClass: 'DD-527 destroyer',
            tonnage: '2,050 tons',
            url: 'http://www.naval-history.net/OW-US/Ammen/USS_Ammen.htm',
            imageUrl: 'https://naval-history-net.oldweather.org/OW-US/Ammen/USS_Ammen-1953.jpg',
            bio: [
                'Named after Rear Admiral Daniel Ammen, served from 1836 to 1878, and known to her crew as the "Flaming Ammen".',
                'Launched in 17 September 1942, the Ammen was wrecked on 19 July 1960 while en route to San Diego for decommissioning.'
            ]
        },
        'advance': {
            fullName: 'USS Advance',
            shipClass: 'Brig-rigged wooden sailing ship',
            tonnage: '144 tons',
            url: 'http://www.naval-history.net/OW-US/Advance/USS_Advance.htm',
            imageUrl: 'https://naval-history-net.oldweather.org/OW-US/Advance/USS_Advance1.jpg',
            bio: [
                'The USS Advance was previously a merchant ship named the Augusta, after which she went into service to searching for Sir John Franklin\'s Arctic expedition.',
                'She became stuck in ice while wintering in 1853, and eventually abandoned in 1855. It\'s believed she was crushed by the ice and sank.'
            ]
        },
        'bear': {
            fullName: 'USS Bear',
            shipClass: 'Steam cutter',
            tonnage: '703 tons',
            url: 'http://www.naval-history.net/OW-US/Bear/USS_Bear.htm',
            imageUrl: 'https://naval-history-net.oldweather.org/OW-US/Bear/USRC_Bear04.jpg',
            bio: [
                'Built in 1874 in Scotland as a whaling and sealing ship, after which it was bought by the US Navy for the Greely Arctic rescue msission.',
                'She was later transferred to the Revenue Cutter Service of the Treasury Department for service with the Alaskan Patrol. She finally sank in tow off Nova Scotia in 1963.'
            ]
        },
        'eastwind': {
            fullName: 'USCGC Eastwind',
            shipClass: 'Diesel-electric cutter',
            tonnage: '6,515 tons',
            url: 'http://www.naval-history.net/OW-US/Eastwind/USCGC_Eastwind.htm',
            imageUrl: 'https://naval-history-net.oldweather.org/OW-US/Eastwind/USCGC_Eastwind2WW2.jpg',
            bio: [
                'Hunted for German weather stations on Greenland during the war, later taking part in various operations in the Arctic and Antarctic, including rescue and icebreaking missions.',
                'She was decommissioned and sold in 1968.'
            ]
        },
        'farragut': {
            fullName: 'USS Farragut',
            shipClass: 'Destroyer (DD 348) Farragut-class',
            tonnage: '2,365 tons',
            url: 'http://www.naval-history.net/OW-US/Farragut/USS_Farragut.htm',
            imageUrl: 'https://naval-history-net.oldweather.org/OW-US/Farragut/USS_Farragut-1943.jpg',
            bio: [
                'Commissioned in 1934, the Farragut won 14 battle stars during World War 2, and saw action at Pearl Harbor, Guadalcanal and Iwo Jima.',
                'She was decommissioned and sold for scrap in 1947.'
            ]
        },
        'hassler': {
            fullName: 'USC & GSS Ferdinand R. Hassler',
            shipClass: 'Steamer',
            tonnage: 'Unknown',
            url: 'http://www.naval-history.net/OW-US/Hassler/USCGSS_Hassler.htm',
            imageUrl: 'https://naval-history-net.oldweather.org/OW-US/Hassler/USCGSS_Hassler1.jpg',
            bio: [
                'Named after Ferdinand Hassler, 1770-1843, first Superintendent of the United States Coast Survey.',
                'A scientific vessel, she conducted hydrographic surveys off the West Coast and Alaska for nearly twenty years. She was subsequently sold to a civilian operator and was sunk on her first voyage.'
            ]
        },
        'northland': {
            fullName: 'USCGC Northland',
            shipClass: 'Diesel auxiliary cutter with auxiliary sails',
            tonnage: '2,150 tons',
            url: 'http://www.naval-history.net/OW-US/Northland/USCGC_Northland.htm',
            imageUrl: 'https://naval-history-net.oldweather.org/OW-US/Northland/USCGC_Northland1PostWW1.jpg',
            bio: [
                'Served on the Bering Sea patrol, and later patrolled Greenland during WW2.',
                'After the war, she was bought by Israel, and later became the first vessel of the fledgling Israeli Navy in 1948, as the Matzpen. She was decommissioned and scrapped in 1962.'
            ]
        },
        'northwind': {
            fullName: 'USCGC Northwind',
            shipClass: 'Diesel-electric cutter',
            tonnage: '6,515 tons',
            url: 'http://www.naval-history.net/OW-US/Northwind/USCGC_Northwind.htm',
            imageUrl: 'https://naval-history-net.oldweather.org/OW-US/Northwind/USCGC_Northwind2WW2.JPG',
            bio: [
                'Stationed at Seattle, WA for polar ice operations and the Bering Sea Patrol for nearly 30 years, during which time she took part in various surveys and scientific expeditions.',
                'She was decommissioned in 1989 and assigned to James River Reserve Fleet. She was later sold for scrap.'
            ]
        },
        'polaris': {
            fullName: 'USS Polaris',
            shipClass: 'Gunboat',
            tonnage: '383 tons',
            url: 'http://www.naval-history.net/OW-US/Polaris/USS_Polaris.htm',
            imageUrl: 'https://naval-history-net.oldweather.org/OW-US/Polaris/USS_Polaris1.jpg',
            bio: [
                'Originally commissioned as the USS Periwinkle, she was renamed the Polaris in 1871, and sailed to the North Pole as part of the Hall Scientific Expedition.',
                'After running low on supplies on the return journey, the captain ran her aground near Etah, Greenland. Her timbers were salvaged and used to build two boats, which the crew sailed south until they were rescued.'
            ]
        },
        'rescue': {
            fullName: 'USS Rescue',
            shipClass: 'Brig-rigged wooden sailing ship',
            tonnage: '91 tons',
            url: 'http://www.naval-history.net/OW-US/Rescue/USS_Rescue.htm',
            imageUrl: 'https://naval-history-net.oldweather.org/OW-US/Rescue/USS_Rescue1.jpg',
            bio: [
                'Sailed from New York in 1850 with sister ship USS Advance to search for Sir John Franklin\'s lost Arctic expedition.',
                'After being trapped in ice that winter, she was freed the next year and attempted to continue her search, but returned to New York after conditions worsened further.'
            ]
        }
    });

}(window.angular));

(function (angular) {
    'use strict';

    angular.module('svg', []);

}(window.angular));

(function (angular) {
    'use strict';

    var module = angular.module('svg');

    module.directive('svgPanZoom', function ($timeout, svgPanZoomFactory, svgDrawingFactory, svgGridFactory) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var el = element[0];

                var opts = {
                    mouseWheelZoomEnabled: false
                };
                var attrOpts = scope.$eval(attrs.svgPanZoom);
                if (angular.isObject(attrOpts)) {
                    angular.extend(opts, attrOpts);
                }

                scope.panZoom = svgPanZoomFactory.init(el, opts);

                var viewport = svgPanZoomFactory.viewport();
                var $viewport = angular.element(viewport);

                svgDrawingFactory.init(scope.panZoom, el, $viewport);
                svgGridFactory.init(scope.panZoom, el, $viewport);

                scope.togglePan = function () {
                    return svgPanZoomFactory.toggle();
                };

                scope.hasMouseEvents = function () {
                    return svgDrawingFactory.hasMouseEvents();
                };

                var longRotation = false;
                var longRotationTimeout;
                scope.rotation = 0;

                scope.rotate = function (degrees) {
                    scope.rotation = svgPanZoomFactory.rotate(degrees);
                };

                scope.startLongRotation = function (degrees) {
                    var increment = function (d) {
                        if (longRotation) {
                            scope.rotate(d);
                            $timeout(function () {
                                increment(d);
                            }, 10);
                        }
                    };

                    longRotationTimeout = $timeout(function () {
                        longRotation = true;
                        increment(degrees);
                    }, 300);
                };

                scope.stopLongRotation = function () {
                    $timeout.cancel(longRotationTimeout);
                    longRotation = false;
                };

                scope.reset = function () {
                    scope.panZoom.reset();
                    scope.rotate(0);
                };
            }
        };
    });
}(window.angular));

(function (angular) {
    'use strict';

    var module = angular.module('svg');

    module.service('svgService', function () {
        this.createPoint = function (el, $viewport, event) {
            var point = el.createSVGPoint();
            point.x = event.clientX;
            point.y = event.clientY;
            return point.matrixTransform($viewport[0].getScreenCTM().inverse());
        };
    });
}(window.angular));

(function (angular, _) {
    'use strict';

    var module = angular.module('svg');

    module.factory('svgGridFactory', function ($rootScope, svgPanZoomFactory, svgService) {
        // Note: $rootScope currently unused

        var self = this;
        self.data = null;
        self.eventsBound = false;

        var init = function (svg, el, $viewport) {
            self.svg = svg;
            self.el = el;
            self.$viewport = $viewport;
        };

        var bindMouseEvents = function (data) {
            if (angular.isDefined(data)) {
                self.data = data;
            } else {
                self.data = null;
            }

            self.$viewport.on('mousedown', startDraw);
            self.$viewport.on('mouseup', finishDraw);
            self.eventsBound = true;
        };

        var unBindMouseEvents = function () {
            self.data = null;
            self.$viewport.off('mousedown');
            self.$viewport.off('mouseup');
            self.eventsBound = false;
        };

        var createPoint = function (e) {
          // console.log('svgGridFactory::createPoint(), e = ', e); // --STI
          var newPoint = svgService.createPoint(self.el, self.$viewport, e);
          return newPoint;
        }

        var startDraw = function(e) {
          console.log('svgGridFactory::startDraw()'); // --STI

          // Only start drawing if panZoom is disabled, and it's a primary mouse click
          if (!svgPanZoomFactory.status() && e.which === 1) {

          }
        };

        var finishDraw = function(e) {
          console.log('svgGridFactory::finishDraw()'); // --STI
        };

        var hasMouseEvents = function () {
            return self.eventsBound;
        };

        return {
            init: init,
            bindMouseEvents: bindMouseEvents,
            unBindMouseEvents: unBindMouseEvents,
            hasMouseEvents: hasMouseEvents,
            createPoint: createPoint
        };
    });
}(window.angular, window._));

(function (angular, _) {
    'use strict';

    var module = angular.module('svg');

    module.factory('svgDrawingFactory', function ($rootScope, svgPanZoomFactory, svgService) {
        var self = this;

        self.tempRect = null;
        self.tempOrigin = null;
        self.drawing = false;
        self.drawPromise = undefined;
        self.data = null;
        self.eventsBound = false;

        var init = function (svg, el, $viewport) {
            self.svg = svg;
            self.el = el;
            self.$viewport = $viewport;
        };

        var draw = function (event) {
            var newPoint = svgService.createPoint(self.el, self.$viewport, event);
            self.tempRect.x = (self.tempOrigin.x < newPoint.x) ? self.tempOrigin.x : newPoint.x;
            self.tempRect.y = (self.tempOrigin.y < newPoint.y) ? self.tempOrigin.y : newPoint.y;
            self.tempRect.width = Math.abs(newPoint.x - self.tempOrigin.x);
            self.tempRect.height = Math.abs(newPoint.y - self.tempOrigin.y);
            $rootScope.$broadcast('svgDrawing:update', self.tempRect, self.data);
        };

        var startDraw = function (event) {
            // Only start drawing if panZoom is disabled, and it's a primary mouse click
            if (!svgPanZoomFactory.status() && event.which === 1) {
                event.preventDefault();

                if (self.drawing) { // already drawing...
                    draw(event);
                    // finishDraw(event); // not necessary?
                } else {
                    self.tempOrigin = svgService.createPoint(self.el, self.$viewport, event);
                    self.drawing = true;
                    self.tempRect = angular.extend({}, self.tempOrigin, {
                        width: 0,
                        height: 0,
                        timestamp: new Date().getTime(),
                        _id: _.uniqueId() + new Date().getTime(),
                        rotation: svgPanZoomFactory.getRotation()
                    }, self.data);
                    $rootScope.$broadcast('svgDrawing:add', self.tempRect, self.data);
                    self.$viewport.on('mousemove', draw);
                }
            }
        };

        var finishDraw = function (event) {
            var newPoint = svgService.createPoint(self.el, self.$viewport, event);
            if (self.tempOrigin && !(newPoint.x === self.tempOrigin.x && newPoint.y === self.tempOrigin.y)) {
                $rootScope.$broadcast('svgDrawing:finish', angular.extend({}, self.tempRect), self.data);
                self.drawing = false;
                self.tempRect = null;
                self.tempOrigin = null;
            } else { // zero-dimension rect created
                // TODO: Add a marker here.
                return;
            }
            self.$viewport.off('mousemove');
        };

        var bindMouseEvents = function (data) {
            if (angular.isDefined(data)) {
                self.data = data;
            } else {
                self.data = null;
            }

            self.$viewport.on('mousedown', startDraw);
            self.$viewport.on('mouseup', finishDraw);
            self.eventsBound = true;
        };

        var unBindMouseEvents = function () {
            self.data = null;

            self.$viewport.off('mousedown');
            self.$viewport.off('mouseup');

            self.eventsBound = false;
        };

        var hasMouseEvents = function () {
            return self.eventsBound;
        };

        return {
            init: init,
            startDraw: startDraw,
            draw: draw,
            finishDraw: finishDraw,
            bindMouseEvents: bindMouseEvents,
            unBindMouseEvents: unBindMouseEvents,
            hasMouseEvents: hasMouseEvents
        };
    });
}(window.angular, window._));

(function (angular, _, svgPanZoom) {
    'use strict';

    var module = angular.module('svg');

    module.factory('svgPanZoomFactory', function ($rootScope) {
        var self = this;

        return {
            init: function (el, opts) {
                opts = opts || {};
                self.el = el;
                self.opts = opts;
                self.svgInstance = svgPanZoom(self.el, self.opts);
                self.rotation = 0;

                // center subject image on viewable area
                var svgWidth = self.svgInstance.getSizes().width - 300; // subtract right column width
                var zoomFactor = self.svgInstance.getSizes().realZoom;
                var subjectWidth = self.svgInstance.getSizes().viewBox.width * zoomFactor;
                self.svgInstance.pan({x: svgWidth/2 - subjectWidth/2, y:0});

                return self.svgInstance;
            },
            getSVGInstance: function () {
              return self.svgInstance;
            },
            viewport: function () {
                return self.el.querySelectorAll('.svg-pan-zoom_viewport')[0];
            },
            rotateContainer: function () {
                return self.el.querySelectorAll('.rotate-container')[0];
            },
            status: function () {
                return self.svgInstance.isZoomEnabled() || self.svgInstance.isPanEnabled();
            },
            enable: function () {
                self.svgInstance.enablePan();
                self.svgInstance.enableZoom();

                $rootScope.$broadcast('annotate:svgPanZoomToggle');
            },
            disable: function () {
                self.svgInstance.disablePan();
                self.svgInstance.disableZoom();

                $rootScope.$broadcast('annotate:svgPanZoomToggle');
            },
            toggle: function () {
                var method = self.svgInstance.isZoomEnabled() || self.svgInstance.isPanEnabled() ? 'disable' : 'enable';

                self.svgInstance[method + 'Pan']();
                self.svgInstance[method + 'Zoom']();

                $rootScope.$broadcast('annotate:svgPanZoomToggle');

                return method;
            },
            getRotation: function () {
                return self.rotation;
            },
            rotate: function (degrees) {
                if (_.isString(degrees)) {
                    var operand = degrees.charAt(0);
                    var value = parseFloat(degrees.substring(1));
                    if (operand === '+') {
                        self.rotation += value;
                    } else if (operand === '-') {
                        self.rotation -= value;
                    }
                } else if (_.isNumber(degrees)) {
                    self.rotation = degrees;
                }

                return self.rotation;
            },
            zoomToRect: function (rect) {
                self.svgInstance.resize();
                var sizes = self.svgInstance.getSizes();
                var realZoom = sizes.realZoom;

                var rectCoords = {
                    x: -((rect.x + (rect.width/2))*realZoom)+(sizes.width/2),
                    y: -((rect.y + (rect.height/2))*realZoom)+(sizes.height/2)
                };
                self.svgInstance.pan(rectCoords);

                var padding = 50;
                var zoomRatios = {
                    width: Math.abs(sizes.width / (rect.width + padding)),
                    height: Math.abs(sizes.height / (rect.height + padding))
                };
                var zoomLevel = Math.min(zoomRatios.width, zoomRatios.height);
                self.svgInstance.zoom(zoomLevel);

                return {sizes: self.svgInstance.getSizes()};
            }
        };
    });
}(window.angular, window._, window.svgPanZoom));

(function (angular) {
    'use strict';

    angular.module('confirmationModal', []);

}(window.angular));

(function (angular) {
    'use strict';

    var module = angular.module('confirmationModal');

    module.factory('confirmationModalFactory', [ '$modal', '$controller', function($modal,$controller){

      // set default parameters
      var params = {
        message: 'Are you sure?'
      };

      var setParams = function(data) {
        params = data;
      };

      var getParams = function() {
        return params;
      };

      var deployModal = function(callback) {

        var modalInstance = $modal.open({
          templateUrl: 'templates/confirmation-modal.html',
          controller: 'ConfirmationModalController'
        });

        modalInstance.result.then( function(deleteType) {
          callback(deleteType);
        });
      };

      return {
        deployModal: deployModal,
        setParams: setParams,
        getParams: getParams
      };

    }]);

}(window.angular));

(function (angular) {
    'use strict';

    var module = angular.module('confirmationModal');

    module.controller('ConfirmationModalController', function(confirmationModalFactory, $scope){

      $scope.params = confirmationModalFactory.getParams();

      $scope.deleteAnnotation = function() {
        $scope.$close('annotation');
      };

      $scope.deleteRow = function() {
        $scope.$close('row');
      };

      $scope.confirm = function() {
        $scope.$close('annotation');
      };

      $scope.cancel = function() {
        $scope.$close(false);
      };

    });

}(window.angular));

(function (angular) {
    'use strict';

    angular.module('annotation', ['confirmationModal']);

}(window.angular));

(function (angular, _) {
    'use strict';

    var module = angular.module('annotation');

    var upsert = function (arr, key, newVal) {
        var match = _.find(arr, key);
        if (match) {
            var index = _.indexOf(arr, match);
            arr.splice(index, 1, newVal);
        } else {
            arr.push(newVal);
        }
    };

    module.factory('annotationsFactory', function (confirmationModalFactory, $window, $filter, $rootScope, $stateParams, $q, zooAPISubjectSets, localStorageService, zooAPI) {

        var classification;
        var annotationsPrefix = 'annotation_subject_id_';
        var isEnabled = true;

        var create = function (subject_id) {
            var deferred = $q.defer();

            var subject_set_id = $stateParams.subject_set_id;
            zooAPISubjectSets.get({id: subject_set_id})
                .then(function (response) {
                    var subject_set = response[0];

                    var obj = {
                        annotations: [],
                        metadata: {
                            started_at: new Date().toISOString(),
                            user_agent: navigator.userAgent,
                            user_language: navigator.language
                        },
                        links: {
                            project: subject_set.links.project,
                            subjects: [subject_id]
                        }
                    };

                    zooAPI.type('workflows').get({id: subject_set.links.workflows[0]})
                        .then(function (response) {
                            var workflow = response[0];
                            obj.links.workflow = workflow.id;
                            obj.metadata.workflow_version = workflow.version;

                            classification = obj;
                            deferred.resolve(classification);
                        });
                });

            return deferred.promise;
        };

        var storeData = function (data, subject) {
            var id = subject.id;
            var storageKey = annotationsPrefix + id;
            var classificationObject = localStorageService.get(storageKey);

            var list = localStorageService.get('annotations_list') || [];
            var obj = {subject_id: subject.id, subject_set_id: $stateParams.subject_set_id};
            var item = _.find(list, obj);
            if (angular.isUndefined(item)) {
                list.push(obj);
            }
            localStorageService.set('annotations_list', list);

            upsert(classificationObject.annotations, {_id: data._id}, data);

            localStorageService.set(storageKey, classificationObject);
        };

        var save = function (id) {

            var deferred = $q.defer();

            var storageKey = annotationsPrefix + id;
            var classification = localStorageService.get(storageKey);

            if (classification.annotations.length === 0) {
                var params = {message: 'You haven\'t added any annotations, are you sure you want to finish?'};
                confirmationModalFactory.setParams(params);
                confirmationModalFactory.deployModal( function(deleteType) {
                  if(deleteType){
                    var subject_set_queue = localStorageService.get('subject_set_queue_' + $stateParams.subject_set_id);
                    _.remove(subject_set_queue, {id: id});
                    localStorageService.set('subject_set_queue_' + $stateParams.subject_set_id, subject_set_queue);
                    deferred.resolve();
                  }
                });
            } else {

                classification.metadata.finished_at = new Date().toISOString();
                classification.completed = false;

                var resource = zooAPI.type('classifications').create(classification);
                resource.save()
                    .then(function (response) {
                        response = $filter('removeCircularDeps')(response);
                        localStorageService.set(storageKey, response);

                        var annoList = localStorageService.get('annotations_list');
                        var obj = _.find(annoList, {subject_id: id, subject_set_id: $stateParams.subject_set_id});
                        obj.classification = response.id;
                        upsert(annoList, {subject_id: id}, obj);
                        localStorageService.set('annotations_list', annoList);

                        var subject_set_queue = localStorageService.get('subject_set_queue_' + $stateParams.subject_set_id);
                        _.remove(subject_set_queue, {id: id});
                        localStorageService.set('subject_set_queue_' + $stateParams.subject_set_id, subject_set_queue);

                        deferred.resolve(response);
                    });

            }

            return deferred.promise;
        };

        var get = function (subjectId) {
            var storageKey = annotationsPrefix + subjectId;
            var deferred = $q.defer();

            var data = localStorageService.get(storageKey);
            if (data && data.annotations) {
                deferred.resolve(data);
            } else {
                create(subjectId)
                    .then(function (response) {
                        localStorageService.set(storageKey, response);
                        deferred.resolve(response);
                    });
            }

            return deferred.promise;
        };

        var add = function (data, subject) {
            $rootScope.$broadcast('annotations:add', data);
            storeData(data, subject);
        };

        var addMultiple = function (data, subject) {
            $rootScope.$broadcast('annotations:add', data);
            data.forEach(function (annotation) {
                storeData(annotation, subject);
            });
        };

        var update = function (data, subject) {
            $rootScope.$broadcast('annotations:update', data);
            storeData(data, subject);
        };

        var remove = function (annotationID, subject) {
            var id = subject.id;
            var storageKey = annotationsPrefix + id;

            var classificationObj = localStorageService.get(storageKey);
            _.remove(classificationObj.annotations, {_id: annotationID});
            localStorageService.set(storageKey, classificationObj);
            $rootScope.$broadcast('annotations:remove', annotationID);
        };

        var clear = function (data, subject) {
            var id = subject.id;
            var storageKey = annotationsPrefix + id;
            if (data === null) {
                var classificationObj = localStorageService.get(storageKey);
                classificationObj.annotations = [];
                localStorageService.set(storageKey, classificationObj);
            }

            // Remove the subject from the annotations list.
            var list = localStorageService.get('annotations_list');
            if (!list) {
                list = [];
            }
            var obj = {subject_id: subject.id, subject_set_id: $stateParams.subject_set_id};
            _.remove(list, obj);
            localStorageService.set('annotations_list', list);

            $rootScope.$broadcast('annotations:clear');
        };

        var obj = {
            create: create,
            get: get,
            add: add,
            remove: remove,
            clear: clear,
            update: update,
            save: save,
            addMultiple: addMultiple,
            isEnabled: isEnabled
        };

        return obj;
    });

}(window.angular, window._));

(function (angular, _) {
    'use strict';

    var module = angular.module('annotation');

    module.directive('grid', function (annotationsFactory, gridFactory, $document) {
        return {
            replace: true,
            restrict: 'A',
            templateUrl: 'templates/annotation/grid.html',
            link: function(scope, element, attrs) {

              scope.isClicked = false;
              scope.isDragging = false;
              scope.currentGrid = null;
              scope.initialClick = null;

              /* Begin event handlers */

              scope.onMouseDown = function(e) {
                  e.preventDefault();
                  e.stopPropagation(); // without this, events propagate to entire SVG document

                  scope.isClicked = true;
                  scope.initialClick = gridFactory.createPoint(e);

                  // bind mouse events to document (otherwise dragging stops if cursor moves off grid)
                  $document.on('mousemove', scope.onMouseMove);
                  $document.on('mouseup', scope.onMouseUp);
              };

              scope.onMouseUp = function(e) {
                e.preventDefault();
                e.stopPropagation();

                scope.isClicked = false;
                scope.isDragging = false;
                scope.initialClick = null; // reset initial click

                gridFactory.updateGrid(scope.currentGrid);

                // unbind mouse events
                $document.off('mousemove', scope.onMouseMove);
                $document.off('mouseup', scope.onMouseUp);
              };

              scope.onMouseMove = function(e) {
                e.preventDefault();
                e.stopPropagation();

                if(scope.isClicked) {
                  scope.isDragging = true;
                  scope.currentGrid = gridFactory.get();
                  gridFactory.moveGrid(scope.currentGrid, scope.initialClick, e );
                  scope.$apply();
                }
              };
            }
        };
    });

}(window.angular, window._));

(function (angular) {
    'use strict';

    var module = angular.module('tutorial', []);

    module.controller('TutorialController', ['$scope', '$modal', function($scope, $modal) {

      $scope.noWrapSlides = true;
      $scope.active = 0;
      $scope.slides = [
        {
          id: 0,
          title: 'Welcome to the Old Weather Tutorial!',
          text: 'This will guide you through the process mauris ultrices mauris nec risus porttitor lobortis. Nam elementum, justo sed dignissim congue, justo est ultrices nulla, at feugiat augue sem ac nisl. Aliquam eget blandit arcu. Duis in suscipit turpis. Nunc lobortis purus libero, vitae aliquet diam molestie aliquam. In id mauris vitae orci mollis ultrices. Fusce lobortis, urna et rhoncus fermentum, libero justo laoreet mi, non accumsan nibh neque ac elit. Suspendisse porta, dui a ultricies mollis, mauris lectus pharetra mauris, eu faucibus sem metus at enim. Duis sit amet lacinia mi. Nam non felis sit amet ex dapibus porta quis non leo.'
        },
        {
          id: 1,
          image: 'https://panoptes-uploads.zooniverse.org/production/tutorial_attached_image/a961833b-5204-4f82-b6c2-ffd9375b72d4.gif',
          title: 'Consectetur Elit',
          text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean ligula nibh, dapibus eget nunc et, lacinia luctus sem. Nunc tellus leo, volutpat sed egestas vel, blandit eget sem. Sed faucibus tortor at enim facilisis, ut sagittis est dictum. Integer eu porta tortor. Sed sed imperdiet eros. Nulla facilisi. Aenean eu ultricies nunc, eget porta mauris.'
        },
        {
          id: 2,
          title: 'Nibh Diam',
          image: 'https://panoptes-uploads.zooniverse.org/production/tutorial_attached_image/1034b282-5bb6-426b-a6d7-5f947fa3562d.gif',
          text: 'Vivamus in maximus neque, nec mattis quam. Maecenas non faucibus nulla. Integer nibh diam, ultricies pellentesque auctor a, ullamcorper in leo. Mauris mollis pellentesque orci. Morbi id mauris ut neque scelerisque venenatis et quis augue. Morbi sed ornare eros. Integer fringilla tincidunt sem eget consectetur. Praesent semper nunc odio, ac porttitor lectus sodales sed.'
        }
      ];

      $scope.launchTutorial = function() {
        var modalInstance = $modal.open({
          templateUrl: 'templates/tutorial.html',
          controller: 'TutorialController',
          size: 'lg'
        });
      };

    }]);

}(window.angular));

(function (angular) {
    'use strict';

    var module = angular.module('navTool', []);

    module.directive('navTool', function ($state, $document, $window, svgPanZoomFactory) {
      return {
        restrict: 'E',
        templateUrl: 'templates/nav-tool.html',
        link: function (scope, element, attrs) {

          scope.state = $state;

          var svgWid = element.parent()[0].clientWidth;
          var svgHei = element.parent()[0].clientHeight;

          // set initial position
          scope.xPos = parseInt(svgWid-500);
          scope.yPos = parseInt(svgHei-400);

          // // TO DO: this part needs work
          // angular.element($window).bind('resize', function(event) {
          //
          //   console.log('RESISE ', event);
          //   // get updated dimensions
          //   svgWid = element.parent()[0].clientWidth;
          //   svgHei = element.parent()[0].clientHeight;
          //
          //   console.log('WID HEI = ', svgWid, svgHei);
          //
          //   // this last part is incorrect --STI
          //   startX = x;
          //   startY = y;
          //   // moveElement(svgWid-x,y);
          //   moveElement(x,y); // basically do nothing
          //
          // });

          var startX = 0, startY = 0, x = scope.xPos, y = scope.yPos;

          function mousemove(event) {
            y = event.pageY - startY;
            x = event.pageX - startX;
            moveElement(x,y);
          }

          function moveElement(x,y) {
            // console.log('moveElement(), ', x, y);
            scope.xPos = x;
            scope.yPos = y;
            element.children(0).css({
              top: y + 'px',
              left: x + 'px'
            });
          };

          function mouseup() {
            $document.off('mousemove', mousemove);
            $document.off('mouseup', mouseup);
          }

          scope.style = function() {
            console.log('x, y = ', scope.xPos, scope.yPos);
            return {
              left: scope.xPos + 'px',
              top: scope.yPos + 'px'
            };
          }

          scope.onMouseDown = function(event) {
            event.preventDefault();
            startX = event.pageX - x;
            startY = event.pageY - y;
            $document.on('mousemove', mousemove);
            $document.on('mouseup', mouseup);
          };

        }
      };
    });

}(window.angular));

(function (angular) {
    'use strict';

    angular.module('zooniverse', []);

}(window.angular));

(function (angular) {
    'use strict';

    var module = angular.module('zooniverse');

    module.factory('ZooniverseFooterFactory', function ($http) {

        var factory;
        var data;

        factory = {
            get: get,
            load: load
        };

        return factory;

        function get() {
            return data;
        }

        function load() {
            return $http({
                method: 'GET',
                url: 'https://static.zooniverse.org/zoo-footer/zoo-footer.json'
            })
            .then(function (response) {
                data = response.data;
            });
        }

    });

}(window.angular));

(function (angular) {
    'use strict';

    var module = angular.module('zooniverse');

    module.directive('zooniverseFooter', function (ZooniverseFooterFactory) {
        return {
            restrict: 'A',
            scope: true,
            link: function (scope, element, attrs) {
                scope.loading = true;

                ZooniverseFooterFactory.load()
                    .then(function () {
                        scope.data = ZooniverseFooterFactory.get();
                    })
                    ['finally'](function () {
                        scope.loading = false;
                    });
            }
        };
    });

}(window.angular));



(function (angular, _) {
  'use strict';

  var module = angular.module('classificationViewer', [
    'ui.router',
    'angularSpinner',
    'svg',
    'tutorial'
  ]);

  module.config(function ($stateProvider) {
    $stateProvider
      .state('classifications', {
          url: '/classifications?page',
          views: {
            main: {
              controller: 'classificationViewerController',
              templateUrl: 'templates/classification-viewer.html'
            }
          }
      });
  });

  module.directive('annotationReview', function () {
    return {
      restrict: 'A',
      templateUrl: 'templates/_annotation.html',
      link: function (scope, element, attrs) {

        scope.onMouseOver = function(e) {
          e.stopPropagation();
          scope.isHovered = true;
        };

        scope.onMouseOut = function(e) {
          e.stopPropagation();
          scope.isHovered = false;
        };

      }
    };
  });

  module.controller('classificationViewerController', function($stateParams, $scope, $sce, zooAPI, localStorageService) {

    // get current user (if any)
    if (!localStorageService.get('user')) {
      $scope.statusMessage = 'You must be signed in!';
      return;
    }

    $scope.currentClassification = null;
    $scope.completedClassifications = [];

    var params = {
      // project_id: localStorageService.get('project').id,
    };

    if($stateParams.page) {
      params.page = $stateParams.page;
    }

    zooAPI.type('classifications').get(params)
      .then( function(response) {
        console.log('CLASSIFICATIONS: ', response);
        $scope.meta = response[0]._meta;
        $scope.page = $scope.meta.classifications.page;
        $scope.pageCount = $scope.meta.classifications.page_count;
        // $scope.statusMessage = 'Showing page ' + $scope.page + ' of ' + $scope.pageCount;
        $scope.completedClassifications = response;
        $scope.$apply();
      })
      .catch( function(error) {
        $scope.statusMessage = 'There was an error loading classifications!';
      });

    // $scope.prevPage = function() {
    //   console.log('prevPage()');
    // };
    //
    // $scope.nextPage = function() {
    //   console.log('nextPage()');
    // };

    $scope.loadClassification = function(id) {    // get current user (if any)
      $scope.isLoading = true;
      $scope.currentClassificationId = id;

      if (!localStorageService.get('user')) {
        $scope.statusMessage = 'You must be signed in!';
        return;
      }

      zooAPI.type('classifications').get({id: id})
        .then( function(response) {
          $scope.annotations = response[0].annotations;

          // get subject id from resource
          zooAPI.type('subjects').get({id: response[0].links.subjects[0]})
            .then( function(response) {
              var keys = Object.keys(response[0].locations[0]);
              $scope.image_src = $sce.trustAsResourceUrl( response[0].locations[0][keys[0]] );
              $scope.isLoading = false;
              $scope.$apply();
            });
        })
        .catch( function(error) {
          $scope.error = error.toString();
          console.log('Error! Couldn\'t read data file: ', error);
        });
      }

  })

  // module.controller('classificationViewerController', function ($stateParams, $scope, $sce, $http, localStorageService, zooAPI) {
  //   $scope.isLoading = true;
  //   $scope.classificationId = $stateParams.classification_id;
  //   $scope.image_src = null;
  //   $scope.annotations = [];
  //   $scope.error = '';
  //
  //   // get current user (if any)
  //   if (!localStorageService.get('user')) {
  //     $scope.error = 'You must be signed in!';
  //     return;
  //   }
  //
  //   zooAPI.type('classifications').get({id: $scope.classificationId})
  //     .then( function(response) {
  //
  //       $scope.annotations = response[0].annotations;
  //
  //       // get subject id from resource
  //       zooAPI.type('subjects').get({id: response[0].links.subjects[0]})
  //         .then( function(response) {
  //           var keys = Object.keys(response[0].locations[0]);
  //           $scope.image_src = $sce.trustAsResourceUrl( response[0].locations[0][keys[0]] );
  //           $scope.isLoading = false;
  //           $scope.$apply();
  //         });
  //     })
  //     .catch( function(error) {
  //       $scope.error = error.toString();
  //       console.log('Error! Couldn\'t read data file: ', error);
  //     });
  //
  // });

}(window.angular, window._));
