import { BaseTrackingService } from './base-tracking.service';
import { TrackingRequest, TrackingResponse } from '../../types/shipment-tracking.types';
import { upsConfig, validateUpsConfig } from '../../config/ups.config';
import { transformUpsResponse } from '../../utils/ups-transformer';

/**
 * UPS Tracking Service
 * Implements tracking using UPS REST API with OAuth2 authentication
 */
export class UpsTrackingService extends BaseTrackingService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  getCarrierName(): string {
    return 'ups';
  }

  /**
   * Initialize the UPS tracking service
   * Validates configuration
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Validate configuration
    const validation = validateUpsConfig();
    if (!validation.valid) {
      throw new Error(
        `UPS configuration is invalid:\n${validation.errors.join('\n')}`
      );
    }

    this.initialized = true;
    console.log('✅ UPS Tracking Service initialized');
  }

  /**
   * Get OAuth2 access token
   * Caches token until expiry
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      // Prepare Basic Auth credentials
      const credentials = Buffer.from(
        `${upsConfig.clientId}:${upsConfig.clientSecret}`
      ).toString('base64');

      // Request new token
      const response = await fetch(upsConfig.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`,
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OAuth2 token request failed: ${response.status} ${errorText}`);
      }

      const data = await response.json() as { access_token: string; expires_in: number };

      // Cache token (expires_in is in seconds, subtract 60s for safety margin)
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + ((data.expires_in - 60) * 1000);

      return this.accessToken as string;
    } catch (error) {
      console.error('Failed to get UPS access token:', error);
      throw new Error(`UPS authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Track shipment and return standardized JSON response
   */
  async trackStandardized(request: TrackingRequest): Promise<TrackingResponse> {
    await this.ensureInitialized();

    // UPS API only supports single tracking number per request
    // For multiple tracking numbers, we'll track the first one
    const trackingNumber = request.trackingIds[0];
    
    if (!trackingNumber) {
      return {
        status: 'ERROR',
        description: 'No tracking number provided',
        errors: ['At least one tracking number is required'],
        shipment: {
          status: 'ERROR',
          description: 'No tracking number provided',
          isDelivered: false,
          createdDate: new Date(),
          shipper: {
            city: '',
            proviceState: '',
            countryCode: '',
            postalZipCode: '',
          },
          receiver: {
            city: '',
            proviceState: '',
            countryCode: '',
            postalZipCode: '',
          },
          packages: [],
        },
      };
    }

    try {
      // Get access token
      const token = await this.getAccessToken();

      // Build query parameters
      const params = new URLSearchParams({
        locale: 'en_US',
        returnSignature: 'false',
        returnMilestones: 'false',
        returnPOD: 'false',
      });

      // Make tracking request
      const url = `${upsConfig.baseUrl}/track/v1/details/${encodeURIComponent(trackingNumber)}?${params}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'transId': this.generateTransactionId(),
          'transactionSrc': 'e-tracking',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any;

        // Handle 404 - tracking number not found
        if (response.status === 404) {
          return {
            status: 'ERROR',
            description: 'Tracking number not found',
            errors: ['The tracking number was not found in UPS system'],
            shipment: {
              status: 'ERROR',
              description: 'Tracking number not found',
              isDelivered: false,
              createdDate: new Date(),
              shipper: {
                city: '',
                proviceState: '',
                countryCode: '',
                postalZipCode: '',
              },
              receiver: {
                city: '',
                proviceState: '',
                countryCode: '',
                postalZipCode: '',
              },
              packages: [],
            },
          };
        }

        // Handle other errors
        const errorMessage = errorData?.response?.errors?.[0]?.message || `HTTP ${response.status}`;
        throw new Error(`UPS API error: ${errorMessage}`);
      }

      const data = await response.json() as any;

      // Transform UPS response to standardized format
      return transformUpsResponse(data, trackingNumber);

    } catch (error) {
      console.error('UPS tracking request failed:', error);

      return {
        status: 'ERROR',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
        shipment: {
          status: 'ERROR',
          description: error instanceof Error ? error.message : 'Unknown error occurred',
          isDelivered: false,
          createdDate: new Date(),
          shipper: {
            city: '',
            proviceState: '',
            countryCode: '',
            postalZipCode: '',
          },
          receiver: {
            city: '',
            proviceState: '',
            countryCode: '',
            postalZipCode: '',
          },
          packages: [],
        },
      };
    }
  }

  /**
   * Generate a unique transaction ID for UPS API
   */
  private generateTransactionId(): string {
    return `e-tracking-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Export singleton instance
export const upsTrackingService = new UpsTrackingService();

