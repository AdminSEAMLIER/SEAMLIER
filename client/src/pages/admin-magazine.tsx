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
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessCode, setAccessCode] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode === "seamlier2026") {
      setIsAuthenticated(true);
      toast({ title: "Accès Maître activé", description: "Bienvenue, Magda." });
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
            <CardTitle className="font-serif text-2xl uppercase tracking-widest text-[#722F37]">Empire SEAMLIER</CardTitle>
            <p className="text-sm text-gray-500 italic">Passage clandestin</p>
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
                Ouvrir la session
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/admin/seamlier", active: true },
    { label: "Projets", icon: ShoppingBag, href: "/pro-projets" },
    { label: "Messagerie", icon: BookOpen, href: "/pro-messagerie" },
    { label: "Planning", icon: Clock, href: "/pro-planning" },
    { label: "Artisans", icon: Users, href: "/recherche" },
  ];

  const stats = [
    { label: "Demandes en attente", val: "12", icon: Clock, color: "text-[#722F37]", bg: "bg-[#722F37]/5" },
    { label: "Projets en cours", val: "45", icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Revenu du mois", val: "8 450 €", icon: ShoppingBag, color: "text-green-600", bg: "bg-green-50" },
    { label: "Artisans vérifiés", val: "28", icon: ShieldCheck, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  const projects = [
    { id: "1", client: "Marie Lefebvre", artisan: "Atelier Couture Paris", status: "Bloqué", amount: "250 €", date: "12/02/2026" },
    { id: "2", client: "Jean Durand", artisan: "Magda Styliste", status: "Libéré", amount: "1 200 €", date: "10/02/2026" },
    { id: "3", client: "Sophie Martin", artisan: "La Main d'Or", status: "Bloqué", amount: "450 €", date: "08/02/2026" },
  ];

  const artisans = [
    { id: "1", name: "Marc Antoine", specialty: "Tailleur Homme", status: "Vérifié", joinDate: "15/01/2026" },
    { id: "2", name: "Hélène B.", specialty: "Robe de Mariée", status: "En attente", joinDate: "05/02/2026" },
    { id: "3", name: "Lucie V.", specialty: "Retouches Premium", status: "Vérifié", joinDate: "20/12/2025" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-8 border-b border-gray-50">
          <Link href="/">
            <h2 className="text-2xl font-serif font-black text-[#722F37] tracking-tighter cursor-pointer">SEAMLIER</h2>
          </Link>
          <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-1 font-bold">Administration</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => setLocation(item.href)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                item.active 
                  ? "bg-[#722F37] text-white shadow-lg shadow-[#722F37]/20" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-[#722F37]"
              )}
            >
              <item.icon size={18} className={cn("transition-colors", item.active ? "text-white" : "group-hover:text-[#722F37]")} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-50">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
            onClick={() => setIsAuthenticated(false)}
          >
            <LogOut size={18} className="mr-3"/> Déconnexion
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto space-y-8">
          <header className="flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-serif font-bold text-gray-900 tracking-tight">Tableau de Bord</h1>
              <p className="text-gray-500 mt-1">Supervision de l'écosystème Seamlier</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="rounded-xl border-gray-200" onClick={() => setLocation("/")}>Voir le site</Button>
              <Button className="bg-[#722F37] hover:bg-[#5a252c] rounded-xl shadow-lg shadow-[#722F37]/20">Exporter rapport</Button>
            </div>
          </header>

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

          <Tabs defaultValue="projects" className="space-y-6">
            <TabsList className="bg-white border border-gray-100 p-1 rounded-2xl w-fit">
              <TabsTrigger value="projects" className="rounded-xl data-[state=active]:bg-[#722F37] data-[state=active]:text-white px-6">Projets & Séquestre</TabsTrigger>
              <TabsTrigger value="artisans" className="rounded-xl data-[state=active]:bg-[#722F37] data-[state=active]:text-white px-6">Fit Passport (Artisans)</TabsTrigger>
              <TabsTrigger value="magazine" className="rounded-xl data-[state=active]:bg-[#722F37] data-[state=active]:text-white px-6">Magazine</TabsTrigger>
            </TabsList>

            <TabsContent value="projects">
              <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between border-b border-gray-50 pb-6">
                  <CardTitle className="text-lg font-serif">Flux Financiers & Projets</CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input placeholder="Rechercher..." className="pl-10 rounded-xl border-gray-100 w-64 h-9" />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wider text-gray-400 bg-gray-50/50">
                        <th className="px-6 py-4 font-bold">Client</th>
                        <th className="px-6 py-4 font-bold">Artisan</th>
                        <th className="px-6 py-4 font-bold">Date</th>
                        <th className="px-6 py-4 font-bold">Séquestre</th>
                        <th className="px-6 py-4 font-bold text-right">Montant</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {projects.map((project) => (
                        <tr key={project.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-gray-900">{project.client}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-600">{project.artisan}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs text-gray-500">{project.date}</p>
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={cn(
                              "text-[10px] px-2 py-0.5 border-none",
                              project.status === "Bloqué" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                            )}>
                              {project.status === "Bloqué" ? <Lock size={10} className="mr-1 inline" /> : <ShieldCheck size={10} className="mr-1 inline" />}
                              {project.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-[#722F37]">{project.amount}</td>
                          <td className="px-6 py-4 text-right">
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-[#722F37] opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical size={16} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="artisans">
              <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between border-b border-gray-50 pb-6">
                  <CardTitle className="text-lg font-serif">Fit Passport & Vérification</CardTitle>
                  <Button variant="outline" className="rounded-xl border-gray-200 h-9">Filtres avancés</Button>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wider text-gray-400 bg-gray-50/50">
                        <th className="px-6 py-4 font-bold">Artisan</th>
                        <th className="px-6 py-4 font-bold">Spécialité</th>
                        <th className="px-6 py-4 font-bold">Inscrit le</th>
                        <th className="px-6 py-4 font-bold">Statut Fit</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {artisans.map((artisan) => (
                        <tr key={artisan.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#722F37]/5 flex items-center justify-center text-[#722F37] font-bold text-xs">
                                {artisan.name[0]}
                              </div>
                              <p className="text-sm font-semibold text-gray-900">{artisan.name}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-600">{artisan.specialty}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs text-gray-500">{artisan.joinDate}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {artisan.status === "Vérifié" ? (
                                <ShieldCheck size={14} className="text-green-600" />
                              ) : (
                                <Clock size={14} className="text-amber-600" />
                              )}
                              <span className={cn("text-xs font-medium", artisan.status === "Vérifié" ? "text-green-600" : "text-amber-600")}>
                                {artisan.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            {artisan.status === "En attente" && (
                              <Button size="sm" className="bg-[#722F37] hover:bg-[#5a252c] rounded-lg h-8 text-xs">Approuver</Button>
                            )}
                            <Button variant="outline" size="sm" className="rounded-lg h-8 text-xs border-gray-200">Dossier</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="magazine">
              <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b border-gray-50 pb-6">
                  <CardTitle className="text-lg font-serif">Articles & Contenu</CardTitle>
                  <Button className="bg-[#722F37] hover:bg-[#5a252c] rounded-xl h-10 shadow-lg shadow-[#722F37]/20">
                    <PlusCircle size={18} className="mr-2" /> Nouvel Article
                  </Button>
                </CardHeader>
                <CardContent className="p-12 text-center bg-gray-50/30">
                  <div className="max-w-md mx-auto space-y-4">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto text-[#722F37]">
                      <BookOpen size={28} />
                    </div>
                    <h3 className="text-xl font-serif font-bold text-[#722F37]">Gestion du Magazine</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      Publiez de nouveaux articles, gérez les catégories et modifiez le contenu existant pour inspirer votre communauté.
                    </p>
                    <div className="pt-4 grid grid-cols-2 gap-3">
                      <Button variant="outline" className="rounded-xl border-gray-200">Voir les brouillons</Button>
                      <Button variant="outline" className="rounded-xl border-gray-200">Bibliothèque média</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
