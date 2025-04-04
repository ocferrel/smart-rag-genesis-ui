
import { useState, useEffect } from "react";
import { useConversation } from "@/context/ConversationContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, MessageSquare, LogOut, Settings, BookOpen, FileUp, Database } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns/format";
import { es } from "date-fns/locale";

export function ConversationSidebar() {
  const { conversations, currentConversationId, createConversation, selectConversation, sources } = useConversation();
  const { user, logout } = useAuth();
  const [dateGroups, setDateGroups] = useState<{[key: string]: typeof conversations}>({});

  useEffect(() => {
    // Group conversations by date
    const groups: {[key: string]: typeof conversations} = {};
    
    conversations.forEach((conversation) => {
      const date = new Date(conversation.createdAt);
      const dateKey = format(date, 'yyyy-MM-dd');
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      
      groups[dateKey].push(conversation);
    });
    
    setDateGroups(groups);
  }, [conversations]);

  const handleNewConversation = () => {
    createConversation();
  };

  return (
    <div className="w-64 h-screen border-r border-border flex flex-col bg-sidebar">
      <div className="p-4">
        <Button 
          variant="default" 
          className="w-full gap-2 bg-gradient-to-r from-rag-purple to-rag-blue text-white"
          onClick={handleNewConversation}
        >
          <PlusCircle size={16} />
          Nueva conversación
        </Button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 text-sm font-medium">
          <h2 className="text-muted-foreground mb-2 flex items-center gap-2">
            <BookOpen size={14} />
            Fuentes ({sources.length})
          </h2>
          <div className="space-y-1 mb-4 max-h-20 overflow-y-auto">
            {sources.length === 0 ? (
              <p className="text-xs text-muted-foreground">No hay fuentes añadidas</p>
            ) : (
              sources.map((source) => (
                <div key={source.id} className="text-xs flex items-center gap-1 truncate">
                  {source.type === 'document' ? (
                    <FileUp size={12} />
                  ) : source.type === 'url' ? (
                    <Database size={12} />
                  ) : (
                    <MessageSquare size={12} />
                  )}
                  <span className="truncate">{source.name}</span>
                </div>
              ))
            )}
          </div>
        </div>
      
        <Separator />
        
        <ScrollArea className="flex-1 p-2">
          {Object.keys(dateGroups).length === 0 ? (
            <div className="text-sm text-center p-4 text-muted-foreground">
              No hay conversaciones
            </div>
          ) : (
            Object.entries(dateGroups).map(([dateKey, group]) => (
              <div key={dateKey} className="mb-4">
                <h3 className="text-xs text-muted-foreground px-3 py-2">
                  {format(new Date(dateKey), "EEEE, d 'de' MMMM", { locale: es })}
                </h3>
                <div className="space-y-1">
                  {group.map((conversation) => (
                    <Button
                      key={conversation.id}
                      variant={currentConversationId === conversation.id ? "secondary" : "ghost"}
                      className={`w-full justify-start text-left h-auto py-2 px-3 ${
                        currentConversationId === conversation.id ? "bg-secondary" : ""
                      }`}
                      onClick={() => selectConversation(conversation.id)}
                    >
                      <MessageSquare className="mr-2 h-4 w-4 shrink-0" />
                      <span className="truncate text-sm font-normal">
                        {conversation.title || 'Nueva conversación'}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </div>
      
      <div className="mt-auto border-t border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium">{user?.name || user?.email}</p>
            <p className="text-xs text-muted-foreground">Smart RAG</p>
          </div>
          <Button variant="ghost" size="icon" onClick={logout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" className="w-full flex items-center gap-2">
          <Settings className="h-3.5 w-3.5" />
          <span>Configuración</span>
        </Button>
      </div>
    </div>
  );
}
