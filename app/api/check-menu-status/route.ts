import { NextResponse } from "next/server";
import { join } from "path";
import { readFile, access } from "fs/promises";
import { constants } from "fs";

export async function GET() {
  try {
    const uploadsDir = join(process.cwd(), "public", "uploads");
    const menuAnalysisFilePath = join(uploadsDir, "menuAnalysis.json");

    let hasMenu = false;
    let menuData = null;

    try {
      // Menü analizi dosyasının var olup olmadığını kontrol et
      await access(menuAnalysisFilePath, constants.F_OK);

      // Dosyayı oku ve içeriğini al
      const analysisData = JSON.parse(await readFile(menuAnalysisFilePath, "utf-8"));

      if (analysisData && analysisData.menuContent) {
        hasMenu = true;
        menuData = {
          menuId: analysisData.menuId,
          menuName: analysisData.originalName || "Uploaded Menu",
          uploadedAt: analysisData.analyzedAt || new Date().toISOString(),
          menuContent: analysisData.menuContent
        };
      }
    } catch (err) {
      console.log("📌 Menü analizi bulunamadı, boş yanıt dönülüyor.");
    }

    return new NextResponse(
      JSON.stringify({ hasMenu, menuData }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("🚨 Menü durumu kontrol edilirken hata oluştu:", error);
    return new NextResponse(
      JSON.stringify({ error: "Menü durumu kontrol edilemedi!" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
