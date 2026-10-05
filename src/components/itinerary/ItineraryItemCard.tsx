'use client';

import React, { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { ItineraryItem } from '@/types/itinerary';
import { GripVertical, Trash2, Clock, Edit3, Check } from 'lucide-react';

interface ItineraryItemCardProps {
  item: ItineraryItem;
  index: number;
  onRemove: (itemId: string) => void;
  onUpdate: (itemId: string, updates: Partial<ItineraryItem>) => void;
  onFocusLocation: (location: any) => void;
}

export const ItineraryItemCard: React.FC<ItineraryItemCardProps> = ({
  item,
  index,
  onRemove,
  onUpdate,
  onFocusLocation,
}) => {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(item.notes || '');
  const [timeSlot, setTimeSlot] = useState(item.timeSlot || '');
  const [isEditingTime, setIsEditingTime] = useState(false);

  const loc = item.location;

  const saveNotes = () => {
    onUpdate(item.id, { notes });
    setIsEditingNotes(false);
  };

  const saveTime = () => {
    onUpdate(item.id, { timeSlot });
    setIsEditingTime(false);
  };

  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`rounded-xl border transition-all mb-2 ${
            snapshot.isDragging
              ? 'bg-slate-800 border-sky-400 shadow-xl scale-[1.01] z-50'
              : 'bg-slate-900/90 hover:bg-slate-800/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="p-2.5">
            <div className="flex items-start gap-2">
              {/* Drag Handle */}
              <div
                {...provided.dragHandleProps}
                className="mt-1 p-0.5 text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing rounded"
                title="Drag to reorder"
              >
                <GripVertical className="w-4 h-4" />
              </div>

              {/* Sequence number */}
              <div className="w-5 h-5 rounded-full bg-slate-800 text-sky-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 font-mono">
                {index + 1}
              </div>

              {/* Title & info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h4
                    onClick={() => onFocusLocation(loc)}
                    className="text-xs font-semibold text-white hover:text-sky-400 cursor-pointer truncate"
                  >
                    {loc.name}
                  </h4>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  {/* Time Editor */}
                  {isEditingTime ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={timeSlot}
                        onChange={(e) => setTimeSlot(e.target.value)}
                        placeholder="09:00 AM"
                        className="px-1.5 py-0.5 text-[10px] rounded bg-slate-800 border border-sky-500 text-white w-20 focus:outline-none"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && saveTime()}
                      />
                      <button onClick={saveTime} className="text-emerald-400 hover:text-emerald-300">
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsEditingTime(true)}
                      className="flex items-center gap-1 hover:text-slate-200 text-slate-400 text-[10px]"
                    >
                      <Clock className="w-2.5 h-2.5 text-amber-400" />
                      <span>{item.timeSlot || 'Set time'}</span>
                    </button>
                  )}

                  {loc.estimatedCost ? (
                    <span className="text-emerald-400 text-[10px]">₹{loc.estimatedCost}</span>
                  ) : null}
                </div>
              </div>

              {/* Delete Button */}
              <button
                onClick={() => onRemove(item.id)}
                className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-colors"
                title="Remove stop"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Simple Note Section */}
            {isEditingNotes ? (
              <div className="mt-2 space-y-1">
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add note or instruction..."
                  className="w-full px-2 py-1 text-xs rounded bg-slate-800 border border-sky-500 text-slate-200 focus:outline-none"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && saveNotes()}
                />
                <div className="flex justify-end gap-1">
                  <button onClick={() => setIsEditingNotes(false)} className="text-[10px] text-slate-400 px-1">
                    Cancel
                  </button>
                  <button onClick={saveNotes} className="text-[10px] text-sky-400 font-semibold px-1">
                    Save
                  </button>
                </div>
              </div>
            ) : item.notes ? (
              <div
                onClick={() => setIsEditingNotes(true)}
                className="mt-1.5 text-[11px] text-slate-400 hover:text-slate-300 cursor-pointer bg-slate-950/40 px-2 py-1 rounded border border-slate-800/80 truncate"
              >
                {item.notes}
              </div>
            ) : (
              <button
                onClick={() => setIsEditingNotes(true)}
                className="mt-1 text-[10px] text-slate-500 hover:text-slate-400 flex items-center gap-1"
              >
                <Edit3 className="w-2.5 h-2.5" />
                <span>Add note</span>
              </button>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};
