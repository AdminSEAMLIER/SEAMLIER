import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS, apiFetch } from "@/lib/api-config";
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
  Globe, Bell, Palette, Shield, Database, Key, ToggleLeft,
  Bold, Italic, Underline, Star, Package, ArrowDownCircle,
  Euro, BarChart3, Loader2, FolderOpen, AlertOctagon
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
  subscriptionPlan: string;
};

type Article = {
  id: string;
  title: string;
  category: string | null;
  content: string | null;
  excerpt: string | null;
  status: string;
  views: number | null;
  createdAt: string | null;
};

type AdminMeasure = {
  id: string;
  userId: string;
  clientName: string;
  email: string;
  neck: number | null;
  bust: number | null;
  waist: number | null;
  hips: number | null;
  shoulders: number | null;
  armLength: number | null;
  backLength: number | null;
  inseam: number | null;
  height: number | null;
  weight: number | null;
  filledCount: number;
  totalFields: number;
  status: "Complet" | "Incomplet" | "Vide";
  updatedAt: string;
};

type AdminReview = {
  id: string;
  rating: number;
  comment: string | null;
  tailorId: string;
  tailorName: string;
  clientName: string;
  createdAt: string;
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
  const [usersRoleFilter, setUsersRoleFilter] = useState("all");
  const [usersStatusFilter, setUsersStatusFilter] = useState("all");
  const [projectSearch, setProjectSearch] = useState("");
  const [artisanSearch, setArtisanSearch] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [adminUser, setAdminUser] = useState<any>(null);
  const [selectedMeasure, setSelectedMeasure] = useState<AdminMeasure | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showNewArticle, setShowNewArticle] = useState(false);
  const [newArticleTitle, setNewArticleTitle] = useState("");
  const [newArticleCategory, setNewArticleCategory] = useState("");
  const [newArticleContent, setNewArticleContent] = useState("");
  const [newArticleExcerpt, setNewArticleExcerpt] = useState("");
  const [newArticleImageUrl, setNewArticleImageUrl] = useState("");
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [editArticleTitle, setEditArticleTitle] = useState("");
  const [editArticleCategory, setEditArticleCategory] = useState("");
  const [editArticleContent, setEditArticleContent] = useState("");
  const [editArticleExcerpt, setEditArticleExcerpt] = useState("");
  const [editArticleImageUrl, setEditArticleImageUrl] = useState("");
  const newArticleRef = useRef<HTMLTextAreaElement>(null);
  const editArticleRef = useRef<HTMLTextAreaElement>(null);

  const applyFormat = (
    ref: React.RefObject<HTMLTextAreaElement | null>,
    setter: (val: string) => void,
    tag: string
  ) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const selected = text.substring(start, end);
    if (!selected) return;
    const wrapped = `<${tag}>${selected}</${tag}>`;
    const newText = text.substring(0, start) + wrapped + text.substring(end);
    setter(newText);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start, start + wrapped.length);
    }, 0);
  };

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
    subscriptionPlan: "Starter", paymentStatus: "En attente",
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

  useEffect(() => {
    if (isAuthenticated && !adminUser) {
      fetch("/api/auth/user", { credentials: "include" })
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data && data.role === "admin") setAdminUser(data); })
        .catch(() => {});
    }
  }, [isAuthenticated, adminUser]);

  const [sequestreOverrides, setSequestreOverrides] = useState<Record<string, "Bloqué" | "Libéré">>({});
  const { data: rawProjects = [] } = useQuery<Project[]>({
    queryKey: ["/api/admin/all-projects"],
    refetchInterval: 30000,
  });

  const { data: adminRequests = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/all-requests"],
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });
  const projects = rawProjects.map(p => ({
    ...p,
    status: sequestreOverrides[p.id] ?? p.status,
  }));

  const { data: dbUsers = [], isLoading: usersLoading } = useQuery<any[]>({
    queryKey: [API_ENDPOINTS.admin.users],
    enabled: isAuthenticated,
  });

  const { data: dbArtisans = [], isLoading: artisansLoading } = useQuery<any[]>({
    queryKey: [API_ENDPOINTS.admin.artisans],
    enabled: isAuthenticated,
  });

  const { data: globalStats } = useQuery<{
    totalRevenue: number;
    monthRevenue: number;
    totalProjectsCompleted: number;
    avgProjectValue: number;
    starterCount: number;
    proCount: number;
    activeClientsCount: number;
    activeArtisansCount: number;
  }>({
    queryKey: ["/api/admin/global-stats"],
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
      subscriptionPlan: a.subscriptionPlan || "Starter",
      paymentStatus: a.paymentStatus || "En attente",
    })),
  [dbArtisans]);

  const createArtisanMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiFetch(API_ENDPOINTS.admin.artisans, {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.admin.artisans] });
      toast({ title: "Artisan ajouté", description: "L'artisan a été ajouté avec succès." });
      setShowAddArtisan(false);
      setNewArtisan({
        firstName: "", lastName: "", specialty: "", city: "", email: "", phone: "",
        siret: "", companyName: "", legalForm: "", status: "En attente",
        birthDate: "", nationality: "", idType: "", idNumber: "", address: "",
        tvaNumber: "", iban: "", yearsExperience: 0, bio: "",
        subscriptionPlan: "Starter", paymentStatus: "En attente",
      });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible d'ajouter l'artisan.", variant: "destructive" });
    },
  });

  const updateArtisanMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiFetch(API_ENDPOINTS.admin.artisan(id), {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.admin.artisans] });
    },
  });

  const deleteArtisanMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(API_ENDPOINTS.admin.artisan(id), { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.admin.artisans] });
    },
  });

  const deleteUnverifiedMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/api/admin/users/unverified", { method: "DELETE" });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.admin.users] });
      toast({ title: "Comptes supprimés", description: `${data.deleted} compte(s) non activé(s) supprimé(s).` });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error?.message || "Impossible de supprimer les comptes.", variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/admin/users/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.admin.users] });
      toast({ title: "Compte supprimé" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de supprimer ce compte.", variant: "destructive" });
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ id, emailVerified }: { id: string; emailVerified: boolean }) => {
      const res = await apiFetch(`/api/admin/users/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ emailVerified }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.admin.users] });
      toast({ title: "Statut mis à jour" });
    },
  });

  const { data: dbSettings } = useQuery<Record<string, string>>({
    queryKey: [API_ENDPOINTS.admin.settings],
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
      const res = await apiFetch(API_ENDPOINTS.admin.settings, {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.admin.settings] });
      toast({ title: "Paramètres sauvegardés", description: "Les modifications ont été enregistrées avec succès." });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de sauvegarder les paramètres.", variant: "destructive" });
    },
  });

  const [messages, setMessages] = useState<Message[]>([]);

  const { data: planningEvents = [] } = useQuery<PlanningEvent[]>({
    queryKey: ["/api/admin/all-appointments"],
    refetchInterval: 30000,
  });

  const { data: measureProfiles = [] } = useQuery<AdminMeasure[]>({
    queryKey: ["/api/admin/measures"],
    enabled: isAuthenticated,
  });

  const { data: adminEvents = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/events"],
    enabled: isAuthenticated,
  });
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const { data: expandedParticipants = [], isLoading: participantsLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/events", expandedEventId, "participants"],
    queryFn: async () => {
      const res = await apiFetch(`/api/admin/events/${expandedEventId}/participants`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!expandedEventId,
  });
  const releaseEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const res = await apiFetch(`/api/admin/events/${eventId}/release`, { method: "POST" });
      if (!res.ok) throw new Error("Erreur lors de la libération");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      toast({ title: "Paiement libéré", description: "La commande groupée a été validée." });
    },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const openDisputeMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const res = await apiFetch(`/api/admin/projects/${projectId}/dispute`, { method: "POST" });
      if (!res.ok) throw new Error("Erreur");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-projects"] });
      toast({ title: "Litige ouvert", description: "Les parties ont été notifiées par email." });
    },
    onError: () => toast({ title: "Erreur", description: "Impossible d'ouvrir le litige.", variant: "destructive" }),
  });

  const validateDossierMutation = useMutation({
    mutationFn: async ({ id, action, reason }: { id: string; action: "validate" | "reject"; reason?: string }) => {
      const res = await apiFetch(`/api/admin/artisan-dossiers/${id}/validate`, {
        method: "POST",
        body: JSON.stringify({ action, reason }),
      });
      if (!res.ok) throw new Error("Erreur");
      return res.json();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/artisan-dossiers"] });
      toast({ title: vars.action === "validate" ? "Dossier validé" : "Dossier rejeté", description: "L'artisan a été notifié par email." });
    },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const { data: artisanDossiers = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/artisan-dossiers"],
    enabled: isAuthenticated,
  });

  const createConversationMutation = useMutation({
    mutationFn: async ({ tailorId }: { tailorId: string }) => {
      const res = await apiRequest("POST", "/api/conversations", { tailorId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  const { data: adminReviews = [], isLoading: reviewsLoading } = useQuery<AdminReview[]>({
    queryKey: ["/api/admin/reviews"],
    enabled: isAuthenticated,
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
      toast({ title: "Avis supprimé" });
    },
    onError: () => toast({ title: "Erreur", description: "Impossible de supprimer cet avis.", variant: "destructive" }),
  });

  const { data: rawArtisans = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/artisans"],
    enabled: isAuthenticated,
  });
  const couturiers: CouturierData[] = rawArtisans.map((a: any) => ({
    id: a.id,
    name: `${a.firstName || ""} ${a.lastName || ""}`.trim(),
    location: a.city || "",
    specialty: a.specialty || "",
    status: a.status === "Vérifié" ? "Vérifié" : a.status === "Non vérifié" ? "Non vérifié" : "En attente",
    selected: false,
    firstName: a.firstName || "",
    lastName: a.lastName || "",
    birthDate: a.birthDate || "",
    nationality: a.nationality || "",
    idType: a.idType || "",
    idNumber: a.idNumber || "",
    phone: a.phone || "",
    email: a.email || "",
    address: a.address || "",
    siret: a.siret || "",
    companyName: a.companyName || "",
    legalForm: a.legalForm || "",
    tvaNumber: a.tvaNumber || "",
    iban: a.iban || "",
    registrationDate: a.joinDate || a.createdAt || "",
    yearsExperience: a.yearsExperience || 0,
    bio: a.bio || "",
    subscriptionPlan: a.subscriptionPlan || "Starter",
  }));

  const { data: articles = [] } = useQuery<Article[]>({
    queryKey: ["/api/admin/articles"],
    enabled: isAuthenticated,
  });

  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const response = await apiFetch(API_ENDPOINTS.auth.login, {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await response.json();
      if (data.role !== 'admin') {
        toast({ title: "Accès refusé", description: "Ce compte n'a pas les droits administrateur.", variant: "destructive" });
        setLoginLoading(false);
        return;
      }
      setAdminUser(data);
      await queryClient.invalidateQueries({ queryKey: ["auth-user"] });
      setIsAuthenticated(true);
      toast({ title: "Accès autorisé", description: "Bienvenue sur la console d'administration." });
    } catch {
      toast({ title: "Erreur", description: "Impossible de se connecter au serveur.", variant: "destructive" });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = useCallback(async () => {
    try {
      await apiFetch('/api/logout');
      await queryClient.invalidateQueries({ queryKey: ["auth-user"] });
    } catch {}
    setIsAuthenticated(false);
    try { localStorage.removeItem(ADMIN_AUTH_KEY); } catch {}
    toast({ title: "Déconnexion", description: "Vous avez été déconnecté." });
  }, [toast]);

  const toggleSequestre = (id: string) => {
    const project = projects.find(p => p.id === id);
    apiFetch(`/api/stripe/transfer/admin-release/${id}`, { method: "POST" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setSequestreOverrides(prev => ({ ...prev, [id]: "Libéré" }));
          queryClient.invalidateQueries({ queryKey: ["/api/admin/all-projects"] });
          toast({ title: "Fonds libérés", description: `Virement initié pour ${project?.client}` });
        } else {
          toast({ title: "Erreur", description: data?.error || "Échec du virement", variant: "destructive" });
        }
      })
      .catch(() => {
        toast({ title: "Erreur réseau", description: "Impossible de contacter le serveur.", variant: "destructive" });
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
    setSelectedMessage(id);
    setSelectedConversationId(id);
  };

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState("");

  const { data: adminConversations = [] } = useQuery<any[]>({
    queryKey: ["/api/conversations"],
    enabled: isAuthenticated,
  });

  const { data: adminMessages = [] } = useQuery<any[]>({
    queryKey: ["/api/messages", selectedConversationId],
    enabled: !!selectedConversationId,
    queryFn: async () => {
      const res = await fetch(`/api/messages/${selectedConversationId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 5000,
  });

  const sendAdminReplyMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", "/api/messages", {
        conversationId: selectedConversationId,
        senderId: adminUser?.id || "",
        content,
        sentAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedConversationId] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setAdminReplyText("");
      toast({ title: "Réponse envoyée" });
    },
  });

  const sendReply = () => {
    if (!adminReplyText.trim() || !selectedConversationId) return;
    sendAdminReplyMutation.mutate(adminReplyText.trim());
  };

  const publishArticle = async (id: string) => {
    const article = articles.find(a => a.id === id);
    if (!article) return;
    const newStatus = article.status === "Publié" ? "Brouillon" : "Publié";
    try {
      await apiFetch(`/api/admin/articles/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
      toast({ title: "Statut mis à jour" });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de mettre à jour le statut", variant: "destructive" });
    }
  };

  const deleteArticle = async (id: string) => {
    try {
      await apiFetch(`/api/admin/articles/${id}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
      toast({ title: "Article supprimé", variant: "destructive" });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de supprimer l'article", variant: "destructive" });
    }
  };

  const handleArticleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image trop volumineuse", description: "Maximum 5 Mo", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setNewArticleImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const createArticle = async () => {
    if (!newArticleTitle.trim()) return;
    try {
      await apiFetch("/api/admin/articles", {
        method: "POST",
        body: JSON.stringify({
          title: newArticleTitle,
          category: newArticleCategory || "Non catégorisé",
          content: newArticleContent,
          excerpt: newArticleExcerpt.trim() || null,
          imageUrl: newArticleImageUrl || null,
          status: "Brouillon",
        }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
      setNewArticleTitle("");
      setNewArticleCategory("");
      setNewArticleContent("");
      setNewArticleExcerpt("");
      setNewArticleImageUrl("");
      setShowNewArticle(false);
      toast({ title: "Article créé", description: "Le brouillon a été enregistré." });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de créer l'article", variant: "destructive" });
    }
  };

  const openEditArticle = (article: any) => {
    setEditingArticleId(article.id);
    setEditArticleTitle(article.title || "");
    setEditArticleCategory(article.category || "");
    setEditArticleContent(article.content || "");
    setEditArticleExcerpt(article.excerpt || "");
    setEditArticleImageUrl(article.imageUrl || "");
  };

  const handleEditArticleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image trop volumineuse", description: "Maximum 5 Mo", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setEditArticleImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const saveEditArticle = async () => {
    if (!editingArticleId || !editArticleTitle.trim()) return;
    try {
      await apiFetch(`/api/admin/articles/${editingArticleId}`, {
        method: "PUT",
        body: JSON.stringify({
          title: editArticleTitle,
          category: editArticleCategory || "Non catégorisé",
          content: editArticleContent,
          excerpt: editArticleExcerpt.trim() || null,
          imageUrl: editArticleImageUrl || null,
        }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
      setEditingArticleId(null);
      toast({ title: "Article modifié", description: "Les modifications ont été enregistrées." });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de modifier l'article", variant: "destructive" });
    }
  };

  const toggleCouturierSelect = (id: string) => {
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

  const saveCouturierEdit = async () => {
    if (!couturierDialogId) return;
    try {
      await apiFetch(`/api/admin/artisans/${couturierDialogId}`, {
        method: "PUT",
        body: JSON.stringify(editForm),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/artisans"] });
      toast({ title: "Profil mis à jour", description: "Les informations du couturier ont été enregistrées." });
      closeCouturierDialog();
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de mettre à jour le profil", variant: "destructive" });
    }
  };

  const validateCouturier = async (id: string) => {
    try {
      await apiFetch(`/api/admin/artisans/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "Vérifié" }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/artisans"] });
      toast({ title: "Artisan validé", description: "Le statut a été mis à jour." });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de valider l'artisan", variant: "destructive" });
    }
  };

  const deactivateCouturier = async (id: string) => {
    try {
      await apiFetch(`/api/admin/artisans/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "Non vérifié" }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/artisans"] });
      toast({ title: "Artisan désactivé", description: "Le statut a été mis à jour." });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de désactiver l'artisan", variant: "destructive" });
    }
  };

  const downgradeToStarter = async (id: string, name: string) => {
    if (!confirm(`Rétrograder ${name} au plan Starter ?\n\nSon abonnement Stripe sera annulé immédiatement sans remboursement.`)) return;
    try {
      await apiFetch(`/api/admin/artisans/${id}/downgrade`, { method: "POST" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/artisans"] });
      toast({ title: "Plan rétrogradé", description: `${name} est maintenant sur le plan Starter.` });
    } catch {
      toast({ title: "Erreur", description: "Impossible de rétrograder le plan.", variant: "destructive" });
    }
  };

  const deleteCouturier = async (id: string) => {
    try {
      await apiFetch(`/api/admin/artisans/${id}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/artisans"] });
      toast({ title: "Artisan supprimé", description: "L'artisan a été retiré." });
      closeCouturierDialog();
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de supprimer l'artisan", variant: "destructive" });
    }
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
  const unreadMessages = adminConversations.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0);

  const filteredProjects = useMemo(() => projects.filter(p =>
    p.client.toLowerCase().includes(projectSearch.toLowerCase()) ||
    p.artisan.toLowerCase().includes(projectSearch.toLowerCase())
  ), [projects, projectSearch]);

  const filteredArtisans = useMemo(() => artisans.filter(a =>
    a.name.toLowerCase().includes(artisanSearch.toLowerCase()) ||
    a.specialty.toLowerCase().includes(artisanSearch.toLowerCase()) ||
    a.city.toLowerCase().includes(artisanSearch.toLowerCase())
  ), [artisans, artisanSearch]);


  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#601B28] px-4">
        <Card className="w-full max-w-md shadow-2xl border-none">
          <div className="p-8 text-center space-y-1">
            <Lock className="mx-auto text-[#601B28] h-12 w-12 mb-4" />
            <h2 className="font-serif text-2xl uppercase tracking-widest text-[#601B28]">SEAMLiER</h2>
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
              <Button type="submit" className="w-full bg-[#601B28] h-12" disabled={loginLoading} data-testid="button-admin-login">
                {loginLoading ? "Connexion en cours..." : "Connexion"}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    );
  }

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, id: "overview" },
    { label: "Inscrits", icon: User, id: "users" },
    { label: "Artisans", icon: Users, id: "artisans" },
    { label: "Dossiers Pro", icon: FolderOpen, id: "dossiers" },
    { label: "Demandes", icon: Clock, id: "requests" },
    { label: "Projets", icon: ShoppingBag, id: "projects" },
    { label: "Planning", icon: Calendar, id: "planning" },
    { label: "Abonnements", icon: CreditCard, id: "subscriptions" },
    { label: "Messagerie", icon: MessageSquare, id: "messaging" },
    { label: "Mesures", icon: Ruler, id: "measures" },
    { label: "Avis", icon: Star, id: "reviews" },
    { label: "Commandes groupées", icon: Users, id: "events" },
    { label: "Magazine", icon: FileText, id: "magazine" },
  ];

  const stats = [
    { label: "Demandes en attente", val: String(adminRequests.length), icon: Clock, color: "text-[#601B28]", bg: "bg-[#601B28]/5", tab: "requests" },
    { label: "Projets totaux", val: String(projects.length), icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50", tab: "projects" },
    { label: "Revenus libérés", val: `${totalRevenue.toLocaleString()} €`, icon: ShoppingBag, color: "text-green-600", bg: "bg-green-50", tab: "projects" },
    { label: "Artisans vérifiés", val: `${verifiedArtisans}/${artisans.length}`, icon: ShieldCheck, color: "text-amber-600", bg: "bg-amber-50", tab: "artisans" },
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
            <h2 className="text-2xl font-serif font-black text-[#601B28] tracking-tighter" data-testid="text-admin-logo">SEAMLiER</h2>
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
                        className={cn(activeTab === item.id && "bg-[#601B28] text-white")}
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
                <SidebarMenuButton onClick={() => setActiveTab("settings")} data-testid="button-admin-settings" className={cn(activeTab === "settings" && "bg-[#601B28] text-white")}>
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
              <Badge variant="outline" className="text-[#601B28] border-[#601B28]/20 bg-[#601B28]/5 px-3 py-1 md:hidden" data-testid="badge-admin-mode">Admin</Badge>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 hidden sm:inline" data-testid="text-admin-email">admin@seamlier.fr</span>
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
                    <p className="text-gray-500 mt-1 text-sm">Vue globale de la plateforme SEAMLiER</p>
                  </div>

                  {/* Bloc revenus & activité */}
                  {globalStats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { label: "CA ce mois", value: `${globalStats.monthRevenue?.toFixed(0) ?? 0} €`, icon: TrendingUp, bg: "bg-green-50", color: "text-green-600" },
                        { label: "CA total", value: `${globalStats.totalRevenue?.toFixed(0) ?? 0} €`, icon: Euro, bg: "bg-[#601B28]/5", color: "text-[#601B28]" },
                        { label: "Projets terminés", value: globalStats.totalProjectsCompleted ?? 0, icon: CheckCircle, bg: "bg-blue-50", color: "text-blue-600" },
                        { label: "Panier moyen", value: `${globalStats.avgProjectValue?.toFixed(0) ?? 0} €`, icon: BarChart3, bg: "bg-amber-50", color: "text-amber-600" },
                      ].map(s => (
                        <Card key={s.label} className="border-none shadow-sm">
                          <CardContent className="p-4">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${s.bg}`}>
                              <s.icon size={16} className={s.color} />
                            </div>
                            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                            <p className="text-xl font-bold text-gray-900 mt-0.5">{s.value}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    {stats.map((stat) => (
                      <Card key={stat.label} className="border-none shadow-sm hover-elevate cursor-pointer" onClick={() => setActiveTab(stat.tab)} data-testid={`card-stat-${stat.label.replace(/\s/g, "-").toLowerCase()}`}>
                        <CardContent className="p-5">
                          <div className="flex justify-between items-start">
                            <div className={cn("p-2 rounded-lg", stat.bg)}>
                              <stat.icon size={18} className={stat.color} />
                            </div>
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
                          <Button variant="ghost" size="sm" className="text-[#601B28] text-xs" onClick={() => setActiveTab("projects")} data-testid="button-view-all-projects">
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
                                <span className="text-sm font-bold text-[#601B28]">{p.amount}</span>
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
                          <Button variant="ghost" size="sm" className="text-[#601B28] text-xs" onClick={() => setActiveTab("artisans")} data-testid="button-view-all-artisans">
                            Tout voir <ChevronRight size={14} className="ml-1" />
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {artisans.filter(a => a.status === "En attente").map(a => (
                            <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 gap-3 flex-wrap">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-[#601B28]/5 flex items-center justify-center text-[#601B28] font-bold text-xs flex-shrink-0">{a.name[0]}</div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold truncate">{a.name}</p>
                                  <p className="text-xs text-gray-500 truncate">{a.specialty} - {a.city}</p>
                                </div>
                              </div>
                              <div className="flex gap-2 flex-shrink-0">
                                <Button size="sm" className="bg-[#601B28] h-7 text-[10px]" onClick={() => approveArtisan(a.id)} data-testid={`button-quick-approve-${a.id}`}>Approuver</Button>
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

              {/* ===== REQUESTS / DEMANDES ===== */}
              {activeTab === "requests" && (
                <>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-serif font-bold text-gray-900">Demandes en attente</h1>
                    <p className="text-gray-500 mt-1 text-sm">Toutes les demandes clients en cours de traitement par les artisans</p>
                  </div>
                  <Card className="border-none shadow-sm overflow-hidden bg-white">
                    <div className="p-5 border-b border-gray-50 flex items-center gap-3 flex-wrap">
                      <Badge className="bg-yellow-50 text-yellow-700 border-none px-3 py-1">{adminRequests.filter((r: any) => r.status === "pending").length} nouvelles</Badge>
                      <Badge className="bg-blue-50 text-blue-700 border-none px-3 py-1">{adminRequests.filter((r: any) => r.status === "quoted").length} devis envoyés</Badge>
                    </div>
                    {adminRequests.length === 0 ? (
                      <div className="p-12 text-center text-gray-400">
                        <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Aucune demande en attente</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                            <tr>
                              <th className="px-4 py-3 text-left">Projet</th>
                              <th className="px-4 py-3 text-left">Client</th>
                              <th className="px-4 py-3 text-left">Artisan</th>
                              <th className="px-4 py-3 text-left">Statut</th>
                              <th className="px-4 py-3 text-left">Date</th>
                              <th className="px-4 py-3 text-left">Contact</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {adminRequests.map((r: any) => (
                              <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-4 py-3 font-medium text-gray-900 max-w-[180px] truncate">{r.title || "Sans titre"}</td>
                                <td className="px-4 py-3 text-gray-600">{r.clientFirstName} {r.clientLastName}</td>
                                <td className="px-4 py-3 text-gray-600">{r.tailorFirstName} {r.tailorLastName}</td>
                                <td className="px-4 py-3">
                                  {r.status === "pending"
                                    ? <Badge className="bg-yellow-100 text-yellow-700 border-none text-xs">Nouvelle</Badge>
                                    : <Badge className="bg-blue-100 text-blue-700 border-none text-xs">Devis envoyé</Badge>}
                                </td>
                                <td className="px-4 py-3 text-gray-400 text-xs">
                                  {r.createdAt ? new Date(r.createdAt).toLocaleDateString("fr-FR") : "—"}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex gap-1">
                                    {r.tailorId && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-[10px] px-2 border-[#601B28]/30 text-[#601B28] hover:bg-[#601B28]/5"
                                        onClick={() => { setActiveTab("messaging"); }}
                                        data-testid={`button-contact-artisan-${r.id}`}
                                      >
                                        <MessageSquare size={10} className="mr-1" />Artisan
                                      </Button>
                                    )}
                                    {r.clientId && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-[10px] px-2 border-gray-300 text-gray-600 hover:bg-gray-50"
                                        onClick={() => { setActiveTab("messaging"); }}
                                        data-testid={`button-contact-client-${r.id}`}
                                      >
                                        <User size={10} className="mr-1" />Client
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                </>
              )}

              {/* ===== PROJECTS ===== */}
              {activeTab === "projects" && (
                <>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-serif font-bold text-gray-900" data-testid="text-page-title">Projets & Séquestre</h1>
                    <p className="text-gray-500 mt-1 text-sm">Gestion des flux financiers de la plateforme</p>
                  </div>
                  <Card className="border-none shadow-sm overflow-hidden bg-white">
                    <div className="p-5 border-b border-gray-50 flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex gap-2 flex-wrap">
                        <Badge className="bg-[#601B28]/5 text-[#601B28] border-none px-3 py-1" data-testid="badge-total-projects">{projects.length} projets</Badge>
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
                                {(() => {
                                  const ps = (p as any).paymentStatus;
                                  if (ps === "transferred") return (
                                    <Badge className="text-[10px] px-3 py-1 border-none font-bold uppercase bg-green-100 text-green-700" data-testid={`badge-sequestre-${p.id}`}>
                                      <ShieldCheck size={10} className="mr-1 inline" />Libéré
                                    </Badge>
                                  );
                                  if (ps === "client_confirmed") return (
                                    <Badge className="text-[10px] px-3 py-1 border-none font-bold uppercase bg-orange-100 text-orange-700" data-testid={`badge-sequestre-${p.id}`}>
                                      <ShieldAlert size={10} className="mr-1 inline" />À libérer
                                    </Badge>
                                  );
                                  if (ps === "paid") return (
                                    <Badge className="text-[10px] px-3 py-1 border-none font-bold uppercase bg-yellow-100 text-yellow-700" data-testid={`badge-sequestre-${p.id}`}>
                                      <ShieldAlert size={10} className="mr-1 inline" />Payé - En cours
                                    </Badge>
                                  );
                                  return (
                                    <Badge className="text-[10px] px-3 py-1 border-none font-bold uppercase bg-red-100 text-red-600" data-testid={`badge-sequestre-${p.id}`}>
                                      <ShieldAlert size={10} className="mr-1 inline" />Non payé
                                    </Badge>
                                  );
                                })()}
                              </td>
                              <td className="px-5 py-3 text-right font-bold text-[#601B28]">{p.amount}</td>
                              <td className="px-5 py-3 text-center">
                                <div className="flex gap-1 justify-center">
                                  <Button
                                    size="sm"
                                    variant="default"
                                    disabled={(p as any).paymentStatus !== "client_confirmed"}
                                    className={cn("h-8 text-[11px] font-bold", (p as any).paymentStatus === "client_confirmed" ? "bg-green-600 hover:bg-green-700" : "bg-gray-200 text-gray-400 cursor-not-allowed")}
                                    onClick={() => (p as any).paymentStatus === "client_confirmed" && toggleSequestre(p.id)}
                                    data-testid={`button-toggle-sequestre-${p.id}`}
                                  >
                                    Libérer
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-[11px] font-bold border-red-200 text-red-600 hover:bg-red-50"
                                    disabled={openDisputeMutation.isPending}
                                    onClick={() => { if (confirm(`Ouvrir un litige pour ce projet ?`)) openDisputeMutation.mutate(p.id); }}
                                    data-testid={`button-dispute-${p.id}`}
                                  >
                                    <AlertOctagon size={11} className="mr-1" />Litige
                                  </Button>
                                </div>
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

              {/* ===== DOSSIERS PRO ===== */}
              {activeTab === "dossiers" && (
                <>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-serif font-bold text-gray-900">Dossiers Professionnels</h1>
                    <p className="text-gray-500 mt-1 text-sm">Vérification des pièces justificatives des artisans</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge className="bg-yellow-50 text-yellow-700 border-none px-3 py-1">{artisanDossiers.filter((d: any) => d.dossier_status === "pending").length} en attente</Badge>
                    <Badge className="bg-green-50 text-green-700 border-none px-3 py-1">{artisanDossiers.filter((d: any) => d.dossier_status === "validated").length} validés</Badge>
                    <Badge className="bg-red-50 text-red-700 border-none px-3 py-1">{artisanDossiers.filter((d: any) => d.dossier_status === "rejected").length} rejetés</Badge>
                  </div>
                  <Card className="border-none shadow-sm overflow-hidden bg-white">
                    {artisanDossiers.length === 0 ? (
                      <div className="p-12 text-center text-gray-400">
                        <FolderOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Aucun dossier soumis</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                            <tr>
                              <th className="px-4 py-3 text-left">Artisan</th>
                              <th className="px-4 py-3 text-left">SIRET</th>
                              <th className="px-4 py-3 text-center">Kbis</th>
                              <th className="px-4 py-3 text-center">CNI</th>
                              <th className="px-4 py-3 text-center">RC Pro</th>
                              <th className="px-4 py-3 text-center">RIB</th>
                              <th className="px-4 py-3 text-center">Statut</th>
                              <th className="px-4 py-3 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {artisanDossiers.map((d: any) => (
                              <tr key={d.id} className="hover:bg-gray-50/50 transition-colors" data-testid={`row-dossier-${d.id}`}>
                                <td className="px-4 py-3">
                                  <p className="font-medium text-gray-900">{d.first_name} {d.last_name}</p>
                                  <p className="text-xs text-gray-400">{d.email}</p>
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-600 font-mono">{d.siret || "—"}</td>
                                {[d.has_kbis, d.has_id_doc, d.has_rc_pro, d.has_rib].map((has: any, i: number) => (
                                  <td key={i} className="px-4 py-3 text-center">
                                    {has
                                      ? <CheckCircle size={16} className="text-green-500 mx-auto" />
                                      : <XCircle size={16} className="text-gray-300 mx-auto" />
                                    }
                                  </td>
                                ))}
                                <td className="px-4 py-3 text-center">
                                  {d.dossier_status === "validated" && <Badge className="bg-green-100 text-green-700 border-none text-xs">Validé</Badge>}
                                  {d.dossier_status === "rejected" && <Badge className="bg-red-100 text-red-700 border-none text-xs">Rejeté</Badge>}
                                  {(!d.dossier_status || d.dossier_status === "pending") && <Badge className="bg-yellow-100 text-yellow-700 border-none text-xs">En attente</Badge>}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex gap-1 justify-center">
                                    <Button
                                      size="sm"
                                      className="h-7 text-[10px] bg-green-600 hover:bg-green-700 text-white font-bold px-2"
                                      disabled={validateDossierMutation.isPending || d.dossier_status === "validated"}
                                      onClick={() => validateDossierMutation.mutate({ id: d.id, action: "validate" })}
                                      data-testid={`button-validate-dossier-${d.id}`}
                                    >
                                      <CheckCircle size={10} className="mr-1" />Valider
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-[10px] border-red-200 text-red-600 hover:bg-red-50 px-2"
                                      disabled={validateDossierMutation.isPending || d.dossier_status === "rejected"}
                                      onClick={() => {
                                        const reason = prompt("Motif du rejet (optionnel) :");
                                        validateDossierMutation.mutate({ id: d.id, action: "reject", reason: reason || undefined });
                                      }}
                                      data-testid={`button-reject-dossier-${d.id}`}
                                    >
                                      <XCircle size={10} className="mr-1" />Rejeter
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                </>
              )}

              {/* ===== MESSAGING ===== */}
              {activeTab === "messaging" && (
                <>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-serif font-bold text-gray-900" data-testid="text-page-title">Messagerie Support</h1>
                    <p className="text-gray-500 mt-1 text-sm">Conversations avec les utilisateurs</p>
                  </div>
                  <div className="grid lg:grid-cols-3 gap-6" style={{ minHeight: "60vh" }}>
                    <Card className="border-none shadow-sm overflow-hidden bg-white lg:col-span-1 flex flex-col">
                      <div className="p-4 border-b border-gray-50 flex items-center justify-between gap-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Conversations ({adminConversations.length})</p>
                        {adminConversations.length > 0 && (
                          <button
                            onClick={async () => {
                              if (!confirm("Supprimer toutes les conversations ? Cette action est irréversible.")) return;
                              try {
                                await apiFetch("/api/admin/conversations", { method: "DELETE" });
                                queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
                                setSelectedConversationId(null);
                                setSelectedMessage(null);
                                toast({ title: "Conversations supprimées" });
                              } catch {
                                toast({ title: "Erreur", description: "Impossible de supprimer les conversations", variant: "destructive" });
                              }
                            }}
                            className="text-[10px] text-red-500 hover:text-red-700 font-semibold px-2 py-0.5 rounded hover:bg-red-50 transition-colors"
                            data-testid="button-delete-all-conversations"
                          >
                            Tout supprimer
                          </button>
                        )}
                      </div>
                      <div className="overflow-y-auto flex-1">
                        {adminConversations.map((c: any) => (
                          <button key={c.id} onClick={() => { setSelectedConversationId(c.id); setSelectedMessage(c.id); }} className={cn("w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors", selectedConversationId === c.id && "bg-[#601B28]/5 border-l-2 border-l-[#601B28]")} data-testid={`conv-item-${c.id}`}>
                            <div className="flex justify-between items-start mb-1 gap-2">
                              <span className="text-sm font-semibold text-gray-900 truncate">
                                {c.otherParticipant?.firstName || ""} {c.otherParticipant?.lastName || "Utilisateur"}
                              </span>
                              <span className="text-[10px] text-gray-400 flex-shrink-0">
                                {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleDateString("fr-FR") : ""}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 truncate">{c.lastMessagePreview || "Nouvelle conversation"}</p>
                            <Badge className="text-[9px] border-none px-1.5 py-0.5 bg-blue-50 text-blue-600 mt-1">support</Badge>
                          </button>
                        ))}
                        {adminConversations.length === 0 && (
                          <p className="text-sm text-gray-400 text-center py-8">Aucune conversation</p>
                        )}
                      </div>
                    </Card>
                    <Card className="border-none shadow-sm overflow-hidden bg-white lg:col-span-2 flex flex-col">
                      {selectedConversationId ? (
                        <>
                          <div className="p-5 border-b border-gray-50">
                            <h3 className="text-lg font-semibold text-gray-900" data-testid="text-conv-title">
                              Conversation support
                            </h3>
                          </div>
                          <div className="flex-1 p-5 overflow-y-auto space-y-3" data-testid="message-thread">
                            {adminMessages.map((msg: any) => (
                              <div key={msg.id} className={cn("rounded-lg p-4", msg.senderId === adminUser?.id ? "bg-[#601B28]/5 ml-6" : "bg-gray-50 mr-6")} data-testid={`msg-${msg.id}`}>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className={cn("w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0", msg.senderId === adminUser?.id ? "bg-[#601B28]/20" : "bg-gray-200")}>
                                    {msg.senderId === adminUser?.id ? <ShieldCheck size={12} className="text-[#601B28]" /> : <User size={12} className="text-gray-500" />}
                                  </div>
                                  <span className={cn("text-xs font-semibold", msg.senderId === adminUser?.id ? "text-[#601B28]" : "text-gray-600")}>
                                    {msg.senderId === adminUser?.id ? "Admin" : (msg.sender?.firstName || "Utilisateur")}
                                  </span>
                                  <span className="text-[10px] text-gray-400">{msg.sentAt ? new Date(msg.sentAt).toLocaleString("fr-FR") : ""}</span>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed">{msg.content}</p>
                              </div>
                            ))}
                            {adminMessages.length === 0 && (
                              <p className="text-sm text-gray-400 text-center py-8">Aucun message dans cette conversation</p>
                            )}
                          </div>
                          <div className="p-4 border-t border-gray-50">
                            <Textarea placeholder="Répondre..." value={adminReplyText} onChange={e => setAdminReplyText(e.target.value)} className="min-h-[80px] text-sm" data-testid="input-admin-reply" />
                            <div className="flex justify-end mt-3">
                              <Button className="bg-[#601B28]" onClick={sendReply} disabled={sendAdminReplyMutation.isPending} data-testid="button-send-reply">
                                <Send size={16} className="mr-2" /> Envoyer
                              </Button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 flex items-center justify-center">
                          <div className="text-center">
                            <MessageSquare className="mx-auto text-gray-200 h-16 w-16 mb-4" />
                            <p className="text-gray-400" data-testid="text-no-message-selected">Sélectionnez une conversation</p>
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
                          <div className="flex justify-between text-sm"><span className="text-gray-500">Vides</span><span className="font-bold text-gray-400" data-testid="text-waiting-profiles">{measureProfiles.filter(m => m.status === "Vide").length}</span></div>
                          <div className="flex justify-between text-sm pt-2 border-t border-gray-50"><span className="text-gray-500">Total profils</span><span className="font-bold text-[#601B28]" data-testid="text-total-measures">{measureProfiles.length}</span></div>
                          <div className="pt-2 border-t border-gray-50 space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Artisans Starter</span>
                              <span className="font-bold text-gray-700" data-testid="text-starter-artisan-count">{artisans.filter(a => a.subscriptionPlan === "Starter").length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Artisans Pro</span>
                              <span className="font-bold text-purple-600" data-testid="text-pro-artisan-count">{artisans.filter(a => a.subscriptionPlan === "Pro").length}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-white lg:col-span-2 overflow-hidden">
                      <div className="p-5 border-b border-gray-50">
                        <CardTitle className="text-base font-serif">Profils clients ({measureProfiles.length})</CardTitle>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left" data-testid="table-measures">
                          <thead>
                            <tr className="text-[11px] uppercase tracking-wider text-gray-400 bg-gray-50/30">
                              <th className="px-5 py-3 font-bold">Client</th>
                              <th className="px-5 py-3 font-bold">Renseignées</th>
                              <th className="px-5 py-3 font-bold">Dernière MAJ</th>
                              <th className="px-5 py-3 font-bold text-center">Statut</th>
                              <th className="px-5 py-3 text-right font-bold">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {measureProfiles.length === 0 && (
                              <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-400">Aucun profil de mesures enregistré</td></tr>
                            )}
                            {measureProfiles.map(mp => (
                              <tr key={mp.id} className="hover:bg-gray-50/50 transition-colors" data-testid={`row-measure-${mp.id}`}>
                                <td className="px-5 py-3">
                                  <p className="text-sm font-semibold">{mp.clientName}</p>
                                  <p className="text-xs text-gray-400">{mp.email}</p>
                                </td>
                                <td className="px-5 py-3 text-sm text-gray-600">{mp.filledCount}/{mp.totalFields}</td>
                                <td className="px-5 py-3 text-xs text-gray-500">{mp.updatedAt}</td>
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
                      <Button className="bg-[#601B28] font-bold" data-testid="button-import-data" onClick={() => toast({ title: "Import", description: "Fonctionnalité d'import en préparation." })}>
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
                          {couturiers.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">
                                Aucun artisan enregistré. Ajoutez-en via le bouton ci-dessus.
                              </td>
                            </tr>
                          )}
                          {couturiers.map(c => (
                            <tr key={c.id} className={cn("transition-colors", selectedCouturier === c.id ? "bg-[#601B28]/5" : "hover:bg-gray-50/50")} data-testid={`row-couturier-${c.id}`}>
                              <td className="px-5 py-3">
                                <input type="checkbox" checked={selectedCouturier === c.id} onChange={() => toggleCouturierSelect(c.id)} className="rounded border-gray-300 text-[#601B28] focus:ring-[#601B28]" data-testid={`checkbox-couturier-${c.id}`} />
                              </td>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-[#601B28]/5 flex items-center justify-center text-[#601B28] font-bold text-xs flex-shrink-0">{c.name[0]}</div>
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
                                <div className="flex justify-end gap-1.5 flex-wrap">
                                  {c.status !== "Vérifié" && (
                                    <Button size="sm" variant="outline" className="h-7 text-[10px] border-green-200 text-green-700 hover:bg-green-50" onClick={() => validateCouturier(c.id)} data-testid={`button-validate-couturier-${c.id}`}>
                                      <CheckCircle size={12} className="mr-1" /> Valider
                                    </Button>
                                  )}
                                  {c.status === "Vérifié" && (
                                    <Button size="sm" variant="outline" className="h-7 text-[10px] border-amber-200 text-amber-700 hover:bg-amber-50" onClick={() => deactivateCouturier(c.id)} data-testid={`button-deactivate-couturier-${c.id}`}>
                                      <XCircle size={12} className="mr-1" /> Désactiver
                                    </Button>
                                  )}
                                  {c.subscriptionPlan === "Pro" && (
                                    <Button size="sm" variant="outline" className="h-7 text-[10px] border-purple-200 text-purple-700 hover:bg-purple-50" onClick={() => downgradeToStarter(c.id, c.name)} data-testid={`button-downgrade-couturier-${c.id}`}>
                                      <ArrowDownCircle size={12} className="mr-1" /> Starter
                                    </Button>
                                  )}
                                  <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => openCouturierDialog(c.id, "edit")} data-testid={`button-edit-couturier-${c.id}`}>
                                    <Pencil size={12} className="mr-1" /> Editer
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => openCouturierDialog(c.id, "view")} data-testid={`button-view-couturier-${c.id}`}>
                                    <Eye size={12} className="mr-1" /> Voir
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-7 text-[10px] border-red-200 text-red-600 hover:bg-red-50" onClick={() => deleteCouturier(c.id)} data-testid={`button-delete-couturier-${c.id}`}>
                                    <Trash2 size={12} className="mr-1" /> Suppr.
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
                          <Ruler size={20} className="text-[#601B28]" />
                          {selectedMeasure?.clientName}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <Badge className={cn("text-[10px] border-none font-bold", selectedMeasure?.status === "Complet" ? "bg-green-100 text-green-700" : selectedMeasure?.status === "Incomplet" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500")} data-testid="badge-measure-detail-status">{selectedMeasure?.status}</Badge>
                          <span className="text-xs text-gray-400" data-testid="text-measure-update">MAJ : {selectedMeasure?.updatedAt}</span>
                        </div>
                        {selectedMeasure && selectedMeasure.filledCount > 0 ? (
                          <div className="grid grid-cols-2 gap-x-6 gap-y-2" data-testid="grid-measure-details">
                            {[
                              { label: "Tour de cou", value: selectedMeasure.neck },
                              { label: "Tour de poitrine", value: selectedMeasure.bust },
                              { label: "Tour de taille", value: selectedMeasure.waist },
                              { label: "Tour de hanches", value: selectedMeasure.hips },
                              { label: "Épaules", value: selectedMeasure.shoulders },
                              { label: "Longueur de bras", value: selectedMeasure.armLength },
                              { label: "Longueur dos", value: selectedMeasure.backLength },
                              { label: "Entrejambe", value: selectedMeasure.inseam },
                              { label: "Taille", value: selectedMeasure.height },
                              { label: "Poids", value: selectedMeasure.weight },
                            ].filter(d => d.value != null).map((d, i) => (
                              <div key={i} className="flex justify-between items-center py-1.5 border-b border-gray-50" data-testid={`measure-detail-${i}`}>
                                <span className="text-sm text-gray-500">{d.label}</span>
                                <span className="text-sm font-semibold text-gray-900">{d.value} cm</span>
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
                          <span className="text-xs text-gray-400">{selectedMeasure?.filledCount}/{selectedMeasure?.totalFields} champs renseignés</span>
                          <Button variant="outline" size="sm" onClick={() => setSelectedMeasure(null)} data-testid="button-close-measure-detail">Fermer</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
                    <DialogContent className="max-w-md" data-testid="dialog-upgrade-pro">
                      <DialogHeader>
                        <DialogTitle className="font-serif text-lg flex items-center gap-3" data-testid="text-upgrade-title">
                          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <ArrowUpRight size={20} className="text-purple-700" />
                          </div>
                          Passez au plan Pro
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-2">
                        <p className="text-sm text-gray-600">
                          Vous avez atteint la limite de <span className="font-bold">10 fiches clients</span> du plan Starter.
                          Passez au plan Pro pour profiter de fonctionnalités illimitées.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="border border-gray-200 rounded-md p-3 opacity-60">
                            <Badge className="bg-blue-100 text-blue-700 border-none text-[10px] font-bold mb-2">STARTER</Badge>
                            <p className="text-sm font-bold">0€/mois</p>
                            <ul className="mt-2 space-y-1 text-xs text-gray-500">
                              <li>15% commission</li>
                              <li>10 fiches max</li>
                              <li>10% frais client</li>
                            </ul>
                          </div>
                          <div className="border-2 border-purple-300 rounded-md p-3 bg-purple-50/30 relative">
                            <Badge className="bg-purple-100 text-purple-700 border-none text-[10px] font-bold mb-2">PRO</Badge>
                            <p className="text-sm font-bold">{settingsSubscriptionPrice}€/mois</p>
                            <ul className="mt-2 space-y-1 text-xs text-gray-700">
                              <li className="font-bold text-green-600">0% commission</li>
                              <li className="font-bold text-green-600">Mesures illimitées</li>
                              <li>10% frais client</li>
                            </ul>
                          </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                          <Button variant="outline" size="sm" onClick={() => setShowUpgradeModal(false)} data-testid="button-close-upgrade-modal">Plus tard</Button>
                          <Button size="sm" className="bg-purple-600 text-white font-bold" onClick={() => { setShowUpgradeModal(false); toast({ title: "Demande envoyée", description: "La demande de passage au plan Pro a été enregistrée." }); }} data-testid="button-confirm-upgrade-pro">
                            <ArrowUpRight size={14} className="mr-1" /> Passer au plan Pro
                          </Button>
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
                              <div className="w-10 h-10 rounded-full bg-[#601B28]/10 flex items-center justify-center text-[#601B28] font-bold flex-shrink-0">{dialogCouturier.firstName[0]}{dialogCouturier.lastName[0]}</div>
                              {dialogCouturier.firstName} {dialogCouturier.lastName}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-5 pt-2">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <Badge className={cn("text-[10px] border-none font-bold", dialogCouturier.status === "Vérifié" ? "bg-green-100 text-green-700" : dialogCouturier.status === "En attente" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500")} data-testid="badge-couturier-dialog-status">{dialogCouturier.status}</Badge>
                              <span className="text-xs text-gray-400" data-testid="text-couturier-registration">Inscrit le {dialogCouturier.registrationDate}</span>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                              <p className="text-xs font-bold uppercase tracking-wider text-[#601B28] mb-3 flex items-center gap-2">
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
                              <p className="text-xs font-bold uppercase tracking-wider text-[#601B28] mb-3 flex items-center gap-2">
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
                              <p className="text-xs font-bold uppercase tracking-wider text-[#601B28] mb-3 flex items-center gap-2">
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
                              <Pencil size={20} className="text-[#601B28]" />
                              Éditer - {dialogCouturier.firstName} {dialogCouturier.lastName}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-5 pt-2">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-[#601B28] mb-3 flex items-center gap-2">
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
                              <p className="text-xs font-bold uppercase tracking-wider text-[#601B28] mb-3 flex items-center gap-2">
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
                              <p className="text-xs font-bold uppercase tracking-wider text-[#601B28] mb-3 flex items-center gap-2">
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
                              <Button size="sm" className="bg-[#601B28] font-bold" onClick={saveCouturierEdit} data-testid="button-save-couturier">
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

              {/* ===== INSCRITS (USERS) ===== */}
              {activeTab === "users" && (() => {
                const filteredUsers = dbUsers.filter((u: any) => {
                  if (usersRoleFilter !== "all" && u.role !== usersRoleFilter) return false;
                  if (usersStatusFilter === "verified" && !u.emailVerified) return false;
                  if (usersStatusFilter === "unverified" && u.emailVerified) return false;
                  return true;
                });
                const totalVerified = dbUsers.filter((u: any) => u.emailVerified).length;

                const totalUnverified = dbUsers.filter((u: any) => !u.emailVerified && u.role !== 'admin').length;

                return (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-2xl lg:text-3xl font-serif font-bold text-gray-900" data-testid="text-page-title-users">Utilisateurs</h1>
                      <p className="text-gray-500 mt-1 text-sm">Gestion des comptes inscrits sur la plateforme</p>
                    </div>
                    {totalUnverified > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-600 hover:bg-red-50 gap-1.5"
                        onClick={() => {
                          if (confirm(`Supprimer ${totalUnverified} compte(s) non activé(s) ? Cette action est irréversible.`)) {
                            deleteUnverifiedMutation.mutate();
                          }
                        }}
                        disabled={deleteUnverifiedMutation.isPending}
                        data-testid="button-delete-unverified"
                      >
                        <Trash2 className="h-4 w-4" />
                        Supprimer non activés ({totalUnverified})
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-900" data-testid="text-total-users">{dbUsers.length}</p>
                          <p className="text-xs text-gray-500">Total inscrits</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-900" data-testid="text-total-verified">{totalVerified}</p>
                          <p className="text-xs text-gray-500">Activés</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                          <User className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-900" data-testid="text-total-clients">{dbUsers.filter((u: any) => u.role === 'client').length}</p>
                          <p className="text-xs text-gray-500">Particuliers</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                          <Briefcase className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-900" data-testid="text-total-pros">{dbUsers.filter((u: any) => u.role === 'tailor').length}</p>
                          <p className="text-xs text-gray-500">Professionnels</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-medium">Rôle :</span>
                      <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                        {[
                          { value: "all", label: "Tous" },
                          { value: "client", label: "Particuliers" },
                          { value: "tailor", label: "Professionnels" },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setUsersRoleFilter(opt.value)}
                            className={cn(
                              "px-3 py-1.5 text-xs font-medium transition-colors",
                              usersRoleFilter === opt.value
                                ? "bg-[#601B28] text-white"
                                : "bg-white text-gray-600 hover:bg-gray-50"
                            )}
                            data-testid={`filter-role-${opt.value}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-medium">Statut :</span>
                      <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                        {[
                          { value: "all", label: "Tous" },
                          { value: "verified", label: "Activés" },
                          { value: "unverified", label: "Non activés" },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setUsersStatusFilter(opt.value)}
                            className={cn(
                              "px-3 py-1.5 text-xs font-medium transition-colors",
                              usersStatusFilter === opt.value
                                ? "bg-[#601B28] text-white"
                                : "bg-white text-gray-600 hover:bg-gray-50"
                            )}
                            data-testid={`filter-status-${opt.value}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <span className="ml-auto text-xs text-gray-400">{filteredUsers.length} résultat{filteredUsers.length !== 1 ? 's' : ''}</span>
                  </div>

                  {usersLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-8 h-8 border-4 border-[#601B28] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-gray-500">Aucun utilisateur trouvé avec ces filtres.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm" data-testid="table-users">
                            <thead>
                              <tr className="border-b border-gray-100 bg-gray-50/50">
                                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Nom</th>
                                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
                                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Inscription</th>
                                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredUsers.map((u: any) => (
                                <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors" data-testid={`row-user-${u.id}`}>
                                  <td className="p-4">
                                    <div className="font-medium text-gray-900">{u.firstName} {u.lastName}</div>
                                    <div className="text-xs text-gray-400 mt-0.5">{u.phone || ''}</div>
                                  </td>
                                  <td className="p-4 text-gray-600">{u.email}</td>
                                  <td className="p-4">
                                    <Badge variant="secondary" className={cn(
                                      "text-[10px] font-bold uppercase",
                                      u.role === 'tailor' ? "bg-amber-100 text-amber-700" :
                                      u.role === 'admin' ? "bg-red-100 text-red-700" :
                                      "bg-blue-100 text-blue-700"
                                    )}>
                                      {u.role === 'tailor' ? 'Pro' : u.role === 'admin' ? 'Admin' : 'Client'}
                                    </Badge>
                                  </td>
                                  <td className="p-4">
                                    {u.emailVerified ? (
                                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full" data-testid={`status-verified-${u.id}`}>
                                        <CheckCircle className="h-3 w-3" />
                                        Activé
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full" data-testid={`status-unverified-${u.id}`}>
                                        <Clock className="h-3 w-3" />
                                        En attente
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-4 text-gray-500 text-xs">
                                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                  </td>
                                  <td className="p-4">
                                    {u.role !== 'admin' && (
                                      <div className="flex items-center gap-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className={cn("h-7 px-2 text-xs", u.emailVerified ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700")}
                                          onClick={() => toggleUserStatusMutation.mutate({ id: u.id, emailVerified: !u.emailVerified })}
                                          data-testid={`button-toggle-${u.id}`}
                                        >
                                          {u.emailVerified ? "Désactiver" : "Activer"}
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                                          onClick={() => {
                                            if (confirm(`Supprimer le compte de ${u.firstName} ${u.lastName} ?`)) {
                                              deleteUserMutation.mutate(u.id);
                                            }
                                          }}
                                          data-testid={`button-delete-user-${u.id}`}
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
                );
              })()}

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
                        <DialogTitle className="text-lg font-bold text-[#601B28]">Ajouter un artisan</DialogTitle>
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
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Plan</label>
                            <select value={newArtisan.subscriptionPlan} onChange={e => setNewArtisan({...newArtisan, subscriptionPlan: e.target.value})} className="mt-1 w-full h-9 text-sm border border-gray-200 rounded-md px-3 bg-white" data-testid="select-new-artisan-subscription">
                              <option value="Starter">Starter (0€/mois)</option>
                              <option value="Pro">Pro ({settingsSubscriptionPrice}€/mois)</option>
                            </select>
                          </div>
                          {newArtisan.subscriptionPlan === "Pro" && (
                            <div>
                              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Statut de paiement</label>
                              <select value={newArtisan.paymentStatus} onChange={e => setNewArtisan({...newArtisan, paymentStatus: e.target.value})} className="mt-1 w-full h-9 text-sm border border-gray-200 rounded-md px-3 bg-white" data-testid="select-new-artisan-payment-status">
                                <option value="En attente">En attente</option>
                                <option value="Payé">Payé</option>
                                <option value="En retard">En retard</option>
                                <option value="Expiré">Expiré</option>
                              </select>
                            </div>
                          )}
                        </div>
                        <div className="bg-gray-50 rounded-md p-3 text-xs text-gray-600 space-y-1">
                          <p className="font-bold text-gray-700">Détails du plan {newArtisan.subscriptionPlan} :</p>
                          {newArtisan.subscriptionPlan === "Starter" ? (
                            <>
                              <p>Commission artisan : <span className="font-bold text-[#601B28]">15%</span></p>
                              <p>Frais de service client : <span className="font-bold">10%</span></p>
                              <p>Outil Mesures : <span className="font-bold">10 fiches max</span></p>
                            </>
                          ) : (
                            <>
                              <p>Abonnement : <span className="font-bold text-[#601B28]">{settingsSubscriptionPrice}€/mois</span></p>
                              <p>Commission artisan : <span className="font-bold text-green-600">0%</span></p>
                              <p>Frais de service client : <span className="font-bold">10%</span></p>
                              <p>Outil Mesures : <span className="font-bold text-green-600">Illimité</span></p>
                            </>
                          )}
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Bio / Présentation</label>
                          <Textarea value={newArtisan.bio} onChange={e => setNewArtisan({...newArtisan, bio: e.target.value})} className="mt-1 text-sm" rows={2} data-testid="input-new-artisan-bio" />
                        </div>
                      </div>
                      <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowAddArtisan(false)} data-testid="button-cancel-add-artisan">Annuler</Button>
                        <Button
                          className="bg-[#601B28] hover:bg-[#4E1522] text-white font-bold"
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
                        <Badge className="bg-purple-50 text-purple-700 border-none px-3 py-1" data-testid="badge-pro-artisans">{artisans.filter(a => a.subscriptionPlan === "Pro").length} Pro</Badge>
                        <Badge className="bg-blue-50 text-blue-700 border-none px-3 py-1" data-testid="badge-starter-artisans">{artisans.filter(a => a.subscriptionPlan === "Starter").length} Starter</Badge>
                      </div>
                      <div className="flex gap-2 items-center flex-wrap">
                        <Button size="sm" className="bg-[#601B28] hover:bg-[#4E1522] text-white font-bold text-xs" onClick={() => setShowAddArtisan(true)} data-testid="button-add-artisan">
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
                                  <div className="w-8 h-8 rounded-full bg-[#601B28]/5 flex items-center justify-center text-[#601B28] font-bold text-xs flex-shrink-0">{a.name[0]}</div>
                                  <span className="text-sm font-semibold">{a.name}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-sm text-gray-600">{a.specialty}</td>
                              <td className="px-5 py-3 text-sm text-gray-600">{a.city}</td>
                              <td className="px-5 py-3 text-xs text-gray-500">{a.email}</td>
                              <td className="px-5 py-3 text-xs text-gray-500">{a.joinDate}</td>
                              <td className="px-5 py-3 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <Badge className={cn("text-[10px] border-none font-bold", a.subscriptionPlan === "Pro" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700")} data-testid={`badge-artisan-plan-${a.id}`}>{a.subscriptionPlan}</Badge>
                                  <span className="text-[9px] text-gray-400">{a.subscriptionPlan === "Pro" ? `${settingsSubscriptionPrice}€/mois · 0% com.` : "0€ · 15% com."}</span>
                                  {a.subscriptionPlan === "Pro" && (
                                    <Badge className={cn("text-[9px] border-none", a.paymentStatus === "Payé" ? "bg-green-100 text-green-700" : a.paymentStatus === "En retard" ? "bg-red-100 text-red-600" : a.paymentStatus === "Expiré" ? "bg-gray-200 text-gray-500" : "bg-amber-100 text-amber-700")} data-testid={`badge-artisan-payment-${a.id}`}>{a.paymentStatus}</Badge>
                                  )}
                                </div>
                              </td>
                              <td className="px-5 py-3 text-center">
                                <Badge className={cn("text-[10px] border-none font-bold", a.status === "Vérifié" ? "bg-green-100 text-green-700" : a.status === "Rejeté" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700")} data-testid={`badge-artisan-status-${a.id}`}>{a.status}</Badge>
                              </td>
                              <td className="px-5 py-3 text-right">
                                <div className="flex justify-end gap-2">
                                  <Button size="sm" variant="outline" className="h-8 text-[11px]" onClick={() => openArtisanDossier(a.id, "view")} data-testid={`button-dossier-${a.id}`}>
                                    <Eye size={14} className="mr-1" /> Dossier
                                  </Button>
                                  {a.status !== "Vérifié" && (
                                    <Button size="sm" className="bg-[#601B28] h-8 text-[11px] font-bold" onClick={() => approveArtisan(a.id)} data-testid={`button-approve-${a.id}`}>
                                      <CheckCircle size={14} className="mr-1" /> Approuver
                                    </Button>
                                  )}
                                  {a.status !== "Rejeté" && (
                                    <Button size="sm" variant="destructive" className="h-8 text-[11px]" onClick={() => rejectArtisan(a.id)} data-testid={`button-reject-${a.id}`}>
                                      <XCircle size={14} className="mr-1" /> Rejeter
                                    </Button>
                                  )}
                                </div>
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
                              <div className="w-10 h-10 rounded-full bg-[#601B28]/10 flex items-center justify-center text-[#601B28] font-bold flex-shrink-0">{dossierArtisan.firstName[0]}{dossierArtisan.lastName[0]}</div>
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
                              <p className="text-xs font-bold uppercase tracking-wider text-[#601B28] mb-3 flex items-center gap-2">
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
                              <p className="text-xs font-bold uppercase tracking-wider text-[#601B28] mb-3 flex items-center gap-2">
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
                              <p className="text-xs font-bold uppercase tracking-wider text-[#601B28] mb-3 flex items-center gap-2">
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
                              <p className="text-xs font-bold uppercase tracking-wider text-[#601B28] mb-3 flex items-center gap-2">
                                <CreditCard size={14} /> Abonnement
                              </p>
                              <div className="grid grid-cols-2 gap-x-6 gap-y-2" data-testid="grid-artisan-subscription">
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">Plan</span>
                                  <Badge className={cn("text-[10px] border-none font-bold", dossierArtisan.subscriptionPlan === "Pro" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700")} data-testid="text-artisan-subscription-plan">{dossierArtisan.subscriptionPlan}</Badge>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">Tarif mensuel</span>
                                  <span className="text-sm font-semibold text-gray-900">{dossierArtisan.subscriptionPlan === "Pro" ? `${settingsSubscriptionPrice}€/mois` : "0€/mois"}</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">Commission artisan</span>
                                  <span className={cn("text-sm font-semibold", dossierArtisan.subscriptionPlan === "Pro" ? "text-green-600" : "text-[#601B28]")}>{dossierArtisan.subscriptionPlan === "Pro" ? "0%" : "15%"}</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">Frais service client</span>
                                  <span className="text-sm font-semibold text-gray-900">10%</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                  <span className="text-xs text-gray-500">Outil Mesures</span>
                                  <span className={cn("text-sm font-semibold", dossierArtisan.subscriptionPlan === "Pro" ? "text-green-600" : "text-gray-900")}>{dossierArtisan.subscriptionPlan === "Pro" ? "Illimité" : "10 fiches max"}</span>
                                </div>
                                {dossierArtisan.subscriptionPlan === "Pro" && (
                                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                    <span className="text-xs text-gray-500">Statut de paiement</span>
                                    <Badge className={cn("text-[10px] border-none font-bold", dossierArtisan.paymentStatus === "Payé" ? "bg-green-100 text-green-700" : dossierArtisan.paymentStatus === "En retard" ? "bg-red-100 text-red-600" : dossierArtisan.paymentStatus === "Expiré" ? "bg-gray-200 text-gray-500" : "bg-amber-100 text-amber-700")} data-testid="badge-artisan-dossier-payment">{dossierArtisan.paymentStatus}</Badge>
                                  </div>
                                )}
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
                              <Pencil size={20} className="text-[#601B28]" />
                              Éditer - {dossierArtisan.firstName} {dossierArtisan.lastName}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-5 pt-2">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-[#601B28] mb-3 flex items-center gap-2">
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
                              <p className="text-xs font-bold uppercase tracking-wider text-[#601B28] mb-3 flex items-center gap-2">
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
                              <p className="text-xs font-bold uppercase tracking-wider text-[#601B28] mb-3 flex items-center gap-2">
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
                              <p className="text-xs font-bold uppercase tracking-wider text-[#601B28] mb-3 flex items-center gap-2">
                                <CreditCard size={14} /> Abonnement
                              </p>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-gray-500">Plan</label>
                                  <select value={artisanEditForm.subscriptionPlan || "Starter"} onChange={e => setArtisanEditForm(p => ({ ...p, subscriptionPlan: e.target.value }))} className="w-full h-9 text-sm border border-gray-200 rounded-md px-3 bg-white" data-testid="select-artisan-edit-subscription">
                                    <option value="Starter">Starter (0€/mois)</option>
                                    <option value="Pro">Pro ({settingsSubscriptionPrice}€/mois)</option>
                                  </select>
                                </div>
                                {(artisanEditForm.subscriptionPlan || "Starter") === "Pro" && (
                                  <div className="space-y-1">
                                    <label className="text-[11px] font-medium text-gray-500">Statut de paiement</label>
                                    <select value={artisanEditForm.paymentStatus || "En attente"} onChange={e => setArtisanEditForm(p => ({ ...p, paymentStatus: e.target.value }))} className="w-full h-9 text-sm border border-gray-200 rounded-md px-3 bg-white" data-testid="select-artisan-edit-payment-status">
                                      <option value="En attente">En attente</option>
                                      <option value="Payé">Payé</option>
                                      <option value="En retard">En retard</option>
                                      <option value="Expiré">Expiré</option>
                                    </select>
                                  </div>
                                )}
                              </div>
                              <div className="bg-gray-50 rounded-md p-3 mt-3 text-xs text-gray-600 space-y-1">
                                <p className="font-bold text-gray-700">Détails du plan {artisanEditForm.subscriptionPlan || "Starter"} :</p>
                                {(artisanEditForm.subscriptionPlan || "Starter") === "Starter" ? (
                                  <>
                                    <p>Commission artisan : <span className="font-bold text-[#601B28]">15%</span> | Frais client : <span className="font-bold">10%</span></p>
                                    <p>Mesures : <span className="font-bold">10 fiches max</span></p>
                                  </>
                                ) : (
                                  <>
                                    <p>Abonnement : <span className="font-bold text-[#601B28]">{settingsSubscriptionPrice}€/mois</span></p>
                                    <p>Commission artisan : <span className="font-bold text-green-600">0%</span> | Frais client : <span className="font-bold">10%</span></p>
                                    <p>Mesures : <span className="font-bold text-green-600">Illimité</span></p>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                              <Button variant="outline" size="sm" onClick={closeArtisanDossier} data-testid="button-artisan-cancel-edit">Annuler</Button>
                              <Button size="sm" className="bg-[#601B28] font-bold" onClick={saveArtisanEdit} data-testid="button-save-artisan-dossier">
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

              {/* ===== REVIEWS ===== */}
              {activeTab === "reviews" && (
                <>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h1 className="text-2xl lg:text-3xl font-serif font-bold text-gray-900">Avis clients</h1>
                      <p className="text-gray-500 mt-1 text-sm">Modération des évaluations laissées sur les artisans</p>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                      <Badge className="bg-[#601B28]/5 text-[#601B28] border-none px-3 py-1">{adminReviews.length} avis</Badge>
                      <Badge className="bg-amber-50 text-amber-700 border-none px-3 py-1">{adminReviews.filter(r => r.rating <= 2).length} négatifs</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[5,4,3,2,1].slice(0,4).map(star => (
                      <Card key={star} className="border-none shadow-sm">
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                            <Star size={16} className="text-amber-500 fill-amber-400" />
                          </div>
                          <div>
                            <p className="text-xl font-bold text-gray-900">{adminReviews.filter(r => r.rating === star).length}</p>
                            <p className="text-xs text-gray-500">{star} étoile{star > 1 ? "s" : ""}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Card className="border-none shadow-sm overflow-hidden bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-[11px] uppercase tracking-wider text-gray-400 bg-gray-50/30">
                            <th className="px-5 py-3 font-bold">Client</th>
                            <th className="px-5 py-3 font-bold">Artisan</th>
                            <th className="px-5 py-3 font-bold">Note</th>
                            <th className="px-5 py-3 font-bold">Commentaire</th>
                            <th className="px-5 py-3 font-bold">Date</th>
                            <th className="px-5 py-3 text-center font-bold">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {reviewsLoading && (
                            <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-400">Chargement…</td></tr>
                          )}
                          {!reviewsLoading && adminReviews.length === 0 && (
                            <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-400">Aucun avis pour l'instant</td></tr>
                          )}
                          {adminReviews.map(review => (
                            <tr key={review.id} className="hover:bg-gray-50/50 transition-colors" data-testid={`row-review-${review.id}`}>
                              <td className="px-5 py-3 text-sm font-semibold">{review.clientName}</td>
                              <td className="px-5 py-3 text-sm text-gray-600">{review.tailorName}</td>
                              <td className="px-5 py-3">
                                <div className="flex gap-0.5">
                                  {[1,2,3,4,5].map(s => (
                                    <Star key={s} size={12} className={s <= review.rating ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"} />
                                  ))}
                                </div>
                              </td>
                              <td className="px-5 py-3 text-xs text-gray-500 max-w-[200px] truncate">{review.comment || <span className="italic text-gray-300">Aucun commentaire</span>}</td>
                              <td className="px-5 py-3 text-xs text-gray-500">{review.createdAt}</td>
                              <td className="px-5 py-3 text-center">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-[11px] text-red-600 border-red-100 hover:bg-red-50"
                                  disabled={deleteReviewMutation.isPending}
                                  onClick={() => {
                                    if (confirm(`Supprimer l'avis de ${review.clientName} ? Cette action est irréversible.`)) {
                                      deleteReviewMutation.mutate(review.id);
                                    }
                                  }}
                                  data-testid={`button-delete-review-${review.id}`}
                                >
                                  <Trash2 size={13} className="mr-1" /> Supprimer
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </>
              )}

              {/* ===== SUBSCRIPTIONS ===== */}
              {activeTab === "subscriptions" && (() => {
                const starterArtisans = artisans.filter(a => a.subscriptionPlan === "Starter");
                const proArtisans = artisans.filter(a => a.subscriptionPlan === "Pro");
                const proRevenue = proArtisans.filter(a => a.paymentStatus === "Payé").length * parseFloat(settingsSubscriptionPrice || "29");
                const latePayments = artisans.filter(a => a.paymentStatus === "En retard" || a.paymentStatus === "Expiré");
                return (
                  <>
                    <div>
                      <h1 className="text-2xl lg:text-3xl font-serif font-bold text-gray-900">Abonnements</h1>
                      <p className="text-gray-500 mt-1 text-sm">Suivi des plans et revenus d'abonnements artisans</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <Card className="border-none shadow-sm">
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                            <Package size={18} className="text-gray-500" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-gray-900">{starterArtisans.length}</p>
                            <p className="text-xs text-gray-500">Plan Starter</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border-none shadow-sm">
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                            <CreditCard size={18} className="text-purple-600" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-gray-900">{proArtisans.length}</p>
                            <p className="text-xs text-gray-500">Plan Pro</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border-none shadow-sm">
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                            <TrendingUp size={18} className="text-green-600" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-gray-900">{proRevenue.toLocaleString("fr-FR")} €</p>
                            <p className="text-xs text-gray-500">Revenus / mois</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border-none shadow-sm">
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                            <ShieldAlert size={18} className="text-red-500" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-red-600">{latePayments.length}</p>
                            <p className="text-xs text-gray-500">Paiements en retard</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="border-none shadow-sm overflow-hidden bg-white">
                      <div className="p-5 border-b border-gray-50 flex items-center justify-between gap-4 flex-wrap">
                        <CardTitle className="text-base font-serif">Détail par artisan</CardTitle>
                        <div className="flex gap-2 flex-wrap">
                          <Badge className="bg-[#601B28]/5 text-[#601B28] border-none px-3 py-1">{artisans.length} artisans</Badge>
                          <Badge className="bg-purple-50 text-purple-700 border-none px-3 py-1">{proArtisans.length} Pro</Badge>
                          <Badge className="bg-gray-50 text-gray-600 border-none px-3 py-1">{starterArtisans.length} Starter</Badge>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="text-[11px] uppercase tracking-wider text-gray-400 bg-gray-50/30">
                              <th className="px-5 py-3 font-bold">Artisan</th>
                              <th className="px-5 py-3 font-bold">Spécialité</th>
                              <th className="px-5 py-3 font-bold text-center">Plan</th>
                              <th className="px-5 py-3 font-bold text-center">Montant</th>
                              <th className="px-5 py-3 font-bold text-center">Statut paiement</th>
                              <th className="px-5 py-3 text-center font-bold">Commission</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {artisans.length === 0 && (
                              <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-400">Aucun artisan</td></tr>
                            )}
                            {artisans.map(a => {
                              const isPro = a.subscriptionPlan === "Pro";
                              const payBadgeColor = a.paymentStatus === "Payé" ? "bg-green-100 text-green-700" : a.paymentStatus === "En retard" ? "bg-red-100 text-red-700" : a.paymentStatus === "Expiré" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500";
                              return (
                                <tr key={a.id} className="hover:bg-gray-50/50 transition-colors" data-testid={`row-subscription-${a.id}`}>
                                  <td className="px-5 py-3">
                                    <p className="text-sm font-semibold">{a.name}</p>
                                    <p className="text-xs text-gray-400">{a.email}</p>
                                  </td>
                                  <td className="px-5 py-3 text-sm text-gray-600">{a.specialty || "—"}</td>
                                  <td className="px-5 py-3 text-center">
                                    <Badge className={cn("text-[10px] border-none font-bold", isPro ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600")}>{a.subscriptionPlan || "Starter"}</Badge>
                                  </td>
                                  <td className="px-5 py-3 text-center text-sm font-bold text-gray-800">{isPro ? `${settingsSubscriptionPrice} €/mois` : "0 €"}</td>
                                  <td className="px-5 py-3 text-center">
                                    <Badge className={cn("text-[10px] border-none font-bold", payBadgeColor)}>{a.paymentStatus || "—"}</Badge>
                                  </td>
                                  <td className="px-5 py-3 text-center text-sm text-gray-600">{isPro ? "0%" : "15%"}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </>
                );
              })()}

              {/* ===== COMMANDES GROUPÉES ===== */}
              {activeTab === "events" && (
                <>
                  <div className="flex justify-between items-end gap-4 flex-wrap">
                    <div>
                      <h1 className="text-2xl lg:text-3xl font-serif font-bold text-gray-900">Commandes Groupées</h1>
                      <p className="text-gray-500 mt-1 text-sm">{adminEvents.length} commande(s) groupée(s)</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Badge className="bg-amber-50 text-amber-700 border-none">{adminEvents.filter((e: any) => e.status === 'pending_tailor_approval').length} en attente</Badge>
                      <Badge className="bg-green-50 text-green-700 border-none">{adminEvents.filter((e: any) => e.status === 'active').length} actives</Badge>
                      <Badge className="bg-red-50 text-red-700 border-none">{adminEvents.filter((e: any) => e.status === 'rejected').length} refusées</Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {adminEvents.length === 0 ? (
                      <Card className="border-none shadow-sm">
                        <div className="py-12 text-center text-gray-400">Aucune commande groupée</div>
                      </Card>
                    ) : adminEvents.map((ev: any) => {
                      const isExpanded = expandedEventId === ev.id;
                      const paidCount = Number(ev.paid_count ?? 0);
                      const totalCount = Number(ev.participant_count ?? 0);
                      const allPaid = totalCount > 0 && paidCount === totalCount;
                      const alreadyReleased = !!ev.payment_released;
                      return (
                        <Card key={ev.id} className="border-none shadow-sm overflow-hidden">
                          {/* Ligne principale */}
                          <div
                            className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50/60 transition-colors"
                            onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}
                            data-testid={`row-event-${ev.id}`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-gray-900 text-sm truncate">{ev.name}</span>
                                {ev.status === 'active' ? (
                                  <Badge className="bg-green-50 text-green-700 border-none text-xs">Active</Badge>
                                ) : ev.status === 'rejected' ? (
                                  <Badge className="bg-red-50 text-red-700 border-none text-xs">Refusée</Badge>
                                ) : (
                                  <Badge className="bg-amber-50 text-amber-700 border-none text-xs">En attente</Badge>
                                )}
                                {alreadyReleased && (
                                  <Badge className="bg-purple-50 text-purple-700 border-none text-xs">Libéré</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                                <span>✂️ {ev.tailor_first_name} {ev.tailor_last_name}</span>
                                <span>👤 {ev.organizer_first_name} {ev.organizer_last_name}</span>
                                {ev.event_date && <span>📅 {new Date(ev.event_date).toLocaleDateString("fr-FR")}</span>}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-sm font-medium text-gray-700">
                                {paidCount}/{totalCount} payé{totalCount > 1 ? "s" : ""}
                              </div>
                              {ev.price_per_person && (
                                <div className="text-xs text-gray-400">{ev.price_per_person} €/pers.</div>
                              )}
                            </div>
                            <ChevronRight className={`h-4 w-4 text-gray-400 shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                          </div>

                          {/* Détail expandable */}
                          {isExpanded && (
                            <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4 space-y-4">
                              {participantsLoading ? (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
                                </div>
                              ) : expandedParticipants.length === 0 ? (
                                <p className="text-sm text-gray-400 italic">Aucun participant pour l'instant.</p>
                              ) : (
                                <div className="space-y-2">
                                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Participants</p>
                                  {expandedParticipants.map((p: any) => (
                                    <div key={p.id} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 border border-gray-100">
                                      <div className="h-8 w-8 rounded-full bg-[#601B28]/10 flex items-center justify-center text-[#601B28] text-xs font-bold shrink-0">
                                        {(p.first_name?.[0] || "?").toUpperCase()}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900">{p.first_name} {p.last_name}</p>
                                        <p className="text-xs text-gray-400">{p.email}</p>
                                      </div>
                                      {p.payment_status === "paid" ? (
                                        <Badge className="bg-green-100 text-green-700 border-none text-xs">
                                          <CheckCircle className="h-3 w-3 mr-1" />Payé
                                        </Badge>
                                      ) : p.payment_status === "awaiting_payment" ? (
                                        <Badge className="bg-amber-50 text-amber-700 border-none text-xs">En attente</Badge>
                                      ) : (
                                        <Badge className="bg-gray-100 text-gray-500 border-none text-xs">Non payé</Badge>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Barre de progression paiement */}
                              {totalCount > 0 && (
                                <div>
                                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                                    <span>Paiements reçus</span>
                                    <span>{paidCount}/{totalCount}</span>
                                  </div>
                                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-[#601B28] rounded-full transition-all"
                                      style={{ width: `${totalCount > 0 ? (paidCount / totalCount) * 100 : 0}%` }}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Bouton libérer */}
                              {ev.status === "active" && !alreadyReleased && (
                                <Button
                                  className={`w-full ${allPaid ? "bg-[#601B28] hover:bg-[#4E1522] text-white" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                                  disabled={!allPaid || releaseEventMutation.isPending}
                                  onClick={() => allPaid && releaseEventMutation.mutate(ev.id)}
                                  data-testid={`button-release-event-${ev.id}`}
                                >
                                  {releaseEventMutation.isPending ? (
                                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Libération…</>
                                  ) : allPaid ? (
                                    <><CheckCircle className="h-4 w-4 mr-2" />Valider & libérer le paiement</>
                                  ) : (
                                    <>En attente de tous les paiements ({paidCount}/{totalCount})</>
                                  )}
                                </Button>
                              )}
                              {alreadyReleased && (
                                <div className="flex items-center gap-2 text-sm text-purple-700 bg-purple-50 rounded-xl px-3 py-2">
                                  <CheckCircle className="h-4 w-4" />
                                  Paiement libéré — fonds transférés à l'artisan
                                </div>
                              )}
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
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
                    <Button className="bg-[#601B28] font-bold" onClick={() => setShowNewArticle(true)} data-testid="button-new-article">
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
                        <div>
                          <label className="block text-xs text-gray-500 mb-1.5">Image de couverture</label>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#601B28] hover:bg-[#601B28]/5 transition-colors" data-testid="button-upload-article-image">
                              <Upload className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-500">Choisir une image</span>
                              <input type="file" accept="image/*" className="hidden" onChange={handleArticleImageChange} />
                            </label>
                            {newArticleImageUrl && (
                              <div className="relative">
                                <img src={newArticleImageUrl} alt="Aperçu" className="h-16 w-24 object-cover rounded-lg border" />
                                <button onClick={() => setNewArticleImageUrl("")} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
                                  <X size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 mb-1">
                          <button type="button" className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Gras" onClick={() => applyFormat(newArticleRef, setNewArticleContent, "b")} data-testid="button-format-bold"><Bold className="h-4 w-4" /></button>
                          <button type="button" className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Italique" onClick={() => applyFormat(newArticleRef, setNewArticleContent, "i")} data-testid="button-format-italic"><Italic className="h-4 w-4" /></button>
                          <button type="button" className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Souligné" onClick={() => applyFormat(newArticleRef, setNewArticleContent, "u")} data-testid="button-format-underline"><Underline className="h-4 w-4" /></button>
                          <span className="text-[10px] text-gray-400 ml-2">Sélectionnez du texte puis cliquez</span>
                        </div>
                        <Textarea ref={newArticleRef} placeholder="Contenu de l'article..." value={newArticleContent} onChange={e => setNewArticleContent(e.target.value)} className="min-h-[120px] text-sm" data-testid="input-article-content" />
                        <Textarea placeholder="Extrait / résumé (affiché sur la liste des articles)" value={newArticleExcerpt} onChange={e => setNewArticleExcerpt(e.target.value)} className="min-h-[60px] text-sm" data-testid="input-article-excerpt" />
                        <div className="flex justify-end gap-3">
                          <Button variant="outline" onClick={() => setShowNewArticle(false)} data-testid="button-cancel-article">Annuler</Button>
                          <Button className="bg-[#601B28] font-bold" onClick={createArticle} data-testid="button-save-article">Enregistrer</Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="border-none shadow-sm overflow-hidden bg-white">
                    <div className="p-5 border-b border-gray-50 flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex gap-2 flex-wrap">
                        <Badge className="bg-[#601B28]/5 text-[#601B28] border-none px-3 py-1" data-testid="badge-total-articles">{articles.length} articles</Badge>
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
                              <td className="px-5 py-3 text-xs text-gray-500">{a.createdAt ? new Date(a.createdAt).toLocaleDateString("fr-FR") : "—"}</td>
                              <td className="px-5 py-3 text-center">
                                <Badge className={cn("text-[10px] border-none font-bold", a.status === "Publié" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500")} data-testid={`badge-article-status-${a.id}`}>{a.status}</Badge>
                              </td>
                              <td className="px-5 py-3 text-right text-sm text-gray-600">{(a.views || 0).toLocaleString()}</td>
                              <td className="px-5 py-3 text-right">
                                <div className="flex justify-end gap-2">
                                  <Button size="sm" variant="outline" className="h-8 text-[11px] font-bold" onClick={() => openEditArticle(a)} data-testid={`button-edit-article-${a.id}`}>
                                    <Pencil size={12} className="mr-1" /> Modifier
                                  </Button>
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

                  <Dialog open={!!editingArticleId} onOpenChange={(open) => { if (!open) setEditingArticleId(null); }}>
                    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="dialog-edit-article">
                      <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-[#601B28]">Modifier l'article</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <Input placeholder="Titre de l'article" value={editArticleTitle} onChange={e => setEditArticleTitle(e.target.value)} className="h-11 font-semibold" data-testid="input-edit-article-title" />
                        <Input placeholder="Catégorie" value={editArticleCategory} onChange={e => setEditArticleCategory(e.target.value)} className="h-10 text-sm" data-testid="input-edit-article-category" />
                        <div>
                          <label className="block text-xs text-gray-500 mb-1.5">Image de couverture</label>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#601B28] hover:bg-[#601B28]/5 transition-colors">
                              <Upload className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-500">Changer l'image</span>
                              <input type="file" accept="image/*" className="hidden" onChange={handleEditArticleImageChange} />
                            </label>
                            {editArticleImageUrl && (
                              <div className="relative">
                                <img src={editArticleImageUrl} alt="Aperçu" className="h-16 w-24 object-cover rounded-lg border" />
                                <button onClick={() => setEditArticleImageUrl("")} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
                                  <X size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 mb-1">
                          <button type="button" className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Gras" onClick={() => applyFormat(editArticleRef, setEditArticleContent, "b")} data-testid="button-edit-format-bold"><Bold className="h-4 w-4" /></button>
                          <button type="button" className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Italique" onClick={() => applyFormat(editArticleRef, setEditArticleContent, "i")} data-testid="button-edit-format-italic"><Italic className="h-4 w-4" /></button>
                          <button type="button" className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Souligné" onClick={() => applyFormat(editArticleRef, setEditArticleContent, "u")} data-testid="button-edit-format-underline"><Underline className="h-4 w-4" /></button>
                          <span className="text-[10px] text-gray-400 ml-2">Sélectionnez du texte puis cliquez</span>
                        </div>
                        <Textarea ref={editArticleRef} placeholder="Contenu de l'article..." value={editArticleContent} onChange={e => setEditArticleContent(e.target.value)} className="min-h-[200px] text-sm" data-testid="input-edit-article-content" />
                        <Textarea placeholder="Extrait / résumé (affiché sur la liste des articles)" value={editArticleExcerpt} onChange={e => setEditArticleExcerpt(e.target.value)} className="min-h-[60px] text-sm" data-testid="input-edit-article-excerpt" />
                      </div>
                      <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setEditingArticleId(null)} data-testid="button-cancel-edit-article">Annuler</Button>
                        <Button className="bg-[#601B28] hover:bg-[#4E1522] text-white font-bold" onClick={saveEditArticle} disabled={!editArticleTitle.trim()} data-testid="button-save-edit-article">Enregistrer</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
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
                          <div className="w-8 h-8 rounded-md bg-[#601B28]/10 flex items-center justify-center">
                            <Globe size={16} className="text-[#601B28]" />
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
                          <h3 className="font-bold text-sm text-gray-800">Plans & Tarification</h3>
                        </div>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="border border-blue-200 rounded-md p-3 bg-blue-50/30">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-blue-100 text-blue-700 border-none text-[10px] font-bold">STARTER</Badge>
                              </div>
                              <p className="text-lg font-bold text-gray-900">0€<span className="text-xs font-normal text-gray-500">/mois</span></p>
                              <div className="mt-2 space-y-1 text-xs text-gray-600">
                                <p>Commission artisan : <span className="font-bold text-[#601B28]">15%</span></p>
                                <p>Frais service client : <span className="font-bold">10%</span></p>
                                <p>Mesures : <span className="font-bold">10 fiches max</span></p>
                              </div>
                            </div>
                            <div className="border border-purple-200 rounded-md p-3 bg-purple-50/30">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-purple-100 text-purple-700 border-none text-[10px] font-bold">PRO</Badge>
                              </div>
                              <p className="text-lg font-bold text-gray-900">{settingsSubscriptionPrice}€<span className="text-xs font-normal text-gray-500">/mois</span></p>
                              <div className="mt-2 space-y-1 text-xs text-gray-600">
                                <p>Commission artisan : <span className="font-bold text-green-600">0%</span></p>
                                <p>Frais service client : <span className="font-bold">10%</span></p>
                                <p>Mesures : <span className="font-bold text-green-600">Illimité</span></p>
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Prix abonnement Pro (€)</label>
                            <Input type="number" min="0" value={settingsSubscriptionPrice} onChange={(e) => setSettingsSubscriptionPrice(e.target.value)} className="mt-1 h-9 text-sm" data-testid="input-settings-subscription-price" />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Période d'essai gratuit (jours)</label>
                            <Input type="number" min="0" value={settingsTrialDays} onChange={(e) => setSettingsTrialDays(e.target.value)} className="mt-1 h-9 text-sm" data-testid="input-settings-trial-days" />
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
                                className={cn("w-10 h-5 rounded-full transition-colors relative", n.val ? "bg-[#601B28]" : "bg-gray-300")}
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
                                className={cn("w-10 h-5 rounded-full transition-colors relative", s.val ? "bg-[#601B28]" : "bg-gray-300")}
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
                      className="bg-[#601B28] hover:bg-[#4E1522] text-white font-bold text-sm"
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
