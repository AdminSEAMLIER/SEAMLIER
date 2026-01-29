import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { FileText, Clock, MapPin, Euro, CheckCircle, XCircle, MessageSquare, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface Request {
  id: string;
  clientName: string;
  clientLocation: string;
  type: string;
  description: string;
  budget: string;
  deadline: string;
  status: string;
  createdAt: string;
}

export default function ProDemandes() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [acceptedRequests, setAcceptedRequests] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'new' | 'pending'>('all');

  // Fetch real requests from API (empty for now)
  const { data: requests = [], isLoading } = useQuery<Request[]>({
    queryKey: ["/api/pro/requests"],
    enabled: false, // Disabled until API is implemented
  });

  const handleAccept = (request: Request) => {
    setAcceptedRequests([...acceptedRequests, request.id]);
    
    toast({
      title: t('pro.requestAccepted'),
      description: t('pro.redirectingToMessaging'),
    });

    sessionStorage.setItem('acceptedRequest', JSON.stringify({
      clientName: request.clientName,
      projectType: request.type,
      autoMessage: t('pro.acceptanceMessage')
    }));

    setTimeout(() => {
      setLocation('/professionnel/messagerie?newConversation=true');
    }, 500);
  };

  const handleDecline = (requestId: string) => {
    toast({
      title: t('pro.requestDeclined'),
      description: t('pro.requestDeclinedDesc'),
    });
  };

  const getStatusBadge = (status: string, requestId: string) => {
    if (acceptedRequests.includes(requestId)) {
      return <Badge className="bg-blue-100 text-blue-700 border-none">{t('pro.accepted')}</Badge>;
    }
    switch (status) {
      case "new":
        return <Badge className="bg-green-100 text-green-700 border-none">{t('pro.newRequest')}</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700 border-none">{t('pro.pending')}</Badge>;
      default:
        return null;
    }
  };

  const baseRequests = requests.filter(r => !acceptedRequests.includes(r.id));
  
  const filteredRequests = baseRequests.filter(r => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'new') return r.status === 'new';
    if (activeFilter === 'pending') return r.status === 'pending';
    return true;
  });

  return (
    <div className="min-h-screen pb-20 lg:pb-8 bg-white">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white border border-[#722F37] flex items-center justify-center">
              <FileText className="h-5 w-5 text-[#722F37]" />
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl text-[#722F37]">
              {t('nav.requests')}
            </h1>
          </div>
          <p className="text-gray-600 mt-2">
            {t('pro.requestsSubtitle')}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 lg:px-6 py-6">
        <Card className="border border-gray-100 bg-white shadow-sm mb-6">
          <CardContent className="p-4 bg-white">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Button 
                variant="default" 
                className={activeFilter === 'all' 
                  ? "bg-[#722F37] text-white hover:bg-[#5a252c]" 
                  : "bg-white border-2 border-gray-200 text-gray-600 hover:border-[#722F37] hover:text-[#722F37]"
                } 
                size="sm"
                onClick={() => setActiveFilter('all')}
                data-testid="filter-all"
              >
                {t('pro.allRequests')} ({baseRequests.length})
              </Button>
              <Button 
                variant="default" 
                className={activeFilter === 'new' 
                  ? "bg-[#722F37] text-white hover:bg-[#5a252c]" 
                  : "bg-white border-2 border-gray-200 text-gray-600 hover:border-[#722F37] hover:text-[#722F37]"
                } 
                size="sm"
                onClick={() => setActiveFilter('new')}
                data-testid="filter-new"
              >
                {t('pro.newRequests')} ({baseRequests.filter(r => r.status === 'new').length})
              </Button>
              <Button 
                variant="default" 
                className={activeFilter === 'pending' 
                  ? "bg-[#722F37] text-white hover:bg-[#5a252c]" 
                  : "bg-white border-2 border-gray-200 text-gray-600 hover:border-[#722F37] hover:text-[#722F37]"
                } 
                size="sm"
                onClick={() => setActiveFilter('pending')}
                data-testid="filter-pending"
              >
                {t('pro.pendingRequests')} ({baseRequests.filter(r => r.status === 'pending').length})
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card className="border border-gray-100 bg-white shadow-sm">
            <CardContent className="p-8 bg-white text-center">
              <p className="text-gray-500">{t('common.loading')}</p>
            </CardContent>
          </Card>
        ) : filteredRequests.length === 0 ? (
          <Card className="border border-gray-100 bg-white shadow-sm">
            <CardContent className="p-12 bg-white text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-serif text-xl text-[#722F37] mb-2">
                {t('pro.noRequestsTitle')}
              </h3>
              <p className="text-gray-500 mb-2">{t('pro.noRequestsDesc')}</p>
              <p className="text-gray-400 text-sm">{t('pro.noRequestsHint')}</p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request.id} className="border border-gray-100 bg-white shadow-sm mb-4">
              <CardContent className="p-5 bg-white">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-[#722F37]">{request.type}</h3>
                      {getStatusBadge(request.status, request.id)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
                      <span>{request.clientName}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {request.clientLocation}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{request.createdAt}</span>
                </div>

                <p className="text-gray-600 text-sm mb-4">{request.description}</p>

                <div className="flex flex-wrap gap-4 text-sm mb-4">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Euro className="h-4 w-4 text-[#722F37]" />
                    <span>{request.budget}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Clock className="h-4 w-4 text-[#722F37]" />
                    <span>{request.deadline}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <Button 
                    className="flex-1 bg-white border-2 border-[#722F37] text-[#722F37] hover:bg-[#722F37]/10" 
                    onClick={() => handleAccept(request)}
                    data-testid={`button-accept-${request.id}`}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t('pro.accept')}
                  </Button>
                  <Button variant="outline" className="border-gray-200" size="icon" data-testid={`button-message-${request.id}`}>
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-gray-200 text-gray-500" 
                    size="icon" 
                    onClick={() => handleDecline(request.id)}
                    data-testid={`button-decline-${request.id}`}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
