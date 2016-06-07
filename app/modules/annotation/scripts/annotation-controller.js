(function (angular) {
    'use strict';

    var module = angular.module('annotation');

    module.controller('AnnotationController', function($scope, $modal){
      // $scope.msg = 'Loading message...'

      $scope.confirmAction = function(msg, callback) {

        $scope.msg = msg;
        // $scope.$apply();

        console.log('confirmAction(), msg = ', msg);
        console.log('$SCOPE IS ', $scope);

        var modalInstance = $modal.open({
          templateUrl: 'templates/confirmation-modal.html',
          controller: 'AnnotationController',
          size: 'sm'
        });

        modalInstance.result.then(function(isConfirmed) {
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
