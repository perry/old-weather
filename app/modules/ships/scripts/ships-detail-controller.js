(function (angular) {
    'use strict';

    var module = angular.module('ships');

    /**
     * @ngdoc controller
     * @name ships.controller:ShipsDetailCtrl
     *
     * @description
     *
     */
    module.controller('ShipsDetailCtrl',
        function ($scope, $stateParams, $state, zooAPISubjectSets) {
            if (angular.isDefined($stateParams.id)) {
                zooAPISubjectSets.get({id: $stateParams.id})
                    .then(function (response) {
                        $scope.ship = response[0];
                    }, function () {
                        $state.go('404');
                    });

            } else {
                $state.go('ships-list');
            }
        }
    );
}(window.angular));

