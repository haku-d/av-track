# E-Tracking - Purolator Shipment Tracking API

A Fastify-based REST API wrapper for the Purolator Shipment Tracking SOAP service. This project provides modern REST endpoints to interact with Purolator's shipment tracking system.

## Features

- ✅ REST API wrapper for Purolator SOAP service
- ✅ TypeScript support with full type definitions
- ✅ Multiple tracking methods (PIN, reference, batch)
- ✅ Comprehensive error handling
- ✅ Request validation
- ✅ Environment-based configuration
- ✅ Development and production modes
- ✅ Health check endpoints
- ✅ Detailed API documentation

## Prerequisites

- Node.js 18+
- npm or yarn
- **Purolator API credentials** (activation key and account number)
  - 📖 See [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md) for how to obtain credentials

## Quick Start

### 1. Installation

```bash
npm install
```

### 2. Configuration

Copy the example environment file and configure your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your **valid** Purolator API credentials:

```env
PUROLATOR_ACTIVATION_KEY=your_activation_key_here
PUROLATOR_ACCOUNT_NUMBER=your_account_number_here
PUROLATOR_ENVIRONMENT=development
PUROLATOR_LANGUAGE=en
```

> ⚠️ **Important**: You must obtain valid credentials from Purolator. The example values will not work.
>
> 📖 See [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md) for detailed instructions on obtaining credentials.

### 3. Run the Application

**Development mode** (with hot reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

The server will start on `http://localhost:3000`

### 4. Test the API

Check if the service is healthy:
```bash
curl http://localhost:3000/tracking/health
```

Track a shipment:
```bash
curl http://localhost:3000/tracking/pin/329012345678
```

## API Endpoints

### Health & Service Info

- `GET /tracking/health` - Check service health
- `GET /tracking/describe` - Get WSDL service description

### Tracking Endpoints

- `GET /tracking/pin/:pin` - Track single shipment by PIN
- `POST /tracking/track` - Track multiple shipments
- `GET /tracking/reference/:reference` - Track by reference number
- `GET /tracking/pins?pins=PIN1,PIN2` - Batch track by PINs

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed API documentation.

## Project Structure

```
e-tracking/
├── src/
│   ├── config/              # Configuration files
│   │   └── purolator.config.ts
│   ├── routes/              # API route handlers
│   │   └── tracking/
│   │       └── index.ts
│   ├── services/            # Business logic & SOAP client
│   │   └── shipment-tracking.service.ts
│   ├── types/               # TypeScript type definitions
│   │   └── shipment-tracking.types.ts
│   ├── plugins/             # Fastify plugins
│   └── app.ts               # Application entry point
├── wsdl/                    # WSDL files
│   └── ShipmentTrackingService.wsdl
├── examples/                # Usage examples
│   └── tracking-example.ts
├── .env.example             # Environment variables template
├── API_DOCUMENTATION.md     # Detailed API docs
└── package.json
```

## Available Scripts

### `npm run dev`

Start the app in development mode with hot reload.
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm start`

Build and start the app in production mode.

### `npm run build:ts`

Compile TypeScript to JavaScript.

### `npm run test`

Run the test suite.

## Usage Examples

### Track Single Shipment

```bash
curl http://localhost:3000/tracking/pin/329012345678?pod=true&shipmentView=true
```

### Track Multiple Shipments

```bash
curl -X POST http://localhost:3000/tracking/track \
  -H "Content-Type: application/json" \
  -d '{
    "trackingIds": ["329012345678", "329012345679"],
    "pod": true,
    "shipmentView": true
  }'
```

### Track by Reference

```bash
curl http://localhost:3000/tracking/reference/REF123456
```

### Batch Track

```bash
curl "http://localhost:3000/tracking/pins?pins=329012345678,329012345679&pod=true"
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PUROLATOR_ACTIVATION_KEY` | Yes | - | Your Purolator API activation key |
| `PUROLATOR_ACCOUNT_NUMBER` | Yes | - | Your registered account number |
| `PUROLATOR_ENVIRONMENT` | No | `development` | `production` or `development` |
| `PUROLATOR_LANGUAGE` | No | `en` | Response language (`en` or `fr`) |
| `PUROLATOR_GROUP_ID` | No | `e-tracking` | Group identifier |

## Response Format

### Success Response

```json
{
  "success": true,
  "results": [
    {
      "trackingId": "329012345678",
      "status": "Delivered",
      "Shipment": {
        "shipmentPin": "329012345678",
        "packages": [...]
      }
    }
  ]
}
```

### Error Response

```json
{
  "success": false,
  "errors": [
    {
      "Code": "ERROR_CODE",
      "Description": "Error description",
      "AdditionalInformation": "Additional context"
    }
  ]
}
```

## Development

### Type Definitions

All SOAP service types are defined in `src/types/shipment-tracking.types.ts` based on the WSDL schema.

### Adding New Endpoints

1. Add route handler in `src/routes/tracking/index.ts`
2. Add service method in `src/services/shipment-tracking.service.ts`
3. Update types if needed in `src/types/shipment-tracking.types.ts`
4. Document in `API_DOCUMENTATION.md`

## Technologies

- **Fastify** - Fast and low overhead web framework
- **TypeScript** - Type-safe development
- **SOAP** - SOAP client for Node.js
- **dotenv** - Environment variable management
- **Node.js crypto** - Built-in UUID generation

## Documentation

- 🔐 [Authentication Guide](./AUTHENTICATION_GUIDE.md) - **How to obtain Purolator API credentials**
- 📖 [API Documentation](./API_DOCUMENTATION.md) - Complete API reference
- 🚀 [Quick Start Guide](./QUICKSTART.md) - 5-minute setup guide
- 🔧 [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and solutions
- 📚 [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - Technical details
- 🌐 [Fastify Documentation](https://fastify.dev/docs/latest/)
- 📦 [Purolator Web Services](https://www.purolator.com/en/support/tools/web-services)

## License

ISC

## Support

For issues related to:
- **This API wrapper**: Open an issue in this repository
- **Purolator API**: Contact Purolator support
- **Fastify framework**: Check [Fastify documentation](https://fastify.dev/docs/latest/)
