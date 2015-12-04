(function (angular, Packery, _) {
    'use strict';

    var module = angular.module('ships');

    /**
     * @ngdoc controller
     * @name ships.controller:ShipsListCtrl
     *
     * @description
     * Controller for ships listing.
     */
    module.controller('ShipsListCtrl',
        function ($scope, zooAPISubjectSets, ShipsDetailConstants) {

            // An array of objects containing the table header information.
            $scope.headers = [
                {name: 'Ship', key: 'display_name'},
                {name: 'Travel', key: 'travel'},
                {name: 'Difficulty', key: 'difficulty'},
                {name: 'Crew', key: 'users'}
            ];

            // Default sort for the columns.
            $scope.columnSort = {key: $scope.headers[0].key, reverse: false};

            /**
             * @ngdoc function
             * @name sort
             * @methodOf ships.controller:ShipsListCtrl
             * @param {number} index
             * The index of the header you wish to sort.
             */
            $scope.sort = function (index) {
                if (angular.isUndefined(index) || angular.isUndefined($scope.headers[index])) {
                    return;
                }

                if ($scope.columnSort.key !== $scope.headers[index].key) {
                    $scope.columnSort.reverse = false;
                } else {
                    $scope.columnSort.reverse = !$scope.columnSort.reverse;
                }

                $scope.columnSort.key = $scope.headers[index].key;
            };

            // Get all the ships.
            $scope.loading = true;
            $scope.ships = [];
            zooAPISubjectSets.get()
                .then(function (response) {
                    $scope.ships = response;
                }, function () {
                    $scope.ships = [];
                }, function (response) {
                    $scope.loading = false;
                    $scope.ships = response;
                })
                ['finally'](function () {
                    $scope.loading = false;
                    $scope.ships = $scope.ships.map(function (ship) {
                        var extraInfo = ShipsDetailConstants[ship.metadata.shortName]
                            || ShipsDetailConstants[ship.display_name.split(' ')[0].toLowerCase()]
                            || {};
                        ship.metadata = _.extend(ship.metadata, extraInfo);
                        return ship;
                    });
                });
        }
    );

    module.directive('shipsList', function ($timeout) {
        return {
            link: function (scope, element, attrs) {
                var pckry = new Packery(element[0], {
                    columnWidth: '.grid-sizer',
                    gutter: '.gutter-sizer',
                    itemSelector: '.item',
                    percentPosition: true,
                    transitionDuration: 0
                });

                scope.$watch('ships', function () {
                    $timeout(function () {
                        pckry.reloadItems();
                        pckry.layout();
                    });
                });
            }
        };
    });
}(window.angular, window.Packery, window._));
