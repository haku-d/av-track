import * as soap from 'soap';
import { 
  PurolatorCredentials,
  PurolatorServiceConfig,
  getPurolatorSoapOptions,
  getPurolatorNamespaceDeclarations,
  createPurolatorRequestContext,
  PUROLATOR_NAMESPACE_URI,
  PUROLATOR_NAMESPACE_PREFIX
} from '../../types/purolator-common.types';

/**
 * Abstract base class for all Purolator services (tracking, shipping, etc.)
 * Provides common SOAP client initialization and configuration
 */
export abstract class BasePurolatorService {
  protected initialized: boolean = false;
  protected client: soap.Client | null = null;
  protected credentials: PurolatorCredentials;
  protected config: PurolatorServiceConfig;

  constructor(config: PurolatorServiceConfig) {
    this.config = config;
    this.credentials = {
      activationKey: config.activationKey,
      accountNumber: config.registeredAccountNumber,
    };
  }

  /**
   * Get the carrier name
   */
  getCarrierName(): string {
    return 'purolator';
  }

  /**
   * Check if the service is initialized and ready
   */
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

  /**
   * Initialize the SOAP client with common Purolator configuration
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      this.client = await soap.createClientAsync(this.config.wsdlUrl, getPurolatorSoapOptions(this.config.endpoint));

      // Configure namespace prefix mapping
      const wsdl = this.client.wsdl as any;
      if (!wsdl.definitions.namespaces) {
        wsdl.definitions.namespaces = {};
      }
      wsdl.definitions.namespaces[PUROLATOR_NAMESPACE_URI] = PUROLATOR_NAMESPACE_PREFIX;

      // Intercept HTTP requests to add namespace prefixes
      this._setupSoapRequestInterceptor();

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
      console.log(`Purolator ${this.getServiceType()} SOAP client initialized successfully`);
    } catch (error) {
      console.error(`Failed to initialize Purolator ${this.getServiceType()} SOAP client:`, error);
      throw error;
    }
  }

  /**
   * Setup SOAP request interceptor for namespace handling
   */
  private _setupSoapRequestInterceptor(): void {
    if (!this.client) return;

    const originalHttpClient = (this.client as any).httpClient;
    const originalRequest = originalHttpClient.request.bind(originalHttpClient);

    originalHttpClient.request = function(rurl: string, data: any, callback: any, exheaders: any, exoptions: any) {
      if (typeof data === 'string') {
        // Add namespace prefix to all elements in the SOAP header
        const headerRegex = /(<soapenv:Header>)([\s\S]*?)(<\/soapenv:Header>)/;
        data = data.replace(headerRegex, (_match: string, openTag: string, headerContent: string, closeTag: string) => {
          const qualified = headerContent
            .replace(/<(\w+)([>\s])/g, `<${PUROLATOR_NAMESPACE_PREFIX}:$1$2`)
            .replace(/<\/(\w+)>/g, `</${PUROLATOR_NAMESPACE_PREFIX}:$1>`);
          return openTag + qualified + closeTag;
        });

        // Add namespace prefix to all elements in the SOAP body
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
  }

  /**
   * Add RequestContext header to SOAP client
   */
  private _addRequestContextHeader(): void {
    if (!this.client) return;

    const requestContext = createPurolatorRequestContext(
      this.config.version,
      this.config.language,
      this.config.groupId,
      this.credentials.activationKey
    );

    this.client.addSoapHeader(requestContext);
  }

  /**
   * Get service description (debugging)
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

  /**
   * Abstract method to get the service type name (e.g., "Tracking", "Shipping")
   * Must be implemented by concrete service classes
   */
  protected abstract getServiceType(): string;
}
