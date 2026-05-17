import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Clock,
  XCircle,
  Upload,
  ExternalLink,
  FileText,
  ShieldCheck,
  CreditCard,
  User,
  Building2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DossierData {
  siret: string | null;
  kbisUrl: string | null;
  kbisExpiryDate: string | null;
  idCardUrl: string | null;
  rcProUrl: string | null;
  ibanRib: string | null;
  dossierStatus: "pending" | "validated" | "rejected";
  dossierRejectionReason: string | null;
}

const DOC_TYPES: {
  key: keyof DossierData;
  urlKey: keyof DossierData;
  label: string;
  icon: React.ElementType;
  docType: string;
  hint: string;
}[] = [
  {
    key: "kbisUrl",
    urlKey: "kbisUrl",
    label: "Extrait Kbis",
    icon: Building2,
    docType: "kbis",
    hint: "Extrait de moins de 3 mois",
  },
  {
    key: "idCardUrl",
    urlKey: "idCardUrl",
    label: "Pièce d'identité",
    icon: User,
    docType: "idCard",
    hint: "Carte nationale ou passeport valide",
  },
  {
    key: "rcProUrl",
    urlKey: "rcProUrl",
    label: "RC Professionnelle",
    icon: ShieldCheck,
    docType: "rcPro",
    hint: "Attestation d'assurance en cours de validité",
  },
  {
    key: "ibanRib",
    urlKey: "ibanRib",
    label: "IBAN / RIB",
    icon: CreditCard,
    docType: "ibanRib",
    hint: "RIB au nom de votre entreprise ou à votre nom",
  },
];

/** Extrait le nom d'origine et la date d'upload depuis une URL multer `TIMESTAMP-originalname` */
function getFileInfo(url: string | null): { filename: string; uploadedAt: Date | null } | null {
  if (!url) return null;
  const segment = url.split("/").pop() ?? "";
  const dashIdx = segment.indexOf("-");
  if (dashIdx === -1) return { filename: segment, uploadedAt: null };
  const ts = Number(segment.slice(0, dashIdx));
  const filename = segment.slice(dashIdx + 1).replace(/_/g, " ");
  const uploadedAt = Number.isFinite(ts) && ts > 0 ? new Date(ts) : null;
  return { filename, uploadedAt };
}

function isUploadUrl(value: string | null): boolean {
  if (!value) return false;
  return value.startsWith("/uploads/") || value.startsWith("http");
}

function StatusBadge({ status, reason }: { status: DossierData["dossierStatus"]; reason?: string | null }) {
  if (status === "validated") {
    return (
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-green-600" />
        <Badge className="bg-green-100 text-green-800 border-none font-medium">Dossier validé</Badge>
      </div>
    );
  }
  if (status === "rejected") {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-red-500" />
          <Badge className="bg-red-100 text-red-700 border-none font-medium">Dossier à corriger</Badge>
        </div>
        {reason && (
          <p className="text-sm text-red-600 pl-7">{reason}</p>
        )}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <Clock className="h-5 w-5 text-amber-500" />
      <Badge className="bg-amber-100 text-amber-800 border-none font-medium">En cours de validation</Badge>
    </div>
  );
}

export default function ProDossier() {
  const { toast } = useToast();
  const [uploading, setUploading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const { data: dossier, isLoading } = useQuery<DossierData>({
    queryKey: ["/api/professionnel/dossier"],
  });

  async function handleUpload(docType: string, file: File) {
    setUploading(docType);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/professionnel/dossier/upload/${docType}`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erreur upload" }));
        throw new Error(err.error || "Erreur upload");
      }
      queryClient.invalidateQueries({ queryKey: ["/api/professionnel/dossier"] });
      toast({ title: "Document uploadé", description: "Votre document a été enregistré." });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setUploading(null);
    }
  }

  async function handleDelete(docType: string) {
    if (!confirm("Supprimer ce document définitivement ?")) return;
    setDeleting(docType);
    try {
      const res = await fetch(`/api/professionnel/dossier/document/${docType}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erreur suppression" }));
        throw new Error(err.error || "Erreur suppression");
      }
      queryClient.invalidateQueries({ queryKey: ["/api/professionnel/dossier"] });
      toast({ title: "Document supprimé", description: "Le document a été retiré de votre dossier." });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  }

  const maskIban = (value: string | null) => {
    if (!value) return null;
    if (isUploadUrl(value)) return value;
    return "•••• •••• •••• " + value.slice(-4);
  };

  return (
    <div className="min-h-screen pb-20 lg:pb-8 bg-white">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 lg:px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white border border-[#601B28] flex items-center justify-center">
              <FileText className="h-5 w-5 text-[#601B28]" />
            </div>
            <h1 className="font-serif text-3xl text-[#601B28]">Mon dossier pro</h1>
          </div>
          <p className="text-gray-600 mt-2">
            Déposez vos documents justificatifs. SEAMLIER les vérifie avant de valider votre profil.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 lg:px-6 py-6 space-y-5">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#601B28] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Statut */}
            <Card className="border border-gray-100 shadow-sm">
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-3 font-medium">Statut du dossier</p>
                <StatusBadge
                  status={dossier?.dossierStatus ?? "pending"}
                  reason={dossier?.dossierRejectionReason}
                />
              </CardContent>
            </Card>

            {/* Infos légales (lecture seule) */}
            <Card className="border border-gray-100 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-semibold text-gray-700">Informations légales</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">SIRET</span>
                  <div className="text-right">
                    {dossier?.siret ? (
                      <span className="font-mono text-sm text-gray-800">{dossier.siret}</span>
                    ) : (
                      <span className="text-sm text-gray-400 italic">Renseigné par SEAMLIER</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-500">IBAN enregistré</span>
                  <div className="text-right">
                    {dossier?.ibanRib ? (
                      <span className="font-mono text-sm text-gray-800">
                        {isUploadUrl(dossier.ibanRib) ? "✓ Document déposé" : maskIban(dossier.ibanRib)}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400 italic">Non renseigné</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documents */}
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-widest text-gray-400 font-medium px-1">Documents justificatifs</p>
              {DOC_TYPES.map((doc) => {
                const url = dossier?.[doc.urlKey] as string | null;
                const isUploading = uploading === doc.docType;
                const isDeleting = deleting === doc.docType;
                const Icon = doc.icon;
                const fileInfo = getFileInfo(url);

                // Kbis expiry
                const showExpiry = doc.docType === "kbis" && dossier?.kbisExpiryDate;
                const expiryDate = showExpiry
                  ? new Date(dossier!.kbisExpiryDate!).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
                  : null;
                const isExpired = showExpiry && new Date(dossier!.kbisExpiryDate!) < new Date();
                const soonExpiry = showExpiry && !isExpired && (new Date(dossier!.kbisExpiryDate!).getTime() - Date.now()) < 30 * 86400 * 1000;

                return (
                  <Card key={doc.docType} className="border border-gray-100 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                          url ? "bg-green-50" : "bg-gray-50"
                        )}>
                          <Icon className={cn("h-4.5 w-4.5", url ? "text-green-600" : "text-gray-400")} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm text-gray-800">{doc.label}</p>
                            {!url && (
                              <span className="text-xs text-gray-400">Non déposé</span>
                            )}
                          </div>

                          <p className="text-xs text-gray-400 mt-0.5">{doc.hint}</p>

                          {/* Infos fichier uploadé */}
                          {url && fileInfo && (
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Déposé
                                </span>
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-green-700 font-medium truncate max-w-[200px] hover:underline"
                                >
                                  {fileInfo.filename}
                                </a>
                              </div>
                              {fileInfo.uploadedAt && (
                                <p className="text-xs text-gray-400 pl-5">
                                  Déposé le{" "}
                                  {fileInfo.uploadedAt.toLocaleDateString("fr-FR", {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                  })}
                                </p>
                              )}
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-[#601B28] hover:underline pl-5"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Voir le document
                              </a>
                            </div>
                          )}

                          {expiryDate && (
                            <p className={cn(
                              "text-xs mt-1",
                              isExpired ? "text-red-600 font-medium" : soonExpiry ? "text-amber-600" : "text-gray-500"
                            )}>
                              {isExpired ? "⚠ Expiré le " : soonExpiry ? "⚠ Expire le " : "Expire le "}{expiryDate}
                            </p>
                          )}
                        </div>

                        <div className="shrink-0 flex flex-col items-end gap-1.5">
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            ref={(el) => { fileInputRefs.current[doc.docType] = el; }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUpload(doc.docType, file);
                              e.target.value = "";
                            }}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isUploading || isDeleting}
                            className="h-8 text-xs border-[#601B28]/30 text-[#601B28]"
                            onClick={() => fileInputRefs.current[doc.docType]?.click()}
                          >
                            {isUploading ? (
                              <div className="w-3 h-3 border-2 border-[#601B28] border-t-transparent rounded-full animate-spin mr-1" />
                            ) : (
                              <Upload className="h-3.5 w-3.5 mr-1" />
                            )}
                            {url ? "Remplacer" : "Déposer"}
                          </Button>
                          {url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isDeleting || isUploading}
                              className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(doc.docType)}
                            >
                              {isDeleting ? (
                                <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-1" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5 mr-1" />
                              )}
                              Supprimer
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <p className="text-xs text-gray-400 text-center pb-2">
              Le SIRET est renseigné par SEAMLIER après vérification de votre dossier. Formats acceptés : PDF, JPG, PNG (max 10 Mo).
            </p>
          </>
        )}
      </div>
    </div>
  );
}
