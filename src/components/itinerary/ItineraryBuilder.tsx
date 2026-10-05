'use client';

import React, { useState } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { ItineraryPlan, ItineraryDay, ItineraryItem } from '@/types/itinerary';
import { ILocation } from '@/types/location';
import { DayColumn } from './DayColumn';
import { calculateDistanceKm } from '@/lib/utils';
import { Plus, RotateCcw } from 'lucide-react';

interface ItineraryBuilderProps {
  plan: ItineraryPlan;
  onUpdatePlan: (updatedPlan: ItineraryPlan) => void;
  selectedDayId: string;
  onSelectDayId: (dayId: string) => void;
  onFocusLocation: (loc: any) => void;
  onLoadSamplePlan: () => void;
  allLocations?: ILocation[];
  onAddToDay?: (loc: ILocation, dayNumber: number) => void;
}

export const ItineraryBuilder: React.FC<ItineraryBuilderProps> = ({
  plan,
  onUpdatePlan,
  selectedDayId,
  onSelectDayId,
  onFocusLocation,
  allLocations = [],
  onAddToDay,
}) => {
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single');

  // Handle Drag & Drop
  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const newDays = [...plan.days];
    const sourceDayIndex = newDays.findIndex((d) => d.id === source.droppableId);
    const destDayIndex = newDays.findIndex((d) => d.id === destination.droppableId);

    if (sourceDayIndex === -1 || destDayIndex === -1) return;

    const sourceDay = { ...newDays[sourceDayIndex], items: [...newDays[sourceDayIndex].items] };
    const destDay =
      source.droppableId === destination.droppableId
        ? sourceDay
        : { ...newDays[destDayIndex], items: [...newDays[destDayIndex].items] };

    const [movedItem] = sourceDay.items.splice(source.index, 1);
    destDay.items.splice(destination.index, 0, movedItem);

    newDays[sourceDayIndex] = sourceDay;
    if (source.droppableId !== destination.droppableId) {
      newDays[destDayIndex] = destDay;
    }

    onUpdatePlan({ ...plan, days: newDays });
  };

  // Add Day
  const handleAddDay = () => {
    const nextDayNum = plan.days.length + 1;
    const newDay: ItineraryDay = {
      id: `day-${Date.now()}`,
      dayNumber: nextDayNum,
      title: `Day ${nextDayNum} Schedule`,
      items: [],
    };
    onUpdatePlan({ ...plan, days: [...plan.days, newDay] });
    onSelectDayId(newDay.id);
  };

  // Delete Day
  const handleDeleteDay = (dayId: string) => {
    if (plan.days.length <= 1) {
      alert('Itinerary must have at least one day.');
      return;
    }
    const filtered = plan.days.filter((d) => d.id !== dayId);
    const renumbered = filtered.map((d, idx) => ({
      ...d,
      dayNumber: idx + 1,
    }));
    onUpdatePlan({ ...plan, days: renumbered });
    if (selectedDayId === dayId && renumbered.length > 0) {
      onSelectDayId(renumbered[0].id);
    }
  };

  // Clear Entire Itinerary
  const handleClearEntireItinerary = () => {
    if (confirm('Clear all stops across all days and start with an empty itinerary?')) {
      const resetDays = plan.days.map((d) => ({ ...d, items: [] }));
      onUpdatePlan({ ...plan, days: resetDays });
    }
  };

  // Remove Item
  const handleRemoveItem = (dayId: string, itemId: string) => {
    const newDays = plan.days.map((d) => {
      if (d.id !== dayId) return d;
      return {
        ...d,
        items: d.items.filter((item) => item.id !== itemId),
      };
    });
    onUpdatePlan({ ...plan, days: newDays });
  };

  // Update Item
  const handleUpdateItem = (
    dayId: string,
    itemId: string,
    updates: Partial<ItineraryItem>
  ) => {
    const newDays = plan.days.map((d) => {
      if (d.id !== dayId) return d;
      return {
        ...d,
        items: d.items.map((item) =>
          item.id === itemId ? { ...item, ...updates } : item
        ),
      };
    });
    onUpdatePlan({ ...plan, days: newDays });
  };

  // Update Day
  const handleUpdateDay = (dayId: string, updates: Partial<ItineraryDay>) => {
    const newDays = plan.days.map((d) =>
      d.id === dayId ? { ...d, ...updates } : d
    );
    onUpdatePlan({ ...plan, days: newDays });
  };

  // Optimize Route
  const handleOptimizeRoute = (dayId: string) => {
    const targetDay = plan.days.find((d) => d.id === dayId);
    if (!targetDay || targetDay.items.length < 3) return;

    const unvisited = [...targetDay.items];
    const optimized: ItineraryItem[] = [];

    let current = unvisited.shift()!;
    optimized.push(current);

    while (unvisited.length > 0) {
      let nearestIndex = 0;
      let minDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const dist = calculateDistanceKm(
          current.location.lat,
          current.location.lng,
          unvisited[i].location.lat,
          unvisited[i].location.lng
        );
        if (dist < minDistance) {
          minDistance = dist;
          nearestIndex = i;
        }
      }

      current = unvisited.splice(nearestIndex, 1)[0];
      optimized.push(current);
    }

    const newDays = plan.days.map((d) =>
      d.id === dayId ? { ...d, items: optimized } : d
    );
    onUpdatePlan({ ...plan, days: newDays });
  };

  const activeDay = plan.days.find((d) => d.id === selectedDayId) || plan.days[0];
  const totalStops = plan.days.reduce((acc, d) => acc + d.items.length, 0);

  return (
    <div className="h-full flex flex-col bg-slate-950 border-l border-slate-800 w-full overflow-hidden select-none">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-bold text-white">Curate Itinerary</h2>
            {totalStops > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-sky-950 border border-sky-800 text-[10px] text-sky-400 font-mono">
                {totalStops} stops
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {totalStops > 0 && (
              <button
                onClick={handleClearEntireItinerary}
                className="p-1 rounded text-slate-500 hover:text-amber-400 hover:bg-slate-900 transition-colors"
                title="Clear all stops from itinerary"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setViewMode(viewMode === 'single' ? 'all' : 'single')}
              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800"
            >
              {viewMode === 'single' ? 'All Days' : 'Single'}
            </button>
            <button
              onClick={handleAddDay}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Day</span>
            </button>
          </div>
        </div>

        {/* Day Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
          {plan.days.map((day) => {
            const isSelected = day.id === selectedDayId;
            return (
              <button
                key={day.id}
                onClick={() => onSelectDayId(day.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                }`}
              >
                Day {day.dayNumber} ({day.items.length})
              </button>
            );
          })}
        </div>
      </div>

      {/* Itinerary content */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
        <DragDropContext onDragEnd={handleDragEnd}>
          {viewMode === 'single' ? (
            activeDay && (
              <DayColumn
                key={activeDay.id}
                day={activeDay}
                isActive={true}
                onActivate={() => onSelectDayId(activeDay.id)}
                onRemoveItem={handleRemoveItem}
                onUpdateItem={handleUpdateItem}
                onUpdateDay={handleUpdateDay}
                onDeleteDay={handleDeleteDay}
                onOptimizeRoute={handleOptimizeRoute}
                onFocusLocation={onFocusLocation}
                allLocations={allLocations}
                onAddToDay={onAddToDay}
              />
            )
          ) : (
            <div className="space-y-3">
              {plan.days.map((day) => (
                <DayColumn
                  key={day.id}
                  day={day}
                  isActive={day.id === selectedDayId}
                  onActivate={() => onSelectDayId(day.id)}
                  onRemoveItem={handleRemoveItem}
                  onUpdateItem={handleUpdateItem}
                  onUpdateDay={handleUpdateDay}
                  onDeleteDay={handleDeleteDay}
                  onOptimizeRoute={handleOptimizeRoute}
                  onFocusLocation={onFocusLocation}
                  allLocations={allLocations}
                  onAddToDay={onAddToDay}
                />
              ))}
            </div>
          )}
        </DragDropContext>
      </div>
    </div>
  );
};
