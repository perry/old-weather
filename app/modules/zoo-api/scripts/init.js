(function (angular) {
    'use strict';

    var module = angular.module('zooAPI', []);

    module.run(function ($http) {
        var getHeaders = {
            'Accept': 'application/vnd.api+json; version=1',
            'Content-Type': 'application/json'
        };

        $http.defaults.headers.get = getHeaders;
    });

}(window.angular));

