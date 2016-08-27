(function (angular, _) {
    'use strict';

    var module = angular.module('annotation');

    module.directive('annotations', ['confirmationModalFactory', 'annotationsFactory', function (confirmationModalFactory, annotationsFactory) {
        return {
            replace: true,
            restrict: 'A',
            scope: true,
            templateUrl: 'templates/annotation/annotations.html',
            link: function (scope, element, attrs) {

                var addAnnotation = function (data) {
                    var subject = scope.$parent.subject;
                    scope.annotations.push(data);
                    annotationsFactory.add(data, subject);

                    scope.$apply();
                };

                var updateAnnotation = function (data, existing) {
                    var subject = scope.$parent.subject;
                    var indexOf = _.indexOf(scope.annotations, existing);
                    scope.annotations.splice(indexOf, 1, data);
                    annotationsFactory.update(data, subject);

                    scope.$apply();
                };

                var tempCells = {};

                var createCells = function (row) {
                    var headers = _.where(scope.annotations, {type: 'header'});
                    var rowId = _.uniqueId('row_'); // + new Date().getTime(); // use human-readable id for debugging --STI
                    _.each(headers, function (header, index) {
                        // If the row is below the header
                        if (row.y >= (header.y + header.height)) {
                            var annotation = {
                                height: row.height,
                                width: header.width,
                                x: header.x,
                                y: row.y,
                                rotation: header.rotation,
                                type: 'row_annotation' // actual row annotations need to be called something else for now --STI
                            };

                            var existing = _.find(scope.annotations, { _id: tempCells[index] });

                            if (angular.isUndefined(existing)) {
                                annotation._id = _.uniqueId('antn_'); //+ new Date().getTime(); // use human-readable id for debugging --STI
                                annotation._rowId = rowId;
                                addAnnotation(annotation);
                                tempCells[index] = annotation._id;
                            } else {
                                annotation._id = existing._id;
                                annotation._rowId = existing._rowId;
                                updateAnnotation(annotation, existing);
                            }

                        }
                    });
                };

                var storeAnnotations = function (e, data) {
                    // skip for row annotation: createCells() called separately
                    if (data.type === 'row') {
                      createCells(data);
                    } else {
                      var existing = _.find(scope.annotations, {_id: data._id});
                      if (angular.isUndefined(existing)) {
                          addAnnotation(data);
                      } else {
                          updateAnnotation(data, existing);
                      }
                    }

                };

                var getAnnotations = function () {
                    scope.annotations = [];

                    annotationsFactory.get(scope.$parent.subject.id)
                        .then(function (response) {
                            if (response) {
                                scope.annotations = response.annotations;
                            }
                        });
                };

                var clearAnnotations = function () {
                  var params = {message: 'Clear all annotations?'};
                  confirmationModalFactory.setParams(params);
                  confirmationModalFactory.deployModal(function(deleteType){
                    if(deleteType){
                      scope.annotations = [];
                      annotationsFactory.clear(null, scope.$parent.subject);
                    }
                  });
                };

                scope.removeAnnotation = function (annotation, type) {
                    if(type === 'row' && annotation._rowId) { // remove all annotations in row
                      var annotationsToRemove = _.filter(scope.annotations, {_rowId: annotation._rowId});
                      for(var currAnnotation of annotationsToRemove) {
                        _.remove(scope.annotations, {_rowId: currAnnotation._rowId});
                        annotationsFactory.remove(currAnnotation._id, scope.$parent.subject);
                      }
                    } else {
                      _.remove(scope.annotations, {_id: annotation._id});
                      annotationsFactory.remove(annotation._id, scope.$parent.subject);
                    }
                    scope.$apply();
                };

                scope.selectAnnotation = function (annotation) {
                    var index = _.indexOf(scope.annotations, annotation);

                    _.each(scope.annotations, function (a, i) {
                        if (index !== i) { a.selected = false; }
                    });

                    scope.annotations[index].selected = !scope.annotations[index].selected;
                    scope.$apply();
                };

                scope.$on('transcribe:clearAnnotations', clearAnnotations);
                scope.$on('transcribe:loadedSubject', getAnnotations);
                scope.$on('svgDrawing:add', storeAnnotations);
                scope.$on('svgDrawing:update', storeAnnotations);
                scope.$on('svgDrawing:update', function (e, rect, data) {
                    // if (data.type === 'row') {
                    //     createCells(rect); // this doesn't seem necessary anymore
                    // }
                });

                scope.$on('svgDrawing:finish', function (e, rect, data) {
                    // if (data.type === 'row') {
                    //     createCells(rect); // this doesn't seem necessary anymore
                    // }
                    tempCells = {};
                });

                getAnnotations();
            } // end link
        };
    }]);


    module.directive('annotation', function (confirmationModalFactory, $window, $parse) {
        return {
          link: function (scope, element, attrs) {

            var isClicked = false;

            // element.bind('mousemove', function(e) {
            //     e.stopPropagation();
            //
            //     // click + move = drag
            //     if(isClicked) {
            //       console.log('DRAGGING!'); // --STI
            //     }
            // });

            element.bind('mousedown', function (e) {
              // e.stopPropagation(); // stops grid-level propagation
              isClicked = true;
              console.log('isClicked = ', isClicked, e); // --STI
              return; // skip deletion for now // --STI

              var annotation = $parse(attrs.annotation)(scope);

              var params = {
                  message:    annotation.type === 'row_annotation' ? 'Delete annotation or entire row?' : 'Delete annotation?',
                  deleteType: annotation.type === 'row_annotation' ? 'row' : 'row_annotation'
              };

              confirmationModalFactory.setParams(params);
              confirmationModalFactory.deployModal( function(deleteType) {
                if(!deleteType) {
                  return; // no params passed, nothing to do
                }
                if(deleteType === 'row'){
                  scope.$parent.removeAnnotation(annotation, 'row');
                } else if(deleteType === 'annotation') {
                  scope.$parent.removeAnnotation(annotation, 'annotation');
                }
              });
            });

            element.bind('mouseup', function(e) {
                // e.stopPropagation();
                isClicked = false;
                console.log('isClicked = ', isClicked); // --STI
            });
          }
        };
    });

}(window.angular, window._));
