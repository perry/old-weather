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
        display_name: 'oldweather'
    });

    module.factory('zooAPI', function ($window) {
        return $window.zooAPI;
    });

    module.factory('zooAPIProject', function ($q, localStorageService, zooAPIConfig, zooAPI) {
        var get = function () {
            var deferred = $q.defer();

            var cache = localStorageService.get('project');
            if (cache) {
                deferred.resolve(cache);
            }

            zooAPI.type('projects').get({display_name: zooAPIConfig.display_name})
                .then(function (response) {
                    localStorageService.set('project', response[0]);
                    deferred.resolve(localStorageService.get('project'));
                });

            return deferred.promise;
        };

        return {
            get: get
        };
    });

    module.factory('zooAPISubjectSets', function ($q, localStorageService, zooAPI, zooAPIProject) {
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
                    var options = {project_id: response.id};
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
