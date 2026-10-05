'use client';

import React, { useState } from 'react';
import { ItineraryPlan } from '@/types/itinerary';
import { formatDuration, calculateDistanceKm } from '@/lib/utils';
import { 
  X, 
  FileDown, 
  Printer, 
  Copy, 
  Check, 
  Calendar, 
  MapPin, 
  Clock, 
  DollarSign,
  Sparkles,
  ArrowDown,
  Car,
  CheckCircle2,
  FileCheck2,
  Share2
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: ItineraryPlan;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, plan }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'flowchart' | 'approval'>('flowchart');

  if (!isOpen) return null;

  // Calculate overall trip summary & total distance
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

  // Download JSON
  const handleDownloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(plan, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `${plan.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_itinerary.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Print / Save to PDF
  const handlePrint = () => {
    window.print();
  };

  // Copy Flowchart summary for WhatsApp / Email
  const handleCopyFlowchartText = () => {
    let text = `🧭 *TRAVELOPS ITINERARY & ROUTE PLAN*\n`;
    text += `📌 *Trip:* ${plan.title}\n`;
    text += `📍 *Destination:* ${plan.destination || 'Custom Destination'}\n`;
    text += `📊 *Summary:* ${plan.days.length} Days • ${totalStops} Stops • ~${totalTripDistanceKm.toFixed(1)} km • ₹${totalEstimatedCost}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    plan.days.forEach((day) => {
      text += `📅 *DAY ${day.dayNumber}: ${day.title}* (${day.items.length} Stops)\n`;
      if (day.items.length === 0) {
        text += `   _(No stops scheduled)_\n\n`;
      } else {
        day.items.forEach((item, idx) => {
          const loc = item.location;
          text += `  *${idx + 1}.* 📍 *${loc.name}* [${loc.category.toUpperCase()}]\n`;
          if (item.timeSlot) text += `     ⏰ ${item.timeSlot} | ⏳ ${item.durationMinutes || 60} mins\n`;
          if (loc.city) text += `     🏙️ ${loc.city}${loc.region ? `, ${loc.region}` : ''}\n`;
          if (loc.estimatedCost) text += `     💰 Cost: ₹${loc.estimatedCost}\n`;
          if (item.notes) text += `     💡 Note: ${item.notes}\n`;

          // Show distance to next stop
          if (idx < day.items.length - 1) {
            const nextLoc = day.items[idx + 1].location;
            const dist = calculateDistanceKm(loc.lat, loc.lng, nextLoc.lat, nextLoc.lng).toFixed(1);
            text += `     ⬇️ _(Drive: ~${dist} km to next stop)_\n`;
          }
        });
        text += `\n`;
      }
    });

    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `✅ *Prepared by:* Operations Team\n`;
    text += `🔍 *Status:* Pending Senior Review & Approval\n`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 shrink-0 bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sm">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
                <span>Operation Approval & Itinerary Flowchart</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] text-emerald-400 font-semibold">
                  Ready for Senior Sign-off
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Visual sequential timeline with travel distance breakdown, timings & approval block.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Tabs */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-slate-950/80 border-b border-slate-800 shrink-0">
          <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('flowchart')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                activeTab === 'flowchart'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📊 Day-Wise Flowchart View
            </button>
            <button
              onClick={() => setActiveTab('approval')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                activeTab === 'approval'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ✍️ Senior Approval Sheet
            </button>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-3">
            <span><strong>{plan.days.length}</strong> Days</span>
            <span>•</span>
            <span><strong>{totalStops}</strong> Stops</span>
            <span>•</span>
            <span><strong>~{totalTripDistanceKm.toFixed(1)}</strong> km Drive</span>
          </div>
        </div>

        {/* Scrollable Printable Flowchart Content */}
        <div id="printable-itinerary" className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Executive Header */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-sky-400">
                  TRAVEL OPERATIONS ITINERARY
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-white font-['Outfit'] mt-0.5">
                  {plan.title}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>{plan.destination || 'Custom Destination'}</span>
                </p>
              </div>

              <div className="text-right">
                <div className="text-xs font-semibold text-slate-300">
                  Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
                  Total Est. Budget: ₹{totalEstimatedCost}
                </div>
              </div>
            </div>
          </div>

          {/* Flowchart Tab */}
          {activeTab === 'flowchart' && (
            <div className="space-y-6">
              {plan.days.map((day) => {
                // Calculate day's total driving distance
                let dayDistKm = 0;
                day.items.forEach((item, idx) => {
                  if (idx > 0) {
                    const prev = day.items[idx - 1].location;
                    const curr = item.location;
                    dayDistKm += calculateDistanceKm(prev.lat, prev.lng, curr.lat, curr.lng);
                  }
                });

                return (
                  <div key={day.id} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                    {/* Day Banner */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-1 rounded-lg bg-sky-600 text-white font-bold text-xs font-mono shadow-sm">
                          DAY {day.dayNumber}
                        </span>
                        <h4 className="font-bold text-sm text-white">{day.title}</h4>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                        <span>{day.items.length} stops</span>
                        {dayDistKm > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-amber-400 flex items-center gap-1">
                              <Car className="w-3 h-3" />
                              ~{dayDistKm.toFixed(1)} km
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Flowchart Steps */}
                    {day.items.length === 0 ? (
                      <p className="text-xs italic text-slate-500 py-3 text-center">
                        No activities scheduled for Day {day.dayNumber}.
                      </p>
                    ) : (
                      <div className="space-y-0 relative">
                        {day.items.map((item, idx) => {
                          const loc = item.location;
                          const nextItem = day.items[idx + 1];
                          const legDistanceKm = nextItem
                            ? calculateDistanceKm(loc.lat, loc.lng, nextItem.location.lat, nextItem.location.lng).toFixed(1)
                            : null;

                          const categoryBadge =
                            loc.category === 'sightseeing'
                              ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                              : loc.category === 'activity'
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              : 'bg-purple-500/15 text-purple-400 border-purple-500/30';

                          return (
                            <React.Fragment key={item.id}>
                              {/* Flowchart Stop Node Card */}
                              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex items-start justify-between gap-3 shadow-sm">
                                <div className="flex items-start gap-3">
                                  {/* Step Circle */}
                                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-md">
                                    {idx + 1}
                                  </div>

                                  <div className="space-y-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-bold text-sm text-white">
                                        {loc.name}
                                      </span>
                                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${categoryBadge}`}>
                                        {loc.category}
                                      </span>
                                      {item.timeSlot && (
                                        <span className="text-[11px] text-amber-300 font-mono flex items-center gap-1 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                          <Clock className="w-3 h-3" />
                                          {item.timeSlot}
                                        </span>
                                      )}
                                    </div>

                                    {loc.description && (
                                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                                        {loc.description}
                                      </p>
                                    )}

                                    {item.notes && (
                                      <div className="mt-1 p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-sky-300">
                                        💡 <strong>Ops Note:</strong> {item.notes}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Right Meta */}
                                <div className="text-right shrink-0 text-xs space-y-1">
                                  <div className="font-bold text-emerald-400 font-mono">
                                    {loc.estimatedCost ? `₹${loc.estimatedCost}` : 'Free'}
                                  </div>
                                  <div className="text-[11px] text-slate-400">
                                    {item.durationMinutes ? `${Math.floor(item.durationMinutes / 60)}h ${item.durationMinutes % 60 ? `${item.durationMinutes % 60}m` : ''}` : '1h'}
                                  </div>
                                </div>
                              </div>

                              {/* Connecting Route Arrow & Drive Leg */}
                              {nextItem && (
                                <div className="flex items-center justify-center py-1.5 text-xs text-slate-400 font-mono">
                                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px]">
                                    <ArrowDown className="w-3 h-3 text-sky-400 animate-bounce" />
                                    <Car className="w-3 h-3 text-amber-400" />
                                    <span>Drive ~{legDistanceKm} km (~{Math.max(5, Math.round(Number(legDistanceKm) * 3))} mins)</span>
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
          )}

          {/* Approval Sign-Off Tab */}
          {activeTab === 'approval' && (
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-sm font-bold text-white">
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
                <span>Executive Operational Approval Matrix</span>
              </div>

              {/* Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-sky-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Route Feasibility</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Optimized shortest driving distances between sequential spots.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Vendor & Cost Check</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Total Estimated Budget: ₹{totalEstimatedCost} per person.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Timing & Safety</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Day closing times and daylight hours verified.
                  </p>
                </div>
              </div>

              {/* Senior Signature Blocks */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-xs">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-dashed border-slate-700 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Curated By (Operations Executive):
                  </span>
                  <div className="h-12 border-b border-slate-700 flex items-end pb-1 text-slate-200 font-semibold">
                    Operations Team Member
                  </div>
                  <span className="text-[10px] text-slate-500">Date: {new Date().toLocaleDateString('en-IN')}</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-dashed border-sky-500/40 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-sky-400 block">
                    Approved By (Senior Operations Head):
                  </span>
                  <div className="h-12 border-b border-slate-700 flex items-end pb-1 text-slate-400 italic">
                    [ Pending Senior Signature / Sign-off ]
                  </div>
                  <span className="text-[10px] text-slate-500">Status: Ready for Review</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-between p-4 bg-slate-950 border-t border-slate-800 shrink-0 gap-2 flex-wrap">
          <button
            onClick={handleCopyFlowchartText}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors shadow-sm"
            title="Copy formatted text with arrows for WhatsApp or Email"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-sky-400" />}
            <span>{copied ? 'Copied WhatsApp Flowchart!' : 'Copy WhatsApp / Email'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors shadow-sm"
              title="Print document or save as high-res PDF"
            >
              <Printer className="w-4 h-4 text-sky-400" />
              <span>Print / Download PDF</span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-sky-600/25 transition-all"
              title="Download raw operational JSON file"
            >
              <FileDown className="w-4 h-4" />
              <span>Download JSON Plan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
