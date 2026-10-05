'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ILocation, DestinationGeocode } from '@/types/location';
import { ItineraryDay } from '@/types/itinerary';
import { Navigation, Maximize2, Sun, Moon, Globe, Compass } from 'lucide-react';

interface GoogleMapAreaProps {
  locations: ILocation[];
  selectedLocation: ILocation | null;
  onSelectLocation: (loc: ILocation | null) => void;
  activeDay: ItineraryDay | null;
  onAddToItinerary: (loc: ILocation, dayNumber?: number) => void;
  selectedDayNumber: number;
  availableDays: number[];
  focusedDestination?: DestinationGeocode | null;
}

export const GoogleMapArea: React.FC<GoogleMapAreaProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  activeDay,
  onAddToItinerary,
  selectedDayNumber,
  focusedDestination,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const polylineRef = useRef<any>(null);
  const segmentLinesRef = useRef<any[]>([]);
  const tileLayerRef = useRef<any>(null);
  const hasInitialFitRef = useRef<boolean>(false);

  const [mapStyle, setMapStyle] = useState<'streets' | 'dark' | 'satellite'>('streets');
  const [showRoute, setShowRoute] = useState(true);
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);

  // Load Leaflet JS dynamically from CDN
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ((window as any).L) {
      setIsLeafletLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    script.onload = () => {
      setIsLeafletLoaded(true);
    };
    document.body.appendChild(script);
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!isLeafletLoaded || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    if (!mapInstanceRef.current) {
      // Default to All India Overview
      const defaultIndiaCenter: [number, number] = [22.5937, 78.9629];
      const initialCenter: [number, number] = focusedDestination
        ? [focusedDestination.lat, focusedDestination.lng]
        : defaultIndiaCenter;
      const initialZoom = focusedDestination && !focusedDestination.name.toLowerCase().includes('india') ? 12 : 5;

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: initialZoom,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Default Crisp Esri World Street Map
      const streetsLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '&copy; Esri World Street Map',
          maxZoom: 19,
        }
      );
      streetsLayer.addTo(map);
      tileLayerRef.current = streetsLayer;

      mapInstanceRef.current = map;

      // Fit bounds appropriately
      if (focusedDestination && focusedDestination.bbox && !focusedDestination.name.toLowerCase().includes('india')) {
        const [south, north, west, east] = focusedDestination.bbox;
        map.fitBounds(
          [
            [south, west],
            [north, east],
          ],
          { padding: [40, 40], maxZoom: 13 }
        );
      } else {
        map.setView(defaultIndiaCenter, 5);
      }

      setTimeout(() => map.invalidateSize(), 150);
      setTimeout(() => map.invalidateSize(), 500);
    }
  }, [isLeafletLoaded]);

  // Handle Dynamic Smooth Zoom & Pan whenever Focused Destination changes (from top navbar search)
  useEffect(() => {
    if (!mapInstanceRef.current || !isLeafletLoaded || !focusedDestination) return;
    const L = (window as any).L;
    if (!L) return;

    const map = mapInstanceRef.current;

    if (focusedDestination.bbox && focusedDestination.bbox.length === 4) {
      // bbox format: [south, north, west, east]
      const [south, north, west, east] = focusedDestination.bbox;
      map.fitBounds(
        [
          [south, west],
          [north, east],
        ],
        { padding: [50, 50], maxZoom: 14, animate: true, duration: 1.2 }
      );
    } else {
      map.flyTo([focusedDestination.lat, focusedDestination.lng], 12, {
        animate: true,
        duration: 1.5,
      });
    }
  }, [focusedDestination, isLeafletLoaded]);

  // Handle Container Resize
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });

    resizeObserver.observe(mapContainerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Handle Tile Style changes
  useEffect(() => {
    if (!mapInstanceRef.current || !isLeafletLoaded) return;
    const L = (window as any).L;
    if (!L) return;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    let newLayer;
    if (mapStyle === 'satellite') {
      newLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '&copy; Esri Satellite Imagery',
          maxZoom: 19,
        }
      );
    } else if (mapStyle === 'dark') {
      newLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '&copy; Esri Dark Map',
          maxZoom: 16,
        }
      );
    } else {
      newLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '&copy; Esri World Street Map',
          maxZoom: 19,
        }
      );
    }

    newLayer.addTo(mapInstanceRef.current);
    tileLayerRef.current = newLayer;
    mapInstanceRef.current.invalidateSize();
  }, [mapStyle, isLeafletLoaded]);

  // Fit view to all visible locations
  const handleFitAllBounds = () => {
    if (!mapInstanceRef.current || !isLeafletLoaded || !locations || locations.length === 0) return;
    const L = (window as any).L;
    if (!L) return;

    const validPoints = locations
      .filter((l) => l && typeof l.lat === 'number' && !isNaN(l.lat) && typeof l.lng === 'number' && !isNaN(l.lng))
      .map((l) => [l.lat, l.lng] as [number, number]);

    if (validPoints.length === 0) return;

    const bounds = L.latLngBounds(validPoints);
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 13, animate: true });
  };

  // Fit view to active day's stops
  const handleFitDayBounds = () => {
    if (!mapInstanceRef.current || !isLeafletLoaded || !activeDay || !activeDay.items || activeDay.items.length === 0) {
      handleFitAllBounds();
      return;
    }
    const L = (window as any).L;
    if (!L) return;

    const validPoints = activeDay.items
      .filter(
        (it) =>
          it?.location &&
          typeof it.location.lat === 'number' &&
          !isNaN(it.location.lat) &&
          typeof it.location.lng === 'number' &&
          !isNaN(it.location.lng)
      )
      .map((it) => [it.location.lat, it.location.lng] as [number, number]);

    if (validPoints.length === 0) {
      handleFitAllBounds();
      return;
    }

    const bounds = L.latLngBounds(validPoints);
    mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 14, animate: true });
  };

  const selectedDayNumberRef = useRef(selectedDayNumber);
  selectedDayNumberRef.current = selectedDayNumber;

  const onAddToItineraryRef = useRef(onAddToItinerary);
  onAddToItineraryRef.current = onAddToItinerary;

  const onSelectLocationRef = useRef(onSelectLocation);
  onSelectLocationRef.current = onSelectLocation;

  // Update Markers & Day Route Polyline
  useEffect(() => {
    if (!mapInstanceRef.current || !isLeafletLoaded) return;
    const L = (window as any).L;
    if (!L) return;

    const map = mapInstanceRef.current;

    // Clear existing markers
    Object.values(markersRef.current).forEach((m: any) => {
      try {
        m.remove();
      } catch (e) {}
    });
    markersRef.current = {};

    // Clear existing polylines
    if (polylineRef.current) {
      try {
        map.removeLayer(polylineRef.current);
      } catch (e) {}
      polylineRef.current = null;
    }
    segmentLinesRef.current.forEach((seg: any) => {
      try {
        map.removeLayer(seg);
      } catch (e) {}
    });
    segmentLinesRef.current = [];

    // Active day sequence lookup map
    const dayStopMap = new Map<string, number>();
    if (activeDay && activeDay.items) {
      activeDay.items.forEach((item, index) => {
        if (!item?.location) return;
        const key = item.location._id || item.location.id || item.location.name;
        dayStopMap.set(key, index + 1);
      });
    }

    // Add Markers for all locations
    locations.forEach((loc) => {
      if (!loc || typeof loc.lat !== 'number' || isNaN(loc.lat) || typeof loc.lng !== 'number' || isNaN(loc.lng)) {
        return;
      }

      const locKey = loc._id || loc.id || loc.name;
      const stopNumber = dayStopMap.get(locKey);
      const isSelected = selectedLocation?.name === loc.name;

      const color =
        loc.category === 'sightseeing'
          ? '#0284c7' // Blue
          : loc.category === 'activity'
          ? '#d97706' // Orange/Amber
          : '#7c3aed'; // Purple

      const iconHtml = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          ${
            stopNumber !== undefined
              ? `<div style="position: absolute; top: -11px; right: -9px; background: #0284c7; color: #fff; font-weight: 800; font-size: 11px; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #ffffff; box-shadow: 0 3px 6px rgba(0,0,0,0.45); z-index: 30; animation: pulse 2s infinite;">${stopNumber}</div>`
              : ''
          }
          <div style="width: ${isSelected ? '32px' : '26px'}; height: ${isSelected ? '32px' : '26px'}; background: ${color}; border: ${isSelected ? '3px solid #38bdf8' : '2.5px solid #ffffff'}; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 10px; font-weight: bold; transition: all 0.2s;">
            ●
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: iconHtml,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        popupAnchor: [0, -13],
      });

      const marker = L.marker([loc.lat, loc.lng], { icon: customIcon }).addTo(map);

      // Bind dynamic popup generator function so it regenerates with current day and active listeners
      marker.bindPopup(
        () => {
          const popupContent = document.createElement('div');
          popupContent.className = 'p-2.5 text-slate-900 min-w-[220px] text-left';
          
          L.DomEvent.disableClickPropagation(popupContent);
          L.DomEvent.disableScrollPropagation(popupContent);

          const currentDayNum = selectedDayNumberRef.current;

          popupContent.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
              <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: ${color};">${loc.category}</span>
              <span style="font-size: 10px; color: #64748b;">${loc.city || ''}${loc.region ? `, ${loc.region}` : ''}</span>
            </div>
            <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px; line-height: 1.2;">
              ${loc.name}
            </div>
            ${loc.description ? `<div style="font-size: 11px; color: #475569; margin-bottom: 8px; line-height: 1.3;">${loc.description}</div>` : ''}
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: #64748b; margin-bottom: 8px; border-top: 1px solid #e2e8f0; padding-top: 4px;">
              <span>${loc.estimatedDuration ? `${Math.floor(loc.estimatedDuration / 60)}h ${loc.estimatedDuration % 60 ? `${loc.estimatedDuration % 60}m` : ''}` : '1h'}</span>
              <span style="font-weight: 600; color: #059669;">${loc.estimatedCost ? `₹${loc.estimatedCost}` : 'Free'}</span>
            </div>
            <button type="button" class="map-popup-add-btn" style="width: 100%; background: #0284c7; color: #fff; padding: 7px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; border: none; cursor: pointer; text-align: center; display: block; box-shadow: 0 1px 3px rgba(0,0,0,0.2); transition: background 0.15s;">
              + Add to Day ${currentDayNum}
            </button>
          `;

          const btn = popupContent.querySelector('.map-popup-add-btn') as HTMLButtonElement | null;
          if (btn) {
            L.DomEvent.disableClickPropagation(btn);
            L.DomEvent.disableScrollPropagation(btn);

            const handleAddClick = (e: any) => {
              if (e) {
                if (e.stopPropagation) e.stopPropagation();
                if (e.preventDefault) e.preventDefault();
              }
              onAddToItineraryRef.current(loc, selectedDayNumberRef.current);
              if (mapInstanceRef.current) {
                mapInstanceRef.current.closePopup();
              }
            };

            L.DomEvent.on(btn, 'click', handleAddClick);
            btn.onclick = handleAddClick;

            btn.onmouseenter = () => {
              btn.style.background = '#0369a1';
            };
            btn.onmouseleave = () => {
              btn.style.background = '#0284c7';
            };
          }

          return popupContent;
        },
        {
          closeButton: true,
          autoPan: true,
          autoPanPadding: [30, 30],
        }
      );

      marker.on('click', () => {
        onSelectLocationRef.current(loc);
      });

      markersRef.current[locKey] = marker;
    });

    // Draw route for active day
    if (showRoute && activeDay && activeDay.items && activeDay.items.length > 1) {
      const validLatLngs: [number, number][] = [];
      activeDay.items.forEach((it) => {
        if (
          it?.location &&
          typeof it.location.lat === 'number' &&
          !isNaN(it.location.lat) &&
          typeof it.location.lng === 'number' &&
          !isNaN(it.location.lng)
        ) {
          validLatLngs.push([it.location.lat, it.location.lng]);
        }
      });

      if (validLatLngs.length > 1) {
        try {
          const glowPolyline = L.polyline(validLatLngs, {
            color: '#0284c7',
            weight: 6,
            opacity: 0.35,
          }).addTo(map);
          segmentLinesRef.current.push(glowPolyline);

          const routePolyline = L.polyline(validLatLngs, {
            color: '#0284c7',
            weight: 3.5,
            opacity: 0.95,
            dashArray: '8, 6',
          }).addTo(map);
          polylineRef.current = routePolyline;
        } catch (err) {
          console.error('Error drawing polylines:', err);
        }
      }
    }
  }, [locations, activeDay, showRoute, selectedDayNumber, selectedLocation, isLeafletLoaded]);

  // Smooth pan to selected location
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedLocation || !isLeafletLoaded) return;
    if (
      typeof selectedLocation.lat !== 'number' ||
      isNaN(selectedLocation.lat) ||
      typeof selectedLocation.lng !== 'number' ||
      isNaN(selectedLocation.lng)
    ) {
      return;
    }

    const map = mapInstanceRef.current;
    map.setView([selectedLocation.lat, selectedLocation.lng], 14, { animate: true });

    const key = selectedLocation._id || selectedLocation.id || selectedLocation.name;
    const marker = markersRef.current[key];
    if (marker) {
      marker.openPopup();
    }
  }, [selectedLocation, isLeafletLoaded]);

  return (
    <div className="relative h-full w-full bg-slate-900 overflow-hidden select-none">
      {/* Top Map Toolbar */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex items-center justify-between pointer-events-none gap-2">
        {/* Left: Active Destination / Day indicator */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700 shadow-md rounded-lg p-1 text-xs text-white">
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
            <span className="font-semibold">
              {focusedDestination?.name
                ? `${focusedDestination.name}`
                : activeDay
                ? `Day ${activeDay.dayNumber}: ${activeDay.title}`
                : 'Global Map View'}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              ({locations.length} POIs)
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700 mx-0.5" />

          {/* Quick Focus Day Stops */}
          <button
            onClick={handleFitDayBounds}
            className="px-2 py-1 rounded hover:bg-slate-800 text-sky-400 text-xs font-medium flex items-center gap-1"
            title="Fit view to current stops"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Fit Stops</span>
          </button>
        </div>

        {/* Right: Map Style Switcher & Route Toggle */}
        <div className="pointer-events-auto flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-lg p-1 shadow-md text-xs">
          <button
            onClick={() => setMapStyle('streets')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
              mapStyle === 'streets' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
            title="Clean Street Map"
          >
            <Sun className="w-3 h-3" />
            <span>Street</span>
          </button>

          <button
            onClick={() => setMapStyle('dark')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
              mapStyle === 'dark' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
            title="Sleek Dark Mode Map"
          >
            <Moon className="w-3 h-3" />
            <span>Dark</span>
          </button>

          <button
            onClick={() => setMapStyle('satellite')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
              mapStyle === 'satellite' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
            title="High-Resolution Satellite Imagery"
          >
            <Globe className="w-3 h-3" />
            <span>Satellite</span>
          </button>

          <div className="h-4 w-px bg-slate-700 mx-0.5" />

          {/* Route toggle */}
          <button
            onClick={() => setShowRoute(!showRoute)}
            className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-colors ${
              showRoute ? 'text-sky-400 bg-sky-500/15' : 'text-slate-400'
            }`}
            title="Toggle Sequential Day Route"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Route</span>
          </button>
        </div>
      </div>

      {/* Real Map DOM Container */}
      <div ref={mapContainerRef} className="h-full w-full z-0" />

      {/* Map Legend Footer */}
      <div className="absolute bottom-3 left-3 z-[400] pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-900/90 backdrop-blur-md border border-slate-700 shadow-md text-[11px] text-slate-300">
          <span className="font-bold text-slate-400 uppercase text-[10px]">Legend:</span>
          <span className="flex items-center gap-1 text-sky-400">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-600" /> Sightseeing
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600" /> Activity
          </span>
          <span className="flex items-center gap-1 text-purple-400">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600" /> Experience
          </span>
        </div>
      </div>
    </div>
  );
};
