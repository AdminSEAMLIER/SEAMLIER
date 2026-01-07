import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  MessageSquare, 
  Star, 
  TrendingUp, 
  Plus,
  Image,
  Settings,
  Users
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
    { label: t('pro.productsOnline'), value: products?.length || 0, icon: Package, color: "text-blue-500" },
    { label: t('pro.messages'), value: conversations?.length || 0, icon: MessageSquare, color: "text-green-500" },
    { label: t('pro.averageRating'), value: "4.8", icon: Star, color: "text-yellow-500" },
    { label: t('pro.viewsThisMonth'), value: "1,234", icon: TrendingUp, color: "text-purple-500" },
  ];

  const quickActions = [
    { label: t('pro.addProduct'), icon: Plus, href: "#" },
    { label: t('pro.addToPortfolio'), icon: Image, href: "#" },
    { label: t('pro.viewClients'), icon: Users, href: "#" },
    { label: t('pro.settings'), icon: Settings, href: "#" },
  ];

  return (
    <div className="min-h-screen pb-20 lg:pb-8 bg-white">
      <div className="bg-gray-50 border-b border-gray-100 px-4 lg:px-6 py-8 lg:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="bg-[#722F37]/10 text-[#722F37] border-none">Pro</Badge>
          </div>
          <h1 className="font-serif text-3xl lg:text-4xl mb-2 text-[#722F37]">
            {t('pro.welcome')}
          </h1>
          <p className="text-gray-600">
            {t('pro.manageActivity')}
          </p>
        </div>
      </div>

      <div className="px-4 lg:px-6 py-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} className="border border-gray-100 bg-white shadow-sm">
              <CardContent className="p-4 lg:p-6 bg-white">
                <div className="flex items-center gap-3">
                  <div className={`${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-[#722F37]">{stat.value}</p>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border border-gray-100 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-[#722F37]">{t('pro.quickActions')}</CardTitle>
            </CardHeader>
            <CardContent className="bg-white">
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    className="h-auto py-4 flex flex-col gap-2 border-gray-200 text-gray-700"
                    data-testid={`button-${action.label.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    <action.icon className="h-5 w-5 text-[#722F37]" />
                    <span className="text-sm">{action.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-100 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-[#722F37]">{t('pro.recentMessages')}</CardTitle>
            </CardHeader>
            <CardContent className="bg-white">
              {conversations && conversations.length > 0 ? (
                <div className="space-y-3">
                  {conversations.slice(0, 3).map((conv) => (
                    <div key={conv.id} className="flex items-center gap-3 p-3 rounded-md bg-gray-50">
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
                <p className="text-gray-500 text-center py-8">
                  {t('pro.noMessages')}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border border-gray-100 bg-white shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg text-[#722F37]">{t('pro.recentProducts')}</CardTitle>
            </CardHeader>
            <CardContent className="bg-white">
              {products && products.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {products.slice(0, 4).map((product) => (
                    <div key={product.id} className="group cursor-pointer">
                      <div className="aspect-square rounded-md overflow-hidden bg-gray-100 mb-2">
                        <img
                          src={product.images?.[0] || "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=300&h=300&fit=crop"}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <p className="font-medium text-gray-900 truncate">{product.name}</p>
                      <p className="text-[#722F37] font-semibold">{product.price}€</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">{t('pro.noProducts')}</p>
                  <p className="text-sm text-gray-400">{t('pro.addFirstProduct')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
