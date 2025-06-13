const axios = require('axios');

const API_BASE = 'http://192.168.1.3:9001/api';

async function testExistingPatient() {
  try {
    console.log('Testing with existing patient...');
    
    // Login with the existing test patient
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'testpatient@example.com',
      password: 'testpassword123'
    });
    
    console.log('Login successful:', !!loginResponse.data.token);
    
    if (loginResponse.data.token) {
      const token = loginResponse.data.token;
      console.log('Token received, testing profile endpoint...');
      
      // Test the profile endpoint with the token
      const profileResponse = await axios.get(`${API_BASE}/patients/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Profile endpoint success!');
      console.log('Patient name:', profileResponse.data.name);
      console.log('Has doctors:', profileResponse.data.doctors?.length || 0);
      console.log('Has medicine schedules:', profileResponse.data.medicineSchedules?.length || 0);
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

testExistingPatient(); 