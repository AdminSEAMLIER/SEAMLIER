import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Lock, LayoutDashboard, BookOpen, Users, 
  ShoppingBag, Ruler, LogOut, PlusCircle,
  TrendingUp, FileText, CheckCircle2, Clock,
  MoreVertical, ShieldCheck, ShieldAlert,
  Search, Settings, MessageSquare, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode === "seamlier2026") {
      setIsAuthenticated(true);
      toast({ title: "Accès autorisé", description: "Bienvenue sur l'interface de gestion." });
    } else {
      toast({ title: "Erreur", description: "Code invalide.", variant: "destructive" });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#722F37] px-4">
        <Card className="w-full max-w-md shadow-2xl border-none">
          <CardHeader className="text-center space-y-1">
            <Lock className="mx-auto text-[#722F37] h-12 w-12 mb-4" />
            <CardTitle className="font-serif text-2xl uppercase tracking-widest text-[#722F37]">SEAMLIER</CardTitle>
            <p className="text-sm text-gray-500 italic font-medium">Administration</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4 pt-4">
              <Input 
                type="password" 
                placeholder="Code secret" 
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="text-center tracking-[0.5em] font-bold h-12 border-gray-200 focus:ring-[#722F37] focus:border-[#722F37]"
              />
              <Button type="submit" className="w-full bg-[#722F37] hover:bg-[#5a252c] h-12 transition-all duration-300">
                Connexion
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, id: "overview" },
    { label: "Projets", icon: ShoppingBag, id: "projects" },
    { label: "Messagerie Admin", icon: MessageSquare, id: "messaging" },
    { label: "Planning Global", icon: Calendar, id: "planning" },
    { label: "Mesures Admin", icon: Ruler, id: "measures" },
    { label: "Artisans", icon: Users, id: "artisans" },
    { label: "Magazine", icon: FileText, id: "magazine" },
  ];

  const stats = [
    { label: "Demandes en attente", val: "12", icon: Clock, color: "text-[#722F37]", bg: "bg-[#722F37]/5" },
    { label: "Projets en cours", val: "45", icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Revenu du mois", val: "8 450 €", icon: ShoppingBag, color: "text-green-600", bg: "bg-green-50" },
    { label: "Artisans vérifiés", val: "28", icon: ShieldCheck, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  const projectsData = [
    { id: "1", client: "Marie Lefebvre", artisan: "Atelier Couture Paris", status: "Bloqué", amount: "250 €", date: "12/02/2026" },
    { id: "2", client: "Jean Durand", artisan: "Magda Styliste", status: "Libéré", amount: "1 200 €", date: "10/02/2026" },
    { id: "3", client: "Sophie Martin", artisan: "La Main d'Or", status: "Bloqué", amount: "450 €", date: "08/02/2026" },
  ];

  const artisansData = [
    { id: "1", name: "Marc Antoine", specialty: "Tailleur Homme", status: "Vérifié", joinDate: "15/01/2026" },
    { id: "2", name: "Hélène B.", specialty: "Robe de Mariée", status: "En attente", joinDate: "05/02/2026" },
    { id: "3", name: "Lucie V.", specialty: "Retouches Premium", status: "Vérifié", joinDate: "20/12/2025" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden font-sans">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 z-50">
        <div className="p-8 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-serif font-black text-[#722F37] tracking-tighter">SEAMLIER</h2>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-1 font-bold">Panel Administration</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group text-left",
                activeTab === item.id 
                  ? "bg-[#722F37] text-white shadow-lg shadow-[#722F37]/20" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-[#722F37]"
              )}
            >
              <item.icon size={18} className={cn("transition-colors", activeTab === item.id ? "text-white" : "group-hover:text-[#722F37]")} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-50 space-y-2">
          <Button variant="ghost" className="w-full justify-start text-gray-500 hover:text-[#722F37] rounded-xl">
            <Settings size={18} className="mr-3"/> Paramètres
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
            onClick={() => setIsAuthenticated(false)}
          >
            <LogOut size={18} className="mr-3"/> Déconnexion
          </Button>
        </div>
      </aside>

      {/* Admin Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Admin Header */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 flex-shrink-0">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-[#722F37] border-[#722F37]/20 bg-[#722F37]/5 px-3 py-1">Mode Administrateur</Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200" />
            <span className="text-sm font-medium text-gray-700">Administrateur</span>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-8 bg-gray-50">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-serif font-bold text-gray-900 tracking-tight">
                  {navItems.find(i => i.id === activeTab)?.label || "Dashboard"}
                </h1>
                <p className="text-gray-500 mt-1 text-sm italic">Gestion centralisée SEAMLIER</p>
              </div>
              <div className="flex gap-3">
                <Button className="bg-[#722F37] hover:bg-[#5a252c] rounded-xl shadow-lg shadow-[#722F37]/20 font-bold px-6">
                  Action Rapide
                </Button>
              </div>
            </div>

            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {stats.map((stat) => (
                    <Card key={stat.label} className="border-none shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className={cn("p-2 rounded-lg", stat.bg)}>
                            <stat.icon size={20} className={stat.color} />
                          </div>
                          <Badge variant="outline" className="text-[10px] text-green-600 border-green-100 bg-green-50">+12%</Badge>
                        </div>
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                          <p className="text-3xl font-bold text-gray-900 mt-1">{stat.val}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Card className="border-none shadow-sm p-8 text-center bg-white">
                  <h3 className="font-serif text-xl text-[#722F37] mb-2">Bienvenue dans l'espace de gestion</h3>
                  <p className="text-gray-500">Sélectionnez une catégorie dans le menu de gauche pour commencer l'administration.</p>
                </Card>
              </div>
            )}

            {activeTab === "projects" && (
              <Card className="border-none shadow-sm overflow-hidden bg-white">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                  <CardTitle className="text-lg font-serif">Flux Financiers & Séquestre</CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input placeholder="Filtrer..." className="pl-10 rounded-xl border-gray-100 w-64 h-9 text-sm" />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wider text-gray-400 bg-gray-50/30">
                        <th className="px-8 py-4 font-bold">Client</th>
                        <th className="px-8 py-4 font-bold">Artisan</th>
                        <th className="px-8 py-4 font-bold">Date</th>
                        <th className="px-8 py-4 font-bold text-center">Séquestre</th>
                        <th className="px-8 py-4 font-bold text-right">Montant</th>
                        <th className="px-8 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {projectsData.map((project) => (
                        <tr key={project.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-8 py-4 text-sm font-semibold">{project.client}</td>
                          <td className="px-8 py-4 text-sm text-gray-600">{project.artisan}</td>
                          <td className="px-8 py-4 text-xs text-gray-500">{project.date}</td>
                          <td className="px-8 py-4 text-center">
                            <Badge className={cn(
                              "text-[10px] px-3 py-1 border-none font-bold uppercase",
                              project.status === "Bloqué" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                            )}>
                              {project.status}
                            </Badge>
                          </td>
                          <td className="px-8 py-4 text-right font-bold text-[#722F37]">{project.amount}</td>
                          <td className="px-8 py-4 text-right">
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-[#722F37]">
                              <MoreVertical size={16} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {activeTab === "messaging" && (
              <Card className="border-none shadow-sm bg-white p-12 text-center">
                <MessageSquare className="mx-auto text-[#722F37]/20 h-16 w-16 mb-4" />
                <h3 className="font-serif text-2xl text-[#722F37] mb-2">Messagerie Admin</h3>
                <p className="text-gray-500 max-w-md mx-auto">Interface de modération et de support client centralisée. En attente de messages.</p>
              </Card>
            )}

            {activeTab === "planning" && (
              <Card className="border-none shadow-sm bg-white p-12 text-center">
                <Calendar className="mx-auto text-[#722F37]/20 h-16 w-16 mb-4" />
                <h3 className="font-serif text-2xl text-[#722F37] mb-2">Planning Global</h3>
                <p className="text-gray-500 max-w-md mx-auto">Vue d'ensemble des rendez-vous et échéances sur toute la plateforme.</p>
              </Card>
            )}

            {activeTab === "measures" && (
              <Card className="border-none shadow-sm bg-white p-12 text-center">
                <Ruler className="mx-auto text-[#722F37]/20 h-16 w-16 mb-4" />
                <h3 className="font-serif text-2xl text-[#722F37] mb-2">Mesures & Fit Passport</h3>
                <p className="text-gray-500 max-w-md mx-auto">Gestion des profils de mesures clients et standards de l'industrie.</p>
              </Card>
            )}

            {activeTab === "artisans" && (
              <Card className="border-none shadow-sm overflow-hidden bg-white">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                  <CardTitle className="text-lg font-serif">Fit Passport (Artisans)</CardTitle>
                  <Button variant="outline" className="rounded-xl border-gray-100 text-xs">Filtres</Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wider text-gray-400 bg-gray-50/30">
                        <th className="px-8 py-4 font-bold">Artisan</th>
                        <th className="px-8 py-4 font-bold">Spécialité</th>
                        <th className="px-8 py-4 font-bold">Statut</th>
                        <th className="px-8 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {artisansData.map((artisan) => (
                        <tr key={artisan.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-8 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#722F37]/5 flex items-center justify-center text-[#722F37] font-bold text-xs uppercase">
                                {artisan.name[0]}
                              </div>
                              <span className="text-sm font-semibold">{artisan.name}</span>
                            </div>
                          </td>
                          <td className="px-8 py-4 text-sm text-gray-600">{artisan.specialty}</td>
                          <td className="px-8 py-4 text-xs font-bold uppercase tracking-tight">
                            {artisan.status === "Vérifié" ? (
                              <span className="text-green-600 flex items-center gap-1"><ShieldCheck size={14} /> Vérifié</span>
                            ) : (
                              <span className="text-amber-600 flex items-center gap-1"><Clock size={14} /> En attente</span>
                            )}
                          </td>
                          <td className="px-8 py-4 text-right">
                            <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg border-gray-100 hover:text-[#722F37]">Détails</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {activeTab === "magazine" && (
              <Card className="border-none shadow-sm overflow-hidden bg-white">
                <div className="p-16 text-center">
                  <div className="w-20 h-20 bg-[#722F37]/5 rounded-3xl flex items-center justify-center mx-auto text-[#722F37] mb-6">
                    <BookOpen size={40} />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-gray-900 mb-2">Contenu Editorial</h3>
                  <p className="text-gray-500 max-w-sm mx-auto mb-8 text-sm italic">
                    Gérez les articles du Magazine SEAMLIER.
                  </p>
                  <Button className="bg-[#722F37] hover:bg-[#5a252c] rounded-xl h-11 px-8 font-bold shadow-lg shadow-[#722F37]/20">
                    <PlusCircle size={20} className="mr-2" /> Créer un article
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
