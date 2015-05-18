(function (angular, zooAuth) {
    'use strict';

    var module = angular.module('auth', []);

    module.factory('authFactory', function ($rootScope, localStorageService) {
        var _auth = window.zooAuth;

        if (localStorageService.get('user') === null) {
            localStorageService.set('user', null);
        }

        var signIn = function (args) {
            return _auth.signIn(args)
                .then(function (response) {
                    localStorageService.set('user', response);
                    $rootScope.$broadcast('auth:signin');
                });
        };

        var signOut = function () {
            localStorageService.set('user', null);
            $rootScope.$broadcast('auth:signout');
            return _auth.signOut();
        };

        return {
            signIn: signIn,
            signOut: signOut,
            getUser: function () { return localStorageService.get('user'); }
        }
    });

    module.controller('HeaderUserCtrl', function ($timeout, $scope, authFactory) {
        $scope.showLoginForm = false;
        $scope.user = authFactory.getUser();

        $scope.$on('auth:signin', function () {
            $timeout(function () {
                $scope.user = authFactory.getUser();
            });
        });

        $scope.$on('auth:signout', function () {
            $timeout(function () {
                $scope.user = null;
            });
        });

        $scope.signIn = function (data) {
            $scope.loginError = false;

            authFactory.signIn(data)
                .then(function (response) {
                    $scope.form = {};
                    $scope.showLoginForm = false;
                }, function (response) {
                    $scope.loginError = true;
                    $scope.$apply();
                });

        };

        $scope.signOut = function () {
            authFactory.signOut();
        };

        $scope.toggleLoginForm = function () {
            $scope.showLoginForm = !$scope.showLoginForm;
        };
    });

}(window.angular, window.zooAuth));

