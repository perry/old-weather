(function (angular) {
    'use strict';

    var module = angular.module('confirmationModal');

    module.service('confirmationModalFactory', function(){
      // $scope.msg = 'Loading message...'

      this.deployModal = function() {
        console.log('confirmationModalFactory.deployModal()');
      }

      return this; //{deployModal: deployModal};

    //   $scope.confirmAction = function(msg, callback) {
    //     console.log('ConfirmationModalController::confirmAction()');
    //     // $scope.msg = msg;
    //     // // $scope.$apply();
    //     //
    //     // console.log('confirmAction(), msg = ', msg);
    //     // console.log('$SCOPE IS ', $scope);
    //     //
    //     // var modalInstance = $modal.open({
    //     //   templateUrl: 'templates/confirmation-modal.html',
    //     //   controller: 'AnnotationController',
    //     //   size: 'sm'
    //     // });
    //     //
    //     // modalInstance.result.then(function(isConfirmed) {
    //     //   callback(isConfirmed);
    //     // });
    //   }
    //
    //   $scope.confirm = function() {
    //     console.log('ConfirmationModalController::confirm()');
    //     $scope.$close(true);
    //   }
    //
    //   $scope.cancel = function() {
    //     console.log('ConfirmationModalController::cancel()');
    //     $scope.$close(false);
    //   }
    //
    });

  module.controller('ConfirmationModalController', function(confirmationModalFactory, $scope){
    $scope.confirmAction = function() {
      console.log('ConfirmationModalController.confirmAction()');
    }

  });

}(window.angular));
