export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) return res.status(400).json({ error: 'OpenWeatherMap API key not configured server-side' });

  const { lat, lon } = req.body;
  if (lat == null || lon == null) return res.status(400).json({ error: 'lat and lon required' });

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric`;

  const response = await fetch(url);
  if (!response.ok) return res.status(response.status).json({ error: 'Weather API error' });

  const data = await response.json();
  res.status(200).json({
    temp: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    condition: data.weather[0].main,
    description: data.weather[0].description,
    icon: data.weather[0].icon,
    humidity: data.main.humidity,
    windSpeed: data.wind.speed,
    clouds: data.clouds.all,
    rain: data.rain ? (data.rain['1h'] || 0) : 0,
    city: data.name,
    country: data.sys?.country || '',
  });
}