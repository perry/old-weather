(function (angular, _) {
  'use strict';

  var module = angular.module('classificationViewer', [
    'ui.router',
    'angularSpinner',
    'svg',
    'annotation',
    'tutorial'
  ]);

  module.config(function ($stateProvider) {
      $stateProvider
        .state('classificationViewer', {
          url: '/classification/:classification_id',
          views: {
            main: {
              controller: 'classificationViewerController',
              templateUrl: 'templates/classification-viewer.html'
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
          // scope.$apply();
        };

        scope.onMouseOut = function(e) {
          e.stopPropagation();
          scope.isHovered = false;
          // scope.$apply();
        };

      }
    };
  });

  module.controller('classificationViewerController', function ($stateParams, $scope, $sce, $http, localStorageService, zooAPI) {

    $scope.isLoading = true;
    $scope.classificationId = $stateParams.classification_id;
    $scope.image_src = null;
    $scope.data = null;
    $scope.error = '';

    // get current user (if any)
    if (!localStorageService.get('user')) {
      $scope.error = 'You must be signed in!';
      return;
    }

    zooAPI.type('classifications').get({id: $scope.classificationId})
      .then( function(response) {
        $scope.data = response[0].annotations;

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


    /* USE SAMPLE DATA INSTEAD */

    // $http.get('sample_data.json')
    //   .then( function(response) {
    //     $scope.data = response.data;
    //   })
    //   .catch( function(reason) {
    //     console.log('Error! Couldn\'t read data file: ', reason);
    //   });

  });

}(window.angular, window._));
