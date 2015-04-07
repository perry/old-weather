(function (angular) {
    'use strict';

    var module = angular.module('zooAPI');

    module.constant('API_ROOT', 'https://panoptes-staging.zooniverse.org/api');

    module.factory('zooAPIRoot', function ($q) {
        // TODO: the API_ROOT endpoint currently returns a 404, we should perform
        //       a GET on the API_ROOT rather than returning this list.
        var get = function () {
            var deferred = $q.defer();

            deferred.resolve({
                'links': {
                    'subjects': '/subjects',
                    'users': '/users',
                    'projects': '/projects',
                    'workflows': '/workflows',
                    'subject_sets': '/subject_sets',
                    'groups': '/groups',
                    'classifications': '/classifications',
                    'memberships': '/memberships',
                    'collections': '/collections',
                    'subject_queues': '/subject_queues',
                    'project_roles': '/project_roles',
                    'project_preferences': '/project_preferences',
                    'workflow_contents': '/workflow_contents',
                    'project_contents': '/project_contents'
                }
            });

            return deferred.promise;
        };

        return {
            get: get
        };
    });

    module.factory('zooAPIProject', function ($q, $http, zooAPIRoot, API_ROOT) {
        var get = function () {
            var deferred = $q.defer();

            zooAPIRoot.get().then(function (response) {
                $http.get(API_ROOT + response.links.projects + '/195')
                    .then(deferred.resolve, deferred.reject);
            });

            return deferred.promise;
        };

        return {
            get: get
        };
    });

    module.factory('zooAPISubjectSets', function ($q, $http, zooAPIRoot, zooAPIProject, API_ROOT) {
        var get = function (id) {
            var deferred = $q.defer();
            var href;
            var APIPromise;

            if (angular.isUndefined(id)) {
                APIPromise = zooAPIProject.get();
                APIPromise.then(function (response) {
                    href = response.data.links['projects.subject_sets'].href;
                    href = href.replace('{projects.id}', '195');
                });
            } else {
                APIPromise = zooAPIRoot.get();
                APIPromise.then(function (response) {
                    href = response.links.subject_sets + '/' + id;
                });
            }


            APIPromise.then(function () {
                $http.get(API_ROOT + href)
                    .then(deferred.resolve, deferred.reject);
            });

            return deferred.promise;
        };

        return {
            get: get
        };
    });

}(window.angular));
