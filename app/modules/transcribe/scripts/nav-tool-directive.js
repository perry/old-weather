(function (angular) {
    'use strict';

    var module = angular.module('transcribe');

    module.directive('navTool', function ($document) {
      return {
        restrict: 'E',
        templateUrl: 'templates/transcribe/nav-tool.html',
        link: function (scope, element, attrs) {

          var startX = 0, startY = 100, x = 20, y = 100;

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
