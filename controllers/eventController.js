const Event = require('../models/Event');
const weatherService = require('../services/weatherService');

async function createEvent(req, res) {
  try {
    const { name, location, date, eventType } = req.body;
    
    const event = new Event({
      name,
      location,
      date,
      eventType
    });
    
    // Get weather data and analyze suitability
    await analyzeEventWeather(event);
    
    await event.save();
    
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function getEvents(req, res) {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getEvent(req, res) {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function updateEvent(req, res) {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Re-analyze weather if location or date changed
    if (req.body.location || req.body.date) {
      await analyzeEventWeather(event);
      await event.save();
    }
    
    res.json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function checkEventWeather(req, res) {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    await analyzeEventWeather(event);
    await event.save();
    
    res.json({
      weatherData: event.weatherData,
      suitabilityScore: event.suitabilityScore,
      suitabilityStatus: event.suitabilityStatus
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getEventSuitability(req, res) {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json({
      suitabilityScore: event.suitabilityScore,
      suitabilityStatus: event.suitabilityStatus,
      weatherSummary: {
        temperature: event.weatherData.temperature,
        precipitation: event.weatherData.precipitation,
        windSpeed: event.weatherData.windSpeed,
        conditions: event.weatherData.conditions
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getAlternativeDates(req, res) {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const originalDate = new Date(event.date);
    const alternatives = [];
    
    // Check 3 days before and after the original date
    for (let i = -3; i <= 3; i++) {
      if (i === 0) continue; // Skip the original date
      
      const altDate = new Date(originalDate);
      altDate.setDate(altDate.getDate() + i);
      
      try {
        const weatherData = await weatherService.getWeatherForLocationAndDate(
          event.location,
          altDate
        );
        
        const tempEvent = {
          eventType: event.eventType,
          weatherData
        };
        
        const { score, status } = calculateSuitability(tempEvent);
        
        alternatives.push({
          date: altDate,
          weatherData,
          suitabilityScore: score,
          suitabilityStatus: status
        });
      } catch (error) {
        console.error(`Error checking alternative date ${altDate}:`, error.message);
      }
    }
    
    // Sort by suitability score (descending)
    alternatives.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
    
    res.json({
      originalDate,
      alternatives
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Helper functions
async function analyzeEventWeather(event) {
  const weatherData = await weatherService.getWeatherForLocationAndDate(
    event.location,
    event.date
  );
  
  event.weatherData = weatherData;
  
  const { score, status } = calculateSuitability(event);
  event.suitabilityScore = score;
  event.suitabilityStatus = status;
}

function calculateSuitability(event) {
  const { weatherData, eventType } = event;
  let score = 0;
  
  // Base scoring for all event types
  if (weatherData.precipitation < 10) score += 30;
  else if (weatherData.precipitation < 30) score += 15;
  
  // Event type specific scoring
  switch (eventType) {
    case 'sports':
      if (weatherData.temperature.avg >= 15 && weatherData.temperature.avg <= 30) score += 30;
      if (weatherData.windSpeed < 20) score += 20;
      if (['Clear', 'Clouds'].includes(weatherData.conditions)) score += 25;
      break;
      
    case 'wedding':
      if (weatherData.temperature.avg >= 18 && weatherData.temperature.avg <= 28) score += 30;
      if (weatherData.windSpeed < 15) score += 25;
      if (weatherData.conditions === 'Clear') score += 15;
      break;
      
    case 'hiking':
      if (weatherData.temperature.avg >= 10 && weatherData.temperature.avg <= 25) score += 30;
      if (weatherData.windSpeed < 25) score += 20;
      if (weatherData.precipitation < 20) score += 25;
      break;
      
    case 'corporate':
      if (weatherData.temperature.avg >= 20 && weatherData.temperature.avg <= 26) score += 30;
      if (weatherData.windSpeed < 15) score += 25;
      if (['Clear', 'Clouds'].includes(weatherData.conditions)) score += 20;
      break;
  }
  
  // Determine status
  let status;
  if (score >= 80) status = 'Good';
  else if (score >= 50) status = 'Okay';
  else status = 'Poor';
  
  return { score, status };
}

module.exports = {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  checkEventWeather,
  getEventSuitability,
  getAlternativeDates
};