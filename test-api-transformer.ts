/**
 * Test the tracking response transformer with a real API call
 * This script calls the Purolator API with a tracking PIN and shows the transformation
 */

import 'dotenv/config';
import { shipmentTrackingService } from './src/services/shipment-tracking.service';

const TEST_PIN = '335702383951';

async function testApiTransformer() {
  console.log('='.repeat(80));
  console.log('Testing Tracking Response Transformer with Real API Call');
  console.log('='.repeat(80));
  console.log();

  try {
    // Initialize the service
    console.log('📡 Initializing tracking service...');
    await shipmentTrackingService.initialize();
    console.log('✅ Service initialized\n');

    // Test with the tracking PIN
    console.log(`🔍 Tracking PIN: ${TEST_PIN}`);
    console.log('⏳ Making API request...\n');

    // First, let's see the raw SOAP response structure
    const rawResult = await shipmentTrackingService.track({
      trackingIds: [TEST_PIN],
    });

    console.log('🔍 RAW SOAP CLIENT RESPONSE STRUCTURE');
    console.log('='.repeat(80));
    console.log(JSON.stringify(rawResult, null, 2));
    console.log('='.repeat(80));
    console.log();

    const result = await shipmentTrackingService.trackStandardized({
      trackingIds: [TEST_PIN],
    });

    console.log('='.repeat(80));
    console.log('📦 TRANSFORMED RESPONSE (Standardized JSON Format)');
    console.log('='.repeat(80));
    console.log(JSON.stringify(result, null, 2));
    console.log('='.repeat(80));
    console.log();

    // Display summary
    console.log('📊 RESPONSE SUMMARY');
    console.log('='.repeat(80));
    console.log(`Status:              ${result.status}`);
    console.log(`Description:         ${result.description}`);
    console.log(`Errors:              ${result.errors.length > 0 ? result.errors.join(', ') : 'None'}`);
    console.log();

    if (result.shipment && result.status === 'success') {
      console.log('📦 SHIPMENT DETAILS');
      console.log('='.repeat(80));
      console.log(`Shipment Status:     ${result.shipment.status} - ${result.shipment.description}`);
      console.log(`Created Date:        ${result.shipment.createdDate}`);
      console.log();

      console.log('📍 SHIPPER');
      console.log(`  City:              ${result.shipment.shipper.city}`);
      console.log(`  Province/State:    ${result.shipment.shipper.proviceState}`);
      console.log(`  Country:           ${result.shipment.shipper.countryCode}`);
      console.log(`  Postal/Zip:        ${result.shipment.shipper.postalZipCode || 'N/A'}`);
      console.log();

      console.log('📍 RECEIVER');
      console.log(`  City:              ${result.shipment.receiver.city}`);
      console.log(`  Province/State:    ${result.shipment.receiver.proviceState}`);
      console.log(`  Country:           ${result.shipment.receiver.countryCode}`);
      console.log(`  Postal/Zip:        ${result.shipment.receiver.postalZipCode || 'N/A'}`);
      console.log();

      console.log('📦 PACKAGES');
      console.log('='.repeat(80));
      console.log(`Total Packages:      ${result.shipment.packages.length}`);
      console.log();

      result.shipment.packages.forEach((pkg, index) => {
        console.log(`Package #${index + 1}:`);
        console.log(`  Status:            ${pkg.status} - ${pkg.description}`);
        console.log();

        console.log('  📅 LAST EVENT:');
        const event = pkg.lastEvent;
        console.log(`    [${event.code}] ${event.description}`);
        console.log(`    Date/Time:      ${event.dateTime}`);
        console.log(`    Location:       ${event.location.city}, ${event.location.proviceState} ${event.location.postalZipCode}`);
        if (event.location.address_1) {
          console.log(`    Address:        ${event.location.address_1}`);
        }
        console.log();
      });
    }

    console.log('='.repeat(80));
    
    if (result.status === 'success') {
      console.log('✅ SUCCESS! Transformer working correctly with real API data.');
    } else if (result.status === 'not_found') {
      console.log('⚠️  Shipment not found. This may be expected if the PIN is invalid or expired.');
    } else {
      console.log('❌ Request completed with errors. Check the error details above.');
    }
    
    console.log('='.repeat(80));

    // Show raw SOAP request/response for debugging
    console.log();
    console.log('🔍 RAW SOAP REQUEST');
    console.log('='.repeat(80));
    console.log(shipmentTrackingService.getLastRequest());
    console.log('='.repeat(80));
    console.log();

    console.log('🔍 RAW SOAP RESPONSE');
    console.log('='.repeat(80));
    console.log(shipmentTrackingService.getLastResponse());
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error during API test:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testApiTransformer()
  .then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });

