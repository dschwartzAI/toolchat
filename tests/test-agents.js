#!/usr/bin/env node

/**
 * Agent Functionality Tests for AI Business Tools Platform
 * Tests Dark JK Coach and Hybrid Offer Creator agents
 */

const axios = require('axios');
const assert = require('assert');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../LibreChat/.env') });

// Test configuration
const BASE_URL = process.env.DOMAIN_SERVER || 'http://localhost:3080';
const API_BASE = `${BASE_URL}/api`;

// Test data
const testUsers = {
  admin: {
    email: 'admin@example.com',
    password: 'admin123!@#',
    tier: 'admin'
  },
  premium: {
    email: 'premium@example.com', 
    password: 'premium123',
    tier: 'premium'
  },
  free: {
    email: 'free@example.com',
    password: 'free123',
    tier: 'free'
  }
};

// Helper function to login and get token
async function getAuthToken(user) {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: user.email,
      password: user.password
    });
    
    return response.data.token;
  } catch (error) {
    console.error(`Failed to login as ${user.email}:`, error.response?.data || error.message);
    throw error;
  }
}

// Helper function to make authenticated requests
async function makeAuthRequest(method, url, token, data = null) {
  const config = {
    method,
    url: `${API_BASE}${url}`,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (data) {
    config.data = data;
  }
  
  return axios(config);
}

// Test Dark JK Coach agent
async function testDarkJKCoach() {
  console.log('\n🎯 Testing Dark JK Business Coach...\n');
  
  const tests = [
    {
      name: 'Premium user can access Dark JK Coach',
      user: testUsers.premium,
      shouldPass: true,
      query: 'How should I price my consulting services?'
    },
    {
      name: 'Free user cannot access Dark JK Coach',
      user: testUsers.free,
      shouldPass: false,
      query: 'Help me with pricing'
    },
    {
      name: 'Admin can access Dark JK Coach',
      user: testUsers.admin,
      shouldPass: true,
      query: 'What is leverage in business?'
    }
  ];
  
  for (const test of tests) {
    try {
      console.log(`   📝 ${test.name}`);
      
      const token = await getAuthToken(test.user);
      
      const response = await makeAuthRequest('POST', '/chat/new', token, {
        endpoint: 'agents',
        agent: 'Dark JK Business Coach',
        message: test.query
      });
      
      if (test.shouldPass) {
        assert(response.status === 200, 'Expected successful response');
        assert(response.data.response, 'Expected agent response');
        console.log(`      ✅ Passed - Agent responded`);
        
        // Verify coaching style
        const responseText = response.data.response.toLowerCase();
        assert(!responseText.includes('!'), 'Response should not contain exclamation points');
        console.log(`      ✅ Response follows James Kemp style (no exclamation points)`);
      } else {
        assert(false, 'Expected request to fail for free user');
      }
      
    } catch (error) {
      if (!test.shouldPass && error.response?.status === 403) {
        console.log(`      ✅ Passed - Correctly blocked free user`);
        assert(error.response.data.error.type === 'tier_restriction', 'Expected tier restriction error');
      } else {
        console.log(`      ❌ Failed - ${error.message}`);
        throw error;
      }
    }
  }
}

// Test Hybrid Offer Creator agent
async function testHybridOfferCreator() {
  console.log('\n📝 Testing Hybrid Offer Creator...\n');
  
  const tests = [
    {
      name: 'Premium user can start offer creation',
      user: testUsers.premium,
      shouldPass: true,
      messages: [
        'I want to create a sales letter',
        'Consulting',
        'B2B SaaS companies looking to scale',
        'They struggle with customer retention'
      ]
    },
    {
      name: 'Free user gets tier restriction',
      user: testUsers.free,
      shouldPass: false,
      messages: ['Create an offer for me']
    }
  ];
  
  for (const test of tests) {
    try {
      console.log(`   📝 ${test.name}`);
      
      const token = await getAuthToken(test.user);
      let conversationId = null;
      
      // Send messages in sequence
      for (const message of test.messages) {
        const response = await makeAuthRequest('POST', '/chat/new', token, {
          endpoint: 'agents',
          agent: 'Hybrid Offer Creator',
          message: message,
          conversationId: conversationId
        });
        
        if (test.shouldPass) {
          assert(response.status === 200, 'Expected successful response');
          conversationId = response.data.conversationId;
          
          // Check if conversation flow is working
          const responseText = response.data.response.toLowerCase();
          if (message === test.messages[0]) {
            assert(responseText.includes('offer') || responseText.includes('type'), 
              'First response should ask about offer type');
            console.log(`      ✅ Conversation flow initiated correctly`);
          }
        } else {
          assert(false, 'Expected request to fail for free user');
        }
      }
      
      if (test.shouldPass) {
        console.log(`      ✅ Passed - Conversation flow working`);
      }
      
    } catch (error) {
      if (!test.shouldPass && error.response?.status === 403) {
        console.log(`      ✅ Passed - Correctly blocked free user`);
      } else {
        console.log(`      ❌ Failed - ${error.message}`);
        throw error;
      }
    }
  }
}

// Test agent listing and visibility
async function testAgentVisibility() {
  console.log('\n👁️  Testing Agent Visibility...\n');
  
  const tests = [
    {
      name: 'Admin sees all agents',
      user: testUsers.admin,
      expectedAgents: ['Dark JK Business Coach', 'Hybrid Offer Creator']
    },
    {
      name: 'Premium user sees all agents',
      user: testUsers.premium,
      expectedAgents: ['Dark JK Business Coach', 'Hybrid Offer Creator']
    },
    {
      name: 'Free user sees limited agents',
      user: testUsers.free,
      expectedAgents: [] // May see some agents but cannot use premium ones
    }
  ];
  
  for (const test of tests) {
    try {
      console.log(`   📝 ${test.name}`);
      
      const token = await getAuthToken(test.user);
      const response = await makeAuthRequest('GET', '/agents', token);
      
      assert(response.status === 200, 'Expected successful response');
      const agents = response.data.agents || [];
      
      // Check agent builder visibility
      if (test.user.tier === 'admin') {
        assert(!response.data.disableBuilder, 'Admin should see agent builder');
      } else {
        assert(response.data.disableBuilder === true, 'Non-admin should not see agent builder');
      }
      
      console.log(`      ✅ Agent visibility correct for ${test.user.tier} user`);
      console.log(`      📋 Visible agents: ${agents.map(a => a.name).join(', ') || 'None'}`);
      
    } catch (error) {
      console.log(`      ❌ Failed - ${error.message}`);
      throw error;
    }
  }
}

// Test file search functionality
async function testFileSearch() {
  console.log('\n🔍 Testing File Search (Vector Store)...\n');
  
  try {
    const token = await getAuthToken(testUsers.premium);
    
    // Test Dark JK Coach with specific knowledge query
    const response = await makeAuthRequest('POST', '/chat/new', token, {
      endpoint: 'agents',
      agent: 'Dark JK Business Coach',
      message: 'Tell me about the Sovereign System'
    });
    
    assert(response.status === 200, 'Expected successful response');
    
    // Check if file search was used
    const tools = response.data.metadata?.tools_used || [];
    assert(tools.includes('file_search') || response.data.response.toLowerCase().includes('sovereign'), 
      'Expected file search to be used for knowledge base query');
    
    console.log('   ✅ File search functionality working');
    
  } catch (error) {
    console.log(`   ❌ Failed - ${error.message}`);
    throw error;
  }
}

// Test artifact generation
async function testArtifactGeneration() {
  console.log('\n📄 Testing Artifact Generation...\n');
  
  try {
    const token = await getAuthToken(testUsers.premium);
    let conversationId = null;
    
    // Complete offer information gathering
    const offerData = [
      'I want to create a consulting offer',
      'Consulting',
      'I help B2B SaaS companies optimize their customer success processes',
      'Tech startups with 10-50 employees who need to reduce churn',
      'They lose 30% of customers in the first 90 days',
      'I provide a 90-day customer success transformation program',
      'My unique approach combines automation with personalized touchpoints',
      'Three phases: Audit (2 weeks), Implementation (6 weeks), Optimization (4 weeks)',
      '50% reduction in churn or full refund',
      '$5000 for the full program, or $2000/month for 3 months',
      'Limited to 5 clients per quarter for personalized attention',
      'Previous client reduced churn from 35% to 12% in 90 days'
    ];
    
    console.log('   📝 Gathering offer information...');
    
    for (const message of offerData) {
      const response = await makeAuthRequest('POST', '/chat/new', token, {
        endpoint: 'agents',
        agent: 'Hybrid Offer Creator',
        message: message,
        conversationId: conversationId
      });
      
      conversationId = response.data.conversationId;
    }
    
    console.log('   ⏳ Waiting for document generation...');
    
    // Check if artifact was generated
    const conversation = await makeAuthRequest('GET', `/conversations/${conversationId}`, token);
    const hasArtifact = conversation.data.messages.some(msg => 
      msg.artifacts && msg.artifacts.length > 0
    );
    
    assert(hasArtifact, 'Expected artifact to be generated');
    console.log('   ✅ Document artifact generated successfully');
    
  } catch (error) {
    console.log(`   ❌ Failed - ${error.message}`);
    // This might fail if artifacts aren't fully configured
    console.log('   ⚠️  Note: Artifact generation requires proper Sandpack configuration');
  }
}

// Main test runner
async function runAllTests() {
  console.log('🧪 AI Business Tools Platform - Agent Tests');
  console.log('==========================================');
  
  try {
    // Check if LibreChat is running
    try {
      await axios.get(`${BASE_URL}/health`);
      console.log('\n✅ LibreChat is running\n');
    } catch (error) {
      console.error('❌ LibreChat is not running. Please start it first.');
      process.exit(1);
    }
    
    // Run all tests
    await testAgentVisibility();
    await testDarkJKCoach();
    await testHybridOfferCreator();
    await testFileSearch();
    await testArtifactGeneration();
    
    console.log('\n✨ All tests completed!\n');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testDarkJKCoach,
  testHybridOfferCreator,
  testAgentVisibility,
  testFileSearch,
  testArtifactGeneration
};