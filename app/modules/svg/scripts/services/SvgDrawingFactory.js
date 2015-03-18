(function (angular) {
    'use strict';

    var module = angular.module('svg');

    module.factory('svgDrawingFactory', function (svgService, $rootScope) {
        var self = this;

        self.tempRect = null;
        self.tempOrigin = null;
        self.drawing = false;
        self.drawPromise = undefined;
        self.data = null;

        var init = function (svg, el, $viewport) {
            self.svg = svg;
            self.el = el;
            self.$viewport = $viewport;
        };

        var bindMouseEvents = function (data) {
            if (angular.isDefined(data)) {
                self.data = data;
            }

            self.$viewport.on('mousedown', startDraw);
            self.$viewport.on('mouseup', finishDraw);
        };

        var unBindMouseEvents = function () {
            self.data = null;

            self.$viewport.off('mousedown');
            self.$viewport.off('mouseup');
        };

        var startDraw = function (event) {
            event.stopImmediatePropagation();

            if (self.drawing) {
                draw(event);
                finishDraw(event);
            } else {
                self.tempOrigin = svgService.getPoint(self.el, self.$viewport, event);
                self.drawing = true;
                self.tempRect = angular.extend({}, self.tempOrigin, {
                    width: 0,
                    height: 0,
                    _id: _.uniqueId()
                }, self.data);
                $rootScope.$broadcast('svgDrawing:add', self.tempRect);
                self.$viewport.on('mousemove', draw);
            }
        };

        var draw = function (event) {
            var newPoint = svgService.getPoint(self.el, self.$viewport, event);
            self.tempRect.x = (self.tempOrigin.x < newPoint.x) ? self.tempOrigin.x : newPoint.x;
            self.tempRect.y = (self.tempOrigin.y < newPoint.y) ? self.tempOrigin.y : newPoint.y;
            self.tempRect.width = Math.abs(newPoint.x - self.tempOrigin.x);
            self.tempRect.height = Math.abs(newPoint.y - self.tempOrigin.y);
            $rootScope.$broadcast('svgDrawing:update', self.tempRect);
        };

        var finishDraw = function (event) {
            var newPoint = svgService.getPoint(self.el, self.$viewport, event);
            if (self.tempOrigin && !(newPoint.x === self.tempOrigin.x && newPoint.y === self.tempOrigin.y)) {
                $rootScope.$broadcast('svgDrawing:update', angular.extend({}, self.tempRect));
                self.drawing = false;
                self.tempRect = null;
                self.tempOrigin = null;
                self.data = null;
            } else {
                // TODO: Add a marker here.
                return;
            }
            self.$viewport.off('mousemove');
        };

        return {
            init: init,
            startDraw: startDraw,
            draw: draw,
            finishDraw: finishDraw,
            bindMouseEvents: bindMouseEvents,
            unBindMouseEvents: unBindMouseEvents
        };
    });
}(window.angular));

