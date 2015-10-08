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

            // self.$viewport.on('mousedown', startDraw);
            // self.$viewport.on('mouseup', finishDraw);

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
            bindMouseEvents: bindMouseEvents,
            unBindMouseEvents: unBindMouseEvents,
            hasMouseEvents: hasMouseEvents
        };
    });
}(window.angular, window._));
