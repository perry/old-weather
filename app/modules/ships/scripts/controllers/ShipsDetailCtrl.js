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
        function ($scope) {
            $scope.ship = {
                id: 0,
                name: 'Bear',
                type: 'Cutter',
                crew: 100,
                difficulty: 1
            };
        }
    ]);
}(window.angular));

