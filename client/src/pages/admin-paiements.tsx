import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, ArrowLeftRight, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PendingTransfer {
  id: string;
  title: string;
  clientName: string;
  tailorName: string;
  amountArtisan: number;       // centimes
  amountTotal: number;         // centimes
  paymentStatus: string;
  clientConfirmed: boolean;
  stripeTransferId: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPaiements() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [selected, setSelected] = useState<PendingTransfer | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: projects = [], isLoading, isError, refetch } = useQuery<PendingTransfer[]>({
    queryKey: ["/api/admin/projects/pending-transfer"],
    queryFn: async () => {
      const r = await fetch("/api/admin/projects/pending-transfer", { credentials: "include" });
      if (!r.ok) throw new Error("Erreur chargement");
      return r.json();
    },
    staleTime: 30_000,
  });

  const releaseMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const r = await fetch(`/api/stripe/admin-release/${projectId}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error ?? `HTTP ${r.status}`);
      return data;
    },
    onSuccess: (data, projectId) => {
      toast({
        title: "Virement effectué",
        description: `Transfer ID : ${data.transferId ?? "—"}`,
      });
      setConfirmOpen(false);
      setSelected(null);
      qc.invalidateQueries({ queryKey: ["/api/admin/projects/pending-transfer"] });
    },
    onError: (err: any) => {
      toast({
        title: "Erreur lors du virement",
        description: err.message ?? "Erreur inconnue",
        variant: "destructive",
      });
    },
  });

  const openConfirm = (p: PendingTransfer) => {
    setSelected(p);
    setConfirmOpen(true);
  };

  const euros = (centimes: number) => (centimes / 100).toFixed(2) + " €";

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Virements artisans</h1>
          <p className="text-sm text-gray-500 mt-1">
            Projets payés et confirmés par le client — en attente de transfert.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#601B28]" />
        </div>
      ) : isError ? (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">Impossible de charger les projets. Vérifiez votre connexion.</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <CheckCircle className="h-12 w-12 text-green-400 mx-auto" />
          <p className="text-gray-500 font-medium">Aucun virement en attente.</p>
          <p className="text-sm text-gray-400">Tous les artisans ont été payés.</p>
        </div>
      ) : (
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              {projects.length} projet{projects.length > 1 ? "s" : ""} en attente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50">
              {projects.map((p) => (
                <div key={p.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors">
                  {/* Infos projet */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{p.title || "Sans titre"}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-sm text-gray-500">
                        Client : <span className="text-gray-700">{p.clientName}</span>
                      </span>
                      <span className="text-gray-300">·</span>
                      <span className="text-sm text-gray-500">
                        Artisan : <span className="text-gray-700">{p.tailorName}</span>
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Confirmé le {format(new Date(p.updatedAt), "d MMM yyyy", { locale: fr })}
                    </p>
                  </div>

                  {/* Montants */}
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-gray-900">{euros(p.amountArtisan)}</p>
                    <p className="text-xs text-gray-400">à virer · total payé : {euros(p.amountTotal)}</p>
                  </div>

                  {/* Badges + bouton */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className="bg-green-100 text-green-700 border-none text-xs">
                      Payé
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-700 border-none text-xs">
                      Confirmé
                    </Badge>
                    <Button
                      size="sm"
                      className="bg-[#601B28] hover:bg-[#4E1522] text-white gap-1.5 ml-2"
                      onClick={() => openConfirm(p)}
                    >
                      <ArrowLeftRight className="h-3.5 w-3.5" />
                      Virer l'artisan
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de confirmation */}
      <Dialog open={confirmOpen} onOpenChange={(v) => { if (!v && !releaseMutation.isPending) { setConfirmOpen(false); setSelected(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#601B28]">Confirmer le virement</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 py-2">
              <div className="bg-[#601B28]/5 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Projet</span>
                  <span className="font-medium text-gray-900">{selected.title || "Sans titre"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Artisan</span>
                  <span className="font-medium text-gray-900">{selected.tailorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Client</span>
                  <span className="font-medium text-gray-900">{selected.clientName}</span>
                </div>
                <div className="flex justify-between border-t border-[#601B28]/10 pt-2 mt-2">
                  <span className="text-gray-700 font-semibold">Montant à virer</span>
                  <span className="text-xl font-bold text-[#601B28]">{euros(selected.amountArtisan)}</span>
                </div>
                <p className="text-xs text-gray-400 text-center pt-1">
                  Total encaissé : {euros(selected.amountTotal)} · Commission SEAMLiER : {euros(selected.amountTotal - selected.amountArtisan)}
                </p>
              </div>

              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
                Cette action est irréversible. Le virement Stripe sera déclenché immédiatement vers le compte Connect de l'artisan.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setConfirmOpen(false); setSelected(null); }}
              disabled={releaseMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              className="bg-[#601B28] hover:bg-[#4E1522] text-white gap-2"
              onClick={() => selected && releaseMutation.mutate(selected.id)}
              disabled={releaseMutation.isPending}
            >
              {releaseMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Virement en cours…</>
              ) : (
                <><ArrowLeftRight className="h-4 w-4" />Confirmer le virement</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
