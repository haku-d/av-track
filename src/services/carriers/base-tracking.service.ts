import { TrackingRequest, TrackingResponse } from '../../types/shipment-tracking.types';

/**
 * Base interface that all carrier tracking services must implement
 * This ensures a consistent API across different carriers (Purolator, UPS, Stampede, etc.)
 */
export interface ITrackingService {
  /**
   * Initialize the tracking service (e.g., create SOAP client, setup API connection)
   */
  initialize(): Promise<void>;

  /**
   * Track shipment(s) and return standardized JSON response
   * @param request - Tracking request with tracking IDs and optional parameters
   * @returns Standardized tracking response
   */
  trackStandardized(request: TrackingRequest): Promise<TrackingResponse>;

  /**
   * Get the carrier name
   */
  getCarrierName(): string;

  /**
   * Check if the service is initialized and ready
   */
  isReady(): boolean;
}

/**
 * Abstract base class for tracking services
 * Provides common functionality that can be shared across carriers
 */
export abstract class BaseTrackingService implements ITrackingService {
  protected initialized: boolean = false;

  abstract initialize(): Promise<void>;
  abstract trackStandardized(request: TrackingRequest): Promise<TrackingResponse>;
  abstract getCarrierName(): string;

  isReady(): boolean {
    return this.initialized;
  }

  /**
   * Helper method to ensure service is initialized before use
   */
  protected async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }
}

