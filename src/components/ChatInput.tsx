import { useState, useRef, FormEvent, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Attachment } from "@/types";
import { useConversation } from "@/context/conversation/ConversationContext";
import { callOpenRouter, streamOpenRouter, processImageForOpenRouter } from "@/services/openRouter";
import { findRelevantChunks, generateRAGContext, processDocument } from "@/services/ragService";
import { Send, Image, Loader2, Upload, X, Search, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

const DEFAULT_API_KEY = "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";

export function ChatInput() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
  const [sourceText, setSourceText] = useState("");
  const [sourceType, setSourceType] = useState<"url" | "text">("text");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    addMessage, 
    sources, 
    addSource,
    removeSource,
    apiKey,
    setApiKey,
    currentConversationId,
    createConversation,
    searchInternet,
    deleteAttachment
  } = useConversation();

  useState(() => {
    if (!apiKey) {
      const savedKey = localStorage.getItem("openrouter_api_key");
      if (savedKey) {
        setApiKey(savedKey);
      } else {
        setApiKey(DEFAULT_API_KEY);
        localStorage.setItem("openrouter_api_key", DEFAULT_API_KEY);
      }
    }
  });

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    
    if (message.trim() === "" && attachments.length === 0) {
      return;
    }
    
    if (!apiKey) {
      setApiKey(DEFAULT_API_KEY);
    }
    
    try {
      if (!currentConversationId) {
        await createConversation();
      }
    } catch (error) {
      console.error("Error ensuring conversation exists:", error);
      toast.error("Error al crear la conversación. Usando modo sin persistencia.");
    }
    
    setIsLoading(true);
    
    try {
      let messageId;
      try {
        messageId = await addMessage(message, "user", attachments);
      } catch (error) {
        console.error("Error adding message to database:", error);
        toast.error("Error al guardar el mensaje. Continuando en modo sin persistencia.");
      }
      
      const relevantChunks = findRelevantChunks(sources, message);
      const context = generateRAGContext(relevantChunks);
      
      const systemMessage = `Eres un asistente inteligente experto en RAG (Retrieval-Augmented Generation) con Pydantic. ${
        context ? `\n\n${context}` : ""
      }
      
      Si el usuario te hace preguntas sobre documentos o fuentes que no están en el contexto, indica que necesitas que se añadan como fuentes primero.
      
      Si te preguntan cómo implementar RAG con Pydantic, explica el enfoque basado en este ejemplo: https://ai.pydantic.dev/examples/rag/
      
      Formatea tu respuesta usando Markdown cuando sea apropiado.`;
      
      if (attachments.some(a => a.type === "image")) {
        const model = "qwen/qwen2.5-vl-3b-instruct:free";
        
        const content: { type: string; text?: string; image_url?: { url: string } }[] = [];
        
        if (message) {
          content.push({ type: "text", text: message });
        }
        
        for (const attachment of attachments) {
          if (attachment.type === "image" && attachment.data) {
            content.push({
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${attachment.data}`
              }
            });
          }
        }
        
        const messages = [
          { role: "system" as const, content: systemMessage },
          { role: "user" as const, content }
        ];
        
        let thinkingMessageId;
        try {
          thinkingMessageId = await addMessage("Analizando imagen...", "assistant");
        } catch (error) {
          console.log("Continuing in memory-only mode");
        }
        
        const response = await callOpenRouter(apiKey, messages, model);
        const responseContent = response.choices[0].message.content;
        
        try {
          await addMessage(responseContent, "assistant");
        } catch (error) {
          console.log("Failed to persist assistant response");
        }
        
        toast.success("Respuesta generada correctamente");
      } else {
        const model = "google/gemini-2.5-pro-exp-03-25:free";
        
        let thinkingMessageId;
        try {
          thinkingMessageId = await addMessage("Pensando...", "assistant");
        } catch (error) {
          console.log("Continuing in memory-only mode");
        }
        
        let responseContent = "";
        
        const apiMessages = [
          { role: "system" as const, content: systemMessage },
          { role: "user" as const, content: message }
        ];
        
        await streamOpenRouter(apiKey, apiMessages, model, 0.7, 1024, (chunk) => {
          responseContent += chunk;
          console.log("Stream chunk:", chunk);
        });
        
        try {
          await addMessage(responseContent, "assistant");
        } catch (error) {
          console.log("Failed to persist assistant response");
          toast.info("Respuesta generada correctamente (modo sin persistencia)");
        }
      }
      
      setMessage("");
      setAttachments([]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Error al enviar el mensaje. Comprueba tu API key y conexión.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsLoading(true);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const base64Data = await processImageForOpenRouter(file);
        
        const newAttachment: Attachment = {
          id: uuidv4(),
          type: "image",
          data: base64Data,
          name: file.name,
          size: file.size,
          mimeType: file.type
        };
        
        setAttachments(prev => [...prev, newAttachment]);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Error al cargar la imagen");
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(attachment => attachment.id !== id));
  };

  const handleAddSource = async () => {
    if (!sourceText.trim()) {
      toast.error("Por favor, ingresa una URL o texto");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const source = await processDocument(sourceText);
      addSource(source);
      setSourceText("");
      setSourceDialogOpen(false);
    } catch (error) {
      console.error("Error adding source:", error);
      toast.error("Error al añadir la fuente");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Por favor, ingresa un término de búsqueda");
      return;
    }
    
    setIsLoading(true);
    
    try {
      await searchInternet(searchQuery);
      setSearchQuery("");
      setSearchDialogOpen(false);
    } catch (error) {
      console.error("Error searching:", error);
      toast.error("Error al realizar la búsqueda");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border-t border-border p-4">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachments.map(attachment => (
            <div 
              key={attachment.id} 
              className="relative bg-muted rounded-md p-2 flex items-center gap-2"
            >
              <Image className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                {attachment.name}
              </span>
              <button 
                className="text-muted-foreground hover:text-foreground"
                onClick={() => handleRemoveAttachment(attachment.id)}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <div className="grid flex-1">
            <Textarea 
              placeholder="Escribe un mensaje..."
              className="resize-none p-3 h-[50px] min-h-[50px] w-full rounded-md border bg-background"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              disabled={isLoading}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload} 
              className="hidden" 
              ref={fileInputRef}
              disabled={isLoading}
            />
            
            <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  type="button" 
                  size="icon" 
                  variant="outline"
                  disabled={isLoading}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Buscar en Internet</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="search-query">Término de búsqueda</Label>
                    <Input 
                      id="search-query"
                      placeholder="¿Qué deseas buscar?"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSearch();
                        }
                      }}
                    />
                  </div>
                  
                  <Button 
                    type="button" 
                    className="w-full"
                    onClick={handleSearch}
                    disabled={isLoading || !searchQuery.trim()}
                  >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                    Buscar con Brave
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button 
              type="button" 
              size="icon" 
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Image className="h-4 w-4" />
            </Button>
            
            <Dialog open={sourceDialogOpen} onOpenChange={setSourceDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  type="button" 
                  size="icon" 
                  variant="outline"
                  disabled={isLoading}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Añadir fuente</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="flex justify-center space-x-2">
                    <Button 
                      type="button" 
                      variant={sourceType === "text" ? "default" : "outline"}
                      onClick={() => setSourceType("text")}
                      size="sm"
                    >
                      Texto
                    </Button>
                    <Button 
                      type="button" 
                      variant={sourceType === "url" ? "default" : "outline"}
                      onClick={() => setSourceType("url")}
                      size="sm"
                    >
                      URL
                    </Button>
                  </div>
                  
                  {sourceType === "text" ? (
                    <div className="space-y-2">
                      <Label htmlFor="source-text">Texto de conocimiento</Label>
                      <ScrollArea className="h-[200px] w-full rounded-md border">
                        <Textarea
                          id="source-text"
                          placeholder="Ingresa el texto que quieres usar como fuente..."
                          className="min-h-[200px] border-0"
                          value={sourceText}
                          onChange={(e) => setSourceText(e.target.value)}
                        />
                      </ScrollArea>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="source-url">URL de la fuente</Label>
                      <Input 
                        id="source-url"
                        placeholder="https://..."
                        value={sourceText}
                        onChange={(e) => setSourceText(e.target.value)}
                      />
                    </div>
                  )}
                  
                  <Button 
                    type="button" 
                    className="w-full"
                    onClick={handleAddSource}
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Añadir fuente
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button 
              type="submit" 
              size="icon" 
              disabled={isLoading || (message.trim() === "" && attachments.length === 0)}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </form>
      
      <Dialog open={apiKeyDialogOpen} onOpenChange={setApiKeyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar API Key de OpenRouter</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input 
                id="api-key"
                type="password"
                placeholder="sk-or-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Obtén tu API key en{" "}
                <a 
                  href="https://openrouter.ai/keys" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-primary underline"
                >
                  openrouter.ai/keys
                </a>
              </p>
            </div>
            <Button 
              type="button" 
              className="w-full"
              onClick={() => setApiKeyDialogOpen(false)}
              disabled={!apiKey}
            >
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
