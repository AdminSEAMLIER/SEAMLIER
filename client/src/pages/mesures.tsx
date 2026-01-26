import { useTranslation } from "react-i18next";
import { Ruler, Camera, Save, HelpCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

function BodyDiagram({ activeMeasurement }: { activeMeasurement: string | null }) {
  return (
    <div className="relative w-full max-w-[120px] mx-auto">
      <svg viewBox="0 0 100 220" className="w-full h-auto">
        <circle cx="50" cy="18" r="14" fill="#f5f5f4" stroke="#722F37" strokeWidth="1" />
        
        <rect x="42" y="32" width="16" height="10" rx="3" fill="#f5f5f4" stroke="#722F37" strokeWidth="1" />
        
        <path d="M30 42 L42 42 L42 90 L30 90 L26 75 L26 57 Z" fill="#f5f5f4" stroke="#722F37" strokeWidth="1" />
        <path d="M70 42 L58 42 L58 90 L70 90 L74 75 L74 57 Z" fill="#f5f5f4" stroke="#722F37" strokeWidth="1" />
        
        <rect x="38" y="42" width="24" height="50" rx="2" fill="#f5f5f4" stroke="#722F37" strokeWidth="1" />
        
        <path d="M38 92 L38 130 L34 130 L34 105 L38 92" fill="#f5f5f4" stroke="#722F37" strokeWidth="1" />
        <path d="M62 92 L62 130 L66 130 L66 105 L62 92" fill="#f5f5f4" stroke="#722F37" strokeWidth="1" />
        
        <rect x="36" y="130" width="12" height="70" rx="2" fill="#f5f5f4" stroke="#722F37" strokeWidth="1" />
        <rect x="52" y="130" width="12" height="70" rx="2" fill="#f5f5f4" stroke="#722F37" strokeWidth="1" />
        
        <rect x="34" y="200" width="14" height="8" rx="2" fill="#f5f5f4" stroke="#722F37" strokeWidth="1" />
        <rect x="52" y="200" width="14" height="8" rx="2" fill="#f5f5f4" stroke="#722F37" strokeWidth="1" />

        {activeMeasurement === "tour_cou" && (
          <ellipse cx="50" cy="37" rx="12" ry="6" fill="none" stroke="#722F37" strokeWidth="2.5" />
        )}
        {activeMeasurement === "largeur_epaules" && (
          <line x1="26" y1="48" x2="74" y2="48" stroke="#722F37" strokeWidth="2.5" markerEnd="url(#arrow)" markerStart="url(#arrow)" />
        )}
        {activeMeasurement === "tour_poitrine" && (
          <ellipse cx="50" cy="55" rx="22" ry="10" fill="none" stroke="#722F37" strokeWidth="2.5" />
        )}
        {activeMeasurement === "tour_taille" && (
          <ellipse cx="50" cy="80" rx="18" ry="8" fill="none" stroke="#722F37" strokeWidth="2.5" />
        )}
        {activeMeasurement === "tour_hanches" && (
          <ellipse cx="50" cy="100" rx="20" ry="9" fill="none" stroke="#722F37" strokeWidth="2.5" />
        )}
        {activeMeasurement === "longueur_dos" && (
          <line x1="50" y1="32" x2="50" y2="80" stroke="#722F37" strokeWidth="2.5" />
        )}
        {activeMeasurement === "longueur_bras" && (
          <line x1="74" y1="48" x2="66" y2="130" stroke="#722F37" strokeWidth="2.5" />
        )}
        {activeMeasurement === "longueur_jambe" && (
          <line x1="58" y1="130" x2="58" y2="200" stroke="#722F37" strokeWidth="2.5" />
        )}
      </svg>
    </div>
  );
}

const DEMO_USER_ID = "u6";

export default function Mesures() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [activeMeasurement, setActiveMeasurement] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({
    tour_cou: "",
    largeur_epaules: "",
    tour_poitrine: "",
    tour_taille: "",
    tour_hanches: "",
    longueur_dos: "",
    longueur_bras: "",
    longueur_jambe: "",
  });

  const { data: savedMeasurements, isLoading } = useQuery({
    queryKey: ['/api/measurements', DEMO_USER_ID],
    queryFn: async () => {
      const res = await fetch(`/api/measurements/${DEMO_USER_ID}`);
      return res.json();
    }
  });

  useEffect(() => {
    if (savedMeasurements) {
      setValues({
        tour_cou: savedMeasurements.neck?.toString() || "",
        largeur_epaules: savedMeasurements.shoulders?.toString() || "",
        tour_poitrine: savedMeasurements.bust?.toString() || "",
        tour_taille: savedMeasurements.waist?.toString() || "",
        tour_hanches: savedMeasurements.hips?.toString() || "",
        longueur_dos: savedMeasurements.backLength?.toString() || "",
        longueur_bras: savedMeasurements.armLength?.toString() || "",
        longueur_jambe: savedMeasurements.inseam?.toString() || "",
      });
    }
  }, [savedMeasurements]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/measurements', {
        userId: DEMO_USER_ID,
        neck: parseFloat(values.tour_cou) || null,
        bust: parseFloat(values.tour_poitrine) || null,
        waist: parseFloat(values.tour_taille) || null,
        hips: parseFloat(values.tour_hanches) || null,
        shoulders: parseFloat(values.largeur_epaules) || null,
        armLength: parseFloat(values.longueur_bras) || null,
        backLength: parseFloat(values.longueur_dos) || null,
        inseam: parseFloat(values.longueur_jambe) || null,
        height: null,
        weight: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/measurements', DEMO_USER_ID] });
      toast({
        title: "Mesures enregistrées",
        description: "Vos mesures ont été sauvegardées avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder vos mesures",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate();
  };

  const handleChange = (id: string, value: string) => {
    setValues(prev => ({ ...prev, [id]: value }));
  };

  const measurements = [
    { id: "tour_cou", label: t('measures.neck'), unit: t('common.cm'), placeholder: "38" },
    { id: "largeur_epaules", label: t('measures.shoulders'), unit: t('common.cm'), placeholder: "40" },
    { id: "tour_poitrine", label: t('measures.chest'), unit: t('common.cm'), placeholder: "88" },
    { id: "tour_taille", label: t('measures.waist'), unit: t('common.cm'), placeholder: "72" },
    { id: "tour_hanches", label: t('measures.hips'), unit: t('common.cm'), placeholder: "96" },
    { id: "longueur_dos", label: t('measures.backLength'), unit: t('common.cm'), placeholder: "42" },
    { id: "longueur_bras", label: t('measures.armLength'), unit: t('common.cm'), placeholder: "60" },
    { id: "longueur_jambe", label: t('measures.legLength'), unit: t('common.cm'), placeholder: "105" },
  ];

  return (
    <div className="min-h-screen pb-20 lg:pb-8 bg-white">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white border border-[#722F37] flex items-center justify-center">
              <Ruler className="h-5 w-5 text-[#722F37]" />
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl text-[#722F37]">
              {t('measures.title')}
            </h1>
          </div>
          <p className="text-gray-600 mt-2">
            {t('measures.subtitle')}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6">
        <Card className="border border-gray-100 bg-white shadow-sm mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-[#722F37] flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              {t('measures.howTo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-[#722F37] font-medium">1.</span>
                {t('measures.tip1')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#722F37] font-medium">2.</span>
                {t('measures.tip2')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#722F37] font-medium">3.</span>
                {t('measures.tip3')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#722F37] font-medium">4.</span>
                {t('measures.tip4')}
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border border-gray-100 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-[#722F37]">{t('measures.visualGuide')}</CardTitle>
            </CardHeader>
            <CardContent className="bg-white flex justify-center py-6">
              <BodyDiagram activeMeasurement={activeMeasurement} />
            </CardContent>
            <div className="px-6 pb-6">
              <p className="text-sm text-gray-500 text-center">
                {t('measures.clickToSee')}
              </p>
            </div>
          </Card>

          <Card className="border border-gray-100 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-[#722F37]">{t('measures.myMeasures')}</CardTitle>
            </CardHeader>
            <CardContent className="bg-white">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-[#722F37]" />
                </div>
              ) : (
                <div className="grid gap-4">
                  {measurements.map((m) => (
                    <div 
                      key={m.id} 
                      className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
                        activeMeasurement === m.id ? 'bg-[#722F37]/5' : ''
                      }`}
                    >
                      <Label 
                        htmlFor={m.id} 
                        className="w-36 text-sm text-gray-700 cursor-pointer"
                        onClick={() => setActiveMeasurement(m.id)}
                      >
                        {m.label}
                      </Label>
                      <div className="flex-1 flex items-center gap-2">
                        <Input
                          id={m.id}
                          type="number"
                          placeholder={m.placeholder}
                          value={values[m.id]}
                          onChange={(e) => handleChange(m.id, e.target.value)}
                          className="border-gray-200 focus:border-[#722F37] focus:ring-[#722F37]"
                          data-testid={`input-${m.id}`}
                          onFocus={() => setActiveMeasurement(m.id)}
                          onBlur={() => setActiveMeasurement(null)}
                        />
                        <span className="text-gray-500 text-sm w-8">{m.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3 mt-6">
          <Button 
            variant="outline" 
            className="flex-1 h-12 bg-[#722F37] border-[#722F37] text-white hover:bg-[#5a252c]" 
            data-testid="button-save-measures"
            onClick={handleSave}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Save className="h-5 w-5 mr-2" />
            )}
            {t('measures.save')}
          </Button>
          <Button variant="outline" className="h-12 border-gray-200" data-testid="button-scan">
            <Camera className="h-5 w-5" />
          </Button>
        </div>

        <p className="text-center text-gray-500 text-sm mt-4">
          {t('measures.autoShare')}
        </p>
      </div>
    </div>
  );
}
