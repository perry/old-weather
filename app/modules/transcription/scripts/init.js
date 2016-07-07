(function (angular, _) {
    'use strict';

    var module = angular.module('transcription', [
        'ui.router',
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

    module.service('pendingAnnotationsService', ['zooAPI', function(zooAPI) {
        this.get = function(page) {
            return zooAPI.type('classifications/incomplete').get({ page: page || 1 })
        };
    }]);

    module.controller('transcriptionCtrl', function ($rootScope, $q, $timeout, $scope, $sce, $stateParams, zooAPI, zooAPISubjectSets, localStorageService, svgPanZoomFactory, pendingAnnotationsService) {
        console.log('transcription');
        $rootScope.bodyClass = 'transcribe';

        var subject_set_id = $stateParams.subject_set_id;
        zooAPISubjectSets.get({id: subject_set_id})
            .then(function (response) {
                $scope.ship = response[0];
            })

        var annotations_list = localStorageService.get('annotations_list');
        // Only return items that have a classification.
        _.remove(annotations_list, function (item) {
            return !item.classification;
        });
        var annotations_for_subject_set = _.where(annotations_list, {subject_set_id: subject_set_id});

        pendingAnnotationsService.get()
            .then(function (annotations_for_subject_set) {

                $scope.showAllAnnotations = false;

                var load_next = function () {
                    $scope.subjectImage = null;
                    $scope.isLoading = true;

                    if (annotations_for_subject_set.length > 0) {
                        var subject_id = annotations_for_subject_set[0].links.subjects[0];
                        $scope.subject_id = subject_id;
                        annotations_for_subject_set.shift();

                        var annotation = localStorageService.get('annotation_subject_id_' + subject_id);
                        $scope.annotations = annotation.annotations;

                        // Our best friend $timeout is back. Used here to delay setting
                        // of first / last until the $$hashKey has been set.
                        $timeout(function() {
                            $scope.first = $scope.annotations[0].$$hashKey;
                            $scope.last = $scope.annotations[$scope.annotations.length - 1].$$hashKey;
                        }, 0);

                        // This is presumably to allow saving of header rows, but this
                        // feature never got implemented. I'm not quite sure why there
                        // are separate entries for rows and cells (possibly to create
                        // subsequent rows off the columns), but we want to be able to
                        // transcribe the header cells for now.
                        // _.remove($scope.annotations, {type: 'header'});

                        _.remove($scope.annotations, {type: 'row'});

                        zooAPI.type('subjects').get({id: subject_id})
                            .then(function (response) {
                                var subject = response[0];
                                var keys = Object.keys(subject.locations[0]);
                                var subjectImage = subject.locations[0][keys[0]];
                                subjectImage += '?' + new Date().getTime();
                                $timeout(function () {
                                    $scope.subjectImage = $sce.trustAsResourceUrl(subjectImage);
                                    $scope.loadHandler = $scope.subjectLoaded();
                                }, 0);
                            });
                    } else {
                        $scope.annotations = null;
                        $scope.isLoading = false;
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

                $scope.subjectLoaded = function () {
                    $scope.isLoading = false;
                };

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

                var annotationInput = document.getElementById('annotation-input');

                $scope.insertChar = function (insertValue) {
                    var input = annotationInput;
                    if (document.selection) {
                        input.focus();
                        document.selection.createRange().text = insertValue;
                    } else if (input.selectionStart || input.selectionStart === '0') {
                        var endPos = input.selectionStart + 1;
                        input.value = input.value.substring(0, input.selectionStart) + insertValue + input.value.substring(input.selectionEnd, input.value.length);
                        input.selectionStart = endPos;
                        input.selectionEnd = endPos;
                        input.focus();
                    } else {
                        input.value += insertValue;
                    }
                };

                $scope.finish = function () {
                    var obj = {
                        annotations: $scope.annotations,
                        metadata: {
                            started_at: new Date().toISOString(),
                            user_agent: navigator.userAgent,
                            user_language: navigator.language
                        },
                        links: {
                            project: $scope.ship.links.project,
                            subjects: [$scope.subject_id]
                        }
                    };

                    zooAPI.type('workflows').get({id: $scope.ship.links.workflows[0]})
                        .then(function (response) {
                            var workflow = response[0];
                            obj.links.workflow = workflow.id;
                            obj.metadata.workflow_version = workflow.version;

                            obj.metadata.finished_at = new Date().toISOString();
                            obj.completed = true;

                            var resource = zooAPI.type('classifications').create(obj);
                            resource.save()
                                .then(function (response) {
                                    var annotations_list = localStorageService.get('annotations_list');
                                    _.remove(annotations_list, {subject_id: $scope.subject_id, subject_set_id: $stateParams.subject_set_id});
                                    localStorageService.set('annotations_list', annotations_list);
                                    localStorageService.remove('annotation_subject_id_' + $scope.subject_id);
                                    $scope.$apply(load_next);
                                });
                        });
                };
        });
    });

}(window.angular, window._));
