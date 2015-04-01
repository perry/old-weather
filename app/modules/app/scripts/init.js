(function (angular) {
    'use strict';

    var module = angular.module('app', [
        'ui.router',
        'ui.bootstrap',
        '404',
        'content',
        'ships',
        'transcribe',
        'zooniverse'
    ]);

    module.config([
        '$stateProvider',
        function ($stateProvider) {
            $stateProvider
                .state('home', {
                    url: '/',
                    views: {
                        main: {
                            templateUrl: 'templates/app/home.html'
                        }
                    }
                });
        }
    ]);

}(window.angular));
