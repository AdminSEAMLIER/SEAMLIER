import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, ImagePlus, ArrowLeft, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import type { ConversationWithParticipant, MessageWithSender } from "@shared/schema";

export default function Messages() {
  const { user } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const queryClient = useQueryClient();

  const { data: conversations, isLoading: conversationsLoading } = useQuery<ConversationWithParticipant[]>({
    queryKey: ["/api/conversations"],
  });

  const { data: messages, isLoading: messagesLoading } = useQuery<MessageWithSender[]>({
    queryKey: ["/api/messages", selectedConversationId],
    enabled: !!selectedConversationId,
  });

  const selectedConversation = conversations?.find(c => c.id === selectedConversationId);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", "/api/messages", {
        conversationId: selectedConversationId,
        senderId: user?.id?.toString() || "",
        content,
        sentAt: new Date().toISOString(),
        isRead: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedConversationId] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversationId) return;
    sendMessageMutation.mutate(messageInput.trim());
    setMessageInput("");
  };

  return (
    <div className="min-h-screen pb-20 lg:pb-0 bg-white">
      <div className="lg:flex lg:h-[calc(100vh-4rem)]">
        <aside 
          className={cn(
            "lg:w-80 lg:border-r lg:border-border lg:flex lg:flex-col bg-muted/50",
            selectedConversationId ? "hidden lg:flex" : "flex flex-col h-[calc(100vh-4rem)]"
          )}
        >
          <div className="p-4 border-b border-border bg-white">
            <h1 className="font-serif text-2xl text-primary">Messages</h1>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {conversationsLoading ? (
              <div className="p-4 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full skeleton-shimmer" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-24 rounded skeleton-shimmer" />
                      <div className="h-3 w-32 rounded skeleton-shimmer" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations && conversations.length > 0 ? (
              <div>
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversationId(conversation.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 hover-elevate transition-colors text-left border-b border-border",
                      selectedConversationId === conversation.id && "bg-white"
                    )}
                    data-testid={`conversation-${conversation.id}`}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conversation.otherParticipant.profileImageUrl || undefined} />
                      <AvatarFallback className="bg-[#722F37] text-white">
                        {(conversation.otherParticipant.firstName || "?").charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-medium text-sm text-foreground truncate">
                          {[conversation.otherParticipant.firstName, conversation.otherParticipant.lastName].filter(Boolean).join(" ")}
                        </h3>
                        {conversation.lastMessageAt && (
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {new Date(conversation.lastMessageAt).toLocaleDateString('fr-FR', { 
                              day: 'numeric', 
                              month: 'short' 
                            })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessagePreview || "Aucun message"}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="bg-[#722F37] text-white text-xs px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Aucune conversation</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Commencez par contacter un couturier
                </p>
              </div>
            )}
          </div>
        </aside>

        <main 
          className={cn(
            "flex-1 flex flex-col bg-white",
            !selectedConversationId && "hidden lg:flex"
          )}
        >
          {selectedConversation ? (
            <>
              <div className="flex items-center gap-3 p-4 border-b border-border">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setSelectedConversationId(null)}
                  data-testid="button-back-messages"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedConversation.otherParticipant.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-[#722F37] text-white">
                    {(selectedConversation.otherParticipant.firstName || "?").charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-medium text-foreground">{[selectedConversation.otherParticipant.firstName, selectedConversation.otherParticipant.lastName].filter(Boolean).join(" ")}</h2>
                  <p className="text-xs text-muted-foreground">En ligne</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/50">
                {messagesLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className={cn("flex", i % 2 === 0 ? "justify-start" : "justify-end")}>
                        <div className={cn(
                          "h-16 w-48 rounded-2xl skeleton-shimmer",
                          i % 2 === 0 ? "rounded-bl-sm" : "rounded-br-sm"
                        )} />
                      </div>
                    ))}
                  </div>
                ) : messages && messages.length > 0 ? (
                  messages.map((message) => {
                    const isSent = message.senderId !== selectedConversation.otherParticipant.id;
                    return (
                      <div
                        key={message.id}
                        className={cn("flex", isSent ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[75%] px-4 py-2 rounded-2xl",
                            isSent 
                              ? "bg-[#722F37] text-white rounded-br-sm" 
                              : "bg-white border border-border rounded-bl-sm"
                          )}
                          data-testid={`message-${message.id}`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={cn(
                            "text-[10px] mt-1",
                            isSent ? "text-white/70" : "text-muted-foreground"
                          )}>
                            {message.sentAt ? new Date(message.sentAt).toLocaleTimeString('fr-FR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            }) : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-muted-foreground">Aucun message</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Envoyez votre premier message
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border bg-white">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="text-muted-foreground" data-testid="button-attach">
                    <ImagePlus className="h-5 w-5" />
                  </Button>
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Écrivez votre message..."
                    className="flex-1"
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                    data-testid="input-message"
                  />
                  <Button 
                    size="icon" 
                    className="bg-[#722F37] hover:bg-[#5a252c]"
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sendMessageMutation.isPending}
                    data-testid="button-send-message"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageCircle className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h2 className="font-serif text-xl text-primary mb-2">Vos messages</h2>
              <p className="text-muted-foreground">
                Sélectionnez une conversation pour voir les messages
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
