(function (angular, _) {
    'use strict';

    var upsert = function (arr, key, newVal) {
        var match = _.find(arr, key);
        if (match) {
            var index = _.indexOf(arr, match);
            arr.splice(index, 1, newVal);
        } else {
            arr.push(newVal);
        }
    };

    // var imageIDs = ['vol097_137_0','vol097_137_1','vol097_138_0','vol097_138_1','vol097_139_0','vol097_139_1','vol097_140_0','vol097_140_1','vol097_141_0','vol097_141_1','vol097_142_0','vol097_142_1','vol097_143_0','vol097_143_1','vol097_144_0','vol097_144_1','vol097_145_0','vol097_145_1','vol097_146_0','vol097_146_1','vol097_147_0','vol097_147_1','vol097_148_0','vol097_148_1','vol097_149_0','vol097_149_1','vol097_150_0','vol097_150_1','vol097_151_0','vol097_151_1','vol097_152_0','vol097_152_1','vol097_153_0','vol097_153_1','vol097_154_0','vol097_154_1','vol097_155_0','vol097_155_1','vol097_156_0','vol097_156_1','vol097_157_0','vol097_157_1','vol097_158_0','vol097_158_1','vol097_159_0','vol097_159_1','vol097_160_0','vol097_160_1','vol097_161_0','vol097_161_1','vol097_162_0','vol097_162_1','vol097_163_0','vol097_163_1','vol097_164_0','vol097_164_1','vol097_165_0','vol097_165_1','vol097_166_0','vol097_166_1','vol097_167_0','vol097_167_1','vol097_168_0','vol097_168_1','vol097_169_0','vol097_169_1','vol097_170_0','vol097_170_1','vol097_171_0','vol097_171_1','vol097_172_0','vol097_172_1','vol097_173_0','vol097_173_1','vol097_174_0','vol097_174_1','vol097_175_0','vol097_175_1','vol097_176_0','vol097_176_1','vol097_177_0','vol097_177_1','vol097_178_0','vol097_178_1','vol097_179_0','vol097_179_1','vol097_180_0','vol097_180_1','vol097_181_0','vol097_181_1','vol097_182_0','vol097_182_1','vol097_183_0','vol097_183_1','vol097_184_0','vol097_184_1','vol097_185_0','vol097_185_1','vol097_186_0','vol097_186_1','vol097_187_0','vol097_187_1','vol097_188_0','vol097_188_1'];
    // var imageIDs = ['vol097_159_0', 'vol097_137_1','vol097_138_0'];

    var module = angular.module('transcribe', [
        'ngAnimate',
        'ui.router',
        'ngLoad',
        'angularSpinner',
        'svg',
        'annotation'
    ]);

    module.config(function ($stateProvider) {
        $stateProvider
            .state('transcribe', {
                url: '/annotate/:subject_set_id/',
                views: {
                    main: {
                        controller: 'transcribeCtrl',
                        templateUrl: 'templates/transcribe/transcribe.html'
                    }
                }
            });
    });

    module.directive('transcribeTools', function (svgPanZoomFactory, svgDrawingFactory, toolFactory) {
        return {
            restrict: 'A',
            templateUrl: 'templates/transcribe/_tools.html',
            scope: true,
            link: function (scope, element, attrs) {
                scope.tools = [
                    {
                        id: 'header',
                        title: 'Table header'
                    },
                    {
                        id: 'row',
                        title: 'Table row'
                    },
                    {
                        id: 'date',
                        title: 'Date',
                        icon: 'calendar',
                        tooltip: 'Record any mentions of the date'
                    },
                    {
                        id: 'location',
                        title: 'Location',
                        icon: 'globe',
                        tooltip: 'Record any mentions of location'
                    },
                    {
                        id: 'weather',
                        title: 'Weather',
                        icon: 'cloud'
                    },
                    {
                        id: 'refueling',
                        title: 'Refueling',
                        icon: 'oil',
                        tooltip: 'Enter any mentions of the ship\'s refueling'
                    },
                    {
                        id: 'events',
                        title: 'Events',
                        icon: 'list-alt',
                        tooltip: 'Note any other interesting events on the ship'
                    },
                    {
                        id: 'animals',
                        title: 'Animals',
                        icon: 'piggy-bank',
                        tooltip: 'Enter any mentions of animals sighted or captured'
                    },
                    {
                        id: 'sea-ice',
                        title: 'Sea Ice',
                        icon: 'asterisk',
                        tooltip: 'Record any mentions of sea ice'
                    },
                    {
                        id: 'mentions',
                        title: 'Mentions',
                        icon: 'bullhorn',
                        tooltip: 'Record any mentions of people or ships'
                    }
                ];

                scope.toggleHover = function (i) {
                    scope.tools[i].hover = !scope.tools[i].hover;
                };

                scope.toggleTool = function (i) {
                    var thisTool = scope.tools[i];

                    // Disable all other tools.
                    angular.forEach(scope.tools, function (tool, index) {
                        if (index !== i) { tool.active = false; }
                    });

                    // Toggle the active state of this tool.
                    if (angular.isDefined(i)) {
                        thisTool.active = !thisTool.active;
                    }

                    // Define the active tool on the parent scope.
                    scope.$parent.activeTool = thisTool && thisTool.active ? thisTool : null;

                    // Toggle pan zoom based on the active tool.
                    if (_.isNull(scope.$parent.activeTool)) {
                        toolFactory.disable();
                    } else {
                        toolFactory.enable(thisTool.id);
                    }
                };

                scope.newSubject = function () {
                    scope.toggleTool();
                    scope.$parent.loadSubject();
                };
            }
        };
    });

    module.factory('toolFactory', function (svgPanZoomFactory, svgDrawingFactory) {
        var enable = function (tool) {
            svgPanZoomFactory.disable();
            svgDrawingFactory.bindMouseEvents({type: tool});
        };

        var disable = function () {
            svgPanZoomFactory.enable();
            svgDrawingFactory.unBindMouseEvents();
        };

        return {
            enable: enable,
            disable: disable
        };
    });

    module.directive('transcribeQuestions', function ($rootScope, toolFactory) {
        return {
            restrict: 'A',
            scope: {
                questions: '=transcribeQuestions'
            },
            templateUrl: 'templates/transcribe/_questions.html',
            link: function (scope, element, attrs) {
                scope.$watch('questions', function () {
                    if (scope.questions && scope.questions.tasks) {
                        scope.tasks = scope.questions.tasks;
                        scope.activeTask = scope.questions.first_task;
                        scope.questionsCompleted = false;
                    }
                });

                scope.$watch('activeTask', function () {
                    if (scope.activeTask && angular.isDefined(scope.tasks[scope.activeTask].tools)) {
                        toolFactory.enable(scope.tasks[scope.activeTask].tools[0].label);
                    } else {
                        toolFactory.disable();
                    }
                });

                scope.confirm = function (value) {
                    if (value && _.isString(value)) {
                        scope.activeTask = value;
                    } else {
                        scope.activeTask = undefined;
                        $rootScope.$broadcast('transcribe:questionsComplete');
                    }
                };

                scope.skipQuestions = function () {
                    scope.activeTask = undefined;
                    $rootScope.$broadcast('transcribe:questionsComplete');
                };
            }
        };
    });

    module.factory('workflowFactory', function ($q, zooAPI, zooAPISubjectSets, zooAPIWorkflows, localStorageService) {
        var get = function (subject_set_id) {
            var deferred = $q.defer();
            zooAPISubjectSets.get({id: subject_set_id})
                .then(function (response) {
                    var workflowID = response[0].links.workflows[0];
                    zooAPIWorkflows.get(workflowID).then(deferred.resolve, deferred.reject, deferred.notify);
                });

            return deferred.promise;
        };

        return {
            get: get
        };
    });

    module.factory('subjectFactory', function ($q, zooAPI, localStorageService) {
        var _getQueueCache = function (subject_set_id) {
            var cache = localStorageService.get('subject_set_queue_' + subject_set_id);
            if (!cache) {
                cache = localStorageService.set('subject_set_queue_' + subject_set_id, []);
            }

            return cache;
        };

        var _addToQueue = function (subject_set_id, subjects) {
            var cache = _getQueueCache(subject_set_id);

            angular.forEach(subjects, function (subject) {
                upsert(cache, {id: subject.id}, subject);
            });

            return localStorageService.set('subject_set_queue_' + subject_set_id, cache);
        };

        var _loadNewSubjects = function (subject_set_id) {
            var deferred = $q.defer();

            // var subjectSetUpdated = localStorageService.get('subject_set_updated_' + subject_set_id);
            // if (!subjectSetUpdated) {
                // subjectSetUpdated = localStorageService.get
            // }

            var lastPage = localStorageService.get('subject_set_page_' + subject_set_id);
            if (!lastPage) {
                lastPage = 0;
            }

            zooAPI.type('subjects').get({
                page: lastPage + 1,
                page_size: 20,
                subject_set_id: subject_set_id
            })
            .then(function (response) {
                if (response.length > 0) {
                    _addToQueue(subject_set_id, response);

                    localStorageService.set('subject_set_page_' + subject_set_id, (lastPage + 1));
                }

                deferred.resolve();
            });

            return deferred.promise;
        };

        var _getNextInQueue = function (subject_set_id) {
            var deferred = $q.defer();

            var cache = _getQueueCache(subject_set_id);

            if (!angular.isArray(cache) || cache.length === 0) {
                _loadNewSubjects(subject_set_id)
                    .then(function () {
                        cache = _getQueueCache(subject_set_id);

                        if (cache.length === 0) {
                            deferred.resolve(null);
                        } else {
                            deferred.resolve(cache[0]);
                        }
                    });
            } else {
                deferred.resolve(cache[0]);
            }

            return deferred.promise;
        };

        var get = function (subject_set_id) {
            var deferred = $q.defer();

            _getNextInQueue(subject_set_id)
                .then(function (subject) {
                    deferred.resolve(subject);
                });


            return deferred.promise;
        };

        return {
            get: get
        };
    });

    module.controller('transcribeCtrl', function ($rootScope, $timeout, $stateParams, $scope, $sce, workflowFactory, subjectFactory, svgPanZoomFactory) {
        $rootScope.bodyClass = 'annotate';

        $scope.loadSubject = function () {
            $rootScope.$broadcast('transcribe:saveSubject', $scope.subject);
            $rootScope.$broadcast('transcribe:loadingSubject');

            $scope.subject = undefined;
            $scope.isLoading = true;
            $scope.questions = null;
            $scope.questionsComplete = false;

            workflowFactory.get($stateParams.subject_set_id)
                .then(function (response) {
                    $scope.questions = response;
                });

            subjectFactory.get($stateParams.subject_set_id)
                .then(function (response) {
                    if (response !== null) {
                        $timeout(function () {
                            $scope.subject = response;
                            var keys = Object.keys($scope.subject.locations[0]);
                            var subjectImage = $scope.subject.locations[0][keys[0]];
                            // TODO: change this. We're cache busting the image.onload event.
                            subjectImage += '?' + new Date().getTime();
                            subjectImage = 'http://oldweather.s3.amazonaws.com/ow3/final/USRC%20Bear/vol097/vol097_159_0.jpg?' + new Date().getTime();
                            // subjectImage = 'http://www.cosmik.com/oldweather/charleston_-_1945_july_12_-_b1956_027.jpg';
                            $scope.trustedSubjectImage = $sce.trustAsResourceUrl(subjectImage);

                            $rootScope.$broadcast('transcribe:loadedSubject');
                        });
                    } else {
                        $scope.subject = null;
                        $rootScope.$broadcast('transcribe:loadedSubject');
                    }

                });
        };
        $scope.loadSubject();

        $scope.subjectLoaded = function () {
            $scope.isLoading = false;
        };

        $scope.$on('transcribe:svgPanZoomToggle', function () {
            $scope.isAnnotating = !svgPanZoomFactory.status();
        });

        $scope.$on('transcribe:questionsComplete', function () {
            $scope.questionsComplete = true;
        });

        $scope.clearAnnotations = function () {
            if (window.confirm('Remove all annotations?')) {
                $rootScope.$broadcast('transcribe:clearAnnotations');
            }
        };

        $scope.toggleGuides = function () {
            $scope.showGuides = !$scope.showGuides;
        };
    });

}(window.angular, window._));
