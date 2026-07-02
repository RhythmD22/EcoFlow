export default function handler(req, res) {
  res.status(200).json({
    gemini: !!process.env.GEMINI_API_KEY,
    openweathermap: !!process.env.OPENWEATHER_API_KEY,
  });
}