import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const email = process.argv[2];
const targetRole = process.argv[3] || 'admin';

const validRoles = ['student', 'editor', 'admin'];

async function promoteUser() {
  if (!email) {
    console.log('\n❌ Error: Please specify the user email address.');
    console.log('👉 Usage: npm run promote-role -- <email> [student|editor|admin]');
    console.log('👉 Example: npm run promote-role -- admin@campus.edu admin\n');
    process.exit(1);
  }

  if (!validRoles.includes(targetRole.toLowerCase())) {
    console.log(`\n❌ Error: Invalid role '${targetRole}'. Must be one of: ${validRoles.join(', ')}\n`);
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not set in server/.env');
    process.exit(1);
  }

  try {
    console.log('⏳ Connecting to MongoDB Atlas...');
    await mongoose.connect(uri);

    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.log(`\n⚠️ User '${normalizedEmail}' does not exist yet.`);
      console.log('Creating a new account directly via secure CLI...');

      const defaultPassword = process.argv[4] || 'Admin@Campus2026';
      user = await User.create({
        name: 'Campus Administrator',
        email: normalizedEmail,
        password: defaultPassword,
        role: targetRole.toLowerCase(),
      });

      console.log(`\n✅ Created new ${targetRole.toUpperCase()} account successfully!`);
      console.log(`👤 Name: ${user.name}`);
      console.log(`📧 Email: ${user.email}`);
      console.log(`🔑 Temporary Password: ${defaultPassword}`);
      console.log(`🛡️ Role: ${user.role}`);
      console.log('👉 Please change this password upon your first sign in.\n');
    } else {
      const oldRole = user.role;
      user.role = targetRole.toLowerCase();
      await user.save();

      console.log(`\n✅ Role promotion successful!`);
      console.log(`👤 User: ${user.name} (${user.email})`);
      console.log(`🔄 Role: ${oldRole} ➔ ${user.role.toUpperCase()}\n`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Operation Failed:', error.message);
    process.exit(1);
  }
}

promoteUser();
