const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

  const result = await model.generateContent(`
You are a smart travel assistant.

Answer in plain text only.
Do not use markdown.
Do not use asterisks.
Do not use bullet symbols.
Keep response concise, clean, and mobile-friendly.
Use maximum 4 short lines.

User message:
${message}
`);

    res.status(200).json({
      success: true,
      reply: result.response.text(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};