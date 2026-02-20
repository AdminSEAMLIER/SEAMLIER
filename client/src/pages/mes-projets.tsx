import { useTranslation } from "react-i18next";
import { FolderKanban, Clock, Euro, CheckCircle, Circle, Loader2, ArrowLeft, Scissors } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { ProjectWithTailor } from "@shared/schema";

const FABRICATION_STEPS = [
  { key: "prise_mesures", label: "Prise de mesures", labelEn: "Measurements", progress: 0 },
  { key: "choix_tissu", label: "Choix du tissu", labelEn: "Fabric selection", progress: 15 },
  { key: "patronage", label: "Patronage", labelEn: "Pattern making", progress: 30 },
  { key: "coupe", label: "Coupe", labelEn: "Cutting", progress: 45 },
  { key: "assemblage", label: "Assemblage", labelEn: "Assembly", progress: 60 },
  { key: "essayage", label: "Essayage", labelEn: "Fitting", progress: 75 },
  { key: "finitions", label: "Finitions", labelEn: "Finishing", progress: 90 },
  { key: "livraison", label: "Prêt / Livraison", labelEn: "Ready / Delivery", progress: 100 },
];

export default function MesProjets() {
  const { t, i18n } = useTranslation();
  const isFr = i18n.language === "fr";

  const { data: projects = [], isLoading } = useQuery<ProjectWithTailor[]>({
    queryKey: ["/api/client/projects"],
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-700 border-none">{isFr ? "En cours" : "In progress"}</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-700 border-none">{isFr ? "Terminé" : "Completed"}</Badge>;
      case "pending":
        return <Badge className="bg-gray-100 text-gray-700 border-none">{isFr ? "En attente" : "Pending"}</Badge>;
      default:
        return null;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-green-500";
    if (progress >= 75) return "bg-blue-500";
    return "bg-[#722F37]";
  };

  const getStepLabel = (step: typeof FABRICATION_STEPS[0]) => {
    return isFr ? step.label : step.labelEn;
  };

  const getCurrentStepLabel = (stepKey: string | null) => {
    const step = FABRICATION_STEPS.find(s => s.key === stepKey);
    if (!step) return isFr ? "Prise de mesures" : "Measurements";
    return getStepLabel(step);
  };

  return (
    <div className="min-h-screen pb-20 lg:pb-8 bg-white">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
          <Link href="/dashboard-client">
            <Button variant="ghost" size="sm" className="mb-4 text-gray-500 -ml-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              {isFr ? "Retour" : "Back"}
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white border border-[#722F37] flex items-center justify-center">
              <FolderKanban className="h-5 w-5 text-[#722F37]" />
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl text-[#722F37]">
              {isFr ? "Mes projets" : "My projects"}
            </h1>
          </div>
          <p className="text-gray-600 mt-2">
            {isFr ? "Suivez l'avancement de vos créations sur mesure" : "Track the progress of your custom creations"}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 lg:px-6 py-6">
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
                <Scissors className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-serif text-xl text-[#722F37] mb-2">
                {isFr ? "Aucun projet en cours" : "No projects yet"}
              </h3>
              <p className="text-gray-500 mb-4">
                {isFr ? "Vos projets avec des artisans apparaîtront ici" : "Your projects with tailors will appear here"}
              </p>
              <Link href="/recherche">
                <Button className="bg-[#722F37] hover:bg-[#5a252c] text-white" data-testid="button-find-tailor">
                  {isFr ? "Trouver un artisan" : "Find a tailor"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          projects.map((project) => {
            const currentStepIndex = FABRICATION_STEPS.findIndex(s => s.key === (project.currentStep || "prise_mesures"));
            const tailorName = `${project.tailorUser?.firstName || ""} ${project.tailorUser?.lastName || ""}`.trim();

            return (
              <Card 
                key={project.id} 
                className="border border-gray-100 bg-white shadow-sm mb-6"
                data-testid={`card-client-project-${project.id}`}
              >
                <CardContent className="p-5 bg-white">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-[#722F37]">{project.title}</h3>
                        {getStatusBadge(project.status)}
                      </div>
                      {tailorName && (
                        <p className="text-sm text-gray-500">
                          {isFr ? "Artisan : " : "Tailor: "}{tailorName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 font-medium">{getCurrentStepLabel(project.currentStep)}</span>
                      <span className="font-bold text-[#722F37]">{project.progress || 0}%</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getProgressColor(project.progress || 0)} rounded-full transition-all duration-500`}
                        style={{ width: `${project.progress || 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-0">
                    {FABRICATION_STEPS.map((step, index) => {
                      const isCompleted = index < currentStepIndex;
                      const isCurrent = index === currentStepIndex;

                      return (
                        <div key={step.key} className="flex items-center gap-3 py-2">
                          <div className="flex-shrink-0 relative">
                            {isCompleted ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : isCurrent ? (
                              <div className="h-5 w-5 rounded-full border-2 border-[#722F37] bg-[#722F37] flex items-center justify-center">
                                <div className="h-2 w-2 rounded-full bg-white" />
                              </div>
                            ) : (
                              <Circle className="h-5 w-5 text-gray-200" />
                            )}
                            {index < FABRICATION_STEPS.length - 1 && (
                              <div className={`absolute left-[9px] top-[22px] w-[2px] h-4 ${
                                isCompleted ? "bg-green-300" : "bg-gray-100"
                              }`} />
                            )}
                          </div>
                          <span className={`text-sm ${
                            isCurrent ? "font-semibold text-[#722F37]" : isCompleted ? "text-green-700" : "text-gray-300"
                          }`}>
                            {getStepLabel(step)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm mt-4 pt-3 border-t border-gray-100">
                    {project.amount && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <Euro className="h-4 w-4 text-[#722F37]" />
                        <span>{project.amount}€</span>
                      </div>
                    )}
                    {project.deadline && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="h-4 w-4 text-[#722F37]" />
                        <span>{new Date(project.deadline).toLocaleDateString(isFr ? 'fr-FR' : 'en-US')}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
