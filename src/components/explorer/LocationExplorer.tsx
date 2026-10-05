'use client';

import React, { useState, useMemo } from 'react';
import { ILocation, LocationCategory, DestinationGeocode } from '@/types/location';
import { LocationCard } from './LocationCard';
import { Search, Plus, RefreshCw, MapPin, X, Globe, Filter } from 'lucide-react';

interface LocationExplorerProps {
  locations: ILocation[];
  isLoading: boolean;
  selectedLocation: ILocation | null;
  onSelectLocation: (loc: ILocation) => void;
  onAddToItinerary: (loc: ILocation, dayNumber?: number) => void;
  onOpenAddModal: () => void;
  onRefresh: () => void;
  availableDays: number[];
  selectedDay: number;
  focusedDestination?: DestinationGeocode | null;
  onClearDestinationFilter?: () => void;
}

export const LocationExplorer: React.FC<LocationExplorerProps> = ({
  locations,
  isLoading,
  selectedLocation,
  onSelectLocation,
  onAddToItinerary,
  onOpenAddModal,
  onRefresh,
  availableDays,
  selectedDay,
  focusedDestination,
  onClearDestinationFilter,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<LocationCategory | 'all'>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique cities & regions for dynamic city filter
  const uniqueCities = useMemo(() => {
    const citySet = new Set<string>();
    locations.forEach((loc) => {
      if (loc.city) citySet.add(loc.city);
    });
    return Array.from(citySet).sort();
  }, [locations]);

  // Filter locations
  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      // Category filter
      if (selectedCategory !== 'all' && loc.category !== selectedCategory) {
        return false;
      }

      // Explicit City dropdown filter
      if (selectedCity !== 'all') {
        if (loc.city?.toLowerCase() !== selectedCity.toLowerCase()) {
          return false;
        }
      } else if (focusedDestination) {
        const destName = focusedDestination.name.toLowerCase();
        const destCity = (focusedDestination.city || '').toLowerCase();
        const destRegion = (focusedDestination.region || '').toLowerCase();

        // If not "all destinations"
        if (!destName.includes('all')) {
          const locCity = (loc.city || '').toLowerCase();
          const locRegion = (loc.region || '').toLowerCase();

          const matches =
            (destCity && locCity.includes(destCity)) ||
            (locCity && destName.includes(locCity)) ||
            (destCity && destCity.includes(locCity)) ||
            (destRegion && locRegion.includes(destRegion) && !destCity);

          if (!matches) {
            return false;
          }
        }
      }

      // Text search across name, description, city, region, country, tags
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = loc.name.toLowerCase().includes(q);
        const matchDesc = loc.description?.toLowerCase().includes(q);
        const matchCity = loc.city?.toLowerCase().includes(q);
        const matchRegion = loc.region?.toLowerCase().includes(q);
        const matchCountry = loc.country?.toLowerCase().includes(q);
        const matchTags = loc.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchName && !matchDesc && !matchCity && !matchRegion && !matchCountry && !matchTags) {
          return false;
        }
      }

      return true;
    });
  }, [locations, selectedCategory, selectedCity, focusedDestination, searchQuery]);

  // Category counts based on current city filter
  const counts = useMemo(() => {
    const baseList =
      selectedCity === 'all'
        ? locations
        : locations.filter((l) => l.city?.toLowerCase() === selectedCity.toLowerCase());

    return {
      all: baseList.length,
      sightseeing: baseList.filter((l) => l.category === 'sightseeing').length,
      activity: baseList.filter((l) => l.category === 'activity').length,
      experience: baseList.filter((l) => l.category === 'experience').length,
    };
  }, [locations, selectedCity]);

  return (
    <div className="h-full flex flex-col bg-slate-950 border-r border-slate-800 w-full overflow-hidden select-none">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              <span>Places & POIs</span>
            </h2>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[11px] text-sky-300 font-bold">
              {filteredLocations.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onRefresh}
              title="Refresh database"
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1 px-2 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors shadow-sm"
              title="Add a new spot anywhere in the world"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Active Destination Filter Badge (if focused) */}
        {focusedDestination && (
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-sky-950/60 border border-sky-800/80 text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <Globe className="w-3 h-3 text-sky-400 shrink-0" />
              <span className="text-sky-200 font-semibold truncate text-[11px]">
                {focusedDestination.name}
              </span>
            </div>
            {onClearDestinationFilter && (
              <button
                onClick={onClearDestinationFilter}
                className="text-[10px] text-sky-400 hover:text-white hover:underline shrink-0 ml-1"
                title="Show all destinations"
              >
                All
              </button>
            )}
          </div>
        )}

        {/* City Filter & Search Row */}
        <div className="flex items-center gap-1.5">
          {uniqueCities.length > 1 && (
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              aria-label="Filter by City"
              className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:border-sky-500 focus:outline-none max-w-[110px] truncate"
            >
              <option value="all">All Cities</option>
              {uniqueCities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search places, forts, cafes..."
              className="w-full pl-7 pr-6 py-1.5 rounded-lg bg-slate-900 border border-slate-800 focus:border-sky-500 focus:outline-none text-xs text-white placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-800 text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`flex-1 py-1 rounded-md font-medium text-center transition-colors text-[11px] ${
              selectedCategory === 'all'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({counts.all})
          </button>
          <button
            onClick={() => setSelectedCategory('sightseeing')}
            className={`flex-1 py-1 rounded-md font-medium text-center transition-colors text-[11px] ${
              selectedCategory === 'sightseeing'
                ? 'bg-sky-600 text-white font-semibold'
                : 'text-slate-400 hover:text-sky-300'
            }`}
          >
            Sight ({counts.sightseeing})
          </button>
          <button
            onClick={() => setSelectedCategory('activity')}
            className={`flex-1 py-1 rounded-md font-medium text-center transition-colors text-[11px] ${
              selectedCategory === 'activity'
                ? 'bg-amber-600 text-white font-semibold'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            Activity ({counts.activity})
          </button>
          <button
            onClick={() => setSelectedCategory('experience')}
            className={`flex-1 py-1 rounded-md font-medium text-center transition-colors text-[11px] ${
              selectedCategory === 'experience'
                ? 'bg-purple-600 text-white font-semibold'
                : 'text-slate-400 hover:text-purple-300'
            }`}
          >
            Exper. ({counts.experience})
          </button>
        </div>
      </div>

      {/* Locations List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading places...</div>
        ) : filteredLocations.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400 px-4">
            <p>No places found in this view.</p>
            <button
              onClick={onOpenAddModal}
              className="mt-3 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs inline-flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Spot Here</span>
            </button>
          </div>
        ) : (
          filteredLocations.map((location) => (
            <LocationCard
              key={location._id || location.id || location.name}
              location={location}
              isSelected={Boolean(
                selectedLocation?.name === location.name ||
                (selectedLocation?._id && selectedLocation?._id === location._id)
              )}
              onSelect={onSelectLocation}
              onAddToItinerary={onAddToItinerary}
              availableDays={availableDays}
              selectedDay={selectedDay}
            />
          ))
        )}
      </div>
    </div>
  );
};
