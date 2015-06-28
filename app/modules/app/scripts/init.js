(function (angular) {
    'use strict';

    var module = angular.module('app', [
        'ui.router',
        'ui.bootstrap',
        'fitVids',
        '404',
        'content',
        'ships',
        'transcribe',
        'transcription',
        'zooniverse',
        'auth'
    ]);

    module.config(
        function ($stateProvider, usSpinnerConfigProvider) {
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

            usSpinnerConfigProvider.setDefaults({color: '#fff'});
        }
    );

    module.run(function ($rootScope) {
        $rootScope.$on('$stateChangeStart', function () {
            $rootScope.bodyClass = null;
        });
    });

}(window.angular));
