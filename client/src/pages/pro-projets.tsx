import { useTranslation } from "react-i18next";
import { FolderKanban, Clock, Euro, User, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ProProjets() {
  const { t } = useTranslation();

  const mockProjects = [
    {
      id: "1",
      titleKey: "pro.weddingDress",
      client: "Claire Beaumont",
      status: "in_progress",
      progress: 65,
      amount: "2500€",
      deadline: "28/02/2026",
      nextStepKey: "pro.secondFitting",
    },
    {
      id: "2",
      titleKey: "pro.suit3Piece",
      client: "Marc Lefebvre",
      status: "in_progress",
      progress: 30,
      amount: "1200€",
      deadline: "15/03/2026",
      nextStepKey: "pro.measurements",
    },
    {
      id: "3",
      titleKey: "pro.alterations",
      client: "Julie Moreau",
      status: "pending_payment",
      progress: 100,
      amount: "180€",
      deadline: "pro.finished",
      nextStepKey: "pro.awaitingPaymentStatus",
    },
    {
      id: "4",
      titleKey: "pro.customShirts",
      client: "Paul Duval",
      status: "completed",
      progress: 100,
      deadline: "02/01/2026",
      amount: "450€",
      nextStepKey: "pro.projectFinished",
    },
  ];

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
          <Card key={project.id} className="border border-gray-100 bg-white shadow-sm mb-4 cursor-pointer hover:shadow-md transition-shadow">
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
    </div>
  );
}
