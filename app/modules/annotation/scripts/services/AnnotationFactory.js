(function (angular) {
    'use strict';

    var module = angular.module('annotation');

    module.factory('annotationsFactory', function ($rootScope) {

        var add = function (data) {
            // TODO: save the annotation...
            $rootScope.$broadcast('annotations:add', data);
        };

        var update = function (data) {
            $rootScope.$broadcast('annotations:update', data);
        };

        var obj = {
            add: add,
            update: update
        };

        return obj;
    });

}(window.angular));

