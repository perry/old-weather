(function (angular) {
    'use strict';

    var module = angular.module('zooniverse');

    module.directive('zooniverseProjectsList', function (ZooniverseProjectsFactory) {
        return {
            restrict: 'A',
            scope: true,
            link: function (scope, element, attrs) {
                scope.loading = true;

                ZooniverseProjectsFactory.get()
                    .then(function (response) {
                        scope.data = response.data;
                    })
                    ['finally'](function () {
                        scope.loading = false;
                    });
            }
        };
    });

}(window.angular));


