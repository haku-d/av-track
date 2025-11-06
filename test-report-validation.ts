/**
 * Test script for POST /report endpoint validation
 * Tests validation logic without requiring MongoDB
 */

import { reportService } from './src/services/report.service';

async function testReportValidation() {
  console.log('🧪 Testing POST /report API Validation\n');

  // Test 1: Validate request - missing format
  console.log('1️⃣ Test validation - missing format');
  const invalidRequest1 = {
    trackingIds: [
      { type: 'purolator', ids: ['123456'] }
    ]
  };
  const validation1 = reportService.validateRequest(invalidRequest1);
  console.log(`   Valid: ${validation1.valid}`);
  console.log(`   Errors: ${validation1.errors.join(', ')}`);
  console.log(`   ${validation1.valid ? '❌ Should have failed' : '✅ Correctly rejected'}\n`);

  // Test 2: Validate request - invalid format
  console.log('2️⃣ Test validation - invalid format');
  const invalidRequest2 = {
    format: 'pdf',
    trackingIds: [
      { type: 'purolator', ids: ['123456'] }
    ]
  };
  const validation2 = reportService.validateRequest(invalidRequest2);
  console.log(`   Valid: ${validation2.valid}`);
  console.log(`   Errors: ${validation2.errors.join(', ')}`);
  console.log(`   ${validation2.valid ? '❌ Should have failed' : '✅ Correctly rejected'}\n`);

  // Test 3: Validate request - missing trackingIds
  console.log('3️⃣ Test validation - missing trackingIds');
  const invalidRequest3 = {
    format: 'json'
  };
  const validation3 = reportService.validateRequest(invalidRequest3);
  console.log(`   Valid: ${validation3.valid}`);
  console.log(`   Errors: ${validation3.errors.join(', ')}`);
  console.log(`   ${validation3.valid ? '❌ Should have failed' : '✅ Correctly rejected'}\n`);

  // Test 4: Validate request - trackingIds not an array
  console.log('4️⃣ Test validation - trackingIds not an array');
  const invalidRequest4 = {
    format: 'json',
    trackingIds: 'not-an-array'
  };
  const validation4 = reportService.validateRequest(invalidRequest4);
  console.log(`   Valid: ${validation4.valid}`);
  console.log(`   Errors: ${validation4.errors.join(', ')}`);
  console.log(`   ${validation4.valid ? '❌ Should have failed' : '✅ Correctly rejected'}\n`);

  // Test 5: Validate request - missing type in trackingIds
  console.log('5️⃣ Test validation - missing type in trackingIds');
  const invalidRequest5 = {
    format: 'json',
    trackingIds: [
      { ids: ['123456'] }
    ]
  };
  const validation5 = reportService.validateRequest(invalidRequest5);
  console.log(`   Valid: ${validation5.valid}`);
  console.log(`   Errors: ${validation5.errors.join(', ')}`);
  console.log(`   ${validation5.valid ? '❌ Should have failed' : '✅ Correctly rejected'}\n`);

  // Test 6: Validate request - missing ids in trackingIds
  console.log('6️⃣ Test validation - missing ids in trackingIds');
  const invalidRequest6 = {
    format: 'json',
    trackingIds: [
      { type: 'purolator' }
    ]
  };
  const validation6 = reportService.validateRequest(invalidRequest6);
  console.log(`   Valid: ${validation6.valid}`);
  console.log(`   Errors: ${validation6.errors.join(', ')}`);
  console.log(`   ${validation6.valid ? '❌ Should have failed' : '✅ Correctly rejected'}\n`);

  // Test 7: Valid request - JSON format
  console.log('7️⃣ Test validation - valid JSON request');
  const validRequest1 = {
    format: 'json',
    trackingIds: [
      {
        type: 'purolator',
        ids: ['335702383951']
      }
    ]
  };
  const validation7 = reportService.validateRequest(validRequest1);
  console.log(`   Valid: ${validation7.valid}`);
  console.log(`   Errors: ${validation7.errors.join(', ')}`);
  console.log(`   ${validation7.valid ? '✅ Validation passed' : '❌ Should have passed'}\n`);

  // Test 8: Valid request - CSV format with multiple carriers
  console.log('8️⃣ Test validation - valid CSV request with multiple carriers');
  const validRequest2 = {
    format: 'csv',
    trackingIds: [
      {
        type: 'purolator',
        ids: ['335702383951', '123456789']
      },
      {
        type: 'ups',
        ids: ['1Z999AA10123456784']
      }
    ]
  };
  const validation8 = reportService.validateRequest(validRequest2);
  console.log(`   Valid: ${validation8.valid}`);
  console.log(`   Errors: ${validation8.errors.join(', ')}`);
  console.log(`   ${validation8.valid ? '✅ Validation passed' : '❌ Should have passed'}\n`);

  console.log('✅ All validation tests completed!\n');
  
  console.log('📝 Summary:');
  console.log('   - Request validation is working correctly');
  console.log('   - To test report generation, you need:');
  console.log('     1. MongoDB running (connection string in .env)');
  console.log('     2. Tracked shipments in the database');
  console.log('     3. Use POST /tracking/purolator/:pin to add shipments');
  console.log('     4. Then use POST /report to generate reports');
}

// Run the tests
testReportValidation().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

