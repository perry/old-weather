(function (angular) {
    'use strict';

    var module = angular.module('ships');

    /**
     * @ngdoc object
     * @name ships.constant:ShipsDetailConstant
     *
     * @description
     * Provides ship names, histories and links.
     *
     */
    module.constant('ShipsDetailConstants', {
        'ammen': {
            fullName: 'USS Ammen',
            shipClass: 'DD-527 destroyer',
            tonnage: '2,050 tons',
            url: 'http://www.naval-history.net/OW-US/Ammen/USS_Ammen.htm',
            imageUrl: 'http://www.naval-history.net/OW-US/Ammen/USS_Ammen-1953.jpg',
            bio: [
                'Named after Rear Admiral Daniel Ammen, served from 1836 to 1878, and known to her crew as the "Flaming Ammen".',
                'Launched in 17 September 1942, the Ammen was wrecked on 19 July 1960 while en route to San Diego for decommissioning.'
            ]
        },
        'advance': {
            fullName: 'USS Advance',
            shipClass: 'Brig-rigged wooden sailing ship',
            tonnage: '144 tons',
            url: 'http://www.naval-history.net/OW-US/Advance/USS_Advance.htm',
            imageUrl: 'http://www.naval-history.net/OW-US/Advance/USS_Advance1.jpg',
            bio: [
                'The USS Advance was previously a merchant ship named the Augusta, after which she went into service to searching for Sir John Franklin\'s Arctic expedition.',
                'She became stuck in ice while wintering in 1853, and eventually abandoned in 1855. It\'s believed she was crushed by the ice and sank.'
            ]
        },
        'bear': {
            fullName: 'USS Bear',
            shipClass: 'Steam cutter',
            tonnage: '703 tons',
            url: 'http://www.naval-history.net/OW-US/Bear/USS_Bear.htm',
            imageUrl: 'http://www.naval-history.net/OW-US/Bear/USRC_Bear04.jpg',
            bio: [
                'Built in 1874 in Scotland as a whaling and sealing ship, after which it was bought by the US Navy for the Greely Arctic rescue msission.',
                'She was later transferred to the Revenue Cutter Service of the Treasury Department for service with the Alaskan Patrol. She finally sank in tow off Nova Scotia in 1963.'
            ]
        },
        'hassler': {
            fullName: 'USC & GSS Ferdinand R. Hassler',
            shipClass: 'Steamer',
            tonnage: 'Unknown',
            url: 'http://www.naval-history.net/OW-US/Hassler/USCGSS_Hassler.htm',
            imageUrl: 'http://www.naval-history.net/OW-US/Hassler/USCGSS_Hassler1.jpg',
            bio: [
                'Named after Ferdinand Hassler, 1770-1843, first Superintendent of the United States Coast Survey.',
                'A scientific vessel, she conducted hydrographic surveys off the West Coast and Alaska for nearly twenty years. She was subsequently sold to a civilian operator and was sunk on her first voyage.'
            ]
        },
        'polaris': {
            fullName: 'USS Polaris',
            shipClass: 'Gunboat',
            tonnage: '383 tons',
            url: 'http://www.naval-history.net/OW-US/Polaris/USS_Polaris.htm',
            imageUrl: 'http://www.naval-history.net/OW-US/Polaris/USS_Polaris1.jpg',
            bio: [
                'Originally commissioned as the USS Periwinkle, she was renamed the Polaris in 1871, and sailed to the North Pole as part of the Hall Scientific Expedition.',
                'After running low on supplies on the return journey, the captain ran her aground near Etah, Greenland. Her timbers were salvaged and used to build two boats, which the crew sailed south until they were rescued.'
            ]
        },
        'rescue': {
            fullName: 'USS Rescue',
            shipClass: 'Brig-rigged wooden sailing ship',
            tonnage: '91 tons',
            url: 'http://www.naval-history.net/OW-US/Rescue/USS_Rescue.htm',
            imageUrl: 'http://www.naval-history.net/OW-US/Rescue/USS_Rescue1.jpg',
            bio: [
                'Sailed from New York in 1850 with sister ship USS Advance to search for Sir John Franklin\'s lost Arctic expedition.',
                'After being trapped in ice that winter, she was freed the next year and attempted to continue her search, but returned to New York after conditions worsened further.'
            ]
        }
    });

}(window.angular));
