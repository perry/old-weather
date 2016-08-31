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
      $stateProvider.state('viewClassification', {
        url: '/classification/:classification_id',
        views: {
          main: {
            controller: 'classificationViewerController',
            templateUrl: 'templates/classification-viewer.html'
          }
        }
      });
  });

  module.directive('annotation', function () {
    return {
      restrict: 'A',
      templateUrl: 'templates/_annotation.html',
      link: function (scope, element, attrs) {

        scope.onMouseOver = function(e) {
          e.stopPropagation();
          scope.isHovered = true;
          scope.$apply();
        };

        scope.onMouseOut = function(e) {
          e.stopPropagation();
          scope.isHovered = false;
          scope.$apply();
        };

      }
    };
  });

  module.controller('classificationViewerController', function ($stateParams, $scope, $sce, $http, zooAPI) {

    $scope.classificationId = $stateParams.classification_id;
    $scope.image_src = $sce.trustAsResourceUrl('https://panoptes-uploads.zooniverse.org/production/subject_location/4556b6b4-d8e6-4c77-8e2a-083010644546.jpeg');
    $scope.data = null;
    $scope.error = '';

    zooAPI.type('classifications').get({id: $scope.classificationId})
      .then( function(response) {
        $scope.data = response[0].annotations;
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
