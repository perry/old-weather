(function (angular) {
    'use strict';

    var module = angular.module('navTool', []);

    module.directive('navTool', function ($state, $document, $window, svgPanZoomFactory) {
      return {
        restrict: 'E',
        templateUrl: 'templates/nav-tool.html',
        link: function (scope, element, attrs) {

          scope.state = $state;

          // set initial position
          var svgWid = element.parent()[0].clientWidth;
          var svgHei = element.parent()[0].clientHeight;
          scope.xPos = parseInt(svgWid/2-100);;
          scope.yPos = parseInt(svgHei/2-100);;

          angular.element($window).bind('resize', function() {
            console.log('RESIZE!');
            console.log('ELEMENT PARENT: ', element.parent()[0].clientWidth );

            scope.updatePosition(svgWid/2-100, svgHei/2-100);

          });

          scope.updatePosition = function(x,y) {
            scope.xPos = x;
            scope.yPos = y;
          }

          scope.style = function() {
            console.log('x, y = ', scope.xPos, scope.yPos);
            return {
              left: scope.xPos + 'px',
              top: scope.yPos + 'px'
            };
          }

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
            scope.moveElement(x,y);
          }

          scope.moveElement = function(x,y) {
            console.log('moveElement()');
            scope.updatePosition(x,y);
            element.children(0).css({
              top: y + 'px',
              left: x + 'px'
            });
          };

          function mouseup() {
            $document.off('mousemove', mousemove);
            $document.off('mouseup', mouseup);
          }

        }
      };
    });

}(window.angular));
