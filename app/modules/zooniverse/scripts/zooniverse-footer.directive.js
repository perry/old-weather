(function (angular) {
    'use strict';

    var module = angular.module('zooniverse');

    module.directive('zooniverseFooter', function (ZooniverseFooterFactory) {
        return {
            restrict: 'A',
            scope: true,
            link: function (scope, element, attrs) {
                scope.loading = true;

                ZooniverseFooterFactory.load()
                    .then(function () {
                        scope.data = ZooniverseFooterFactory.get();
                    })
                    ['finally'](function () {
                        scope.loading = false;
                    });
            }
        };
    });

}(window.angular));


