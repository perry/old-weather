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

    module.controller('transcriptionCtrl', function ($timeout, $scope, $sce, $stateParams, zooAPISubjectSets, localStorageService, svgPanZoomFactory) {
        var subject_set_id = $stateParams.subject_set_id;
        zooAPISubjectSets.get({id: subject_set_id})
            .then(function (response) {
                $scope.ship = response[0];
            });

        var annotations_list = localStorageService.get('annotations_list');
        var annotations_for_subject_set = _.where(annotations_list, {subject_set_id: subject_set_id});

        $scope.showAllAnnotations = false;

        var load_next = function () {
            if (annotations_for_subject_set.length > 0) {
                var subject_id = annotations_for_subject_set[0].subject_id;
                annotations_for_subject_set.shift();

                $scope.annotations = localStorageService.get('annotation_subject_id_' + subject_id);
                _.remove($scope.annotations, {type: 'header'});
                _.remove($scope.annotations, {type: 'row'});

                // TODO: get subject image...
                $scope.subjectImage = $sce.trustAsResourceUrl('http://oldweather.s3.amazonaws.com/ow3/final/USRC%20Bear/vol097/vol097_159_0.jpg');
                // $scope.subjectImage = $sce.trustAsResourceUrl('http://www.cosmik.com/oldweather/charleston_-_1945_july_12_-_b1956_027.jpg');
            } else {
                $scope.annotations = null;
            }
        };

        load_next();

        $scope.$watch('annotations', function () {
            if ($scope.annotations && $scope.annotations.length > 0) {
                var annotation = $scope.annotations[0];
                var obj = svgPanZoomFactory.zoomToRect(annotation);

                $scope.uiPositionTop = (obj.sizes.height / 2) + ((annotation.height * obj.sizes.realZoom) / 2);
                $scope.annotationContent = $scope.annotations[0].content;
            }
        }, true);

        $scope.prevAnnotation = function () {
            $scope.save();
            $scope.annotations.unshift($scope.annotations.pop());
        };

        $scope.nextAnnotation = function () {
            $scope.save();
            $scope.annotations.push($scope.annotations.shift());
        };

        $scope.save = function () {
            $scope.annotations[0].content = $scope.annotationContent;
            $scope.annotationContent = null;
        };

        $scope.toggleAllAnnotations = function () {
            $scope.showAllAnnotations = true;
            $scope.panZoom.fit();
            $scope.panZoom.center();
        };
    });

}(window.angular, window._));
