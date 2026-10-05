'use client';

import React, { useState, useMemo } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { ItineraryDay, ItineraryItem } from '@/types/itinerary';
import { ILocation } from '@/types/location';
import { ItineraryItemCard } from './ItineraryItemCard';
import { calculateDistanceKm } from '@/lib/utils';
import { Trash2, Check, Edit2, Zap, Sparkles, Plus, MapPin } from 'lucide-react';

interface DayColumnProps {
  day: ItineraryDay;
  isActive: boolean;
  onActivate: () => void;
  onRemoveItem: (dayId: string, itemId: string) => void;
  onUpdateItem: (dayId: string, itemId: string, updates: Partial<ItineraryItem>) => void;
  onUpdateDay: (dayId: string, updates: Partial<ItineraryDay>) => void;
  onDeleteDay: (dayId: string) => void;
  onOptimizeRoute: (dayId: string) => void;
  onFocusLocation: (loc: any) => void;
  allLocations?: ILocation[];
  onAddToDay?: (loc: ILocation, dayNumber: number) => void;
}

export const DayColumn: React.FC<DayColumnProps> = ({
  day,
  isActive,
  onActivate,
  onRemoveItem,
  onUpdateItem,
  onUpdateDay,
  onDeleteDay,
  onOptimizeRoute,
  onFocusLocation,
  allLocations = [],
  onAddToDay,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(day.title);

  // Compute Total Distance
  const totalDistanceKm = useMemo(() => {
    let dist = 0;
    day.items.forEach((item, index) => {
      if (index > 0) {
        const prev = day.items[index - 1].location;
        const curr = item.location;
        dist += calculateDistanceKm(prev.lat, prev.lng, curr.lat, curr.lng);
      }
    });
    return Number(dist.toFixed(1));
  }, [day.items]);

  // Compute 2-3 Smart Nearby Suggestions based on the last added stop
  const nearbySuggestions = useMemo(() => {
    if (day.items.length === 0 || allLocations.length === 0) return [];

    const lastItem = day.items[day.items.length - 1];
    const existingIds = new Set(
      day.items.map((it) => it.location._id || it.location.id || it.location.name)
    );

    const candidates = allLocations
      .filter((loc) => {
        const id = loc._id || loc.id || loc.name;
        return !existingIds.has(id);
      })
      .map((loc) => {
        const dist = calculateDistanceKm(
          lastItem.location.lat,
          lastItem.location.lng,
          loc.lat,
          loc.lng
        );
        return {
          location: loc,
          distanceKm: Number(dist.toFixed(1)),
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 3); // Take top 3 closest spots

    return candidates;
  }, [day.items, allLocations]);

  const saveTitle = () => {
    onUpdateDay(day.id, { title: title.trim() || `Day ${day.dayNumber}` });
    setIsEditingTitle(false);
  };

  const handleClearDay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (day.items.length === 0) return;
    if (confirm(`Clear all ${day.items.length} stops from Day ${day.dayNumber}?`)) {
      onUpdateDay(day.id, { items: [] });
    }
  };

  return (
    <div
      onClick={onActivate}
      className={`rounded-xl border transition-all overflow-hidden ${
        isActive
          ? 'bg-slate-950 border-sky-500/50 shadow-sm'
          : 'bg-slate-950 border-slate-800'
      }`}
    >
      {/* Day Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="px-2 py-0.5 rounded bg-sky-600 text-white text-xs font-bold font-mono">
            Day {day.dayNumber}
          </span>

          {isEditingTitle ? (
            <div className="flex items-center gap-1 flex-1 mr-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="px-2 py-0.5 text-xs rounded bg-slate-800 border border-sky-500 text-white w-full focus:outline-none"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
              />
              <button onClick={saveTitle} className="text-emerald-400 p-1">
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => setIsEditingTitle(true)}
              className="flex items-center gap-1.5 cursor-pointer group flex-1 min-w-0"
            >
              <h3 className="text-xs font-semibold text-white group-hover:text-sky-400 truncate">
                {day.title}
              </h3>
              <Edit2 className="w-3 h-3 text-slate-500 group-hover:text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>{day.items.length} {day.items.length === 1 ? 'stop' : 'stops'}</span>
          {totalDistanceKm > 0 && <span>• {totalDistanceKm} km</span>}

          {day.items.length > 0 && (
            <button
              onClick={handleClearDay}
              className="text-slate-500 hover:text-amber-400 p-1 rounded text-[11px]"
              title="Clear all stops from this day"
            >
              Clear
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteDay(day.id);
            }}
            className="text-slate-500 hover:text-rose-400 p-1 rounded"
            title="Delete Day"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Optimize Route Button */}
      {day.items.length > 2 && (
        <div className="px-3 pt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOptimizeRoute(day.id);
            }}
            className="w-full flex items-center justify-center gap-1 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-medium transition-colors"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Sort by shortest travel distance</span>
          </button>
        </div>
      )}

      {/* Droppable Area for Day Items */}
      <Droppable droppableId={day.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`p-2.5 min-h-[90px] transition-colors ${
              snapshot.isDraggingOver ? 'bg-slate-900/50' : ''
            }`}
          >
            {day.items.length === 0 ? (
              <div className="h-20 border border-dashed border-slate-800 rounded-lg flex items-center justify-center text-center p-3 text-xs text-slate-500">
                Schedule is empty. Click "+ Add to Day {day.dayNumber}" on any place to curate.
              </div>
            ) : (
              day.items.map((item, index) => (
                <ItineraryItemCard
                  key={item.id}
                  item={item}
                  index={index}
                  onRemove={(itemId) => onRemoveItem(day.id, itemId)}
                  onUpdate={(itemId, updates) =>
                    onUpdateItem(day.id, itemId, updates)
                  }
                  onFocusLocation={onFocusLocation}
                />
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* ==================== SMART NEARBY PROXIMITY SUGGESTIONS ==================== */}
      {nearbySuggestions.length > 0 && (
        <div className="m-2.5 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Nearby Suggestions (Near {day.items[day.items.length - 1].location.name})</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Click + to add</span>
          </div>

          <div className="space-y-1.5">
            {nearbySuggestions.map(({ location, distanceKm }) => {
              const categoryColor =
                location.category === 'sightseeing'
                  ? 'text-sky-400 border-sky-500/30'
                  : location.category === 'activity'
                  ? 'text-amber-400 border-amber-500/30'
                  : 'text-purple-400 border-purple-500/30';

              return (
                <div
                  key={location._id || location.id || location.name}
                  className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950 border border-slate-800/70 hover:border-slate-700 transition-colors gap-2"
                >
                  <div
                    onClick={() => onFocusLocation(location)}
                    className="min-w-0 flex-1 cursor-pointer"
                  >
                    <div className="text-xs font-semibold text-white truncate hover:text-sky-300">
                      {location.name}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className={`capitalize font-medium ${categoryColor}`}>
                        {location.category}
                      </span>
                      <span>•</span>
                      <span className="text-emerald-400 font-mono flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5" />
                        {distanceKm} km away
                      </span>
                    </div>
                  </div>

                  {onAddToDay && (
                    <button
                      onClick={() => onAddToDay(location, day.dayNumber)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-colors shadow-sm"
                      title={`Add ${location.name} to Day ${day.dayNumber}`}
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
