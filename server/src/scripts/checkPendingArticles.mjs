import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

await mongoose.connect(process.env.MONGODB_URI);
console.log('Connected to MongoDB');

const db = mongoose.connection.db;

// Count by status
const pipeline = [{ $group: { _id: '$status', count: { $sum: 1 } } }];
const statusCounts = await db.collection('articles').aggregate(pipeline).toArray();
console.log('Article counts by status:', JSON.stringify(statusCounts, null, 2));

// Show first few pending articles
const pending = await db.collection('articles').find({ status: 'pending' }).limit(5).toArray();
console.log('Pending articles (' + pending.length + '):', pending.map(a => ({ id: a._id, title: a.title, status: a.status })));

// Also check admin user role
const admin = await db.collection('users').findOne({ role: 'admin' });
console.log('Admin user:', admin ? { name: admin.name, email: admin.email, role: admin.role } : 'NOT FOUND');

await mongoose.disconnect();
