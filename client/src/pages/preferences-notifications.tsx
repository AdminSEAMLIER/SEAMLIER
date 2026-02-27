import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Bell, Mail, MessageSquare, Calendar, ShoppingBag, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

export default function PreferencesNotifications() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    emailMessages: true,
    emailAppointments: true,
    emailPromotions: false,
    emailNewsletter: true,
    pushMessages: true,
    pushAppointments: true,
    pushPromotions: false,
    pushOrders: true,
  });

  const { data: savedPrefs, isLoading } = useQuery<Record<string, boolean>>({
    queryKey: ['/api/user/preferences'],
    enabled: !!user,
  });

  useEffect(() => {
    if (savedPrefs && typeof savedPrefs === 'object' && Object.keys(savedPrefs).length > 0) {
      setPreferences({
        emailMessages: savedPrefs.emailMessages ?? true,
        emailAppointments: savedPrefs.emailAppointments ?? true,
        emailPromotions: savedPrefs.emailPromotions ?? false,
        emailNewsletter: savedPrefs.emailNewsletter ?? true,
        pushMessages: savedPrefs.pushMessages ?? true,
        pushAppointments: savedPrefs.pushAppointments ?? true,
        pushPromotions: savedPrefs.pushPromotions ?? false,
        pushOrders: savedPrefs.pushOrders ?? true,
      });
    }
  }, [savedPrefs]);

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences({ ...preferences, [key]: !preferences[key] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/user/preferences', preferences);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/preferences'] });
      toast({
        title: "Préférences enregistrées",
        description: "Vos préférences de notifications ont été mises à jour",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder vos préférences",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate();
  };

  return (
    <div className="min-h-screen pb-20 lg:pb-8 bg-white">
      <div className="bg-muted/50 border-b border-border">
        <div className="max-w-2xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
          <Link href="/mon-profil">
            <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au profil
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white border border-[#722F37] flex items-center justify-center">
              <Bell className="h-5 w-5 text-[#722F37]" />
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl text-[#722F37]">
              Notifications
            </h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Gérez vos préférences de notifications
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 lg:px-6 py-6 space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#722F37]" />
          </div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-[#722F37] flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Notifications par email
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted/50 border border-border flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <Label className="text-foreground font-medium">Messages</Label>
                      <p className="text-sm text-muted-foreground">Recevoir un email pour chaque nouveau message</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.emailMessages}
                    onCheckedChange={() => handleToggle('emailMessages')}
                    data-testid="switch-email-messages"
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-t border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted/50 border border-border flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <Label className="text-foreground font-medium">Rendez-vous</Label>
                      <p className="text-sm text-muted-foreground">Rappels et confirmations de rendez-vous</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.emailAppointments}
                    onCheckedChange={() => handleToggle('emailAppointments')}
                    data-testid="switch-email-appointments"
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-t border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted/50 border border-border flex items-center justify-center">
                      <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <Label className="text-foreground font-medium">Promotions</Label>
                      <p className="text-sm text-muted-foreground">Offres spéciales et réductions</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.emailPromotions}
                    onCheckedChange={() => handleToggle('emailPromotions')}
                    data-testid="switch-email-promotions"
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-t border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted/50 border border-border flex items-center justify-center">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <Label className="text-foreground font-medium">Newsletter</Label>
                      <p className="text-sm text-muted-foreground">Actualités et tendances de la couture</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.emailNewsletter}
                    onCheckedChange={() => handleToggle('emailNewsletter')}
                    data-testid="switch-email-newsletter"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-[#722F37] flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications push
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted/50 border border-border flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <Label className="text-foreground font-medium">Messages</Label>
                      <p className="text-sm text-muted-foreground">Notification instantanée des nouveaux messages</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.pushMessages}
                    onCheckedChange={() => handleToggle('pushMessages')}
                    data-testid="switch-push-messages"
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-t border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted/50 border border-border flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <Label className="text-foreground font-medium">Rendez-vous</Label>
                      <p className="text-sm text-muted-foreground">Rappels avant vos rendez-vous</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.pushAppointments}
                    onCheckedChange={() => handleToggle('pushAppointments')}
                    data-testid="switch-push-appointments"
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-t border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted/50 border border-border flex items-center justify-center">
                      <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <Label className="text-foreground font-medium">Commandes</Label>
                      <p className="text-sm text-muted-foreground">Mises à jour sur vos commandes</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.pushOrders}
                    onCheckedChange={() => handleToggle('pushOrders')}
                    data-testid="switch-push-orders"
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-t border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted/50 border border-border flex items-center justify-center">
                      <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <Label className="text-foreground font-medium">Promotions</Label>
                      <p className="text-sm text-muted-foreground">Alertes sur les offres spéciales</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.pushPromotions}
                    onCheckedChange={() => handleToggle('pushPromotions')}
                    data-testid="switch-push-promotions"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Link href="/mon-profil" className="flex-1">
                <Button 
                  variant="outline" 
                  className="w-full"
                  data-testid="button-cancel"
                >
                  Annuler
                </Button>
              </Link>
              <Button 
                className="flex-1 bg-[#722F37] text-white"
                onClick={handleSave}
                disabled={saveMutation.isPending}
                data-testid="button-save-preferences"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Enregistrer
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
