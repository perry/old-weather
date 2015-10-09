(function (angular, _) {
    'use strict';

    var module = angular.module('annotation');

    module.directive('grid', function (annotationsFactory) {
        return {
            restrict: 'A',
            templateUrl: 'templates/annotation/grid.html'
        }
    });

}(window.angular, window._));
