(function (angular) {
    'use strict';

    var module = angular.module('confirmationModal');

    module.factory('confirmationModalFactory', [ '$modal', '$controller', function($modal,$controller){

      // set default parameters
      var params = {
        message: 'Are you sure?'
      };

      var setParams = function(data) {
        params = data;
      };

      var getParams = function() {
        return params;
      };

      var deployModal = function(callback) {

        var modalInstance = $modal.open({
          templateUrl: 'templates/confirmation-modal.html',
          controller: 'ConfirmationModalController'
        });

        modalInstance.result.then( function(isConfirmed) {
          callback(isConfirmed);
        });
      };

      return {
        deployModal: deployModal,
        setParams: setParams,
        getParams: getParams
      };

    }]);

}(window.angular));
