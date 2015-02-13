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
            $scope.headers = [
                {name: '#', key: 'id'},
                {name: 'Ship', key: 'name'},
                {name: 'Difficulty', key: 'difficulty'},
                {name: 'Crew', key: 'users'}
            ];

            $scope.columnSort = {key: $scope.headers[0].key, reverse: false};

            $scope.sort = function (index) {
                if ($scope.columnSort.key !== $scope.headers[index].key) {
                    $scope.columnSort.reverse = false;
                } else {
                    $scope.columnSort.reverse = !$scope.columnSort.reverse;
                }

                $scope.columnSort.key = $scope.headers[index].key;
            };

            shipsFactory.get()
                .then(function (data) {
                    $scope.ships = data;
                });
        }
    ]);
}(window.angular));
