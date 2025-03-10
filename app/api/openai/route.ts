import { NextResponse } from "next/server";
import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { initialMessage } from "@/lib/data";

const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Çevre değişkeni güvenli şekilde alınıyor
    compatibility: "strict",
});

export const runtime = "edge"; // Edge Runtime desteği

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        const result = await streamText({
            model: openai("gpt-4o-mini"), // Model çağrısı güncellendi
            messages: [initialMessage, ...messages],
            temperature: 0.7,
        });

        // `toAIStream()` ile uygun ReadableStream dönüşümü yapılıyor
        return new NextResponse(result.toAIStream(), {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        });
    } catch (error) {
        return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
