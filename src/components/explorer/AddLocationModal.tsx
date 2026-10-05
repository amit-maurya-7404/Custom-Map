'use client';

import React, { useState } from 'react';
import { LocationCategory, CreateLocationInput } from '@/types/location';
import { X, MapPin, Sparkles, Compass, Camera, AlertCircle, Search, Loader2 } from 'lucide-react';
import { searchGlobalGeocode } from '@/lib/geocode';

interface AddLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationCreated: (newLocation: any) => void;
  defaultCenter?: { lat: number; lng: number };
}

export const AddLocationModal: React.FC<AddLocationModalProps> = ({
  isOpen,
  onClose,
  onLocationCreated,
  defaultCenter = { lat: 26.9124, lng: 75.8267 },
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<LocationCategory>('sightseeing');
  const [lat, setLat] = useState<string>(defaultCenter.lat ? String(defaultCenter.lat) : '');
  const [lng, setLng] = useState<string>(defaultCenter.lng ? String(defaultCenter.lng) : '');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [country, setCountry] = useState('India');
  const [imageUrl, setImageUrl] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('60');
  const [estimatedCost, setEstimatedCost] = useState('0');
  const [tagsInput, setTagsInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Auto-geocode location name or query using Nominatim
  const handleAutoGeolocate = async () => {
    if (!name.trim() && !city.trim()) {
      setError('Please enter a location name or city to search coordinates.');
      return;
    }
    setError(null);
    setIsGeocoding(true);

    try {
      const query = [name.trim(), city.trim(), region.trim(), country.trim()]
        .filter(Boolean)
        .join(', ');

      const results = await searchGlobalGeocode(query);

      if (results.length > 0) {
        const top = results[0];
        setLat(String(top.lat));
        setLng(String(top.lng));
        if (top.city) setCity(top.city);
        if (top.region) setRegion(top.region);
        if (top.country) setCountry(top.country);
      } else {
        setError('Could not auto-detect exact coordinates. Please enter Lat/Lng manually.');
      }
    } catch (err: any) {
      console.error('Geocoding failed:', err);
      setError('Failed to auto-fetch coordinates.');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Location name is required');
      return;
    }

    const numLat = parseFloat(lat);
    const numLng = parseFloat(lng);

    if (isNaN(numLat) || numLat < -90 || numLat > 90) {
      setError('Latitude must be a valid number between -90 and 90');
      return;
    }

    if (isNaN(numLng) || numLng < -180 || numLng > 180) {
      setError('Longitude must be a valid number between -180 and 180');
      return;
    }

    setIsLoading(true);

    try {
      const payload: CreateLocationInput & { tags?: string[] } = {
        name: name.trim(),
        category,
        lat: numLat,
        lng: numLng,
        description: description.trim(),
        city: city.trim() || 'Jaipur',
        region: region.trim() || 'Rajasthan',
        country: country.trim() || 'India',
        imageUrl: imageUrl.trim() || undefined,
        estimatedDuration: parseInt(estimatedDuration) || 60,
        estimatedCost: parseFloat(estimatedCost) || 0,
        tags: tagsInput
          ? tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
      };

      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save location');
      }

      onLocationCreated(data.data);
      onClose();
      // Reset form
      setName('');
      setDescription('');
      setImageUrl('');
      setTagsInput('');
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating location');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-['Outfit']">
                Add Global POI / Destination Spot
              </h3>
              <p className="text-xs text-slate-400">
                Register a new Point of Interest anywhere in the world.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="my-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Location Name with Auto-Locate Button */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Place / Spot Name <span className="text-rose-400">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rohtang Pass, Solang Valley, Amber Fort, Eiffel Tower..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-sky-500 focus:outline-none text-sm text-white placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={handleAutoGeolocate}
                disabled={isGeocoding}
                className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors disabled:opacity-50"
                title="Auto-search coordinates and city"
              >
                {isGeocoding ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                <span>Auto-Locate</span>
              </button>
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Category <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <label
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  category === 'sightseeing'
                    ? 'bg-sky-500/15 border-sky-500 text-sky-400 ring-1 ring-sky-500/40'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value="sightseeing"
                  checked={category === 'sightseeing'}
                  onChange={() => setCategory('sightseeing')}
                  className="sr-only"
                />
                <Camera className="w-4 h-4" />
                <span className="text-xs font-semibold">Sightseeing</span>
              </label>

              <label
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  category === 'activity'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-400 ring-1 ring-amber-500/40'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value="activity"
                  checked={category === 'activity'}
                  onChange={() => setCategory('activity')}
                  className="sr-only"
                />
                <Compass className="w-4 h-4" />
                <span className="text-xs font-semibold">Activity</span>
              </label>

              <label
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  category === 'experience'
                    ? 'bg-purple-500/15 border-purple-500 text-purple-400 ring-1 ring-purple-500/40'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value="experience"
                  checked={category === 'experience'}
                  onChange={() => setCategory('experience')}
                  className="sr-only"
                />
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-semibold">Experience</span>
              </label>
            </div>
          </div>

          {/* Coordinates (Lat / Lng) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Latitude <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                step="any"
                required
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="e.g. 32.2483"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-sky-500 focus:outline-none text-sm text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Longitude <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                step="any"
                required
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="e.g. 77.1812"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-sky-500 focus:outline-none text-sm text-white font-mono"
              />
            </div>
          </div>

          {/* City, Region/State, Country */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">City / Town</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Manali"
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-sky-500 focus:outline-none text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">State / Region</label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g. Himachal Pradesh"
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-sky-500 focus:outline-none text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. India"
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-sky-500 focus:outline-none text-sm text-white"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Description & Highlights
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key attractions, timing, tips, or accessibility details..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-sky-500 focus:outline-none text-sm text-white resize-none"
            />
          </div>

          {/* Duration, Cost, Tags */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Duration (mins)</label>
              <input
                type="number"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-sky-500 focus:outline-none text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Est. Cost (₹)</label>
              <input
                type="number"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-sky-500 focus:outline-none text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tags (comma sep)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Trek, Scenic, Snow"
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-sky-500 focus:outline-none text-sm text-white"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-lg shadow-sky-500/25 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Saving Spot...' : 'Save Location'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
