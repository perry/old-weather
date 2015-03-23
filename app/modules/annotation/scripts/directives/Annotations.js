(function (angular, _) {
    'use strict';

    var module = angular.module('annotation');

    module.directive('annotations', function () {
        return {
            restrict: 'A',
            scope: true,
            templateUrl: 'templates/annotation/annotations.html',
            link: function (scope, element, attrs) {
                scope.updateAnnotation = function (e, data) {
                    if (!angular.isUndefined(data)) {
                        var existing = _.find(scope.annotations, {_id: data._id});
                        if (angular.isUndefined(existing)) {
                            scope.annotations.push(data);
                        } else {
                            var indexOf = _.indexOf(scope.annotations, existing);
                            scope.annotations.splice(indexOf, 1, data);
                        }

                        scope.$apply();
                    }
                };

                scope.createAnnotationsList = function () {
                    scope.annotations = [];
                };

                scope.createAnnotationsList();

                scope.$on('transcribe:loadedSubject', scope.createAnnotationsList);

                scope.$on('svgDrawing:add', scope.updateAnnotation);
                scope.$on('svgDrawing:update', scope.updateAnnotation);
                scope.$on('svgDrawing:finish', scope.updateAnnotation);
            }
        };
    });

}(window.angular, window._));
