export type LocationCategory = 'sightseeing' | 'activity' | 'experience';

export interface ILocation {
  _id?: string;
  id?: string;
  name: string;
  category: LocationCategory;
  lat: number;
  lng: number;
  description?: string;
  city?: string;
  region?: string;
  country?: string;
  imageUrl?: string;
  rating?: number;
  estimatedDuration?: number; // in minutes
  estimatedCost?: number;     // in INR / local currency
  tags?: string[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CreateLocationInput {
  name: string;
  category: LocationCategory;
  lat: number;
  lng: number;
  description?: string;
  city?: string;
  region?: string;
  country?: string;
  imageUrl?: string;
  estimatedDuration?: number;
  estimatedCost?: number;
}

export interface DestinationGeocode {
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  bbox?: [number, number, number, number]; // [south, north, west, east]
  city?: string;
  region?: string;
  country?: string;
}

