(function (angular, module, inject, _) {
    'use strict';

    beforeEach(module('annotation'));

    describe('Unit: Annotations Directive', function () {

        var $rootScope;
        var $compile;
        var el;
        var scope;

        beforeEach(function () {
            inject(function(_$rootScope_, _$compile_) {
                $rootScope = _$rootScope_;
                $compile = _$compile_;
                el = angular.element('<div annotations></div>');
                scope = $rootScope.$new();
                $compile(el)(scope);
                scope.$digest();
            });
        });

        it('should create an empty list on the scope', function () {
            expect(el.scope().annotations.length).toBe(0);
        });

        it('should have 4 event listeners', function () {
            var listeners = Object.keys(el.scope().$$listeners);
            expect(listeners.length).toBe(4);
        });

        it('should call updateAnnotation when the svg add event is fired', function () {
            spyOn(el.scope(), 'updateAnnotation');
            $rootScope.$broadcast('svgDrawing:add', {});
            expect(el.scope().updateAnnotation).toHaveBeenCalled();
        });

        it('should call updateAnnotation when the svg update event is fired', function () {

        });

        it('should call updateAnnotation when the svg finish event is fired', function () {

        });

    });
}(window.angular, window.module, window.inject, window._));

