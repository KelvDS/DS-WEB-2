import express from 'express';
import bcrypt from 'bcrypt';
import { dbRun, dbGet, dbAll } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { sendEmail } from '../utils/mailer.js';

const router = express.Router();

// ===================================
// MIDDLEWARE - All routes require admin authentication
// ===================================
router.use(authenticateToken);
router.use(requireRole('admin', 'super'));

// ===================================
// GALLERIES - Get all galleries with image counts
// ===================================
router.get('/galleries', async (req, res) => {
  try {
    const galleries = await dbAll(`
      SELECT g.*,
        (SELECT COUNT(*) FROM images WHERE gallery_id = g.id) as image_count
      FROM galleries g 
      ORDER BY created_at DESC
    `);
    res.json(galleries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===================================
// GALLERIES - Create new gallery
// ===================================
router.post('/galleries', async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await dbRun(
      'INSERT INTO galleries (name, description) VALUES (?, ?)',
      [name, description || '']
    );
    res.json({ id: result.lastID, name, description });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===================================
// CLIENTS - Get all clients with their assigned galleries
// ===================================
router.get('/clients', async (req, res) => {
  try {
    const clients = await dbAll(`
      SELECT u.id, u.email, u.created_at, 
        GROUP_CONCAT(g.name) as galleries
      FROM users u 
      LEFT JOIN client_galleries cg ON u.id = cg.client_id
      LEFT JOIN galleries g ON cg.gallery_id = g.id 
      WHERE u.role = 'client'
      GROUP BY u.id 
      ORDER BY u.created_at DESC
    `);
    res.json(clients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===================================
// ASSIGN GALLERY - Assign a client to a gallery and send email notification
// ===================================
router.post('/assign-gallery', async (req, res) => {
  try {
    const { clientId, galleryId } = req.body;
    
    // Insert or ignore if already assigned
    await dbRun(
      'INSERT OR IGNORE INTO client_galleries (client_id, gallery_id) VALUES (?, ?)',
      [clientId, galleryId]
    );

    // Get client and gallery info for email
    const client = await dbGet('SELECT email FROM users WHERE id = ?', [clientId]);
    const gallery = await dbGet('SELECT name FROM galleries WHERE id = ?', [galleryId]);

    // Send email notification to client
    if (client && gallery) {
      await sendEmail(
        client.email,
        "Gallery Assigned - Da'perfect Studios",
        `You have been assigned to the gallery: ${gallery.name}. Log in to view your photos!`
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===================================
// GALLERY REQUESTS - Get all client requests for gallery access
// ===================================
router.get('/gallery-requests', async (req, res) => {
  try {
    const requests = await dbAll(`
      SELECT gr.*, u.email as client_email
      FROM gallery_requests gr 
      JOIN users u ON gr.client_id = u.id 
      ORDER BY gr.created_at DESC
    `);
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===================================
// GALLERY REQUESTS - Update status (approve/reject)
// ===================================
router.patch('/gallery-requests/:id', async (req, res) => {
  try {
    const { status } = req.body;
    await dbRun(
      'UPDATE gallery_requests SET status = ? WHERE id = ?',
      [status, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===================================
// HIGH-RES REQUESTS - Get all client requests for high-res downloads
// ===================================
router.get('/highres-requests', async (req, res) => {
  try {
    const requests = await dbAll(`
      SELECT hr.*, u.email as client_email
      FROM highres_requests hr 
      JOIN users u ON hr.client_id = u.id 
      ORDER BY hr.created_at DESC
    `);
    // Parse JSON array of image IDs
    res.json(requests.map(r => ({
      ...r,
      image_ids: JSON.parse(r.image_ids_json)
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===================================
// HIGH-RES REQUESTS - Update status and create download approvals
// IMPORTANT: When marked as "paid" or "delivered", creates approved_downloads records
// ===================================
router.patch('/highres-requests/:id', async (req, res) => {
  try {
    const { status } = req.body;
    
    // Get the request details before updating
    const request = await dbGet(
      'SELECT * FROM highres_requests WHERE id = ?',
      [req.params.id]
    );
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Update the request status
    await dbRun(
      'UPDATE highres_requests SET status = ? WHERE id = ?',
      [status, req.params.id]
    );

    // CRITICAL: When marked as "paid" or "delivered", unlock downloads for client
    if (status === 'paid' || status === 'delivered') {
      const imageIds = JSON.parse(request.image_ids_json);
      
      // Create approved download record for each image
      for (const imageId of imageIds) {
        await dbRun(
          'INSERT OR IGNORE INTO approved_downloads (client_id, image_id, request_id) VALUES (?, ?, ?)',
          [request.client_id, imageId, req.params.id]
        );
      }
      
      console.log(`✅ Approved ${imageIds.length} images for download for client ${request.client_id}`);
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===================================
// ADMINS - Get all admin users (super admin only)
// ===================================
router.get('/admins', requireRole('super'), async (req, res) => {
  try {
    const admins = await dbAll(
      'SELECT id, email, role, created_at FROM users WHERE role IN (?, ?)',
      ['admin', 'super']
    );
    res.json(admins);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===================================
// ADMINS - Create new admin (super admin only)
// ===================================
router.post('/admins', requireRole('super'), async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if email already exists
    const existing = await dbGet('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password and create admin
    const hash = await bcrypt.hash(password, 10);
    const result = await dbRun(
      'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
      [email, hash, 'admin']
    );

    res.json({
      id: result.lastID,
      email,
      role: 'admin'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===================================
// ADMINS - Delete admin (super admin only, cannot delete super)
// ===================================
router.delete('/admins/:id', requireRole('super'), async (req, res) => {
  try {
    const admin = await dbGet('SELECT role FROM users WHERE id = ?', [req.params.id]);
    
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    // Prevent deleting super admin
    if (admin.role === 'super') {
      return res.status(403).json({ error: 'Cannot delete super admin' });
    }

    await dbRun('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;