import { streamText, Message } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import * as fs from "fs/promises";
import path from "path";

const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_API_KEY || "" });

export const runtime = "nodejs";

const generateId = () => Math.random().toString(36).slice(2, 15);

export async function POST(request: Request) {
  try {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    const menuAnalysisFilePath = path.join(uploadsDir, "menuAnalysis.json");

    let menuData = null;
    try {
      const analysisData = JSON.parse(await fs.readFile(menuAnalysisFilePath, "utf-8"));
      menuData = {
        content: analysisData.menuContent,
        menuName: analysisData.originalName || "Turkish Airlines Menu",
        menuType: analysisData.mimeType,
        analyzedAt: analysisData.analyzedAt || new Date().toISOString()
      };
    } catch (err) {
      console.log("📌 Menu analysis not found, chatbot running in general mode.");
      menuData = null;
    }

    const { messages }: { messages: Message[] } = await request.json();
    
    // Create a system prompt based on menu availability
    const systemPrompt = menuData 
      ? `You are an AI Assistant for Turkish Airlines on-board dining services.
         Here is the menu content that was uploaded and analyzed:
         
         ${menuData.content}
         
         Menu Name: ${menuData.menuName}
         Analyzed: ${new Date(menuData.analyzedAt).toLocaleString()}
         
         Answer user questions about this menu specifically. Be helpful with details about food items, 
         ingredients, dietary options, and allergens. If you don't know certain information that's not
         in the menu, acknowledge that limitation politely.
         
         Detect the language the user is using and respond in the same language.
         Format your responses using Markdown for better readability.`
      : `You are an AI Assistant designed to provide information exclusively about the Turkish Airlines on-board menu. 
         Your role is to assist passengers by answering questions related to meal options, ingredients, 
         dietary preferences (e.g., vegetarian, vegan, gluten-free), allergens, and beverage selections.
         
         However, I notice no menu has been uploaded yet. Please inform the user that they need to upload a menu
         first to get specific information, or help them with general questions about Turkish Airlines dining options.
         
         Detect the language the user uses and give answers in that language.
         Format your responses using Markdown, utilizing **bold**, *italics*, lists, and other Markdown features for clarity.`;

    const updatedMessages: Message[] = [
      {
        id: generateId(),
        role: "system",
        content: systemPrompt,
      },
      ...messages.map((message: Message) => ({
        id: message.id || generateId(),
        role: message.role,
        content: message.content,
      })),
    ];

    const stream = await streamText({ 
      model: google("gemini-1.5-pro-latest"), 
      messages: updatedMessages, 
      temperature: 0.7,
      maxTokens: 2048
    });

    return stream?.toDataStreamResponse();
  } catch (error) {
    console.error("🚨 Gemini API Error:", error);
    return new Response(JSON.stringify({ error: "Failed to process chat request" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}