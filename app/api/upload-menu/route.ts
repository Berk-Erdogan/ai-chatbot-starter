import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    console.log("📌 Upload API Called!");

    if (request.method !== "POST") {
      return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
    }

    const formData = await request.formData();
    const file = formData.get("menuFile") as File;

    if (!file) {
      return NextResponse.json({ error: "Menu file is missing!" }, { status: 400 });
    }

    console.log("📂 Uploaded File Type:", file.type);

    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type!" }, { status: 400 });
    }

    const menuId = uuidv4();
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const fileExtension = file.name.split(".").pop() || "";
    const fileName = `${menuId}.${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    console.log(`✅ Menu Uploaded: ${fileName}`);

    const lastUploadedMenu = { 
      menuId, 
      filePath: `/uploads/${fileName}`, 
      mimeType: file.type,
      originalName: file.name,
      uploadedAt: new Date().toISOString()
    };
    
    await writeFile(path.join(uploadDir, "lastUploadedMenu.json"), JSON.stringify(lastUploadedMenu));

    return new NextResponse(JSON.stringify(lastUploadedMenu), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error("🚨 Upload API Error:", error);
    return new NextResponse(JSON.stringify({ error: "File upload failed!", details: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}