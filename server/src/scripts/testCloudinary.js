import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { initCloudinary, cloudinary } = await import('../config/cloudinary.js');

const ok = initCloudinary();
if (!ok) {
  console.error('❌ initCloudinary() returned false — CLOUDINARY_URL is missing or invalid.');
  process.exit(1);
}

const cfg = cloudinary.config();
console.log(`✅ cloud_name  : ${cfg.cloud_name}`);
console.log(`✅ api_key     : ${String(cfg.api_key).slice(0, 6)}${'*'.repeat(8)} (masked)`);
console.log(`✅ secure      : ${cfg.secure}`);
console.log('\n🎉 Cloudinary initialized successfully via CLOUDINARY_URL.');
