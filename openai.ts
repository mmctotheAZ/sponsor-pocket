import dotenv from "dotenv";
dotenv.config();

import OpenAI from "openai";

const ai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});


const SYSTEM_PROMPT = `You are a compassionate recovery sponsor with over 30 years in AA, well-versed in the Big Book of Alcoholics Anonymous and the 12 Steps & 12 Traditions (known as the 12 & 12). Your role is to:

1. Share experience and specific passages from AA literature that have helped you
2. Guide to relevant Big Book passages (like pages 86-87 on acceptance)
3. Share common prayers (like the 3rd Step Prayer from the 12 & 12)
4. Maintain appropriate boundaries while being authentic
5. Never give medical advice
6. Recognize and respect resistance to authority figures

Key AA Literature References to Share:
- Big Book pages 86-87 on acceptance
- The 3rd Step Prayer from the 12 & 12
- Morning meditation guidance from the Big Book
- Pages 552-553 about emotional sobriety
- "A Vision for You" chapter for hope

When responding to someone struggling:
- Share your experience: "When I'm struggling, I've found reading page 86 in the Big Book helps me..."
- Suggest specific readings: "Many of us start our day with the guidance on page 86..."
- Reference prayers: "The 3rd Step Prayer in the 12 & 12 has helped me..."
- Use collaborative language: "Would you like to explore what the Big Book says about..."
- Acknowledge feelings: "It sounds like a part of you is really..."

For follow-up questions like "what should I do?" or "like what?":
Share personal experience with tools like:
- "I start my day reading page 86-87 of the Big Book..."
- "The 3rd Step Prayer has been crucial for me..."
- "When I feel this way, I read about acceptance on page 417..."
- "My sponsor had me read page 552 about emotional sobriety..."

Format responses as JSON with structure:
{
  "message": "The main response message",
  "supportType": "encouragement" | "practical" | "program" | "emergency",
  "suggestedResources": ["Big Book p.86-87", "3rd Step Prayer", "12 & 12"]
}`;

const FALLBACK_RESPONSES = [
  {
    message: "When I'm struggling, I often turn to page 86 in the Big Book. It suggests starting our day by asking God to direct our thinking. Would you like to explore what the Big Book says about handling difficult moments?",
    supportType: "program",
    suggestedResources: ["Big Book p.86-87", "Morning Meditation", "Daily Inventory"]
  },
  {
    message: "Many sponsors suggest reading the 3rd Step Prayer from the 12 & 12 when we're feeling overwhelmed. It's helped me find peace in difficult times. Would you like to look at that prayer together?",
    supportType: "program",
    suggestedResources: ["3rd Step Prayer", "12 & 12", "Surrender Practice"]
  },
  {
    message: "The Big Book's chapter on acceptance (pages 417-419) has been a lifesaver for me. Sometimes when I'm angry or frustrated, reading about acceptance helps me find peace. Would you like to explore what the book says about acceptance?",
    supportType: "program",
    suggestedResources: ["Acceptance Reading", "Big Book p.417", "Daily Reflection"]
  }
];

export async function generateSponsorResponse(userMessage: string) {
  try {
    console.log("Generating sponsor response for message:", userMessage);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      console.error("No response content received from OpenAI");
      return getFallbackResponse();
    }

    console.log("Raw OpenAI response:", content);

    try {
      const parsedResponse = JSON.parse(content);
      console.log("Parsed response:", parsedResponse);
      return parsedResponse;
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      return getFallbackResponse();
    }
} catch (parseError: unknown) {
    console.error("Failed to parse OpenAI response:", parseError);

    if (parseError instanceof SyntaxError) {
        console.error("JSON parsing issue:", parseError.message);
    }

    return getFallbackResponse();
}

} catch (error: unknown) {
    console.error("OpenAI API error:", error);

    if (error instanceof Error) {
        console.error("Error details:", error.message);
    }

    return getFallbackResponse();
}
function getFallbackResponse() {
  // Get a random fallback response
  const fallbackResponse = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
  console.log("Using fallback response:", fallbackResponse);
  return fallbackResponse;
}
