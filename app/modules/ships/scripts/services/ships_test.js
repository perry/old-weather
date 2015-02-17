(function (module, inject, _) {
    'use strict';

    beforeEach(module('ships'));

    describe('Unit: shipsFactory', function () {
        var scope;
        var shipsFactory;
        beforeEach(function () {
            inject(function (_$rootScope_, _shipsFactory_) {
                scope = _$rootScope_.$new();
                shipsFactory = _shipsFactory_;
            });
        });

        it('should return an object', function () {
            expect(_.isPlainObject(shipsFactory)).toBe(true);
        });

        it('should have a get method', function () {
            expect(_.isFunction(shipsFactory.get)).toBe(true);
        });

        it('should return a promise when `get` is called', function () {
            var promise = shipsFactory.get();
            expect(_.isFunction(promise.then)).toBe(true);
        });

        it('should resolve the list of data when no arguments are passed', function () {
            var promise = shipsFactory.get();
            promise.then(function (response) {
                expect(response.length).toBe(21);
            });
            scope.$digest();
        });

        it('should filter the list if a filter is passed', function () {
            var promise = shipsFactory.get({id: 2});
            promise.then(function (response) {
                expect(response.length).toBe(1);
            });
            scope.$digest();
        });

        it('should reject the promise if the response list is empty', function () {
            var promise = shipsFactory.get({id: 'pancakes'});
            promise.then(null, function (response) {
                expect(response.length).toBe(0);
            });
            scope.$digest();
        });
    });
}(window.module, window.inject, window._));

