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
            imageUrl: 'https://naval-history-net.oldweather.org/OW-US/Ammen/USS_Ammen-1953.jpg',
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
            imageUrl: 'https://naval-history-net.oldweather.org/OW-US/Advance/USS_Advance1.jpg',
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
            imageUrl: 'https://naval-history-net.oldweather.org/OW-US/Bear/USRC_Bear04.jpg',
            bio: [
                'Built in 1874 in Scotland as a whaling and sealing ship, after which it was bought by the US Navy for the Greely Arctic rescue msission.',
                'She was later transferred to the Revenue Cutter Service of the Treasury Department for service with the Alaskan Patrol. She finally sank in tow off Nova Scotia in 1963.'
            ]
        },
        'eastwind': {
            fullName: 'USCGC Eastwind',
            shipClass: 'Diesel-electric cutter',
            tonnage: '6,515 tons',
            url: 'http://www.naval-history.net/OW-US/Eastwind/USCGC_Eastwind.htm',
            imageUrl: 'https://naval-history-net.oldweather.org/OW-US/Eastwind/USCGC_Eastwind2WW2.jpg',
            bio: [
                'Hunted for German weather stations on Greenland during the war, later taking part in various operations in the Arctic and Antarctic, including rescue and icebreaking missions.',
                'She was decommissioned and sold in 1968.'
            ]
        },
        'farragut': {
            fullName: 'USS Farragut',
            shipClass: 'Destroyer (DD 348) Farragut-class',
            tonnage: '2,365 tons',
            url: 'http://www.naval-history.net/OW-US/Farragut/USS_Farragut.htm',
            imageUrl: 'https://naval-history-net.oldweather.org/OW-US/Farragut/USS_Farragut-1943.jpg',
            bio: [
                'Commissioned in 1934, the Farragut won 14 battle stars during World War 2, and saw action at Pearl Harbor, Guadalcanal and Iwo Jima.',
                'She was decommissioned and sold for scrap in 1947.'
            ]
        },
        'hassler': {
            fullName: 'USC & GSS Ferdinand R. Hassler',
            shipClass: 'Steamer',
            tonnage: 'Unknown',
            url: 'http://www.naval-history.net/OW-US/Hassler/USCGSS_Hassler.htm',
            imageUrl: 'https://naval-history-net.oldweather.org/OW-US/Hassler/USCGSS_Hassler1.jpg',
            bio: [
                'Named after Ferdinand Hassler, 1770-1843, first Superintendent of the United States Coast Survey.',
                'A scientific vessel, she conducted hydrographic surveys off the West Coast and Alaska for nearly twenty years. She was subsequently sold to a civilian operator and was sunk on her first voyage.'
            ]
        },
        'northland': {
            fullName: 'USCGC Northland',
            shipClass: 'Diesel auxiliary cutter with auxiliary sails',
            tonnage: '2,150 tons',
            url: 'http://www.naval-history.net/OW-US/Northland/USCGC_Northland.htm',
            imageUrl: 'https://naval-history-net.oldweather.org/OW-US/Northland/USCGC_Northland1PostWW1.jpg',
            bio: [
                'Served on the Bering Sea patrol, and later patrolled Greenland during WW2.',
                'After the war, she was bought by Israel, and later became the first vessel of the fledgling Israeli Navy in 1948, as the Matzpen. She was decommissioned and scrapped in 1962.'
            ]
        },
        'northwind': {
            fullName: 'USCGC Northwind',
            shipClass: 'Diesel-electric cutter',
            tonnage: '6,515 tons',
            url: 'http://www.naval-history.net/OW-US/Northwind/USCGC_Northwind.htm',
            imageUrl: 'https://naval-history-net.oldweather.org/OW-US/Northwind/USCGC_Northwind2WW2.JPG',
            bio: [
                'Stationed at Seattle, WA for polar ice operations and the Bering Sea Patrol for nearly 30 years, during which time she took part in various surveys and scientific expeditions.',
                'She was decommissioned in 1989 and assigned to James River Reserve Fleet. She was later sold for scrap.'
            ]
        },
        'polaris': {
            fullName: 'USS Polaris',
            shipClass: 'Gunboat',
            tonnage: '383 tons',
            url: 'http://www.naval-history.net/OW-US/Polaris/USS_Polaris.htm',
            imageUrl: 'https://naval-history-net.oldweather.org/OW-US/Polaris/USS_Polaris1.jpg',
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
            imageUrl: 'https://naval-history-net.oldweather.org/OW-US/Rescue/USS_Rescue1.jpg',
            bio: [
                'Sailed from New York in 1850 with sister ship USS Advance to search for Sir John Franklin\'s lost Arctic expedition.',
                'After being trapped in ice that winter, she was freed the next year and attempted to continue her search, but returned to New York after conditions worsened further.'
            ]
        }
    });

}(window.angular));
