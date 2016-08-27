(function (angular, _) {
    'use strict';

    var module = angular.module('svg');

    module.factory('svgGridFactory', function ($rootScope, svgPanZoomFactory, svgService) {

        var self = this;
        self.data = null;
        self.eventsBound = false;

        var init = function (svg, el, $viewport) {
            self.svg = svg;
            self.el = el;
            self.$viewport = $viewport;
        };

        var bindMouseEvents = function (data) {
            if (angular.isDefined(data)) {
                self.data = data;
            } else {
                self.data = null;
            }

            self.$viewport.on('mousedown', startDraw);
            self.$viewport.on('mouseup', finishDraw);
            self.eventsBound = true;
        };

        var unBindMouseEvents = function () {
            self.data = null;
            self.$viewport.off('mousedown');
            self.$viewport.off('mouseup');
            self.eventsBound = false;
        };

        var createPoint = function (e) {
          // console.log('svgGridFactory::createPoint(), e = ', e); // --STI
          var newPoint = svgService.createPoint(self.el, self.$viewport, e);
          return newPoint;
        }

        var startDraw = function(e) {
          console.log('svgGridFactory::startDraw()'); // --STI

          // Only start drawing if panZoom is disabled, and it's a primary mouse click
          if (!svgPanZoomFactory.status() && e.which === 1) {

          }


        };

        var finishDraw = function(e) {
          console.log('svgGridFactory::finishDraw()'); // --STI
        };

        var hasMouseEvents = function () {
            return self.eventsBound;
        };

        return {
            init: init,
            bindMouseEvents: bindMouseEvents,
            unBindMouseEvents: unBindMouseEvents,
            hasMouseEvents: hasMouseEvents,
            createPoint: createPoint
        };
    });
}(window.angular, window._));
