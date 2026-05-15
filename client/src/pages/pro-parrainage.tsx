import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Users, Gift, Mail, Copy, Check } from "lucide-react";

type Referral = {
  id: string;
  referred_email: string;
  status: "pending" | "joined" | "rewarded";
  created_at: string;
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: "Invité", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  joined: { label: "Inscrit", className: "bg-green-100 text-green-800 border-green-200" },
  rewarded: { label: "Récompensé", className: "bg-[#f8f5f5] text-[#601B28] border-[#601B28]/20" },
};

export default function ProParrainage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery<{ referrals: Referral[]; referralCode: string | null }>({
    queryKey: ["/api/referrals/mine"],
  });

  const referrals = data?.referrals || [];
  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://www.seamlier.fr";
  const referralLink = data?.referralCode
    ? `${appUrl}/inscription/professionnel?ref=${data.referralCode}`
    : null;

  const inviteMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/referrals", { email }),
    onSuccess: () => {
      toast({ title: "Invitation envoyée !", description: `Un email a été envoyé à ${email}.` });
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["/api/referrals/mine"] });
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err?.message || "Impossible d'envoyer l'invitation.", variant: "destructive" });
    },
  });

  const handleCopy = async () => {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#601B28]/10 flex items-center justify-center">
          <Users className="h-5 w-5 text-[#601B28]" />
        </div>
        <div>
          <h1 className="font-serif text-2xl text-[#601B28]">Parrainer une couturière</h1>
          <p className="text-sm text-gray-500">Invitez vos collègues à rejoindre SEAMLIER</p>
        </div>
      </div>

      <Card className="border border-[#601B28]/20 bg-[#fdf9f6]">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <Gift className="h-5 w-5 text-[#601B28] shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-[#601B28] text-sm">Comment ça marche ?</p>
              <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                Invitez vos collègues artisanes à s'inscrire sur SEAMLIER. Dès qu'elles créent leur profil,
                votre parrainage est validé. Vous contribuez à développer notre communauté !
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-[#601B28] flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Inviter par email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Adresse email</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="collègue@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && email) inviteMutation.mutate(); }}
            />
          </div>
          <Button
            className="w-full bg-[#601B28] hover:bg-[#4E1522] text-white"
            onClick={() => inviteMutation.mutate()}
            disabled={inviteMutation.isPending || !email}
          >
            {inviteMutation.isPending ? "Envoi…" : "Envoyer l'invitation"}
          </Button>
        </CardContent>
      </Card>

      {referralLink && (
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-[#601B28] flex items-center gap-2">
              <Copy className="h-5 w-5" />
              Mon lien de parrainage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input value={referralLink} readOnly className="text-xs text-gray-600" />
              <Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0">
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            {copied && <p className="text-xs text-green-600 mt-1">Lien copié !</p>}
          </CardContent>
        </Card>
      )}

      <Card className="border border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-[#601B28]">
            Mes invitations ({referrals.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : referrals.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
              Vous n'avez encore invité personne.
            </div>
          ) : (
            <div className="space-y-2">
              {referrals.map((r) => {
                const s = STATUS_LABELS[r.status] || STATUS_LABELS.pending;
                return (
                  <div key={r.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-gray-50 border border-gray-100">
                    <span className="text-sm text-gray-700 truncate">{r.referred_email}</span>
                    <Badge className={`text-xs border shrink-0 ml-2 ${s.className}`}>{s.label}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
