import { useTranslation } from "react-i18next";
import { MessageSquare, Search, Send, Users, Headset, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect, useRef } from "react";
import { useSearch, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { ConversationWithParticipant, MessageWithSender } from "@shared/schema";

export default function ProMessagerie() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [], isLoading } = useQuery<ConversationWithParticipant[]>({
    queryKey: ["/api/conversations"],
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<MessageWithSender[]>({
    queryKey: ["/api/messages", selectedConversationId],
    enabled: !!selectedConversationId,
  });

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const contactSupportMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/support/conversation", {});
      return res.json();
    },
    onSuccess: async (data: any) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setSelectedConversationId(data.id);
      toast({ title: "Support", description: "Conversation avec le support ouverte." });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de contacter le support", variant: "destructive" });
    },
  });

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
    if (!newMessage.trim() || !selectedConversationId) return;
    sendMessageMutation.mutate(newMessage.trim());
    setNewMessage("");
  };

  return (
    <div className="min-h-screen pb-20 lg:pb-8 bg-white">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white border border-[#722F37] flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-[#722F37]" />
              </div>
              <h1 className="font-serif text-3xl lg:text-4xl text-[#722F37]">
                {t('nav.messaging')}
              </h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 border-[#722F37]/30 text-[#722F37] hover:bg-[#722F37]/5"
              onClick={() => contactSupportMutation.mutate()}
              disabled={contactSupportMutation.isPending}
              data-testid="button-contact-support"
            >
              <Headset className="h-3.5 w-3.5" />
              Support
            </Button>
          </div>
          <p className="text-gray-600 mt-2">
            {t('pro.searchConversations')}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 lg:px-6 py-6">
        {!selectedConversationId ? (
          <>
            {isLoading ? (
              <Card className="border border-gray-100 bg-white shadow-sm">
                <CardContent className="p-8 bg-white text-center">
                  <p className="text-gray-500">{t('common.loading')}</p>
                </CardContent>
              </Card>
            ) : conversations.length === 0 ? (
              <Card className="border border-gray-100 bg-white shadow-sm">
                <CardContent className="p-12 bg-white text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="font-serif text-xl text-[#722F37] mb-2">
                    {t('pro.noMessagesTitle')}
                  </h3>
                  <p className="text-gray-500 mb-2">{t('pro.noMessagesDesc')}</p>
                  <p className="text-gray-400 text-sm">{t('pro.noMessagesHint')}</p>
                </CardContent>
              </Card>
            ) : (
              conversations.map((conv) => (
                <Card 
                  key={conv.id} 
                  className="border border-gray-100 bg-white shadow-sm mb-3 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedConversationId(conv.id)}
                  data-testid={`conversation-${conv.id}`}
                >
                  <CardContent className="p-4 bg-white">
                    <div className="flex gap-3">
                      <Avatar className="h-12 w-12 border border-gray-100 flex-shrink-0">
                        <AvatarImage src={conv.otherParticipant.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-[#722F37]/10 text-[#722F37]">
                          {(conv.otherParticipant.firstName || "?").charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-gray-900 truncate">
                            {[conv.otherParticipant.firstName, conv.otherParticipant.lastName].filter(Boolean).join(" ")}
                          </span>
                          {conv.lastMessageAt && (
                            <span className="text-xs text-gray-400 flex-shrink-0">
                              {new Date(conv.lastMessageAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">{conv.lastMessagePreview || "Aucun message"}</p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-[#722F37] text-white text-xs flex items-center justify-center flex-shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </>
        ) : !selectedConversation ? (
          <Card className="border border-gray-100 bg-white shadow-sm">
            <CardContent className="p-8 bg-white text-center">
              <Button variant="ghost" onClick={() => setSelectedConversationId(null)} className="mb-4 text-gray-500" data-testid="button-back-loading">
                <ArrowLeft className="h-4 w-4 mr-2" /> Retour
              </Button>
              <p className="text-gray-400">Chargement de la conversation...</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-gray-100 bg-white shadow-sm">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setSelectedConversationId(null)}
                  className="text-gray-500"
                  data-testid="button-back-messages"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar className="h-10 w-10 border border-gray-100">
                  <AvatarImage src={selectedConversation.otherParticipant.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-[#722F37]/10 text-[#722F37]">
                    {(selectedConversation.otherParticipant.firstName || "?").charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900">
                    {[selectedConversation.otherParticipant.firstName, selectedConversation.otherParticipant.lastName].filter(Boolean).join(" ")}
                  </p>
                  <p className="text-xs text-gray-500">En ligne</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 bg-white">
              <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400 text-sm">Chargement...</p>
                  </div>
                ) : messages.length > 0 ? (
                  <>
                    {messages.map((msg) => {
                      const isSent = msg.senderId !== selectedConversation.otherParticipant.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                              isSent
                                ? 'bg-[#722F37] text-white rounded-br-sm'
                                : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
                            }`}
                            data-testid={`message-${msg.id}`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p className={`text-[10px] mt-1 ${isSent ? 'text-white/70' : 'text-gray-400'}`}>
                              {msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ""}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400 text-sm">Envoyez votre premier message</p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder="Écrivez votre message..."
                    className="flex-1 border-gray-200"
                    data-testid="input-message"
                  />
                  <Button 
                    className="bg-[#722F37] hover:bg-[#5a252c]" 
                    size="icon" 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    data-testid="button-send"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
