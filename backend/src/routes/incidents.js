const express = require('express');
const db = require('../db/connection');
const { authenticateToken } = require('./auth');

const router = express.Router();

// GET /api/incidents - List incidents with filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 10 } = req.query;
    
    const offset = (page - 1) * limit;
    const params = [];
    const conditions = [];
    
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    
    if (priority) {
      conditions.push('priority = ?');
      params.push(priority);
    }
    
    const whereClause = conditions.length > 0 
      ? 'WHERE ' + conditions.join(' AND ')
      : '';
    
    // Get total count
    const countRow = await db.async.get(
      `SELECT COUNT(*) as total FROM tickets ${whereClause}`,
      params
    );
    
    // Get incidents
    const incidents = await db.async.all(
      `SELECT * FROM tickets ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    
    res.json({
      data: incidents,
      total: countRow.total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('List incidents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/incidents/:id - Get single incident
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const incident = await db.async.get(
      'SELECT * FROM tickets WHERE id = ?',
      [req.params.id]
    );
    
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    
    res.json(incident);
  } catch (error) {
    console.error('Get incident error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/incidents - Create incident
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, type, priority, department, equipo } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }
    
    const result = await db.async.run(
      `INSERT INTO tickets (title, description, status, priority, category, reporter, assignee, created_at, updated_at)
       VALUES (?, ?, 'open', ?, ?, ?, NULL, datetime('now'), datetime('now'))`,
      [title, description, priority || 'medium', type || 'Other', req.user.email, req.user.email]
    );
    
    const incident = await db.async.get(
      'SELECT * FROM tickets WHERE id = ?',
      [result.lastID]
    );
    
    res.status(201).json(incident);
  } catch (error) {
    console.error('Create incident error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/incidents/:id - Update incident status
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { status, tecnico_id } = req.body;
    const incidentId = req.params.id;
    
    // Get current incident
    const currentIncident = await db.async.get(
      'SELECT * FROM tickets WHERE id = ?',
      [incidentId]
    );
    
    if (!currentIncident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    
    // Build update query
    const updates = [];
    const params = [];
    
    if (status) {
      updates.push('status = ?');
      params.push(status);
    }
    
    if (tecnico_id !== undefined) {
      updates.push('assignee = ?');
      params.push(tecnico_id);
    }
    
    updates.push("updated_at = datetime('now')");
    
    params.push(incidentId);
    
    await db.async.run(
      `UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    const updatedIncident = await db.async.get(
      'SELECT * FROM tickets WHERE id = ?',
      [incidentId]
    );
    
    // Trigger SMS if status changed to "assigned" (in our case "in_progress")
    if (status === 'in_progress' && currentIncident.status !== 'in_progress') {
      // Trigger SMS notification asynchronously
      triggerSMSNotification(updatedIncident).catch(err => {
        console.error('SMS notification failed:', err.message);
      });
    }
    
    res.json(updatedIncident);
  } catch (error) {
    console.error('Update incident error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Function to trigger SMS via Twilio
async function triggerSMSNotification(incident) {
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE;
  
  // Skip if Twilio not configured
  if (!twilioSid || !twilioToken || !twilioPhone) {
    console.log('Twilio not configured, skipping SMS notification');
    return;
  }
  
  try {
    const twilio = require('twilio');
    const client = twilio(twilioSid, twilioToken);
    
    // Get technician phone (in a real app, you'd have technician phone in DB)
    // For now, we'll use a placeholder
    const technicianPhone = process.env.TECHNICIAN_PHONE;
    
    if (!technicianPhone) {
      console.log('No technician phone configured');
      return;
    }
    
    const message = `Incident #${incident.id}: ${incident.title} (${incident.priority}) - https://app.com/incidents/${incident.id}`;
    
    await client.messages.create({
      body: message,
      from: twilioPhone,
      to: technicianPhone
    });
    
    // Log notification
    await db.async.run(
      `INSERT INTO notifications (ticket_id, type, recipient, status, sent_at)
       VALUES (?, 'sms', ?, 'sent', datetime('now'))`,
      [incident.id, technicianPhone]
    );
    
    console.log(`SMS sent for incident #${incident.id}`);
  } catch (error) {
    console.error('Twilio SMS error:', error);
    
    // Log failed notification
    await db.async.run(
      `INSERT INTO notifications (ticket_id, type, recipient, status, sent_at)
       VALUES (?, 'sms', 'unknown', 'failed', datetime('now'))`,
      [incident.id]
    );
  }
}

module.exports = router;
