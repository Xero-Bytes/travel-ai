require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get("/", (req, res) => {
  res.send("TravelMind AI Backend Running");
});

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const prompt = `
You are a smart travel assistant.

Help users with:
- travel planning
- itinerary
- budget
- packing
- transport
- food
- safety

User message:
${message}
`;

    const result = await model.generateContent(prompt);

    const response = result.response.text();

    res.json({
      success: true,
      reply: response,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.listen(process.env.PORT || 10000, () => {
  console.log("Server running");
});