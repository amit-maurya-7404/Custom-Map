import { ILocation } from '@/types/location';
import { ItineraryPlan } from '@/types/itinerary';
import { USER_JAIPUR_LOCATIONS } from './jaipur-data';
import { USER_UDAIPUR_LOCATIONS } from './udaipur-data';

export { USER_JAIPUR_LOCATIONS, USER_UDAIPUR_LOCATIONS };

// Pre-seeded Himachal Pradesh Locations
export const HIMACHAL_LOCATIONS: ILocation[] = [
  {
    _id: 'hp-1',
    id: 'hp-1',
    name: 'Solang Valley Adventure Hub',
    category: 'activity',
    lat: 32.3164,
    lng: 77.1578,
    city: 'Manali',
    region: 'Himachal Pradesh',
    country: 'India',
    description: 'Renowned adventure paradise offering paragliding, zorbing, ATV quad biking, and stunning snow-capped Himalayan peaks.',
    rating: 4.8,
    estimatedDuration: 180,
    estimatedCost: 2500,
    tags: ['Paragliding', 'Snow', 'Adventure', 'Mountains'],
  },
  {
    _id: 'hp-2',
    id: 'hp-2',
    name: 'Hadimba Devi Temple',
    category: 'sightseeing',
    lat: 32.2483,
    lng: 77.1812,
    city: 'Manali',
    region: 'Himachal Pradesh',
    country: 'India',
    description: 'Ancient 16th-century wooden pagoda temple surrounded by towering cedar and deodar forests in Old Manali.',
    rating: 4.7,
    estimatedDuration: 60,
    estimatedCost: 50,
    tags: ['Temple', 'Heritage', 'Cedar Forest', 'Photography'],
  },
  {
    _id: 'hp-3',
    id: 'hp-3',
    name: 'Atal Tunnel & Sissu Waterfall',
    category: 'experience',
    lat: 32.4842,
    lng: 77.1235,
    city: 'Lahaul & Spiti',
    region: 'Himachal Pradesh',
    country: 'India',
    description: 'World’s longest highway tunnel above 10,000 feet leading to dramatic barren Himalayan landscapes and cascading Sissu Falls.',
    rating: 4.9,
    estimatedDuration: 240,
    estimatedCost: 1200,
    tags: ['Engineering Marvel', 'Waterfalls', 'High Altitude', 'Scenic Drive'],
  },
  {
    _id: 'hp-4',
    id: 'hp-4',
    name: 'Mall Road & Ridge Shimla',
    category: 'sightseeing',
    lat: 31.1048,
    lng: 77.1734,
    city: 'Shimla',
    region: 'Himachal Pradesh',
    country: 'India',
    description: 'Colonial-era pedestrian promenade featuring Christ Church, Tudor-style buildings, cafes, and sweeping mountain panoramas.',
    rating: 4.6,
    estimatedDuration: 120,
    estimatedCost: 0,
    tags: ['Colonial Architecture', 'Walking', 'Shopping', 'Scenic'],
  },
  {
    _id: 'hp-5',
    id: 'hp-5',
    name: 'Jakhu Hill & Hanuman Statue',
    category: 'activity',
    lat: 31.1012,
    lng: 77.1843,
    city: 'Shimla',
    region: 'Himachal Pradesh',
    country: 'India',
    description: 'Highest peak in Shimla with a 108-foot giant Hanuman statue, panoramic Himalayan views, and cable car ropeway.',
    rating: 4.7,
    estimatedDuration: 90,
    estimatedCost: 500,
    tags: ['Ropeway', 'Trek', 'Viewpoint', 'Spiritual'],
  },
  {
    _id: 'hp-6',
    id: 'hp-6',
    name: 'Kasol & Parvati River Riverside Trek',
    category: 'experience',
    lat: 32.0101,
    lng: 77.3151,
    city: 'Kasol',
    region: 'Himachal Pradesh',
    country: 'India',
    description: 'Tranquil riverside trail along the roaring Parvati River, Israeli cafes, pine woods, and bohemian mountain culture.',
    rating: 4.8,
    estimatedDuration: 180,
    estimatedCost: 600,
    tags: ['Parvati Valley', 'Riverside', 'Cafes', 'Nature Trek'],
  },
];

// All combined locations across destinations (Jaipur + Udaipur + Himachal)
export const ALL_INITIAL_LOCATIONS: ILocation[] = [
  ...USER_JAIPUR_LOCATIONS,
  ...USER_UDAIPUR_LOCATIONS,
  ...HIMACHAL_LOCATIONS,
];

// Quick destinations dictionary with bounding coordinates
export interface DestinationPreset {
  id: string;
  name: string;
  subtitle: string;
  lat: number;
  lng: number;
  zoom: number;
  bbox?: [number, number, number, number]; // [south, north, west, east]
  city?: string;
  region?: string;
  country: string;
}

export const POPULAR_DESTINATIONS: DestinationPreset[] = [
  {
    id: 'india',
    name: 'India Overview',
    subtitle: 'All Destinations & States (90 Spots)',
    lat: 22.5937,
    lng: 78.9629,
    zoom: 5,
    bbox: [8.0, 37.0, 68.0, 97.5],
    country: 'India',
  },
  {
    id: 'jaipur',
    name: 'Jaipur, Rajasthan',
    subtitle: 'Pink City Heritage & Wildlife (47 Spots)',
    lat: 26.9124,
    lng: 75.8267,
    zoom: 12,
    bbox: [26.78, 27.05, 75.68, 75.98],
    city: 'Jaipur',
    region: 'Rajasthan',
    country: 'India',
  },
  {
    id: 'udaipur',
    name: 'Udaipur, Rajasthan',
    subtitle: 'City of Lakes, Palaces & Ghats (37 Spots)',
    lat: 24.5854,
    lng: 73.7125,
    zoom: 12,
    bbox: [24.52, 24.66, 73.60, 73.76],
    city: 'Udaipur',
    region: 'Rajasthan',
    country: 'India',
  },
  {
    id: 'himachal',
    name: 'Himachal Pradesh',
    subtitle: 'Manali, Shimla & Parvati Valley',
    lat: 31.95,
    lng: 77.2,
    zoom: 9,
    bbox: [30.5, 33.2, 75.5, 79.0],
    region: 'Himachal Pradesh',
    country: 'India',
  },
  {
    id: 'goa',
    name: 'Goa',
    subtitle: 'Coastal Beaches & Heritage',
    lat: 15.2993,
    lng: 74.124,
    zoom: 10,
    bbox: [14.89, 15.8, 73.68, 74.35],
    region: 'Goa',
    country: 'India',
  },
  {
    id: 'kerala',
    name: 'Kerala',
    subtitle: 'Backwaters, Tea Hills & Coast',
    lat: 9.9312,
    lng: 76.2673,
    zoom: 8,
    bbox: [8.18, 12.8, 74.8, 77.5],
    region: 'Kerala',
    country: 'India',
  },
];

export const createDefaultPlanForDestination = (destinationName: string): ItineraryPlan => {
  return {
    title: `${destinationName} Itinerary Plan`,
    destination: destinationName,
    days: [
      {
        id: 'day-1',
        dayNumber: 1,
        title: 'Day 1 Schedule',
        items: [],
      },
      {
        id: 'day-2',
        dayNumber: 2,
        title: 'Day 2 Schedule',
        items: [],
      },
      {
        id: 'day-3',
        dayNumber: 3,
        title: 'Day 3 Schedule',
        items: [],
      },
    ],
  };
};
