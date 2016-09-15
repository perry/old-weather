(function (angular, _, svgPanZoom) {
    'use strict';

    var module = angular.module('svg');

    module.factory('svgPanZoomFactory', function ($rootScope) {
        var self = this;

        return {
            init: function (el, opts) {
                opts = opts || {};
                self.el = el;
                self.opts = opts;
                self.svgInstance = svgPanZoom(self.el, self.opts);
                self.rotation = 0;

                // center subject image on viewable area
                var svgWidth = self.svgInstance.getSizes().width - 300; // subtract right column width
                var zoomFactor = self.svgInstance.getSizes().realZoom;
                var subjectWidth = self.svgInstance.getSizes().viewBox.width * zoomFactor;
                self.svgInstance.pan({x: svgWidth/2 - subjectWidth/2, y:0});

                return self.svgInstance;
            },
            getSVGInstance: function () {
              return self.svgInstance;
            },
            viewport: function () {
                return self.el.querySelectorAll('.svg-pan-zoom_viewport')[0];
            },
            rotateContainer: function () {
                return self.el.querySelectorAll('.rotate-container')[0];
            },
            status: function () {
                return self.svgInstance.isZoomEnabled() || self.svgInstance.isPanEnabled();
            },
            enable: function () {
                self.svgInstance.enablePan();
                self.svgInstance.enableZoom();

                $rootScope.$broadcast('annotate:svgPanZoomToggle');
            },
            disable: function () {
                self.svgInstance.disablePan();
                self.svgInstance.disableZoom();

                $rootScope.$broadcast('annotate:svgPanZoomToggle');
            },
            toggle: function () {
                var method = self.svgInstance.isZoomEnabled() || self.svgInstance.isPanEnabled() ? 'disable' : 'enable';

                self.svgInstance[method + 'Pan']();
                self.svgInstance[method + 'Zoom']();

                $rootScope.$broadcast('annotate:svgPanZoomToggle');

                return method;
            },
            getRotation: function () {
                return self.rotation;
            },
            rotate: function (degrees) {
                if (_.isString(degrees)) {
                    var operand = degrees.charAt(0);
                    var value = parseFloat(degrees.substring(1));
                    if (operand === '+') {
                        self.rotation += value;
                    } else if (operand === '-') {
                        self.rotation -= value;
                    }
                } else if (_.isNumber(degrees)) {
                    self.rotation = degrees;
                }

                return self.rotation;
            },
            zoomToRect: function (rect) {
                self.svgInstance.resize();
                var sizes = self.svgInstance.getSizes();
                var realZoom = sizes.realZoom;

                var rectCoords = {
                    x: -((rect.x + (rect.width/2))*realZoom)+(sizes.width/2),
                    y: -((rect.y + (rect.height/2))*realZoom)+(sizes.height/2)
                };
                self.svgInstance.pan(rectCoords);

                var padding = 50;
                var zoomRatios = {
                    width: Math.abs(sizes.width / (rect.width + padding)),
                    height: Math.abs(sizes.height / (rect.height + padding))
                };
                var zoomLevel = Math.min(zoomRatios.width, zoomRatios.height);
                self.svgInstance.zoom(zoomLevel);

                return {sizes: self.svgInstance.getSizes()};
            }
        };
    });
}(window.angular, window._, window.svgPanZoom));
