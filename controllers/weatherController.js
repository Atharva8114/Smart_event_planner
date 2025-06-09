const weatherService = require('../services/weatherService');

async function getWeather(req, res) {
  try {
    const { location, date } = req.params;
    const weatherData = await weatherService.getWeatherForLocationAndDate(location, date);
    res.json(weatherData);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

module.exports = {
  getWeather
};
