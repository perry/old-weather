(function (angular, _) {
    'use strict';

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
        app_id: '2b10a14e8f11eefb130a275f01898c8406600834bff1063bb1b7938795acc8a3'
    });

    module.factory('zooAPI', function ($window, zooAPIConfig) {
        $window.zooAPI.root = 'https://panoptes.zooniverse.org/api';
        $window.zooAPI.appID = zooAPIConfig.app_id;
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

            var cache = localStorageService.get('project');
            if (cache) {
                deferred.resolve(cache);
            }

            zooAPI.type('projects').get({display_name: zooAPIConfig.display_name})
                .then(function (response) {
                    var data = $filter('removeCircularDeps')(response[0]);
                    localStorageService.set('project', data);
                    deferred.resolve(localStorageService.get('project'));
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

            var cache = localStorageService.get('workflows');
            if (cache) {
                if (filter) {
                    var cacheByID = _.find(cache, filter);
                    if (angular.isDefined(cacheByID)) {
                        deferred.notify([cacheByID]);
                    }
                } else {
                    deferred.notify(cache);
                }
            } else {
                cache = [];
            }

            zooAPI.type('workflows').get(filter)
                .then(function (response) {
                    upsert(cache, {id: response.id}, response);
                    cache = $filter('removeCircularDeps')(cache);
                    localStorageService.set('workflows', cache);
                    deferred.resolve(response);
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

            var cache = localStorageService.get('subject_sets');
            if (cache) {
                if (filter) {
                    var cacheByID = _.find(cache, filter);
                    if (angular.isDefined(cacheByID)) {
                        deferred.notify([cacheByID]);
                    }
                } else {
                    deferred.notify(cache);
                }
            } else {
                cache = [];
            }

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
                        var meta = sets[0]._meta.subject_sets;

                        angular.forEach(sets, function (s) {
                            upsert(subjectSets, {'id': s.id}, s);
                        });

                        if (meta.next_page) {
                            deferred.notify(subjectSets);
                            loadPages(angular.extend({}, options, {page: meta.next_page}));
                        } else {
                            angular.forEach(subjectSets, function (s) {
                                upsert(cache, {'id': s.id}, s);
                            });

                            // If an item in the cache, is not in the list returned by the server
                            // and we're not filtering (assuming we're loading all data here!)
                            if (!filter) {
                                angular.forEach(cache, function (c) {
                                    if (angular.isUndefined(_.find(subjectSets, {id: c.id}))) {
                                        _.remove(cache, c);
                                    }
                                });
                            }

                            cache = $filter('removeCircularDeps')(cache);
                            localStorageService.set('subject_sets', cache);

                            deferred.resolve(subjectSets);
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
