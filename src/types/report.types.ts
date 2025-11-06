import { CarrierType } from '../services/carriers/tracking-service-factory';

/**
 * Report format types
 */
export type ReportFormat = 'json' | 'csv';

/**
 * Tracking IDs grouped by carrier
 */
export interface CarrierTrackingIds {
  type: CarrierType;
  ids: string[];
}

/**
 * Request body for POST /report
 */
export interface ReportRequest {
  format: ReportFormat;
  trackingIds: CarrierTrackingIds[];
}

/**
 * Report data for a single tracking ID
 */
export interface ReportTrackingData {
  carrier: CarrierType;
  trackingId: string;
  status: string;
  description: string;
  lastEventDate?: string;
  lastEventCode?: string;
  lastEventDescription?: string;
  lastEventLocation?: string;
  error?: string;
}

/**
 * JSON format report response
 */
export interface JsonReportResponse {
  format: 'json';
  generatedAt: string;
  totalTracked: number;
  successCount: number;
  errorCount: number;
  data: ReportTrackingData[];
}

/**
 * CSV format report response
 */
export interface CsvReportResponse {
  format: 'csv';
  generatedAt: string;
  totalTracked: number;
  successCount: number;
  errorCount: number;
  csv: string;
}

/**
 * Union type for report responses
 */
export type ReportResponse = JsonReportResponse | CsvReportResponse;

