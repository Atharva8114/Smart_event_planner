const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

router.get('/:location/:date', weatherController.getWeather);

module.exports = router;