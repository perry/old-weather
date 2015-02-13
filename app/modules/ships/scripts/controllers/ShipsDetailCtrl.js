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
        'shipsFactory',
        function ($scope, $stateParams, shipsFactory) {
            shipsFactory.get({id: parseInt($stateParams.id, 10)})
                .then(function (response) {
                    $scope.ship = response[0];
                });
        }
    ]);
}(window.angular));

