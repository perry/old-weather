(function (angular) {
    'use strict';

    var module = angular.module('annotation');


    module.controller('confirmActionController', [ '$scope', '$modal',
      function($scope) {
        console.log('CONTROLLER(), scope = ', $scope);

        $scope.setConfirmation = function(value) {
          console.log('VALUE IS ', value);
          $scope.$close()
        }

        $scope.open = function (){
  
        }




      }
    ]);

}(window.angular));
