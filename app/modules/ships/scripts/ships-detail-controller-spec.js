(function (angular, module, inject, _) {
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
            inject(function (_$controller_, _$rootScope_, _$q_) {
                $controller = _$controller_;
                $rootScope = _$rootScope_;
                $scope = $rootScope.$new();
                $q = _$q_;

                shipsFactory = {
                    get: function () {
                        deferred = $q.defer();
                        return deferred.promise;
                    }
                };

                $state = {
                    go: function () {}
                };

                spyOn(shipsFactory, 'get').and.callThrough();
                spyOn($state, 'go').and.callThrough();
            });
        });

        describe('With $stateParams.id', function () {
            beforeEach(function () {
                ctrl = $controller('ShipsDetailCtrl', {
                    $scope: $scope,
                    shipsFactory: shipsFactory,
                    $stateParams: {id: 10},
                    $state: $state
                });
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
                deferred.reject();
                $scope.$digest();
                expect($state.go).toHaveBeenCalledWith('404');
            });

        });

        describe('Without $stateParams.id', function () {
            beforeEach(function () {
                ctrl = $controller('ShipsDetailCtrl', {
                    $scope: $scope,
                    shipsFactory: shipsFactory,
                    $stateParams: {},
                    $state: $state
                });
            });

            it('should redirect to the ships-list state', function () {
                expect($state.go).toHaveBeenCalledWith('ships-list');
            });
        });
    });
}(window.angular, window.module, window.inject, window._));
