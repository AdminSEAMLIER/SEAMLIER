import { useTranslation } from "react-i18next";
import { MessageSquare, Search, Send, Users, Headset } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { useSearch, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  projectType: string;
}

interface Message {
  id: string;
  sender: string;
  text: string;
  time: string;
}

export default function ProMessagerie() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const [showChat, setShowChat] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);

  const contactSupportMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/conversations", {
        participantId: "admin-001",
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setLocation("/messagerie?support=" + data.id);
      toast({ title: "Support", description: "Conversation avec le support ouverte." });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de contacter le support", variant: "destructive" });
    },
  });

  // Fetch real conversations from API (empty for now)
  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/pro/conversations"],
    enabled: false, // Disabled until API is implemented
  });

  // Check for new conversation from accepted request
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    if (params.get('newConversation') === 'true') {
      const acceptedRequest = sessionStorage.getItem('acceptedRequest');
      if (acceptedRequest) {
        const { clientName, projectType, autoMessage } = JSON.parse(acceptedRequest);
        
        const newConv: Conversation = {
          id: `new-${Date.now()}`,
          name: clientName,
          lastMessage: autoMessage,
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          unread: 0,
          projectType: projectType,
        };

        setSelectedConv(newConv);
        setChatMessages([{
          id: "auto-1",
          sender: "pro",
          text: `${t('pro.acceptanceMessageFull', { projectType })}`,
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        }]);
        
        setShowChat(true);
        sessionStorage.removeItem('acceptedRequest');
      }
    }
  }, [searchString, t]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    setChatMessages([...chatMessages, {
      id: `msg-${Date.now()}`,
      sender: "pro",
      text: newMessage,
      time: now,
    }]);
    setNewMessage("");
  };

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConv(conv);
    setChatMessages([]);
    setShowChat(true);
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
        {!showChat ? (
          <>
            <Card className="border border-gray-100 bg-white shadow-sm mb-6">
              <CardContent className="p-4 bg-white">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder={t('pro.searchConversations')} 
                    className="pl-9 border-gray-200"
                    data-testid="input-search-conversations"
                  />
                </div>
              </CardContent>
            </Card>

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
                  onClick={() => handleSelectConversation(conv)}
                >
                  <CardContent className="p-4 bg-white">
                    <div className="flex gap-3">
                      <Avatar className="h-12 w-12 border border-gray-100 flex-shrink-0">
                        <AvatarFallback className="bg-[#722F37]/10 text-[#722F37]">
                          {conv.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-gray-900 truncate">{conv.name}</span>
                          <span className="text-xs text-gray-400 flex-shrink-0">{conv.time}</span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                        <span className="text-xs text-[#722F37]">{conv.projectType}</span>
                      </div>
                      {conv.unread > 0 && (
                        <span className="w-5 h-5 rounded-full bg-[#722F37] text-white text-xs flex items-center justify-center flex-shrink-0">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </>
        ) : selectedConv && (
          <Card className="border border-gray-100 bg-white shadow-sm">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowChat(false)}
                  className="text-gray-500"
                >
                  {t('pro.back')}
                </Button>
                <Avatar className="h-10 w-10 border border-gray-100">
                  <AvatarFallback className="bg-[#722F37]/10 text-[#722F37]">
                    {selectedConv.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900">{selectedConv.name}</p>
                  <p className="text-sm text-[#722F37]">{selectedConv.projectType}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 bg-white">
              <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {chatMessages.length > 0 ? (
                  chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'pro' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          msg.sender === 'pro'
                            ? 'bg-[#722F37] text-white'
                            : 'bg-white border border-gray-200 text-gray-900'
                        }`}
                      >
                        <p>{msg.text}</p>
                        <p className={`text-xs mt-1 ${msg.sender === 'pro' ? 'text-white/70' : 'text-gray-400'}`}>
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400 text-sm">{t('pro.startConversation')}</p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={t('pro.typeMessage')}
                    className="flex-1 border-gray-200"
                    data-testid="input-message"
                  />
                  <Button 
                    className="bg-[#722F37] hover:bg-[#5a252c]" 
                    size="icon" 
                    onClick={handleSendMessage}
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
