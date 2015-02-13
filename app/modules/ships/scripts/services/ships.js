(function (angular, _) {
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
            var data = [{"id":0,"name":"Albatross (1884)","travel":"Steamer","users":201,"difficulty":"easy"},{"id":1,"name":"Albatross (1890)","travel":"Steamer","users":351,"difficulty":"easy"},{"id":2,"name":"Albatross (1900)","travel":"Steamer","users":125,"difficulty":"easy"},{"id":3,"name":"Bear","travel":"Cutter","users":189,"difficulty":"medium"},{"id":4,"name":"Concord","travel":"Gunboat","users":520,"difficulty":"medium"},{"id":5,"name":"Jamestown (1844)","travel":"Sloop","users":31,"difficulty":"challenging"},{"id":6,"name":"Jamestown (1866)","travel":"Sloop","users":135,"difficulty":"easy"},{"id":7,"name":"Jamestown (1879)","travel":"Sloop","users":124,"difficulty":"easy"},{"id":8,"name":"Jamestown (1886)","travel":"Sloop","users":89,"difficulty":"easy"},{"id":9,"name":"Jeannette","travel":"Steam barque","users":50,"difficulty":"medium"},{"id":10,"name":"Patterson","travel":"Steamer","users":45,"difficulty":"hard"},{"id":11,"name":"Perry","travel":"Cutter","users":204,"difficulty":"easy"},{"id":12,"name":"Pioneer","travel":"Steamer","users":60,"difficulty":"hard"},{"id":13,"name":"Rodgers","travel":"Naval auxiliary","users":34,"difficulty":"medium"},{"id":14,"name":"Rush","travel":"Cutter","users":134,"difficulty":"medium"},{"id":15,"name":"Thetis","travel":"Cutter","users":203,"difficulty":"easy"},{"id":16,"name":"Unalga (I)","travel":"Steam cutter","users":52,"difficulty":"medium"},{"id":17,"name":"Unalga (II)","travel":"Freighter","users":25,"difficulty":"medium"},{"id":18,"name":"Vicksburg","travel":"Gunboat","users":128,"difficulty":"easy"},{"id":19,"name":"Yorktown","travel":"Gunboat","users":213,"difficulty":"easy"},{"id":20,"name":"Yukon","travel":"Schooner","users":51,"difficulty":"challenging"}];

            var get = function (filter) {
                var deferred = $q.defer();
                var response = data;

                if (!_.isUndefined(filter) && _.isObject(filter)) {
                    response = _.where(response, filter);
                }

                deferred.resolve(response);

                return deferred.promise;
            };

            return {
                get: get
            };
        }
    ]);
}(window.angular, window._));


