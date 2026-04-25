const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const prisma = require('../db');
const { calculateScore } = require('../services/scoringService');

const { MessagingResponse } = twilio.twiml;

// Middleware to parse Twilio's webhook body
router.use(express.urlencoded({ extended: true }));

router.post('/webhook', async (req, res) => {
  const twiml = new MessagingResponse();
  const incomingMsg = req.body.Body?.trim() || '';
  const fromNumber = req.body.From;

  try {
    let session = await prisma.botSession.findUnique({
      where: { phoneNumber: fromNumber }
    });

    if (!session) {
      session = await prisma.botSession.create({
        data: { phoneNumber: fromNumber, step: 'idle' }
      });
    }

    if (incomingMsg.toLowerCase() === 'help' || incomingMsg.toLowerCase() === 'report') {
      await prisma.botSession.update({
        where: { phoneNumber: fromNumber },
        data: { step: 'awaiting_need_type' }
      });
      twiml.message('Emergency Report System\nWhat is the nature of the emergency?\n1. Medical/Medicine\n2. Accidental\n3. Food\n4. Shelter\n5. Rescue/Other\n\nReply with the number.');
    } else if (session.step === 'awaiting_need_type') {
      let needType = 'other';
      if (incomingMsg === '1') needType = 'medical';
      if (incomingMsg === '2') needType = 'accidental';
      if (incomingMsg === '3') needType = 'food';
      if (incomingMsg === '4') needType = 'shelter';
      if (incomingMsg === '5') needType = 'rescue';

      await prisma.botSession.update({
        where: { phoneNumber: fromNumber },
        data: { 
          step: 'awaiting_description', 
          stateData: { needType } 
        }
      });
      twiml.message('Describe the emergency briefly (e.g. "House flooded, families on roof"):');
    } else if (session.step === 'awaiting_description') {
      const state = typeof session.stateData === 'string' ? JSON.parse(session.stateData) : (session.stateData || {});
      
      await prisma.botSession.update({
        where: { phoneNumber: fromNumber },
        data: { 
          step: 'awaiting_people_count', 
          stateData: { ...state, description: incomingMsg } 
        }
      });
      twiml.message('MANDATORY: How many people are affected or injured? (Reply with a number, e.g. "5")');
    } else if (session.step === 'awaiting_people_count') {
      const state = typeof session.stateData === 'string' ? JSON.parse(session.stateData) : (session.stateData || {});
      const count = parseInt(incomingMsg) || 1;
      
      await prisma.botSession.update({
        where: { phoneNumber: fromNumber },
        data: { 
          step: 'awaiting_area_name', 
          stateData: { ...state, peopleAffected: count } 
        }
      });
      twiml.message('What is the name of your Area, Ward, or Village?');
    } else if (session.step === 'awaiting_area_name') {
      const state = typeof session.stateData === 'string' ? JSON.parse(session.stateData) : (session.stateData || {});
      
      await prisma.botSession.update({
        where: { phoneNumber: fromNumber },
        data: { 
          step: 'awaiting_location', 
          stateData: { ...state, areaName: incomingMsg } 
        }
      });
      twiml.message('Almost done. Please share your exact GPS location using the 📎 pin icon in WhatsApp.');
    } else if (session.step === 'awaiting_location') {
      if (req.body.Latitude && req.body.Longitude) {
        const lat = parseFloat(req.body.Latitude);
        const lng = parseFloat(req.body.Longitude);
        const state = typeof session.stateData === 'string' ? JSON.parse(session.stateData) : (session.stateData || {});
        
        // Calculate dynamic urgency score (0-10)
        const priorityScore = calculateScore({
          need_type: state.needType,
          people_affected: state.peopleAffected,
          is_verified: true // WhatsApp location sharing is highly trusted
        });

        await prisma.$executeRaw`
          INSERT INTO needs (title, description, ward, need_type, people_affected, urgency_score, location, is_disaster_zone)
          VALUES (
            ${'WA: ' + (state.description?.substring(0, 40) || 'Urgent Request')}, 
            ${state.description || ''},
            ${state.areaName || ''},
            ${state.needType || 'other'}::"NeedType", 
            ${state.peopleAffected || 1},
            ${priorityScore}, 
            ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326), 
            true
          )
        `;

        await prisma.botSession.update({
          where: { phoneNumber: fromNumber },
          data: { step: 'idle', stateData: {} }
        });
        twiml.message(`Mission Logged! (Priority: ${priorityScore}/10)\nLocation captured for ${state.peopleAffected} people. Volunteers are being dispatched.`);
      } else {
        twiml.message('GPS Location is mandatory. Please use the 📎 icon -> Location -> Send Your Current Location.');
      }
    } else {
      twiml.message('SevaSetu Response Bot\nSend "Report" or "Help" to log a community need.');
    }
  } catch (error) {
    console.error('WhatsApp Bot Error:', error);
    twiml.message('Sorry, we encountered an error. Please try again.');
  }

  res.type('text/xml').send(twiml.toString());
});

module.exports = router;
