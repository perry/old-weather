(function () {
    'use strict';

    var module = angular.module('404', [
        'ui.router'
    ]);

    module.config([
        '$stateProvider',
        '$urlRouterProvider',
        function ($stateProvider, $urlRouterProvider) {
            $urlRouterProvider.otherwise('/404');

            $stateProvider
                .state('404', {
                    url: '/404',
                    views: {
                        main: {
                            templateUrl: 'templates/404/404.html'
                        }
                    }
                })
        }
    ]);

}());
