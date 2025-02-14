import OpenAI from "openai";
import { Message, AiInteraction } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface AIResponse {
  enhancedMessage?: string;
  suggestion?: string;
  insights?: string[];
}

export async function processMessage(
  message: string,
  context: {
    userRole: "sponsor" | "sponsee";
    messageHistory: Message[];
  }
): Promise<AIResponse> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: 
            `You are an AI assistant for a recovery support platform. 
             Analyze messages between sponsors and sponsees to provide:
             1. Enhanced message suggestions while maintaining the original meaning
             2. Optional guidance or insights based on AA principles
             Format response as JSON with fields: 
             { 'enhancedMessage': string, 'suggestion': string, 'insights': string[] }`
        },
        {
          role: "user",
          content: `User role: ${context.userRole}\nMessage: ${message}\nRecent context: ${
            context.messageHistory
              .slice(-3)
              .map(m => `${m.senderId}: ${m.content}`)
              .join("\n")
          }`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message?.content || '';
    const result = JSON.parse(content);

    return {
      enhancedMessage: result.enhancedMessage || message,
      suggestion: result.suggestion || "Unable to provide AI suggestions at this time.",
      insights: result.insights || []
    };
  } catch (error) {
    console.error("AI processing error:", error);
    return {
      enhancedMessage: message,
      suggestion: "Unable to provide AI suggestions at this time.",
      insights: []
    };
  }
}

export async function analyzeProgress(entries: string[]): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Analyze recovery progress entries and provide supportive insights based on AA principles. Focus on patterns, growth, and areas for support."
        },
        {
          role: "user",
          content: `Recent progress entries:\n${entries.join("\n")}`
        }
      ]
    });

    const content = response.choices[0].message?.content || "Unable to analyze progress at this time.";
    return content;
  } catch (error) {
    console.error("Progress analysis error:", error);
    return "Unable to analyze progress at this time.";
  }
}