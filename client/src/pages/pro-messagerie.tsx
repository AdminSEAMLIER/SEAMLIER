import { useTranslation } from "react-i18next";
import { MessageSquare, Search, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";

const mockConversations = [
  {
    id: "1",
    name: "Claire Beaumont",
    lastMessage: "Parfait, on se voit mardi pour l'essayage !",
    time: "14:30",
    unread: 2,
    project: "Robe de mariée",
  },
  {
    id: "2",
    name: "Marc Lefebvre",
    lastMessage: "Pouvez-vous m'envoyer les options de tissus ?",
    time: "11:20",
    unread: 0,
    project: "Costume 3 pièces",
  },
  {
    id: "3",
    name: "Julie Moreau",
    lastMessage: "Merci beaucoup pour votre travail !",
    time: "Hier",
    unread: 0,
    project: "Retouches robe",
  },
  {
    id: "4",
    name: "Marie Dupont",
    lastMessage: "Je suis intéressée par votre offre",
    time: "Hier",
    unread: 1,
    project: "Nouvelle demande",
  },
];

const mockMessages = [
  { id: "1", sender: "client", text: "Bonjour, je voudrais savoir si vous êtes disponible pour l'essayage mardi ?", time: "14:00" },
  { id: "2", sender: "pro", text: "Bonjour Claire ! Oui, je suis disponible mardi après-midi. 15h vous conviendrait ?", time: "14:15" },
  { id: "3", sender: "client", text: "15h c'est parfait pour moi !", time: "14:25" },
  { id: "4", sender: "client", text: "Parfait, on se voit mardi pour l'essayage !", time: "14:30" },
];

export default function ProMessagerie() {
  const { t } = useTranslation();
  const [selectedConv, setSelectedConv] = useState(mockConversations[0]);
  const [newMessage, setNewMessage] = useState("");
  const [showChat, setShowChat] = useState(false);

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

            {mockConversations.map((conv) => (
              <Card 
                key={conv.id} 
                className="border border-gray-100 bg-white shadow-sm mb-3 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setSelectedConv(conv);
                  setShowChat(true);
                }}
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
                      <span className="text-xs text-[#722F37]">{conv.project}</span>
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
                  Retour
                </Button>
                <Avatar className="h-10 w-10 border border-gray-100">
                  <AvatarFallback className="bg-[#722F37]/10 text-[#722F37]">
                    {selectedConv.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900">{selectedConv.name}</p>
                  <p className="text-sm text-[#722F37]">{selectedConv.project}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 bg-white">
              <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {mockMessages.map((msg) => (
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
                ))}
              </div>

              <div className="p-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={t('pro.typeMessage')}
                    className="flex-1 border-gray-200"
                    data-testid="input-message"
                  />
                  <Button className="bg-[#722F37] hover:bg-[#5a252c]" size="icon" data-testid="button-send">
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
