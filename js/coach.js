import { EcoData } from './data.js';
import { EcoWeather } from './weather.js';
import { EcoAQI } from './aqi.js';
import { EcoClimate } from './climate.js';
import { debugWarn } from './utils.js';

const EcoCoach = (() => {
  'use strict';

  const GEMINI_MODEL = 'gemini-3.1-flash-lite';

  const SYSTEM_PROMPT = `You are EcoFlow Coach, a sustainability coach that gives practical, grounded advice. Responses should feel like a knowledgeable friend, not a chatbot or encyclopedia. Messages may include bracketed context about the user's weather, air quality, and national emissions data. Weave this context into your suggestions naturally. Don't lead with it or repeat it verbatim.

Guidelines:
- Keep it brief (2-4 sentences usually)
- Give specific, doable tips. Not abstract principles.
- Mention approximate CO2 impact when relevant
- Don't lecture or moralize. Just help.
- Ask follow-up questions when it makes sense
- Use plain paragraph text, no markdown or bullet lists`;

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

    const serverResponse = await tryServerAPI(fullMessage);
    if (serverResponse) return serverResponse;

    return await tryLocalAPI(fullMessage);
  }

  async function tryServerAPI(message) {
    try {
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, systemPrompt: SYSTEM_PROMPT }),
      });

      if (!response.ok) {
        if (response.status === 400) return null;
        throw new Error(`Server API error: ${response.status}`);
      }

      const data = await response.json();
      if (data.text) return { text: data.text, fallback: false };
      return null;
    } catch (err) {
      debugWarn('EcoFlow: Server coach API failed:', err.message);
      return null;
    }
  }

  async function tryLocalAPI(message) {
    if (!hasAPIKey()) {
      return { text: getSimulatedResponse(message), fallback: true, error: 'no_key' };
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
            contents: [{ role: 'user', parts: [{ text: message }] }],
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
      return { text: getSimulatedResponse(message), fallback: true, error: errorCode };
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
        respond: () => "Hey! Happy to help with anything sustainability-related. What part of your routine are you most curious about improving?",
      },
      {
        weight: 70,
        keywords: ['food waste', 'food'],
        match: (m) => true,
        respond: () => "Meal planning is the simplest way to cut food waste. Just knowing what you have before you shop helps. Store greens with a paper towel to keep them crisp longer, and freeze things before they turn. Even small changes here add up fast.",
      },
      {
        weight: 70,
        keywords: ['transport', 'transit', 'driving', 'car'],
        match: (m) => true,
        respond: () => {
          if (ctx.hasAQI && ctx.isPoorAQI) return "Air quality isn't great right now, so biking or walking isn't ideal. Public transit is a solid alternative. You'll still cut emissions without being stuck outdoors. If you have to drive, try combining a few errands into one trip.";
          if (ctx.hasAQI && ctx.isGoodAQI) return "Conditions are perfect for walking or biking today. Swapping just one car trip for a bike ride saves meaningful emissions, and honestly, it's more enjoyable than sitting in traffic.";
          return "Car trips are usually the biggest chunk of a personal carbon footprint. Try picking one recurring trip you could replace each week. Even if it's just the short grocery run. Walking or biking those, or taking transit when it's convenient.";
        },
      },
      {
        weight: 60,
        keywords: ['air quality', 'aqi', 'pollution', 'air'],
        match: (m) => true,
        respond: () => "Air quality affects your health and the environment in equal measure. On bad air days, keep windows closed and skip outdoor exercise. On good days, take advantage. Any trip you walk or bike instead of driving is a direct win for local air quality.",
      },
      {
        weight: 60,
        keywords: ['energy', 'electricity', 'power'],
        match: (m) => true,
        respond: () => "Heating and cooling are the biggest energy users in most homes. Even a 1-2 degree thermostat adjustment makes a difference. LEDs use a fraction of the power of old bulbs. And if your utility has a green energy option, switching is one of the easiest high-impact moves you can make.",
      },
      {
        weight: 60,
        keywords: ['plastic', 'waste', 'recycl'],
        match: (m) => true,
        respond: () => "Recycling is good, but reducing what comes in is better. Pick one reusable swap you can stick with: a water bottle, cloth bags, or bar soap instead of bottled. When you do buy plastic, check your local rules since what's recyclable varies widely by city.",
      },
      {
        weight: 60,
        keywords: ['water', 'shower', 'tap'],
        match: (m) => true,
        respond: () => "The carbon impact of water mostly comes from the energy used to heat and pump it. Shortening your shower by a couple minutes or fixing a drippy faucet helps. Tap water also has a vastly smaller footprint than bottled, about 300x less.",
      },
      {
        weight: 60,
        keywords: ['challenge', '7-day', 'week'],
        match: (m) => true,
        respond: () => "Here's a week of things to try:\nDay 1: Just observe your food waste, no changes yet.\nDay 2: All plant-based meals.\nDay 3: No car trips.\nDay 4: Unplug everything before bed.\nDay 5: Buy nothing new.\nDay 6: 4-minute shower.\nDay 7: What was easiest? What surprised you?\n\nDon't worry about getting every day perfect. Even hitting 3 or 4 is great. Which one seems hardest?",
      },
      {
        weight: 60,
        keywords: ['diet', 'meat', 'plant', 'vegan', 'vegetarian'],
        match: (m) => true,
        respond: () => "Red meat has the biggest food footprint by far. Swapping beef for chicken cuts emissions by about 85%, and plant proteins are lower still. You don't need to go fully vegan. Even one meat-free day a week makes a real difference. Start with a day that's easy to plan around.",
      },
      {
        weight: 60,
        keywords: ['clothes', 'fashion', 'shopping'],
        match: (m) => true,
        respond: () => "The best thing you can do for fashion's footprint is wear what you already own. After that: buy secondhand, choose natural fibers over synthetics, and look for brands that share their supply chain details. Fast fashion's environmental cost per wear is wildly higher than well-made pieces you keep for years.",
      },
      {
        weight: 50,
        keywords: ['impact', 'most', 'biggest', 'effective'],
        match: (m) => true,
        respond: () => "If you had to pick one thing, flying less has the biggest per-action impact. One roundtrip transatlantic flight is roughly 1.6 tons of CO₂, about a third of the global annual per-person average. After that: eating less red meat, driving less, cutting food waste, and switching to green energy all get you big wins. Pick whichever fits your life best and build from there.",
      },
      {
        weight: 50,
        keywords: ['emissions', 'compare', 'average', 'national'],
        match: (m) => true,
        respond: () => "Per-person emissions vary a lot by country. Check your impact dashboard to see how your savings compare to the national average. Even small daily shifts add up over time. Being consistent matters more than being perfect.",
      },
      {
        weight: 0,
        keywords: [],
        match: () => true,
        respond: () => "Good question. I'd suggest starting with one small change and making it a habit before adding another. Which area interests you most: food, transport, energy, shopping, or waste?",
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