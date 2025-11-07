import * as soap from 'soap';
import { BaseShippingService } from './base-shipping.service';
import { purolatorShippingConfig } from '../../config/purolator-shipping.config';
import {
  ShippingRequest,
  VoidRequest,
  ShippingResponse,
  VoidResponse,
  ValidationResponse,
  CreateShipmentRequestContainer,
  VoidShipmentRequestContainer,
  ValidateShipmentRequestContainer
} from '../../types/shipping.types';
import {
  PurolatorCredentials,
  getPurolatorSoapOptions,
  getPurolatorNamespaceDeclarations,
  createPurolatorRequestContext,
  PUROLATOR_NAMESPACE_URI,
  PUROLATOR_NAMESPACE_PREFIX
} from '../../types/purolator-common.types';

/**
 * Purolator-specific shipping service implementation
 * Handles SOAP API communication with Purolator's shipping service
 */
export class PurolatorShippingService extends BaseShippingService {
  private wsdlUrl: string;
  private endpoint: string;
  private credentials: PurolatorCredentials;
  private client: soap.Client | null = null;

  constructor() {
    super();
    this.wsdlUrl = purolatorShippingConfig.wsdlUrl;
    this.endpoint = purolatorShippingConfig.endpoint;

    this.credentials = {
      activationKey: purolatorShippingConfig.activationKey,
      accountNumber: purolatorShippingConfig.registeredAccountNumber,
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
      this.client = await soap.createClientAsync(this.wsdlUrl, getPurolatorSoapOptions(this.endpoint));

      // Configure namespace prefix mapping (similar to tracking service)
      const wsdl = this.client.wsdl as any;

      if (!wsdl.definitions.namespaces) {
        wsdl.definitions.namespaces = {};
      }
      wsdl.definitions.namespaces[PUROLATOR_NAMESPACE_URI] = PUROLATOR_NAMESPACE_PREFIX;

      // Intercept HTTP requests to add namespace prefixes to ALL elements
      const originalHttpClient = (this.client as any).httpClient;
      const originalRequest = originalHttpClient.request.bind(originalHttpClient);

      originalHttpClient.request = function(rurl: string, data: any, callback: any, exheaders: any, exoptions: any) {
        if (typeof data === 'string') {
          // Add typ: prefix to all elements in the SOAP header
          const headerRegex = /(<soapenv:Header>)([\s\S]*?)(<\/soapenv:Header>)/;
          data = data.replace(headerRegex, (_match: string, openTag: string, headerContent: string, closeTag: string) => {
            const qualified = headerContent
              .replace(/<(\w+)([>\s])/g, `<${PUROLATOR_NAMESPACE_PREFIX}:$1$2`)
              .replace(/<\/(\w+)>/g, `</${PUROLATOR_NAMESPACE_PREFIX}:$1>`);
            return openTag + qualified + closeTag;
          });

          // Add typ: prefix to all elements in the SOAP body
          const bodyRegex = /(<soapenv:Body>)([\s\S]*?)(<\/soapenv:Body>)/;
          data = data.replace(bodyRegex, (_match: string, openTag: string, bodyContent: string, closeTag: string) => {
            const qualified = bodyContent
              .replace(/<(\w+)([>\s])/g, `<${PUROLATOR_NAMESPACE_PREFIX}:$1$2`)
              .replace(/<\/(\w+)>/g, `</${PUROLATOR_NAMESPACE_PREFIX}:$1>`);
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
      this.client.wsdl.xmlnsInEnvelope = getPurolatorNamespaceDeclarations();

      // Add RequestContext header
      this._addRequestContextHeader();

      this.initialized = true;
      console.log('Purolator Shipping SOAP client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Purolator Shipping SOAP client:', error);
      throw error;
    }
  }

  private _addRequestContextHeader(): void {
    if (!this.client) return;

    const requestContext = createPurolatorRequestContext(
      purolatorShippingConfig.version,
      purolatorShippingConfig.language,
      purolatorShippingConfig.groupId,
      this.credentials.activationKey
    );

    this.client.addSoapHeader(requestContext);
  }

  async createShipment(request: ShippingRequest): Promise<ShippingResponse> {
    await this.ensureInitialized();

    // Validate request
    const validationErrors = this.validateShipmentRequest(request);
    if (validationErrors.length > 0) {
      return {
        success: false,
        errors: validationErrors.map(error => ({
          Code: 'VALIDATION_ERROR',
          Description: error,
          AdditionalInformation: ''
        }))
      };
    }

    const createRequest: CreateShipmentRequestContainer = {
      Shipment: request.shipment,
      PrinterType: request.printerType || 'Regular'
    };

    try {
      const result = await this.client!.CreateShipmentAsync(createRequest);

      return {
        success: !result[0].ResponseInformation?.Errors?.length,
        errors: result[0].ResponseInformation?.Errors || [],
        messages: result[0].ResponseInformation?.InformationalMessages || [],
        shipmentPIN: result[0].ShipmentPIN?.Value,
        piecePINs: result[0].PiecePINs?.PIN?.map((pin: any) => pin.Value) || [],
        returnShipmentPINs: result[0].ReturnShipmentPINs?.PIN?.map((pin: any) => pin.Value) || [],
        expressChequePIN: result[0].ExpressChequePIN?.Value
      };
    } catch (error) {
      console.error('Purolator create shipment request failed:', error);
      return {
        success: false,
        errors: [{
          Code: 'SHIPPING_ERROR',
          Description: error instanceof Error ? error.message : 'Unknown error',
          AdditionalInformation: ''
        }]
      };
    }
  }

  async validateShipment(request: ShippingRequest): Promise<ValidationResponse> {
    await this.ensureInitialized();

    // Validate request
    const validationErrors = this.validateShipmentRequest(request);
    if (validationErrors.length > 0) {
      return {
        success: false,
        errors: validationErrors.map(error => ({
          Code: 'VALIDATION_ERROR',
          Description: error,
          AdditionalInformation: ''
        })),
        isValid: false
      };
    }

    const validateRequest: ValidateShipmentRequestContainer = {
      Shipment: request.shipment
    };

    try {
      const result = await this.client!.ValidateShipmentAsync(validateRequest);

      return {
        success: !result[0].ResponseInformation?.Errors?.length,
        errors: result[0].ResponseInformation?.Errors || [],
        messages: result[0].ResponseInformation?.InformationalMessages || [],
        isValid: !result[0].ResponseInformation?.Errors?.length
      };
    } catch (error) {
      console.error('Purolator validate shipment request failed:', error);
      return {
        success: false,
        errors: [{
          Code: 'VALIDATION_ERROR',
          Description: error instanceof Error ? error.message : 'Unknown error',
          AdditionalInformation: ''
        }],
        isValid: false
      };
    }
  }

  async voidShipment(request: VoidRequest): Promise<VoidResponse> {
    await this.ensureInitialized();

    // Validate PIN
    if (!request.pin || !this.validatePIN(request.pin)) {
      return {
        success: false,
        errors: [{
          Code: 'VALIDATION_ERROR',
          Description: 'Valid PIN is required',
          AdditionalInformation: ''
        }]
      };
    }

    const voidRequest: VoidShipmentRequestContainer = {
      PIN: { Value: request.pin }
    };

    try {
      const result = await this.client!.VoidShipmentAsync(voidRequest);

      return {
        success: !result[0].ResponseInformation?.Errors?.length,
        errors: result[0].ResponseInformation?.Errors || [],
        messages: result[0].ResponseInformation?.InformationalMessages || []
      };
    } catch (error) {
      console.error('Purolator void shipment request failed:', error);
      return {
        success: false,
        errors: [{
          Code: 'VOID_ERROR',
          Description: error instanceof Error ? error.message : 'Unknown error',
          AdditionalInformation: ''
        }]
      };
    }
  }

  /**
   * Get service description (Purolator-specific)
   */
  async describe(): Promise<any> {
    await this.ensureInitialized();
    return this.client!.describe();
  }

  /**
   * Get last SOAP request (debugging)
   */
  getLastRequest(): string | undefined {
    return this.client?.lastRequest;
  }

  /**
   * Get last SOAP response (debugging)
   */
  getLastResponse(): string | undefined {
    return this.client?.lastResponse;
  }
}

// Export singleton instance
export const purolatorShippingService = new PurolatorShippingService();
