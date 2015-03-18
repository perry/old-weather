(function (angular) {
    'use strict';

    var module = angular.module('annotation');

    module.directive('annotations', function () {
        return {
            restrict: 'A',
            scope: true,
            templateUrl: 'templates/annotation/annotations.html',
            link: function (scope, element, attrs) {
                scope.annotations = [];

                var updateAnnotations = function (data) {
                    var existing = _.find(scope.annotations, {_id: data._id});
                    if (angular.isUndefined(existing)) {
                        scope.annotations.push(data);
                    } else {
                        var indexOf = _.indexOf(scope.annotations, existing);
                        scope.annotations.splice(indexOf, 1, data);
                    }

                    scope.$apply();
                };

                scope.$on('svgDrawing:add', function (e, data) {
                    updateAnnotations(data);
                });

                scope.$on('svgDrawing:update', function (e, data) {
                    updateAnnotations(data);
                });
            }
        };
    });

}(window.angular));


