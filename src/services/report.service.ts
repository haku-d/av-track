import {
  ReportRequest,
  ReportResponse,
  ReportTrackingData,
  JsonReportResponse,
  CsvReportResponse
} from '../types/report.types';
import { trackingDatabaseService } from './tracking-database.service';

/**
 * Service for generating tracking reports in various formats
 */
export class ReportService {
  /**
   * Generate a tracking report based on the request
   * Fetches data from the tracked_shipments collection
   */
  async generateReport(request: ReportRequest): Promise<ReportResponse> {
    // Collect all tracking data
    const trackingData: ReportTrackingData[] = [];

    // Process each carrier's tracking IDs
    for (const carrierGroup of request.trackingIds) {
      const { type: carrier, ids } = carrierGroup;

      // Fetch tracking data from database for each ID
      for (const trackingId of ids) {
        try {
          // Get tracked shipment from database
          // Optimized: Only select needed fields and use lean for better performance
          const trackedShipment = await trackingDatabaseService.getTrackedShipment(
            trackingId,
            carrier,
            'trackingResponse lastError',
            true
          );

          if (!trackedShipment) {
            // Tracking ID not found in database
            trackingData.push({
              carrier,
              trackingId,
              status: 'NOT_FOUND',
              description: 'Tracking ID not found in database',
              error: `No tracking data found for ${carrier} tracking ID: ${trackingId}`,
            });
            continue;
          }

          // Extract data from the tracked shipment
          const response = trackedShipment.trackingResponse;
          const packages = response.shipment?.packages || [];

          if (packages.length === 0) {
            // No packages in the response
            trackingData.push({
              carrier,
              trackingId,
              status: response.status || 'UNKNOWN',
              description: response.description || 'No package data available',
              error: trackedShipment.lastError,
            });
            continue;
          }

          // Process each package
          for (const pkg of packages) {
            const lastEvent = pkg.lastEvent;

            trackingData.push({
              carrier,
              trackingId: pkg.pin || trackingId,
              status: pkg.status || 'UNKNOWN',
              description: pkg.description || 'No description',
              lastEventDate: lastEvent?.dateTime ? lastEvent.dateTime.toISOString() : undefined,
              lastEventCode: lastEvent?.code,
              lastEventDescription: lastEvent?.description,
              lastEventLocation: this._formatLocation(lastEvent?.location),
              error: trackedShipment.lastError,
            });
          }
        } catch (error) {
          // Add error entry
          trackingData.push({
            carrier,
            trackingId,
            status: 'ERROR',
            description: 'Database error',
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    // Generate response based on format
    const generatedAt = new Date().toISOString();
    const totalTracked = trackingData.length;
    const successCount = trackingData.filter(d => d.status !== 'ERROR' && d.status !== 'NOT_FOUND').length;
    const errorCount = trackingData.filter(d => d.status === 'ERROR' || d.status === 'NOT_FOUND').length;

    if (request.format === 'json') {
      return {
        format: 'json',
        generatedAt,
        totalTracked,
        successCount,
        errorCount,
        data: trackingData,
      } as JsonReportResponse;
    } else {
      // Generate CSV
      const csv = this._generateCsv(trackingData);
      return {
        format: 'csv',
        generatedAt,
        totalTracked,
        successCount,
        errorCount,
        csv,
      } as CsvReportResponse;
    }
  }

  /**
   * Format location object to string
   */
  private _formatLocation(location: any): string | undefined {
    if (!location) return undefined;

    const parts: string[] = [];
    if (location.city) parts.push(location.city);
    if (location.province) parts.push(location.province);
    if (location.country) parts.push(location.country);

    return parts.length > 0 ? parts.join(', ') : undefined;
  }

  /**
   * Generate CSV from tracking data
   */
  private _generateCsv(data: ReportTrackingData[]): string {
    // CSV header
    const headers = [
      'Carrier',
      'Tracking ID',
      'Status',
      'Description',
      'Last Event Date',
      'Last Event Code',
      'Last Event Description',
      'Last Event Location',
      'Error',
    ];

    // CSV rows
    const rows = data.map(item => [
      item.carrier,
      item.trackingId,
      item.status,
      this._escapeCsv(item.description),
      item.lastEventDate || '',
      item.lastEventCode || '',
      this._escapeCsv(item.lastEventDescription || ''),
      this._escapeCsv(item.lastEventLocation || ''),
      this._escapeCsv(item.error || ''),
    ]);

    // Combine header and rows
    const csvLines = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ];

    return csvLines.join('\n');
  }

  /**
   * Escape CSV field (handle commas, quotes, newlines)
   */
  private _escapeCsv(value: string): string {
    if (!value) return '';

    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }

    return value;
  }

  /**
   * Validate report request
   */
  validateRequest(request: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check format
    if (!request.format) {
      errors.push('Missing required field: format');
    } else if (request.format !== 'json' && request.format !== 'csv') {
      errors.push('Invalid format. Must be "json" or "csv"');
    }

    // Check trackingIds
    if (!request.trackingIds) {
      errors.push('Missing required field: trackingIds');
    } else if (!Array.isArray(request.trackingIds)) {
      errors.push('trackingIds must be an array');
    } else {
      // Validate each carrier group
      request.trackingIds.forEach((group: any, index: number) => {
        if (!group.type) {
          errors.push(`trackingIds[${index}]: Missing required field "type"`);
        }
        if (!group.ids) {
          errors.push(`trackingIds[${index}]: Missing required field "ids"`);
        } else if (!Array.isArray(group.ids)) {
          errors.push(`trackingIds[${index}]: "ids" must be an array`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const reportService = new ReportService();

