import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { readFile, writeFile, access } from "fs/promises";
import { constants } from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import pdfParse from "pdf-parse";

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) throw new Error("GOOGLE_API_KEY is not defined!");
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(request: NextRequest) {
  try {
    console.log("📌 Analyze API Called!");
    
    const body = await request.json();
    const { menuId } = body;
    const uploadsDir = join(process.cwd(), "public", "uploads");
    
    // Use provided menuId or fallback to lastUploadedMenu.json
    let menuData;
    if (menuId) {
      console.log(`📌 Using provided menuId: ${menuId}`);
      // Try to find the menu with the specific ID
      const menuFilePath = await findMenuFile(uploadsDir, menuId);
      if (!menuFilePath) {
        return new NextResponse(JSON.stringify({ error: "Menu not found with provided ID!" }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      menuData = JSON.parse(await readFile(menuFilePath, "utf-8"));
    } else {
      // Fallback to last uploaded menu
      const lastMenuFilePath = join(uploadsDir, "lastUploadedMenu.json");
      try {
        menuData = JSON.parse(await readFile(lastMenuFilePath, "utf-8"));
      } catch (err) {
        console.error("📌 Menu JSON File Not Found!", err);
        return new NextResponse(JSON.stringify({ error: "No recently uploaded menu found!" }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    const filePath = join(uploadsDir, menuData.filePath.replace("/uploads/", ""));
    const fileExtension = filePath.split(".").pop()?.toLowerCase();
    const menuUrl = menuData.filePath;

    console.log(`📂 Processing Menu File: ${filePath} (${fileExtension})`);

    try {
      await access(filePath, constants.F_OK);
    } catch (err) {
      console.error("📌 ERROR: File not found!", err);
      return new NextResponse(JSON.stringify({ error: "Menu file not found!" }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let menuContent = "Menu content could not be extracted.";
    
    if (fileExtension === "pdf") {
      console.log("📌 PDF File Detected, Starting OCR Process...");
      const pdfBuffer = await readFile(filePath);
      const pdfData = await pdfParse(pdfBuffer);
      menuContent = pdfData.text || "📌 Text could not be extracted from PDF.";
      console.log("✅ PDF OCR Process Successfully Completed!");
    } else {
      console.log("📌 Image File Detected, Sending to Gemini API...");
      const imageBuffer = await readFile(filePath);
      const base64Image = imageBuffer.toString("base64");

      const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              { text: "This is a restaurant menu. Please extract all menu items, descriptions, pricing, and categories. Format the information clearly." },
              { inlineData: { mimeType: `image/${fileExtension}`, data: base64Image } }
            ]
          }
        ]
      });

      const response = await result.response;
      menuContent = response?.candidates?.[0]?.content?.parts?.[0]?.text || "📌 Image analysis failed.";
    }

    // Save analysis with timestamp and file reference
    const analysisData = { 
      menuId: menuData.menuId,
      menuUrl,
      originalName: menuData.originalName || "Unknown",
      mimeType: menuData.mimeType,
      menuContent,
      analyzedAt: new Date().toISOString()
    };
    
    await writeFile(join(uploadsDir, "menuAnalysis.json"), JSON.stringify(analysisData));

    return new NextResponse(JSON.stringify({ 
      success: true, 
      menuId: menuData.menuId,
      menuUrl, 
      analysis: menuContent, 
      message: "Menu successfully analyzed" 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error("🚨 Analyze API Error:", error);
    return new NextResponse(JSON.stringify({ error: "Menu analysis failed!", details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Helper function to find a menu file by ID
async function findMenuFile(uploadsDir: string, menuId: string): Promise<string | null> {
  try {
    const lastMenuFilePath = join(uploadsDir, "lastUploadedMenu.json");
    const lastMenuData = JSON.parse(await readFile(lastMenuFilePath, "utf-8"));
    
    if (lastMenuData.menuId === menuId) {
      return lastMenuFilePath;
    }
    
    // If not the latest, we could implement a search through previous uploads
    // This would require maintaining a history of uploads
    return null;
  } catch (err) {
    console.error("Error finding menu file:", err);
    return null;
  }
}