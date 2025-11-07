/**
 * Common types and interfaces shared across Purolator services
 * (Tracking, Shipping, etc.)
 */

import { randomUUID } from 'crypto';

/**
 * Purolator API credentials interface
 * Used by both tracking and shipping services
 */
export interface PurolatorCredentials {
  activationKey: string;
  accountNumber: string;
}

/**
 * Common Purolator service configuration
 */
export interface PurolatorServiceConfig {
  wsdlUrl: string;
  endpoint: string;
  activationKey: string;
  registeredAccountNumber: string;
  version: string;
  language: 'en' | 'fr';
  groupId: string;
}

/**
 * Purolator environment types
 */
export type PurolatorEnvironment = 'production' | 'development';

/**
 * Common SOAP client options for Purolator services
 */
export interface PurolatorSoapOptions {
  endpoint: string;
  wsdl_options: {
    namespaceArrayElements: boolean;
  };
  forceSoap12Headers: boolean;
  envelopeKey: string;
}

/**
 * Request context header structure used by all Purolator services
 */
export interface PurolatorRequestContext {
  RequestContext: {
    Version: string;
    Language: 'en' | 'fr';
    GroupID: string;
    RequestReference: string;
    UserToken: string;
  };
}

/**
 * Common namespace configuration for Purolator SOAP services
 */
export const PUROLATOR_NAMESPACE_URI = 'http://purolator.com/pws/datatypes/v2';
export const PUROLATOR_NAMESPACE_PREFIX = 'typ';

/**
 * Helper function to get default SOAP options for Purolator services
 */
export function getPurolatorSoapOptions(endpoint: string): PurolatorSoapOptions {
  return {
    endpoint,
    wsdl_options: {
      namespaceArrayElements: false,
    },
    forceSoap12Headers: false,
    envelopeKey: 'soapenv',
  };
}

/**
 * Helper function to get namespace declarations for Purolator SOAP envelope
 */
export function getPurolatorNamespaceDeclarations(): string {
  return `xmlns:${PUROLATOR_NAMESPACE_PREFIX}="${PUROLATOR_NAMESPACE_URI}"`;
}

/**
 * Helper function to create request context header
 */
export function createPurolatorRequestContext(
  version: string,
  language: 'en' | 'fr',
  groupId: string,
  userToken: string,
  requestReference?: string
): PurolatorRequestContext {
  return {
    RequestContext: {
      Version: version,
      Language: language,
      GroupID: groupId,
      RequestReference: requestReference || randomUUID(),
      UserToken: userToken,
    }
  };
}

/**
 * Common SOAP request interceptor for adding namespace prefixes
 * This can be reused by both tracking and shipping services
 */
export function createSoapRequestInterceptor(originalRequest: Function, debugMode: boolean = false) {
  return function(rurl: string, data: any, callback: any, exheaders: any, exoptions: any) {
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
      if (debugMode) {
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
