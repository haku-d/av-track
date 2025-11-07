# Purolator Shipping Service API

This module provides REST API endpoints for Purolator shipping operations including creating shipments, validating shipment data, and voiding shipments.

## Endpoints

### Health Check
- **GET** `/shipping/health`
- Returns the health status of the shipping service

### Create Shipment
- **POST** `/shipping/create`
- Creates a new shipment and returns tracking numbers (PINs)
- **Body**: `ShippingRequest` object with shipment details and optional printer type

### Validate Shipment
- **POST** `/shipping/validate`
- Validates shipment data without creating actual shipment
- **Body**: `ShippingRequest` object with shipment details

### Void Shipment
- **POST** `/shipping/void`
- **Body**: `{ "pin": "TRACKING_NUMBER" }`
- **DELETE** `/shipping/void/:pin`
- Cancels an existing shipment by PIN

### Debug Endpoints
- **GET** `/shipping/describe` - Get service description
- **GET** `/shipping/debug/last-request` - Get last SOAP request/response

## Request Schema

### ShippingRequest
```json
{
  "shipment": {
    "SenderInformation": {
      "Address": { /* Address object */ },
      "TaxNumber": "string (optional)"
    },
    "ReceiverInformation": {
      "Address": { /* Address object */ },
      "TaxNumber": "string (optional)"
    },
    "PackageInformation": {
      "ServiceID": "string",
      "Description": "string (optional)",
      "TotalWeight": { /* Weight object */ },
      "TotalPieces": 1,
      "PiecesInformation": [ /* Array of pieces (optional) */ ],
      "DangerousGoodsDeclarationDocumentIndicator": false,
      "OptionsInformation": { /* Options object (optional) */ }
    },
    "PaymentInformation": {
      "PaymentType": "Sender|Receiver|ThirdParty|CreditCard",
      "RegisteredAccountNumber": "string",
      "BillingAccountNumber": "string (optional)",
      "CreditCardInformation": { /* Credit card object (optional) */ }
    },
    "PickupInformation": {
      "PickupType": "string"
    },
    "ShipmentDate": "string (optional)",
    "FromOnLabelIndicator": false,
    "InternationalInformation": { /* International object (optional) */ },
    "ReturnShipmentInformation": { /* Return shipment object (optional) */ },
    "NotificationInformation": { /* Notification object (optional) */ },
    "TrackingReferenceInformation": { /* Tracking reference object (optional) */ },
    "OtherInformation": { /* Other information object (optional) */ },
    "ProactiveNotification": { /* Proactive notification object (optional) */ }
  },
  "printerType": "Regular|Thermal (optional, defaults to Regular)"
}
```

## Response Schema

### ShippingResponse
```json
{
  "success": true,
  "errors": [ /* Array of error objects */ ],
  "messages": [ /* Array of informational messages */ ],
  "shipmentPIN": "string (main tracking number)",
  "piecePINs": [ /* Array of piece tracking numbers */ ],
  "returnShipmentPINs": [ /* Array of return shipment tracking numbers */ ],
  "expressChequePIN": "string (express cheque tracking number)"
}
```

### ValidationResponse
```json
{
  "success": true,
  "errors": [ /* Array of error objects */ ],
  "messages": [ /* Array of informational messages */ ],
  "isValid": true
}
```

### VoidResponse
```json
{
  "success": true,
  "errors": [ /* Array of error objects */ ],
  "messages": [ /* Array of informational messages */ ]
}
```

## Environment Variables

- `PUROLATOR_ACTIVATION_KEY`: Your Purolator API activation key (required)
- `PUROLATOR_ACCOUNT_NUMBER`: Your registered Purolator account number (required)
- `PUROLATOR_ENVIRONMENT`: 'production' or 'development' (default: development)
- `PUROLATOR_LANGUAGE`: 'en' or 'fr' (default: en)
- `PUROLATOR_GROUP_ID`: Your group ID (optional, default: 'e-tracking')
- `PUROLATOR_SHIPPING_WSDL_URL`: Path to shipping WSDL file (optional)

## Error Handling

All endpoints return standardized error responses with appropriate HTTP status codes:
- 400: Bad Request (validation errors, business logic errors)
- 500: Internal Server Error (system errors, SOAP faults)
- 503: Service Unavailable (configuration errors)

## Integration with Tracking

Created shipments can be tracked using the existing tracking service endpoints by using the returned PINs.
