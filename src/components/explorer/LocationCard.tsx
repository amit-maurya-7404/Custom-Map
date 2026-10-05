'use client';

import React, { useState } from 'react';
import { ILocation } from '@/types/location';
import { getCategoryConfig } from '@/lib/utils';
import { Plus, Check, Clock, MapPin } from 'lucide-react';

interface LocationCardProps {
  location: ILocation;
  isSelected?: boolean;
  onSelect: (location: ILocation) => void;
  onAddToItinerary: (location: ILocation, dayNumber?: number) => void;
  availableDays: number[];
  selectedDay: number;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  location,
  isSelected,
  onSelect,
  onAddToItinerary,
  availableDays,
  selectedDay,
}) => {
  const config = getCategoryConfig(location.category);
  const [showDayMenu, setShowDayMenu] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const handleQuickAdd = (e: React.MouseEvent, dayNum: number) => {
    e.stopPropagation();
    onAddToItinerary(location, dayNum);
    setShowDayMenu(false);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <div
      onClick={() => onSelect(location)}
      className={`rounded-xl p-3 transition-all cursor-pointer border text-left ${
        isSelected
          ? 'bg-slate-800 border-sky-500 shadow-md ring-1 ring-sky-500/50'
          : 'bg-slate-900 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Top row: Category tag & Location/Area */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
            location.category === 'sightseeing'
              ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
              : location.category === 'activity'
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              : 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
          }`}
        >
          {config.label}
        </span>

        {location.city && (
          <span className="text-[11px] text-slate-400 flex items-center gap-0.5">
            <MapPin className="w-3 h-3 text-slate-500" />
            {location.region ? location.region.split(',')[0] : location.city}
          </span>
        )}
      </div>

      {/* Place Title */}
      <h4 className="text-sm font-semibold text-white leading-snug mb-1">
        {location.name}
      </h4>

      {/* Short Description */}
      {location.description && (
        <p className="text-xs text-slate-400 line-clamp-2 mb-2.5 leading-relaxed">
          {location.description}
        </p>
      )}

      {/* Bottom Footer with clean Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 mt-1">
        <span className="text-[11px] text-slate-400 flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>{location.estimatedDuration ? `${Math.floor(location.estimatedDuration / 60)}h` : '1h'}</span>
          {location.estimatedCost ? (
            <span className="text-emerald-400 font-medium ml-1">₹{location.estimatedCost}</span>
          ) : (
            <span className="text-slate-400 ml-1">Free</span>
          )}
        </span>

        {/* Add to Day Button */}
        <div className="relative">
          <div className="flex items-center">
            <button
              onClick={(e) => handleQuickAdd(e, selectedDay)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-l-md text-xs font-semibold transition-colors ${
                justAdded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-sky-600 hover:bg-sky-500 text-white'
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3" />
                  <span>Add to Day {selectedDay}</span>
                </>
              )}
            </button>

            {availableDays.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDayMenu(!showDayMenu);
                }}
                className="px-1.5 py-1 rounded-r-md bg-sky-700 hover:bg-sky-600 text-white text-xs font-bold border-l border-sky-800"
                title="Select Day"
              >
                ▾
              </button>
            )}
          </div>

          {/* Day selection popup */}
          {showDayMenu && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 bottom-full mb-1 z-50 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 min-w-[110px] text-xs"
            >
              {availableDays.map((d) => (
                <button
                  key={d}
                  onClick={(e) => handleQuickAdd(e, d)}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-700 text-slate-200 text-xs flex items-center justify-between"
                >
                  <span>Day {d}</span>
                  {d === selectedDay && <span className="text-sky-400 text-[10px]">Active</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
