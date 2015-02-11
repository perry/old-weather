(function () {
    'use strict';

    var module = angular.module('content', [
        'ui.router'
    ]);

    module.config([
        '$stateProvider',
        '$urlRouterProvider',
        function ($stateProvider, $urlRouterProvider) {
            $stateProvider
                .state('about', {
                    url: '/about',
                    abstract: true,
                    views: {
                        main: {
                            template: '<ui-view/>'
                        }
                    }
                })
                .state('about.partners', {
                    url: '/partners',
                    templateUrl: 'templates/content/partners.html'
                })
                .state('about.team', {
                    url: '/team',
                    templateUrl: 'templates/content/team.html'
                })
                .state('about.why', {
                    url: '/why',
                    templateUrl: 'templates/content/why.html'
                })
                .state('about.faq', {
                    url: '/faq',
                    templateUrl: 'templates/content/faq.html'
                })
        }
    ]);

}());

