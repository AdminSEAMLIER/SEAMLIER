import { useTranslation } from "react-i18next";
import { FileText, Clock, MapPin, Euro, CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ProDemandes() {
  const { t } = useTranslation();

  const mockRequests = [
    {
      id: "1",
      clientName: "Marie Dupont",
      clientLocation: "Paris 16e",
      typeKey: "pro.eveningDress",
      descriptionKey: "pro.eveningDressDesc",
      budget: "800 - 1200€",
      deadline: "15/02/2026",
      status: "new",
      dateKey: "pro.hoursAgo",
      dateCount: 2,
    },
    {
      id: "2",
      clientName: "Sophie Martin",
      clientLocation: "Paris 8e",
      typeKey: "pro.suitAlterations",
      descriptionKey: "pro.suitAlterationsDesc",
      budget: "150 - 250€",
      deadline: "20/01/2026",
      status: "new",
      dateKey: "pro.hoursAgo",
      dateCount: 5,
    },
    {
      id: "3",
      clientName: "Jean Durand",
      clientLocation: "Neuilly",
      typeKey: "pro.customShirts",
      descriptionKey: "pro.customShirtsDesc",
      budget: "400 - 600€",
      deadline: "01/03/2026",
      status: "pending",
      dateKey: "pro.yesterday",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge className="bg-green-100 text-green-700 border-none">{t('pro.newRequest')}</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700 border-none">{t('pro.pending')}</Badge>;
      default:
        return null;
    }
  };

  const getDateText = (request: typeof mockRequests[0]) => {
    if (request.dateCount) {
      return t(request.dateKey, { count: request.dateCount });
    }
    return t(request.dateKey);
  };

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
              <Button variant="default" className="bg-[#722F37] hover:bg-[#5a252c]" size="sm">
                {t('pro.allRequests')} (3)
              </Button>
              <Button variant="outline" size="sm" className="border-gray-200 text-gray-600">
                {t('pro.newRequests')} (2)
              </Button>
              <Button variant="outline" size="sm" className="border-gray-200 text-gray-600">
                {t('pro.pendingRequests')} (1)
              </Button>
            </div>
          </CardContent>
        </Card>

        {mockRequests.map((request) => (
          <Card key={request.id} className="border border-gray-100 bg-white shadow-sm mb-4">
            <CardContent className="p-5 bg-white">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-[#722F37]">{t(request.typeKey)}</h3>
                    {getStatusBadge(request.status)}
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
                <span className="text-xs text-gray-400 flex-shrink-0">{getDateText(request)}</span>
              </div>

              <p className="text-gray-600 text-sm mb-4">{t(request.descriptionKey)}</p>

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
                <Button className="flex-1 bg-[#722F37] hover:bg-[#5a252c]" data-testid={`button-accept-${request.id}`}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {t('pro.accept')}
                </Button>
                <Button variant="outline" className="border-gray-200" size="icon" data-testid={`button-message-${request.id}`}>
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="border-gray-200 text-gray-500" size="icon" data-testid={`button-decline-${request.id}`}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
