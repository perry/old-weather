(function (angular) {
    'use strict';

    var module = angular.module('svg');

    module.directive('svgPanZoom', function (svgPanZoomFactory, svgDrawingFactory) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var el = element[0];

                var opts = {
                    mouseWheelZoomEnabled: false
                };
                var attrOpts = scope.$eval(attrs.svgPanZoom);
                if (angular.isObject(attrOpts)) {
                    angular.extend(opts, attrOpts);
                }

                scope.panZoom = svgPanZoomFactory.init(el, opts);

                var viewport = svgPanZoomFactory.viewport();
                var $viewport = angular.element(viewport);

                svgDrawingFactory.init(scope.panZoom, el, $viewport);

                scope.togglePan = function () {
                    return svgPanZoomFactory.toggle();
                };

                scope.hasMouseEvents = function () {
                    return svgDrawingFactory.hasMouseEvents();
                };
            }
        };
    });
}(window.angular));
