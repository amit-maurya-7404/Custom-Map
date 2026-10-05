import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LocationCategory } from '@/types/location';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculates distance between two coordinates in kilometers using Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

/**
 * Returns consistent visual theme styling for each category
 */
export function getCategoryConfig(category: LocationCategory) {
  switch (category) {
    case 'sightseeing':
      return {
        label: 'Sightseeing',
        bg: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
        badgeBg: 'bg-sky-500 text-white',
        border: 'border-sky-500',
        markerColor: '#0ea5e9',
        textColor: 'text-sky-400',
        glow: 'shadow-[0_0_12px_rgba(14,165,233,0.4)]',
        accentBg: 'bg-sky-500',
      };
    case 'activity':
      return {
        label: 'Activity',
        bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        badgeBg: 'bg-amber-500 text-white',
        border: 'border-amber-500',
        markerColor: '#f59e0b',
        textColor: 'text-amber-400',
        glow: 'shadow-[0_0_12px_rgba(245,158,11,0.4)]',
        accentBg: 'bg-amber-500',
      };
    case 'experience':
      return {
        label: 'Experience',
        bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
        badgeBg: 'bg-purple-500 text-white',
        border: 'border-purple-500',
        markerColor: '#8b5cf6',
        textColor: 'text-purple-400',
        glow: 'shadow-[0_0_12px_rgba(139,92,246,0.4)]',
        accentBg: 'bg-purple-500',
      };
    default:
      return {
        label: category,
        bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
        badgeBg: 'bg-slate-500 text-white',
        border: 'border-slate-500',
        markerColor: '#64748b',
        textColor: 'text-slate-400',
        glow: 'shadow-[0_0_12px_rgba(100,116,139,0.4)]',
        accentBg: 'bg-slate-500',
      };
  }
}

/**
 * Format minutes to human readable string (e.g. 90 -> "1h 30m")
 */
export function formatDuration(minutes?: number): string {
  if (!minutes) return '1h';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}m`;
}
