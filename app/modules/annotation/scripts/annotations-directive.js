(function (angular, _) {
    'use strict';

    var module = angular.module('annotation');

    module.directive('annotations', function (annotationsFactory) {
        return {
            restrict: 'A',
            scope: true,
            templateUrl: 'templates/annotation/annotations.html',
            link: function (scope, element, attrs) {

                var updateAnnotations = function (e, data) {
                    var subject = scope.$parent.subject;
                    var existing = _.find(scope.annotations, {_id: data._id});
                    if (angular.isUndefined(existing)) {
                        scope.annotations.push(data);
                        annotationsFactory.add(data, subject);
                    } else {
                        var indexOf = _.indexOf(scope.annotations, existing);
                        scope.annotations.splice(indexOf, 1, data);
                        annotationsFactory.update(data, subject);
                    }

                    scope.$apply();
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

                scope.$on('transcribe:loadedSubject', getAnnotations);

                scope.$on('svgDrawing:add', updateAnnotations);

                scope.$on('svgDrawing:update', updateAnnotations);

                getAnnotations();
            }
        };
    });

}(window.angular, window._));
