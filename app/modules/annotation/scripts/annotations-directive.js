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

                var storeAnnotations = function (e, data) {
                    var existing = _.find(scope.annotations, {_id: data._id});
                    if (angular.isUndefined(existing)) {
                        addAnnotation(data);
                    } else {
                        updateAnnotation(data, existing);
                    }
                };

                var tempCells = {};

                var createCells = function (row) {
                    var headers = _.where(scope.annotations, {type: 'header'});
                    _.each(headers, function (header, index) {
                        // If the row is below the header
                        if (row.y >= (header.y + header.height)) {
                            var obj = {
                                height: row.height,
                                width: header.width,
                                x: header.x,
                                y: row.y,
                                rotation: header.rotation
                            };

                            var existing = _.find(scope.annotations, { _id: tempCells[index] });

                            if (angular.isUndefined(existing)) {
                                obj._id = _.uniqueId() + new Date().getTime();
                                addAnnotation(obj);
                                tempCells[index] = obj._id;
                            } else {
                                obj._id = existing._id;
                                updateAnnotation(obj, existing);
                            }
                        }
                    });
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
                  confirmationModalFactory.deployModal('Clear all annotations?', function(isConfirmed){
                    if(isConfirmed){
                      scope.annotations = [];
                      annotationsFactory.clear(null, scope.$parent.subject);
                    }
                  });
                };

                scope.removeAnnotation = function (annotation) {
                    _.remove(scope.annotations, {_id: annotation._id});
                    annotationsFactory.remove(annotation._id, scope.$parent.subject);
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
                    if (data.type === 'row') {
                        createCells(rect);
                    }
                });

                scope.$on('svgDrawing:finish', function (e, rect, data) {
                    if (data.type === 'row') {
                        createCells(rect);
                    }
                    tempCells = {};
                });

                getAnnotations();
            }
        };
    }]);


    module.directive('annotation', function (confirmationModalFactory, $window, $parse) {
        return {
          link: function (scope, element, attrs) {
            element.bind('mousedown', function (e) {
              e.stopPropagation();
              var annotation = $parse(attrs.annotation)(scope);
              confirmationModalFactory.deployModal('Delete annotation?', function(isConfirmed){
                if(isConfirmed){
                  scope.$parent.removeAnnotation(annotation);
                }
              });
            });
          }
        };
    });

}(window.angular, window._));
