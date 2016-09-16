(function (angular, _) {
    'use strict';

    var module = angular.module('transcribe', [
        'ui.router',
        'angularSpinner'
    ]);

    module.config(function ($stateProvider) {
        $stateProvider
            .state('transcribe', {
                url: '/transcribe/:subject_set_id/',
                views: {
                    main: {
                        controller: 'TranscribeController',
                        templateUrl: 'templates/transcribe.html'
                    }
                }
            });
    });

    module.service('pendingAnnotationsService', ['zooAPI', 'localStorageService', function(zooAPI, localStorageService) {
        this.get = function(subjectSet, page) {
          var user = localStorageService.get('user');
          if (typeof user !== "undefined" && user !== null) { // user exists?
            var current_subject = localStorageService.get('current_subject_' + subjectSet.id);
            return zooAPI.type('classifications/incomplete').get({ // fetch user's incomplete classification
                page: page || 1,
                project_id: subjectSet.links.project,
                subject_id: current_subject.id
            }).then(function(classifications) {
                return Promise.resolve(classifications);
            }).catch(function(err) {
                throw err;
            });
        }

        // Save the grid to local storage for reuse
        function saveGrid(data) {
            _grids.push(angular.copy(data));
            localStorageService.set('grids', _grids);
        }

        // not sure this is needed?
        function updateGrid(data) {
          var index = _grids.indexOf(data);
          _grids.splice(index, 1, data); // replace element with updated version
          localStorageService.set('grids', _grids);
        }

        // Delete grid from local storage
        function deleteGrid(index) {
            _grids.splice(index, 1);
            localStorageService.set('grids', _grids);
        }

        function moveGrid(currentGrid, initialClick, e) {
          if (!isMoveEnabled) return;
          var currentPos = svgGridFactory.createPoint(e);
          var index = _grids.indexOf(currentGrid);

          // use as a reference
          var beforeGrid = localStorageService.get('grids')[index];

          for(var annotation of currentGrid) {
            var beforeAnnotation = _.filter(beforeGrid, {_id: annotation._id});
            var xBefore = beforeAnnotation[0].x;
            var yBefore = beforeAnnotation[0].y;
            annotation.x = xBefore + currentPos.x - initialClick.x;
            annotation.y = yBefore + currentPos.y - initialClick.y;
          }
          showGrid(index);
        }

        function enableMove(e) {
          isMoveEnabled = true;
          annotationsFactory.isEnabled = false; // prevents deleting annotations (and modals produces)
          } else {
            return []; // nothing to do for non-logged-in users
          }

        };
    }]);

    module.controller('TranscribeController', function ($rootScope, $q, $timeout, $scope, $sce, $stateParams, zooAPI, zooAPISubjectSets, localStorageService, svgPanZoomFactory, pendingAnnotationsService) {
        $rootScope.bodyClass = 'transcribe';

        function zoomToCurrentAnnotation() {
            if ($scope.annotations && $scope.annotations.length > 0) {
                var annotation = $scope.annotations[0];
                var obj = svgPanZoomFactory.zoomToRect(annotation);

                $scope.uiPositionTop = (obj.sizes.height / 2) + ((annotation.height * obj.sizes.realZoom) / 2);
                $scope.annotationContent = $scope.annotations[0].content;
            }
        }

        window.zoomToCurrentAnnotation = zoomToCurrentAnnotation;

        var subject_set_id = $stateParams.subject_set_id;
        $scope.isLoading = true;
        zooAPISubjectSets.get({id: subject_set_id})
            .then(function (response) {
                $scope.ship = response[0];
                return pendingAnnotationsService.get($scope.ship);
            })
            .then(function (annotations_for_subject_set) {

                $scope.showAllAnnotations = false;

                var load_next = function () {
                    $scope.subjectImage = null;
                    $scope.isLoading = true;

                    if (annotations_for_subject_set.length > 0) {
                        var annotation = annotations_for_subject_set[0];
                        $scope.subject_id = annotation.links.subjects[0];
                        annotations_for_subject_set.shift();

                        $scope.annotations = annotation.annotations;
                        $scope.classification = annotation;

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

                        zooAPI.type('subjects').get({id: $scope.subject_id})
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

                $scope.$watch('annotations', zoomToCurrentAnnotation, true);

                $scope.subjectLoaded = function () {
                    $scope.isLoading = false;
                    // Image is loaded, we can safely calculate zoom for first annotation
                    $timeout(zoomToCurrentAnnotation, 0);
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
                    $scope.save();
                    $scope.classification.update({
                      completed: true, // otherwise classification remains incomplete!
                      annotations: $scope.annotations,
                      metadata: {
                          started_at: new Date().toISOString(),
                          finished_at: new Date().toISOString(),
                          user_agent: navigator.userAgent,
                          user_language: navigator.language
                      }
                    });

                    $scope.classification.save()
                        .then(function (response) {
                            $scope.$apply(load_next);
                        });
                };
        });
    });

}(window.angular, window._));
