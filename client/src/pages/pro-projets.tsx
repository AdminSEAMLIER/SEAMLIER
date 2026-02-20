import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FolderKanban, Clock, Euro, User, ChevronRight, Ruler, Calendar, MessageSquare, Phone, Mail, Camera, Image, Users, CheckCircle, Circle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ProjectWithClient } from "@shared/schema";

const FABRICATION_STEPS = [
  { key: "prise_mesures", label: "Prise de mesures", progress: 0 },
  { key: "choix_tissu", label: "Choix du tissu", progress: 15 },
  { key: "patronage", label: "Patronage", progress: 30 },
  { key: "coupe", label: "Coupe", progress: 45 },
  { key: "assemblage", label: "Assemblage", progress: 60 },
  { key: "essayage", label: "Essayage", progress: 75 },
  { key: "finitions", label: "Finitions", progress: 90 },
  { key: "livraison", label: "Prêt / Livraison", progress: 100 },
];

export default function ProProjets() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedProject, setSelectedProject] = useState<ProjectWithClient | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: projects = [], isLoading } = useQuery<ProjectWithClient[]>({
    queryKey: ["/api/projects"],
  });

  const stepMutation = useMutation({
    mutationFn: async ({ projectId, currentStep, progress, status }: { projectId: string; currentStep: string; progress: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/projects/${projectId}/step`, { currentStep, progress, status });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      if (selectedProject) {
        setSelectedProject({ ...selectedProject, currentStep: data.currentStep, progress: data.progress, status: data.status });
      }
      toast({ title: "Étape mise à jour", description: `Le client peut maintenant voir l'avancement.` });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de mettre à jour l'étape.", variant: "destructive" });
    },
  });

  const handleOpenProject = (project: ProjectWithClient) => {
    setSelectedProject(project);
    setIsDetailOpen(true);
  };

  const handleStepChange = (stepKey: string) => {
    if (!selectedProject) return;
    const step = FABRICATION_STEPS.find(s => s.key === stepKey);
    if (!step) return;
    const newStatus = step.progress === 100 ? "completed" : "in_progress";
    stepMutation.mutate({ 
      projectId: selectedProject.id, 
      currentStep: stepKey, 
      progress: step.progress,
      status: newStatus,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-700 border-none">{t('pro.inProgress')}</Badge>;
      case "pending_payment":
        return <Badge className="bg-yellow-100 text-yellow-700 border-none">{t('pro.pendingPayment')}</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-700 border-none">{t('pro.completed')}</Badge>;
      case "pending":
        return <Badge className="bg-gray-100 text-gray-700 border-none">En attente</Badge>;
      default:
        return null;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-green-500";
    if (progress >= 75) return "bg-blue-500";
    return "bg-[#722F37]";
  };

  const getCurrentStepLabel = (stepKey: string | null) => {
    const step = FABRICATION_STEPS.find(s => s.key === stepKey);
    return step?.label || "Prise de mesures";
  };

  const activeCount = projects.filter(p => p.status === 'in_progress').length;
  const pendingCount = projects.filter(p => p.status === 'pending').length;
  const completedCount = projects.filter(p => p.status === 'completed').length;

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
                <p className="text-xl font-bold text-yellow-600">{pendingCount}</p>
                <p className="text-xs text-gray-500">En attente</p>
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
              <Loader2 className="h-8 w-8 animate-spin text-[#722F37] mx-auto mb-2" />
              <p className="text-gray-500">{t('common.loading')}</p>
            </CardContent>
          </Card>
        ) : projects.length === 0 ? (
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
          projects.map((project) => (
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
                      <span>{project.client?.firstName} {project.client?.lastName}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{getCurrentStepLabel(project.currentStep)}</span>
                    <span className="font-medium">{project.progress || 0}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getProgressColor(project.progress || 0)} rounded-full transition-all`}
                      style={{ width: `${project.progress || 0}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm">
                  {project.amount && (
                    <div className="flex items-center gap-1 text-gray-600">
                      <Euro className="h-4 w-4 text-[#722F37]" />
                      <span>{project.amount}€</span>
                    </div>
                  )}
                  {project.deadline && (
                    <div className="flex items-center gap-1 text-gray-600">
                      <Clock className="h-4 w-4 text-[#722F37]" />
                      <span>{new Date(project.deadline).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                </div>
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
            <DialogDescription>
              Gérez l'avancement de ce projet
            </DialogDescription>
          </DialogHeader>
          
          {selectedProject && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{selectedProject.client?.firstName} {selectedProject.client?.lastName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(selectedProject.status)}
                  </div>
                </div>
                <div className="text-right">
                  {selectedProject.amount && <p className="text-lg font-bold text-[#722F37]">{selectedProject.amount}€</p>}
                  {selectedProject.deadline && <p className="text-sm text-gray-500">{new Date(selectedProject.deadline).toLocaleDateString('fr-FR')}</p>}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Étapes de confection</p>
                <div className="space-y-1">
                  {FABRICATION_STEPS.map((step, index) => {
                    const currentIndex = FABRICATION_STEPS.findIndex(s => s.key === (selectedProject.currentStep || "prise_mesures"));
                    const isCompleted = index < currentIndex;
                    const isCurrent = index === currentIndex;
                    const isFuture = index > currentIndex;

                    return (
                      <button
                        key={step.key}
                        onClick={() => handleStepChange(step.key)}
                        disabled={stepMutation.isPending}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                          isCurrent
                            ? "bg-[#722F37]/10 border border-[#722F37]/30"
                            : isCompleted
                            ? "bg-green-50 border border-green-200"
                            : "bg-gray-50 border border-transparent hover:border-gray-200"
                        }`}
                        data-testid={`step-${step.key}`}
                      >
                        <div className="flex-shrink-0">
                          {isCompleted ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : isCurrent ? (
                            <div className="h-5 w-5 rounded-full border-2 border-[#722F37] bg-[#722F37] flex items-center justify-center">
                              <div className="h-2 w-2 rounded-full bg-white" />
                            </div>
                          ) : (
                            <Circle className="h-5 w-5 text-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${
                            isCurrent ? "text-[#722F37]" : isCompleted ? "text-green-700" : "text-gray-400"
                          }`}>
                            {step.label}
                          </p>
                        </div>
                        <span className={`text-xs ${
                          isCurrent ? "text-[#722F37] font-bold" : isCompleted ? "text-green-600" : "text-gray-300"
                        }`}>
                          {step.progress}%
                        </span>
                      </button>
                    );
                  })}
                </div>
                {stepMutation.isPending && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Mise à jour...
                  </div>
                )}
              </div>

              {selectedProject.notes && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Notes</p>
                  <p className="text-gray-600 text-sm whitespace-pre-line">{selectedProject.notes}</p>
                </div>
              )}

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
