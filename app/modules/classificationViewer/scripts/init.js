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

  module.directive('classification', function (svgPanZoomFactory, svgDrawingFactory, toolFactory) {
    return {
      restrict: 'A',
      // templateUrl: 'templates/transcribe/_tools.html',
      scope: true,
      link: function (scope, element, attrs) {
        element.bind('mouseover', function(e) {
          e.stopPropagation();
          scope.content = scope.$parent.annotation.content;
          console.log('CONTENT: ', scope.content);
          scope.isContentVisible = true;
          scope.cursor = {x: e.x, y: e.y}
          scope.$apply();
        });

        element.bind('mouseout', function(e) {
          scope.content = null; //scope.$parent.annotation.content;
          // console.log('CONTENT: ', scope.content);
          scope.isContentVisible = false;
          // scope.$apply();
        });
      }
    };
  });

  module.controller('classificationViewerController', function ($http, $rootScope, $timeout, $stateParams, $scope, $sce, $state, annotationsFactory, workflowFactory, subjectFactory, svgPanZoomFactory, gridFactory) {

    $scope.classification_id = $stateParams.classification_id;
    $scope.image_src = $sce.trustAsResourceUrl('https://panoptes-uploads.zooniverse.org/production/subject_location/4556b6b4-d8e6-4c77-8e2a-083010644546.jpeg');
    $scope.data = null;

    $http.get('sample_data.json')
      .then( function(response) {
        $scope.data = response.data;
        console.log('RESPONSE: ', $scope.data);
      })
      .catch( function(reason) {
        console.log('Error! Couldn\'t read data file: ', reason);
      });

  });

}(window.angular, window._));
