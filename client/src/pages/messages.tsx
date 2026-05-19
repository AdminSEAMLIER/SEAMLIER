import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearch, Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, ImagePlus, ArrowLeft, MessageCircle, Headset, EyeOff, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { renderMessageContent } from "@/lib/message-renderer";
import type { ConversationWithParticipant, MessageWithSender } from "@shared/schema";

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [pendingFile, setPendingFile] = useState<{ url: string; mimeType: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchStr = useSearch();
  const tailorParam = new URLSearchParams(searchStr).get("tailor");

  const { data: conversations, isLoading: conversationsLoading } = useQuery<ConversationWithParticipant[]>({
    queryKey: ["/api/conversations"],
    refetchInterval: 5000,
  });

  const { data: messages, isLoading: messagesLoading } = useQuery<MessageWithSender[]>({
    queryKey: ["/api/messages", selectedConversationId],
    enabled: !!selectedConversationId,
    queryFn: async () => {
      const res = await fetch(`/api/messages/${selectedConversationId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (!user?.id) return;
    apiRequest("PATCH", "/api/messages/all/read", {})
      .then(() => queryClient.invalidateQueries({ queryKey: ["/api/conversations/unread-count"] }))
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (!tailorParam || !user?.id || selectedConversationId) return;
    apiRequest("POST", "/api/conversations", { tailorId: tailorParam })
      .then(res => res.json())
      .then((conv: any) => {
        queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
        if (conv?.id) setSelectedConversationId(conv.id);
      })
      .catch(() => {});
  }, [tailorParam, user?.id]);

  // Mark as read immediately when conversation is selected (badge disappears instantly)
  useEffect(() => {
    if (!selectedConversationId || !user?.id) return;
    apiRequest("PATCH", `/api/messages/${selectedConversationId}/read`, {})
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/conversations/unread-count"] });
        queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      })
      .catch(() => {});
  }, [selectedConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectedConversation = conversations?.find(c => c.id === selectedConversationId);

  const sendMessageMutation = useMutation({
    mutationFn: async (params: { content: string; fileUrl?: string | null; mimeType?: string | null }) => {
      const res = await apiRequest("POST", "/api/messages", {
        conversationId: selectedConversationId,
        content: params.content || "",
        ...(params.fileUrl ? { fileUrl: params.fileUrl, mimeType: params.mimeType } : {}),
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      console.log("[sendMessage onSuccess] message retourné:", { id: data?.id, fileUrl: data?.fileUrl, mimeType: data?.mimeType });
      queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedConversationId] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible d'envoyer le message", variant: "destructive" });
    },
  });

  const contactSupportMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/support/conversation", {});
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setSelectedConversationId(data.id);
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de contacter le support", variant: "destructive" });
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/messages/upload", { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) throw new Error("Upload échoué");
      return res.json() as Promise<{ fileUrl: string; mimeType: string; fileName: string }>;
    },
    onSuccess: (data) => {
      setPendingFile({ url: data.fileUrl, mimeType: data.mimeType, name: data.fileName });
    },
    onError: () => toast({ title: "Erreur", description: "Impossible d'envoyer ce fichier", variant: "destructive" }),
  });

  const markAsUnreadMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      return apiRequest("PATCH", `/api/messages/${conversationId}/unread`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations/unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setSelectedConversationId(null);
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de marquer comme non lu", variant: "destructive" });
    },
  });

  const handleSendMessage = () => {
    if (!messageInput.trim() && !pendingFile) return;
    if (!selectedConversationId) return;
    const fileUrl = pendingFile?.url ?? null;
    const mimeType = pendingFile?.mimeType ?? null;
    sendMessageMutation.mutate({ content: messageInput.trim(), fileUrl, mimeType });
    setMessageInput("");
    setPendingFile(null);
  };

  return (
    <div className="min-h-screen pb-20 lg:pb-0 bg-white">
      <div className="lg:flex lg:h-[calc(100vh-4rem)]">
        <aside 
          className={cn(
            "lg:w-80 lg:border-r lg:border-gray-100 lg:flex lg:flex-col bg-gray-50",
            selectedConversationId ? "hidden lg:flex" : "flex flex-col h-[calc(100vh-4rem)]"
          )}
        >
          <div className="p-4 border-b border-border bg-white flex items-center justify-between gap-3">
            <h1 className="font-serif text-2xl text-[#601B28]">Messages</h1>
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 border-[#601B28]/30 text-[#601B28] hover:bg-[#601B28]/5"
              onClick={() => contactSupportMutation.mutate()}
              disabled={contactSupportMutation.isPending}
              data-testid="button-contact-support"
            >
              <Headset className="h-3.5 w-3.5" />
              Support
            </Button>
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
                      <AvatarFallback className="bg-[#601B28] text-white">
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
                          <span className="bg-[#601B28] text-white text-xs px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
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
                  <AvatarFallback className="bg-[#601B28] text-white">
                    {(selectedConversation.otherParticipant.firstName || "?").charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  {selectedConversation.otherParticipantTailorId ? (
                    <Link href={`/profil-pro/${selectedConversation.otherParticipantTailorId}`}>
                      <h2 className="font-medium text-foreground hover:text-[#601B28] hover:underline cursor-pointer transition-colors">
                        {[selectedConversation.otherParticipant.firstName, selectedConversation.otherParticipant.lastName].filter(Boolean).join(" ")}
                      </h2>
                    </Link>
                  ) : (
                    <h2 className="font-medium text-foreground">{[selectedConversation.otherParticipant.firstName, selectedConversation.otherParticipant.lastName].filter(Boolean).join(" ")}</h2>
                  )}
                  <p className="text-xs text-muted-foreground">{selectedConversation.otherParticipant.role === "tailor" ? "Artisan" : "Client"}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground gap-1.5 flex-shrink-0"
                  onClick={() => selectedConversationId && markAsUnreadMutation.mutate(selectedConversationId)}
                  disabled={markAsUnreadMutation.isPending}
                  title="Marquer comme non lu"
                  data-testid="button-mark-unread"
                >
                  <EyeOff className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Non lu</span>
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
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
                              ? "bg-[#601B28] text-white rounded-br-sm" 
                              : "bg-white border border-border rounded-bl-sm"
                          )}
                          data-testid={`message-${message.id}`}
                        >
                          {(message as any).fileUrl && (message as any).mimeType?.startsWith("image/") && (
                            <img
                              src={(message as any).fileUrl}
                              alt="image"
                              className="max-w-[220px] rounded-lg mb-1 cursor-pointer"
                              onClick={() => window.open((message as any).fileUrl, "_blank")}
                            />
                          )}
                          {(message as any).fileUrl && (message as any).mimeType === "application/pdf" && (
                            <a
                              href={(message as any).fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={`flex items-center gap-1.5 text-xs underline mb-1 ${isSent ? "text-white/90" : "text-[#601B28]"}`}
                            >
                              <FileText className="h-3.5 w-3.5 shrink-0" />
                              {(message as any).fileUrl.split("/").pop()}
                            </a>
                          )}
                          {message.content && <div className="text-sm">{renderMessageContent(message.content, isSent)}</div>}
                          <div className="flex items-center gap-1 mt-1">
                            <p className={cn(
                              "text-[10px]",
                              isSent ? "text-white/70" : "text-muted-foreground"
                            )}>
                              {message.sentAt ? new Date(message.sentAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ""}
                            </p>
                            {isSent && message.isRead === false && (
                              <span className="w-2 h-2 rounded-full bg-white/50 inline-block" title="Non lu" />
                            )}
                            {isSent && message.isRead === true && (
                              <span className="w-2 h-2 rounded-full bg-blue-300 inline-block" title="Lu" />
                            )}
                          </div>
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
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-border bg-white">
                {pendingFile && (
                  <div className="flex items-center gap-2 mb-2 px-2 py-1.5 bg-gray-50 rounded-lg border border-border">
                    {pendingFile.mimeType.startsWith("image/") ? (
                      <img src={pendingFile.url} alt="" className="h-10 w-10 object-cover rounded" />
                    ) : (
                      <FileText className="h-5 w-5 text-[#601B28] shrink-0" />
                    )}
                    <span className="text-xs text-gray-700 flex-1 truncate">{pendingFile.name}</span>
                    <button onClick={() => setPendingFile(null)} className="text-gray-400 hover:text-gray-700">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadFileMutation.mutate(f);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadFileMutation.isPending}
                    data-testid="button-attach"
                  >
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
                    className="bg-[#601B28] hover:bg-[#4E1522]"
                    onClick={handleSendMessage}
                    disabled={(!messageInput.trim() && !pendingFile) || sendMessageMutation.isPending}
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
              <h2 className="font-serif text-xl text-[#601B28] mb-2">Vos messages</h2>
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
