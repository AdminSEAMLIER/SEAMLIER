import { useTranslation } from "react-i18next";
import { Calendar, MapPin, User, Plus, ChevronLeft, ChevronRight, Clock, X, Trash2, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface Appointment {
  id: string;
  client: string;
  typeKey: string;
  projectKey: string;
  time: string;
  duration: string;
  locationKey: string;
  date: string;
}

export default function ProPlanning() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [newAppointment, setNewAppointment] = useState({
    client: "",
    project: "",
    type: "",
    time: "",
    duration: "",
    location: "",
  });

  const weekDaysKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const weekDaysFr = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const weekDaysEn = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekDays = i18n.language === 'fr' ? weekDaysFr : weekDaysEn;

  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: "1",
      client: "Claire Beaumont",
      typeKey: "pro.fitting",
      projectKey: "pro.weddingDress",
      time: "10:00",
      duration: "1h",
      locationKey: "pro.atWorkshop",
      date: new Date().toISOString().split('T')[0],
    },
    {
      id: "2",
      client: "Marc Lefebvre",
      typeKey: "pro.measurements",
      projectKey: "pro.suit3Piece",
      time: "14:00",
      duration: "45min",
      locationKey: "pro.atHome",
      date: new Date().toISOString().split('T')[0],
    },
    {
      id: "3",
      client: "Sophie Martin",
      typeKey: "pro.consultation",
      projectKey: "pro.newRequestLabel",
      time: "16:30",
      duration: "30min",
      locationKey: "pro.video",
      date: new Date().toISOString().split('T')[0],
    },
  ]);

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

  const appointmentTypes = [
    { value: "pro.fitting", label: t('pro.fitting') },
    { value: "pro.measurements", label: t('pro.measurements') },
    { value: "pro.consultation", label: t('pro.consultation') },
  ];

  const locations = [
    { value: "pro.atWorkshop", label: t('pro.atWorkshop') },
    { value: "pro.atHome", label: t('pro.atHome') },
    { value: "pro.video", label: t('pro.video') },
  ];

  const durations = [
    { value: "30min", label: "30 min" },
    { value: "45min", label: "45 min" },
    { value: "1h", label: "1h" },
    { value: "1h30", label: "1h30" },
    { value: "2h", label: "2h" },
  ];

  const handleAddAppointment = () => {
    if (!newAppointment.client || !newAppointment.type || !newAppointment.time) {
      return;
    }

    const appointment: Appointment = {
      id: Date.now().toString(),
      client: newAppointment.client,
      typeKey: newAppointment.type,
      projectKey: newAppointment.project || "pro.newRequestLabel",
      time: newAppointment.time,
      duration: newAppointment.duration || "1h",
      locationKey: newAppointment.location || "pro.atWorkshop",
      date: selectedDate.toISOString().split('T')[0],
    };

    setAppointments([...appointments, appointment]);
    setIsDialogOpen(false);
    setNewAppointment({
      client: "",
      project: "",
      type: "",
      time: "",
      duration: "",
      location: "",
    });

    toast({
      title: t('pro.appointmentAdded'),
      description: `${appointment.client} - ${appointment.time}`,
    });
  };

  const handleOpenDetail = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setIsDetailOpen(true);
  };

  const handleDeleteAppointment = (id: string) => {
    setAppointments(appointments.filter(apt => apt.id !== id));
    setIsDetailOpen(false);
    setSelectedAppointment(null);
    toast({
      title: t('pro.appointmentDeleted'),
      description: t('pro.appointmentDeletedDesc'),
    });
  };

  const filteredAppointments = appointments.filter(
    apt => apt.date === selectedDate.toISOString().split('T')[0]
  ).sort((a, b) => a.time.localeCompare(b.time));

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
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
            <Button 
              className="bg-[#722F37] hover:bg-[#5a252c] text-white" 
              size="sm" 
              data-testid="button-add-appointment"
              onClick={() => setIsDialogOpen(true)}
            >
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
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-600"
                onClick={goToPreviousDay}
                data-testid="button-previous-day"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h3 className="font-medium text-[#722F37] capitalize text-sm">{formatDate(selectedDate)}</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-600"
                onClick={goToNextDay}
                data-testid="button-next-day"
              >
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
                          : 'hover:bg-gray-100 text-gray-700'
                    }`}
                    data-testid={`button-day-${index}`}
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
            <p className="text-sm text-gray-500">{filteredAppointments.length} {t('pro.appointments')}</p>
          </div>
        </div>

        {filteredAppointments.map((apt) => (
          <Card 
            key={apt.id} 
            className="border border-gray-100 bg-white shadow-sm mb-3 cursor-pointer hover:border-[#722F37]/30 transition-colors" 
            data-testid={`card-appointment-${apt.id}`}
            onClick={() => handleOpenDetail(apt)}
          >
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
                  <p className="font-medium text-gray-900 mb-1">{apt.projectKey.startsWith('pro.') ? t(apt.projectKey) : apt.projectKey}</p>
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

        {filteredAppointments.length === 0 && (
          <Card className="border border-gray-100 bg-white shadow-sm">
            <CardContent className="p-8 bg-white text-center">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{t('pro.noAppointments')}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#722F37]">{t('pro.newAppointment')}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="client" className="text-gray-500">{t('pro.clientName')}</Label>
              <Input
                id="client"
                value={newAppointment.client}
                onChange={(e) => setNewAppointment({ ...newAppointment, client: e.target.value })}
                placeholder="Ex: Marie Dupont"
                className="bg-white text-gray-700"
                data-testid="input-client-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project" className="text-gray-500">{t('pro.projectType')}</Label>
              <Input
                id="project"
                value={newAppointment.project}
                onChange={(e) => setNewAppointment({ ...newAppointment, project: e.target.value })}
                placeholder="Ex: Robe de mariée"
                className="bg-white text-gray-700"
                data-testid="input-project-type"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-500">{t('pro.appointmentType')}</Label>
              <Select
                value={newAppointment.type}
                onValueChange={(value) => setNewAppointment({ ...newAppointment, type: value })}
              >
                <SelectTrigger className="bg-white text-gray-700" data-testid="select-appointment-type">
                  <SelectValue placeholder={t('pro.selectType')} />
                </SelectTrigger>
                <SelectContent className="bg-white text-gray-700">
                  {appointmentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="text-gray-700">
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="time" className="text-gray-500">{t('pro.time')}</Label>
                <Input
                  id="time"
                  type="time"
                  value={newAppointment.time}
                  onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                  className="bg-white text-gray-700"
                  data-testid="input-time"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-500">{t('pro.duration')}</Label>
                <Select
                  value={newAppointment.duration}
                  onValueChange={(value) => setNewAppointment({ ...newAppointment, duration: value })}
                >
                  <SelectTrigger className="bg-white text-gray-700" data-testid="select-duration">
                    <SelectValue placeholder={t('pro.selectDuration')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-gray-700">
                    {durations.map((d) => (
                      <SelectItem key={d.value} value={d.value} className="text-gray-700">
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-500">{t('pro.location')}</Label>
              <Select
                value={newAppointment.location}
                onValueChange={(value) => setNewAppointment({ ...newAppointment, location: value })}
              >
                <SelectTrigger className="bg-white text-gray-700" data-testid="select-location">
                  <SelectValue placeholder={t('pro.selectLocation')} />
                </SelectTrigger>
                <SelectContent className="bg-white text-gray-700">
                  {locations.map((loc) => (
                    <SelectItem key={loc.value} value={loc.value} className="text-gray-700">
                      {loc.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              data-testid="button-cancel-appointment"
            >
              {t('pro.cancel')}
            </Button>
            <Button 
              className="bg-[#722F37] hover:bg-[#5a252c] text-white"
              onClick={handleAddAppointment}
              disabled={!newAppointment.client || !newAppointment.type || !newAppointment.time}
              data-testid="button-save-appointment"
            >
              {t('pro.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#722F37]">{t('pro.appointmentDetails')}</DialogTitle>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="text-center min-w-[60px]">
                  <p className="text-2xl font-bold text-[#722F37]">{selectedAppointment.time}</p>
                  <p className="text-xs text-gray-500">{selectedAppointment.duration}</p>
                </div>
                <div className="flex-1 border-l border-gray-200 pl-4">
                  <Badge className={`${getTypeColor(selectedAppointment.typeKey)} border-none mb-2`}>
                    {t(selectedAppointment.typeKey)}
                  </Badge>
                  <p className="font-medium text-gray-900">
                    {selectedAppointment.projectKey.startsWith('pro.') ? t(selectedAppointment.projectKey) : selectedAppointment.projectKey}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-700">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">{t('pro.clientName')}</p>
                    <p className="font-medium">{selectedAppointment.client}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">{t('pro.location')}</p>
                    <p className="font-medium">{t(selectedAppointment.locationKey)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">{t('pro.duration')}</p>
                    <p className="font-medium">{selectedAppointment.duration}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">{t('pro.date')}</p>
                    <p className="font-medium">{new Date(selectedAppointment.date).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <Link href="/professionnel/messagerie" className="flex-1">
              <Button 
                variant="outline" 
                className="w-full gap-2 text-gray-500"
                data-testid="button-message-client"
              >
                <MessageSquare className="h-4 w-4" />
                {t('pro.messageClient')}
              </Button>
            </Link>
            <Button 
              variant="outline"
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => selectedAppointment && handleDeleteAppointment(selectedAppointment.id)}
              data-testid="button-delete-appointment"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('pro.deleteAppointment')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
