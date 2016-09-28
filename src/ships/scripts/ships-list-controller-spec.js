(function (angular, module, inject, _) {
    'use strict';

    beforeEach(module('ships'));

    describe('Unit: ShipsListCtrl', function () {
        var $controller;
        var $rootScope;
        var ctrl;
        var $scope;
        var shipsFactory;
        var deferred;

        beforeEach(function () {
            inject(function (_$controller_, _$rootScope_, _$q_) {
                $controller = _$controller_;
                $rootScope = _$rootScope_;
                $scope = $rootScope.$new();

                shipsFactory = {
                    get: function () {
                        deferred = _$q_.defer();
                        return deferred.promise;
                    }
                };

                spyOn(shipsFactory, 'get').and.callThrough();

                ctrl = $controller('ShipsListCtrl', {
                    $scope: $scope,
                    shipsFactory: shipsFactory
                });
            });
        });

        it('should be defined', function () {
            expect(ctrl).toBeDefined();
        });

        it('should contain a list of headers', function () {
            expect($scope.headers.length).toBe(4);
        });

        it('should contain a default column sort', function () {
            expect(_.isObject($scope.columnSort)).toBe(true);
        });

        it('should default to sorting by the first header in order', function () {
            expect($scope.columnSort.key).toBe($scope.headers[0].key);
            expect($scope.columnSort.reverse).toBe(false);
        });

        describe('$scope.sort', function () {
            it('should not change the default sort if called without an index', function () {
                var original = angular.copy($scope.columnSort);
                $scope.sort();
                $scope.$digest();
                expect(_.isEqual($scope.columnSort, original)).toBe(true);
            });

            it('should not change when called with an out of bounds index', function () {
                var original = angular.copy($scope.columnSort);
                $scope.sort(20);
                $scope.$digest();
                expect(_.isEqual($scope.columnSort, original)).toBe(true);
            });

            it('should change when an index is passed', function () {
                var original = angular.copy($scope.columnSort);
                $scope.sort(1);
                $scope.$digest();
                expect($scope.columnSort.key).not.toBe(original.key);
                expect($scope.columnSort.key).toBe($scope.headers[1].key);
            });

            it('should toggle reverse if the index doesn\'t change', function () {
                $scope.sort(0);
                $scope.$digest();
                expect($scope.columnSort.reverse).toBe(true);
                $scope.sort(1);
                $scope.$digest();
                expect($scope.columnSort.reverse).toBe(false);
                $scope.sort(1);
                $scope.$digest();
                expect($scope.columnSort.reverse).toBe(true);
            });
        });

        it('should call shipsFactory.get without arguments', function () {
            expect(shipsFactory.get).toHaveBeenCalledWith();
        });

        it('should set ships to an array of objects if shipsFactory.get is resolved', function () {
            deferred.resolve([
                {},
                {},
                {}
            ]);
            $scope.$digest();
            expect($scope.ships.length).toBeGreaterThan(0);
        });

        it('should set ships to be an empty array if shipsFactory.get is rejected', function () {
            deferred.reject();
            $scope.$digest();
            expect($scope.ships.length).toBe(0);
        });
    });
}(window.angular, window.module, window.inject, window._));
