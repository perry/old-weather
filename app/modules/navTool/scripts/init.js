(function (angular) {
    'use strict';

    var module = angular.module('navTool', []);

    module.directive('navTool', function ($state, $document, $window, svgPanZoomFactory) {
      return {
        restrict: 'E',
        templateUrl: 'templates/nav-tool.html',
        link: function (scope, element, attrs) {

          scope.state = $state;

          var svgWid = element.parent()[0].clientWidth;
          var svgHei = element.parent()[0].clientHeight;

          // set initial position
          scope.xPos = parseInt(svgWid-500);
          scope.yPos = parseInt(svgHei-400);

          // // TO DO: this part needs work
          // angular.element($window).bind('resize', function(event) {
          //
          //   console.log('RESISE ', event);
          //   // get updated dimensions
          //   svgWid = element.parent()[0].clientWidth;
          //   svgHei = element.parent()[0].clientHeight;
          //
          //   console.log('WID HEI = ', svgWid, svgHei);
          //
          //   // this last part is incorrect --STI
          //   startX = x;
          //   startY = y;
          //   // moveElement(svgWid-x,y);
          //   moveElement(x,y); // basically do nothing
          //
          // });

          var startX = 0, startY = 0, x = scope.xPos, y = scope.yPos;

          function mousemove(event) {
            y = event.pageY - startY;
            x = event.pageX - startX;
            moveElement(x,y);
          }

          function moveElement(x,y) {
            // console.log('moveElement(), ', x, y);
            scope.xPos = x;
            scope.yPos = y;
            element.children(0).css({
              top: y + 'px',
              left: x + 'px'
            });
          };

          function mouseup() {
            $document.off('mousemove', mousemove);
            $document.off('mouseup', mouseup);
          }

          scope.style = function() {
            console.log('x, y = ', scope.xPos, scope.yPos);
            return {
              left: scope.xPos + 'px',
              top: scope.yPos + 'px'
            };
          }

          scope.onMouseDown = function(event) {
            event.preventDefault();
            startX = event.pageX - x;
            startY = event.pageY - y;
            $document.on('mousemove', mousemove);
            $document.on('mouseup', mouseup);
          };

        }
      };
    });

}(window.angular));
