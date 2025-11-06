import mongoose, { Schema, Document } from 'mongoose';
import { TrackingResponse } from '../types/shipment-tracking.types';

/**
 * Interface for TrackedShipment document
 */
export interface ITrackedShipment extends Document {
  trackingNo: string;
  service: 'purolator' | 'ups' | 'stampede' | 'fedex' | 'dhl' | 'other';
  trackingResponse: TrackingResponse;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  errorCount: number;
  lastError?: string;

  // Instance methods
  updateTracking(trackingResponse: TrackingResponse): Promise<ITrackedShipment>;
  recordError(error: string): Promise<ITrackedShipment>;
}

/**
 * Mongoose schema for TrackedShipment
 */
const TrackedShipmentSchema: Schema = new Schema(
  {
    trackingNo: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    service: {
      type: String,
      required: true,
      enum: ['purolator', 'ups', 'stampede', 'fedex', 'dhl', 'other'],
      default: 'purolator',
      index: true,
    },
    trackingResponse: {
      type: Schema.Types.Mixed,
      required: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    errorCount: {
      type: Number,
      default: 0,
    },
    lastError: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    collection: 'tracked_shipments',
  }
);

// Compound index for efficient queries
TrackedShipmentSchema.index({ trackingNo: 1, service: 1 }, { unique: true });
TrackedShipmentSchema.index({ isActive: 1, lastUpdated: 1 });

/**
 * Static method to find or create a tracked shipment
 */
TrackedShipmentSchema.statics.findOrCreate = async function (
  trackingNo: string,
  service: string,
  trackingResponse: TrackingResponse
): Promise<ITrackedShipment> {
  const existing = await this.findOne({ trackingNo, service });
  
  if (existing) {
    existing.trackingResponse = trackingResponse;
    existing.lastUpdated = new Date();
    existing.errorCount = 0;
    existing.lastError = undefined;
    await existing.save();
    return existing;
  }

  return this.create({
    trackingNo,
    service,
    trackingResponse,
    lastUpdated: new Date(),
    isActive: true,
    errorCount: 0,
  });
};

/**
 * Instance method to update tracking response
 */
TrackedShipmentSchema.methods.updateTracking = async function (
  trackingResponse: TrackingResponse
): Promise<ITrackedShipment> {
  this.trackingResponse = trackingResponse;
  this.lastUpdated = new Date();
  this.errorCount = 0;
  this.lastError = undefined;
  return this.save();
};

/**
 * Instance method to record error
 */
TrackedShipmentSchema.methods.recordError = async function (
  error: string
): Promise<ITrackedShipment> {
  this.errorCount += 1;
  this.lastError = error;
  this.lastUpdated = new Date();
  
  // Deactivate if too many errors
  if (this.errorCount >= 10) {
    this.isActive = false;
  }
  
  return this.save();
};

// Export the model
export const TrackedShipment = mongoose.model<ITrackedShipment>(
  'TrackedShipment',
  TrackedShipmentSchema
);

export default TrackedShipment;

