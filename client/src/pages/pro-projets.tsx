import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FolderKanban, Clock, Euro, User, ChevronRight, Ruler, Calendar, MessageSquare, Phone, Mail, Camera, Image, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface Measurement {
  label: string;
  value: string;
}

interface Project {
  id: string;
  title: string;
  client: string;
  clientEmail: string;
  clientPhone: string;
  status: string;
  progress: number;
  amount: string;
  deadline: string;
  nextStep: string;
  measurements: Measurement[];
  notes: string;
  modelPhoto?: string;
}

export default function ProProjets() {
  const { t } = useTranslation();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [localProjects, setLocalProjects] = useState<Project[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch real projects from API (empty for now)
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/pro/projects"],
    enabled: false, // Disabled until API is implemented
  });

  const allProjects = localProjects.length > 0 ? localProjects : projects;

  const handleOpenProject = (project: Project) => {
    setSelectedProject(project);
    setIsDetailOpen(true);
  };

  const handleAddPhoto = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && selectedProject) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const photoUrl = reader.result as string;
        const updatedProject = { ...selectedProject, modelPhoto: photoUrl };
        setSelectedProject(updatedProject);
        setLocalProjects(prev => 
          prev.map(p => p.id === selectedProject.id ? updatedProject : p)
        );
      };
      reader.readAsDataURL(file);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-700 border-none">{t('pro.inProgress')}</Badge>;
      case "pending_payment":
        return <Badge className="bg-yellow-100 text-yellow-700 border-none">{t('pro.pendingPayment')}</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-700 border-none">{t('pro.completed')}</Badge>;
      default:
        return null;
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "pending_payment":
        return "bg-yellow-500";
      default:
        return "bg-[#722F37]";
    }
  };

  const activeCount = allProjects.filter(p => p.status === 'in_progress').length;
  const pendingPaymentCount = allProjects.filter(p => p.status === 'pending_payment').length;
  const completedCount = allProjects.filter(p => p.status === 'completed').length;

  return (
    <div className="min-h-screen pb-20 lg:pb-8 bg-white">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white border border-[#722F37] flex items-center justify-center">
              <FolderKanban className="h-5 w-5 text-[#722F37]" />
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl text-[#722F37]">
              {t('nav.projects')}
            </h1>
          </div>
          <p className="text-gray-600 mt-2">
            {t('pro.projectsSubtitle')}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 lg:px-6 py-6">
        <Card className="border border-gray-100 bg-white shadow-sm mb-6">
          <CardContent className="p-4 bg-white">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xl font-bold text-[#722F37]">{activeCount}</p>
                <p className="text-xs text-gray-500">{t('pro.activeProjects')}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xl font-bold text-yellow-600">{pendingPaymentCount}</p>
                <p className="text-xs text-gray-500">{t('pro.awaitingPayment')}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xl font-bold text-green-600">{completedCount}</p>
                <p className="text-xs text-gray-500">{t('pro.completedThisMonth')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card className="border border-gray-100 bg-white shadow-sm">
            <CardContent className="p-8 bg-white text-center">
              <p className="text-gray-500">{t('common.loading')}</p>
            </CardContent>
          </Card>
        ) : allProjects.length === 0 ? (
          <Card className="border border-gray-100 bg-white shadow-sm">
            <CardContent className="p-12 bg-white text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-serif text-xl text-[#722F37] mb-2">
                {t('pro.noProjectsTitle')}
              </h3>
              <p className="text-gray-500 mb-2">{t('pro.noProjectsDesc')}</p>
              <p className="text-gray-400 text-sm">{t('pro.noProjectsHint')}</p>
            </CardContent>
          </Card>
        ) : (
          allProjects.map((project) => (
            <Card 
              key={project.id} 
              className="border border-gray-100 bg-white shadow-sm mb-4 cursor-pointer hover:border-[#722F37]/30 transition-colors"
              onClick={() => handleOpenProject(project)}
              data-testid={`card-project-${project.id}`}
            >
              <CardContent className="p-5 bg-white">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-[#722F37]">{project.title}</h3>
                      {getStatusBadge(project.status)}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <User className="h-3 w-3" />
                      <span>{project.client}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{t('pro.progress')}</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getProgressColor(project.status)} rounded-full transition-all`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Euro className="h-4 w-4 text-[#722F37]" />
                    <span>{project.amount}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Clock className="h-4 w-4 text-[#722F37]" />
                    <span>{project.deadline}</span>
                  </div>
                </div>

                <p className="text-sm text-gray-500 mt-3 pt-3 border-t border-gray-100">
                  {t('pro.nextStep')}: <span className="text-gray-700">{project.nextStep}</span>
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-lg bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#722F37]">
              {selectedProject?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedProject && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{selectedProject.client}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(selectedProject.status)}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[#722F37]">{selectedProject.amount}</p>
                  <p className="text-sm text-gray-500">{selectedProject.deadline}</p>
                </div>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoChange}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                data-testid="input-model-photo"
              />

              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">{t('pro.modelPhoto')}</p>
                {selectedProject.modelPhoto ? (
                  <div className="relative">
                    <img 
                      src={selectedProject.modelPhoto} 
                      alt="Model" 
                      className="w-full h-48 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={handleAddPhoto}
                      className="absolute bottom-2 right-2 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-50"
                      data-testid="button-change-model-photo"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleAddPhoto}
                    className="w-full h-32 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-[#722F37]/50 hover:text-[#722F37] transition-colors"
                    data-testid="button-add-model-photo"
                  >
                    <Image className="h-8 w-8 mb-2" />
                    <span className="text-sm">{t('pro.addModelPhoto')}</span>
                  </button>
                )}
              </div>

              <Tabs defaultValue="measurements" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-100 rounded-lg p-1">
                  <TabsTrigger 
                    value="measurements" 
                    className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm text-gray-600 data-[state=active]:text-gray-900" 
                    data-testid="tab-measurements"
                  >
                    <Ruler className="h-4 w-4 mr-1" />
                    {t('pro.measurements')}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="info" 
                    className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm text-gray-600 data-[state=active]:text-gray-900" 
                    data-testid="tab-info"
                  >
                    <User className="h-4 w-4 mr-1" />
                    {t('pro.clientInfo')}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="notes" 
                    className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm text-gray-600 data-[state=active]:text-gray-900" 
                    data-testid="tab-notes"
                  >
                    <FolderKanban className="h-4 w-4 mr-1" />
                    {t('pro.notes')}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="measurements" className="mt-4">
                  <div className="grid grid-cols-2 gap-3">
                    {selectedProject.measurements.map((measure, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">{measure.label}</p>
                        <p className="font-medium text-gray-900">{measure.value}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="info" className="mt-4 space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">{t('pro.clientName')}</p>
                      <p className="font-medium text-gray-900">{selectedProject.client}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">{t('auth.email')}</p>
                      <p className="font-medium text-gray-900">{selectedProject.clientEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">{t('auth.phone')}</p>
                      <p className="font-medium text-gray-900">{selectedProject.clientPhone}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="mt-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-line">{selectedProject.notes}</p>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-100">
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
                <Link href="/professionnel/planning" className="flex-1">
                  <Button 
                    className="w-full gap-2 bg-[#722F37] hover:bg-[#5a252c] text-white"
                    data-testid="button-schedule-appointment"
                  >
                    <Calendar className="h-4 w-4" />
                    {t('pro.scheduleAppointment')}
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
