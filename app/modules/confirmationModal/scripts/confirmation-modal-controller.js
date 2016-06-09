(function (angular) {
    'use strict';

    var module = angular.module('confirmationModal');

    module.controller('ConfirmationModalController', function(confirmationModalFactory, $scope){

      $scope.msg = confirmationModalFactory.getMessage();

      $scope.confirm = function() {
        $scope.$close(true);
      }

      $scope.cancel = function() {
        $scope.$close(false);
      }

    });

}(window.angular));
