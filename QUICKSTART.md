# Quick Start Guide

Get up and running with the Purolator Shipment Tracking API in 5 minutes.

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your Purolator credentials:

```env
PUROLATOR_ACTIVATION_KEY=your_activation_key_here
PUROLATOR_ACCOUNT_NUMBER=your_account_number_here
PUROLATOR_ENVIRONMENT=development
PUROLATOR_LANGUAGE=en
```

> **Note**: Contact Purolator to obtain your API credentials if you don't have them yet.

## Step 3: Start the Server

```bash
npm run dev
```

You should see output like:

```
Server listening at http://127.0.0.1:3000
```

## Step 4: Test the API

### Check Health Status

```bash
curl http://localhost:3000/tracking/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "Purolator Shipment Tracking",
  "version": "2.0"
}
```

### Track a Shipment

Replace `YOUR_PIN` with an actual Purolator PIN:

```bash
curl http://localhost:3000/tracking/pin/YOUR_PIN
```

Example with a test PIN:
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

## Common Issues

### Issue: "Service Unavailable" or Configuration Errors

**Solution**: Make sure your `.env` file has valid credentials:
- Check that `PUROLATOR_ACTIVATION_KEY` is set
- Check that `PUROLATOR_ACCOUNT_NUMBER` is set
- Verify credentials with Purolator

### Issue: "Invalid PIN" Error

**Solution**: 
- Ensure you're using a valid Purolator PIN
- Check that the PIN format is correct (typically 12 digits)
- Verify the shipment exists in the system

### Issue: SOAP Connection Errors

**Solution**:
- Check your internet connection
- Verify the WSDL file exists at `wsdl/ShipmentTrackingService.wsdl`
- If using production, set `PUROLATOR_ENVIRONMENT=production`

## Next Steps

1. **Read the full API documentation**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
2. **Explore the code**: Check out the examples in `examples/tracking-example.ts`
3. **Customize**: Modify routes in `src/routes/tracking/index.ts`
4. **Deploy**: Build for production with `npm start`

## API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/tracking/health` | GET | Health check |
| `/tracking/pin/:pin` | GET | Track by PIN |
| `/tracking/track` | POST | Track multiple |
| `/tracking/reference/:ref` | GET | Track by reference |
| `/tracking/pins?pins=...` | GET | Batch track |

## Production Deployment

When ready for production:

1. Set environment to production:
   ```env
   PUROLATOR_ENVIRONMENT=production
   ```

2. Build the project:
   ```bash
   npm run build:ts
   ```

3. Start in production mode:
   ```bash
   npm start
   ```

## Getting Help

- **API Issues**: Check [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Purolator API**: Visit [Purolator Web Services](https://www.purolator.com/en/support/tools/web-services)
- **Fastify**: See [Fastify Documentation](https://fastify.dev/docs/latest/)

## Example Response

Successful tracking response:

```json
{
  "success": true,
  "results": [
    {
      "trackingId": "329012345678",
      "status": "Delivered",
      "Shipment": {
        "shipmentPin": "329012345678",
        "status": {
          "code": "DEL",
          "description": "Delivered"
        },
        "packages": [
          {
            "pin": "329012345678",
            "status": {
              "code": "DEL",
              "description": "Delivered"
            },
            "estimatedDeliveryDate": "2024-10-17",
            "events": [
              {
                "dateTime": "2024-10-17T14:30:00",
                "code": "DEL",
                "description": "Delivered"
              }
            ]
          }
        ]
      }
    }
  ]
}
```

---

**You're all set!** 🎉

Start tracking shipments with the Purolator API.

