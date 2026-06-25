import { EcoData } from './data.js';

const EcoCoach = (() => {
  'use strict';

  const SYSTEM_PROMPT = `You are EcoFlow Coach, a warm, encouraging personal sustainability coach. Your mission is to help users reduce their environmental impact through practical, actionable advice.

Guidelines:
- Be conversational and supportive, not preachy
- Keep responses concise (2-4 sentences unless asked for detail)
- Use simple, specific tips — not vague advice
- Mention approximate CO2 savings when possible (kg CO2)
- Celebrate small wins — every action counts
- If asked about complex topics, break them down simply
- Never shame the user or make them feel guilty
- When appropriate, suggest one of their existing habits to try

Format your responses in plain text. No markdown. No lists with asterisks. Use natural paragraph breaks.`;

  function getAPIKey() {
    return EcoData.getAPIKey();
  }

  function hasAPIKey() {
    return getAPIKey().length > 0;
  }

  async function sendMessage(userMessage) {
    if (!hasAPIKey()) {
      return { text: getSimulatedResponse(userMessage), fallback: true };
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${getAPIKey()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{ role: 'user', parts: [{ text: userMessage }] }],
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
        throw new Error(`API error ${response.status}: ${errorBody.slice(0, 120)}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return { text, fallback: false };
      throw new Error('Empty response from Gemini');
    } catch (err) {
      console.warn('EcoFlow: Gemini API error, falling back to simulated response:', err.message);
      return { text: getSimulatedResponse(userMessage), fallback: true };
    }
  }

  function getSimulatedResponse(message) {
    const msg = message.toLowerCase();

    if (msg.includes('food waste') || msg.includes('food')) {
      return "Food waste is one of the biggest household contributors to emissions — about 8-10% of global greenhouse gases. Start by planning your meals for the week and making a shopping list. Store fruits and vegetables properly (most last longer in the fridge). Composting what you can't eat turns waste into soil instead of methane in a landfill.";
    }

    if (msg.includes('transport') || msg.includes('transit') || msg.includes('driving') || msg.includes('car')) {
      return "Transportation is typically the largest part of an individual's carbon footprint. Taking public transit instead of driving alone cuts your trip's emissions by about 45%. If transit isn't available, carpooling helps, and for short trips, walking or biking is zero-emission and great for your health. Even combining errands into one trip makes a meaningful difference.";
    }

    if (msg.includes('energy') || msg.includes('electricity') || msg.includes('power')) {
      return "Home energy use accounts for about 20% of household emissions. The biggest wins are usually heating/cooling (adjust your thermostat by just 2 degrees), switching to LED bulbs (use 75% less energy), and unplugging devices that draw standby power. If your utility offers renewable energy options, switching can cut your home's electricity emissions dramatically.";
    }

    if (msg.includes('plastic') || msg.includes('waste') || msg.includes('recycl')) {
      return "Only about 9% of plastic ever produced has been recycled. The most effective approach is to reduce what you use in the first place. Start with one swap: a reusable water bottle, cloth grocery bags, or bar soap instead of liquid in plastic bottles. When you do buy plastic, check your local recycling rules — they vary by city and contamination is a big problem.";
    }

    if (msg.includes('water') || msg.includes('shower') || msg.includes('tap')) {
      return "The water itself isn't the main carbon issue — it's the energy used to heat, pump, and treat it. A 10-minute shower uses about 25 gallons. Cutting just 2 minutes saves about 5 gallons and the energy to heat them. Fixing a leaky faucet (one drip per second) saves over 3,000 gallons per year. And tap water has about 1/300th the carbon footprint of bottled water.";

    }

    if (msg.includes('challenge') || msg.includes('7-day') || msg.includes('week')) {
      return "Here's a 7-day challenge to jumpstart your sustainability journey:\nDay 1: Track your food waste — just observe, don't change yet.\nDay 2: Go meat-free for all three meals.\nDay 3: Take public transit, walk, or bike for every trip.\nDay 4: Unplug every device not in active use before bed.\nDay 5: Buy nothing new — no shopping for 24 hours.\nDay 6: Take a 4-minute shower.\nDay 7: Reflect on the week — what was easiest? What surprised you?\n\nDon't aim for perfect — just try. Which day sounds most intimidating?";
    }

    if (msg.includes('diet') || msg.includes('meat') || msg.includes('plant') || msg.includes('vegan') || msg.includes('vegetarian')) {
      return "Food production accounts for about 26% of global emissions, and animal products drive most of that. You don't need to go fully vegan to make an impact — even one meat-free day per week saves about 4 kg of CO2. Beef has the highest footprint (about 60 kg CO2 per kg), while chicken is about 6 kg and lentils are under 1 kg. Start with Meatless Mondays and see how it feels.";
    }

    if (msg.includes('clothes') || msg.includes('fashion') || msg.includes('shopping')) {
      return "The fashion industry produces about 10% of global carbon emissions — more than international flights and maritime shipping combined. The single biggest action you can take is to wear what you already own longer. Buying secondhand extends a garment's life and avoids new production emissions. When buying new, choose natural fibers and brands with transparent supply chains.";
    }

    if (msg.includes('impact') || msg.includes('most') || msg.includes('biggest') || msg.includes('effective')) {
      return "If you're looking for maximum impact with minimum lifestyle disruption, here are the top 5:\n1. Fly less — one roundtrip transatlantic flight equals about 1.6 tons of CO2.\n2. Eat less red meat — switching to chicken cuts the footprint by 85%.\n3. Drive less — even one car-free day a week matters.\n4. Reduce food waste — it's the #1 item in landfills.\n5. Switch to green energy if your utility offers it.\n\nPick one. Start there. Build the habit before adding another.";

    }

    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('thanks') || msg.includes('thank you')) {
      return "Hey there! I'm excited to help you on your sustainability journey. Every small action adds up, and I'm here to make it easier. What aspect of your daily routine are you most curious about greening?";
    }

    return "Great question! Every sustainable choice, no matter how small, creates a ripple effect. I'd suggest starting with one habit from your tracker — consistency matters more than intensity. Which category interests you most: food, transport, energy, shopping, or waste? I can give you specific, actionable tips for any of them.";
  }

  return { sendMessage, hasAPIKey };
})();

export { EcoCoach };