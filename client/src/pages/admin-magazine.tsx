import { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Lock, LayoutDashboard, Users, Mail,
  ShoppingBag, Ruler, LogOut, PlusCircle,
  TrendingUp, Clock, ShieldCheck,
  ShieldAlert, Search, Settings, MessageSquare,
  Calendar, FileText, Send, Eye, Trash2,
  CheckCircle, XCircle, ChevronRight,
  ArrowUpRight, X, Upload, MapPin, Pencil,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const ADMIN_AUTH_KEY = "seamlier_admin_auth";
const ADMIN_EMAIL = "admin@seamlier.fr";
const ADMIN_PASSWORD = "seamlier2026";

type Project = {
  id: string;
  client: string;
  artisan: string;
  status: "Bloqué" | "Libéré";
  amount: string;
  date: string;
  description: string;
};

type Artisan = {
  id: string;
  name: string;
  specialty: string;
  status: "Vérifié" | "En attente" | "Rejeté";
  joinDate: string;
  email: string;
  city: string;
};

type ReplyMessage = {
  id: string;
  text: string;
  date: string;
  sender: "admin";
};

type Message = {
  id: string;
  from: string;
  subject: string;
  preview: string;
  date: string;
  read: boolean;
  type: "support" | "signalement" | "info";
  replies: ReplyMessage[];
};

type PlanningEvent = {
  id: string;
  title: string;
  client: string;
  artisan: string;
  date: string;
  time: string;
  status: "Confirmé" | "En attente" | "Annulé";
};

type MeasureDetail = {
  label: string;
  value: string;
};

type MeasureProfile = {
  id: string;
  client: string;
  lastUpdate: string;
  status: "Complet" | "Incomplet" | "En attente";
  measurements: number;
  details: MeasureDetail[];
};

type CouturierData = {
  id: string;
  name: string;
  location: string;
  specialty: string;
  status: "Vérifié" | "En attente" | "Non vérifié";
  selected: boolean;
};

type Article = {
  id: string;
  title: string;
  category: string;
  status: "Publié" | "Brouillon";
  date: string;
  views: number;
};

export default function AdminDashboard() {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return localStorage.getItem(ADMIN_AUTH_KEY) === "true";
    } catch { return false; }
  });
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [projectSearch, setProjectSearch] = useState("");
  const [artisanSearch, setArtisanSearch] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [selectedMeasure, setSelectedMeasure] = useState<MeasureProfile | null>(null);
  const [showNewArticle, setShowNewArticle] = useState(false);
  const [newArticleTitle, setNewArticleTitle] = useState("");
  const [newArticleCategory, setNewArticleCategory] = useState("");
  const [newArticleContent, setNewArticleContent] = useState("");
  const [selectedCouturier, setSelectedCouturier] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(ADMIN_AUTH_KEY, isAuthenticated ? "true" : "false");
    } catch {}
  }, [isAuthenticated]);

  const [projects, setProjects] = useState<Project[]>([
    { id: "1", client: "Marie Lefebvre", artisan: "Atelier Couture Paris", status: "Bloqué", amount: "250 €", date: "12/02/2026", description: "Retouche robe de soirée" },
    { id: "2", client: "Jean Durand", artisan: "Magda Styliste", status: "Libéré", amount: "1 200 €", date: "10/02/2026", description: "Costume sur mesure" },
    { id: "3", client: "Sophie Martin", artisan: "La Main d'Or", status: "Bloqué", amount: "450 €", date: "08/02/2026", description: "Robe de mariée - ajustements" },
    { id: "4", client: "Lucas Bernard", artisan: "Fils & Aiguilles", status: "Bloqué", amount: "180 €", date: "06/02/2026", description: "Ourlet pantalon x3" },
    { id: "5", client: "Claire Petit", artisan: "Atelier Couture Paris", status: "Libéré", amount: "3 500 €", date: "01/02/2026", description: "Collection capsule 5 pièces" },
  ]);

  const [artisans, setArtisans] = useState<Artisan[]>([
    { id: "1", name: "Marc Antoine", specialty: "Tailleur Homme", status: "Vérifié", joinDate: "15/01/2026", email: "marc@atelier.fr", city: "Paris" },
    { id: "2", name: "Hélène B.", specialty: "Robe de Mariée", status: "En attente", joinDate: "05/02/2026", email: "helene@couture.fr", city: "Lyon" },
    { id: "3", name: "Lucie V.", specialty: "Retouches Premium", status: "Vérifié", joinDate: "20/12/2025", email: "lucie@retouche.fr", city: "Marseille" },
    { id: "4", name: "Pierre D.", specialty: "Haute Couture", status: "En attente", joinDate: "08/02/2026", email: "pierre@mode.fr", city: "Bordeaux" },
    { id: "5", name: "Amina K.", specialty: "Couture Africaine", status: "Vérifié", joinDate: "10/01/2026", email: "amina@wax.fr", city: "Paris" },
  ]);

  const [messages, setMessages] = useState<Message[]>([
    { id: "1", from: "Marie Lefebvre", subject: "Problème de livraison", preview: "Bonjour, je n'ai toujours pas reçu ma commande depuis 2 semaines...", date: "09/02/2026", read: false, type: "support", replies: [] },
    { id: "2", from: "Jean Durand", subject: "Signalement artisan", preview: "Je souhaite signaler un comportement inapproprié de la part de...", date: "08/02/2026", read: false, type: "signalement", replies: [] },
    { id: "3", from: "Atelier Paris", subject: "Demande de mise en avant", preview: "Bonjour l'équipe, serait-il possible de mettre mon profil en avant...", date: "07/02/2026", read: true, type: "info", replies: [] },
    { id: "4", from: "Claire Petit", subject: "Remboursement séquestre", preview: "Suite à l'annulation du projet, je souhaite récupérer...", date: "06/02/2026", read: true, type: "support", replies: [] },
  ]);

  const [planningEvents] = useState<PlanningEvent[]>([
    { id: "1", title: "Essayage robe", client: "Marie L.", artisan: "Atelier Paris", date: "15/02/2026", time: "10:00", status: "Confirmé" },
    { id: "2", title: "Prise de mesures", client: "Jean D.", artisan: "Magda Styliste", date: "16/02/2026", time: "14:00", status: "Confirmé" },
    { id: "3", title: "Livraison finale", client: "Sophie M.", artisan: "La Main d'Or", date: "17/02/2026", time: "11:00", status: "En attente" },
    { id: "4", title: "Consultation initiale", client: "Lucas B.", artisan: "Fils & Aiguilles", date: "18/02/2026", time: "09:30", status: "Confirmé" },
    { id: "5", title: "Retouche express", client: "Claire P.", artisan: "Amina K.", date: "19/02/2026", time: "16:00", status: "Annulé" },
  ]);

  const [measureProfiles] = useState<MeasureProfile[]>([
    { id: "1", client: "Marie Lefebvre", lastUpdate: "10/02/2026", status: "Complet", measurements: 12, details: [
      { label: "Tour de poitrine", value: "88 cm" }, { label: "Tour de taille", value: "68 cm" }, { label: "Tour de hanches", value: "96 cm" },
      { label: "Longueur dos", value: "40 cm" }, { label: "Largeur épaules", value: "38 cm" }, { label: "Longueur bras", value: "58 cm" },
      { label: "Tour de cou", value: "34 cm" }, { label: "Longueur jambe ext.", value: "105 cm" }, { label: "Longueur jambe int.", value: "78 cm" },
      { label: "Tour de cuisse", value: "54 cm" }, { label: "Tour de mollet", value: "36 cm" }, { label: "Tour de poignet", value: "15 cm" },
    ]},
    { id: "2", client: "Jean Durand", lastUpdate: "08/02/2026", status: "Complet", measurements: 10, details: [
      { label: "Tour de poitrine", value: "102 cm" }, { label: "Tour de taille", value: "88 cm" }, { label: "Tour de hanches", value: "100 cm" },
      { label: "Longueur dos", value: "44 cm" }, { label: "Largeur épaules", value: "46 cm" }, { label: "Longueur bras", value: "64 cm" },
      { label: "Tour de cou", value: "40 cm" }, { label: "Longueur jambe ext.", value: "110 cm" }, { label: "Longueur jambe int.", value: "82 cm" },
      { label: "Tour de cuisse", value: "58 cm" },
    ]},
    { id: "3", client: "Sophie Martin", lastUpdate: "05/02/2026", status: "Incomplet", measurements: 5, details: [
      { label: "Tour de poitrine", value: "92 cm" }, { label: "Tour de taille", value: "72 cm" }, { label: "Tour de hanches", value: "98 cm" },
      { label: "Longueur dos", value: "39 cm" }, { label: "Largeur épaules", value: "37 cm" },
    ]},
    { id: "4", client: "Lucas Bernard", lastUpdate: "01/02/2026", status: "En attente", measurements: 0, details: [] },
    { id: "5", client: "Claire Petit", lastUpdate: "12/01/2026", status: "Complet", measurements: 14, details: [
      { label: "Tour de poitrine", value: "86 cm" }, { label: "Tour de taille", value: "66 cm" }, { label: "Tour de hanches", value: "94 cm" },
      { label: "Longueur dos", value: "38 cm" }, { label: "Largeur épaules", value: "36 cm" }, { label: "Longueur bras", value: "56 cm" },
      { label: "Tour de cou", value: "33 cm" }, { label: "Longueur jambe ext.", value: "102 cm" }, { label: "Longueur jambe int.", value: "76 cm" },
      { label: "Tour de cuisse", value: "52 cm" }, { label: "Tour de mollet", value: "34 cm" }, { label: "Tour de poignet", value: "14.5 cm" },
      { label: "Carrure devant", value: "34 cm" }, { label: "Hauteur buste", value: "42 cm" },
    ]},
  ]);

  const [couturiers, setCouturiers] = useState<CouturierData[]>([
    { id: "c1", name: "Marc Antoine", location: "Paris, 75003", specialty: "Tailleur Homme", status: "Vérifié", selected: false },
    { id: "c2", name: "Hélène Beaumont", location: "Lyon, 69002", specialty: "Robe de Mariée", status: "En attente", selected: false },
    { id: "c3", name: "Lucie Valentin", location: "Marseille, 13001", specialty: "Retouches Premium", status: "Vérifié", selected: false },
    { id: "c4", name: "Pierre Delacroix", location: "Bordeaux, 33000", specialty: "Haute Couture", status: "En attente", selected: false },
    { id: "c5", name: "Amina Kouyaté", location: "Paris, 75020", specialty: "Couture Africaine", status: "Vérifié", selected: false },
    { id: "c6", name: "Fatou Diallo", location: "Toulouse, 31000", specialty: "Couture Traditionnelle", status: "Non vérifié", selected: false },
    { id: "c7", name: "Olivier Masse", location: "Nice, 06000", specialty: "Costume Sur Mesure", status: "Vérifié", selected: false },
  ]);

  const [articles, setArticles] = useState<Article[]>([
    { id: "1", title: "Les tendances couture printemps 2026", category: "Tendances", status: "Publié", date: "02/01/2026", views: 1240 },
    { id: "2", title: "Comment choisir son tissu", category: "Conseils", status: "Publié", date: "28/12/2025", views: 890 },
    { id: "3", title: "Portrait : Marie Dupont", category: "Portrait", status: "Brouillon", date: "25/12/2025", views: 0 },
  ]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginEmail === ADMIN_EMAIL && loginPassword === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast({ title: "Accès autorisé", description: "Bienvenue sur la console d'administration." });
    } else {
      toast({ title: "Erreur d'authentification", description: "Email ou mot de passe incorrect.", variant: "destructive" });
    }
  };

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    try { localStorage.removeItem(ADMIN_AUTH_KEY); } catch {}
    toast({ title: "Déconnexion", description: "Vous avez été déconnecté." });
  }, [toast]);

  const toggleSequestre = (id: string) => {
    setProjects(prev => prev.map(p =>
      p.id === id ? { ...p, status: p.status === "Bloqué" ? "Libéré" as const : "Bloqué" as const } : p
    ));
    const project = projects.find(p => p.id === id);
    toast({
      title: project?.status === "Bloqué" ? "Fonds libérés" : "Fonds bloqués",
      description: `Séquestre mis à jour pour ${project?.client}`,
    });
  };

  const approveArtisan = (id: string) => {
    setArtisans(prev => prev.map(a =>
      a.id === id ? { ...a, status: "Vérifié" as const } : a
    ));
    const artisan = artisans.find(a => a.id === id);
    toast({ title: "Artisan approuvé", description: `${artisan?.name} est maintenant vérifié.` });
  };

  const rejectArtisan = (id: string) => {
    setArtisans(prev => prev.map(a =>
      a.id === id ? { ...a, status: "Rejeté" as const } : a
    ));
    const artisan = artisans.find(a => a.id === id);
    toast({ title: "Artisan rejeté", description: `${artisan?.name} a été rejeté.`, variant: "destructive" });
  };

  const markMessageRead = (id: string) => {
    setMessages(prev => prev.map(m =>
      m.id === id ? { ...m, read: true } : m
    ));
    setSelectedMessage(id);
  };

  const sendReply = () => {
    if (!replyText.trim() || !selectedMessage) return;
    const newReply: ReplyMessage = {
      id: String(Date.now()),
      text: replyText.trim(),
      date: new Date().toLocaleDateString("fr-FR") + " " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      sender: "admin",
    };
    setMessages(prev => prev.map(m =>
      m.id === selectedMessage ? { ...m, replies: [...m.replies, newReply] } : m
    ));
    setReplyText("");
    toast({ title: "Réponse envoyée", description: "Le message a été envoyé avec succès." });
  };

  const publishArticle = (id: string) => {
    setArticles(prev => prev.map(a =>
      a.id === id ? { ...a, status: a.status === "Publié" ? "Brouillon" as const : "Publié" as const } : a
    ));
    toast({ title: "Statut mis à jour" });
  };

  const deleteArticle = (id: string) => {
    setArticles(prev => prev.filter(a => a.id !== id));
    toast({ title: "Article supprimé", variant: "destructive" });
  };

  const createArticle = () => {
    if (!newArticleTitle.trim()) return;
    const newArticle: Article = {
      id: String(Date.now()),
      title: newArticleTitle,
      category: newArticleCategory || "Non catégorisé",
      status: "Brouillon",
      date: new Date().toLocaleDateString("fr-FR"),
      views: 0,
    };
    setArticles(prev => [newArticle, ...prev]);
    setNewArticleTitle("");
    setNewArticleCategory("");
    setNewArticleContent("");
    setShowNewArticle(false);
    toast({ title: "Article créé", description: "Le brouillon a été enregistré." });
  };

  const toggleCouturierSelect = (id: string) => {
    setCouturiers(prev => prev.map(c =>
      c.id === id ? { ...c, selected: !c.selected } : c
    ));
    setSelectedCouturier(id);
  };

  const totalRevenue = projects.filter(p => p.status === "Libéré").reduce((sum, p) => sum + parseInt(p.amount.replace(/[^\d]/g, "")), 0);
  const pendingProjects = projects.filter(p => p.status === "Bloqué").length;
  const verifiedArtisans = artisans.filter(a => a.status === "Vérifié").length;
  const unreadMessages = messages.filter(m => !m.read).length;

  const filteredProjects = useMemo(() => projects.filter(p =>
    p.client.toLowerCase().includes(projectSearch.toLowerCase()) ||
    p.artisan.toLowerCase().includes(projectSearch.toLowerCase())
  ), [projects, projectSearch]);

  const filteredArtisans = useMemo(() => artisans.filter(a =>
    a.name.toLowerCase().includes(artisanSearch.toLowerCase()) ||
    a.specialty.toLowerCase().includes(artisanSearch.toLowerCase()) ||
    a.city.toLowerCase().includes(artisanSearch.toLowerCase())
  ), [artisans, artisanSearch]);

  const filteredMessages = useMemo(() => messages.filter(m =>
    m.from.toLowerCase().includes(messageSearch.toLowerCase()) ||
    m.subject.toLowerCase().includes(messageSearch.toLowerCase())
  ), [messages, messageSearch]);

  const currentMessage = messages.find(m => m.id === selectedMessage);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#722F37] px-4">
        <Card className="w-full max-w-md shadow-2xl border-none">
          <div className="p-8 text-center space-y-1">
            <Lock className="mx-auto text-[#722F37] h-12 w-12 mb-4" />
            <h2 className="font-serif text-2xl uppercase tracking-widest text-[#722F37]">SEAMLiER</h2>
            <p className="text-sm text-gray-500 italic font-medium">Console d'Administration</p>
          </div>
          <div className="px-8 pb-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="email"
                    placeholder="admin@seamlier.fr"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="pl-10 h-12 border-gray-200"
                    data-testid="input-admin-email"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="password"
                    placeholder="Mot de passe"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="pl-10 h-12 border-gray-200"
                    data-testid="input-admin-password"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-[#722F37] h-12" data-testid="button-admin-login">
                Connexion
              </Button>
            </form>
          </div>
        </Card>
      </div>
    );
  }

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, id: "overview" },
    { label: "Projets", icon: ShoppingBag, id: "projects" },
    { label: "Messagerie", icon: MessageSquare, id: "messaging" },
    { label: "Planning", icon: Calendar, id: "planning" },
    { label: "Mesures", icon: Ruler, id: "measures" },
    { label: "Artisans", icon: Users, id: "artisans" },
    { label: "Magazine", icon: FileText, id: "magazine" },
  ];

  const stats = [
    { label: "Demandes en attente", val: String(pendingProjects), icon: Clock, color: "text-[#722F37]", bg: "bg-[#722F37]/5", trend: "+3", tab: "projects" },
    { label: "Projets totaux", val: String(projects.length), icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50", trend: "+2", tab: "projects" },
    { label: "Revenus libérés", val: `${totalRevenue.toLocaleString()} €`, icon: ShoppingBag, color: "text-green-600", bg: "bg-green-50", trend: "+18%", tab: "projects" },
    { label: "Artisans vérifiés", val: `${verifiedArtisans}/${artisans.length}`, icon: ShieldCheck, color: "text-amber-600", bg: "bg-amber-50", trend: "+1", tab: "artisans" },
  ];

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full bg-gray-50">
        <Sidebar collapsible="none" className="border-r border-gray-100">
          <SidebarHeader className="p-6 border-b border-gray-50">
            <h2 className="text-2xl font-serif font-black text-[#722F37] tracking-tighter" data-testid="text-admin-logo">SEAMLiER</h2>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-1 font-bold">Console d'Administration</p>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={activeTab === item.id}
                        onClick={() => setActiveTab(item.id)}
                        data-testid={`nav-admin-${item.id}`}
                        className={cn(activeTab === item.id && "bg-[#722F37] text-white")}
                      >
                        <item.icon size={18} />
                        <span>{item.label}</span>
                        {item.id === "messaging" && unreadMessages > 0 && activeTab !== "messaging" && (
                          <span className="ml-auto bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{unreadMessages}</span>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4 space-y-1">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton data-testid="button-admin-settings">
                  <Settings size={18} />
                  <span>Paramètres</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout} data-testid="button-admin-logout" className="text-red-500">
                  <LogOut size={18} />
                  <span>Déconnexion</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <span className="text-sm font-medium text-gray-700 hidden md:inline" data-testid="text-admin-console-title">Console d'Administration SEAMLiER</span>
              <Badge variant="outline" className="text-[#722F37] border-[#722F37]/20 bg-[#722F37]/5 px-3 py-1 md:hidden" data-testid="badge-admin-mode">Admin</Badge>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 hidden sm:inline" data-testid="text-admin-email">{ADMIN_EMAIL}</span>
              <Button variant="ghost" size="sm" className="text-red-500" onClick={handleLogout} data-testid="button-header-logout">
                <LogOut size={16} className="mr-1.5" /> Déconnexion
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6 lg:p-8 bg-gray-50">
            <div className="max-w-7xl mx-auto space-y-6">

              {/* ===== OVERVIEW ===== */}
              {activeTab === "overview" && (
                <>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-serif font-bold text-gray-900" data-testid="text-page-title">Tableau de Bord</h1>
                    <p className="text-gray-500 mt-1 text-sm">Vue globale de la marketplace SEAMLiER</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    {stats.map((stat) => (
                      <Card key={stat.label} className="border-none shadow-sm hover-elevate cursor-pointer" onClick={() => setActiveTab(stat.tab)} data-testid={`card-stat-${stat.label.replace(/\s/g, "-").toLowerCase()}`}>
                        <CardContent className="p-5">
                          <div className="flex justify-between items-start">
                            <div className={cn("p-2 rounded-lg", stat.bg)}>
                              <stat.icon size={18} className={stat.color} />
                            </div>
                            <span className="text-[11px] font-bold flex items-center gap-0.5 text-green-600">
                              <ArrowUpRight size={12} />
                              {stat.trend}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-500 mt-3">{stat.label}</p>
                          <p className="text-2xl lg:text-3xl font-bold text-gray-900 mt-1">{stat.val}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <div className="grid lg:grid-cols-2 gap-6">
                    <Card className="border-none shadow-sm">
                      <CardContent className="p-5">
                        <div className="flex justify-between items-center mb-4 gap-2">
                          <CardTitle className="text-base font-serif">Derniers projets</CardTitle>
                          <Button variant="ghost" size="sm" className="text-[#722F37] text-xs" onClick={() => setActiveTab("projects")} data-testid="button-view-all-projects">
                            Tout voir <ChevronRight size={14} className="ml-1" />
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {projects.slice(0, 3).map(p => (
                            <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 gap-3 flex-wrap">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{p.client}</p>
                                <p className="text-xs text-gray-500 truncate">{p.description}</p>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <Badge className={cn("text-[10px] border-none", p.status === "Bloqué" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700")}>{p.status}</Badge>
                                <span className="text-sm font-bold text-[#722F37]">{p.amount}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm">
                      <CardContent className="p-5">
                        <div className="flex justify-between items-center mb-4 gap-2">
                          <CardTitle className="text-base font-serif">Artisans en attente</CardTitle>
                          <Button variant="ghost" size="sm" className="text-[#722F37] text-xs" onClick={() => setActiveTab("artisans")} data-testid="button-view-all-artisans">
                            Tout voir <ChevronRight size={14} className="ml-1" />
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {artisans.filter(a => a.status === "En attente").map(a => (
                            <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 gap-3 flex-wrap">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-[#722F37]/5 flex items-center justify-center text-[#722F37] font-bold text-xs flex-shrink-0">{a.name[0]}</div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold truncate">{a.name}</p>
                                  <p className="text-xs text-gray-500 truncate">{a.specialty} - {a.city}</p>
                                </div>
                              </div>
                              <div className="flex gap-2 flex-shrink-0">
                                <Button size="sm" className="bg-[#722F37] h-7 text-[10px]" onClick={() => approveArtisan(a.id)} data-testid={`button-quick-approve-${a.id}`}>Approuver</Button>
                                <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => rejectArtisan(a.id)} data-testid={`button-quick-reject-${a.id}`}>Rejeter</Button>
                              </div>
                            </div>
                          ))}
                          {artisans.filter(a => a.status === "En attente").length === 0 && (
                            <p className="text-sm text-gray-400 text-center py-4" data-testid="text-no-pending-artisans">Aucun artisan en attente</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}

              {/* ===== PROJECTS ===== */}
              {activeTab === "projects" && (
                <>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-serif font-bold text-gray-900" data-testid="text-page-title">Projets & Séquestre</h1>
                    <p className="text-gray-500 mt-1 text-sm">Gestion des flux financiers de la marketplace</p>
                  </div>
                  <Card className="border-none shadow-sm overflow-hidden bg-white">
                    <div className="p-5 border-b border-gray-50 flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex gap-2 flex-wrap">
                        <Badge className="bg-[#722F37]/5 text-[#722F37] border-none px-3 py-1" data-testid="badge-total-projects">{projects.length} projets</Badge>
                        <Badge className="bg-amber-50 text-amber-700 border-none px-3 py-1" data-testid="badge-blocked-projects">{pendingProjects} bloqués</Badge>
                        <Badge className="bg-green-50 text-green-700 border-none px-3 py-1" data-testid="badge-released-projects">{projects.length - pendingProjects} libérés</Badge>
                      </div>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input placeholder="Rechercher client ou artisan..." value={projectSearch} onChange={e => setProjectSearch(e.target.value)} className="pl-10 w-72 h-9 text-sm" data-testid="input-search-projects" />
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left" data-testid="table-projects">
                        <thead>
                          <tr className="text-[11px] uppercase tracking-wider text-gray-400 bg-gray-50/30">
                            <th className="px-5 py-3 font-bold">Client</th>
                            <th className="px-5 py-3 font-bold">Artisan</th>
                            <th className="px-5 py-3 font-bold">Description</th>
                            <th className="px-5 py-3 font-bold">Date</th>
                            <th className="px-5 py-3 font-bold text-center">Séquestre</th>
                            <th className="px-5 py-3 font-bold text-right">Montant</th>
                            <th className="px-5 py-3 text-center font-bold">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {filteredProjects.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-50/50 transition-colors" data-testid={`row-project-${p.id}`}>
                              <td className="px-5 py-3 text-sm font-semibold">{p.client}</td>
                              <td className="px-5 py-3 text-sm text-gray-600">{p.artisan}</td>
                              <td className="px-5 py-3 text-xs text-gray-500 max-w-[180px] truncate">{p.description}</td>
                              <td className="px-5 py-3 text-xs text-gray-500">{p.date}</td>
                              <td className="px-5 py-3 text-center">
                                <Badge className={cn("text-[10px] px-3 py-1 border-none font-bold uppercase", p.status === "Bloqué" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700")} data-testid={`badge-sequestre-${p.id}`}>
                                  {p.status === "Bloqué" ? <ShieldAlert size={10} className="mr-1 inline" /> : <ShieldCheck size={10} className="mr-1 inline" />}
                                  {p.status}
                                </Badge>
                              </td>
                              <td className="px-5 py-3 text-right font-bold text-[#722F37]">{p.amount}</td>
                              <td className="px-5 py-3 text-center">
                                <Button size="sm" variant={p.status === "Bloqué" ? "default" : "outline"} className={cn("h-8 text-[11px] font-bold", p.status === "Bloqué" && "bg-green-600")} onClick={() => toggleSequestre(p.id)} data-testid={`button-toggle-sequestre-${p.id}`}>
                                  {p.status === "Bloqué" ? "Libérer" : "Bloquer"}
                                </Button>
                              </td>
                            </tr>
                          ))}
                          {filteredProjects.length === 0 && (
                            <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-gray-400">Aucun résultat</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </>
              )}

              {/* ===== MESSAGING ===== */}
              {activeTab === "messaging" && (
                <>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-serif font-bold text-gray-900" data-testid="text-page-title">Messagerie Admin</h1>
                    <p className="text-gray-500 mt-1 text-sm">Support et modération centralisée</p>
                  </div>
                  <div className="grid lg:grid-cols-3 gap-6" style={{ minHeight: "60vh" }}>
                    <Card className="border-none shadow-sm overflow-hidden bg-white lg:col-span-1 flex flex-col">
                      <div className="p-4 border-b border-gray-50">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input placeholder="Rechercher..." value={messageSearch} onChange={e => setMessageSearch(e.target.value)} className="pl-10 h-9 text-sm" data-testid="input-search-messages" />
                        </div>
                      </div>
                      <div className="overflow-y-auto flex-1">
                        {filteredMessages.map(m => (
                          <button key={m.id} onClick={() => markMessageRead(m.id)} className={cn("w-full text-left p-4 border-b border-gray-50 hover-elevate transition-colors", selectedMessage === m.id && "bg-[#722F37]/5 border-l-2 border-l-[#722F37]")} data-testid={`message-item-${m.id}`}>
                            <div className="flex justify-between items-start mb-1 gap-2">
                              <span className="text-sm font-semibold text-gray-900 truncate">{m.from}</span>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {!m.read && <span className="w-2 h-2 rounded-full bg-[#722F37]" data-testid={`indicator-unread-${m.id}`} />}
                                <span className="text-[10px] text-gray-400">{m.date}</span>
                              </div>
                            </div>
                            <p className="text-xs font-medium text-gray-700 mb-1">{m.subject}</p>
                            <div className="flex items-center gap-2">
                              <Badge className={cn("text-[9px] border-none px-1.5 py-0.5", m.type === "support" ? "bg-blue-50 text-blue-600" : m.type === "signalement" ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-600")}>{m.type}</Badge>
                              <p className="text-[11px] text-gray-400 truncate">{m.preview}</p>
                            </div>
                          </button>
                        ))}
                        {filteredMessages.length === 0 && (
                          <p className="text-sm text-gray-400 text-center py-8">Aucun message trouvé</p>
                        )}
                      </div>
                    </Card>
                    <Card className="border-none shadow-sm overflow-hidden bg-white lg:col-span-2 flex flex-col">
                      {currentMessage ? (
                        <>
                          <div className="p-5 border-b border-gray-50">
                            <div className="flex justify-between items-start gap-3 flex-wrap">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900" data-testid="text-message-subject">{currentMessage.subject}</h3>
                                <p className="text-sm text-gray-500" data-testid="text-message-from">De : {currentMessage.from} - {currentMessage.date}</p>
                              </div>
                              <Badge className={cn("text-[10px] border-none", currentMessage.type === "support" ? "bg-blue-50 text-blue-600" : currentMessage.type === "signalement" ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-600")} data-testid="badge-message-type">{currentMessage.type}</Badge>
                            </div>
                          </div>
                          <div className="flex-1 p-5 overflow-y-auto space-y-3" data-testid="message-thread">
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                  <User size={12} className="text-gray-500" />
                                </div>
                                <span className="text-xs font-semibold text-gray-600">{currentMessage.from}</span>
                                <span className="text-[10px] text-gray-400">{currentMessage.date}</span>
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed" data-testid="text-message-content">{currentMessage.preview}</p>
                            </div>
                            {currentMessage.replies.map((reply) => (
                              <div key={reply.id} className="bg-[#722F37]/5 rounded-lg p-4 ml-6" data-testid={`reply-message-${reply.id}`}>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-6 h-6 rounded-full bg-[#722F37]/20 flex items-center justify-center flex-shrink-0">
                                    <ShieldCheck size={12} className="text-[#722F37]" />
                                  </div>
                                  <span className="text-xs font-semibold text-[#722F37]">Admin SEAMLiER</span>
                                  <span className="text-[10px] text-gray-400">{reply.date}</span>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed" data-testid={`text-reply-content-${reply.id}`}>{reply.text}</p>
                              </div>
                            ))}
                          </div>
                          <div className="p-4 border-t border-gray-50">
                            <Textarea placeholder="Répondre..." value={replyText} onChange={e => setReplyText(e.target.value)} className="min-h-[80px] text-sm" data-testid="input-admin-reply" />
                            <div className="flex justify-end mt-3">
                              <Button className="bg-[#722F37]" onClick={sendReply} data-testid="button-send-reply">
                                <Send size={16} className="mr-2" /> Envoyer
                              </Button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 flex items-center justify-center">
                          <div className="text-center">
                            <MessageSquare className="mx-auto text-gray-200 h-16 w-16 mb-4" />
                            <p className="text-gray-400" data-testid="text-no-message-selected">Sélectionnez un message</p>
                          </div>
                        </div>
                      )}
                    </Card>
                  </div>
                </>
              )}

              {/* ===== PLANNING ===== */}
              {activeTab === "planning" && (
                <>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-serif font-bold text-gray-900" data-testid="text-page-title">Planning Global</h1>
                    <p className="text-gray-500 mt-1 text-sm">Vue d'ensemble des rendez-vous</p>
                  </div>
                  <div className="grid lg:grid-cols-3 gap-6">
                    <Card className="border-none shadow-sm bg-white lg:col-span-2 overflow-hidden">
                      <div className="p-5 border-b border-gray-50 flex justify-between items-center gap-3 flex-wrap">
                        <CardTitle className="text-base font-serif">Prochains rendez-vous</CardTitle>
                        <div className="flex gap-2 flex-wrap">
                          <Badge className="bg-green-50 text-green-700 border-none" data-testid="badge-confirmed-events">{planningEvents.filter(e => e.status === "Confirmé").length} confirmés</Badge>
                          <Badge className="bg-amber-50 text-amber-700 border-none" data-testid="badge-pending-events">{planningEvents.filter(e => e.status === "En attente").length} en attente</Badge>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left" data-testid="table-planning">
                          <thead>
                            <tr className="text-[11px] uppercase tracking-wider text-gray-400 bg-gray-50/30">
                              <th className="px-5 py-3 font-bold">RDV</th>
                              <th className="px-5 py-3 font-bold">Client</th>
                              <th className="px-5 py-3 font-bold">Artisan</th>
                              <th className="px-5 py-3 font-bold">Date</th>
                              <th className="px-5 py-3 font-bold">Heure</th>
                              <th className="px-5 py-3 font-bold text-center">Statut</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {planningEvents.map(ev => (
                              <tr key={ev.id} className="hover:bg-gray-50/50 transition-colors" data-testid={`row-event-${ev.id}`}>
                                <td className="px-5 py-3 text-sm font-semibold">{ev.title}</td>
                                <td className="px-5 py-3 text-sm text-gray-600">{ev.client}</td>
                                <td className="px-5 py-3 text-sm text-gray-600">{ev.artisan}</td>
                                <td className="px-5 py-3 text-xs text-gray-500">{ev.date}</td>
                                <td className="px-5 py-3 text-xs font-medium">{ev.time}</td>
                                <td className="px-5 py-3 text-center">
                                  <Badge className={cn("text-[10px] border-none font-bold", ev.status === "Confirmé" ? "bg-green-100 text-green-700" : ev.status === "Annulé" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700")} data-testid={`badge-event-status-${ev.id}`}>{ev.status}</Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                    <Card className="border-none shadow-sm">
                      <CardContent className="p-5">
                        <CardTitle className="text-base font-serif mb-4">Résumé</CardTitle>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-sm"><span className="text-gray-500">Total RDV</span><span className="font-bold" data-testid="text-total-events">{planningEvents.length}</span></div>
                          <div className="flex justify-between items-center text-sm"><span className="text-gray-500">Confirmés</span><span className="font-bold text-green-600" data-testid="text-confirmed-events">{planningEvents.filter(e => e.status === "Confirmé").length}</span></div>
                          <div className="flex justify-between items-center text-sm"><span className="text-gray-500">En attente</span><span className="font-bold text-amber-600" data-testid="text-pending-events">{planningEvents.filter(e => e.status === "En attente").length}</span></div>
                          <div className="flex justify-between items-center text-sm"><span className="text-gray-500">Annulés</span><span className="font-bold text-red-500" data-testid="text-cancelled-events">{planningEvents.filter(e => e.status === "Annulé").length}</span></div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}

              {/* ===== MEASURES ===== */}
              {activeTab === "measures" && (
                <>
                  <div className="flex justify-between items-end gap-4 flex-wrap">
                    <div>
                      <h1 className="text-2xl lg:text-3xl font-serif font-bold text-gray-900" data-testid="text-page-title">Mesures & Fit Passport</h1>
                      <p className="text-gray-500 mt-1 text-sm">Gestion des profils de mesures et données couturiers</p>
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-3 gap-6">
                    <Card className="border-none shadow-sm">
                      <CardContent className="p-5">
                        <CardTitle className="text-base font-serif mb-4">Statistiques Mesures</CardTitle>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm"><span className="text-gray-500">Profils complets</span><span className="font-bold text-green-600" data-testid="text-complete-profiles">{measureProfiles.filter(m => m.status === "Complet").length}</span></div>
                          <div className="flex justify-between text-sm"><span className="text-gray-500">Incomplets</span><span className="font-bold text-amber-600" data-testid="text-incomplete-profiles">{measureProfiles.filter(m => m.status === "Incomplet").length}</span></div>
                          <div className="flex justify-between text-sm"><span className="text-gray-500">En attente</span><span className="font-bold text-gray-400" data-testid="text-waiting-profiles">{measureProfiles.filter(m => m.status === "En attente").length}</span></div>
                          <div className="flex justify-between text-sm pt-2 border-t border-gray-50"><span className="text-gray-500">Total mesures</span><span className="font-bold text-[#722F37]" data-testid="text-total-measures">{measureProfiles.reduce((s, m) => s + m.measurements, 0)}</span></div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-white lg:col-span-2 overflow-hidden">
                      <div className="p-5 border-b border-gray-50">
                        <CardTitle className="text-base font-serif">Profils clients</CardTitle>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left" data-testid="table-measures">
                          <thead>
                            <tr className="text-[11px] uppercase tracking-wider text-gray-400 bg-gray-50/30">
                              <th className="px-5 py-3 font-bold">Client</th>
                              <th className="px-5 py-3 font-bold">Mesures</th>
                              <th className="px-5 py-3 font-bold">Dernière MAJ</th>
                              <th className="px-5 py-3 font-bold text-center">Statut</th>
                              <th className="px-5 py-3 text-right font-bold">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {measureProfiles.map(mp => (
                              <tr key={mp.id} className="hover:bg-gray-50/50 transition-colors" data-testid={`row-measure-${mp.id}`}>
                                <td className="px-5 py-3 text-sm font-semibold">{mp.client}</td>
                                <td className="px-5 py-3 text-sm text-gray-600">{mp.measurements} mesures</td>
                                <td className="px-5 py-3 text-xs text-gray-500">{mp.lastUpdate}</td>
                                <td className="px-5 py-3 text-center">
                                  <Badge className={cn("text-[10px] border-none font-bold", mp.status === "Complet" ? "bg-green-100 text-green-700" : mp.status === "Incomplet" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500")} data-testid={`badge-measure-status-${mp.id}`}>{mp.status}</Badge>
                                </td>
                                <td className="px-5 py-3 text-right">
                                  <Button size="sm" variant="outline" className="h-8 text-[11px]" onClick={() => setSelectedMeasure(mp)} data-testid={`button-view-measure-${mp.id}`}>
                                    <Eye size={14} className="mr-1" /> Voir
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </div>

                  <Card className="border-none shadow-sm bg-white overflow-hidden">
                    <div className="p-5 border-b border-gray-50 flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <CardTitle className="text-base font-serif">Base Couturiers</CardTitle>
                        <p className="text-xs text-gray-400 mt-1">Données couturiers pour l'import</p>
                      </div>
                      <Button className="bg-[#722F37] font-bold" data-testid="button-import-data" onClick={() => toast({ title: "Import", description: "Fonctionnalité d'import en préparation." })}>
                        <Upload size={16} className="mr-2" /> Importer Data
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left" data-testid="table-couturiers">
                        <thead>
                          <tr className="text-[11px] uppercase tracking-wider text-gray-400 bg-gray-50/30">
                            <th className="px-5 py-3 font-bold w-10"></th>
                            <th className="px-5 py-3 font-bold">Nom du Couturier</th>
                            <th className="px-5 py-3 font-bold">Localisation</th>
                            <th className="px-5 py-3 font-bold">Spécialité</th>
                            <th className="px-5 py-3 font-bold text-center">Vérification</th>
                            <th className="px-5 py-3 text-right font-bold">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {couturiers.map(c => (
                            <tr key={c.id} className={cn("transition-colors", selectedCouturier === c.id ? "bg-[#722F37]/5" : "hover:bg-gray-50/50")} data-testid={`row-couturier-${c.id}`}>
                              <td className="px-5 py-3">
                                <input type="checkbox" checked={c.selected} onChange={() => toggleCouturierSelect(c.id)} className="rounded border-gray-300 text-[#722F37] focus:ring-[#722F37]" data-testid={`checkbox-couturier-${c.id}`} />
                              </td>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-[#722F37]/5 flex items-center justify-center text-[#722F37] font-bold text-xs flex-shrink-0">{c.name[0]}</div>
                                  <span className="text-sm font-semibold">{c.name}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                  <MapPin size={12} className="text-gray-400" />
                                  {c.location}
                                </div>
                              </td>
                              <td className="px-5 py-3 text-sm text-gray-600">{c.specialty}</td>
                              <td className="px-5 py-3 text-center">
                                <Badge className={cn("text-[10px] border-none font-bold", c.status === "Vérifié" ? "bg-green-100 text-green-700" : c.status === "En attente" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500")} data-testid={`badge-couturier-status-${c.id}`}>{c.status}</Badge>
                              </td>
                              <td className="px-5 py-3 text-right">
                                <div className="flex justify-end gap-2">
                                  <Button size="sm" variant="outline" className="h-8 text-[11px]" data-testid={`button-edit-couturier-${c.id}`}>
                                    <Pencil size={14} className="mr-1" /> Editer
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-8 text-[11px]" data-testid={`button-view-couturier-${c.id}`}>
                                    <Eye size={14} className="mr-1" /> Voir
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  <Dialog open={!!selectedMeasure} onOpenChange={(open) => !open && setSelectedMeasure(null)}>
                    <DialogContent className="max-w-lg" data-testid="dialog-measure-detail">
                      <DialogHeader>
                        <DialogTitle className="font-serif text-lg flex items-center gap-3" data-testid="text-measure-client">
                          <Ruler size={20} className="text-[#722F37]" />
                          {selectedMeasure?.client}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <Badge className={cn("text-[10px] border-none font-bold", selectedMeasure?.status === "Complet" ? "bg-green-100 text-green-700" : selectedMeasure?.status === "Incomplet" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500")} data-testid="badge-measure-detail-status">{selectedMeasure?.status}</Badge>
                          <span className="text-xs text-gray-400" data-testid="text-measure-update">MAJ : {selectedMeasure?.lastUpdate}</span>
                        </div>
                        {selectedMeasure?.details && selectedMeasure.details.length > 0 ? (
                          <div className="grid grid-cols-2 gap-x-6 gap-y-2" data-testid="grid-measure-details">
                            {selectedMeasure.details.map((d, i) => (
                              <div key={i} className="flex justify-between items-center py-1.5 border-b border-gray-50" data-testid={`measure-detail-${i}`}>
                                <span className="text-sm text-gray-500">{d.label}</span>
                                <span className="text-sm font-semibold text-gray-900">{d.value}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Ruler className="mx-auto text-gray-200 h-12 w-12 mb-3" />
                            <p className="text-sm text-gray-400" data-testid="text-no-measures">Aucune mesure enregistrée</p>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t border-gray-100 gap-3 flex-wrap">
                          <span className="text-xs text-gray-400">{selectedMeasure?.measurements} mesure{(selectedMeasure?.measurements ?? 0) > 1 ? "s" : ""} enregistrée{(selectedMeasure?.measurements ?? 0) > 1 ? "s" : ""}</span>
                          <Button variant="outline" size="sm" onClick={() => setSelectedMeasure(null)} data-testid="button-close-measure-detail">Fermer</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}

              {/* ===== ARTISANS ===== */}
              {activeTab === "artisans" && (
                <>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-serif font-bold text-gray-900" data-testid="text-page-title">Gestion des Artisans</h1>
                    <p className="text-gray-500 mt-1 text-sm">Validation et suivi des professionnels</p>
                  </div>
                  <Card className="border-none shadow-sm overflow-hidden bg-white">
                    <div className="p-5 border-b border-gray-50 flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex gap-2 flex-wrap">
                        <Badge className="bg-green-50 text-green-700 border-none px-3 py-1" data-testid="badge-verified-artisans">{artisans.filter(a => a.status === "Vérifié").length} vérifiés</Badge>
                        <Badge className="bg-amber-50 text-amber-700 border-none px-3 py-1" data-testid="badge-pending-artisans">{artisans.filter(a => a.status === "En attente").length} en attente</Badge>
                        <Badge className="bg-red-50 text-red-600 border-none px-3 py-1" data-testid="badge-rejected-artisans">{artisans.filter(a => a.status === "Rejeté").length} rejetés</Badge>
                      </div>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input placeholder="Nom, spécialité ou ville..." value={artisanSearch} onChange={e => setArtisanSearch(e.target.value)} className="pl-10 w-72 h-9 text-sm" data-testid="input-search-artisans" />
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left" data-testid="table-artisans">
                        <thead>
                          <tr className="text-[11px] uppercase tracking-wider text-gray-400 bg-gray-50/30">
                            <th className="px-5 py-3 font-bold">Artisan</th>
                            <th className="px-5 py-3 font-bold">Spécialité</th>
                            <th className="px-5 py-3 font-bold">Ville</th>
                            <th className="px-5 py-3 font-bold">Email</th>
                            <th className="px-5 py-3 font-bold">Inscription</th>
                            <th className="px-5 py-3 font-bold text-center">Statut</th>
                            <th className="px-5 py-3 text-right font-bold">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {filteredArtisans.map(a => (
                            <tr key={a.id} className="hover:bg-gray-50/50 transition-colors" data-testid={`row-artisan-${a.id}`}>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-[#722F37]/5 flex items-center justify-center text-[#722F37] font-bold text-xs flex-shrink-0">{a.name[0]}</div>
                                  <span className="text-sm font-semibold">{a.name}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-sm text-gray-600">{a.specialty}</td>
                              <td className="px-5 py-3 text-sm text-gray-600">{a.city}</td>
                              <td className="px-5 py-3 text-xs text-gray-500">{a.email}</td>
                              <td className="px-5 py-3 text-xs text-gray-500">{a.joinDate}</td>
                              <td className="px-5 py-3 text-center">
                                <Badge className={cn("text-[10px] border-none font-bold", a.status === "Vérifié" ? "bg-green-100 text-green-700" : a.status === "Rejeté" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700")} data-testid={`badge-artisan-status-${a.id}`}>{a.status}</Badge>
                              </td>
                              <td className="px-5 py-3 text-right">
                                {a.status === "En attente" ? (
                                  <div className="flex justify-end gap-2">
                                    <Button size="sm" className="bg-[#722F37] h-8 text-[11px] font-bold" onClick={() => approveArtisan(a.id)} data-testid={`button-approve-${a.id}`}>
                                      <CheckCircle size={14} className="mr-1" /> Approuver
                                    </Button>
                                    <Button size="sm" variant="destructive" className="h-8 text-[11px]" onClick={() => rejectArtisan(a.id)} data-testid={`button-reject-${a.id}`}>
                                      <XCircle size={14} className="mr-1" /> Rejeter
                                    </Button>
                                  </div>
                                ) : (
                                  <Button size="sm" variant="outline" className="h-8 text-[11px]" data-testid={`button-dossier-${a.id}`}>Dossier</Button>
                                )}
                              </td>
                            </tr>
                          ))}
                          {filteredArtisans.length === 0 && (
                            <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-gray-400">Aucun résultat</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </>
              )}

              {/* ===== MAGAZINE ===== */}
              {activeTab === "magazine" && (
                <>
                  <div className="flex justify-between items-end gap-4 flex-wrap">
                    <div>
                      <h1 className="text-2xl lg:text-3xl font-serif font-bold text-gray-900" data-testid="text-page-title">Gestion du Magazine</h1>
                      <p className="text-gray-500 mt-1 text-sm">Contenu éditorial SEAMLiER</p>
                    </div>
                    <Button className="bg-[#722F37] font-bold" onClick={() => setShowNewArticle(true)} data-testid="button-new-article">
                      <PlusCircle size={18} className="mr-2" /> Nouvel Article
                    </Button>
                  </div>

                  {showNewArticle && (
                    <Card className="border-none shadow-sm bg-white overflow-hidden">
                      <div className="p-5 border-b border-gray-50 flex justify-between items-center gap-3">
                        <CardTitle className="text-base font-serif">Nouveau brouillon</CardTitle>
                        <Button variant="ghost" size="icon" onClick={() => setShowNewArticle(false)} data-testid="button-close-new-article"><X size={18} /></Button>
                      </div>
                      <CardContent className="p-5 space-y-4">
                        <Input placeholder="Titre de l'article" value={newArticleTitle} onChange={e => setNewArticleTitle(e.target.value)} className="h-11 font-semibold" data-testid="input-article-title" />
                        <Input placeholder="Catégorie (ex: Tendances, Conseils, Portrait)" value={newArticleCategory} onChange={e => setNewArticleCategory(e.target.value)} className="h-10 text-sm" data-testid="input-article-category" />
                        <Textarea placeholder="Contenu de l'article..." value={newArticleContent} onChange={e => setNewArticleContent(e.target.value)} className="min-h-[120px] text-sm" data-testid="input-article-content" />
                        <div className="flex justify-end gap-3">
                          <Button variant="outline" onClick={() => setShowNewArticle(false)} data-testid="button-cancel-article">Annuler</Button>
                          <Button className="bg-[#722F37] font-bold" onClick={createArticle} data-testid="button-save-article">Enregistrer</Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="border-none shadow-sm overflow-hidden bg-white">
                    <div className="p-5 border-b border-gray-50 flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex gap-2 flex-wrap">
                        <Badge className="bg-[#722F37]/5 text-[#722F37] border-none px-3 py-1" data-testid="badge-total-articles">{articles.length} articles</Badge>
                        <Badge className="bg-green-50 text-green-700 border-none px-3 py-1" data-testid="badge-published-articles">{articles.filter(a => a.status === "Publié").length} publiés</Badge>
                        <Badge className="bg-gray-100 text-gray-600 border-none px-3 py-1" data-testid="badge-draft-articles">{articles.filter(a => a.status === "Brouillon").length} brouillons</Badge>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left" data-testid="table-articles">
                        <thead>
                          <tr className="text-[11px] uppercase tracking-wider text-gray-400 bg-gray-50/30">
                            <th className="px-5 py-3 font-bold">Titre</th>
                            <th className="px-5 py-3 font-bold">Catégorie</th>
                            <th className="px-5 py-3 font-bold">Date</th>
                            <th className="px-5 py-3 font-bold text-center">Statut</th>
                            <th className="px-5 py-3 font-bold text-right">Vues</th>
                            <th className="px-5 py-3 text-right font-bold">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {articles.map(a => (
                            <tr key={a.id} className="hover:bg-gray-50/50 transition-colors" data-testid={`row-article-${a.id}`}>
                              <td className="px-5 py-3 text-sm font-semibold max-w-[280px] truncate">{a.title}</td>
                              <td className="px-5 py-3"><Badge variant="outline" className="text-[10px]">{a.category}</Badge></td>
                              <td className="px-5 py-3 text-xs text-gray-500">{a.date}</td>
                              <td className="px-5 py-3 text-center">
                                <Badge className={cn("text-[10px] border-none font-bold", a.status === "Publié" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500")} data-testid={`badge-article-status-${a.id}`}>{a.status}</Badge>
                              </td>
                              <td className="px-5 py-3 text-right text-sm text-gray-600">{a.views.toLocaleString()}</td>
                              <td className="px-5 py-3 text-right">
                                <div className="flex justify-end gap-2">
                                  <Button size="sm" variant="outline" className={cn("h-8 text-[11px] font-bold")} onClick={() => publishArticle(a.id)} data-testid={`button-toggle-article-${a.id}`}>
                                    {a.status === "Brouillon" ? "Publier" : "Dépublier"}
                                  </Button>
                                  <Button size="sm" variant="destructive" className="h-8" onClick={() => deleteArticle(a.id)} data-testid={`button-delete-article-${a.id}`}>
                                    <Trash2 size={14} />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {articles.length === 0 && (
                            <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-400">Aucun article</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </>
              )}

            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
