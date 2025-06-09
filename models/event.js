const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  date: { type: Date, required: true },
  eventType: { 
    type: String, 
    required: true,
    enum: ['sports', 'wedding', 'hiking', 'corporate'] 
  },
  weatherData: { type: mongoose.Schema.Types.Mixed },
  suitabilityScore: { type: Number },
  suitabilityStatus: { type: String, enum: ['Good', 'Okay', 'Poor'] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', eventSchema);