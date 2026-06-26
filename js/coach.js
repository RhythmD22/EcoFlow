import { EcoData } from './data.js';
import { EcoWeather } from './weather.js';
import { EcoAQI } from './aqi.js';
import { EcoClimate } from './climate.js';
import { debugWarn } from './utils.js';

const EcoCoach = (() => {
  'use strict';

  const GEMINI_MODEL = 'gemini-3.1-flash-lite';

  const SYSTEM_PROMPT = `You are EcoFlow Coach, a warm, encouraging personal sustainability coach. Your mission is to help users reduce their environmental impact through practical, actionable advice. Messages may include bracketed context blocks ([Current weather], [Air quality], [Climate context]) with data about the user's location. Use this data to tailor your advice, but never repeat it back verbatim or start responses with weather summaries — just incorporate it silently into your suggestions.

Guidelines:
- Be conversational and supportive, not preachy
- Keep responses concise (2-4 sentences unless asked for detail)
- Use simple, specific tips — not vague advice
- Mention approximate CO2 savings when possible (kg CO2)
- Celebrate small wins — every action counts
- If asked about complex topics, break them down simply
- Never shame the user or make them feel guilty
- When appropriate, suggest one of their existing habits to try
- Use weather context silently: suggest biking on sunny days, indoor activities on rainy days, energy tips on hot/cold days
- Use air quality context silently: recommend outdoor activities when AQI is good, caution on poor AQI days
- Use climate/emissions context silently to put savings in national perspective

Format your responses in plain text. No markdown. No lists with asterisks. Use natural paragraph breaks.`;

  function getAPIKey() {
    return EcoData.getAPIKey();
  }

  function hasAPIKey() {
    return getAPIKey().length > 0;
  }

  async function sendMessage(userMessage) {
    const [weatherResult, aqiResult, climateResult] = await Promise.allSettled([
      EcoWeather.fetchWeather(),
      EcoAQI.fetchAQI(),
      EcoClimate.fetchCountryEmissions(),
    ]);

    let weatherCtx = '';
    const weather = weatherResult.status === 'fulfilled' ? weatherResult.value : null;
    if (weather) {
      const desc = EcoWeather.describeWeather(weather);
      if (desc) weatherCtx = `\n\n[Current weather: ${desc.summary}]`;
    }

    let aqiCtx = '';
    const aqi = aqiResult.status === 'fulfilled' ? aqiResult.value : null;
    if (aqi && aqi.summary) {
      aqiCtx = `\n\n[Air quality: ${aqi.summary}. ${aqi.recommendation}]`;
    }

    let climateCtx = '';
    const emissions = climateResult.status === 'fulfilled' ? climateResult.value : null;
    if (emissions && emissions.countryCode) {
      climateCtx = `\n\n[Climate context: The average person in ${emissions.country} emits about ${emissions.kgPerYear?.toLocaleString()} kg of CO₂ per year. Use this to put the user's savings in perspective.]`;
    }

    const fullMessage = userMessage + weatherCtx + aqiCtx + climateCtx;

    if (!hasAPIKey()) {
      return { text: getSimulatedResponse(fullMessage), fallback: true, error: 'no_key' };
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': getAPIKey(),
          },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{ role: 'user', parts: [{ text: fullMessage }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 500,
              topP: 0.9,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        const err = new Error(`API error ${response.status}: ${errorBody.slice(0, 120)}`);
        err.code = response.status === 403 ? 'auth' : response.status === 429 ? 'rate_limit' : 'api_error';
        throw err;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return { text, fallback: false };
      throw new Error('Empty response from Gemini');
    } catch (err) {
      debugWarn('EcoFlow: Gemini API error, falling back to simulated response:', err.message);
      const errorCode = err.code || (err.name === 'TypeError' && err.message.includes('fetch') ? 'network' : 'api_error');
      return { text: getSimulatedResponse(fullMessage), fallback: true, error: errorCode };
    }
  }

  function getSimulatedResponse(message) {
    const msg = message.toLowerCase();
    const ctx = {
      hasWeather: msg.includes('current weather'),
      hasAQI: msg.includes('air quality'),
      hasClimate: msg.includes('climate context'),
      isPoorAQI: msg.includes('air quality is poor'),
      isGoodAQI: msg.includes('air quality is excellent'),
    };

    const rules = [
      {
        weight: 20,
        keywords: ['hello', 'hi', 'hey', 'thanks', 'thank you'],
        match: (m) => true,
        respond: () => ctx.hasWeather
          ? "Hey there! I'm excited to help you on your sustainability journey. Every small action adds up, and I'm here to make it easier. The weather looks like a factor today — is there a habit you'd like to adapt around it?"
          : "Hey there! I'm excited to help you on your sustainability journey. Every small action adds up, and I'm here to make it easier. What aspect of your daily routine are you most curious about greening?",
      },
      {
        weight: 70,
        keywords: ['food waste', 'food'],
        match: (m) => true,
        respond: () => "Food waste is one of the biggest household contributors to emissions — about 8-10% of global greenhouse gases. Start by planning your meals for the week and making a shopping list. Store fruits and vegetables properly (most last longer in the fridge). Composting what you can't eat turns waste into soil instead of methane in a landfill.",
      },
      {
        weight: 70,
        keywords: ['transport', 'transit', 'driving', 'car'],
        match: (m) => true,
        respond: () => {
          if (ctx.hasAQI && ctx.isPoorAQI) {
            return "With poor air quality right now, it's best to limit outdoor exposure. Consider using public transit or carpooling instead of walking or biking — you'll still cut emissions vs. driving alone. If you need to go out, a mask rated for PM2.5 can help filter out fine particulate matter.";
          }
          if (ctx.hasAQI && ctx.isGoodAQI) {
            return "Air quality looks great right now — this is the perfect time for walking or biking instead of driving. A 5-mile bike ride saves about 1 kg of CO2 compared to driving alone, and you get the added benefit of exercise. Even swapping just one car trip today makes a difference.";
          }
          return "Transportation is typically the largest part of an individual's carbon footprint. Taking public transit instead of driving alone cuts your trip's emissions by about 45%. If transit isn't available, carpooling helps, and for short trips, walking or biking is zero-emission and great for your health. Even combining errands into one trip makes a meaningful difference.";
        },
      },
      {
        weight: 60,
        keywords: ['air quality', 'aqi', 'pollution', 'air'],
        match: (m) => true,
        respond: () => ctx.hasAQI
          ? "Air quality affects both your health and the environment. On poor air days, try to combine errands into fewer trips to reduce vehicle emissions, unplug idle electronics to cut power plant demand, and keep windows closed. On good days, take advantage by walking or biking — it's zero-emission transportation at its best."
          : "Air quality is an important environmental indicator. While I don't have real-time data for your location, here are a few universal tips: avoid idling your car, especially near schools or parks, and consider using a HEPA filter indoors if you live in an area prone to wildfire smoke or urban pollution.",
      },
      {
        weight: 60,
        keywords: ['energy', 'electricity', 'power'],
        match: (m) => true,
        respond: () => "Home energy use accounts for about 20% of household emissions. The biggest wins are usually heating/cooling (adjust your thermostat by just 2 degrees), switching to LED bulbs (use 75% less energy), and unplugging devices that draw standby power. If your utility offers renewable energy options, switching can cut your home's electricity emissions dramatically.",
      },
      {
        weight: 60,
        keywords: ['plastic', 'waste', 'recycl'],
        match: (m) => true,
        respond: () => "Only about 9% of plastic ever produced has been recycled. The most effective approach is to reduce what you use in the first place. Start with one swap: a reusable water bottle, cloth grocery bags, or bar soap instead of liquid in plastic bottles. When you do buy plastic, check your local recycling rules — they vary by city and contamination is a big problem.",
      },
      {
        weight: 60,
        keywords: ['water', 'shower', 'tap'],
        match: (m) => true,
        respond: () => "The water itself isn't the main carbon issue — it's the energy used to heat, pump, and treat it. A 10-minute shower uses about 25 gallons. Cutting just 2 minutes saves about 5 gallons and the energy to heat them. Fixing a leaky faucet (one drip per second) saves over 3,000 gallons per year. And tap water has about 1/300th the carbon footprint of bottled water.",
      },
      {
        weight: 60,
        keywords: ['challenge', '7-day', 'week'],
        match: (m) => true,
        respond: () => "Here's a 7-day challenge to jumpstart your sustainability journey:\nDay 1: Track your food waste — just observe, don't change yet.\nDay 2: Go meat-free for all three meals.\nDay 3: Take public transit, walk, or bike for every trip.\nDay 4: Unplug every device not in active use before bed.\nDay 5: Buy nothing new — no shopping for 24 hours.\nDay 6: Take a 4-minute shower.\nDay 7: Reflect on the week — what was easiest? What surprised you?\n\nDon't aim for perfect — just try. Which day sounds most intimidating?",
      },
      {
        weight: 60,
        keywords: ['diet', 'meat', 'plant', 'vegan', 'vegetarian'],
        match: (m) => true,
        respond: () => "Food production accounts for about 26% of global emissions, and animal products drive most of that. You don't need to go fully vegan to make an impact — even one meat-free day per week saves about 4 kg of CO2. Beef has the highest footprint (about 60 kg CO2 per kg), while chicken is about 6 kg and lentils are under 1 kg. Start with Meatless Mondays and see how it feels.",
      },
      {
        weight: 60,
        keywords: ['clothes', 'fashion', 'shopping'],
        match: (m) => true,
        respond: () => "The fashion industry produces about 10% of global carbon emissions — more than international flights and maritime shipping combined. The single biggest action you can take is to wear what you already own longer. Buying secondhand extends a garment's life and avoids new production emissions. When buying new, choose natural fibers and brands with transparent supply chains.",
      },
      {
        weight: 50,
        keywords: ['impact', 'most', 'biggest', 'effective'],
        match: (m) => true,
        respond: () => ctx.hasClimate
          ? "If you're looking for maximum impact, consider these top actions:\n1. Fly less — one roundtrip transatlantic flight equals about 1.6 tons of CO2.\n2. Eat less red meat — switching to chicken cuts the footprint by 85%.\n3. Drive less — even one car-free day a week matters.\n4. Reduce food waste — it's the #1 item in landfills.\n5. Switch to green energy if your utility offers it.\n\nEvery kg you save counts — use your impact dashboard to see how your personal savings stack up against the national average. Pick one action, start there, and build the habit before adding another."
          : "If you're looking for maximum impact with minimum lifestyle disruption, here are the top 5:\n1. Fly less — one roundtrip transatlantic flight equals about 1.6 tons of CO2.\n2. Eat less red meat — switching to chicken cuts the footprint by 85%.\n3. Drive less — even one car-free day a week matters.\n4. Reduce food waste — it's the #1 item in landfills.\n5. Switch to green energy if your utility offers it.\n\nPick one. Start there. Build the habit before adding another.",
      },
      {
        weight: 50,
        keywords: ['emissions', 'compare', 'average', 'national'],
        match: (m) => true,
        respond: () => ctx.hasClimate
          ? "Great question about emissions! Every country has different per-capita footprints, and knowing yours helps put your personal savings in perspective. Check your impact dashboard — it tracks how many kg of CO2 you've saved and how that compares to the average person in your country. Even offsetting 1% of the national average is a meaningful start."
          : "CO2 emissions vary widely by country, from under 0.1 tonnes per person per year in some nations to over 15 tonnes in others. The global average is about 4.7 tonnes per person. Your personal savings add up — small daily choices like biking instead of driving or eating plant-based meals can cut your footprint by 10-30% over time.",
      },
      {
        weight: 0,
        keywords: [],
        match: () => true,
        respond: () => ctx.hasWeather || ctx.hasAQI
          ? "Great question! Every sustainable choice, no matter how small, creates a ripple effect. Consider how today's conditions might shape your habits — check the air quality before outdoor activities, and look for ways to adapt. Which category interests you most: food, transport, energy, shopping, or waste?"
          : "Great question! Every sustainable choice, no matter how small, creates a ripple effect. I'd suggest starting with one habit from your tracker — consistency matters more than intensity. Which category interests you most: food, transport, energy, shopping, or waste? I can give you specific, actionable tips for any of them.",
      },
    ];

    let best = null;
    let bestWeight = -1;

    for (const rule of rules) {
      if (rule.weight <= bestWeight) continue;
      const matched = rule.keywords.some(kw => msg.includes(kw));
      if (matched && rule.match(msg)) {
        best = rule;
        bestWeight = rule.weight;
      }
    }

    if (!best) {
      best = rules[rules.length - 1];
    }

    return best.respond();
  }

  return { sendMessage, hasAPIKey };
})();

export { EcoCoach };