(function (angular) {
    'use strict';

    var module = angular.module('ships');

    /**
     * @ngdoc service
     * @name ships.service:shipsFactory
     *
     * @description
     *
     */
    module.factory('shipsFactory', [
        '$q',
        function ($q) {

            /**
             * @ngdoc method
             * @name ships.
            var getByID = function (id) {
                var deferred = $q.defer();



                return deferred.promise;
            };

            var ship = {
                id: 0,
                name: 'Bear',
                type: 'Cutter',
                crew: 100,
                difficulty: 1
            };

            return {

            };
        }
    ]);
}(window.angular));


