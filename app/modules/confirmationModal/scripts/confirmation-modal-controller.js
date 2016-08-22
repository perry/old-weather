(function (angular) {
    'use strict';

    var module = angular.module('confirmationModal');

    module.controller('ConfirmationModalController', function(confirmationModalFactory, $scope){

      $scope.params = confirmationModalFactory.getParams();

      $scope.deleteAnnotation = function() {
        $scope.$close('annotation');
      }

      $scope.deleteRow = function() {
        $scope.$close('row');
      }

      $scope.confirm = function() {
        $scope.$close(true);
      }

      $scope.cancel = function() {
        $scope.$close(false);
      }

    });

}(window.angular));
