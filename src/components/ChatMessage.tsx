
import { Message } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { User, Bot, ImageIcon, FileIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  message: Message;
  isLast?: boolean;
}

export function ChatMessage({ message, isLast }: ChatMessageProps) {
  const { role, content, attachments } = message;
  const isUser = role === "user";
  
  return (
    <div className={cn("flex gap-3 mb-6", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-rag-purple text-white">
            <Bot size={16} />
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn("max-w-[80%]", isUser ? "order-1" : "order-2")}>
        {attachments && attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="relative">
                {attachment.type === "image" && attachment.data && (
                  <Card className="overflow-hidden">
                    <CardContent className="p-1">
                      <div className="relative h-24 w-24">
                        <img
                          src={`data:image/jpeg;base64,${attachment.data}`}
                          alt={attachment.name}
                          className="h-full w-full object-cover rounded"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {(attachment.type === "document" || attachment.type === "url") && (
                  <Card className="overflow-hidden">
                    <CardContent className="p-2 flex items-center gap-2">
                      {attachment.type === "document" ? (
                        <FileIcon className="h-4 w-4 text-blue-500" />
                      ) : (
                        <ImageIcon className="h-4 w-4 text-green-500" />
                      )}
                      <span className="text-xs truncate max-w-[120px]">
                        {attachment.name}
                      </span>
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}
          </div>
        )}
        
        <Card className={cn(
          "overflow-hidden",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
          <CardContent className="p-3 text-sm">
            <ReactMarkdown 
              className="prose prose-sm max-w-none break-words"
              components={{
                pre: ({ node, ...props }) => (
                  <pre className="bg-gray-800 text-white p-2 rounded-md overflow-x-auto my-2" {...props} />
                ),
                code: ({ node, className, children, ...props }) => {
                  // Check if the code is inline based on the className or other properties
                  const isInline = !className || !className.includes('language-');
                  
                  return isInline ? (
                    <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs" {...props}>
                      {children}
                    </code>
                  ) : (
                    <code {...props}>{children}</code>
                  );
                },
                ul: ({ node, ...props }) => <ul className="list-disc pl-4 my-2" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal pl-4 my-2" {...props} />,
                li: ({ node, ...props }) => <li className="my-1" {...props} />,
                p: ({ node, ...props }) => <p className="my-1" {...props} />,
                h1: ({ node, ...props }) => <h1 className="text-lg font-bold my-2" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-md font-bold my-2" {...props} />,
                h3: ({ node, ...props }) => <h3 className="font-bold my-1" {...props} />,
                a: ({ node, ...props }) => <a className="text-blue-600 hover:underline" {...props} />,
                blockquote: ({ node, ...props }) => (
                  <blockquote className="border-l-2 border-gray-300 pl-4 italic my-2" {...props} />
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </CardContent>
        </Card>
        
        <div className="text-xs text-muted-foreground mt-1">
          {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </div>
      </div>
      
      {isUser && (
        <Avatar className="h-8 w-8 order-3">
          <AvatarFallback className="bg-blue-500 text-white">
            <User size={16} />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
