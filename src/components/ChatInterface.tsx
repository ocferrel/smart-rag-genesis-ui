
import { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { useConversation } from "@/context/ConversationContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Info } from "lucide-react";

export function ChatInterface() {
  const { conversations, currentConversationId } = useConversation();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const currentConversation = conversations.find(
    (conv) => conv.id === currentConversationId
  );

  const messages = currentConversation?.messages || [];

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      setTimeout(() => {
        scrollAreaRef.current?.scrollTo({
          top: scrollAreaRef.current.scrollHeight,
          behavior: "smooth"
        });
      }, 100);
    }
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <ScrollArea 
          className="h-full p-4" 
          ref={scrollAreaRef}
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                RAG con Pydantic
              </h3>
              <p className="text-muted-foreground max-w-md mb-8">
                Pregúntame cómo implementar RAG con Pydantic, o carga documentos para generar respuestas basadas en ellos.
              </p>
              <div className="bg-muted/50 rounded-lg p-4 max-w-lg">
                <div className="flex gap-2 items-start mb-2">
                  <Info className="h-4 w-4 text-primary mt-0.5" />
                  <p className="text-sm text-muted-foreground text-left">
                    Este sistema utiliza el modelo <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">google/gemini-2.5-pro</span> para texto y <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">qwen/qwen2.5-vl</span> para imágenes a través de OpenRouter.
                  </p>
                </div>
                <p className="text-xs text-muted-foreground text-left">
                  Puedes añadir texto como fuente o cargar imágenes para análisis visual y OCR.
                </p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <ChatMessage 
                key={message.id} 
                message={message} 
                isLast={index === messages.length - 1}
              />
            ))
          )}
        </ScrollArea>
      </div>
      
      <ChatInput />
    </div>
  );
}
