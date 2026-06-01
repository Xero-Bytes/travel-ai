const { GoogleGenerativeAI } = require("@google/generative-ai");

function cleanKey(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getPlanId(destination, country, days, travelStyle) {
  return `${cleanKey(destination)}_${cleanKey(country)}_${days}_${cleanKey(travelStyle)}`;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Only POST allowed" });
  }

  try {
    const {
      destination,
      country = "",
      days = 3,
      travelStyle = "Standard",
      forceFresh = false,
    } = req.body;

    if (!destination) {
      return res.status(400).json({
        success: false,
        error: "Destination is required",
      });
    }

    const planId = getPlanId(destination, country, days, travelStyle);

    // Later: check Firebase here.
    // If plan exists and forceFresh is false, return saved plan.

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const prompt = `
You are a travel planning API.

Return ONLY valid JSON.
No markdown.
No asterisks.
No explanation outside JSON.

Create a concise travel plan.

Destination: ${destination}
Country: ${country}
Days: ${days}
Travel style: ${travelStyle}

JSON format:
{
  "summary": "short summary",
  "itinerary": [
    {
      "day": 1,
      "title": "short day title",
      "activities": ["activity 1", "activity 2", "activity 3"]
    }
  ],
  "budget": {
    "hotel": 0,
    "food": 0,
    "transport": 0,
    "activities": 0,
    "shopping": 0,
    "emergency": 0,
    "total": 0
  },
  "safety": ["tip 1", "tip 2", "tip 3"],
  "food": ["food tip 1", "food tip 2"],
  "transport": ["transport tip 1", "transport tip 2"],
  "packing": ["item 1", "item 2", "item 3"]
}
`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();

    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let plan;

    try {
      plan = JSON.parse(text);
    } catch (e) {
      return res.status(500).json({
        success: false,
        error: "AI returned invalid JSON",
        raw: text,
      });
    }

    // Later: save this plan to Firebase here.

    return res.status(200).json({
      success: true,
      source: forceFresh ? "gemini_fresh" : "gemini",
      planId,
      plan,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};