(function () {
    'use strict';

    var module = angular.module('app', [
        'ui.router',
        'ui.bootstrap',
        '404',
        'content'
    ]);

    module.config([
        '$locationProvider',
        '$stateProvider',
        function ($locationProvider, $stateProvider) {
            $locationProvider.html5Mode({enabled: true, requireBase: false});

            $stateProvider
                .state('home', {
                    url: '/',
                    views: {
                        main: {
                            templateUrl: 'templates/app/home.html'
                        }
                    }
                })
        }
    ]);

}());
