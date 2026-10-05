import { ILocation } from './location';

export interface ItineraryItem {
  id: string; // unique item instance ID within day
  location: ILocation;
  timeSlot?: string; // e.g. "09:30 AM"
  notes?: string;
  durationMinutes?: number;
  customOrder?: number;
}

export interface ItineraryDay {
  id: string;
  dayNumber: number;
  title: string;
  date?: string;
  notes?: string;
  items: ItineraryItem[];
}

export type ApprovalStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected';

export interface ItineraryPlan {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  days: ItineraryDay[];
  curatedBy?: string;
  approvalStatus?: ApprovalStatus;
  reviewedBy?: string;
  reviewRemarks?: string;
  reviewedAt?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

