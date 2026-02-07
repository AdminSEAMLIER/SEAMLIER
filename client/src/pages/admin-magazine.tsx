import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Lock, LayoutDashboard, BookOpen, Users, 
  ShoppingBag, Ruler, LogOut, PlusCircle 
} from "lucide-react";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
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
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <Lock className="mx-auto text-[#722F37] h-12 w-12 mb-4" />
            <CardTitle className="font-serif text-2xl uppercase tracking-tighter">Empire SEAMLIER</CardTitle>
            <p className="text-sm text-gray-500 italic text-[#722F37]">Passage clandestin</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input 
                type="password" 
                placeholder="Code secret" 
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="text-center tracking-[0.5em] font-bold"
              />
              <Button type="submit" className="w-full bg-[#722F37] hover:bg-[#5a252c]">Ouvrir la session</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar - Menu latéral */}
      <div className="w-64 bg-white border-r border-gray-200 p-6 hidden md:flex flex-col">
        <h2 className="text-xl font-serif font-bold text-[#722F37] mb-8 pb-4 border-b">EMPIRE</h2>
        <nav className="space-y-2 flex-1">
          <button className="w-full flex items-center gap-3 px-3 py-2 bg-[#722F37]/5 text-[#722F37] rounded-lg font-medium">
            <LayoutDashboard size={18}/> Dashboard
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
            <Users size={18}/> Utilisateurs
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
            <ShoppingBag size={18}/> Commandes
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
            <BookOpen size={18}/> Magazine
          </button>
        </nav>
        <Button variant="ghost" className="text-red-500 justify-start px-3" onClick={() => setIsAuthenticated(false)}>
          <LogOut size={18} className="mr-3"/> Déconnexion
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-serif font-bold text-gray-900">Tableau de Bord</h1>
            <p className="text-gray-500">Supervision globale de SEAMLIER</p>
          </div>
          <Button onClick={() => setLocation("/")} variant="outline">Quitter le Dashboard</Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="bg-white border p-1 rounded-xl">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="magazine">Gestion Magazine</TabsTrigger>
            <TabsTrigger value="data">Données Clients</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: "Ventes totales", val: "0 €", color: "text-green-600" },
                { label: "Nouveaux inscrits", val: "14", color: "text-blue-600" },
                { label: "Projets actifs", val: "3", color: "text-[#722F37]" },
                { label: "Articles publiés", val: "3", color: "text-gray-900" }
              ].map((stat, i) => (
                <Card key={i}><CardContent className="pt-6">
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <p className={`text-2xl font-bold mt-2 ${stat.color}`}>{stat.val}</p>
                </CardContent></Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="magazine">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Articles du Magazine</CardTitle>
                <Button className="bg-[#722F37] gap-2">
                  <PlusCircle size={16} /> Nouvel Article
                </Button>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-400 border-2 border-dashed rounded-xl">
                  La liste de tes articles s'affichera ici. 
                  Tu pourras les modifier ou les supprimer en un clic.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data">
             <Card><CardContent className="p-12 text-center text-gray-400">
               Accès sécurisé à la base de données clients et mesures...
             </CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}