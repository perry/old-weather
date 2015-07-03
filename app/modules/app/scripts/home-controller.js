(function (angular) {
    'use strict';

    var module = angular.module('app');

    module.controller('HomeController',
        function ($rootScope, zooAPIProject, $scope, $modal) {
            $rootScope.bodyClass = 'home';

            zooAPIProject.get()
                .then(function (response) {
                    $scope.project = response;
                });

            $scope.openHomeVideo = function (size) {
                $modal.open({
                    template: '<div fit-vids><iframe src="http://player.vimeo.com/video/15153640?color=00cfd7" width="540" height="304" frameborder="0"></iframe></div> <a class="btn btn-skeleton white uppercase more-video-modal" ui-sref="about.why" ng-click="cancel()">See more videos about Old Weather</a>',
                    controller: 'HomeVideoController',
                    size: 'lg'
                });
            };
        });

    module.controller('HomeVideoController', function ($scope, $modalInstance) {
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    });

}(window.angular));
