/**
 * Test script for POST /report endpoint
 * Tests report generation from tracked_shipments collection
 */

import { reportService } from './src/services/report.service';
import { ReportRequest } from './src/types/report.types';
import { trackingDatabaseService } from './src/services/tracking-database.service';
import mongoose from 'mongoose';

async function testReportAPI() {
  console.log('🧪 Testing POST /report API (Database-based)\n');

  // Connect to MongoDB
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/e-tracking';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }

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

  // Check what tracking IDs are in the database
  console.log('📊 Checking database for tracked shipments...');
  const allShipments = await trackingDatabaseService.getAllTrackedShipments();
  console.log(`   Found ${allShipments.length} tracked shipments in database`);

  if (allShipments.length > 0) {
    console.log('   Sample shipments:');
    allShipments.slice(0, 3).forEach(s => {
      console.log(`   - ${s.service}: ${s.trackingNo} (Status: ${s.trackingResponse.status})`);
    });
  }
  console.log('');

  // Test 4: Valid request - JSON format (using actual database IDs)
  console.log('4️⃣ Test valid request - JSON format');

  // Use actual tracking IDs from database if available
  let testTrackingIds = [
    {
      type: 'purolator' as const,
      ids: ['335702383951'] // Default test ID
    }
  ];

  if (allShipments.length > 0) {
    // Group shipments by service
    const shipmentsByService = allShipments.reduce((acc, s) => {
      if (!acc[s.service]) acc[s.service] = [];
      acc[s.service].push(s.trackingNo);
      return acc;
    }, {} as Record<string, string[]>);

    testTrackingIds = Object.entries(shipmentsByService).map(([service, ids]) => ({
      type: service as any,
      ids: ids.slice(0, 2) // Take first 2 IDs per service
    }));

    console.log(`   Using ${testTrackingIds.length} carrier(s) from database`);
  }

  const validRequest: ReportRequest = {
    format: 'json',
    trackingIds: testTrackingIds
  };

  const validation4 = reportService.validateRequest(validRequest);
  console.log(`   Valid: ${validation4.valid}`);
  console.log(`   ${validation4.valid ? '✅ Validation passed' : '❌ Should have passed'}\n`);

  if (validation4.valid) {
    console.log('   Generating JSON report...');
    try {
      const jsonReport = await reportService.generateReport(validRequest);
      console.log(`   ✅ Report generated successfully`);
      console.log(`   Format: ${jsonReport.format}`);
      console.log(`   Generated at: ${jsonReport.generatedAt}`);
      console.log(`   Total tracked: ${jsonReport.totalTracked}`);
      console.log(`   Success count: ${jsonReport.successCount}`);
      console.log(`   Error count: ${jsonReport.errorCount}`);
      
      if (jsonReport.format === 'json') {
        console.log(`\n   📊 Report Data:`);
        jsonReport.data.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.carrier} - ${item.trackingId}`);
          console.log(`      Status: ${item.status} - ${item.description}`);
          if (item.lastEventDescription) {
            console.log(`      Last Event: ${item.lastEventDescription}`);
            console.log(`      Event Date: ${item.lastEventDate}`);
            console.log(`      Location: ${item.lastEventLocation || 'N/A'}`);
          }
          if (item.error) {
            console.log(`      Error: ${item.error}`);
          }
        });
      }
    } catch (error) {
      console.error(`   ❌ Error generating report: ${error}`);
    }
  }

  // Test 5: Valid request - CSV format
  console.log('\n5️⃣ Test valid request - CSV format');
  const csvRequest: ReportRequest = {
    format: 'csv',
    trackingIds: [
      {
        type: 'purolator',
        ids: ['335702383951']
      }
    ]
  };

  try {
    const csvReport = await reportService.generateReport(csvRequest);
    console.log(`   ✅ CSV report generated successfully`);
    console.log(`   Format: ${csvReport.format}`);
    console.log(`   Total tracked: ${csvReport.totalTracked}`);
    console.log(`   Success count: ${csvReport.successCount}`);
    console.log(`   Error count: ${csvReport.errorCount}`);
    
    if (csvReport.format === 'csv') {
      console.log(`\n   📄 CSV Content (first 500 chars):`);
      console.log(`   ${csvReport.csv.substring(0, 500)}...`);
    }
  } catch (error) {
    console.error(`   ❌ Error generating CSV report: ${error}`);
  }

  // Test 6: Multi-carrier request (with unsupported carrier)
  console.log('\n6️⃣ Test multi-carrier request (Purolator + UPS)');
  const multiCarrierRequest: ReportRequest = {
    format: 'json',
    trackingIds: [
      {
        type: 'purolator',
        ids: ['335702383951']
      },
      {
        type: 'ups',
        ids: ['1Z999AA10123456784']
      }
    ]
  };

  try {
    const multiReport = await reportService.generateReport(multiCarrierRequest);
    console.log(`   ✅ Multi-carrier report generated`);
    console.log(`   Total tracked: ${multiReport.totalTracked}`);
    console.log(`   Success count: ${multiReport.successCount}`);
    console.log(`   Error count: ${multiReport.errorCount}`);
    
    if (multiReport.format === 'json') {
      console.log(`\n   📊 Report Summary:`);
      multiReport.data.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.carrier} - ${item.trackingId}: ${item.status}`);
        if (item.error) {
          console.log(`      ⚠️  ${item.error}`);
        }
      });
    }
  } catch (error) {
    console.error(`   ❌ Error generating multi-carrier report: ${error}`);
  }

  console.log('\n✅ All tests completed!');

  // Disconnect from MongoDB
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
}

// Run the tests
testReportAPI().catch(error => {
  console.error('❌ Test failed:', error);
  mongoose.disconnect().finally(() => process.exit(1));
});

