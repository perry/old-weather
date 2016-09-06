(function (angular, _) {
  'use strict';

  var module = angular.module('classificationViewer', [
    'ui.router',
    'angularSpinner',
    'svg',
    'tutorial'
  ]);

  module.config(function ($stateProvider) {
      $stateProvider
        .state('classificationViewer', {
          url: '/classifications/:classification_id',
          views: {
            main: {
              controller: 'classificationViewerController',
              templateUrl: 'templates/classification-viewer.html'
            }
          }
        })
        .state('classificationList', {
            url: '/classifications',
            views: {
              main: {
                controller: 'classificationListController',
                templateUrl: 'templates/_classification-list.html'
              }
            }
        });
  });

  module.directive('annotationReview', function () {
    return {
      restrict: 'A',
      templateUrl: 'templates/_annotation.html',
      link: function (scope, element, attrs) {

        scope.onMouseOver = function(e) {
          e.stopPropagation();
          scope.isHovered = true;
        };

        scope.onMouseOut = function(e) {
          e.stopPropagation();
          scope.isHovered = false;
        };

      }
    };
  });

  module.controller('classificationListController', function($scope, zooAPI) {
    $scope.completedClassifications = [];

    zooAPI.type('classifications').get().then( function(response) {
      console.log('CLASSIFICATIONS: ', response);
      $scope.completedClassifications = response;
      $scope.$apply();
    });

  })

  module.controller('classificationViewerController', function ($stateParams, $scope, $sce, $http, localStorageService, zooAPI) {
    $scope.isLoading = true;
    $scope.classificationId = $stateParams.classification_id;
    $scope.image_src = null;
    $scope.annotations = [];
    $scope.error = '';

    // get current user (if any)
    if (!localStorageService.get('user')) {
      $scope.error = 'You must be signed in!';
      return;
    }

    zooAPI.type('classifications').get({id: $scope.classificationId})
      .then( function(response) {
        $scope.annotations = response[0].annotations;

        // get subject id from resource
        zooAPI.type('subjects').get({id: response[0].links.subjects[0]})
          .then( function(response) {
            var keys = Object.keys(response[0].locations[0]);
            $scope.image_src = $sce.trustAsResourceUrl( response[0].locations[0][keys[0]] );
            $scope.isLoading = false;
            $scope.$apply();
          });
      })
      .catch( function(error) {
        $scope.error = error.toString();
        console.log('Error! Couldn\'t read data file: ', error);
      });

  });

}(window.angular, window._));
