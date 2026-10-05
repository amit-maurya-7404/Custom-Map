'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ItineraryPlan } from '@/types/itinerary';
import { calculateDistanceKm, formatDuration } from '@/lib/utils';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MapPin, 
  Car, 
  ArrowDown, 
  Share2, 
  Printer, 
  Calendar, 
  UserCheck, 
  MessageSquare, 
  ShieldCheck, 
  ArrowLeft,
  Loader2,
  Check,
  Send
} from 'lucide-react';
import Link from 'next/link';

function ReviewContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [plan, setPlan] = useState<ItineraryPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch itinerary by ID or load latest
  useEffect(() => {
    const fetchItinerary = async () => {
      setIsLoading(true);
      try {
        const url = id ? `/api/itineraries?id=${encodeURIComponent(id)}` : '/api/itineraries';
        const res = await fetch(url);
        const data = await res.json();

        if (data.success && data.data) {
          const loaded = Array.isArray(data.data) ? data.data[0] : data.data;
          if (loaded) {
            setPlan(loaded);
            if (loaded.reviewedBy) setReviewerName(loaded.reviewedBy);
            if (loaded.reviewRemarks) setReviewRemarks(loaded.reviewRemarks);
          }
        }
      } catch (err) {
        console.error('Failed to load itinerary:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItinerary();
  }, [id]);

  // Handle Senior Decision (Approve / Reject)
  const handleDecision = async (status: 'approved' | 'rejected') => {
    if (!plan) return;
    if (!reviewerName.trim()) {
      showToast('Please enter your Senior Reviewer Name.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const planId = plan._id || plan.id || id;
      const res = await fetch('/api/itineraries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: planId,
          approvalStatus: status,
          reviewedBy: reviewerName.trim(),
          reviewRemarks: reviewRemarks.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setPlan(data.data);
        showToast(
          status === 'approved'
            ? 'Itinerary APPROVED! Operations team has been notified.'
            : 'Revisions requested. Feedback sent to Operations team.',
          'success'
        );
      } else {
        // Fallback local update
        setPlan({
          ...plan,
          approvalStatus: status,
          reviewedBy: reviewerName.trim(),
          reviewRemarks: reviewRemarks.trim(),
          reviewedAt: new Date().toISOString(),
        });
        showToast(`Status updated to ${status.toUpperCase()}!`, 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to submit decision.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin mb-3" />
        <p className="text-sm font-semibold">Loading Itinerary Flowchart...</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 p-4">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center max-w-md">
          <p className="text-sm font-semibold text-white mb-2">No Itinerary Found</p>
          <p className="text-xs text-slate-400 mb-4">
            Please curate and save an itinerary from the Operations Dashboard first.
          </p>
          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go to Operations Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  // Calculate totals
  let totalStops = 0;
  let totalDurationMinutes = 0;
  let totalEstimatedCost = 0;
  let totalTripDistanceKm = 0;

  plan.days.forEach((day) => {
    day.items.forEach((item, index) => {
      totalStops += 1;
      totalDurationMinutes += item.durationMinutes || item.location.estimatedDuration || 60;
      totalEstimatedCost += item.location.estimatedCost || 0;
      if (index > 0) {
        const prev = day.items[index - 1].location;
        const curr = item.location;
        totalTripDistanceKm += calculateDistanceKm(prev.lat, prev.lng, curr.lat, curr.lng);
      }
    });
  });

  const status = plan.approvalStatus || 'pending_approval';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16 select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl text-xs font-semibold text-white">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Back to Operations Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                TRAVEL OPERATIONS PORTAL
              </span>
              <span>•</span>
              <span className="text-xs text-slate-400 font-medium">Senior Review Mode</span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-white font-['Outfit'] truncate max-w-md">
              {plan.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            title="Copy direct approval link for senior"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-sky-400" />}
            <span className="hidden sm:inline">{copiedLink ? 'Link Copied!' : 'Copy Review Link'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Print / PDF</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* ==================== SENIOR DECISION & STATUS BANNER ==================== */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            status === 'approved'
              ? 'bg-emerald-950/40 border-emerald-500/50 shadow-lg shadow-emerald-950/30'
              : status === 'rejected'
              ? 'bg-rose-950/40 border-rose-500/50 shadow-lg shadow-rose-950/30'
              : 'bg-slate-900 border-amber-500/40 shadow-xl'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-2xl ${
                  status === 'approved'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : status === 'rejected'
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {status === 'approved' ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : status === 'rejected' ? (
                  <XCircle className="w-6 h-6" />
                ) : (
                  <ShieldCheck className="w-6 h-6" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      status === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : status === 'rejected'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {status === 'approved'
                      ? '✓ Approved by Senior Operations'
                      : status === 'rejected'
                      ? '✕ Revisions Requested'
                      : '⏳ Pending Senior Decision'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Curated by: <strong className="text-slate-200">{plan.curatedBy || 'Operations Executive'}</strong>
                  {plan.reviewedBy && (
                    <> • Reviewed by: <strong className="text-white">{plan.reviewedBy}</strong></>
                  )}
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-4 text-xs font-mono bg-slate-950/60 px-4 py-2 rounded-xl border border-slate-800">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Days</span>
                <span className="text-sky-400 font-bold">{plan.days.length}</span>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Stops</span>
                <span className="text-purple-400 font-bold">{totalStops}</span>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Drive</span>
                <span className="text-amber-400 font-bold">~{totalTripDistanceKm.toFixed(1)} km</span>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Budget</span>
                <span className="text-emerald-400 font-bold">₹{totalEstimatedCost}</span>
              </div>
            </div>
          </div>

          {/* Senior Action Form (Approve / Reject Input) */}
          <div className="pt-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                  <span>Senior Reviewer Name / Title <span className="text-rose-400">*</span></span>
                </label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="e.g. Rahul Sharma (Operations Head)"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-sky-500 focus:outline-none text-xs text-white placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                  <span>Senior Feedback / Approval Remarks</span>
                </label>
                <input
                  type="text"
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  placeholder="e.g. Route and vendor pricing verified. Approved for client."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-sky-500 focus:outline-none text-xs text-white placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Decision Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleDecision('rejected')}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-400 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>Request Revisions / Reject</span>
              </button>

              <button
                type="button"
                onClick={() => handleDecision('approved')}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>✓ Approve Itinerary Plan</span>
              </button>
            </div>
          </div>
        </div>

        {/* ==================== DAY-WISE FLOWCHART ITINERARY ==================== */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
              <span>Day-Wise Operational Flowchart</span>
              <span className="text-xs text-slate-400 font-normal">
                ({plan.destination || 'Custom Destination'})
              </span>
            </h2>
          </div>

          {plan.days.map((day) => {
            let dayDistKm = 0;
            day.items.forEach((item, idx) => {
              if (idx > 0) {
                const prev = day.items[idx - 1].location;
                const curr = item.location;
                dayDistKm += calculateDistanceKm(prev.lat, prev.lng, curr.lat, curr.lng);
              }
            });

            return (
              <div
                key={day.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-md"
              >
                {/* Day Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 rounded-lg bg-sky-600 text-white font-bold text-xs font-mono shadow-sm">
                      DAY {day.dayNumber}
                    </span>
                    <h3 className="font-bold text-sm sm:text-base text-white">{day.title}</h3>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                    <span>{day.items.length} {day.items.length === 1 ? 'stop' : 'stops'}</span>
                    {dayDistKm > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-amber-400 flex items-center gap-1">
                          <Car className="w-3.5 h-3.5" />
                          ~{dayDistKm.toFixed(1)} km total drive
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Sequential Flowchart Nodes */}
                {day.items.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                    No stops scheduled for Day {day.dayNumber}.
                  </div>
                ) : (
                  <div className="space-y-0">
                    {day.items.map((item, idx) => {
                      const loc = item.location;
                      const nextItem = day.items[idx + 1];
                      const legDistanceKm = nextItem
                        ? calculateDistanceKm(loc.lat, loc.lng, nextItem.location.lat, nextItem.location.lng).toFixed(1)
                        : null;

                      const categoryStyle =
                        loc.category === 'sightseeing'
                          ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                          : loc.category === 'activity'
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : 'bg-purple-500/15 text-purple-400 border-purple-500/30';

                      return (
                        <React.Fragment key={item.id}>
                          {/* Flowchart Node Card */}
                          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 hover:border-slate-700 transition-all flex items-start justify-between gap-4 shadow-sm">
                            <div className="flex items-start gap-3.5">
                              {/* Sequence Badge */}
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-md">
                                {idx + 1}
                              </div>

                              <div className="space-y-1.5 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-bold text-sm text-white">{loc.name}</h4>
                                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${categoryStyle}`}>
                                    {loc.category}
                                  </span>
                                  {item.timeSlot && (
                                    <span className="text-[11px] text-amber-300 font-mono flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                      <Clock className="w-3 h-3" />
                                      {item.timeSlot}
                                    </span>
                                  )}
                                  <span className="text-[11px] text-slate-400 flex items-center gap-0.5">
                                    <MapPin className="w-3 h-3 text-slate-500" />
                                    {loc.city || ''}{loc.region ? `, ${loc.region}` : ''}
                                  </span>
                                </div>

                                {loc.description && (
                                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                                    {loc.description}
                                  </p>
                                )}

                                {item.notes && (
                                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-sky-300">
                                    💡 <strong>Ops Note:</strong> {item.notes}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Right Pricing & Duration */}
                            <div className="text-right shrink-0 text-xs space-y-1">
                              <div className="font-bold text-emerald-400 font-mono text-sm">
                                {loc.estimatedCost ? `₹${loc.estimatedCost}` : 'Free'}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {item.durationMinutes ? `${Math.floor(item.durationMinutes / 60)}h ${item.durationMinutes % 60 ? `${item.durationMinutes % 60}m` : ''}` : '1h duration'}
                              </div>
                            </div>
                          </div>

                          {/* Inter-Stop Drive Flow Connector */}
                          {nextItem && (
                            <div className="flex items-center justify-center py-2 text-xs text-slate-400 font-mono">
                              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-[11px] shadow-sm">
                                <ArrowDown className="w-3 h-3 text-sky-400 animate-bounce" />
                                <Car className="w-3 h-3 text-amber-400" />
                                <span>Drive ~{legDistanceKm} km (~{Math.max(5, Math.round(Number(legDistanceKm) * 3))} mins) to Next Stop</span>
                              </div>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>}>
      <ReviewContent />
    </Suspense>
  );
}
