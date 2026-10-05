'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { ILocation, DestinationGeocode } from '@/types/location';
import { ItineraryPlan, ItineraryItem } from '@/types/itinerary';
import { Header } from '@/components/layout/Header';
import { LocationExplorer } from '@/components/explorer/LocationExplorer';
import { AddLocationModal } from '@/components/explorer/AddLocationModal';
import { ExportModal } from '@/components/itinerary/ExportModal';
import { ALL_INITIAL_LOCATIONS } from '@/lib/destinations-data';
import { 
  CheckCircle2, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  Calendar
} from 'lucide-react';

// Dynamic client-only map component
const GoogleMapArea = dynamic(
  () => import('@/components/map/GoogleMapArea').then((mod) => mod.GoogleMapArea),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-slate-900 flex items-center justify-center text-slate-400 text-sm">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400">Loading Map View...</span>
        </div>
      </div>
    ),
  }
);

// Dynamic client-only itinerary builder component
const ItineraryBuilder = dynamic(
  () => import('@/components/itinerary/ItineraryBuilder').then((mod) => mod.ItineraryBuilder),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
        Loading Schedule...
      </div>
    ),
  }
);

// Clean initial empty itinerary for Operations curation
const INITIAL_OPERATIONS_PLAN: ItineraryPlan = {
  title: 'India Custom Operation Itinerary',
  destination: 'India (All Destinations)',
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

export default function DashboardPage() {
  const [locations, setLocations] = useState<ILocation[]>(ALL_INITIAL_LOCATIONS);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [dataSource, setDataSource] = useState<string>('mongodb');
  const [selectedLocation, setSelectedLocation] = useState<ILocation | null>(null);

  // Active Destination Focus - Default: India View on first load & refresh
  const [focusedDestination, setFocusedDestination] = useState<DestinationGeocode | null>({
    name: 'India Overview',
    displayName: 'India (All Destinations)',
    lat: 22.5937,
    lng: 78.9629,
    bbox: [8.0, 37.0, 68.0, 97.5],
    country: 'India',
  });

  // Sidebar Widths and Collapse States
  const [leftWidth, setLeftWidth] = useState(340);
  const [rightWidth, setRightWidth] = useState(380);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  // Resizing state references
  const isDraggingLeftRef = useRef(false);
  const isDraggingRightRef = useRef(false);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Manual Operations Itinerary Plan
  const [plan, setPlan] = useState<ItineraryPlan>(INITIAL_OPERATIONS_PLAN);
  const [selectedDayId, setSelectedDayId] = useState<string>('day-1');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch locations from API
  const fetchLocations = useCallback(async () => {
    setIsLoadingLocations(true);
    try {
      const res = await fetch('/api/locations');
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setLocations(data.data);
        setDataSource(data.source || 'mongodb');
      } else {
        setLocations(ALL_INITIAL_LOCATIONS);
      }
    } catch (err) {
      console.error('Failed to load locations:', err);
      setLocations(ALL_INITIAL_LOCATIONS);
    } finally {
      setIsLoadingLocations(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // Handle Drag Resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingLeftRef.current) {
        const newWidth = Math.max(220, Math.min(e.clientX, 600));
        setLeftWidth(newWidth);
      }
      if (isDraggingRightRef.current) {
        const newWidth = Math.max(260, Math.min(window.innerWidth - e.clientX, 650));
        setRightWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      isDraggingLeftRef.current = false;
      isDraggingRightRef.current = false;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const startResizeLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingLeftRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const startResizeRight = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRightRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  // Select Destination from Header Search / Presets (ONLY focuses Map & filter, NEVER auto-creates stops)
  const handleSelectDestination = (dest: DestinationGeocode) => {
    setFocusedDestination(dest);
    setPlan((prevPlan) => ({
      ...prevPlan,
      title: `${dest.name} Itinerary`,
      destination: dest.displayName || dest.name,
    }));
    showToast(`Focused map on ${dest.name}`, 'success');
  };

  // Add location manually to day
  const handleAddToItinerary = (loc: ILocation, dayNumber?: number) => {
    const targetDayNumber = dayNumber || 1;
    const targetDay = plan.days.find((d) => d.dayNumber === targetDayNumber) || plan.days[0];

    const newItem: ItineraryItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      location: loc,
      timeSlot: `${8 + targetDay.items.length * 2}:00 AM`,
      notes: loc.description || '',
      durationMinutes: loc.estimatedDuration || 60,
    };

    const newDays = plan.days.map((d) => {
      if (d.id === targetDay.id) {
        return {
          ...d,
          items: [...d.items, newItem],
        };
      }
      return d;
    });

    setPlan({ ...plan, days: newDays });
    setSelectedDayId(targetDay.id);
    showToast(`Added "${loc.name}" to Day ${targetDay.dayNumber}`, 'success');
  };

  // Save Itinerary
  const handleSaveItinerary = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/itineraries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setPlan(data.data);
        showToast(data.message || 'Itinerary saved successfully!', 'success');
        return data.data;
      } else {
        showToast('Saved to local state', 'success');
        return plan;
      }
    } catch (err) {
      console.error(err);
      showToast('Saved to local state', 'success');
      return plan;
    } finally {
      setIsSaving(false);
    }
  };

  // Generate & Copy Senior Approval Link
  const handleShareForApproval = async () => {
    const saved = await handleSaveItinerary();
    const planId = saved._id || saved.id || plan._id || plan.id || 'current';
    const reviewUrl = `${window.location.origin}/review?id=${encodeURIComponent(planId)}`;
    
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(reviewUrl);
      showToast('🔗 Senior Approval Link copied to clipboard!', 'success');
    }
  };

  // Create new location
  const handleLocationCreated = (newLoc: ILocation) => {
    setLocations((prev) => [newLoc, ...prev]);
    setSelectedLocation(newLoc);
    showToast(`Added "${newLoc.name}" (${newLoc.city || 'Global'}) to database`, 'success');
  };

  const activeDay = plan.days.find((d) => d.id === selectedDayId) || plan.days[0] || null;
  const availableDays = plan.days.map((d) => d.dayNumber);
  const selectedDayNumber = activeDay?.dayNumber || 1;
  const totalStops = plan.days.reduce((acc, d) => acc + d.items.length, 0);

  // Compute displayed locations based on focused destination
  const displayedLocations = useMemo(() => {
    if (!focusedDestination || focusedDestination.name.toLowerCase().includes('all')) {
      return locations;
    }
    const destName = focusedDestination.name.toLowerCase();
    const destCity = (focusedDestination.city || '').toLowerCase();
    const destRegion = (focusedDestination.region || '').toLowerCase();

    return locations.filter((loc) => {
      const locCity = (loc.city || '').toLowerCase();
      const locRegion = (loc.region || '').toLowerCase();

      return (
        (destCity && locCity.includes(destCity)) ||
        (locCity && destName.includes(locCity)) ||
        (destCity && destCity.includes(locCity)) ||
        (destRegion && locRegion.includes(destRegion) && !destCity)
      );
    });
  }, [locations, focusedDestination]);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl text-xs font-semibold text-white">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header with Global Search, Presets & Share Approval */}
      <Header
        tripTitle={plan.title}
        onTripTitleChange={(title) => setPlan((p) => ({ ...p, title }))}
        destination={plan.destination || 'India (All Destinations)'}
        currentDestinationName={focusedDestination?.name || 'India Overview'}
        totalLocations={locations.length}
        totalDays={plan.days.length}
        totalStops={totalStops}
        onAddLocationClick={() => setIsAddModalOpen(true)}
        onExportClick={() => setIsExportModalOpen(true)}
        onSaveItineraryClick={handleSaveItinerary}
        onSelectDestination={handleSelectDestination}
        onShareForApproval={handleShareForApproval}
        approvalStatus={plan.approvalStatus || 'pending_approval'}
        isSaving={isSaving}
        dataSource={dataSource}
      />

      {/* Senior Feedback Notification Banner (if revisions requested) */}
      {plan.approvalStatus === 'rejected' && plan.reviewRemarks && (
        <div className="bg-rose-950/80 border-b border-rose-800/80 px-4 py-2 flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>Senior Feedback from {plan.reviewedBy || 'Senior'}:</strong> &ldquo;{plan.reviewRemarks}&rdquo;
            </span>
          </div>
          <button
            onClick={() => window.open(`/review?id=${plan._id || plan.id}`, '_blank')}
            className="text-[11px] underline text-rose-200 hover:text-white font-semibold"
          >
            View Review Details ↗
          </button>
        </div>
      )}

      {/* Senior Approval Success Banner (if approved) */}
      {plan.approvalStatus === 'approved' && (
        <div className="bg-emerald-950/80 border-b border-emerald-800/80 px-4 py-2 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Itinerary Approved by {plan.reviewedBy || 'Senior Operations'}!</strong> Ready to dispatch to client.
            </span>
          </div>
          <button
            onClick={() => window.open(`/review?id=${plan._id || plan.id}`, '_blank')}
            className="text-[11px] underline text-emerald-200 hover:text-white font-semibold"
          >
            Open Approved Flowchart ↗
          </button>
        </div>
      )}

      {/* Main 3-Column Split Layout */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* ==================== LEFT COLUMN (Location Explorer) ==================== */}
        <div
          style={{ width: isLeftCollapsed ? 0 : `${leftWidth}px` }}
          className={`h-full shrink-0 flex flex-col z-10 transition-[width] duration-150 overflow-hidden relative ${
            isLeftCollapsed ? 'border-none' : 'border-r border-slate-800'
          }`}
        >
          <div className="w-full h-full min-w-[220px]">
            <LocationExplorer
              locations={locations}
              isLoading={isLoadingLocations}
              selectedLocation={selectedLocation}
              onSelectLocation={(loc) => setSelectedLocation(loc)}
              onAddToItinerary={handleAddToItinerary}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onRefresh={fetchLocations}
              availableDays={availableDays}
              selectedDay={selectedDayNumber}
              focusedDestination={focusedDestination}
              onClearDestinationFilter={() => setFocusedDestination(null)}
            />
          </div>
        </div>

        {/* Left Drag Resize Handle */}
        {!isLeftCollapsed && (
          <div
            onMouseDown={startResizeLeft}
            className="w-1.5 hover:w-2 bg-transparent hover:bg-sky-500/40 cursor-col-resize z-20 transition-all flex items-center justify-center group shrink-0"
            title="Drag to resize Places Sidebar"
          >
            <div className="h-8 w-0.5 bg-slate-700 group-hover:bg-sky-400 rounded" />
          </div>
        )}

        {/* Left Collapse / Expand Floating Toggle Button */}
        <button
          onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
          className="absolute z-30 top-14 p-1.5 rounded-r-lg bg-slate-900 hover:bg-slate-800 border border-l-0 border-slate-700 text-slate-300 shadow-lg transition-all"
          style={{ left: isLeftCollapsed ? 0 : `${leftWidth}px` }}
          title={isLeftCollapsed ? 'Open Places Sidebar' : 'Hide Places Sidebar'}
        >
          {isLeftCollapsed ? (
            <div className="flex items-center gap-1 text-[11px] font-semibold pr-1">
              <ChevronRight className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">Places ({locations.length})</span>
            </div>
          ) : (
            <ChevronLeft className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {/* ==================== MIDDLE COLUMN (HD Leaflet Global Map) ==================== */}
        <section className="flex-1 h-full relative z-0 min-w-0">
          <GoogleMapArea
            locations={displayedLocations.length > 0 ? displayedLocations : locations}
            selectedLocation={selectedLocation}
            onSelectLocation={(loc) => setSelectedLocation(loc)}
            activeDay={activeDay}
            onAddToItinerary={handleAddToItinerary}
            selectedDayNumber={selectedDayNumber}
            availableDays={availableDays}
            focusedDestination={focusedDestination}
          />
        </section>

        {/* Right Collapse / Expand Floating Toggle Button */}
        <button
          onClick={() => setIsRightCollapsed(!isRightCollapsed)}
          className="absolute z-30 top-14 p-1.5 rounded-l-lg bg-slate-900 hover:bg-slate-800 border border-r-0 border-slate-700 text-slate-300 shadow-lg transition-all"
          style={{ right: isRightCollapsed ? 0 : `${rightWidth}px` }}
          title={isRightCollapsed ? 'Open Itinerary Sidebar' : 'Hide Itinerary Sidebar'}
        >
          {isRightCollapsed ? (
            <div className="flex items-center gap-1 text-[11px] font-semibold pl-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Itinerary</span>
              <ChevronLeft className="w-4 h-4 text-amber-400" />
            </div>
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {/* Right Drag Resize Handle */}
        {!isRightCollapsed && (
          <div
            onMouseDown={startResizeRight}
            className="w-1.5 hover:w-2 bg-transparent hover:bg-amber-500/40 cursor-col-resize z-20 transition-all flex items-center justify-center group shrink-0"
            title="Drag to resize Itinerary Sidebar"
          >
            <div className="h-8 w-0.5 bg-slate-700 group-hover:bg-amber-400 rounded" />
          </div>
        )}

        {/* ==================== RIGHT COLUMN (Itinerary Builder for Operations) ==================== */}
        <div
          style={{ width: isRightCollapsed ? 0 : `${rightWidth}px` }}
          className={`h-full shrink-0 flex flex-col z-10 transition-[width] duration-150 overflow-hidden relative ${
            isRightCollapsed ? 'border-none' : 'border-l border-slate-800'
          }`}
        >
          <div className="w-full h-full min-w-[260px]">
            <ItineraryBuilder
              plan={plan}
              onUpdatePlan={(updatedPlan) => setPlan(updatedPlan)}
              selectedDayId={selectedDayId}
              onSelectDayId={(dayId) => setSelectedDayId(dayId)}
              onFocusLocation={(loc) => setSelectedLocation(loc)}
              onLoadSamplePlan={() => setPlan(INITIAL_OPERATIONS_PLAN)}
              allLocations={locations}
              onAddToDay={handleAddToItinerary}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      <AddLocationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onLocationCreated={handleLocationCreated}
        defaultCenter={
          focusedDestination
            ? { lat: focusedDestination.lat, lng: focusedDestination.lng }
            : { lat: 26.9124, lng: 75.8267 }
        }
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        plan={plan}
      />
    </div>
  );
}
