import mongoose, { Schema, Document, Model } from 'mongoose';
import { LocationCategory } from '@/types/location';

export interface ILocationDocument extends Document {
  name: string;
  category: LocationCategory;
  lat: number;
  lng: number;
  description?: string;
  city?: string;
  region?: string;
  country?: string;
  imageUrl?: string;
  rating?: number;
  estimatedDuration?: number;
  estimatedCost?: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema<ILocationDocument>(
  {
    name: {
      type: String,
      required: [true, 'Location name is required'],
      trim: true,
      maxlength: [100, 'Location name cannot exceed 100 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['sightseeing', 'activity', 'experience'],
        message: '{VALUE} is not a valid location category',
      },
      index: true,
    },
    lat: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: [-90, 'Latitude must be >= -90'],
      max: [90, 'Latitude must be <= 90'],
    },
    lng: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: [-180, 'Longitude must be >= -180'],
      max: [180, 'Longitude must be <= 180'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    city: {
      type: String,
      trim: true,
      index: true,
    },
    region: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
      default: 'India',
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 4.5,
    },
    estimatedDuration: {
      type: Number,
      default: 60, // in minutes
    },
    estimatedCost: {
      type: Number,
      default: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
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

// Prevent mongoose model overwrite in hot reload Next.js development
const Location: Model<ILocationDocument> =
  mongoose.models.Location || mongoose.model<ILocationDocument>('Location', LocationSchema);

export default Location;
