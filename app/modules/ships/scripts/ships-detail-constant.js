(function (angular) {
    'use strict';

    var module = angular.module('ships');

    /**
     * @ngdoc constant
     * @name ships.constant:ShipsDetailConstant
     *
     * @description
     * Provides ship names, histories and links.
     *
     */
    module.constant('ShipsDetailConstants', {
        'Ammen': {
            fullName: 'USS Ammen',
            shipClass: 'DD-527 destroyer',
            tonnage: '2,050 tons',
            url: 'http://www.naval-history.net/OW-US/Ammen/USS_Ammen.htm',
            bio: [
                'Named after Rear Admiral Daniel Ammen, served from 1836 to 1878, and known to her crew as the "Flaming Ammen".',
                'Launched in 17 September 1942, the Ammen was wrecked on 19 July 1960 while en route to San Diego for decommissioning.'
            ]
        }
    });


// The following ships need adding:
// Hassler
// Advance
// Polaris
// Rescue


}(window.angular));

