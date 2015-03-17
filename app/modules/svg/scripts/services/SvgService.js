(function (angular) {
    'use strict';

    var module = angular.module('svg');

    module.service('svgService', function () {
        this.getPoint = function (el, $viewport, event) {
            var point = el.createSVGPoint();
            point.x = event.clientX;
            point.y = event.clientY;
            return point.matrixTransform($viewport[0].getScreenCTM().inverse());
        };
    });
}(window.angular));


