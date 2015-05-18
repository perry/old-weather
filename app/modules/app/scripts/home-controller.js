(function (angular) {
    'use strict';

    var module = angular.module('app');

    module.controller('HomeController',
        function (zooAPIProject, $scope) {
            zooAPIProject.get()
                .then(function (response) {
                    $scope.project = response;
                });
        }
    );

}(window.angular));
