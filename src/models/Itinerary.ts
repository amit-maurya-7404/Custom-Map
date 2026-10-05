import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IItineraryDocument extends Document {
  title: string;
  description?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  curatedBy?: string;
  approvalStatus?: string;
  reviewedBy?: string;
  reviewRemarks?: string;
  reviewedAt?: Date;
  days: {
    id: string;
    dayNumber: number;
    title: string;
    notes?: string;
    items: {
      id: string;
      location: any;
      timeSlot?: string;
      notes?: string;
      durationMinutes?: number;
      customOrder?: number;
    }[];
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const ItineraryItemSchema = new Schema(
  {
    id: { type: String, required: true },
    location: { type: Schema.Types.Mixed, required: true },
    timeSlot: { type: String },
    notes: { type: String },
    durationMinutes: { type: Number, default: 60 },
    customOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

const ItineraryDaySchema = new Schema(
  {
    id: { type: String, required: true },
    dayNumber: { type: Number, required: true },
    title: { type: String, required: true },
    notes: { type: String },
    items: [ItineraryItemSchema],
  },
  { _id: false }
);

const ItinerarySchema = new Schema<IItineraryDocument>(
  {
    title: {
      type: String,
      required: [true, 'Itinerary title is required'],
      trim: true,
      default: 'Custom Travel Itinerary',
    },
    description: {
      type: String,
      trim: true,
    },
    destination: {
      type: String,
      trim: true,
    },
    startDate: {
      type: String,
    },
    endDate: {
      type: String,
    },
    curatedBy: {
      type: String,
      default: 'Operations Executive',
    },
    approvalStatus: {
      type: String,
      enum: ['draft', 'pending_approval', 'approved', 'rejected'],
      default: 'pending_approval',
    },
    reviewedBy: {
      type: String,
    },
    reviewRemarks: {
      type: String,
    },
    reviewedAt: {
      type: Date,
    },
    days: [ItineraryDaySchema],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id ? ret._id.toString() : undefined;
        return ret;
      },
    },
  }
);

const Itinerary: Model<IItineraryDocument> =
  mongoose.models.Itinerary || mongoose.model<IItineraryDocument>('Itinerary', ItinerarySchema);

export default Itinerary;
