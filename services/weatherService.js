const axios = require('axios');
const WeatherCache = require('../models/WeatherCache');
require('dotenv').config();

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const CACHE_DURATION_HOURS = 3;

async function getWeatherForLocationAndDate(location, date) {
  // Check cache first
  const cachedWeather = await checkWeatherCache(location, date);
  if (cachedWeather) {
    return cachedWeather;
  }

  // If not in cache, fetch from API
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );
    
    const weatherData = transformWeatherData(response.data, date);
    
    // Cache the weather data
    await cacheWeatherData(location, date, weatherData);
    
    return weatherData;
  } catch (error) {
    console.error('Error fetching weather data:', error.message);
    throw new Error('Failed to fetch weather data');
  }
}

async function checkWeatherCache(location, date) {
  const cachedData = await WeatherCache.findOne({ 
    location, 
    date: new Date(date) 
  });
  
  return cachedData ? cachedData.weatherData : null;
}

async function cacheWeatherData(location, date, weatherData) {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + CACHE_DURATION_HOURS);
  
  await WeatherCache.create({
    location,
    date: new Date(date),
    weatherData,
    expiresAt
  });
}

function transformWeatherData(apiData, targetDate) {
  // Extract relevant data for the target date
  const targetDay = new Date(targetDate).toISOString().split('T')[0];
  const dailyForecasts = apiData.list.filter(forecast => 
    forecast.dt_txt.includes(targetDay)
  );
  
  if (dailyForecasts.length === 0) {
    throw new Error('No weather data available for the specified date');
  }
  
  // Calculate averages and extract important metrics
  const temps = dailyForecasts.map(f => f.main.temp);
  const humidities = dailyForecasts.map(f => f.main.humidity);
  const winds = dailyForecasts.map(f => f.wind.speed);
  const precipitations = dailyForecasts.map(f => f.pop || 0);
  
  return {
    temperature: {
      avg: temps.reduce((a, b) => a + b, 0) / temps.length,
      min: Math.min(...temps),
      max: Math.max(...temps)
    },
    humidity: humidities.reduce((a, b) => a + b, 0) / humidities.length,
    windSpeed: winds.reduce((a, b) => a + b, 0) / winds.length,
    precipitation: Math.max(...precipitations) * 100, // Convert to percentage
    conditions: dailyForecasts[0].weather[0].main,
    description: dailyForecasts[0].weather[0].description,
    icon: dailyForecasts[0].weather[0].icon
  };
}

module.exports = {
  getWeatherForLocationAndDate
};