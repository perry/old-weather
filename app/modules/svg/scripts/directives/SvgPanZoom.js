(function (angular) {
    'use strict';

    var module = angular.module('svg');

    module.directive('svgPanZoom', function (svgPanZoomFactory, svgDrawingFactory) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var el = element[0];

                scope.panZoom = svgPanZoomFactory.init(el, {
                    minZoom: 1,
                    maxZoom: 3,
                    mouseWheelZoomEnabled: false
                });

                var viewport = svgPanZoomFactory.viewport();
                var $viewport = angular.element(viewport);

                svgDrawingFactory.init(scope, scope.panZoom, el, $viewport);
            }
        };
    });
}(window.angular));
