"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";

import {
  X,
  MessageCircle,
  Send,
  Loader2,
  ArrowDownCircleIcon,
  Info,
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@ai-sdk/react";

import LandingSections from "@/components/LandingSections";

export default function Chat() {
  const { toast } = useToast();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showChatIcon, setShowChatIcon] = useState(false);
  const [hasMenuUploaded, setHasMenuUploaded] = useState(false);
  const chatIconRef = useRef<HTMLButtonElement>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    reload,
    error,
  } = useChat({ api: "/api/gemini" });

  const scrollRef = useRef<HTMLDivElement>(null);

  // Check if a menu has been uploaded on mount
  useEffect(() => {
    const checkMenuStatus = async () => {
      try {
        const response = await fetch("/api/check-menu-status");
        if (response.ok) {
          const data = await response.json();
          setHasMenuUploaded(data.hasMenu);
          
          if (data.hasMenu) {
            toast({
              title: "Menu loaded",
              description: "A menu is already loaded. You can start chatting!",
              duration: 3000
            });
          }
        }
      } catch (error) {
        console.error("Failed to check menu status", error);
      }
    };
    
    checkMenuStatus();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setShowChatIcon(true);
      } else {
        setShowChatIcon(false);
        setIsChatOpen(false);
      }
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    
    // Welcome message when opening chat
    if (!isChatOpen && messages.length === 0) {
      toast({
        title: "Chat Assistant Ready",
        description: hasMenuUploaded 
          ? "Ask questions about the menu you've uploaded!" 
          : "Upload a menu first to get personalized assistance",
        duration: 5000
      });
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="flex flex-col min-h-screen">
      <LandingSections />
      <AnimatePresence>
        {showChatIcon && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <Button
              ref={chatIconRef}
              onClick={toggleChat}
              size="icon"
              className="rounded-full size-14 p-2 shadow-lg"
            >
              {!isChatOpen ? (
                <MessageCircle className="size-12" />
              ) : (
                <ArrowDownCircleIcon />
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-4 z-50 w-[95%] md:w-[500px]"
          >
            <Card className="border-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-lg font-bold">
                  Chat with Turkish Airlines On-Board Menu Assistant
                </CardTitle>
                <Button
                  onClick={toggleChat}
                  size="sm"
                  variant="ghost"
                  className="px-2 py-0"
                >
                  <X className="size-4" />
                  <span className="sr-only">Close Chat</span>
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[300px] pr-4">
                  {!hasMenuUploaded && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                      <Info className="h-12 w-12 text-blue-500 mb-2" />
                      <p className="text-gray-500">
                        Please upload a menu first to get personalized assistance.
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => {
                          toggleChat();
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        Go to Upload
                      </Button>
                    </div>
                  )}

                  {hasMenuUploaded && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                      <MessageCircle className="h-12 w-12 text-blue-500 mb-2" />
                      <p className="text-gray-500">
                        Your menu is ready! Ask me anything about the menu items, ingredients, or dietary options.
                      </p>
                    </div>
                  )}

                  {messages?.map((message, index) => (
                    <div
                      key={index}
                      className={`mb-4 ${
                        message.role === "user" ? "text-right" : "text-left"
                      }`}
                    >
                      <div
                        className={`inline-block p-4 rounded-lg ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <ReactMarkdown
                          children={message.content}
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({ node, inline, className, children, ...props }) {
                              return inline ? (
                                <code
                                  {...props}
                                  className="bg-gray-200 px-1 rounded"
                                >
                                  {children}
                                </code>
                              ) : (
                                <pre
                                  {...props}
                                  className="bg-gray-200 px-2 py-1 rounded overflow-x-auto"
                                >
                                  <code>{children}</code>
                                </pre>
                              );
                            },
                            ul: ({ children }) => (
                              <ul className="list-disc ml-4">{children}</ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal ml-4">{children}</ol>
                            ),
                            p: ({ children }) => (
                              <p className="mb-2">{children}</p>
                            ),
                          }}
                        />
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="w-full items-center flex justify-center gap-3 p-4">
                      <Loader2 className="animate-spin h-5 w-5 text-primary" />
                      <button
                        className="underline"
                        type="button"
                        onClick={() => stop()}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  
                  {error && (
                    <div className="w-full items-center flex justify-center gap-3 bg-red-50 p-4 rounded-md m-2">
                      <div className="text-red-500">An error occurred</div>
                      <button
                        className="underline"
                        type="button"
                        onClick={() => reload()}
                      >
                        Retry
                      </button>
                    </div>
                  )}
                  
                  <div ref={scrollRef}></div>
                </ScrollArea>
              </CardContent>
              <CardFooter>
                <form
                  onSubmit={handleSubmit}
                  className="flex w-full items-center space-x-2"
                >
                  <Input
                    value={input}
                    onChange={handleInputChange}
                    className="flex-1"
                    placeholder="Type your message here..."
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    className="size-9"
                    disabled={isLoading || (!hasMenuUploaded && messages.length === 0)}
                    size="icon"
                  >
                    <Send className="size-4" />
                  </Button>
                </form>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}