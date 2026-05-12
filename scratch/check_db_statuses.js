import mongoose from 'mongoose';
import ServiceRequest from '../src/models/ServiceRequest.js';
import User from '../src/models/User.js';
import Vehicle from '../src/models/Vehicle.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkRequests() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const request = await ServiceRequest.findById('69fc4dd1458d7bbe7b1ec2de')
      .populate('userId')
      .populate('vehicleId');
    
    console.log('Full Request Data:', JSON.stringify(request, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkRequests();
