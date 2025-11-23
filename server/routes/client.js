import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbRun, dbGet, dbAll } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
router.use(authenticateToken);
router.use(requireRole('client'));

router.post('/request-gallery', async (req, res) => {
  try {
    const existing = await dbGet('SELECT id FROM gallery_requests WHERE client_id = ? AND status = ?', [req.user.id, 'pending']);
    if (existing) return res.status(400).json({ error: 'You already have a pending request' });
    const result = await dbRun('INSERT INTO gallery_requests (client_id) VALUES (?)', [req.user.id]);
    res.json({ id: result.lastID, status: 'pending' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/galleries', async (req, res) => {
  try {
    const galleries = await dbAll(`SELECT g.* FROM galleries g
      JOIN client_galleries cg ON g.id = cg.gallery_id WHERE cg.client_id = ?`, [req.user.id]);
    res.json(galleries);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/galleries/:id/images', async (req, res) => {
  try {
    const access = await dbGet('SELECT * FROM client_galleries WHERE client_id = ? AND gallery_id = ?', 
      [req.user.id, req.params.id]);
    if (!access) return res.status(403).json({ error: 'Access denied' });

    const images = await dbAll(`SELECT i.*,
      EXISTS(SELECT 1 FROM favorites WHERE client_id = ? AND image_id = i.id) as is_favorite,
      EXISTS(SELECT 1 FROM selections WHERE client_id = ? AND image_id = i.id) as is_selected,
      EXISTS(SELECT 1 FROM approved_downloads WHERE client_id = ? AND image_id = i.id) as is_approved
      FROM images i WHERE i.gallery_id = ? ORDER BY i.uploaded_at DESC`,
      [req.user.id, req.user.id, req.user.id, req.params.id]);
    res.json(images);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/favorites/:imageId', async (req, res) => {
  try {
    const existing = await dbGet('SELECT * FROM favorites WHERE client_id = ? AND image_id = ?', 
      [req.user.id, req.params.imageId]);
    if (existing) {
      await dbRun('DELETE FROM favorites WHERE client_id = ? AND image_id = ?', [req.user.id, req.params.imageId]);
      res.json({ is_favorite: false });
    } else {
      await dbRun('INSERT INTO favorites (client_id, image_id) VALUES (?, ?)', [req.user.id, req.params.imageId]);
      res.json({ is_favorite: true });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/selections/:imageId', async (req, res) => {
  try {
    const approved = await dbGet('SELECT * FROM approved_downloads WHERE client_id = ? AND image_id = ?', 
      [req.user.id, req.params.imageId]);
    
    if (approved) {
      return res.status(400).json({ error: 'Cannot deselect approved images' });
    }

    const existing = await dbGet('SELECT * FROM selections WHERE client_id = ? AND image_id = ?', 
      [req.user.id, req.params.imageId]);
    if (existing) {
      await dbRun('DELETE FROM selections WHERE client_id = ? AND image_id = ?', 
        [req.user.id, req.params.imageId]);
      res.json({ is_selected: false });
    } else {
      await dbRun('INSERT INTO selections (client_id, image_id) VALUES (?, ?)', 
        [req.user.id, req.params.imageId]);
      res.json({ is_selected: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/request-highres', async (req, res) => {
  try {
    const { imageIds } = req.body;
    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({ error: 'Image IDs required' });
    }
    const result = await dbRun('INSERT INTO highres_requests (client_id, image_ids_json) VALUES (?, ?)', 
      [req.user.id, JSON.stringify(imageIds)]);
    res.json({ id: result.lastID, status: 'pending' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/requests', async (req, res) => {
  try {
    const requests = await dbAll('SELECT * FROM highres_requests WHERE client_id = ? ORDER BY created_at DESC', 
      [req.user.id]);
    res.json(requests.map(r => ({ ...r, image_ids: JSON.parse(r.image_ids_json) })));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/download/:imageId', async (req, res) => {
  try {
    const approval = await dbGet(
      'SELECT ad.*, i.filename FROM approved_downloads ad JOIN images i ON ad.image_id = i.id WHERE ad.client_id = ? AND ad.image_id = ?',
      [req.user.id, req.params.imageId]
    );

    if (!approval) {
      return res.status(403).json({ error: 'Download not authorized for this image' });
    }

    const filePath = path.join(__dirname, '../uploads', approval.filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(filePath, `daperfect-${approval.filename}`, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Download failed' });
        }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;