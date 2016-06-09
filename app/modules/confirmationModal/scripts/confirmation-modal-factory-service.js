(function (angular) {
    'use strict';

    var module = angular.module('confirmationModal');

    module.factory('confirmationModalFactory', [ '$modal', '$controller', function($modal,$controller){

      var message = 'Are you sure?'; // set default message

      var setMessage = function(msg) {
        message = msg;
      }

      var getMessage = function() {
        return message;
      }

      var deployModal = function(msg, callback) {
        setMessage(msg);

        var modalInstance = $modal.open({
          templateUrl: 'templates/confirmation-modal.html',
          controller: 'ConfirmationModalController',
          size: 'sm'
        });

        modalInstance.result.then(function(isConfirmed) {
          callback(isConfirmed);
        });
      }

      return {
        deployModal: deployModal,
        message: message,
        setMessage: setMessage,
        getMessage: getMessage
      };

    }]);

}(window.angular));
