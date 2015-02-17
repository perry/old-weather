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
    module.controller('ShipsDetailCtrl', [
        '$scope',
        '$stateParams',
        '$state',
        'shipsFactory',
        function ($scope, $stateParams, $state, shipsFactory) {
            if (angular.isDefined($stateParams.id)) {
                var id = parseInt($stateParams.id, 10);
                shipsFactory.get({id: id})
                    .then(function (response) {
                        $scope.ship = response[0];
                    }, function (response) {
                        if (response.length === 0) {
                            $state.go('404');
                        }
                    });
            }
        }
    ]);
}(window.angular));

