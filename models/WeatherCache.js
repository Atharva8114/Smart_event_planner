const mongoose = require('mongoose');

const weatherCacheSchema = new mongoose.Schema({
  location: { type: String, required: true },
  date: { type: Date, required: true },
  weatherData: { type: mongoose.Schema.Types.Mixed, required: true },
  expiresAt: { type: Date, required: true, index: { expires: '0s' } }
});

module.exports = mongoose.model('WeatherCache', weatherCacheSchema);