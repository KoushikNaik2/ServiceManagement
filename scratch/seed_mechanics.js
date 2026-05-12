import mongoose from 'mongoose';
import Mechanic from '../src/models/Mechanic.js';
import dotenv from 'dotenv';
dotenv.config();

const seedMechanics = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await Mechanic.deleteMany({});
    
    const mechanics = [
      {
        name: 'Sarah Chen',
        specialization: 'EV & Hybrid Systems',
        experience: 8,
        phone: '555-0123',
        status: 'Available',
        rating: 4.9,
        completedTasks: 142,
        activeTasks: 2
      },
      {
        name: 'Marco Rossi',
        specialization: 'Engine Tuning',
        experience: 12,
        phone: '555-0124',
        status: 'Busy',
        rating: 4.8,
        completedTasks: 310,
        activeTasks: 5
      },
      {
        name: 'Alex Rivera',
        specialization: 'Diagnostics & Electrical',
        experience: 6,
        phone: '555-0125',
        status: 'Available',
        rating: 4.7,
        completedTasks: 89,
        activeTasks: 1
      },
      {
        name: 'James Wilson',
        specialization: 'Brakes & Suspension',
        experience: 15,
        phone: '555-0126',
        status: 'Available',
        rating: 5.0,
        completedTasks: 450,
        activeTasks: 0
      }
    ];

    await Mechanic.insertMany(mechanics);
    console.log('Mechanics seeded successfully');
    process.exit();
  } catch (error) {
    console.error('Error seeding:', error);
    process.exit(1);
  }
};

seedMechanics();
