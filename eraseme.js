
module.controller('annotateController', function ($rootScope, $timeout, $stateParams, $scope, $sce, $state, annotationsFactory, workflowFactory, subjectFactory, svgPanZoomFactory, gridFactory) {
$rootScope.bodyClass = 'annotate';

$scope.loadSubjects = function (cacheDirection) {
  $rootScope.$broadcast('annotate:loadingSubject');

  $scope.subject_set_id = $stateParams.subject_set_id;
  $scope.subject = undefined;
  $scope.isLoading = true;
  $scope.questions = null;
  $scope.questionsComplete = false;
  $scope.grid = gridFactory.get;

  workflowFactory.get($scope.subject_set_id)
    .then(function (response) {
      $scope.questions = response;
    });

  subjectFactory.get($scope.subject_set_id, cacheDirection)
    .then(function (response) {
      if (response !== null) {
        $timeout(function () {
          $scope.subject = response;
          var keys = Object.keys($scope.subject.locations[0]);
          var subjectImage = $scope.subject.locations[0][keys[0]];

          // TODO: change this. We're cache busting the image.onload event.
          // subjectImage += '?' + new Date().getTime();
          $scope.trustedSubjectImage = $sce.trustAsResourceUrl(subjectImage);
          $scope.loadHandler = $scope.subjectLoaded(); // is loadHandler still used? --STI

          $rootScope.$broadcast('annotate:loadedSubject');
        });
      } else {
        $scope.subject = null;
        $rootScope.$broadcast('annotate:loadedSubject');
      }

    });
};

$scope.loadSubject('initial');
