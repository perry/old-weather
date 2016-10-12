(function (angular, zooAuth) {
    'use strict';

    var module = angular.module('auth', []);


    module.config(function ($stateProvider, $urlRouterProvider) {

        $urlRouterProvider.when(/\/access_token/, fixAuthUrl);

        $stateProvider.state('completeAuth', {
            url: '/auth',
            views: {
                main: {
                    template: '<div class="logging-in">Logging in...</div>',
                    controller: CompleteAuthController
                }
            }
        });

        function CompleteAuthController($location, authFactory) {
            authFactory.completeSignIn($location.search());
        }

        function fixAuthUrl($match) {
            return '/auth?' + $match.input.substr(1);
        }

    });

    module.factory('authFactory', function ($filter, $interval, $location, $modal, $rootScope, $window, localStorageService, zooAPI, zooAPIConfig) {

        if (localStorageService.get('user') === null) {
            localStorageService.set('user', null);
        }

        if (localStorageService.get('auth') === null) {
            localStorageService.set('auth', null);
        } else {
            var auth = localStorageService.get('auth');
            if (0 < (Math.floor(Date.now() / 1000) - auth.token_start) < auth.expires_in) {
                _setToken(auth.access_token);
                _setUserData();
            } else {
                signOut();
            }
        }

        function completeSignIn(params) {
            localStorageService.set('auth', {
                access_token: params.access_token,
                token_start: Date.now(),
                // Convert to milliseconds for consistency
                expires_in: params.expires_in * 1000
            });
            _setToken(params.access_token);
            return _setUserData()
                .then(function () {
                    $window.location.href = localStorageService.get('redirectOnSignIn');
                });
        }

        function signIn() {
            localStorageService.set('redirectOnSignIn', $location.absUrl());
            $window.zooOAuth.signIn($location.absUrl().match(/.+?(?=\#\/)/)[0]);
        }

        function _setToken(token) {
            zooAPI.headers.Authorization = 'Bearer ' + token;
        }

        function _setUserData() {
            return zooAPI.type('me').get()
                .then(function (response) {

                    var data = $filter('removeCircularDeps')(response[0]);
                    localStorageService.set('user', data);
                    $rootScope.$broadcast('auth:signin');

                    return response[0].get('avatar')
                        .then(function (avatar) {
                            var avatarData = $filter('removeCircularDeps')(avatar[0]);
                            localStorageService.set('avatar', avatarData);
                            $rootScope.$broadcast('auth:avatar');
                        }, function () {
                            return;
                        });
                }, function (error) {
                    console.warn('Error logging in', error);
                    return;
                });
        }

        function signOut() {
            delete zooAPI.headers.Authorization;
            localStorageService.set('auth', null);
            localStorageService.set('user', null);
            localStorageService.set('avatar', null);
            $window.zooAuth.signOut();
            $rootScope.$broadcast('auth:signout');
        }

        return {
            signIn: signIn,
            signOut: signOut,
            completeSignIn: completeSignIn,
            getUser: function () { return localStorageService.get('user'); },
            getAvatar: function () { return localStorageService.get('avatar'); }
        };
    });

    module.controller('SessionExpiredModalController', function ($scope, $modalInstance) {
        $scope.close = $modalInstance.dismiss;
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

        $scope.signOut = authFactory.signOut;
        $scope.signIn = authFactory.signIn;
    });

}(window.angular, window.zooAuth));
