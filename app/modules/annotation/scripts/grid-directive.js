(function (angular, _) {
    'use strict';

    var module = angular.module('annotation');

    module.directive('grid', function (annotationsFactory, gridFactory) {
        return {
            replace: true,
            restrict: 'A',
            templateUrl: 'templates/annotation/grid.html',
            link: function(scope, element, attrs) {

              scope.isClicked = false;
              scope.isDragging = false;

              var initialClick = null;

              element.bind('mousedown', function(e) {
                e.stopPropagation();
                scope.isClicked = true;
                initialClick = gridFactory.createPoint(e);
              });

              element.bind('mouseup', function(e) {
                e.stopPropagation();
                scope.isClicked = false;
                scope.isDragging = false;
                initialClick = null; // reset initial click

              });

              element.bind('mousemove', function(e) {
                e.stopPropagation();
                if(scope.isClicked) {
                  scope.isDragging = true;
                  var currentGrid = gridFactory.get();
                  scope.$apply( gridFactory.moveGrid(currentGrid, initialClick, e ) );
                }
              });
            }
        };
    });

}(window.angular, window._));
