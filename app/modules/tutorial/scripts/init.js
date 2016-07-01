(function (angular) {
    'use strict';

    var module = angular.module('tutorial', []);





    module.controller('TutorialController', ['$scope', '$modal', function($scope, $modal) {

      $scope.launchTutorial = function() {
        console.log('LAUNCH TUTORIAL!');
        var modalInstance = $modal.open({
          templateUrl: 'templates/tutorial.html',
          // controller: 'ConfirmationModalController',
          size: 'lg'
        });
      }

    }]);









}(window.angular));
