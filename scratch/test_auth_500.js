import axios from 'axios';

async function test() {
  try {
    // This will probably fail because we don't have a valid Firebase token here,
    // but it will tell us if the server is responding and if our middleware catches it.
    const res = await axios.post('http://localhost:5000/api/auth/verify', {}, {
      headers: { Authorization: 'Bearer invalid_token' }
    });
    console.log('Response:', res.status, res.data);
  } catch (err) {
    console.log('Error:', err.response?.status, err.response?.data);
  }
}

test();
