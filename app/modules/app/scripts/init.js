(function (angular) {
    'use strict';

    var module = angular.module('app', [
        'ui.router',
        'ui.bootstrap',
        '404',
        'content',
        'ships',
        'transcribe',
        'transcription',
        'zooniverse',
        'auth'
    ]);

    module.config([
        '$stateProvider',
        function ($stateProvider) {
            $stateProvider
                .state('home', {
                    url: '/',
                    views: {
                        main: {
                            controller: 'HomeController',
                            templateUrl: 'templates/app/home.html'
                        }
                    }
                });
        }
    ]);

}(window.angular));
