import { useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Bell, Mail, MessageSquare, Calendar, FileText, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function ProNotifications() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState({
    emailMessages: true,
    emailAppointments: true,
    emailNewRequests: true,
    emailNewsletter: false,
    pushMessages: true,
    pushAppointments: true,
    pushNewRequests: true,
  });

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences({ ...preferences, [key]: !preferences[key] });
  };

  const handleSave = () => {
    toast({
      title: "Préférences enregistrées",
      description: "Vos préférences de notifications ont été mises à jour",
    });
  };

  return (
    <div className="min-h-screen pb-20 lg:pb-8 bg-white">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
          <Link href="/pro-profil">
            <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-gray-600" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au profil
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white border border-[#601B28] flex items-center justify-center">
              <Bell className="h-5 w-5 text-[#601B28]" />
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl text-[#601B28]">
              Notifications
            </h1>
          </div>
          <p className="text-gray-600 mt-2">
            Gérez vos préférences de notifications
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 lg:px-6 py-6 space-y-6">
        <Card className="border border-gray-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-[#601B28] flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Notifications par email
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-white space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <Label className="text-gray-700 font-medium">Messages</Label>
                  <p className="text-sm text-gray-500">Recevoir un email pour chaque nouveau message</p>
                </div>
              </div>
              <Switch
                checked={preferences.emailMessages}
                onCheckedChange={() => handleToggle('emailMessages')}
                data-testid="switch-email-messages"
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <Label className="text-gray-700 font-medium">Rendez-vous</Label>
                  <p className="text-sm text-gray-500">Rappels pour vos rendez-vous à venir</p>
                </div>
              </div>
              <Switch
                checked={preferences.emailAppointments}
                onCheckedChange={() => handleToggle('emailAppointments')}
                data-testid="switch-email-appointments"
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <Label className="text-gray-700 font-medium">Nouvelles demandes</Label>
                  <p className="text-sm text-gray-500">Être notifié des nouvelles demandes clients</p>
                </div>
              </div>
              <Switch
                checked={preferences.emailNewRequests}
                onCheckedChange={() => handleToggle('emailNewRequests')}
                data-testid="switch-email-requests"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-[#601B28] flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications push
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-white space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <Label className="text-gray-700 font-medium">Messages</Label>
                  <p className="text-sm text-gray-500">Notifications instantanées pour les messages</p>
                </div>
              </div>
              <Switch
                checked={preferences.pushMessages}
                onCheckedChange={() => handleToggle('pushMessages')}
                data-testid="switch-push-messages"
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <Label className="text-gray-700 font-medium">Rendez-vous</Label>
                  <p className="text-sm text-gray-500">Rappels de rendez-vous en temps réel</p>
                </div>
              </div>
              <Switch
                checked={preferences.pushAppointments}
                onCheckedChange={() => handleToggle('pushAppointments')}
                data-testid="switch-push-appointments"
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <Label className="text-gray-700 font-medium">Nouvelles demandes</Label>
                  <p className="text-sm text-gray-500">Alertes pour les nouvelles demandes</p>
                </div>
              </div>
              <Switch
                checked={preferences.pushNewRequests}
                onCheckedChange={() => handleToggle('pushNewRequests')}
                data-testid="switch-push-requests"
              />
            </div>
          </CardContent>
        </Card>

        <Button 
          className="w-full bg-[#601B28] hover:bg-[#4E1522] text-white"
          onClick={handleSave}
          data-testid="button-save-notifications"
        >
          <Save className="h-4 w-4 mr-2" />
          Enregistrer les préférences
        </Button>
      </div>
    </div>
  );
}
