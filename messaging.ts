import { Message, InsertMessage, User } from "@shared/schema";
import { processMessage } from "./ai";
import { IStorage } from "../storage";

export class MessagingService {
  constructor(private storage: IStorage) {}

  async sendMessage(
    relationshipId: number,
    senderId: number,
    content: string,
    useAI: boolean = true
  ): Promise<Message> {
    try {
      // Get sender information and message history for context
      const sender = await this.storage.getUser(senderId);
      const recentMessages = await this.storage.getRecentMessages(relationshipId, 3);
      
      let aiEnhanced = false;
      let aiSuggestion = null;
      
      if (useAI) {
        const aiResponse = await processMessage(content, {
          userRole: sender.role,
          messageHistory: recentMessages
        });

        if (aiResponse.enhancedMessage && aiResponse.enhancedMessage !== content) {
          aiEnhanced = true;
          aiSuggestion = aiResponse.suggestion;
          
          // Store AI interaction
          await this.storage.createAiInteraction({
            userId: senderId,
            prompt: content,
            response: JSON.stringify(aiResponse),
            context: {
              messageHistory: recentMessages.map(m => ({
                id: m.id,
                content: m.content
              }))
            }
          });
        }
      }

      // Create and store the message
      const message: InsertMessage = {
        relationshipId,
        senderId,
        content,
        aiEnhanced,
        aiSuggestion
      };

      return await this.storage.createMessage(message);
    } catch (error) {
      console.error("Error sending message:", error);
      throw new Error("Failed to send message");
    }
  }
}
