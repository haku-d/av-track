/**
 * Test authentication with Purolator API
 */

require('dotenv').config();

// Enable SOAP debugging
process.env.DEBUG_SOAP = 'true';

const { shipmentTrackingService } = require('./dist/services/shipment-tracking.service');

async function testAuth() {
  console.log('='.repeat(80));
  console.log('Testing Purolator API Authentication');
  console.log('='.repeat(80));
  console.log();

  try {
    // Initialize the service
    console.log('Initializing tracking service...');
    await shipmentTrackingService.initialize();
    console.log('✓ Service initialized\n');

    // Test with a simple tracking request
    console.log('Making tracking request...');
    console.log();

    const result = await shipmentTrackingService.track({
      trackingIds: ['335701264889']
    });

    console.log('\n=== RESULT ===');
    console.log(JSON.stringify(result, null, 2));
    console.log('='.repeat(80));

    if (result.success) {
      console.log('\n✅ SUCCESS! Authentication working correctly.');
    } else {
      console.log('\n❌ Request failed. Check the error details above.');
    }

  } catch (error) {
    console.error('\n❌ Error during test:', error.message);
    if (error.response) {
      console.error('\nResponse status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the test
testAuth().then(() => {
  console.log('\nTest completed!');
  process.exit(0);
}).catch(error => {
  console.error('\nTest failed:', error);
  process.exit(1);
});

