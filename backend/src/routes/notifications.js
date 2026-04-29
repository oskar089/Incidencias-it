const express = require('express');
const db = require('../db/connection');

const router = express.Router();

// POST /api/notifications/sms
router.post('/sms', async (req, res) => {
  try {
    const { incident_id } = req.body;
    
    if (!incident_id) {
      return res.status(400).json({ error: 'incident_id is required' });
    }
    
    // Get incident details
    const incident = await db.async.get(
      'SELECT * FROM tickets WHERE id = ?',
      [incident_id]
    );
    
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    
    // Check if Twilio is configured
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE;
    const technicianPhone = process.env.TECHNICIAN_PHONE;
    
    if (!twilioSid || !twilioToken || !twilioPhone) {
      return res.status(500).json({ 
        success: false, 
        message: 'Twilio not configured' 
      });
    }
    
    if (!technicianPhone) {
      return res.status(500).json({ 
        success: false, 
        message: 'Technician phone not configured' 
      });
    }
    
    try {
      const twilio = require('twilio');
      const client = twilio(twilioSid, twilioToken);
      
      const message = `Incident #${incident.id}: ${incident.title} (${incident.priority}) - https://app.com/incidents/${incident.id}`;
      
      const smsResult = await client.messages.create({
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
      
      res.json({
        success: true,
        message: 'SMS sent successfully',
        sid: smsResult.sid
      });
    } catch (twilioError) {
      console.error('Twilio error:', twilioError);
      
      // Log failed notification
      await db.async.run(
        `INSERT INTO notifications (ticket_id, type, recipient, status, sent_at)
         VALUES (?, 'sms', ?, 'failed', datetime('now'))`,
        [incident.id, technicianPhone || 'unknown']
      );
      
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send SMS: ' + twilioError.message 
      });
    }
  } catch (error) {
    console.error('SMS notification error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

module.exports = router;
