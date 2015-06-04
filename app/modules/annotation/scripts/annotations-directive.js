(function (angular, _) {
    'use strict';

    var module = angular.module('annotation');

    module.directive('annotations', function (annotationsFactory) {
        return {
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

                var saveAnnotations = function (e, subject) {
                    annotationsFactory.sync();
                };

                var createCells = function (row) {
                    var headers = _.where(scope.annotations, {type: 'header'});
                    _.each(headers, function (header) {
                        // If the row is below the header
                        if (row.y >= (header.y + header.height)) {
                            var obj = {
                                height: row.height,
                                width: header.width,
                                x: header.x,
                                y: row.y,
                                rotation: header.rotation
                            };

                            var existing = _.find(scope.annotations, {x: obj.x, y: obj.y});

                            if (angular.isUndefined(existing)) {
                                obj._id = _.uniqueId() + new Date().getTime();
                                addAnnotation(obj);
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
                                scope.annotations = response;
                            }
                        });
                };

                var clearAnnotations = function () {
                    scope.annotations = [];
                    annotationsFactory.clear(null, scope.$parent.subject);
                };

                scope.$on('transcribe:clearAnnotations', clearAnnotations);

                scope.$on('transcribe:loadedSubject', getAnnotations);

                scope.$on('transcribe:saveSubject', saveAnnotations);

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
                });

                getAnnotations();
            }
        };
    });

    module.directive('annotation', function ($parse) {
        return {
            link: function (scope, element, attrs) {
                element.bind('click', function () {
                    var annotation = $parse(attrs.annotation)(scope);
                    _.remove(scope.$parent.annotations, annotation);
                });
            }
        };
    });

}(window.angular, window._));
