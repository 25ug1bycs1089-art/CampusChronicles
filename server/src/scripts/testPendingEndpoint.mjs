import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

await mongoose.connect(process.env.MONGODB_URI);

// Get admin user
const admin = await mongoose.connection.db.collection('users').findOne({ role: 'admin' });
console.log('Admin found:', admin ? admin.email : 'NOT FOUND');

if (admin) {
  // Generate a valid JWT
  const secret = process.env.JWT_SECRET || 'development_jwt_secret_placeholder';
  const token = jwt.sign({ id: admin._id.toString() }, secret, { expiresIn: '1h' });
  console.log('Token generated (first 40 chars):', token.substring(0, 40) + '...');

  // Test the pending endpoint
  const response = await fetch('http://localhost:5000/api/articles/pending', {
    headers: {
      'Cookie': 'token=' + token,
      'Content-Type': 'application/json',
    },
  });

  console.log('Status:', response.status);
  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2).substring(0, 800));
}

await mongoose.disconnect();
