(function (angular) {
    'use strict';

    beforeEach(module('ships'));

    describe('Unit: ShipsDetailCtrl', function () {
        var $controller;
        var $rootScope;
        var ctrl;
        var $scope;
        var $q;
        var deferred;
        var shipsFactory;
        var $state;

        beforeEach(function () {
            module(function ($provide) {
                $provide.value('$stateParams', {id: 10});
            });

            inject(function (_$controller_, _$rootScope_, _$q_, _$state_) {
                $controller = _$controller_;
                $rootScope = _$rootScope_;
                $scope = $rootScope.$new();
                $q = _$q_;
                $state = _$state_;

                shipsFactory = {
                    get: function () {
                        deferred = $q.defer();
                        return deferred.promise;
                    }
                };

                $state = {
                    go: function (string) {

                    }
                };

                spyOn(shipsFactory, 'get').and.callThrough();
                spyOn($state, 'go').and.callThrough();

                ctrl = $controller('ShipsDetailCtrl', {
                    $scope: $scope,
                    shipsFactory: shipsFactory,
                    $state: $state
                });
            });
        });

        it('should be defined', function () {
            expect(ctrl).toBeDefined();
        });

        it('should have called get on the service', function () {
            expect(shipsFactory.get).toHaveBeenCalled();
        });

        it('should only contain one ship', function () {
            deferred.resolve([{'id': 1}]);
            $scope.$digest();
            expect(_.isPlainObject($scope.ship)).toBe(true);
        });

        it('should throw a 404 if a ship isn\'t returned', function () {
            deferred.reject([]);
            $scope.$digest();
            expect($state.go).toHaveBeenCalledWith('404');
        });
    });
}(window.angular));
