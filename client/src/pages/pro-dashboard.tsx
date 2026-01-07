import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  FileText, 
  FolderKanban, 
  MessageSquare, 
  Calendar,
  Euro,
  TrendingUp,
  Star,
  ArrowRight
} from "lucide-react";
import type { Product, ConversationWithParticipant } from "@shared/schema";

export default function ProDashboard() {
  const { t } = useTranslation();
  
  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: conversations } = useQuery<ConversationWithParticipant[]>({
    queryKey: ["/api/conversations"],
  });

  const stats = [
    { label: t('pro.thisMonth'), value: "4,250€", icon: Euro },
    { label: t('pro.activeProjects'), value: "3", icon: FolderKanban },
    { label: t('pro.newRequests'), value: "5", icon: FileText },
    { label: t('pro.averageRating'), value: "4.9", icon: Star },
  ];

  const quickLinks = [
    { label: t('nav.requests'), icon: FileText, href: "/professionnel/demandes", count: 5 },
    { label: t('nav.projects'), icon: FolderKanban, href: "/professionnel/projets", count: 3 },
    { label: t('nav.messaging'), icon: MessageSquare, href: "/professionnel/messagerie", count: 2 },
    { label: t('nav.planning'), icon: Calendar, href: "/professionnel/planning", count: 4 },
  ];

  return (
    <div className="min-h-screen pb-20 lg:pb-8 bg-white">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white border border-[#722F37] flex items-center justify-center">
              <Home className="h-5 w-5 text-[#722F37]" />
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl text-[#722F37]">
              {t('pro.welcome')}
            </h1>
          </div>
          <p className="text-gray-600 mt-2">
            {t('pro.manageActivity')}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 lg:px-6 py-6">
        <Card className="border border-gray-100 bg-white shadow-sm mb-6">
          <CardContent className="p-6 bg-white">
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="p-4 bg-gray-50 rounded-lg text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <stat.icon className="h-5 w-5 text-[#722F37]" />
                  </div>
                  <p className="text-2xl font-bold text-[#722F37]">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 bg-white shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-[#722F37]">{t('pro.quickActions')}</CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="grid grid-cols-2 gap-3">
              {quickLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" data-testid={`link-${link.label.toLowerCase()}`}>
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-white border border-[#722F37] flex items-center justify-center mb-2">
                        <link.icon className="h-5 w-5 text-[#722F37]" />
                      </div>
                      {link.count > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#722F37] text-white text-xs rounded-full flex items-center justify-center">
                          {link.count}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-600 text-center">{link.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 bg-white shadow-sm mb-6">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-lg text-[#722F37]">{t('pro.recentMessages')}</CardTitle>
            <Link href="/professionnel/messagerie">
              <Button variant="ghost" size="sm" className="text-[#722F37]">
                {t('landing.viewAll')}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="bg-white">
            {conversations && conversations.length > 0 ? (
              <div className="space-y-3">
                {conversations.slice(0, 3).map((conv) => (
                  <div key={conv.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <div className="w-10 h-10 rounded-full bg-[#722F37]/10 flex items-center justify-center">
                      <span className="text-[#722F37] font-medium">
                        {conv.participant?.fullName?.charAt(0) || "?"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {conv.participant?.fullName || "Client"}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {conv.lastMessage || "..."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">{t('pro.noMessages')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-gray-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-[#722F37]">{t('pro.revenue')}</CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-white border border-[#722F37] flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-[#722F37]" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">{t('pro.thisMonth')}</p>
                <p className="text-2xl font-bold text-[#722F37]">4,250€</p>
              </div>
              <span className="text-sm text-green-600 font-medium">+12%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
