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
        app_id: isProd ?
          '2b10a14e8f11eefb130a275f01898c8406600834bff1063bb1b7938795acc8a3' : // production
          '0cee9a29027e78cc7f9df99a3d6b0d00aaf3bbfad014a4bb73bf29f30b46575f',  // staging
        url: isProd ?
          'https://panoptes.zooniverse.org/api' :
          'https://panoptes-staging.zooniverse.org/api'
    });

    module.factory('zooAPI', function ($window, zooAPIConfig) {
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
