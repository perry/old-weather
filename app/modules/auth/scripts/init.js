(function (angular, zooAuth) {
    'use strict';

    var module = angular.module('auth', []);

    module.factory('authFactory', function ($rootScope, $filter, localStorageService, zooAPI) {
        var _auth = window.zooAuth;

        if (localStorageService.get('user') === null) {
            localStorageService.set('user', null);
        }

        var signIn = function (args) {
            return _auth.signIn(args)
                .then(function (response) {
                    var data = $filter('removeCircularDeps')(response);
                    localStorageService.set('user', data);
                    response.get('avatar')
                        .then(function (avatar) {
                            var avatarData = $filter('removeCircularDeps')(avatar[0]);
                            localStorageService.set('avatar', avatarData);
                            $rootScope.$broadcast('auth:avatar');
                        });
                    $rootScope.$broadcast('auth:signin');
                });
        };

        var signOut = function () {
            localStorageService.set('user', null);
            localStorageService.set('avatar', null);
            $rootScope.$broadcast('auth:signout');
            return _auth.signOut();
        };

        return {
            signIn: signIn,
            signOut: signOut,
            getUser: function () { return localStorageService.get('user'); },
            getAvatar: function () { return localStorageService.get('avatar'); }
        };
    });

    module.controller('HeaderUserCtrl', function ($timeout, $scope, authFactory, $modal) {
        $scope.user = authFactory.getUser();
        $scope.avatar = authFactory.getAvatar();

        $scope.$on('auth:signin', function () {
            $timeout(function () {
                $scope.user = authFactory.getUser();
            });
        });

        $scope.$on('auth:avatar', function () {
            $timeout(function () {
                $scope.avatar = authFactory.getAvatar();
            });
        });

        $scope.$on('auth:signout', function () {
            $timeout(function () {
                $scope.user = null;
            });
        });

        $scope.signOut = function () {
            authFactory.signOut();
        };

        $scope.openLoginModal = function () {
            $modal.open({
                templateUrl: 'templates/auth/login.html',
                controller: 'LoginModalController'
                // size: 'lg'
            });
        };

        $scope.openRegisterModal = function () {
            $modal.open({
                templateUrl: 'templates/auth/register.html'
                // controller: 'HomeVideoController',
                // size: 'lg'
            });
        };
    });

    module.controller('LoginModalController', function ($scope, $modalInstance, authFactory) {
        $scope.signIn = function (data) {
            $scope.loginError = false;

            authFactory.signIn(data)
                .then(function (response) {
                    $scope.form = {};
                    $modalInstance.dismiss();
                }, function (response) {
                    $scope.loginError = true;
                    $scope.$apply();
                });

        };
    });

}(window.angular, window.zooAuth));
