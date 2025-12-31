import { useQuery } from "@tanstack/react-query";
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
  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: conversations } = useQuery<ConversationWithParticipant[]>({
    queryKey: ["/api/conversations"],
  });

  const stats = [
    { label: "Produits en ligne", value: products?.length || 0, icon: Package, color: "text-blue-500" },
    { label: "Messages", value: conversations?.length || 0, icon: MessageSquare, color: "text-green-500" },
    { label: "Note moyenne", value: "4.8", icon: Star, color: "text-yellow-500" },
    { label: "Vues ce mois", value: "1,234", icon: TrendingUp, color: "text-purple-500" },
  ];

  const quickActions = [
    { label: "Ajouter un produit", icon: Plus, href: "#" },
    { label: "Ajouter au portfolio", icon: Image, href: "#" },
    { label: "Voir mes clients", icon: Users, href: "#" },
    { label: "Paramètres", icon: Settings, href: "#" },
  ];

  return (
    <div className="min-h-screen pb-20 lg:pb-8">
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-4 lg:px-6 py-8 lg:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary">Pro</Badge>
          </div>
          <h1 className="font-serif text-3xl lg:text-4xl mb-2">
            Bienvenue sur votre espace
          </h1>
          <p className="text-muted-foreground">
            Gérez votre activité et développez votre clientèle
          </p>
        </div>
      </div>

      <div className="px-4 lg:px-6 py-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center gap-3">
                  <div className={`${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    className="h-auto py-4 flex flex-col gap-2"
                    data-testid={`button-${action.label.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    <action.icon className="h-5 w-5" />
                    <span className="text-sm">{action.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Messages récents</CardTitle>
            </CardHeader>
            <CardContent>
              {conversations && conversations.length > 0 ? (
                <div className="space-y-3">
                  {conversations.slice(0, 3).map((conv) => (
                    <div key={conv.id} className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                      <img
                        src={conv.otherParticipant.avatarUrl || ""}
                        alt={conv.otherParticipant.fullName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{conv.otherParticipant.fullName}</p>
                        <p className="text-sm text-muted-foreground truncate">{conv.lastMessagePreview}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Aucun message</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Mes produits</CardTitle>
          </CardHeader>
          <CardContent>
            {products && products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.slice(0, 4).map((product) => (
                  <div key={product.id} className="relative group">
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="w-full aspect-square object-cover rounded-md"
                    />
                    <div className="mt-2">
                      <p className="font-medium text-sm truncate">{product.title}</p>
                      <p className="text-sm text-muted-foreground">{product.price} €</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Aucun produit pour le moment</p>
                <Button data-testid="button-add-first-product">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter mon premier produit
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
