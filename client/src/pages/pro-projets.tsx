import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FolderKanban, Clock, Euro, User, ChevronRight, Ruler, Calendar, MessageSquare, Phone, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";

interface Measurement {
  labelKey: string;
  value: string;
}

interface Project {
  id: string;
  titleKey: string;
  client: string;
  clientEmail: string;
  clientPhone: string;
  status: string;
  progress: number;
  amount: string;
  deadline: string;
  nextStepKey: string;
  measurements: Measurement[];
  notes: string;
}

export default function ProProjets() {
  const { t } = useTranslation();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const mockProjects: Project[] = [
    {
      id: "1",
      titleKey: "pro.weddingDress",
      client: "Claire Beaumont",
      clientEmail: "claire.beaumont@email.com",
      clientPhone: "06 12 34 56 78",
      status: "in_progress",
      progress: 65,
      amount: "2500€",
      deadline: "28/02/2026",
      nextStepKey: "pro.secondFitting",
      measurements: [
        { labelKey: "pro.measureBust", value: "88 cm" },
        { labelKey: "pro.measureWaist", value: "68 cm" },
        { labelKey: "pro.measureHips", value: "94 cm" },
        { labelKey: "pro.measureShoulder", value: "38 cm" },
        { labelKey: "pro.measureArmLength", value: "58 cm" },
        { labelKey: "pro.measureBackLength", value: "42 cm" },
        { labelKey: "pro.measureDressLength", value: "145 cm" },
      ],
      notes: "Robe style sirène, dentelle française, traîne 1.5m. Préfère les manches longues en dentelle.",
    },
    {
      id: "2",
      titleKey: "pro.suit3Piece",
      client: "Marc Lefebvre",
      clientEmail: "marc.lefebvre@email.com",
      clientPhone: "06 98 76 54 32",
      status: "in_progress",
      progress: 30,
      amount: "1200€",
      deadline: "15/03/2026",
      nextStepKey: "pro.measurements",
      measurements: [
        { labelKey: "pro.measureChest", value: "102 cm" },
        { labelKey: "pro.measureWaist", value: "88 cm" },
        { labelKey: "pro.measureHips", value: "100 cm" },
        { labelKey: "pro.measureShoulder", value: "46 cm" },
        { labelKey: "pro.measureArmLength", value: "64 cm" },
        { labelKey: "pro.measureInseam", value: "82 cm" },
        { labelKey: "pro.measureNeck", value: "40 cm" },
      ],
      notes: "Costume bleu marine, coupe slim. Gilet assorti. Pour mariage le 20 mars.",
    },
    {
      id: "3",
      titleKey: "pro.alterations",
      client: "Julie Moreau",
      clientEmail: "julie.moreau@email.com",
      clientPhone: "06 55 44 33 22",
      status: "pending_payment",
      progress: 100,
      amount: "180€",
      deadline: "pro.finished",
      nextStepKey: "pro.awaitingPaymentStatus",
      measurements: [
        { labelKey: "pro.measureWaist", value: "72 cm" },
        { labelKey: "pro.measureHips", value: "96 cm" },
        { labelKey: "pro.measureLength", value: "-4 cm" },
      ],
      notes: "Retouche pantalon et jupe. Raccourcir de 4cm.",
    },
    {
      id: "4",
      titleKey: "pro.customShirts",
      client: "Paul Duval",
      clientEmail: "paul.duval@email.com",
      clientPhone: "06 11 22 33 44",
      status: "completed",
      progress: 100,
      deadline: "02/01/2026",
      amount: "450€",
      nextStepKey: "pro.projectFinished",
      measurements: [
        { labelKey: "pro.measureChest", value: "98 cm" },
        { labelKey: "pro.measureNeck", value: "39 cm" },
        { labelKey: "pro.measureShoulder", value: "44 cm" },
        { labelKey: "pro.measureArmLength", value: "62 cm" },
      ],
      notes: "3 chemises sur mesure: blanc, bleu ciel, rose pâle. Coupe regular.",
    },
  ];

  const handleOpenProject = (project: Project) => {
    setSelectedProject(project);
    setIsDetailOpen(true);
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
                <p className="text-xl font-bold text-[#722F37]">2</p>
                <p className="text-xs text-gray-500">{t('pro.activeProjects')}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xl font-bold text-yellow-600">1</p>
                <p className="text-xs text-gray-500">{t('pro.awaitingPayment')}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xl font-bold text-green-600">1</p>
                <p className="text-xs text-gray-500">{t('pro.completedThisMonth')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {mockProjects.map((project) => (
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
                    <h3 className="font-semibold text-[#722F37]">{t(project.titleKey)} - {project.client.split(' ')[0]} {project.client.split(' ')[1]?.[0]}.</h3>
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
                  <span>{project.deadline.startsWith('pro.') ? t(project.deadline) : project.deadline}</span>
                </div>
              </div>

              <p className="text-sm text-gray-500 mt-3 pt-3 border-t border-gray-100">
                {t('pro.nextStep')}: <span className="text-gray-700">{t(project.nextStepKey)}</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-lg bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#722F37]">
              {selectedProject && t(selectedProject.titleKey)}
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
                  <p className="text-sm text-gray-500">
                    {selectedProject.deadline.startsWith('pro.') ? t(selectedProject.deadline) : selectedProject.deadline}
                  </p>
                </div>
              </div>

              <Tabs defaultValue="measurements" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-100">
                  <TabsTrigger value="measurements" className="data-[state=active]:bg-white" data-testid="tab-measurements">
                    <Ruler className="h-4 w-4 mr-1" />
                    {t('pro.measurements')}
                  </TabsTrigger>
                  <TabsTrigger value="info" className="data-[state=active]:bg-white" data-testid="tab-info">
                    <User className="h-4 w-4 mr-1" />
                    {t('pro.clientInfo')}
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="data-[state=active]:bg-white" data-testid="tab-notes">
                    <FolderKanban className="h-4 w-4 mr-1" />
                    {t('pro.notes')}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="measurements" className="mt-4">
                  <div className="grid grid-cols-2 gap-3">
                    {selectedProject.measurements.map((measure, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">{t(measure.labelKey)}</p>
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
