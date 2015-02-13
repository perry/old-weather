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
        'shipsFactory',
        function ($scope, shipsFactory) {
            shipsFactory.get()
                .then(function (data) {
                    $scope.ships = data;
                });
        }
    ]);
}(window.angular));
