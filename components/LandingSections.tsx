import React, { useState, useRef } from "react";
import { Button } from "./ui/button";
import Link from "next/link";
import { Input } from "./ui/input";
import { Loader2, Upload, Check, AlertCircle } from "lucide-react";
import { useToast } from "./ui/use-toast";

const LandingSections = () => {
  const { toast } = useToast();
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadedFileType, setUploadedFileType] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [menuFile, setMenuFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleMenuUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setMenuFile(file);
    setIsUploading(true);
  
    try {
      const formData = new FormData();
      formData.append("menuFile", file);
      
      const uploadResponse = await fetch("/api/upload-menu", {
        method: "POST",
        body: formData,
      });
  
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || "Menu upload failed");
      }
  
      const { menuId, filePath, mimeType } = await uploadResponse.json();
  
      setUploadedFileUrl(filePath);
      setUploadedFileType(mimeType);
  
      setIsUploading(false);
      setIsAnalyzing(true);
  
      toast({
        title: "Menu uploaded successfully",
        description: "Now analyzing the menu content...",
        duration: 3000
      });
      
      const analysisResponse = await fetch("/api/analyze-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuId }),
      });
  
      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json();
        console.error("Menu analysis error details:", errorData);
        throw new Error(errorData.error || "Menu analysis failed");
      }
  
      const analysisResult = await analysisResponse.json();
      console.log("Menu analysis successful:", analysisResult);
  
      setIsAnalyzing(false);
      setUploadSuccess(true);
      
      toast({
        title: "Menu analysis complete",
        description: "You can now chat with the assistant about the menu!",
        duration: 5000
      });
  
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error: any) {
      console.error("Menu processing error:", error);
      setIsUploading(false);
      setIsAnalyzing(false);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to process the menu",
        duration: 5000
      });
    }
  };
  
  return (
    <div>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Welcome On-Board!
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-l dark:text-gray-400">
                As your unforgettable journey continues, how about exploring our delightful menu?
                Simply upload your menu to get started!
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Button 
                  className="w-full sm:w-auto flex items-center gap-2" 
                  onClick={handleButtonClick}
                  disabled={isUploading || isAnalyzing}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : uploadSuccess ? (
                    <>
                      <Check className="h-4 w-4" />
                      Menu Ready!
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload Menu
                    </>
                  )}
                </Button>
                
                <Button className="outline" asChild>
                  <Link href="/learn-more">Learn More</Link>
                </Button>
                
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleMenuUpload}
                  disabled={isUploading || isAnalyzing}
                />
              </div>

              {menuFile && (
                <div className="text-sm text-gray-500 flex items-center gap-2 bg-gray-100 p-2 rounded">
                  <div className="font-medium">Uploaded file:</div> {menuFile.name}
                  {uploadSuccess && <Check className="h-4 w-4 text-green-500" />}
                </div>
              )}
              
              {uploadedFileUrl && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">Your menu is ready! Click the chat icon to ask questions about it.</p>
                  {uploadedFileType?.includes('image') && (
                    <div className="max-w-xs mx-auto">
                      <img 
                        src={uploadedFileUrl} 
                        alt="Uploaded Menu" 
                        className="max-h-40 object-contain rounded-md border"
                      />
                    </div>
                  )}
                  {uploadedFileType === 'application/pdf' && (
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      PDF menu uploaded successfully
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingSections;