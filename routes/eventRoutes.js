const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

// Event management
router.post('/', eventController.createEvent);
router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEvent);
router.put('/:id', eventController.updateEvent);

// Weather integration
router.post('/:id/weather-check', eventController.checkEventWeather);
router.get('/:id/alternatives', eventController.getAlternativeDates);

// Analytics
router.get('/:id/suitability', eventController.getEventSuitability);

module.exports = router;
