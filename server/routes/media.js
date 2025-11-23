import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbRun } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { createWatermarkedPreview } from '../utils/watermark.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'original-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  },
  limits: { fileSize: 50 * 1024 * 1024 }
});

router.post('/upload/:galleryId', authenticateToken, requireRole('admin', 'super'), upload.array('images', 50), async (req, res) => {
  try {
    const { galleryId } = req.params;
    
    console.log('📤 Upload request for gallery:', galleryId);
    console.log('📁 Files received:', req.files?.length || 0);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploaded = [];
    const failed = [];

    for (const file of req.files) {
      try {
        console.log(`Processing file: ${file.filename}`);
        
        const watermarkedFilename = await createWatermarkedPreview(file.filename);
        
        const result = await dbRun(
          'INSERT INTO images (gallery_id, filename, watermarked_filename) VALUES (?, ?, ?)',
          [galleryId, file.filename, watermarkedFilename]
        );

        uploaded.push({ 
          id: result.lastID, 
          filename: file.filename, 
          watermarked_filename: watermarkedFilename 
        });
        
        console.log(`✅ Uploaded: ${watermarkedFilename}`);
      } catch (err) {
        console.error(`❌ Error processing ${file.filename}:`, err);
        failed.push({ filename: file.filename, error: err.message });
      }
    }

    console.log(`📊 Upload complete: ${uploaded.length} success, ${failed.length} failed`);
    
    res.json({ 
      uploaded, 
      failed,
      count: uploaded.length,
      totalAttempted: req.files.length
    });
  } catch (err) {
    console.error('Upload route error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

export default router;