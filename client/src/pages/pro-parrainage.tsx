import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Users, CheckCircle2, Clock } from "lucide-react";

interface ReferralStats {
  referralCode: string | null;
  referralLink: string | null;
  totalInvites: number;
  registered: number;
  invites: { email: string; status: string; sentAt: string }[];
}

export default function ProParrainage() {
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats, isLoading } = useQuery<ReferralStats>({
    queryKey: ["/api/professionnel/referral/stats"],
  });

  const inviteMutation = useMutation({
    mutationFn: (invitedEmail: string) =>
      apiRequest("POST", "/api/professionnel/referral/invite", { email: invitedEmail }),
    onSuccess: () => {
      toast({ title: "Invitation envoyée !", description: `Un email a été envoyé à ${email}.` });
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["/api/professionnel/referral/stats"] });
    },
    onError: (err: any) => {
      const msg = err?.message || "Erreur lors de l'envoi";
      toast({ title: "Échec", description: msg, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast({ title: "Email invalide", variant: "destructive" });
      return;
    }
    inviteMutation.mutate(trimmed);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Parrainage</h1>
        <p className="text-sm text-gray-500 mt-1">
          Invitez des collègues artisans à rejoindre SEAMLiER. Un email personnalisé leur sera envoyé avec votre lien de parrainage.
        </p>
      </div>

      {/* Stats */}
      {!isLoading && stats && (
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Mail className="text-indigo-500" size={20} />
              <div>
                <p className="text-2xl font-bold">{stats.totalInvites}</p>
                <p className="text-xs text-gray-500">Invitations envoyées</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="text-green-500" size={20} />
              <div>
                <p className="text-2xl font-bold">{stats.registered}</p>
                <p className="text-xs text-gray-500">Inscrits via votre lien</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invite form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Inviter un artisan</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="email"
              placeholder="email@exemple.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={inviteMutation.isPending || !email.trim()}>
              {inviteMutation.isPending ? "Envoi…" : "Envoyer"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Referral link */}
      {stats?.referralLink && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Votre lien de parrainage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-gray-50 border rounded px-3 py-2 text-gray-700 overflow-x-auto">
                {stats.referralLink}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(stats.referralLink!);
                  toast({ title: "Lien copié !" });
                }}
              >
                Copier
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sent invites list */}
      {stats && stats.invites.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Invitations envoyées</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {stats.invites.map((inv) => (
                <div key={inv.email} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{inv.email}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(inv.sentAt).toLocaleDateString("fr-FR", {
                        day: "numeric", month: "long", year: "numeric",
                      })}
                    </p>
                  </div>
                  <Badge
                    variant={inv.status === "registered" ? "default" : "secondary"}
                    className="text-xs flex items-center gap-1"
                  >
                    {inv.status === "registered" ? (
                      <><CheckCircle2 size={11} /> Inscrit</>
                    ) : (
                      <><Clock size={11} /> En attente</>
                    )}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
