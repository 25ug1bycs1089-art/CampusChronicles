import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

await mongoose.connect(process.env.MONGODB_URI);
console.log('Connected to MongoDB');

const result = await mongoose.connection.db.collection('users').deleteMany({ role: 'editor' });
console.log('Deleted ' + result.deletedCount + ' editor account(s)');

await mongoose.disconnect();
console.log('Done');
