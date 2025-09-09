#!/usr/bin/env node

/* eslint-disable no-undef */
/* eslint-disable no-console */
/* eslint-disable no-unused-vars */

/**
 * API Testing Script for Advanced Project
 * Tests all API endpoints to verify they are working correctly
 */

import http from 'http';
import { PORT } from './config/env.js';

const BASE_URL = `http://localhost:${PORT || 5500}`;
const API_BASE = '/api/v1';

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    // Add User-Agent header to avoid Arcjet blocking
    options.headers = {
      'User-Agent': 'API-Test-Script/1.0',
      ...options.headers
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData,
            rawData: responseData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData,
            rawData: responseData
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test a single endpoint
async function testEndpoint(name, method, path, expectedStatus = 200, data = null, headers = {}) {
  testResults.total++;
  
  const options = {
    hostname: 'localhost',
    port: PORT || 5500,
    path: path,
    method: method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  try {
    const response = await makeRequest(options, data);
    const success = response.statusCode === expectedStatus;
    
    if (success) {
      testResults.passed++;
    } else {
      testResults.failed++;
    }

    testResults.details.push({
      name,
      method,
      path,
      expected: expectedStatus,
      actual: response.statusCode,
      success,
      response: response.rawData.substring(0, 200) + (response.rawData.length > 200 ? '...' : ''),
      error: null
    });

    console.log(`${success ? '✅' : '❌'} ${name}: ${method} ${path} (${response.statusCode})`);
    return { success, response };
    
  } catch (error) {
    testResults.failed++;
    testResults.details.push({
      name,
      method,
      path,
      expected: expectedStatus,
      actual: 'ERROR',
      success: false,
      response: null,
      error: error.message
    });

    console.log(`❌ ${name}: ${method} ${path} (ERROR: ${error.message})`);
    return { success: false, error };
  }
}

// Main testing function
async function runTests() {
  console.log('🚀 Starting API Tests...\n');
  console.log(`Testing APIs at ${BASE_URL}\n`);

  // Test 1: Home endpoint
  await testEndpoint('Home Page', 'GET', '/', 200);

  // Test 2: Swagger docs
  await testEndpoint('Swagger Docs', 'GET', '/api-docs/', 200);

  // Test 3: Authentication endpoints
  console.log('\n📝 Testing Authentication Endpoints:');
  
  // Sign up with test data
  const signupData = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'testpassword123'
  };
  
  const signupResult = await testEndpoint(
    'User Signup', 
    'POST', 
    `${API_BASE}/auth/sign-up`, 
    201, 
    signupData
  );

  // Sign in with test data
  const signinData = {
    email: 'test@example.com',
    password: 'testpassword123'
  };
  
  const signinResult = await testEndpoint(
    'User Signin', 
    'POST', 
    `${API_BASE}/auth/sign-in`, 
    200, 
    signinData
  );

  // Extract auth token if available
  let authToken = null;
  if (signinResult.success && signinResult.response.headers['set-cookie']) {
    // Try to extract token from cookies
    const cookies = signinResult.response.headers['set-cookie'];
    if (Array.isArray(cookies)) {
      const tokenCookie = cookies.find(cookie => cookie.includes('token='));
      if (tokenCookie) {
        authToken = tokenCookie.split('token=')[1].split(';')[0];
      }
    }
  }

  // Sign out
  await testEndpoint('User Signout', 'POST', `${API_BASE}/auth/sign-out`, 200);

  // Test 4: User endpoints
  console.log('\n👥 Testing User Endpoints:');
  
  await testEndpoint('Get All Users', 'GET', `${API_BASE}/users`, 200);
  
  // Test with auth token if available
  const authHeaders = authToken ? { 'Cookie': `token=${authToken}` } : {};
  
  await testEndpoint('Get User by ID (with auth)', 'GET', `${API_BASE}/users/test123`, 401, null, authHeaders);
  
  // Test CRUD placeholders
  await testEndpoint('Create User (placeholder)', 'POST', `${API_BASE}/users`, 200);
  await testEndpoint('Update User (placeholder)', 'PUT', `${API_BASE}/users/test123`, 200);
  await testEndpoint('Delete User (placeholder)', 'DELETE', `${API_BASE}/users/test123`, 200);

  // Test 5: Subscription endpoints
  console.log('\n💰 Testing Subscription Endpoints:');
  
  // These require authentication, expect 401 without proper auth
  await testEndpoint('Get All Subscriptions (no auth)', 'GET', `${API_BASE}/subscriptions`, 401);
  await testEndpoint('Get Subscription by ID (no auth)', 'GET', `${API_BASE}/subscriptions/test123`, 401);
  await testEndpoint('Create Subscription (no auth)', 'POST', `${API_BASE}/subscriptions`, 401);
  await testEndpoint('Update Subscription (no auth)', 'PUT', `${API_BASE}/subscriptions/test123`, 401);
  await testEndpoint('Delete Subscription (no auth)', 'DELETE', `${API_BASE}/subscriptions/test123`, 401);
  await testEndpoint('Get User Subscriptions (no auth)', 'GET', `${API_BASE}/subscriptions/user/test123`, 401);
  await testEndpoint('Cancel Subscription (no auth)', 'PUT', `${API_BASE}/subscriptions/test123/cancel`, 401);
  await testEndpoint('Get Upcoming Renewals (no auth)', 'GET', `${API_BASE}/subscriptions/upcoming-renewals`, 401);

  // Test 6: Workflow endpoints
  console.log('\n⚡ Testing Workflow Endpoints:');
  
  await testEndpoint('Send Reminders', 'POST', `${API_BASE}/workflows/subscription/reminder`, 200);

  // Test 7: Non-existent endpoints
  console.log('\n🔍 Testing Non-existent Endpoints:');
  
  await testEndpoint('Non-existent endpoint', 'GET', '/api/v1/nonexistent', 404);

  // Generate final report
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed} ✅`);
  console.log(`Failed: ${testResults.failed} ❌`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.details
      .filter(test => !test.success)
      .forEach(test => {
        console.log(`  • ${test.name}: Expected ${test.expected}, got ${test.actual}`);
        if (test.error) {
          console.log(`    Error: ${test.error}`);
        }
      });
  }

  console.log('\n✅ Passed Tests:');
  testResults.details
    .filter(test => test.success)
    .forEach(test => {
      console.log(`  • ${test.name}: ${test.method} ${test.path}`);
    });

  return testResults;
}

// Check if server is running
async function checkServer() {
  try {
    await makeRequest({
      hostname: 'localhost',
      port: PORT || 5500,
      path: '/',
      method: 'GET'
    });
    return true;
  } catch (error) {
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔍 Checking if server is running...');
  
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ Server is not running. Please start the server first with:');
    console.log('   npm start');
    console.log('   or');
    console.log('   npm run dev');
    process.exit(1);
  }

  console.log('✅ Server is running, starting tests...\n');
  
  const results = await runTests();
  
  // Exit with error code if tests failed
  process.exit(results.failed > 0 ? 1 : 0);
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
  process.exit(1);
});

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { runTests, testEndpoint };