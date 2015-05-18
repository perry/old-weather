(function (angular, _) {
    'use strict';

    var module = angular.module('transcription', [
        'ui.router',
        'ngLoad',
        'angularSpinner'
    ]);

    module.config(function ($stateProvider) {
        $stateProvider
            .state('transcription', {
                url: '/transcription/:subject_set_id/',
                views: {
                    main: {
                        controller: 'transcriptionCtrl',
                        templateUrl: 'templates/transcription/transcription.html'
                    }
                }
            });
    });

    module.controller('transcriptionCtrl', function ($timeout, $scope, $sce, $stateParams, localStorageService, svgPanZoomFactory) {
        var subject_set_id = $stateParams.subject_set_id;

        // Load annotations for the subject set id.
        $scope.annotations = localStorageService.get('annotation_subject_id_' + subject_set_id);

        // TODO: get subject image...
        $scope.subjectImage = $sce.trustAsResourceUrl('http://oldweather.s3.amazonaws.com/ow3/final/USRC%20Bear/vol097/vol097_159_0.jpg');

        $scope.prevAnnotation = function () {
            $scope.save();
            $scope.annotations.unshift($scope.annotations.pop())
        }

        $scope.nextAnnotation = function () {
            // $scope.save();
            console.log($scope.annotations[0].timestamp);
            $scope.annotations.push($scope.annotations.shift())
            console.log($scope.annotations[0].timestamp);
        }

        $scope.save = function () {
            $scope.annotations[0].content = $scope.annotationContent;
            $scope.annotationContent = null;
        }
    });

}(window.angular, window._));
