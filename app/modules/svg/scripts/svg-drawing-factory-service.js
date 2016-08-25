(function (angular, _) {
    'use strict';

    var module = angular.module('svg');

    module.factory('svgDrawingFactory', function ($rootScope, svgPanZoomFactory, svgService) {
        var self = this;

        self.tempRect = null;
        self.tempOrigin = null;
        self.drawing = false;
        self.drawPromise = undefined;
        self.data = null;
        self.eventsBound = false;

        var init = function (svg, el, $viewport) {
            self.svg = svg;
            self.el = el;
            self.$viewport = $viewport;
        };

        var draw = function (event) {
            var newPoint = svgService.createPoint(self.el, self.$viewport, event);
            self.tempRect.x = (self.tempOrigin.x < newPoint.x) ? self.tempOrigin.x : newPoint.x;
            self.tempRect.y = (self.tempOrigin.y < newPoint.y) ? self.tempOrigin.y : newPoint.y;
            self.tempRect.width = Math.abs(newPoint.x - self.tempOrigin.x);
            self.tempRect.height = Math.abs(newPoint.y - self.tempOrigin.y);
            $rootScope.$broadcast('svgDrawing:update', self.tempRect, self.data);
        };

        var startDraw = function (event) {
            // Only start drawing if panZoom is disabled, and it's a primary mouse click
            if (!svgPanZoomFactory.status() && event.which === 1) {
                event.preventDefault();

                if (self.drawing) { // already drawing...
                    draw(event);
                    // finishDraw(event); // not necessary?
                } else {
                    self.tempOrigin = svgService.createPoint(self.el, self.$viewport, event);
                    self.drawing = true;
                    self.tempRect = angular.extend({}, self.tempOrigin, {
                        width: 0,
                        height: 0,
                        timestamp: new Date().getTime(),
                        _id: _.uniqueId('antn_'), //+ new Date().getTime(), // use human-readable id for debugging --STI
                        rotation: svgPanZoomFactory.getRotation()
                    }, self.data);
                    $rootScope.$broadcast('svgDrawing:add', self.tempRect, self.data);
                    self.$viewport.on('mousemove', draw);
                }
            }
        };

        var finishDraw = function (event) {
            var newPoint = svgService.createPoint(self.el, self.$viewport, event);
            if (self.tempOrigin && !(newPoint.x === self.tempOrigin.x && newPoint.y === self.tempOrigin.y)) {
                $rootScope.$broadcast('svgDrawing:finish', angular.extend({}, self.tempRect), self.data);
                self.drawing = false;
                self.tempRect = null;
                self.tempOrigin = null;
            } else { // zero-dimension rect created
                // TODO: Add a marker here.
                return;
            }
            self.$viewport.off('mousemove');
        };

        var bindMouseEvents = function (data) {
            console.log('bindMouseEvents(), data = ', data); // --STI
            if (angular.isDefined(data)) {
                self.data = data;
            } else {
                console.log('NOTHING'); // --STI
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

        var hasMouseEvents = function () {
            return self.eventsBound;
        };

        return {
            init: init,
            startDraw: startDraw,
            draw: draw,
            finishDraw: finishDraw,
            bindMouseEvents: bindMouseEvents,
            unBindMouseEvents: unBindMouseEvents,
            hasMouseEvents: hasMouseEvents
        };
    });
}(window.angular, window._));
