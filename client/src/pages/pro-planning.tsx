import { useTranslation } from "react-i18next";
import { Calendar, MapPin, User, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export default function ProPlanning() {
  const { t, i18n } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const weekDaysKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const weekDaysFr = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const weekDaysEn = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekDays = i18n.language === 'fr' ? weekDaysFr : weekDaysEn;

  const mockAppointments = [
    {
      id: "1",
      client: "Claire Beaumont",
      typeKey: "pro.fitting",
      projectKey: "pro.weddingDress",
      time: "10:00",
      duration: "1h",
      locationKey: "pro.atWorkshop",
    },
    {
      id: "2",
      client: "Marc Lefebvre",
      typeKey: "pro.measurements",
      projectKey: "pro.suit3Piece",
      time: "14:00",
      duration: "45min",
      locationKey: "pro.atHome",
    },
    {
      id: "3",
      client: "Sophie Martin",
      typeKey: "pro.consultation",
      projectKey: "pro.newRequestLabel",
      time: "16:30",
      duration: "30min",
      locationKey: "pro.video",
    },
  ];

  const formatDate = (date: Date) => {
    const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
    return date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const getTypeColor = (typeKey: string) => {
    switch (typeKey) {
      case "pro.fitting":
        return "bg-blue-100 text-blue-700";
      case "pro.measurements":
        return "bg-green-100 text-green-700";
      case "pro.consultation":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen pb-20 lg:pb-8 bg-white">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white border border-[#722F37] flex items-center justify-center">
                <Calendar className="h-5 w-5 text-[#722F37]" />
              </div>
              <h1 className="font-serif text-3xl lg:text-4xl text-[#722F37]">
                {t('nav.planning')}
              </h1>
            </div>
            <Button className="bg-[#722F37] hover:bg-[#5a252c]" size="sm" data-testid="button-add-appointment">
              <Plus className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">{t('pro.addAppointment')}</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 lg:px-6 py-6">
        <Card className="border border-gray-100 bg-white shadow-sm mb-6">
          <CardContent className="p-4 bg-white">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" className="text-gray-600">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h3 className="font-medium text-[#722F37] capitalize text-sm">{formatDate(selectedDate)}</h3>
              <Button variant="ghost" size="icon" className="text-gray-600">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day, index) => {
                const date = new Date();
                date.setDate(date.getDate() - date.getDay() + 1 + index);
                const isToday = date.toDateString() === new Date().toDateString();
                const isSelected = date.toDateString() === selectedDate.toDateString();
                
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(date)}
                    className={`p-2 rounded-lg text-center transition-colors ${
                      isSelected 
                        ? 'bg-[#722F37] text-white' 
                        : isToday 
                          ? 'bg-[#722F37]/10 text-[#722F37]' 
                          : 'hover:bg-gray-100'
                    }`}
                  >
                    <p className="text-[10px] opacity-70">{day}</p>
                    <p className="text-sm font-medium">{date.getDate()}</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium text-gray-900">{t('pro.todaysAppointments')}</h3>
            <p className="text-sm text-gray-500">{mockAppointments.length} {t('pro.appointments')}</p>
          </div>
        </div>

        {mockAppointments.map((apt) => (
          <Card key={apt.id} className="border border-gray-100 bg-white shadow-sm mb-3">
            <CardContent className="p-4 bg-white">
              <div className="flex gap-4">
                <div className="text-center min-w-[50px]">
                  <p className="text-lg font-bold text-[#722F37]">{apt.time}</p>
                  <p className="text-xs text-gray-500">{apt.duration}</p>
                </div>

                <div className="flex-1 border-l border-gray-100 pl-4">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge className={`${getTypeColor(apt.typeKey)} border-none`}>
                      {t(apt.typeKey)}
                    </Badge>
                  </div>
                  <p className="font-medium text-gray-900 mb-1">{t(apt.projectKey)}</p>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {apt.client}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {t(apt.locationKey)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {mockAppointments.length === 0 && (
          <Card className="border border-gray-100 bg-white shadow-sm">
            <CardContent className="p-8 bg-white text-center">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{t('pro.noAppointments')}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
