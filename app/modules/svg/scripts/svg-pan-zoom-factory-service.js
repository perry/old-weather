(function (angular, svgPanZoom) {
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
                return self.svgInstance;
            },
            viewport: function () {
                return self.el.getElementsByClassName('svg-pan-zoom_viewport')[0];
            },
            status: function () {
                return self.svgInstance.isZoomEnabled() || self.svgInstance.isPanEnabled();
            },
            enable: function () {
                self.svgInstance.enablePan();
                self.svgInstance.enableZoom();

                $rootScope.$broadcast('transcribe:svgPanZoomToggle');
            },
            disable: function () {
                self.svgInstance.disablePan();
                self.svgInstance.disableZoom();

                $rootScope.$broadcast('transcribe:svgPanZoomToggle');
            },
            toggle: function () {
                var method = self.svgInstance.isZoomEnabled() || self.svgInstance.isPanEnabled() ? 'disable' : 'enable';

                self.svgInstance[method + 'Pan']();
                self.svgInstance[method + 'Zoom']();

                $rootScope.$broadcast('transcribe:svgPanZoomToggle');

                return method;
            },
            zoomToRect: function (rect) {
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
}(window.angular, window.svgPanZoom));
