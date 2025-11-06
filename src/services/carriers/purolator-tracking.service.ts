import * as soap from 'soap';
import { TrackingRequest, TrackingResponse } from '../../types/shipment-tracking.types';
import { purolatorConfig } from '../../config/purolator.config';
import { randomUUID } from 'crypto';
import { transformTrackingResponse } from '../../utils/tracking-response-transformer';
import { createInternalErrorResponse } from '../../utils/error-response';
import { BaseTrackingService } from './base-tracking.service';

interface PurolatorCredentials {
  activationKey: string;
  accountNumber: string;
}

interface TrackingSearchCriteria {
  searches: {
    search: Array<{
      trackingId: string;
      shipmentDateFrom?: string;
      shipmentDateTo?: string;
      pod?: boolean;
    }>;
  };
}

/**
 * Purolator-specific tracking service implementation
 * Handles SOAP API communication with Purolator's tracking service
 */
export class PurolatorTrackingService extends BaseTrackingService {
  private wsdlUrl: string;
  private endpoint: string;
  private credentials: PurolatorCredentials;
  private client: soap.Client | null = null;

  constructor() {
    super();
    this.wsdlUrl = process.env.PUROLATOR_WSDL_URL || 'wsdl/ShipmentTrackingService.wsdl';
    this.endpoint = purolatorConfig.endpoint;
    this.credentials = {
      activationKey: process.env.PUROLATOR_ACTIVATION_KEY || '',
      accountNumber: process.env.PUROLATOR_ACCOUNT_NUMBER || '',
    };
  }

  getCarrierName(): string {
    return 'purolator';
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      this.client = await soap.createClientAsync(this.wsdlUrl, {
        endpoint: this.endpoint,
        wsdl_options: {
          namespaceArrayElements: false,
        },
        forceSoap12Headers: false,
        envelopeKey: 'soapenv',
      });

      // Configure namespace prefix mapping for proper body element qualification
      const wsdl = this.client.wsdl as any;
      const nsURI = 'http://purolator.com/pws/datatypes/v2';

      if (!wsdl.definitions.namespaces) {
        wsdl.definitions.namespaces = {};
      }
      wsdl.definitions.namespaces[nsURI] = 'typ';

      // Intercept HTTP requests to add namespace prefixes to ALL elements
      const originalHttpClient = (this.client as any).httpClient;
      const originalRequest = originalHttpClient.request.bind(originalHttpClient);

      originalHttpClient.request = function(rurl: string, data: any, callback: any, exheaders: any, exoptions: any) {
        if (typeof data === 'string') {
          // Add typ: prefix to all elements in the SOAP header
          const headerRegex = /(<soapenv:Header>)([\s\S]*?)(<\/soapenv:Header>)/;
          data = data.replace(headerRegex, (_match: string, openTag: string, headerContent: string, closeTag: string) => {
            const qualified = headerContent
              .replace(/<(\w+)([>\s])/g, '<typ:$1$2')
              .replace(/<\/(\w+)>/g, '</typ:$1>');
            return openTag + qualified + closeTag;
          });

          // Add typ: prefix to all elements in the SOAP body
          const bodyRegex = /(<soapenv:Body>)([\s\S]*?)(<\/soapenv:Body>)/;
          data = data.replace(bodyRegex, (_match: string, openTag: string, bodyContent: string, closeTag: string) => {
            const qualified = bodyContent
              .replace(/<(\w+)([>\s])/g, '<typ:$1$2')
              .replace(/<\/(\w+)>/g, '</typ:$1>');
            return openTag + qualified + closeTag;
          });

          // Log the final SOAP request for debugging
          if (process.env.DEBUG_SOAP === 'true') {
            console.log('\n=== SOAP REQUEST ===');
            console.log(data);
            console.log('===================\n');
          }
        }

        // Add Date header (required by AWS API Gateway)
        if (!exheaders) {
          exheaders = {};
        }
        if (!exheaders.Date && !exheaders.date) {
          exheaders.Date = new Date().toUTCString();
        }

        return originalRequest(rurl, data, callback, exheaders, exoptions);
      };

      // Set up Basic Authentication
      const security = new soap.BasicAuthSecurity(
        this.credentials.activationKey,
        this.credentials.accountNumber
      );
      this.client.setSecurity(security);

      // Add namespace declarations to the envelope
      this.client.wsdl.xmlnsInEnvelope = this._getNamespaceDeclarations();

      // Add RequestContext header
      this._addRequestContextHeader();

      this.initialized = true;
      console.log('Purolator SOAP client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Purolator SOAP client:', error);
      throw error;
    }
  }

  private _getNamespaceDeclarations(): string {
    return [
      'xmlns:typ="http://purolator.com/pws/datatypes/v2"'
    ].join(' ');
  }

  private _addRequestContextHeader(): void {
    if (!this.client) return;

    const requestContext = {
      RequestContext: {
        Version: purolatorConfig.version,
        Language: purolatorConfig.language,
        GroupID: purolatorConfig.groupId,
        RequestReference: randomUUID(),
        UserToken: this.credentials.activationKey,
      }
    };

    this.client.addSoapHeader(requestContext);
  }

  /**
   * Get service description (Purolator-specific)
   */
  async describe(): Promise<any> {
    await this.ensureInitialized();
    return this.client!.describe();
  }

  /**
   * Track shipment by single PIN (Purolator-specific)
   */
  async trackByPin(pin: string, options: any = {}): Promise<any> {
    return this.track({
      trackingIds: [pin],
      ...options,
    });
  }

  /**
   * Track shipments by multiple PINs (Purolator-specific)
   */
  async trackByPins(pins: string[], options: any = {}): Promise<any> {
    return this.track({
      trackingIds: pins,
      ...options,
    });
  }

  /**
   * Track shipment and return raw SOAP response (Purolator-specific)
   */
  async track(request: TrackingRequest): Promise<any> {
    await this.ensureInitialized();

    const searches = request.trackingIds.map(id => {
      const search: any = { trackingId: id };

      if (request.shipmentDateFrom) search.shipmentDateFrom = request.shipmentDateFrom;
      if (request.shipmentDateTo) search.shipmentDateTo = request.shipmentDateTo;
      if (request.pod !== undefined) search.pod = request.pod;
      if (request.shipmentView !== undefined) search.shipmentView = request.shipmentView;
      if (request.account) search.account = request.account;
      if (request.destinationPostalZipCode) search.destinationPostalZipCode = request.destinationPostalZipCode;
      if (request.eventSortOrder) search.eventSortOrder = request.eventSortOrder;

      return search;
    });

    const searchCriteria: TrackingSearchCriteria = {
      searches: {
        search: searches,
      },
    };

    try {
      const result = await this.client!.TrackingByPinsOrReferencesAsync({
        TrackingSearchCriteria: searchCriteria,
      });

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      console.error('Purolator tracking request failed:', error);
      return {
        success: false,
        errors: [
          {
            Code: 'TRACKING_ERROR',
            Description: error instanceof Error ? error.message : 'Unknown error',
            AdditionalInformation: '',
          },
        ],
      };
    }
  }

  /**
   * Track shipment and return standardized JSON response
   * Implements the base interface method
   */
  async trackStandardized(request: TrackingRequest): Promise<TrackingResponse> {
    await this.ensureInitialized();

    const searches = request.trackingIds.map(id => {
      const search: any = { trackingId: id };

      if (request.shipmentDateFrom) search.shipmentDateFrom = request.shipmentDateFrom;
      if (request.shipmentDateTo) search.shipmentDateTo = request.shipmentDateTo;
      if (request.pod !== undefined) search.pod = request.pod;
      if (request.shipmentView !== undefined) search.shipmentView = request.shipmentView;
      if (request.account) search.account = request.account;
      if (request.destinationPostalZipCode) search.destinationPostalZipCode = request.destinationPostalZipCode;
      if (request.eventSortOrder) search.eventSortOrder = request.eventSortOrder;

      return search;
    });

    const searchCriteria: TrackingSearchCriteria = {
      searches: {
        search: searches,
      },
    };

    try {
      const result = await this.client!.TrackingByPinsOrReferencesAsync({
        TrackingSearchCriteria: searchCriteria,
      });

      // Transform SOAP response to standardized format
      return transformTrackingResponse(result);
    } catch (error) {
      console.error('Purolator tracking request failed:', error);
      // Return error in standardized format
      return createInternalErrorResponse(error);
    }
  }

  /**
   * Get last SOAP request (Purolator-specific debugging)
   */
  getLastRequest(): string | undefined {
    return this.client?.lastRequest;
  }

  /**
   * Get last SOAP response (Purolator-specific debugging)
   */
  getLastResponse(): string | undefined {
    return this.client?.lastResponse;
  }
}

// Export singleton instance
export const purolatorTrackingService = new PurolatorTrackingService();

