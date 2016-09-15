(function (angular) {
    'use strict';

    var module = angular.module('navTool', []);

    module.controller('NavToolController', function($scope, $state, svgPanZoomFactory) {
      $scope.state = $state;

      // set initial position
      $scope.xPos = 400;
      $scope.yPos = 400;

      $scope.updatePosition = function(x,y) {
        $scope.xPos = x;
        $scope.yPos = y;
      }

      $scope.style = function() {
        return {
          left: $scope.xPos + 'px',
          top: $scope.yPos + 'px'
        };
      }

    });

    module.directive('navTool', function ($document, svgPanZoomFactory) {
      return {
        restrict: 'E',
        templateUrl: 'templates/nav-tool.html',
        controller: 'NavToolController',
        link: function (scope, element, attrs) {

          var startX = 0, startY = 0, x = scope.xPos, y = scope.yPos;

          scope.onMouseDown = function(event) {
            event.preventDefault();
            startX = event.pageX - x;
            startY = event.pageY - y;
            $document.on('mousemove', mousemove);
            $document.on('mouseup', mouseup);
          };

         function mousemove(event) {
           y = event.pageY - startY;
           x = event.pageX - startX;
           scope.updatePosition(x,y);
           element.children(0).css({
             top: y + 'px',
             left: x + 'px'
           });
         }

         function mouseup() {
           $document.off('mousemove', mousemove);
           $document.off('mouseup', mouseup);
         }

        }
      };
    });
}(window.angular));
