(function (angular) {
    'use strict';

    var module = angular.module('ships');

    /**
     * @ngdoc controller
     * @name ships.controller:ShipsListCtrl
     *
     * @description
     *
     */
    module.controller('ShipsListCtrl', [
        '$scope',
        function ($scope) {
            $scope.ships = [
                {
                    id: 0,
                    name: 'Bear',
                    type: 'Cutter',
                    crew: 100,
                    difficulty: 1
                }
            ];
        }
    ]);
}(window.angular));
