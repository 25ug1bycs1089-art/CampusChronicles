import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ MongoDB Connection Error: MONGODB_URI environment variable is missing.');
    console.error('👉 Please configure MONGODB_URI in server/.env');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri);

    // Sanitize host to prevent leaking credentials
    const host = conn.connection.host || 'MongoDB Atlas';
    console.log(`🍃 MongoDB Connected: ${host} [DB: ${conn.connection.name}]`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Failed: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
