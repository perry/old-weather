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
              scope.currentGrid = null;
              scope.initialClick = null;

              element.bind('mousedown', function(e) {
                e.stopPropagation(); // without this, events propagate to entire SVG document
                scope.isClicked = true;
                scope.initialClick = gridFactory.createPoint(e);
              });

              element.bind('mouseup', function(e) {
                e.stopPropagation();
                scope.isClicked = false;
                scope.isDragging = false;
                scope.initialClick = null; // reset initial click
                gridFactory.updateGrid(scope.currentGrid);
              });


              element.bind('mouseout', function(e) {
                e.stopPropagation();
                scope.isClicked = false;
                scope.isDragging = false;
                scope.initialClick = null; // reset initial click
              });


              element.bind('mousemove', function(e) {
                e.stopPropagation();
                if(scope.isClicked) {
                  scope.isDragging = true;
                  scope.currentGrid = gridFactory.get();
                  scope.$apply( gridFactory.moveGrid(scope.currentGrid, scope.initialClick, e ) );
                }
              });
            }
        };
    });

}(window.angular, window._));
