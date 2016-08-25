(function (angular) {
    'use strict';

    var module = angular.module('svg');

    module.directive('svgPanZoom', function ($timeout, svgPanZoomFactory, svgDrawingFactory, svgGridFactory) {
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
                svgGridFactory.init(scope.panZoom, el, $viewport);

                scope.togglePan = function () {
                    return svgPanZoomFactory.toggle();
                };

                scope.hasMouseEvents = function () {
                    return svgDrawingFactory.hasMouseEvents();
                };

                var longRotation = false;
                var longRotationTimeout;
                scope.rotation = 0;

                scope.rotate = function (degrees) {
                    scope.rotation = svgPanZoomFactory.rotate(degrees);
                };

                scope.startLongRotation = function (degrees) {
                    var increment = function (d) {
                        if (longRotation) {
                            scope.rotate(d);
                            $timeout(function () {
                                increment(d);
                            }, 10);
                        }
                    };

                    longRotationTimeout = $timeout(function () {
                        longRotation = true;
                        increment(degrees);
                    }, 300);
                };

                scope.stopLongRotation = function () {
                    $timeout.cancel(longRotationTimeout);
                    longRotation = false;
                };

                scope.reset = function () {
                    scope.panZoom.reset();
                    scope.rotate(0);
                };
            }
        };
    });
}(window.angular));
