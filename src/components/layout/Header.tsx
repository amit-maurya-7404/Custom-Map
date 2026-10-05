'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Plus, 
  FileDown, 
  Save, 
  Search, 
  Globe, 
  Compass, 
  ChevronDown, 
  X, 
  Loader2,
  Navigation,
  Share2,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { POPULAR_DESTINATIONS, DestinationPreset } from '@/lib/destinations-data';
import { DestinationGeocode } from '@/types/location';
import { ApprovalStatus } from '@/types/itinerary';
import { searchGlobalGeocode } from '@/lib/geocode';

interface HeaderProps {
  tripTitle: string;
  onTripTitleChange: (title: string) => void;
  destination: string;
  totalLocations: number;
  totalDays: number;
  totalStops: number;
  onAddLocationClick: () => void;
  onExportClick: () => void;
  onSaveItineraryClick: () => void;
  onSelectDestination: (dest: DestinationGeocode) => void;
  onShareForApproval?: () => void;
  currentDestinationName?: string;
  approvalStatus?: ApprovalStatus;
  isSaving?: boolean;
  dataSource?: string;
}

export const Header: React.FC<HeaderProps> = ({
  tripTitle,
  onTripTitleChange,
  destination,
  totalLocations,
  totalDays,
  totalStops,
  onAddLocationClick,
  onExportClick,
  onSaveItineraryClick,
  onSelectDestination,
  onShareForApproval,
  currentDestinationName = 'India Overview',
  approvalStatus = 'pending_approval',
  isSaving,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DestinationGeocode[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPresetMenuOpen, setIsPresetMenuOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const presetContainerRef = useRef<HTMLDivElement>(null);

  // Debounced live geocode search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchGlobalGeocode(searchQuery);
        setSearchResults(results);
        if (results.length > 0) {
          setIsDropdownOpen(true);
        }
      } catch (err) {
        console.error('Geocode search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (presetContainerRef.current && !presetContainerRef.current.contains(e.target as Node)) {
        setIsPresetMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectResult = (result: DestinationGeocode) => {
    onSelectDestination(result);
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const handleSelectPreset = (preset: DestinationPreset) => {
    onSelectDestination({
      name: preset.name,
      displayName: `${preset.name} (${preset.country})`,
      lat: preset.lat,
      lng: preset.lng,
      bbox: preset.bbox,
      city: preset.city,
      region: preset.region,
      country: preset.country,
    });
    setIsPresetMenuOpen(false);
  };

  const getStatusBadge = () => {
    if (approvalStatus === 'approved') {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] text-emerald-400 font-bold">
          <CheckCircle2 className="w-3 h-3" />
          <span>Approved</span>
        </span>
      );
    }
    if (approvalStatus === 'rejected') {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-[10px] text-rose-400 font-bold">
          <XCircle className="w-3 h-3" />
          <span>Revisions Requested</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] text-amber-400 font-semibold">
        <Clock className="w-3 h-3" />
        <span>Pending Review</span>
      </span>
    );
  };

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between z-40 sticky top-0 gap-2 select-none">
      {/* Brand & Trip Title */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Compass className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-white hidden xl:inline tracking-tight">
            TravelOps
          </span>
        </div>

        <div className="h-4 w-px bg-slate-800 mx-0.5 hidden sm:block" />

        {/* Editable Trip Title */}
        <input
          type="text"
          value={tripTitle}
          onChange={(e) => onTripTitleChange(e.target.value)}
          aria-label="Trip Title"
          placeholder="Trip Title..."
          className="bg-slate-950/60 hover:bg-slate-800/80 focus:bg-slate-900 text-xs sm:text-sm font-semibold text-white px-2.5 py-1 rounded-md border border-slate-800 focus:border-sky-500 focus:outline-none transition-colors max-w-[130px] sm:max-w-xs truncate"
        />

        {/* Live Approval Status Badge */}
        <div className="hidden lg:flex items-center">
          {getStatusBadge()}
        </div>
      </div>

      {/* ==================== GLOBAL DESTINATION SEARCH & FOCUS BAR ==================== */}
      <div className="flex-1 max-w-xl mx-2 relative flex items-center gap-1.5" ref={searchContainerRef}>
        {/* Preset Selector Dropdown */}
        <div className="relative shrink-0" ref={presetContainerRef}>
          <button
            onClick={() => setIsPresetMenuOpen(!isPresetMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700/80 hover:border-sky-500 text-xs font-semibold text-sky-400 hover:text-sky-300 transition-all shadow-inner"
            title="Switch Destination Preset"
          >
            <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="max-w-[100px] sm:max-w-[140px] truncate">
              {currentDestinationName}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>

          {/* Preset Menu */}
          {isPresetMenuOpen && (
            <div className="absolute left-0 mt-1.5 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1 z-50 animate-fadeIn">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                Popular Destinations
              </div>
              <div className="max-h-60 overflow-y-auto">
                {POPULAR_DESTINATIONS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-start gap-2.5 transition-colors group"
                  >
                    <Globe className="w-3.5 h-3.5 text-sky-400 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-sky-300">
                        {preset.name}
                      </div>
                      <div className="text-[10px] text-slate-400">{preset.subtitle}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Global Search Input */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchResults.length > 0) setIsDropdownOpen(true);
            }}
            placeholder="Search ANY City, State or Country globally..."
            className="w-full pl-8 pr-8 py-1.5 rounded-lg bg-slate-950 border border-slate-700/80 focus:border-sky-500 focus:outline-none text-xs text-white placeholder:text-slate-500 shadow-inner"
          />
          {isSearching && (
            <Loader2 className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-sky-400 animate-spin" />
          )}
          {searchQuery && !isSearching && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Search Autocomplete Results Dropdown */}
          {isDropdownOpen && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 max-h-72 overflow-y-auto">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                Global Destinations ({searchResults.length} Found)
              </div>
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectResult(item)}
                  className="w-full text-left px-3 py-2.5 hover:bg-slate-800/90 flex items-start gap-2.5 transition-colors group border-b border-slate-800/50 last:border-none"
                >
                  <Navigation className="w-3.5 h-3.5 text-sky-400 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white group-hover:text-sky-300 truncate">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {item.displayName}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Top Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {onShareForApproval && (
          <button
            onClick={onShareForApproval}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-all shadow-sm"
            title="Generate & Copy Senior Approval Link"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Share with Senior</span>
          </button>
        )}

        <button
          onClick={onAddLocationClick}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors shadow-sm"
          title="Add a new spot to database"
        >
          <Plus className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Add Place</span>
        </button>

        <button
          onClick={onSaveItineraryClick}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50"
          title="Save Itinerary"
        >
          <Save className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">{isSaving ? 'Saving...' : 'Save'}</span>
        </button>

        <button
          onClick={onExportClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition-all"
          title="Export Flowchart & PDF"
        >
          <FileDown className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
