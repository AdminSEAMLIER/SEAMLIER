import { useTranslation } from "react-i18next";
import { MessageSquare, Search, Send } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { useSearch } from "wouter";

export default function ProMessagerie() {
  const { t } = useTranslation();
  const searchString = useSearch();
  const [showChat, setShowChat] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{id: string; sender: string; text: string; time: string}>>([]);

  const mockConversations = [
    {
      id: "1",
      name: "Claire Beaumont",
      lastMessageKey: "pro.mockMessages.fitting",
      time: "14:30",
      unread: 2,
      projectKey: "pro.weddingDress",
    },
    {
      id: "2",
      name: "Marc Lefebvre",
      lastMessageKey: "pro.mockMessages.fabrics",
      time: "11:20",
      unread: 0,
      projectKey: "pro.suit3Piece",
    },
    {
      id: "3",
      name: "Julie Moreau",
      lastMessageKey: "pro.mockMessages.thanks",
      time: t('pro.yesterday'),
      unread: 0,
      projectKey: "pro.alterations",
    },
    {
      id: "4",
      name: "Marie Dupont",
      lastMessageKey: "pro.mockMessages.interested",
      time: t('pro.yesterday'),
      unread: 1,
      projectKey: "pro.newRequestLabel",
    },
  ];

  const [conversations, setConversations] = useState(mockConversations);
  const [selectedConv, setSelectedConv] = useState(mockConversations[0]);

  const mockMessages = [
    { id: "1", sender: "client", textKey: "pro.mockMessages.availableTuesday", time: "14:00" },
    { id: "2", sender: "pro", textKey: "pro.mockMessages.yesAvailable", time: "14:15" },
    { id: "3", sender: "client", textKey: "pro.mockMessages.perfect", time: "14:25" },
    { id: "4", sender: "client", textKey: "pro.mockMessages.fitting", time: "14:30" },
  ];

  // Check for new conversation from accepted request
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    if (params.get('newConversation') === 'true') {
      const acceptedRequest = sessionStorage.getItem('acceptedRequest');
      if (acceptedRequest) {
        const { clientName, projectType, autoMessage } = JSON.parse(acceptedRequest);
        
        // Create new conversation
        const newConv = {
          id: `new-${Date.now()}`,
          name: clientName,
          lastMessageKey: "",
          lastMessage: autoMessage,
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          unread: 0,
          projectKey: "",
          projectType: projectType,
        };

        // Add to conversations list
        setConversations([newConv, ...mockConversations]);
        setSelectedConv(newConv as any);
        
        // Set the auto message
        setChatMessages([{
          id: "auto-1",
          sender: "pro",
          text: `${t('pro.acceptanceMessageFull', { projectType })}`,
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        }]);
        
        setShowChat(true);
        
        // Clear the session storage
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

  const handleSelectConversation = (conv: typeof mockConversations[0]) => {
    setSelectedConv(conv);
    // Reset to mock messages for existing conversations
    setChatMessages([]);
    setShowChat(true);
  };

  return (
    <div className="min-h-screen pb-20 lg:pb-8 bg-white">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white border border-[#722F37] flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-[#722F37]" />
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl text-[#722F37]">
              {t('nav.messaging')}
            </h1>
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

            {conversations.map((conv) => (
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
                      <p className="text-sm text-gray-500 truncate">
                        {(conv as any).lastMessage || t(conv.lastMessageKey)}
                      </p>
                      <span className="text-xs text-[#722F37]">
                        {(conv as any).projectType || t(conv.projectKey)}
                      </span>
                    </div>
                    {conv.unread > 0 && (
                      <span className="w-5 h-5 rounded-full bg-[#722F37] text-white text-xs flex items-center justify-center flex-shrink-0">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
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
                  <p className="text-sm text-[#722F37]">
                    {(selectedConv as any).projectType || t(selectedConv.projectKey)}
                  </p>
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
                  mockMessages.map((msg) => (
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
                        <p>{t(msg.textKey)}</p>
                        <p className={`text-xs mt-1 ${msg.sender === 'pro' ? 'text-white/70' : 'text-gray-400'}`}>
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  ))
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
