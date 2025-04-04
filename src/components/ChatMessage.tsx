
import { useState } from "react";
import { Message } from "@/types";
import ReactMarkdown from "react-markdown";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Trash2, MoreVertical, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useConversation } from "@/context/ConversationContext";

interface ChatMessageProps {
  message: Message;
  isLast: boolean;
}

export function ChatMessage({ message, isLast }: ChatMessageProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<string | null>(null);
  const { deleteMessage, deleteAttachment } = useConversation();

  const handleDeleteMessage = async () => {
    try {
      await deleteMessage(message.id);
    } catch (error) {
      console.error("Error deleting message:", error);
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await deleteAttachment(attachmentId);
    } catch (error) {
      console.error("Error deleting attachment:", error);
    } finally {
      setAttachmentToDelete(null);
    }
  };

  // Function to download an attachment
  const downloadAttachment = (attachment: Message["attachments"][0]) => {
    if (attachment.data) {
      const linkSource = `data:${attachment.mimeType || 'application/octet-stream'};base64,${attachment.data}`;
      const downloadLink = document.createElement('a');
      downloadLink.href = linkSource;
      downloadLink.download = attachment.name;
      downloadLink.click();
    } else if (attachment.url) {
      const downloadLink = document.createElement('a');
      downloadLink.href = attachment.url;
      downloadLink.download = attachment.name;
      downloadLink.target = '_blank';
      downloadLink.click();
    }
  };

  const isUserMessage = message.role === "user";
  
  return (
    <div className={`flex gap-3 mb-6 ${isUserMessage ? 'flex-row-reverse' : ''}`}>
      <Avatar className={`h-8 w-8 ${isUserMessage ? 'bg-primary' : 'bg-secondary'}`}>
        <AvatarFallback>
          {isUserMessage ? 'U' : 'AI'}
        </AvatarFallback>
        {!isUserMessage && (
          <AvatarImage src="/logo.png" alt="AI" />
        )}
      </Avatar>

      <div className={`flex flex-col max-w-[80%] ${isUserMessage ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">
            {isUserMessage ? 'Tú' : 'Asistente'}
          </span>
          {/* Solo mostrar las acciones si no es un mensaje de "pensando" o el último mensaje del asistente */}
          {!(isLast && message.role === "assistant" && (message.content === "Pensando..." || message.content === "Analizando imagen...")) && (
            <DropdownMenu>
              <DropdownMenuTrigger className="opacity-50 hover:opacity-100 focus:opacity-100">
                <MoreVertical className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isUserMessage ? "end" : "start"}>
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Eliminar mensaje</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className={`flex flex-col gap-2 ${isUserMessage ? 'items-end' : 'items-start'} w-full`}>
          <Card className={`p-3 ${isUserMessage ? 'bg-primary/10 text-primary-foreground' : 'bg-card'}`}>
            <div className="prose prose-sm dark:prose-invert">
              {message.content === "Pensando..." || message.content === "Analizando imagen..." ? (
                <div className="flex items-center gap-1">
                  <span>{message.content}</span>
                  <div className="flex gap-1">
                    <span className="animate-bounce delay-0">.</span>
                    <span className="animate-bounce delay-150">.</span>
                    <span className="animate-bounce delay-300">.</span>
                  </div>
                </div>
              ) : (
                <ReactMarkdown>{message.content}</ReactMarkdown>
              )}
            </div>
          </Card>

          {/* Attachments display */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {message.attachments.map(attachment => (
                <div key={attachment.id} className="relative">
                  <Card 
                    className={`p-2 flex items-center gap-2 ${
                      isUserMessage ? 'bg-primary/5' : 'bg-muted'
                    }`}
                  >
                    {attachment.type === "image" && attachment.data && (
                      <div className="relative w-32 h-32">
                        <img 
                          src={`data:image/jpeg;base64,${attachment.data}`}
                          alt={attachment.name}
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                    )}
                    
                    {(attachment.type !== "image" || !attachment.data) && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs truncate max-w-[150px]">{attachment.name}</span>
                      </div>
                    )}
                    
                    <div className="flex gap-1 ml-auto">
                      <button
                        onClick={() => downloadAttachment(attachment)}
                        className="text-muted-foreground hover:text-primary"
                        title="Descargar archivo"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setAttachmentToDelete(attachment.id)}
                        className="text-muted-foreground hover:text-destructive"
                        title="Eliminar archivo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </Card>
                  
                  <AlertDialog 
                    open={attachmentToDelete === attachment.id} 
                    onOpenChange={(open) => !open && setAttachmentToDelete(null)}
                  >
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar archivo?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. El archivo será eliminado permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          className="bg-destructive hover:bg-destructive/90"
                          onClick={() => handleDeleteAttachment(attachment.id)}
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmación para eliminar mensaje */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar mensaje?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El mensaje será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDeleteMessage}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
