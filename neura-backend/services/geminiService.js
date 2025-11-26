const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const getAnswerFromGemini = async (question) => {
  try {
    const response = await axios.post(
      GEMINI_API_URL,
      {
        contents: [
          { parts: [{ text: question }] }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY
        }
      }
    );

    // The model's output is usually in response.data.candidates[0].content[0].text
    const answer = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "No answer received.";

    return answer;

  } catch (err) {
    console.error(err.response?.data || err.message);
    return "Sorry, I could not get an answer from Gemini.";
  }
};

module.exports = { getAnswerFromGemini };
