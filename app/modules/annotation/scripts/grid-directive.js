(function (angular, _) {
    'use strict';

    var module = angular.module('annotation');

    module.directive('grid', function (annotationsFactory, gridFactory, $document) {
        return {
            replace: true,
            restrict: 'A',
            templateUrl: 'templates/annotation/grid.html',
            link: function(scope, element, attrs) {

              scope.isClicked = false;
              scope.isDragging = false;
              scope.currentGrid = null;
              scope.initialClick = null;

              /* Begin event handlers */

              scope.onMouseDown = function(e) {
                  e.preventDefault();
                  e.stopPropagation(); // without this, events propagate to entire SVG document

                  scope.isClicked = true;
                  scope.initialClick = gridFactory.createPoint(e);

                  // bind mouse events to document (otherwise dragging stops if cursor moves off grid)
                  $document.on('mousemove', scope.onMouseMove);
                  $document.on('mouseup', scope.onMouseUp);
              };

              scope.onMouseUp = function(e) {
                e.preventDefault();
                e.stopPropagation();

                scope.isClicked = false;
                scope.isDragging = false;
                scope.initialClick = null; // reset initial click

                gridFactory.updateGrid(scope.currentGrid);

                // unbind mouse events
                $document.off('mousemove', scope.onMouseMove);
                $document.off('mouseup', scope.onMouseUp);
              };

              scope.onMouseMove = function(e) {
                e.preventDefault();
                e.stopPropagation();

                if(scope.isClicked) {
                  scope.isDragging = true;
                  scope.currentGrid = gridFactory.get();
                  gridFactory.moveGrid(scope.currentGrid, scope.initialClick, e );
                }
              };
            }
        };
    });

}(window.angular, window._));
