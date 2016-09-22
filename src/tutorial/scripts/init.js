(function (angular) {
    'use strict';

    var module = angular.module('tutorial', []);

    module.controller('TutorialController', ['$scope', '$modal', function($scope, $modal) {

      $scope.noWrapSlides = true;
      $scope.active = 0;
      $scope.slides = [
        {
          id: 0,
          title: 'Welcome to the Old Weather Tutorial!',
          text: 'This will guide you through the process mauris ultrices mauris nec risus porttitor lobortis. Nam elementum, justo sed dignissim congue, justo est ultrices nulla, at feugiat augue sem ac nisl. Aliquam eget blandit arcu. Duis in suscipit turpis. Nunc lobortis purus libero, vitae aliquet diam molestie aliquam. In id mauris vitae orci mollis ultrices. Fusce lobortis, urna et rhoncus fermentum, libero justo laoreet mi, non accumsan nibh neque ac elit. Suspendisse porta, dui a ultricies mollis, mauris lectus pharetra mauris, eu faucibus sem metus at enim. Duis sit amet lacinia mi. Nam non felis sit amet ex dapibus porta quis non leo.'
        },
        {
          id: 1,
          image: 'https://panoptes-uploads.zooniverse.org/production/tutorial_attached_image/a961833b-5204-4f82-b6c2-ffd9375b72d4.gif',
          title: 'Consectetur Elit',
          text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean ligula nibh, dapibus eget nunc et, lacinia luctus sem. Nunc tellus leo, volutpat sed egestas vel, blandit eget sem. Sed faucibus tortor at enim facilisis, ut sagittis est dictum. Integer eu porta tortor. Sed sed imperdiet eros. Nulla facilisi. Aenean eu ultricies nunc, eget porta mauris.'
        },
        {
          id: 2,
          title: 'Nibh Diam',
          image: 'https://panoptes-uploads.zooniverse.org/production/tutorial_attached_image/1034b282-5bb6-426b-a6d7-5f947fa3562d.gif',
          text: 'Vivamus in maximus neque, nec mattis quam. Maecenas non faucibus nulla. Integer nibh diam, ultricies pellentesque auctor a, ullamcorper in leo. Mauris mollis pellentesque orci. Morbi id mauris ut neque scelerisque venenatis et quis augue. Morbi sed ornare eros. Integer fringilla tincidunt sem eget consectetur. Praesent semper nunc odio, ac porttitor lectus sodales sed.'
        }
      ];

      $scope.launchTutorial = function() {
        var modalInstance = $modal.open({
          templateUrl: 'templates/tutorial.html',
          controller: 'TutorialController',
          size: 'lg'
        });
      };

    }]);

}(window.angular));
