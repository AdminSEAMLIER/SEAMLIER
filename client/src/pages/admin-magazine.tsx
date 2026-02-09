import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
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
  User, Building2, Phone, CreditCard, Briefcase, Hash,
  Globe, Bell, Palette, Shield, Database, Key, ToggleLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  firstName: string;
  lastName: string;
  birthDate: string;
  nationality: string;
  idType: string;
  idNumber: string;
  phone: string;
  address: string;
  siret: string;
  companyName: string;
  legalForm: string;
  tvaNumber: string;
  iban: string;
  yearsExperience: number;
  bio: string;
  subscriptionPlan: string;
  paymentStatus: string;
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
  firstName: string;
  lastName: string;
  birthDate: string;
  nationality: string;
  idType: string;
  idNumber: string;
  phone: string;
  email: string;
  address: string;
  siret: string;
  companyName: string;
  legalForm: string;
  tvaNumber: string;
  iban: string;
  registrationDate: string;
  yearsExperience: number;
  bio: string;
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
  const [couturierDialogMode, setCouturierDialogMode] = useState<"view" | "edit" | null>(null);
  const [couturierDialogId, setCouturierDialogId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CouturierData>>({});
  const [artisanDossierId, setArtisanDossierId] = useState<string | null>(null);
  const [artisanDossierMode, setArtisanDossierMode] = useState<"view" | "edit" | null>(null);
  const [artisanEditForm, setArtisanEditForm] = useState<Partial<Artisan>>({});
  const [showAddArtisan, setShowAddArtisan] = useState(false);
  const [newArtisan, setNewArtisan] = useState({
    firstName: "", lastName: "", specialty: "", city: "", email: "", phone: "",
    siret: "", companyName: "", legalForm: "", status: "En attente" as "Vérifié" | "En attente" | "Rejeté",
    birthDate: "", nationality: "", idType: "", idNumber: "", address: "",
    tvaNumber: "", iban: "", yearsExperience: 0, bio: "",
    subscriptionPlan: "Mensuel", paymentStatus: "En attente",
  });

  const [settingsPlatformName, setSettingsPlatformName] = useState("SEAMLiER");
  const [settingsContactEmail, setSettingsContactEmail] = useState("contact@seamlier.fr");
  const [settingsSupportEmail, setSettingsSupportEmail] = useState("support@seamlier.fr");
  const [settingsPhone, setSettingsPhone] = useState("+33 1 23 45 67 89");
  const [settingsAddress, setSettingsAddress] = useState("15 Rue de la Paix, 75002 Paris");
  const [settingsCommission, setSettingsCommission] = useState("10");
  const [settingsCurrency, setSettingsCurrency] = useState("EUR");
  const [settingsLanguage, setSettingsLanguage] = useState("fr");
  const [settingsNotifNewArtisan, setSettingsNotifNewArtisan] = useState(true);
  const [settingsNotifNewProject, setSettingsNotifNewProject] = useState(true);
  const [settingsNotifMessages, setSettingsNotifMessages] = useState(true);
  const [settingsNotifPayments, setSettingsNotifPayments] = useState(true);
  const [settingsAutoApprove, setSettingsAutoApprove] = useState(false);
  const [settingsMaintenanceMode, setSettingsMaintenanceMode] = useState(false);
  const [settingsMaxUploadSize, setSettingsMaxUploadSize] = useState("10");
  const [settingsMinOrderAmount, setSettingsMinOrderAmount] = useState("30");
  const [settingsSubscriptionPrice, setSettingsSubscriptionPrice] = useState("29");
  const [settingsTrialDays, setSettingsTrialDays] = useState("30");
  const [settingsSiretRequired, setSettingsSiretRequired] = useState(true);
  const [settingsIdRequired, setSettingsIdRequired] = useState(true);
  const settingsLoaded = useRef(false);

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

  const { data: dbArtisans = [], isLoading: artisansLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/artisans"],
    enabled: isAuthenticated,
  });

  const artisans: Artisan[] = useMemo(() =>
    dbArtisans.map((a: any) => ({
      id: a.id,
      name: `${a.firstName} ${a.lastName}`,
      firstName: a.firstName || "",
      lastName: a.lastName || "",
      specialty: a.specialty || "",
      status: (a.status || "En attente") as Artisan["status"],
      joinDate: a.joinDate || new Date(a.createdAt).toLocaleDateString("fr-FR"),
      email: a.email || "",
      city: a.city || "",
      phone: a.phone || "",
      birthDate: a.birthDate || "",
      nationality: a.nationality || "",
      idType: a.idType || "",
      idNumber: a.idNumber || "",
      address: a.address || "",
      siret: a.siret || "",
      companyName: a.companyName || "",
      legalForm: a.legalForm || "",
      tvaNumber: a.tvaNumber || "",
      iban: a.iban || "",
      yearsExperience: a.yearsExperience || 0,
      bio: a.bio || "",
      subscriptionPlan: a.subscriptionPlan || "Mensuel",
      paymentStatus: a.paymentStatus || "En attente",
    })),
  [dbArtisans]);

  const createArtisanMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/artisans", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/artisans"] });
      toast({ title: "Artisan ajouté", description: "L'artisan a été ajouté avec succès." });
      setShowAddArtisan(false);
      setNewArtisan({
        firstName: "", lastName: "", specialty: "", city: "", email: "", phone: "",
        siret: "", companyName: "", legalForm: "", status: "En attente",
        birthDate: "", nationality: "", idType: "", idNumber: "", address: "",
        tvaNumber: "", iban: "", yearsExperience: 0, bio: "",
        subscriptionPlan: "Mensuel", paymentStatus: "En attente",
      });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible d'ajouter l'artisan.", variant: "destructive" });
    },
  });

  const updateArtisanMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PUT", `/api/admin/artisans/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/artisans"] });
    },
  });

  const deleteArtisanMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/artisans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/artisans"] });
    },
  });

  const { data: dbSettings } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/settings"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (dbSettings && !settingsLoaded.current) {
      settingsLoaded.current = true;
      if (dbSettings.platformName) setSettingsPlatformName(dbSettings.platformName);
      if (dbSettings.contactEmail) setSettingsContactEmail(dbSettings.contactEmail);
      if (dbSettings.supportEmail) setSettingsSupportEmail(dbSettings.supportEmail);
      if (dbSettings.phone) setSettingsPhone(dbSettings.phone);
      if (dbSettings.address) setSettingsAddress(dbSettings.address);
      if (dbSettings.commission) setSettingsCommission(dbSettings.commission);
      if (dbSettings.currency) setSettingsCurrency(dbSettings.currency);
      if (dbSettings.language) setSettingsLanguage(dbSettings.language);
      if (dbSettings.notifNewArtisan) setSettingsNotifNewArtisan(dbSettings.notifNewArtisan === "true");
      if (dbSettings.notifNewProject) setSettingsNotifNewProject(dbSettings.notifNewProject === "true");
      if (dbSettings.notifMessages) setSettingsNotifMessages(dbSettings.notifMessages === "true");
      if (dbSettings.notifPayments) setSettingsNotifPayments(dbSettings.notifPayments === "true");
      if (dbSettings.autoApprove) setSettingsAutoApprove(dbSettings.autoApprove === "true");
      if (dbSettings.maintenanceMode) setSettingsMaintenanceMode(dbSettings.maintenanceMode === "true");
      if (dbSettings.maxUploadSize) setSettingsMaxUploadSize(dbSettings.maxUploadSize);
      if (dbSettings.minOrderAmount) setSettingsMinOrderAmount(dbSettings.minOrderAmount);
      if (dbSettings.siretRequired) setSettingsSiretRequired(dbSettings.siretRequired === "true");
      if (dbSettings.idRequired) setSettingsIdRequired(dbSettings.idRequired === "true");
      if (dbSettings.subscriptionPrice) setSettingsSubscriptionPrice(dbSettings.subscriptionPrice);
      if (dbSettings.trialDays) setSettingsTrialDays(dbSettings.trialDays);
    }
  }, [dbSettings]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const res = await apiRequest("POST", "/api/admin/settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: "Paramètres sauvegardés", description: "Les modifications ont été enregistrées avec succès." });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de sauvegarder les paramètres.", variant: "destructive" });
    },
  });

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
    { id: "c1", name: "Marc Antoine", location: "Paris, 75003", specialty: "Tailleur Homme", status: "Vérifié", selected: false,
      firstName: "Marc", lastName: "Antoine", birthDate: "15/03/1985", nationality: "Française", idType: "CNI", idNumber: "850315 123 456 78",
      phone: "+33 6 12 34 56 78", email: "marc.antoine@atelier-ma.fr", address: "12 Rue du Temple, 75003 Paris",
      siret: "823 456 789 00012", companyName: "Atelier Marc Antoine", legalForm: "SARL", tvaNumber: "FR 12 823456789",
      iban: "FR76 3000 4012 3400 0100 0567 890", registrationDate: "15/01/2026", yearsExperience: 18,
      bio: "Tailleur homme spécialisé dans le costume sur mesure et la chemise. Formation aux Arts et Métiers de Paris." },
    { id: "c2", name: "Hélène Beaumont", location: "Lyon, 69002", specialty: "Robe de Mariée", status: "En attente", selected: false,
      firstName: "Hélène", lastName: "Beaumont", birthDate: "22/07/1990", nationality: "Française", idType: "CNI", idNumber: "900722 654 321 09",
      phone: "+33 6 98 76 54 32", email: "helene@beaumont-couture.fr", address: "45 Rue de la République, 69002 Lyon",
      siret: "912 345 678 00023", companyName: "Beaumont Couture", legalForm: "Auto-entrepreneur", tvaNumber: "N/A",
      iban: "FR76 2004 1010 0505 0002 3456 789", registrationDate: "05/02/2026", yearsExperience: 8,
      bio: "Créatrice de robes de mariée sur mesure. Diplômée de l'École de la Chambre Syndicale de la Couture Parisienne." },
    { id: "c3", name: "Lucie Valentin", location: "Marseille, 13001", specialty: "Retouches Premium", status: "Vérifié", selected: false,
      firstName: "Lucie", lastName: "Valentin", birthDate: "10/11/1982", nationality: "Française", idType: "CNI", idNumber: "821110 987 654 32",
      phone: "+33 6 55 44 33 22", email: "lucie@valentin-retouches.fr", address: "8 Cours Julien, 13001 Marseille",
      siret: "734 567 890 00034", companyName: "Valentin Retouches Premium", legalForm: "EI", tvaNumber: "FR 34 734567890",
      iban: "FR76 1234 5678 9012 3456 7890 123", registrationDate: "20/12/2025", yearsExperience: 22,
      bio: "Retoucheuse experte, 22 ans d'expérience en haute couture et prêt-à-porter de luxe. Clientèle internationale." },
    { id: "c4", name: "Pierre Delacroix", location: "Bordeaux, 33000", specialty: "Haute Couture", status: "En attente", selected: false,
      firstName: "Pierre", lastName: "Delacroix", birthDate: "03/05/1978", nationality: "Française", idType: "Passeport", idNumber: "19FR78543",
      phone: "+33 6 11 22 33 44", email: "pierre@maison-delacroix.fr", address: "27 Cours de l'Intendance, 33000 Bordeaux",
      siret: "645 678 901 00045", companyName: "Maison Delacroix", legalForm: "SAS", tvaNumber: "FR 45 645678901",
      iban: "FR76 4321 0987 6543 2109 8765 432", registrationDate: "08/02/2026", yearsExperience: 25,
      bio: "Maître tailleur haute couture. Ancien collaborateur de grandes maisons parisiennes. Spécialiste du sur-mesure d'exception." },
    { id: "c5", name: "Amina Kouyaté", location: "Paris, 75020", specialty: "Couture Africaine", status: "Vérifié", selected: false,
      firstName: "Amina", lastName: "Kouyaté", birthDate: "18/09/1988", nationality: "Française", idType: "CNI", idNumber: "880918 456 789 01",
      phone: "+33 6 77 88 99 00", email: "amina@kouyate-wax.fr", address: "15 Rue des Pyrénées, 75020 Paris",
      siret: "556 789 012 00056", companyName: "Amina K. Créations", legalForm: "Auto-entrepreneur", tvaNumber: "N/A",
      iban: "FR76 5678 9012 3456 7890 1234 567", registrationDate: "10/01/2026", yearsExperience: 12,
      bio: "Créatrice spécialisée en wax et tissus africains. Mélange de couture traditionnelle et design contemporain." },
    { id: "c6", name: "Fatou Diallo", location: "Toulouse, 31000", specialty: "Couture Traditionnelle", status: "Non vérifié", selected: false,
      firstName: "Fatou", lastName: "Diallo", birthDate: "25/12/1992", nationality: "Française", idType: "Titre de séjour", idNumber: "TS-2024-876543",
      phone: "+33 6 33 22 11 00", email: "fatou.diallo@gmail.com", address: "3 Place du Capitole, 31000 Toulouse",
      siret: "En cours d'immatriculation", companyName: "Fatou Couture", legalForm: "Auto-entrepreneur", tvaNumber: "N/A",
      iban: "FR76 8901 2345 6789 0123 4567 890", registrationDate: "01/02/2026", yearsExperience: 6,
      bio: "Couturière traditionnelle, spécialisée dans les tenues de cérémonie et les boubous brodés." },
    { id: "c7", name: "Olivier Masse", location: "Nice, 06000", specialty: "Costume Sur Mesure", status: "Vérifié", selected: false,
      firstName: "Olivier", lastName: "Masse", birthDate: "07/01/1975", nationality: "Française", idType: "CNI", idNumber: "750107 321 654 98",
      phone: "+33 6 44 55 66 77", email: "olivier@masse-tailor.fr", address: "22 Promenade des Anglais, 06000 Nice",
      siret: "467 890 123 00067", companyName: "Masse Tailor", legalForm: "SARL", tvaNumber: "FR 67 467890123",
      iban: "FR76 6789 0123 4567 8901 2345 678", registrationDate: "12/11/2025", yearsExperience: 28,
      bio: "Tailleur de renom sur la Côte d'Azur. Spécialiste du costume italien et britannique. Clientèle internationale." },
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
    const artisan = artisans.find(a => a.id === id);
    updateArtisanMutation.mutate({ id, data: { status: "Vérifié" } }, {
      onSuccess: () => toast({ title: "Artisan approuvé", description: `${artisan?.name} est maintenant vérifié.` }),
    });
  };

  const rejectArtisan = (id: string) => {
    const artisan = artisans.find(a => a.id === id);
    updateArtisanMutation.mutate({ id, data: { status: "Rejeté" } }, {
      onSuccess: () => toast({ title: "Artisan rejeté", description: `${artisan?.name} a été rejeté.`, variant: "destructive" }),
    });
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

  const openCouturierDialog = (id: string, mode: "view" | "edit") => {
    const c = couturiers.find(ct => ct.id === id);
    if (!c) return;
    setCouturierDialogId(id);
    setCouturierDialogMode(mode);
    if (mode === "edit") {
      setEditForm({ ...c });
    }
  };

  const closeCouturierDialog = () => {
    setCouturierDialogId(null);
    setCouturierDialogMode(null);
    setEditForm({});
  };

  const saveCouturierEdit = () => {
    if (!couturierDialogId) return;
    setCouturiers(prev => prev.map(c =>
      c.id === couturierDialogId ? { ...c, ...editForm, name: `${editForm.firstName || c.firstName} ${editForm.lastName || c.lastName}` } : c
    ));
    toast({ title: "Profil mis à jour", description: "Les informations du couturier ont été enregistrées." });
    closeCouturierDialog();
  };

  const dialogCouturier = couturiers.find(c => c.id === couturierDialogId);

  const openArtisanDossier = (id: string, mode: "view" | "edit") => {
    const a = artisans.find(ar => ar.id === id);
    if (!a) return;
    setArtisanDossierId(id);
    setArtisanDossierMode(mode);
    if (mode === "edit") {
      setArtisanEditForm({ ...a });
    }
  };

  const closeArtisanDossier = () => {
    setArtisanDossierId(null);
    setArtisanDossierMode(null);
    setArtisanEditForm({});
  };

  const saveArtisanEdit = () => {
    if (!artisanDossierId) return;
    updateArtisanMutation.mutate({ id: artisanDossierId, data: artisanEditForm }, {
      onSuccess: () => {
        toast({ title: "Dossier mis à jour", description: "Les informations de l'artisan ont été enregistrées." });
        closeArtisanDossier();
      },
    });
  };

  const dossierArtisan = artisans.find(a => a.id === artisanDossierId);

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
                <SidebarMenuButton onClick={() => setActiveTab("settings")} data-testid="button-admin-settings" className={cn(activeTab === "settings" && "bg-[#722F37] text-white")}>
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
                                  <Button size="sm" variant="outline" className="h-8 text-[11px]" onClick={() => openCouturierDialog(c.id, "edit")} data-testid={`button-edit-couturier-${c.id}`}>
                                    <Pencil size={14} className="mr-1" /> Editer
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-8 text-[11px]" onClick={() => openCouturierDialog(c.id, "view")} data-testid={`button-view-couturier-${c.id}`}>
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

                  <Dialog open={!!couturierDialogId && !!couturierDialogMode} onOpenChange={(open) => !open && closeCouturierDialog()}>
                    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="dialog-couturier-detail">
                      {dialogCouturier && couturierDialogMode === "view" && (
                        <>
                          <DialogHeader>
                            <DialogTitle className="font-serif text-lg flex items-center gap-3" data-testid="text-couturier-dialog-name">
                              <div className="w-10 h-10 rounded-full bg-[#722F37]/10 flex items-center justify-center text-[#722F37] font-bold flex-shrink-0">{dialogCouturier.firstName[0]}{dialogCouturier.lastName[0]}</div>
                              {dialogCouturier.firstName} {dialogCouturier.lastName}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-5 pt-2">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <Badge className={cn("text-[10px] border-none font-bold", dialogCouturier.status === "Vérifié" ? "bg-green-100 text-green-700" : dialogCouturier.status === "En attente" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500")} data-testid="badge-couturier-dialog-status">{dialogCouturier.status}</Badge>
                              <span className="text-xs text-gray-400" data-testid="text-couturier-registration">Inscrit le {dialogCouturier.registrationDate}</span>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                              <p className="text-xs font-bold uppercase tracking-wider text-[#722F37] mb-3 flex items-center gap-2">
                                <User size={14} /> Carte d'identité
                              </p>
                              <div className="grid grid-cols-2 gap-x-6 gap-y-2" data-testid="grid-couturier-identity">
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">Prénom</span>
                                  <span className="text-sm font-semibold text-gray-900" data-testid="text-couturier-firstname">{dialogCouturier.firstName}</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">Nom</span>
                                  <span className="text-sm font-semibold text-gray-900" data-testid="text-couturier-lastname">{dialogCouturier.lastName}</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">Date de naissance</span>
                                  <span className="text-sm font-semibold text-gray-900" data-testid="text-couturier-birthdate">{dialogCouturier.birthDate}</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">Nationalité</span>
                                  <span className="text-sm font-semibold text-gray-900" data-testid="text-couturier-nationality">{dialogCouturier.nationality}</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">Type de pièce</span>
                                  <span className="text-sm font-semibold text-gray-900" data-testid="text-couturier-idtype">{dialogCouturier.idType}</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">N° pièce</span>
                                  <span className="text-sm font-semibold text-gray-900" data-testid="text-couturier-idnumber">{dialogCouturier.idNumber}</span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                              <p className="text-xs font-bold uppercase tracking-wider text-[#722F37] mb-3 flex items-center gap-2">
                                <Building2 size={14} /> Informations Entreprise
                              </p>
                              <div className="grid grid-cols-2 gap-x-6 gap-y-2" data-testid="grid-couturier-business">
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">Raison sociale</span>
                                  <span className="text-sm font-semibold text-gray-900" data-testid="text-couturier-company">{dialogCouturier.companyName}</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">Forme juridique</span>
                                  <span className="text-sm font-semibold text-gray-900" data-testid="text-couturier-legalform">{dialogCouturier.legalForm}</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">SIRET</span>
                                  <span className="text-sm font-semibold text-gray-900" data-testid="text-couturier-siret">{dialogCouturier.siret}</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">N° TVA</span>
                                  <span className="text-sm font-semibold text-gray-900" data-testid="text-couturier-tva">{dialogCouturier.tvaNumber}</span>
                                </div>
                                <div className="col-span-2 flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">Adresse</span>
                                  <span className="text-sm font-semibold text-gray-900" data-testid="text-couturier-address">{dialogCouturier.address}</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">IBAN</span>
                                  <span className="text-sm font-semibold text-gray-900 text-[11px]" data-testid="text-couturier-iban">{dialogCouturier.iban}</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">Spécialité</span>
                                  <span className="text-sm font-semibold text-gray-900" data-testid="text-couturier-specialty">{dialogCouturier.specialty}</span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                              <p className="text-xs font-bold uppercase tracking-wider text-[#722F37] mb-3 flex items-center gap-2">
                                <Phone size={14} /> Contact & Profil
                              </p>
                              <div className="grid grid-cols-2 gap-x-6 gap-y-2" data-testid="grid-couturier-contact">
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">Téléphone</span>
                                  <span className="text-sm font-semibold text-gray-900" data-testid="text-couturier-phone">{dialogCouturier.phone}</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">Email</span>
                                  <span className="text-sm font-semibold text-gray-900" data-testid="text-couturier-email">{dialogCouturier.email}</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">Expérience</span>
                                  <span className="text-sm font-semibold text-gray-900" data-testid="text-couturier-experience">{dialogCouturier.yearsExperience} ans</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">Localisation</span>
                                  <span className="text-sm font-semibold text-gray-900" data-testid="text-couturier-location">{dialogCouturier.location}</span>
                                </div>
                                <div className="col-span-2 py-1.5">
                                  <span className="text-xs text-gray-500">Bio</span>
                                  <p className="text-sm text-gray-700 mt-1 leading-relaxed" data-testid="text-couturier-bio">{dialogCouturier.bio}</p>
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-gray-100 gap-3 flex-wrap">
                              <Button variant="outline" size="sm" onClick={() => { closeCouturierDialog(); openCouturierDialog(dialogCouturier.id, "edit"); }} data-testid="button-switch-to-edit">
                                <Pencil size={14} className="mr-1" /> Editer
                              </Button>
                              <Button variant="outline" size="sm" onClick={closeCouturierDialog} data-testid="button-close-couturier-dialog">Fermer</Button>
                            </div>
                          </div>
                        </>
                      )}

                      {dialogCouturier && couturierDialogMode === "edit" && (
                        <>
                          <DialogHeader>
                            <DialogTitle className="font-serif text-lg flex items-center gap-3" data-testid="text-couturier-edit-title">
                              <Pencil size={20} className="text-[#722F37]" />
                              Éditer - {dialogCouturier.firstName} {dialogCouturier.lastName}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-5 pt-2">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-[#722F37] mb-3 flex items-center gap-2">
                                <User size={14} /> Identité
                              </p>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-gray-500">Prénom</label>
                                  <Input value={editForm.firstName || ""} onChange={e => setEditForm(p => ({ ...p, firstName: e.target.value }))} className="h-9 text-sm" data-testid="input-edit-firstname" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-gray-500">Nom</label>
                                  <Input value={editForm.lastName || ""} onChange={e => setEditForm(p => ({ ...p, lastName: e.target.value }))} className="h-9 text-sm" data-testid="input-edit-lastname" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-gray-500">Date de naissance</label>
                                  <Input value={editForm.birthDate || ""} onChange={e => setEditForm(p => ({ ...p, birthDate: e.target.value }))} className="h-9 text-sm" data-testid="input-edit-birthdate" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-gray-500">Nationalité</label>
                                  <Input value={editForm.nationality || ""} onChange={e => setEditForm(p => ({ ...p, nationality: e.target.value }))} className="h-9 text-sm" data-testid="input-edit-nationality" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-gray-500">Type de pièce d'identité</label>
                                  <Input value={editForm.idType || ""} onChange={e => setEditForm(p => ({ ...p, idType: e.target.value }))} className="h-9 text-sm" data-testid="input-edit-idtype" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-gray-500">N° pièce d'identité</label>
                                  <Input value={editForm.idNumber || ""} onChange={e => setEditForm(p => ({ ...p, idNumber: e.target.value }))} className="h-9 text-sm" data-testid="input-edit-idnumber" />
                                </div>
                              </div>
                            </div>

                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-[#722F37] mb-3 flex items-center gap-2">
                                <Building2 size={14} /> Entreprise
                              </p>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-gray-500">Raison sociale</label>
                                  <Input value={editForm.companyName || ""} onChange={e => setEditForm(p => ({ ...p, companyName: e.target.value }))} className="h-9 text-sm" data-testid="input-edit-company" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-gray-500">Forme juridique</label>
                                  <Input value={editForm.legalForm || ""} onChange={e => setEditForm(p => ({ ...p, legalForm: e.target.value }))} className="h-9 text-sm" data-testid="input-edit-legalform" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-gray-500">SIRET</label>
                                  <Input value={editForm.siret || ""} onChange={e => setEditForm(p => ({ ...p, siret: e.target.value }))} className="h-9 text-sm" data-testid="input-edit-siret" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-gray-500">N° TVA</label>
                                  <Input value={editForm.tvaNumber || ""} onChange={e => setEditForm(p => ({ ...p, tvaNumber: e.target.value }))} className="h-9 text-sm" data-testid="input-edit-tva" />
                                </div>
                                <div className="col-span-2 space-y-1">
                                  <label className="text-[11px] font-medium text-gray-500">Adresse</label>
                                  <Input value={editForm.address || ""} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} className="h-9 text-sm" data-testid="input-edit-address" />
                                </div>
                                <div className="col-span-2 space-y-1">
                                  <label className="text-[11px] font-medium text-gray-500">IBAN</label>
                                  <Input value={editForm.iban || ""} onChange={e => setEditForm(p => ({ ...p, iban: e.target.value }))} className="h-9 text-sm" data-testid="input-edit-iban" />
                                </div>
                              </div>
                            </div>

                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-[#722F37] mb-3 flex items-center gap-2">
                                <Phone size={14} /> Contact & Profil
                              </p>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-gray-500">Téléphone</label>
                                  <Input value={editForm.phone || ""} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} className="h-9 text-sm" data-testid="input-edit-phone" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-gray-500">Email</label>
                                  <Input value={editForm.email || ""} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} className="h-9 text-sm" data-testid="input-edit-email" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-gray-500">Spécialité</label>
                                  <Input value={editForm.specialty || ""} onChange={e => setEditForm(p => ({ ...p, specialty: e.target.value }))} className="h-9 text-sm" data-testid="input-edit-specialty" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-gray-500">Localisation</label>
                                  <Input value={editForm.location || ""} onChange={e => setEditForm(p => ({ ...p, location: e.target.value }))} className="h-9 text-sm" data-testid="input-edit-location" />
                                </div>
                                <div className="col-span-2 space-y-1">
                                  <label className="text-[11px] font-medium text-gray-500">Bio</label>
                                  <Textarea value={editForm.bio || ""} onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))} className="min-h-[80px] text-sm" data-testid="input-edit-bio" />
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                              <Button variant="outline" size="sm" onClick={closeCouturierDialog} data-testid="button-cancel-edit">Annuler</Button>
                              <Button size="sm" className="bg-[#722F37] font-bold" onClick={saveCouturierEdit} data-testid="button-save-couturier">
                                <CheckCircle size={14} className="mr-1" /> Enregistrer
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
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

                  <Dialog open={showAddArtisan} onOpenChange={setShowAddArtisan}>
                    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="dialog-add-artisan">
                      <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-[#722F37]">Ajouter un artisan</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Prénom *</label>
                            <Input value={newArtisan.firstName} onChange={e => setNewArtisan({...newArtisan, firstName: e.target.value})} className="mt-1 h-9 text-sm" data-testid="input-new-artisan-firstname" />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Nom *</label>
                            <Input value={newArtisan.lastName} onChange={e => setNewArtisan({...newArtisan, lastName: e.target.value})} className="mt-1 h-9 text-sm" data-testid="input-new-artisan-lastname" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Spécialité *</label>
                            <select value={newArtisan.specialty} onChange={e => setNewArtisan({...newArtisan, specialty: e.target.value})} className="mt-1 w-full h-9 text-sm border border-gray-200 rounded-md px-3 bg-white" data-testid="select-new-artisan-specialty">
                              <option value="">Choisir...</option>
                              <option value="Tailleur Homme">Tailleur Homme</option>
                              <option value="Robe de Mariée">Robe de Mariée</option>
                              <option value="Retouches Premium">Retouches Premium</option>
                              <option value="Haute Couture">Haute Couture</option>
                              <option value="Couture Africaine">Couture Africaine</option>
                              <option value="Couture Traditionnelle">Couture Traditionnelle</option>
                              <option value="Prêt-à-porter">Prêt-à-porter</option>
                              <option value="Accessoires">Accessoires</option>
                              <option value="Autre">Autre</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Ville *</label>
                            <Input value={newArtisan.city} onChange={e => setNewArtisan({...newArtisan, city: e.target.value})} className="mt-1 h-9 text-sm" data-testid="input-new-artisan-city" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Email</label>
                            <Input value={newArtisan.email} onChange={e => setNewArtisan({...newArtisan, email: e.target.value})} className="mt-1 h-9 text-sm" data-testid="input-new-artisan-email" />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Téléphone</label>
                            <Input value={newArtisan.phone} onChange={e => setNewArtisan({...newArtisan, phone: e.target.value})} className="mt-1 h-9 text-sm" data-testid="input-new-artisan-phone" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">SIRET</label>
                            <Input value={newArtisan.siret} onChange={e => setNewArtisan({...newArtisan, siret: e.target.value})} className="mt-1 h-9 text-sm" data-testid="input-new-artisan-siret" />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Statut</label>
                            <select value={newArtisan.status} onChange={e => setNewArtisan({...newArtisan, status: e.target.value as any})} className="mt-1 w-full h-9 text-sm border border-gray-200 rounded-md px-3 bg-white" data-testid="select-new-artisan-status">
                              <option value="En attente">En attente</option>
                              <option value="Vérifié">Vérifié</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Raison sociale</label>
                            <Input value={newArtisan.companyName} onChange={e => setNewArtisan({...newArtisan, companyName: e.target.value})} className="mt-1 h-9 text-sm" data-testid="input-new-artisan-company" />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Forme juridique</label>
                            <select value={newArtisan.legalForm} onChange={e => setNewArtisan({...newArtisan, legalForm: e.target.value})} className="mt-1 w-full h-9 text-sm border border-gray-200 rounded-md px-3 bg-white" data-testid="select-new-artisan-legalform">
                              <option value="">Choisir...</option>
                              <option value="Auto-entrepreneur">Auto-entrepreneur</option>
                              <option value="EI">EI</option>
                              <option value="SARL">SARL</option>
                              <option value="SAS">SAS</option>
                              <option value="SASU">SASU</option>
                              <option value="EURL">EURL</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Adresse</label>
                          <Input value={newArtisan.address} onChange={e => setNewArtisan({...newArtisan, address: e.target.value})} className="mt-1 h-9 text-sm" data-testid="input-new-artisan-address" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Plan d'abonnement</label>
                            <select value={newArtisan.subscriptionPlan} onChange={e => setNewArtisan({...newArtisan, subscriptionPlan: e.target.value})} className="mt-1 w-full h-9 text-sm border border-gray-200 rounded-md px-3 bg-white" data-testid="select-new-artisan-subscription">
                              <option value="Mensuel">Mensuel</option>
                              <option value="Annuel">Annuel</option>
                              <option value="Essai gratuit">Essai gratuit</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Statut de paiement</label>
                            <select value={newArtisan.paymentStatus} onChange={e => setNewArtisan({...newArtisan, paymentStatus: e.target.value})} className="mt-1 w-full h-9 text-sm border border-gray-200 rounded-md px-3 bg-white" data-testid="select-new-artisan-payment-status">
                              <option value="En attente">En attente</option>
                              <option value="Payé">Payé</option>
                              <option value="En retard">En retard</option>
                              <option value="Expiré">Expiré</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Bio / Présentation</label>
                          <Textarea value={newArtisan.bio} onChange={e => setNewArtisan({...newArtisan, bio: e.target.value})} className="mt-1 text-sm" rows={2} data-testid="input-new-artisan-bio" />
                        </div>
                      </div>
                      <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowAddArtisan(false)} data-testid="button-cancel-add-artisan">Annuler</Button>
                        <Button
                          className="bg-[#722F37] hover:bg-[#5a252c] text-white font-bold"
                          disabled={!newArtisan.firstName || !newArtisan.lastName || !newArtisan.specialty || !newArtisan.city || createArtisanMutation.isPending}
                          onClick={() => {
                            createArtisanMutation.mutate({
                              ...newArtisan,
                              joinDate: new Date().toLocaleDateString("fr-FR"),
                            });
                          }}
                          data-testid="button-confirm-add-artisan"
                        >
                          {createArtisanMutation.isPending ? "Ajout..." : "Ajouter"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Card className="border-none shadow-sm overflow-hidden bg-white">
                    <div className="p-5 border-b border-gray-50 flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex gap-2 flex-wrap">
                        <Badge className="bg-green-50 text-green-700 border-none px-3 py-1" data-testid="badge-verified-artisans">{artisans.filter(a => a.status === "Vérifié").length} vérifiés</Badge>
                        <Badge className="bg-amber-50 text-amber-700 border-none px-3 py-1" data-testid="badge-pending-artisans">{artisans.filter(a => a.status === "En attente").length} en attente</Badge>
                        <Badge className="bg-red-50 text-red-600 border-none px-3 py-1" data-testid="badge-rejected-artisans">{artisans.filter(a => a.status === "Rejeté").length} rejetés</Badge>
                        <Badge className="bg-purple-50 text-purple-700 border-none px-3 py-1" data-testid="badge-paid-artisans">{artisans.filter(a => a.paymentStatus === "Payé").length} abonnés à jour</Badge>
                      </div>
                      <div className="flex gap-2 items-center flex-wrap">
                        <Button size="sm" className="bg-[#722F37] hover:bg-[#5a252c] text-white font-bold text-xs" onClick={() => setShowAddArtisan(true)} data-testid="button-add-artisan">
                          <PlusCircle size={14} className="mr-1" /> Ajouter un artisan
                        </Button>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input placeholder="Nom, spécialité ou ville..." value={artisanSearch} onChange={e => setArtisanSearch(e.target.value)} className="pl-10 w-72 h-9 text-sm" data-testid="input-search-artisans" />
                        </div>
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
                            <th className="px-5 py-3 font-bold text-center">Abonnement</th>
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
                                <div className="flex flex-col items-center gap-1">
                                  <Badge className={cn("text-[10px] border-none font-bold", a.paymentStatus === "Payé" ? "bg-green-100 text-green-700" : a.paymentStatus === "En retard" ? "bg-red-100 text-red-600" : a.paymentStatus === "Expiré" ? "bg-gray-200 text-gray-500" : "bg-amber-100 text-amber-700")} data-testid={`badge-artisan-payment-${a.id}`}>{a.paymentStatus}</Badge>
                                  <span className="text-[9px] text-gray-400">{a.subscriptionPlan}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-center">
                                <Badge className={cn("text-[10px] border-none font-bold", a.status === "Vérifié" ? "bg-green-100 text-green-700" : a.status === "Rejeté" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700")} data-testid={`badge-artisan-status-${a.id}`}>{a.status}</Badge>
                              </td>
                              <td className="px-5 py-3 text-right">
                                {a.status === "En attente" ? (
                                  <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="outline" className="h-8 text-[11px]" onClick={() => openArtisanDossier(a.id, "view")} data-testid={`button-dossier-${a.id}`}>
                                      <Eye size={14} className="mr-1" /> Dossier
                                    </Button>
                                    <Button size="sm" className="bg-[#722F37] h-8 text-[11px] font-bold" onClick={() => approveArtisan(a.id)} data-testid={`button-approve-${a.id}`}>
                                      <CheckCircle size={14} className="mr-1" /> Approuver
                                    </Button>
                                    <Button size="sm" variant="destructive" className="h-8 text-[11px]" onClick={() => rejectArtisan(a.id)} data-testid={`button-reject-${a.id}`}>
                                      <XCircle size={14} className="mr-1" /> Rejeter
                                    </Button>
                                  </div>
                                ) : (
                                  <Button size="sm" variant="outline" className="h-8 text-[11px]" onClick={() => openArtisanDossier(a.id, "view")} data-testid={`button-dossier-${a.id}`}>
                                    <Eye size={14} className="mr-1" /> Dossier
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                          {artisansLoading && (
                            <tr><td colSpan={8} className="px-5 py-8 text-center text-sm text-gray-400">Chargement...</td></tr>
                          )}
                          {!artisansLoading && filteredArtisans.length === 0 && (
                            <tr><td colSpan={8} className="px-5 py-8 text-center text-sm text-gray-400">
                              {artisans.length === 0 ? "Aucun artisan. Cliquez sur \"Ajouter un artisan\" pour commencer." : "Aucun résultat"}
                            </td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  <Dialog open={!!artisanDossierId && !!artisanDossierMode} onOpenChange={(open) => !open && closeArtisanDossier()}>
                    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="dialog-artisan-dossier">
                      {dossierArtisan && artisanDossierMode === "view" && (
                        <>
                          <DialogHeader>
                            <DialogTitle className="font-serif text-lg flex items-center gap-3" data-testid="text-artisan-dossier-name">
                              <div className="w-10 h-10 rounded-full bg-[#722F37]/10 flex items-center justify-center text-[#722F37] font-bold flex-shrink-0">{dossierArtisan.firstName[0]}{dossierArtisan.lastName[0]}</div>
                              {dossierArtisan.firstName} {dossierArtisan.lastName}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-5 pt-2">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <div className="flex gap-2 flex-wrap">
                                <Badge className={cn("text-[10px] border-none font-bold", dossierArtisan.status === "Vérifié" ? "bg-green-100 text-green-700" : dossierArtisan.status === "Rejeté" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700")} data-testid="badge-artisan-dossier-status">{dossierArtisan.status}</Badge>
                                <Badge variant="outline" className="text-[10px]" data-testid="badge-artisan-dossier-specialty">{dossierArtisan.specialty}</Badge>
                              </div>
                              <span className="text-xs text-gray-400" data-testid="text-artisan-joindate">Inscrit le {dossierArtisan.joinDate}</span>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                              <p className="text-xs font-bold uppercase tracking-wider text-[#722F37] mb-3 flex items-center gap-2">
                                <User size={14} /> Carte d'identité
                              </p>
                              <div className="grid grid-cols-2 gap-x-6 gap-y-2" data-testid="grid-artisan-identity">
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">Prénom</span>
                                  <span className="text-sm font-semibold text-gray-900" data-testid="text-artisan-firstname">{dossierArtisan.firstName}</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">Nom</span>
                                  <span className="text-sm font-semibold text-gray-900" data-testid="text-artisan-lastname">{dossierArtisan.lastName}</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">Date de naissance</span>
                                  <span className="text-sm font-semibold text-gray-900" data-testid="text-artisan-birthdate">{dossierArtisan.birthDate}</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">Nationalité</span>
                                  <span className="text-sm font-semibold text-gray-900" data-testid="text-artisan-nationality">{dossierArtisan.nationality}</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">Type de pièce</span>
                                  <span className="text-sm font-semibold text-gray-900" data-testid="text-artisan-idtype">{dossierArtisan.idType}</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">N° pièce</span>
                                  <span className="text-sm font-semibold text-gray-900" data-testid="text-artisan-idnumber">{dossierArtisan.idNumber}</span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                              <p className="text-xs font-bold uppercase tracking-wider text-[#722F37] mb-3 flex items-center gap-2">
                                <Building2 size={14} /> Informations Entreprise
                              </p>
                              <div className="grid grid-cols-2 gap-x-6 gap-y-2" data-testid="grid-artisan-business">
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">Raison sociale</span>
                                  <span className="text-sm font-semibold text-gray-900" data-testid="text-artisan-company">{dossierArtisan.companyName}</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">Forme juridique</span>
                                  <span className="text-sm font-semibold text-gray-900" data-testid="text-artisan-legalform">{dossierArtisan.legalForm}</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">SIRET</span>
                                  <span className="text-sm font-semibold text-gray-900" data-testid="text-artisan-siret">{dossierArtisan.siret}</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">N° TVA</span>
                                  <span className="text-sm font-semibold text-gray-900" data-testid="text-artisan-tva">{dossierArtisan.tvaNumber}</span>
                                </div>
                                <div className="col-span-2 flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">Adresse</span>
                                  <span className="text-sm font-semibold text-gray-900" data-testid="text-artisan-address">{dossierArtisan.address}</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">IBAN</span>
                                  <span className="text-sm font-semibold text-gray-900 text-[11px]" data-testid="text-artisan-iban">{dossierArtisan.iban}</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">Spécialité</span>
                                  <span className="text-sm font-semibold text-gray-900" data-testid="text-artisan-specialty">{dossierArtisan.specialty}</span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                              <p className="text-xs font-bold uppercase tracking-wider text-[#722F37] mb-3 flex items-center gap-2">
                                <Phone size={14} /> Contact & Profil
                              </p>
                              <div className="grid grid-cols-2 gap-x-6 gap-y-2" data-testid="grid-artisan-contact">
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">Téléphone</span>
                                  <span className="text-sm font-semibold text-gray-900" data-testid="text-artisan-phone">{dossierArtisan.phone}</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">Email</span>
                                  <span className="text-sm font-semibold text-gray-900" data-testid="text-artisan-email">{dossierArtisan.email}</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">Expérience</span>
                                  <span className="text-sm font-semibold text-gray-900" data-testid="text-artisan-experience">{dossierArtisan.yearsExperience} ans</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">Ville</span>
                                  <span className="text-sm font-semibold text-gray-900" data-testid="text-artisan-city">{dossierArtisan.city}</span>
                                </div>
                                <div className="col-span-2 py-1.5">
                                  <span className="text-xs text-gray-500">Bio</span>
                                  <p className="text-sm text-gray-700 mt-1 leading-relaxed" data-testid="text-artisan-bio">{dossierArtisan.bio}</p>
                                </div>
                              </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                              <p className="text-xs font-bold uppercase tracking-wider text-[#722F37] mb-3 flex items-center gap-2">
                                <CreditCard size={14} /> Abonnement
                              </p>
                              <div className="grid grid-cols-2 gap-x-6 gap-y-2" data-testid="grid-artisan-subscription">
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">Plan</span>
                                  <span className="text-sm font-semibold text-gray-900" data-testid="text-artisan-subscription-plan">{dossierArtisan.subscriptionPlan}</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">Statut de paiement</span>
                                  <Badge className={cn("text-[10px] border-none font-bold", dossierArtisan.paymentStatus === "Payé" ? "bg-green-100 text-green-700" : dossierArtisan.paymentStatus === "En retard" ? "bg-red-100 text-red-600" : dossierArtisan.paymentStatus === "Expiré" ? "bg-gray-200 text-gray-500" : "bg-amber-100 text-amber-700")} data-testid="badge-artisan-dossier-payment">{dossierArtisan.paymentStatus}</Badge>
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-gray-100 gap-3 flex-wrap">
                              <Button variant="outline" size="sm" onClick={() => { closeArtisanDossier(); openArtisanDossier(dossierArtisan.id, "edit"); }} data-testid="button-artisan-switch-to-edit">
                                <Pencil size={14} className="mr-1" /> Editer
                              </Button>
                              <Button variant="outline" size="sm" onClick={closeArtisanDossier} data-testid="button-close-artisan-dossier">Fermer</Button>
                            </div>
                          </div>
                        </>
                      )}

                      {dossierArtisan && artisanDossierMode === "edit" && (
                        <>
                          <DialogHeader>
                            <DialogTitle className="font-serif text-lg flex items-center gap-3" data-testid="text-artisan-edit-title">
                              <Pencil size={20} className="text-[#722F37]" />
                              Éditer - {dossierArtisan.firstName} {dossierArtisan.lastName}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-5 pt-2">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-[#722F37] mb-3 flex items-center gap-2">
                                <User size={14} /> Identité
                              </p>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-gray-500">Prénom</label>
                                  <Input value={artisanEditForm.firstName || ""} onChange={e => setArtisanEditForm(p => ({ ...p, firstName: e.target.value }))} className="h-9 text-sm" data-testid="input-artisan-edit-firstname" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-gray-500">Nom</label>
                                  <Input value={artisanEditForm.lastName || ""} onChange={e => setArtisanEditForm(p => ({ ...p, lastName: e.target.value }))} className="h-9 text-sm" data-testid="input-artisan-edit-lastname" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-gray-500">Date de naissance</label>
                                  <Input value={artisanEditForm.birthDate || ""} onChange={e => setArtisanEditForm(p => ({ ...p, birthDate: e.target.value }))} className="h-9 text-sm" data-testid="input-artisan-edit-birthdate" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-gray-500">Nationalité</label>
                                  <Input value={artisanEditForm.nationality || ""} onChange={e => setArtisanEditForm(p => ({ ...p, nationality: e.target.value }))} className="h-9 text-sm" data-testid="input-artisan-edit-nationality" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-gray-500">Type de pièce d'identité</label>
                                  <Input value={artisanEditForm.idType || ""} onChange={e => setArtisanEditForm(p => ({ ...p, idType: e.target.value }))} className="h-9 text-sm" data-testid="input-artisan-edit-idtype" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-gray-500">N° pièce d'identité</label>
                                  <Input value={artisanEditForm.idNumber || ""} onChange={e => setArtisanEditForm(p => ({ ...p, idNumber: e.target.value }))} className="h-9 text-sm" data-testid="input-artisan-edit-idnumber" />
                                </div>
                              </div>
                            </div>

                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-[#722F37] mb-3 flex items-center gap-2">
                                <Building2 size={14} /> Entreprise
                              </p>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-gray-500">Raison sociale</label>
                                  <Input value={artisanEditForm.companyName || ""} onChange={e => setArtisanEditForm(p => ({ ...p, companyName: e.target.value }))} className="h-9 text-sm" data-testid="input-artisan-edit-company" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-gray-500">Forme juridique</label>
                                  <Input value={artisanEditForm.legalForm || ""} onChange={e => setArtisanEditForm(p => ({ ...p, legalForm: e.target.value }))} className="h-9 text-sm" data-testid="input-artisan-edit-legalform" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-gray-500">SIRET</label>
                                  <Input value={artisanEditForm.siret || ""} onChange={e => setArtisanEditForm(p => ({ ...p, siret: e.target.value }))} className="h-9 text-sm" data-testid="input-artisan-edit-siret" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-gray-500">N° TVA</label>
                                  <Input value={artisanEditForm.tvaNumber || ""} onChange={e => setArtisanEditForm(p => ({ ...p, tvaNumber: e.target.value }))} className="h-9 text-sm" data-testid="input-artisan-edit-tva" />
                                </div>
                                <div className="col-span-2 space-y-1">
                                  <label className="text-[11px] font-medium text-gray-500">Adresse</label>
                                  <Input value={artisanEditForm.address || ""} onChange={e => setArtisanEditForm(p => ({ ...p, address: e.target.value }))} className="h-9 text-sm" data-testid="input-artisan-edit-address" />
                                </div>
                                <div className="col-span-2 space-y-1">
                                  <label className="text-[11px] font-medium text-gray-500">IBAN</label>
                                  <Input value={artisanEditForm.iban || ""} onChange={e => setArtisanEditForm(p => ({ ...p, iban: e.target.value }))} className="h-9 text-sm" data-testid="input-artisan-edit-iban" />
                                </div>
                              </div>
                            </div>

                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-[#722F37] mb-3 flex items-center gap-2">
                                <Phone size={14} /> Contact & Profil
                              </p>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-gray-500">Téléphone</label>
                                  <Input value={artisanEditForm.phone || ""} onChange={e => setArtisanEditForm(p => ({ ...p, phone: e.target.value }))} className="h-9 text-sm" data-testid="input-artisan-edit-phone" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-gray-500">Email</label>
                                  <Input value={artisanEditForm.email || ""} onChange={e => setArtisanEditForm(p => ({ ...p, email: e.target.value }))} className="h-9 text-sm" data-testid="input-artisan-edit-email" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-gray-500">Spécialité</label>
                                  <Input value={artisanEditForm.specialty || ""} onChange={e => setArtisanEditForm(p => ({ ...p, specialty: e.target.value }))} className="h-9 text-sm" data-testid="input-artisan-edit-specialty" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-gray-500">Ville</label>
                                  <Input value={artisanEditForm.city || ""} onChange={e => setArtisanEditForm(p => ({ ...p, city: e.target.value }))} className="h-9 text-sm" data-testid="input-artisan-edit-city" />
                                </div>
                                <div className="col-span-2 space-y-1">
                                  <label className="text-[11px] font-medium text-gray-500">Bio</label>
                                  <Textarea value={artisanEditForm.bio || ""} onChange={e => setArtisanEditForm(p => ({ ...p, bio: e.target.value }))} className="min-h-[80px] text-sm" data-testid="input-artisan-edit-bio" />
                                </div>
                              </div>
                            </div>

                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-[#722F37] mb-3 flex items-center gap-2">
                                <CreditCard size={14} /> Abonnement
                              </p>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-gray-500">Plan d'abonnement</label>
                                  <select value={artisanEditForm.subscriptionPlan || "Mensuel"} onChange={e => setArtisanEditForm(p => ({ ...p, subscriptionPlan: e.target.value }))} className="w-full h-9 text-sm border border-gray-200 rounded-md px-3 bg-white" data-testid="select-artisan-edit-subscription">
                                    <option value="Mensuel">Mensuel</option>
                                    <option value="Annuel">Annuel</option>
                                    <option value="Essai gratuit">Essai gratuit</option>
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-gray-500">Statut de paiement</label>
                                  <select value={artisanEditForm.paymentStatus || "En attente"} onChange={e => setArtisanEditForm(p => ({ ...p, paymentStatus: e.target.value }))} className="w-full h-9 text-sm border border-gray-200 rounded-md px-3 bg-white" data-testid="select-artisan-edit-payment-status">
                                    <option value="En attente">En attente</option>
                                    <option value="Payé">Payé</option>
                                    <option value="En retard">En retard</option>
                                    <option value="Expiré">Expiré</option>
                                  </select>
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                              <Button variant="outline" size="sm" onClick={closeArtisanDossier} data-testid="button-artisan-cancel-edit">Annuler</Button>
                              <Button size="sm" className="bg-[#722F37] font-bold" onClick={saveArtisanEdit} data-testid="button-save-artisan-dossier">
                                <CheckCircle size={14} className="mr-1" /> Enregistrer
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </DialogContent>
                  </Dialog>
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

              {activeTab === "settings" && (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900" data-testid="text-settings-title">Paramètres</h2>
                      <p className="text-xs text-gray-500 mt-0.5">Configuration générale de la plateforme</p>
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2" data-testid="settings-grid">
                    <Card className="border-none shadow-sm" data-testid="card-settings-platform">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 rounded-md bg-[#722F37]/10 flex items-center justify-center">
                            <Globe size={16} className="text-[#722F37]" />
                          </div>
                          <h3 className="font-bold text-sm text-gray-800">Plateforme</h3>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Nom de la plateforme</label>
                            <Input value={settingsPlatformName} onChange={(e) => setSettingsPlatformName(e.target.value)} className="mt-1 h-9 text-sm" data-testid="input-settings-platform-name" />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Email de contact</label>
                            <Input value={settingsContactEmail} onChange={(e) => setSettingsContactEmail(e.target.value)} className="mt-1 h-9 text-sm" data-testid="input-settings-contact-email" />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Email support</label>
                            <Input value={settingsSupportEmail} onChange={(e) => setSettingsSupportEmail(e.target.value)} className="mt-1 h-9 text-sm" data-testid="input-settings-support-email" />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Téléphone</label>
                            <Input value={settingsPhone} onChange={(e) => setSettingsPhone(e.target.value)} className="mt-1 h-9 text-sm" data-testid="input-settings-phone" />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Adresse</label>
                            <Input value={settingsAddress} onChange={(e) => setSettingsAddress(e.target.value)} className="mt-1 h-9 text-sm" data-testid="input-settings-address" />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Langue par défaut</label>
                            <select value={settingsLanguage} onChange={(e) => setSettingsLanguage(e.target.value)} className="mt-1 w-full h-9 text-sm border border-gray-200 rounded-md px-3 bg-white" data-testid="select-settings-language">
                              <option value="fr">Français</option>
                              <option value="en">English</option>
                            </select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm" data-testid="card-settings-financial">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 rounded-md bg-green-50 flex items-center justify-center">
                            <CreditCard size={16} className="text-green-600" />
                          </div>
                          <h3 className="font-bold text-sm text-gray-800">Financier</h3>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Commission plateforme (%)</label>
                            <Input type="number" min="0" max="100" value={settingsCommission} onChange={(e) => setSettingsCommission(e.target.value)} className="mt-1 h-9 text-sm" data-testid="input-settings-commission" />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Devise</label>
                            <select value={settingsCurrency} onChange={(e) => setSettingsCurrency(e.target.value)} className="mt-1 w-full h-9 text-sm border border-gray-200 rounded-md px-3 bg-white" data-testid="select-settings-currency">
                              <option value="EUR">EUR (€)</option>
                              <option value="USD">USD ($)</option>
                              <option value="GBP">GBP (£)</option>
                              <option value="XOF">XOF (CFA)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Montant minimum de commande (€)</label>
                            <Input type="number" min="0" value={settingsMinOrderAmount} onChange={(e) => setSettingsMinOrderAmount(e.target.value)} className="mt-1 h-9 text-sm" data-testid="input-settings-min-order" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm" data-testid="card-settings-subscriptions">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 rounded-md bg-purple-50 flex items-center justify-center">
                            <CreditCard size={16} className="text-purple-600" />
                          </div>
                          <h3 className="font-bold text-sm text-gray-800">Gestion des Forfaits</h3>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Prix abonnement mensuel (€)</label>
                            <Input type="number" min="0" value={settingsSubscriptionPrice} onChange={(e) => setSettingsSubscriptionPrice(e.target.value)} className="mt-1 h-9 text-sm" data-testid="input-settings-subscription-price" />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Période d'essai gratuit (jours)</label>
                            <Input type="number" min="0" value={settingsTrialDays} onChange={(e) => setSettingsTrialDays(e.target.value)} className="mt-1 h-9 text-sm" data-testid="input-settings-trial-days" />
                          </div>
                          <div className="bg-purple-50/50 rounded-md p-3 mt-2">
                            <p className="text-xs text-gray-600">
                              <span className="font-bold text-purple-700">Forfait actuel :</span> {settingsSubscriptionPrice} €/mois
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Essai gratuit de {settingsTrialDays} jours pour les nouveaux artisans
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm" data-testid="card-settings-notifications">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center">
                            <Bell size={16} className="text-blue-600" />
                          </div>
                          <h3 className="font-bold text-sm text-gray-800">Notifications</h3>
                        </div>
                        <div className="space-y-3">
                          {[
                            { label: "Nouvel artisan inscrit", val: settingsNotifNewArtisan, set: setSettingsNotifNewArtisan, tid: "toggle-notif-artisan" },
                            { label: "Nouveau projet créé", val: settingsNotifNewProject, set: setSettingsNotifNewProject, tid: "toggle-notif-project" },
                            { label: "Messages reçus", val: settingsNotifMessages, set: setSettingsNotifMessages, tid: "toggle-notif-messages" },
                            { label: "Paiements reçus", val: settingsNotifPayments, set: setSettingsNotifPayments, tid: "toggle-notif-payments" },
                          ].map((n) => (
                            <div key={n.tid} className="flex items-center justify-between py-1.5">
                              <span className="text-sm text-gray-700">{n.label}</span>
                              <button
                                onClick={() => n.set(!n.val)}
                                className={cn("w-10 h-5 rounded-full transition-colors relative", n.val ? "bg-[#722F37]" : "bg-gray-300")}
                                data-testid={n.tid}
                              >
                                <span className={cn("block w-4 h-4 bg-white rounded-full shadow-sm absolute top-0.5 transition-transform", n.val ? "translate-x-5" : "translate-x-0.5")} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm" data-testid="card-settings-security">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 rounded-md bg-amber-50 flex items-center justify-center">
                            <Shield size={16} className="text-amber-600" />
                          </div>
                          <h3 className="font-bold text-sm text-gray-800">Sécurité & Validation</h3>
                        </div>
                        <div className="space-y-3">
                          {[
                            { label: "SIRET obligatoire", val: settingsSiretRequired, set: setSettingsSiretRequired, tid: "toggle-siret-required" },
                            { label: "Pièce d'identité obligatoire", val: settingsIdRequired, set: setSettingsIdRequired, tid: "toggle-id-required" },
                            { label: "Approbation automatique", val: settingsAutoApprove, set: setSettingsAutoApprove, tid: "toggle-auto-approve" },
                            { label: "Mode maintenance", val: settingsMaintenanceMode, set: setSettingsMaintenanceMode, tid: "toggle-maintenance" },
                          ].map((s) => (
                            <div key={s.tid} className="flex items-center justify-between py-1.5">
                              <span className="text-sm text-gray-700">{s.label}</span>
                              <button
                                onClick={() => s.set(!s.val)}
                                className={cn("w-10 h-5 rounded-full transition-colors relative", s.val ? "bg-[#722F37]" : "bg-gray-300")}
                                data-testid={s.tid}
                              >
                                <span className={cn("block w-4 h-4 bg-white rounded-full shadow-sm absolute top-0.5 transition-transform", s.val ? "translate-x-5" : "translate-x-0.5")} />
                              </button>
                            </div>
                          ))}
                          <div className="pt-2">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Taille max upload (Mo)</label>
                            <Input type="number" min="1" max="100" value={settingsMaxUploadSize} onChange={(e) => setSettingsMaxUploadSize(e.target.value)} className="mt-1 h-9 text-sm" data-testid="input-settings-max-upload" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="mt-5 flex justify-end">
                    <Button
                      className="bg-[#722F37] hover:bg-[#5a252c] text-white font-bold text-sm"
                      disabled={saveSettingsMutation.isPending}
                      onClick={() => {
                        saveSettingsMutation.mutate({
                          platformName: settingsPlatformName,
                          contactEmail: settingsContactEmail,
                          supportEmail: settingsSupportEmail,
                          phone: settingsPhone,
                          address: settingsAddress,
                          commission: settingsCommission,
                          currency: settingsCurrency,
                          language: settingsLanguage,
                          notifNewArtisan: String(settingsNotifNewArtisan),
                          notifNewProject: String(settingsNotifNewProject),
                          notifMessages: String(settingsNotifMessages),
                          notifPayments: String(settingsNotifPayments),
                          autoApprove: String(settingsAutoApprove),
                          maintenanceMode: String(settingsMaintenanceMode),
                          maxUploadSize: settingsMaxUploadSize,
                          minOrderAmount: settingsMinOrderAmount,
                          siretRequired: String(settingsSiretRequired),
                          idRequired: String(settingsIdRequired),
                          subscriptionPrice: settingsSubscriptionPrice,
                          trialDays: settingsTrialDays,
                        });
                      }}
                      data-testid="button-save-settings"
                    >
                      {saveSettingsMutation.isPending ? "Enregistrement..." : "Sauvegarder les paramètres"}
                    </Button>
                  </div>
                </>
              )}

            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
