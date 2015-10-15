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
