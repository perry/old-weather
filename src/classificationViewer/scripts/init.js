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
      .state('classifications', {
          url: '/classifications?page',
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
        };

        scope.onMouseOut = function(e) {
          e.stopPropagation();
          scope.isHovered = false;
        };

      }
    };
  });

  module.controller('classificationViewerController', function($stateParams, $scope, $sce, zooAPI, localStorageService) {

    // get current user (if any)
    if (!localStorageService.get('user')) {
      $scope.statusMessage = 'You must be signed in!';
      return;
    }

    $scope.currentClassification = null;
    $scope.completedClassifications = [];

    var params = {
      project_id: localStorageService.get('project').id,
    };

    if($stateParams.page) {
      params.page = $stateParams.page;
    }

    zooAPI.type('classifications').get(params)
      .then( function(response) {
        $scope.meta = response[0]._meta;
        $scope.page = $scope.meta.classifications.page;
        $scope.pageCount = $scope.meta.classifications.page_count;
        // $scope.statusMessage = 'Showing page ' + $scope.page + ' of ' + $scope.pageCount;
        $scope.completedClassifications = response;
        $scope.$apply();
      })
      .catch( function(error) {
        $scope.statusMessage = 'There was an error loading classifications!';
      });

    // $scope.prevPage = function() {
    //   console.log('prevPage()');
    // };
    //
    // $scope.nextPage = function() {
    //   console.log('nextPage()');
    // };

    $scope.loadClassification = function(id) {    // get current user (if any)
      $scope.isLoading = true;
      $scope.currentClassificationId = id;

      if (!localStorageService.get('user')) {
        $scope.statusMessage = 'You must be signed in!';
        return;
      }

      zooAPI.type('classifications').get({id: id})
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
      }

  })

  // module.controller('classificationViewerController', function ($stateParams, $scope, $sce, $http, localStorageService, zooAPI) {
  //   $scope.isLoading = true;
  //   $scope.classificationId = $stateParams.classification_id;
  //   $scope.image_src = null;
  //   $scope.annotations = [];
  //   $scope.error = '';
  //
  //   // get current user (if any)
  //   if (!localStorageService.get('user')) {
  //     $scope.error = 'You must be signed in!';
  //     return;
  //   }
  //
  //   zooAPI.type('classifications').get({id: $scope.classificationId})
  //     .then( function(response) {
  //
  //       $scope.annotations = response[0].annotations;
  //
  //       // get subject id from resource
  //       zooAPI.type('subjects').get({id: response[0].links.subjects[0]})
  //         .then( function(response) {
  //           var keys = Object.keys(response[0].locations[0]);
  //           $scope.image_src = $sce.trustAsResourceUrl( response[0].locations[0][keys[0]] );
  //           $scope.isLoading = false;
  //           $scope.$apply();
  //         });
  //     })
  //     .catch( function(error) {
  //       $scope.error = error.toString();
  //       console.log('Error! Couldn\'t read data file: ', error);
  //     });
  //
  // });

}(window.angular, window._));
