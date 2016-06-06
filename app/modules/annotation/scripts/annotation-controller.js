(function (angular) {
    'use strict';

    var module = angular.module('annotation');

    module.controller('AnnotationController', function($window, $parse, $scope, $modal){

      $scope.confirmAction = function (callback) {
        var modalInstance = $modal.open({
          templateUrl: 'templates/confirmation-modal.html',
          controller: 'AnnotationController',
          size: 'sm'
        });

        modalInstance.result.then(function (isConfirmed) {
          callback(isConfirmed);
        });
      }

      $scope.confirm = function() {
        $scope.$close(true);
      }

      $scope.cancel = function() {
        $scope.$close(false);
      }

    });

}(window.angular));
