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
              scope.newPoint = null;

              element.bind('mousedown', function(e) {
                e.stopPropagation();
                scope.isClicked = true;
              });

              element.bind('mouseup', function(e) {
                e.stopPropagation();
                scope.isClicked = false;
                scope.isDragging = false;

              });

              element.bind('mousemove', function(e) {
                e.stopPropagation();

                if(scope.isClicked) {
                  scope.isDragging = true;
                  // console.log('CURRENT GRID = ', gridFactory.get());
                  var currentGrid = gridFactory.get();
                  for(var annotation of currentGrid) {
                    // update annotation
                    console.log('UPDATE ANNOTATION'); // --STI
                  }

                }

              });

            }
        };
    });

}(window.angular, window._));
