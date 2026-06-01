const express = require('express');
const db = require('../db/connection');
const { authenticateToken } = require('./auth');

const router = express.Router();

// GET /api/incidents - List incidents with filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 10 } = req.query;
    
    const offset = (page - 1) * limit;
    const filters = {};
    
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    
    // Get total count
    const countResult = await db.async.count('tickets', filters);
    
    // Get incidents
    const incidents = await db.async.all('tickets', '*', filters, {
      orderBy: 'created_at',
      ascending: false,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      data: incidents,
      total: countResult.total,
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
    const incident = await db.async.get('tickets', '*', { id: parseInt(req.params.id) });
    
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
    
    const result = await db.async.run('tickets', {
      title,
      description,
      status: 'open',
      priority: priority || 'medium',
      category: type || 'Other',
      reporter: req.user.email,
      assignee: null
    });
    
    const incident = await db.async.get('tickets', '*', { id: result.lastID });
    
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
    const incidentId = parseInt(req.params.id);
    
    // Get current incident
    const currentIncident = await db.async.get('tickets', '*', { id: incidentId });
    
    if (!currentIncident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    
    // Build update data
    const updateData = {};
    
    if (status) updateData.status = status;
    if (tecnico_id !== undefined) updateData.assignee = tecnico_id;
    
    updateData.updated_at = new Date().toISOString();
    
    await db.async.update('tickets', updateData, { id: incidentId });
    
    const updatedIncident = await db.async.get('tickets', '*', { id: incidentId });
    
    // Trigger SMS if status changed to "in_progress"
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
    await db.async.run('notifications', {
      ticket_id: incident.id,
      type: 'sms',
      recipient: technicianPhone,
      status: 'sent',
      sent_at: new Date().toISOString()
    });
    
    console.log(`SMS sent for incident #${incident.id}`);
  } catch (error) {
    console.error('Twilio SMS error:', error);
    
    // Log failed notification
    await db.async.run('notifications', {
      ticket_id: incident.id,
      type: 'sms',
      recipient: 'unknown',
      status: 'failed',
      sent_at: new Date().toISOString()
    });
  }
}

module.exports = router;
