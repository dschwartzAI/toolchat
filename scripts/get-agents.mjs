#!/usr/bin/env node
import fetch from 'node-fetch';

async function getAgents() {
  try {
    const response = await fetch('http://localhost:3090/api/agents', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch agents:', response.status, response.statusText);
      return;
    }

    const agents = await response.json();
    console.log('Found agents:');
    agents.forEach(agent => {
      console.log(`Name: ${agent.name}`);
      console.log(`ID: ${agent.id || agent._id}`);
      console.log(`Description: ${agent.description || 'No description'}`);
      console.log('---');
    });
  } catch (error) {
    console.error('Error fetching agents:', error);
  }
}

getAgents();