(function (angular) {
    'use strict';

    var module = angular.module('zooniverse');

    module.factory('ZooniverseProjectsFactory', function ($http) {
        var get = function () {
            return $http({
                method: 'GET',
                url: 'http://zooniverse-demo.s3-website-us-east-1.amazonaws.com/projects.json'
            });
        };

        return {
            get: get
        };
    });

}(window.angular));
