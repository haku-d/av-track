import { test } from 'node:test';
import * as assert from 'node:assert';
import { transformTrackingResponse } from '../../src/utils/tracking-response-transformer';

/**
 * Test suite for tracking response transformer
 * Tests various SOAP response structures and edge cases
 */

test('transformTrackingResponse - successful response with single package', async (t) => {
  const soapResponse = [
    {
      TrackingByPinsOrReferencesResult: {
        ResponseInformation: {
          Errors: [],
          InformationalMessages: null,
        },
        SearchResults: [
          {
            trackingId: '335702383951',
            status: 'FOUND',
            type: 'PIN',
            shipmentErrors: [],
            Shipment: {
              shipmentPin: '329702318141',
              status: {
                code: 'DEL',
                description: 'Delivered',
              },
              shipmentCreated: '2022-11-14',
              details: {
                shipper: {
                  city: 'TORONTO',
                  provinceState: 'ON',
                  countryCode: 'CA',
                  postalZipCode: 'M1R4X8',
                },
                receiver: {
                  city: 'MISSISSAUGA',
                  provinceState: 'ON',
                  countryCode: 'CA',
                  postalZipCode: 'L5B1M5',
                },
              },
              packages: {
                package: {
                  pin: '329702318141',
                  status: {
                    code: 'DEL',
                    description: 'Delivered',
                  },
                  events: {
                    event: {
                      dateTime: '2022-11-17 10:48:28',
                      code: '2300',
                      description: 'Picked up by Purolator',
                      location: {
                        StreetAddress1: 'WISTERIA',
                        StreetAddress2: null,
                        City: 'TORONTO',
                        provinceState: 'ON',
                        CountryCode: 'CA',
                        PostalCode: 'M1R4X8',
                      },
                    },
                  },
                },
              },
            },
          },
        ],
      },
    },
  ];

  const result = transformTrackingResponse(soapResponse);

  assert.strictEqual(result.status, 'success');
  assert.strictEqual(result.description, 'Tracking information retrieved successfully');
  assert.strictEqual(result.errors.length, 0);
  assert.strictEqual(result.shipment.status, 'DEL');
  assert.strictEqual(result.shipment.description, 'Delivered');
  assert.strictEqual(result.shipment.shipper.city, 'TORONTO');
  assert.strictEqual(result.shipment.receiver.city, 'MISSISSAUGA');
  assert.strictEqual(result.shipment.packages.length, 1);
  assert.strictEqual(result.shipment.packages[0].status, 'DEL');
  assert.strictEqual(result.shipment.packages[0].lastEvent.code, '2300');
});

test('transformTrackingResponse - successful response with multiple packages', async (t) => {
  const soapResponse = [
    {
      TrackingByPinsOrReferencesResult: {
        ResponseInformation: {
          Errors: [],
        },
        SearchResults: [
          {
            trackingId: '335702383951',
            status: 'FOUND',
            type: 'PIN',
            shipmentErrors: [],
            Shipment: {
              shipmentPin: '329702318141',
              status: {
                code: 'INT',
                description: 'In Transit',
              },
              shipmentCreated: '2022-11-14',
              details: {
                shipper: {
                  city: 'TORONTO',
                  provinceState: 'ON',
                  countryCode: 'CA',
                  postalZipCode: 'M1R4X8',
                },
                receiver: {
                  city: 'VANCOUVER',
                  provinceState: 'BC',
                  countryCode: 'CA',
                  postalZipCode: 'V6B1A1',
                },
              },
              packages: {
                package: [
                  {
                    pin: '329702318141',
                    status: { code: 'INT', description: 'In Transit' },
                    events: {
                      event: [
                        {
                          dateTime: '2022-11-17 10:48:28',
                          code: '2300',
                          description: 'Picked up',
                          location: {
                            City: 'TORONTO',
                            provinceState: 'ON',
                            CountryCode: 'CA',
                          },
                        },
                        {
                          dateTime: '2022-11-16 08:30:00',
                          code: '1000',
                          description: 'Shipment created',
                          location: {
                            City: 'TORONTO',
                            provinceState: 'ON',
                            CountryCode: 'CA',
                          },
                        },
                      ],
                    },
                  },
                  {
                    pin: '329702318142',
                    status: { code: 'INT', description: 'In Transit' },
                    events: {
                      event: {
                        dateTime: '2022-11-17 10:48:28',
                        code: '2300',
                        description: 'Picked up',
                        location: {
                          City: 'TORONTO',
                          provinceState: 'ON',
                          CountryCode: 'CA',
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    },
  ];

  const result = transformTrackingResponse(soapResponse);

  assert.strictEqual(result.status, 'success');
  assert.strictEqual(result.shipment.packages.length, 2);
  // First package should have the most recent event (code '2300')
  assert.strictEqual(result.shipment.packages[0].lastEvent.code, '2300');
  // Second package should have its only event (code '2300')
  assert.strictEqual(result.shipment.packages[1].lastEvent.code, '2300');
});

test('transformTrackingResponse - shipment not found', async (t) => {
  const soapResponse = [
    {
      TrackingByPinsOrReferencesResult: {
        ResponseInformation: {
          Errors: [],
        },
        SearchResults: [
          {
            trackingId: '999999999999',
            status: 'NOT_FOUND',
            type: 'PIN',
            shipmentErrors: [],
            Shipment: null,
          },
        ],
      },
    },
  ];

  const result = transformTrackingResponse(soapResponse);

  assert.strictEqual(result.status, 'not_found');
  assert.strictEqual(result.description, 'Shipment not found');
  assert.strictEqual(result.errors.length, 0);
});

test('transformTrackingResponse - response with errors', async (t) => {
  const soapResponse = [
    {
      TrackingByPinsOrReferencesResult: {
        ResponseInformation: {
          Errors: [
            {
              Code: 'AUTH_ERROR',
              Description: 'Authentication failed',
              AdditionalInformation: 'Invalid credentials',
            },
          ],
        },
        SearchResults: [],
      },
    },
  ];

  const result = transformTrackingResponse(soapResponse);

  assert.strictEqual(result.status, 'error');
  assert.strictEqual(result.description, 'Tracking request completed with errors');
  assert.strictEqual(result.errors.length, 1);
  assert.strictEqual(result.errors[0], 'AUTH_ERROR: Authentication failed - Invalid credentials');
});

test('transformTrackingResponse - response with shipment errors', async (t) => {
  const soapResponse = [
    {
      TrackingByPinsOrReferencesResult: {
        ResponseInformation: {
          Errors: [],
        },
        SearchResults: [
          {
            trackingId: '335702383951',
            status: 'FOUND',
            type: 'PIN',
            shipmentErrors: [
              {
                code: 'SHIP_ERROR',
                description: 'Shipment data incomplete',
              },
            ],
            Shipment: null,
          },
        ],
      },
    },
  ];

  const result = transformTrackingResponse(soapResponse);

  assert.strictEqual(result.status, 'error');
  assert.strictEqual(result.errors.length, 1);
  assert.strictEqual(result.errors[0], 'SHIP_ERROR: Shipment data incomplete');
});

test('transformTrackingResponse - invalid SOAP response structure', async (t) => {
  const soapResponse = [
    {
      // Missing TrackingByPinsOrReferencesResult
    },
  ];

  const result = transformTrackingResponse(soapResponse);

  assert.strictEqual(result.status, 'error');
  assert.strictEqual(result.description, 'Invalid SOAP response structure');
  assert.strictEqual(result.errors.length, 1);
  assert.strictEqual(result.errors[0], 'No valid response data found in SOAP response');
});

test('transformTrackingResponse - empty search results', async (t) => {
  const soapResponse = [
    {
      TrackingByPinsOrReferencesResult: {
        ResponseInformation: {
          Errors: [],
        },
        SearchResults: [],
      },
    },
  ];

  const result = transformTrackingResponse(soapResponse);

  assert.strictEqual(result.status, 'not_found');
  assert.strictEqual(result.description, 'No search results found');
});

test('transformTrackingResponse - package with lastEvent instead of events array', async (t) => {
  const soapResponse = [
    {
      TrackingByPinsOrReferencesResult: {
        ResponseInformation: {
          Errors: [],
        },
        SearchResults: [
          {
            trackingId: '335702383951',
            status: 'FOUND',
            type: 'PIN',
            shipmentErrors: [],
            Shipment: {
              shipmentPin: '329702318141',
              status: {
                code: 'DEL',
                description: 'Delivered',
              },
              shipmentCreated: '2022-11-14',
              details: {
                shipper: {
                  city: 'TORONTO',
                  provinceState: 'ON',
                  countryCode: 'CA',
                },
                receiver: {
                  city: 'MISSISSAUGA',
                  provinceState: 'ON',
                  countryCode: 'CA',
                },
              },
              packages: {
                package: {
                  pin: '329702318141',
                  status: { code: 'DEL', description: 'Delivered' },
                  lastEvent: {
                    dateTime: '2022-11-17 10:48:28',
                    code: '2300',
                    description: 'Delivered to recipient',
                    location: {
                      City: 'MISSISSAUGA',
                      provinceState: 'ON',
                      CountryCode: 'CA',
                    },
                  },
                },
              },
            },
          },
        ],
      },
    },
  ];

  const result = transformTrackingResponse(soapResponse);

  assert.strictEqual(result.status, 'success');
  assert.strictEqual(result.shipment.packages.length, 1);
  assert.strictEqual(result.shipment.packages[0].lastEvent.description, 'Delivered to recipient');
});

test('transformTrackingResponse - handles null/undefined address fields', async (t) => {
  const soapResponse = [
    {
      TrackingByPinsOrReferencesResult: {
        ResponseInformation: {
          Errors: [],
        },
        SearchResults: [
          {
            trackingId: '335702383951',
            status: 'FOUND',
            type: 'PIN',
            shipmentErrors: [],
            Shipment: {
              shipmentPin: '329702318141',
              status: {
                code: 'INT',
                description: 'In Transit',
              },
              shipmentCreated: '2022-11-14',
              details: {
                shipper: {
                  city: 'TORONTO',
                  provinceState: null,
                  countryCode: 'CA',
                  postalZipCode: null,
                },
                receiver: {
                  city: null,
                  provinceState: 'ON',
                  countryCode: null,
                  postalZipCode: 'L5B1M5',
                },
              },
              packages: {
                package: {
                  pin: '329702318141',
                  status: { code: 'INT', description: 'In Transit' },
                  events: {
                    event: {
                      dateTime: '2022-11-17 10:48:28',
                      code: '2300',
                      description: 'In transit',
                      location: {
                        StreetAddress1: null,
                        StreetAddress2: null,
                        City: null,
                        provinceState: null,
                        CountryCode: null,
                        PostalCode: null,
                      },
                    },
                  },
                },
              },
            },
          },
        ],
      },
    },
  ];

  const result = transformTrackingResponse(soapResponse);

  assert.strictEqual(result.status, 'success');
  assert.strictEqual(result.shipment.shipper.city, 'TORONTO');
  assert.strictEqual(result.shipment.shipper.proviceState, '');
  assert.strictEqual(result.shipment.shipper.postalZipCode, '');
  assert.strictEqual(result.shipment.receiver.city, '');
  assert.strictEqual(result.shipment.receiver.proviceState, 'ON');
  assert.strictEqual(result.shipment.packages[0].lastEvent.location.address_1, '');
  assert.strictEqual(result.shipment.packages[0].lastEvent.location.city, '');
});

test('transformTrackingResponse - handles missing shipment details', async (t) => {
  const soapResponse = [
    {
      TrackingByPinsOrReferencesResult: {
        ResponseInformation: {
          Errors: [],
        },
        SearchResults: [
          {
            trackingId: '335702383951',
            status: 'FOUND',
            type: 'PIN',
            shipmentErrors: [],
            Shipment: {
              shipmentPin: '329702318141',
              status: {
                code: 'INT',
                description: 'In Transit',
              },
              shipmentCreated: '2022-11-14',
              details: null,
              packages: null,
            },
          },
        ],
      },
    },
  ];

  const result = transformTrackingResponse(soapResponse);

  assert.strictEqual(result.status, 'success');
  assert.strictEqual(result.shipment.shipper.city, '');
  assert.strictEqual(result.shipment.receiver.city, '');
  assert.strictEqual(result.shipment.packages.length, 0);
});

test('transformTrackingResponse - handles date parsing', async (t) => {
  const soapResponse = [
    {
      TrackingByPinsOrReferencesResult: {
        ResponseInformation: {
          Errors: [],
        },
        SearchResults: [
          {
            trackingId: '335702383951',
            status: 'FOUND',
            type: 'PIN',
            shipmentErrors: [],
            Shipment: {
              shipmentPin: '329702318141',
              status: {
                code: 'DEL',
                description: 'Delivered',
              },
              shipmentCreated: '2022-11-14',
              details: {
                shipper: { city: 'TORONTO', provinceState: 'ON', countryCode: 'CA' },
                receiver: { city: 'MISSISSAUGA', provinceState: 'ON', countryCode: 'CA' },
              },
              packages: {
                package: {
                  pin: '329702318141',
                  status: { code: 'DEL', description: 'Delivered' },
                  events: {
                    event: {
                      dateTime: '2022-11-17 10:48:28',
                      code: '2300',
                      description: 'Delivered',
                      location: {
                        City: 'MISSISSAUGA',
                        provinceState: 'ON',
                        CountryCode: 'CA',
                      },
                    },
                  },
                },
              },
            },
          },
        ],
      },
    },
  ];

  const result = transformTrackingResponse(soapResponse);

  assert.ok(result.shipment.createdDate instanceof Date);
  assert.strictEqual(result.shipment.createdDate.toISOString().split('T')[0], '2022-11-14');
  assert.ok(result.shipment.packages[0].lastEvent.dateTime instanceof Date);
});

test('transformTrackingResponse - handles packages as direct array', async (t) => {
  const soapResponse = [
    {
      TrackingByPinsOrReferencesResult: {
        ResponseInformation: {
          Errors: [],
        },
        SearchResults: [
          {
            trackingId: '335702383951',
            status: 'FOUND',
            type: 'PIN',
            shipmentErrors: [],
            Shipment: {
              shipmentPin: '329702318141',
              status: {
                code: 'INT',
                description: 'In Transit',
              },
              shipmentCreated: '2022-11-14',
              details: {
                shipper: { city: 'TORONTO', provinceState: 'ON', countryCode: 'CA' },
                receiver: { city: 'VANCOUVER', provinceState: 'BC', countryCode: 'CA' },
              },
              packages: [
                {
                  pin: '329702318141',
                  status: { code: 'INT', description: 'In Transit' },
                  events: [
                    {
                      dateTime: '2022-11-17 10:48:28',
                      code: '2300',
                      description: 'In transit',
                      location: {
                        City: 'CALGARY',
                        provinceState: 'AB',
                        CountryCode: 'CA',
                      },
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    },
  ];

  const result = transformTrackingResponse(soapResponse);

  assert.strictEqual(result.status, 'success');
  assert.strictEqual(result.shipment.packages.length, 1);
  assert.strictEqual(result.shipment.packages[0].lastEvent.code, '2300');
});

test('transformTrackingResponse - complex real-world scenario', async (t) => {
  const soapResponse = [
    {
      TrackingByPinsOrReferencesResult: {
        ResponseInformation: {
          Errors: [],
          InformationalMessages: null,
        },
        SearchResults: [
          {
            trackingId: '335702383951',
            shipmentDateFrom: null,
            shipmentDateTo: null,
            status: 'FOUND',
            type: 'PIN',
            shipmentErrors: [],
            Shipment: {
              shipmentPin: '329702318141',
              status: {
                code: 'ATT',
                description: 'Attention',
              },
              shipmentCreated: '2022-11-14',
              pieceTotalCount: 1,
              details: {
                shipper: {
                  city: 'REPENTIGNY',
                  provinceState: 'QC',
                  countryCode: 'CA',
                  postalZipCode: null,
                },
                receiver: {
                  city: 'MISSISSAUGA',
                  provinceState: 'ON',
                  countryCode: 'CA',
                  postalZipCode: null,
                },
              },
              packages: {
                package: {
                  pin: '329702318141',
                  status: {
                    code: 'ATT',
                    description: 'Attention',
                  },
                  events: {
                    event: [
                      {
                        dateTime: '2022-11-17 10:48:28',
                        code: '2300',
                        description: 'Picked up by Purolator at WISTERIA,TORONTO,ON,M1R4X8',
                        location: {
                          StreetAddress1: 'WISTERIA',
                          StreetAddress2: null,
                          City: 'TORONTO',
                          provinceState: 'ON',
                          CountryCode: 'CA',
                          PostalCode: 'M1R4X8',
                        },
                      },
                      {
                        dateTime: '2022-11-15 16:52:16',
                        code: '9310',
                        description: 'Mechanical delay',
                        location: {
                          StreetAddress1: null,
                          StreetAddress2: null,
                          City: 'MISSISSAUGA',
                          provinceState: 'ON',
                          CountryCode: 'CA',
                          PostalCode: null,
                        },
                      },
                      {
                        dateTime: '2022-11-14 13:26:33',
                        code: '3010',
                        description: 'Shipment created - final manifest received',
                        location: {
                          StreetAddress1: null,
                          StreetAddress2: null,
                          City: 'MISSISSAUGA',
                          provinceState: 'ON',
                          CountryCode: 'CA',
                          PostalCode: null,
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        ],
      },
    },
  ];

  const result = transformTrackingResponse(soapResponse);

  // Validate top-level response
  assert.strictEqual(result.status, 'success');
  assert.strictEqual(result.description, 'Tracking information retrieved successfully');
  assert.strictEqual(result.errors.length, 0);

  // Validate shipment
  assert.strictEqual(result.shipment.status, 'ATT');
  assert.strictEqual(result.shipment.description, 'Attention');
  assert.ok(result.shipment.createdDate instanceof Date);

  // Validate addresses
  assert.strictEqual(result.shipment.shipper.city, 'REPENTIGNY');
  assert.strictEqual(result.shipment.shipper.proviceState, 'QC');
  assert.strictEqual(result.shipment.shipper.countryCode, 'CA');
  assert.strictEqual(result.shipment.receiver.city, 'MISSISSAUGA');
  assert.strictEqual(result.shipment.receiver.proviceState, 'ON');

  // Validate packages
  assert.strictEqual(result.shipment.packages.length, 1);
  assert.strictEqual(result.shipment.packages[0].status, 'ATT');
  assert.strictEqual(result.shipment.packages[0].description, 'Attention');

  // Validate last event (most recent event - code '2300')
  assert.strictEqual(result.shipment.packages[0].lastEvent.code, '2300');
  assert.strictEqual(result.shipment.packages[0].lastEvent.description, 'Picked up by Purolator at WISTERIA,TORONTO,ON,M1R4X8');
  assert.strictEqual(result.shipment.packages[0].lastEvent.location.address_1, 'WISTERIA');
  assert.strictEqual(result.shipment.packages[0].lastEvent.location.city, 'TORONTO');
  assert.strictEqual(result.shipment.packages[0].lastEvent.location.postalZipCode, 'M1R4X8');
});

