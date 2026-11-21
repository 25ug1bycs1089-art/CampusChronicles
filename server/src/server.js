import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Load environment variables first
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// 2. Import app and database connection
const { default: connectDB } = await import('./config/db.js');
const { default: app } = await import('./app.js');
const { initCloudinary } = await import('./config/cloudinary.js');

// 3. Initialize Cloudinary (reads CLOUDINARY_URL from environment)
initCloudinary();

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// 3. Connect to Database, then start listening
await connectDB();

const server = app.listen(PORT, () => {
  console.log(`🚀 Campus Chronicles API server running on port ${PORT} [${NODE_ENV}]`);
  console.log(`👉 Health check: http://localhost:${PORT}/api/health`);
  console.log(`👉 Auth endpoints: http://localhost:${PORT}/api/auth`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection Error:', err);
  server.close(() => process.exit(1));
});
