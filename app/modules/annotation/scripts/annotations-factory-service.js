(function (angular) {
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

    module.factory('annotationsFactory', function ($rootScope, $q, localStorageService) {

        var annotationsPrefix = 'annotation_subject_id_';

        var storeData = function (data, subject) {
            var id = subject.id;
            var storageKey = annotationsPrefix + id;
            var arr = localStorageService.get(storageKey);
            if (!arr) {
                arr = [];
            }

            upsert(arr, {_id: data._id}, data);

            localStorageService.set(storageKey, arr);
        };

        var get = function (id) {
            var storageKey = annotationsPrefix + id;
            var deferred = $q.defer();

            var data = localStorageService.get(storageKey);
            deferred.resolve(data);

            return deferred.promise;
        };

        var add = function (data, subject) {
            $rootScope.$broadcast('annotations:add', data);
            storeData(data, subject);
        };

        var update = function (data, subject) {
            $rootScope.$broadcast('annotations:update', data);
            storeData(data, subject);
        };

        var obj = {
            get: get,
            add: add,
            update: update
        };

        return obj;
    });

}(window.angular));

