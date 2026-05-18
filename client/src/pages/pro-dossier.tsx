import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  FolderOpen,
  CheckCircle,
  Clock,
  AlertTriangle,
  Upload,
  FileCheck,
  Trash2,
  CalendarDays,
  ShieldAlert,
  Info,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

type DossierStatus = "pending" | "validated" | "expired";

interface DossierData {
  siret: string | null;
  dossierStatus: DossierStatus;
  kbisUrl: string | null;
  kbisExpiry: string | null;
  idDocUrl: string | null;
  rcProUrl: string | null;
  ribUrl: string | null;
}

const STATUS_CONFIG: Record<DossierStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: {
    label: "En cours de vérification",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    icon: Clock,
  },
  validated: {
    label: "Dossier validé",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
  },
  expired: {
    label: "Dossier expiré",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: AlertTriangle,
  },
};

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

interface UploadZoneProps {
  label: string;
  description: string;
  field: string;
  hasFile: boolean;
  onUpload: (field: string, value: string) => void;
  onDelete: (field: string) => void;
  isPending: boolean;
  accept?: string;
}

function UploadZone({ label, description, field, hasFile, onUpload, onDelete, isPending, accept = "" }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Fichier trop volumineux", description: "Maximum 5 Mo autorisé.", variant: "destructive" });
      return;
    }
    const base64 = await toBase64(file);
    onUpload(field, base64);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50">
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
        hasFile ? "bg-green-100" : "bg-white border border-dashed border-gray-300"
      )}>
        {hasFile
          ? <FileCheck className="h-5 w-5 text-green-600" />
          : <Upload className="h-5 w-5 text-gray-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 text-sm">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{hasFile ? "Document chargé" : description}</p>
      </div>
      <div className="flex gap-2 shrink-0">
        {hasFile && (
          <Button
            size="sm"
            variant="ghost"
            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
            onClick={() => onDelete(field)}
            disabled={isPending}
            data-testid={`button-delete-${field}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="text-[#601B28] border-[#601B28]/30 hover:bg-[#601B28]/5 text-xs h-8"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          data-testid={`button-upload-${field}`}
        >
          {hasFile ? "Remplacer" : "Charger"}
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

export default function ProDossier() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [siretInput, setSiretInput] = useState("");
  const [siretEditing, setSiretEditing] = useState(false);
  const [expiryInput, setExpiryInput] = useState("");
  const [expiryEditing, setExpiryEditing] = useState(false);

  const { data: dossier, isLoading } = useQuery<DossierData>({
    queryKey: ["/api/professionnel/dossier"],
    onSuccess: (data: DossierData) => {
      if (data.siret) setSiretInput(data.siret);
      if (data.kbisExpiry) setExpiryInput(data.kbisExpiry.slice(0, 10));
    },
  } as any);

  const updateMutation = useMutation({
    mutationFn: ({ field, value }: { field: string; value: string | null }) =>
      apiRequest("POST", "/api/professionnel/dossier", { field, value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/professionnel/dossier"] });
      toast({ title: "Mis à jour", description: "Dossier enregistré avec succès." });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de mettre à jour le dossier.", variant: "destructive" });
    },
  });

  function handleUpload(field: string, value: string) {
    updateMutation.mutate({ field, value });
  }

  function handleDelete(field: string) {
    updateMutation.mutate({ field, value: null });
  }

  function saveSiret() {
    updateMutation.mutate({ field: "siret", value: siretInput.trim() || null });
    setSiretEditing(false);
  }

  function saveExpiry() {
    updateMutation.mutate({ field: "kbis_expiry", value: expiryInput || null });
    setExpiryEditing(false);
  }

  const status = dossier?.dossierStatus ?? "pending";
  const statusConf = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const StatusIcon = statusConf.icon;

  const kbisExpiryDays = dossier?.kbisExpiry ? daysUntil(dossier.kbisExpiry) : null;
  const kbisAlert = kbisExpiryDays !== null && kbisExpiryDays <= 90;
  const kbisCritical = kbisExpiryDays !== null && kbisExpiryDays <= 30;

  return (
    <div className="min-h-screen pb-20 lg:pb-8 bg-white">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white border border-[#601B28] flex items-center justify-center">
              <FolderOpen className="h-5 w-5 text-[#601B28]" />
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl text-[#601B28]">
              {t("nav.dossier")}
            </h1>
          </div>
          <p className="text-gray-600 mt-2">
            Gérez vos documents professionnels et justificatifs légaux.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 lg:px-6 py-6 space-y-5">

        {/* Statut du dossier */}
        <Card className="border border-gray-100 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Statut du dossier</p>
                <div className={cn(
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold",
                  statusConf.color
                )} data-testid="badge-dossier-status">
                  <StatusIcon className="h-4 w-4" />
                  {statusConf.label}
                </div>
              </div>
              {status === "pending" && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 flex-1 min-w-0">
                  <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-800">
                    Votre dossier est en cours de vérification par notre équipe. Vous serez notifié dès qu'il sera validé.
                  </p>
                </div>
              )}
              {status === "expired" && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 flex-1 min-w-0">
                  <ShieldAlert className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-800">
                    Votre dossier a expiré. Merci de recharger vos documents pour le renouveler.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* SIRET */}
        <Card className="border border-gray-100 shadow-sm">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-gray-900">Numéro SIRET</Label>
              {!siretEditing && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-[#601B28] h-7"
                  onClick={() => setSiretEditing(true)}
                  data-testid="button-edit-siret"
                >
                  Modifier
                </Button>
              )}
            </div>
            {siretEditing ? (
              <div className="flex gap-2">
                <Input
                  value={siretInput}
                  onChange={e => setSiretInput(e.target.value)}
                  placeholder="Ex : 12345678900012"
                  maxLength={14}
                  className="font-mono text-sm"
                  data-testid="input-siret"
                />
                <Button
                  size="sm"
                  className="bg-[#601B28] hover:bg-[#4E1522] text-white shrink-0"
                  onClick={saveSiret}
                  disabled={updateMutation.isPending}
                  data-testid="button-save-siret"
                >
                  Enregistrer
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setSiretEditing(false); setSiretInput(dossier?.siret || ""); }}
                >
                  Annuler
                </Button>
              </div>
            ) : (
              <div
                className="px-3 py-2 bg-gray-50 rounded-lg font-mono text-sm text-gray-700 border border-gray-100 select-all"
                data-testid="text-siret"
              >
                {dossier?.siret || <span className="text-gray-400 font-sans font-normal">Non renseigné</span>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents */}
        <Card className="border border-gray-100 shadow-sm">
          <CardContent className="p-5 space-y-4">
            <p className="text-sm font-semibold text-gray-900">Documents justificatifs</p>
            <p className="text-xs text-gray-500 -mt-2">Formats acceptés : PDF, JPG, PNG — 5 Mo max par fichier</p>

            {/* Kbis */}
            <div className="space-y-2">
              <UploadZone
                label="Extrait Kbis"
                description="Document officiel d'immatriculation"
                field="kbis_url"
                hasFile={!!dossier?.kbisUrl}
                onUpload={handleUpload}
                onDelete={handleDelete}
                isPending={updateMutation.isPending}
              />
              {/* Kbis expiry */}
              <div className="flex items-center gap-3 pl-14">
                <CalendarDays className={cn("h-4 w-4 shrink-0", kbisCritical ? "text-red-500" : kbisAlert ? "text-amber-500" : "text-gray-400")} />
                {expiryEditing ? (
                  <div className="flex gap-2 flex-1">
                    <Input
                      type="date"
                      value={expiryInput}
                      onChange={e => setExpiryInput(e.target.value)}
                      className="text-xs h-7 w-40"
                      data-testid="input-kbis-expiry"
                    />
                    <Button size="sm" className="bg-[#601B28] hover:bg-[#4E1522] text-white h-7 text-xs" onClick={saveExpiry} disabled={updateMutation.isPending}>OK</Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setExpiryEditing(false)}>Annuler</Button>
                  </div>
                ) : (
                  <button
                    className="text-xs text-gray-500 hover:text-[#601B28] transition-colors text-left"
                    onClick={() => setExpiryEditing(true)}
                    data-testid="button-edit-kbis-expiry"
                  >
                    {dossier?.kbisExpiry
                      ? <>Expire le <strong>{new Date(dossier.kbisExpiry).toLocaleDateString("fr-FR")}</strong></>
                      : "Ajouter une date d'expiration"}
                  </button>
                )}
              </div>
              {kbisAlert && dossier?.kbisExpiry && (
                <div className={cn(
                  "flex items-center gap-2 text-xs rounded-lg px-3 py-2 ml-14",
                  kbisCritical
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                )} data-testid="alert-kbis-expiry">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {kbisCritical
                    ? `Votre Kbis expire dans ${kbisExpiryDays} jour${kbisExpiryDays! === 1 ? "" : "s"} — renouvelez-le d'urgence.`
                    : `Votre Kbis expire dans ${kbisExpiryDays} jours — pensez à le renouveler.`}
                </div>
              )}
            </div>

            {/* Pièce d'identité */}
            <UploadZone
              label="Pièce d'identité"
              description="Carte nationale d'identité ou passeport"
              field="id_doc_url"
              hasFile={!!dossier?.idDocUrl}
              onUpload={handleUpload}
              onDelete={handleDelete}
              isPending={updateMutation.isPending}
            />

            {/* RC Pro */}
            <UploadZone
              label="Assurance RC Pro"
              description="Attestation de responsabilité civile professionnelle"
              field="rc_pro_url"
              hasFile={!!dossier?.rcProUrl}
              onUpload={handleUpload}
              onDelete={handleDelete}
              isPending={updateMutation.isPending}
            />

            {/* RIB */}
            <UploadZone
              label="RIB"
              description="Relevé d'identité bancaire pour les paiements"
              field="rib_url"
              hasFile={!!dossier?.ribUrl}
              onUpload={handleUpload}
              onDelete={handleDelete}
              isPending={updateMutation.isPending}
            />
          </CardContent>
        </Card>

        {/* Avancement */}
        {dossier && (() => {
          const docs = [dossier.kbisUrl, dossier.idDocUrl, dossier.rcProUrl, dossier.ribUrl];
          const uploaded = docs.filter(Boolean).length;
          return (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">Complétude du dossier</span>
                <span className="text-xs font-bold text-[#601B28]">{uploaded} / 4 documents</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={cn("h-2 rounded-full transition-all", uploaded === 4 ? "bg-green-500" : uploaded >= 2 ? "bg-amber-500" : "bg-[#601B28]")}
                  style={{ width: `${(uploaded / 4) * 100}%` }}
                  data-testid="progress-dossier"
                />
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}
