import { Ruler, Camera, Save, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

const measurements = [
  { id: "tour_cou", label: "Tour de cou", unit: "cm", placeholder: "38", position: { top: "12%", left: "50%" } },
  { id: "largeur_epaules", label: "Largeur d'épaules", unit: "cm", placeholder: "40", position: { top: "18%", left: "50%" } },
  { id: "tour_poitrine", label: "Tour de poitrine", unit: "cm", placeholder: "88", position: { top: "28%", left: "50%" } },
  { id: "tour_taille", label: "Tour de taille", unit: "cm", placeholder: "72", position: { top: "38%", left: "50%" } },
  { id: "tour_hanches", label: "Tour de hanches", unit: "cm", placeholder: "96", position: { top: "48%", left: "50%" } },
  { id: "longueur_dos", label: "Longueur du dos", unit: "cm", placeholder: "42", position: { top: "33%", left: "30%" } },
  { id: "longueur_bras", label: "Longueur des bras", unit: "cm", placeholder: "60", position: { top: "35%", left: "75%" } },
  { id: "longueur_jambe", label: "Longueur de jambe", unit: "cm", placeholder: "105", position: { top: "75%", left: "50%" } },
];

function BodyDiagram({ activeMeasurement }: { activeMeasurement: string | null }) {
  return (
    <div className="relative w-full max-w-[200px] mx-auto">
      <svg viewBox="0 0 100 200" className="w-full h-auto">
        <defs>
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f3f4f6" />
            <stop offset="100%" stopColor="#e5e7eb" />
          </linearGradient>
        </defs>
        
        <ellipse cx="50" cy="15" rx="12" ry="14" fill="#e5e7eb" stroke="#722F37" strokeWidth="0.5" />
        
        <path d="M38 29 L30 75 L35 75 L40 55 L50 60 L60 55 L65 75 L70 75 L62 29 Z" 
              fill="#e5e7eb" stroke="#722F37" strokeWidth="0.5" />
        
        <path d="M30 75 L28 145 L38 145 L42 90 L50 95 L58 90 L62 145 L72 145 L70 75 Z" 
              fill="#e5e7eb" stroke="#722F37" strokeWidth="0.5" />
        
        <path d="M28 145 L26 195 L36 195 L38 145 Z" 
              fill="#e5e7eb" stroke="#722F37" strokeWidth="0.5" />
        <path d="M62 145 L64 195 L74 195 L72 145 Z" 
              fill="#e5e7eb" stroke="#722F37" strokeWidth="0.5" />
        
        <path d="M30 32 L15 70 L20 72 L33 40 Z" 
              fill="#e5e7eb" stroke="#722F37" strokeWidth="0.5" />
        <path d="M70 32 L85 70 L80 72 L67 40 Z" 
              fill="#e5e7eb" stroke="#722F37" strokeWidth="0.5" />

        {activeMeasurement === "tour_cou" && (
          <ellipse cx="50" cy="28" rx="8" ry="3" fill="none" stroke="#722F37" strokeWidth="2" strokeDasharray="3,2" />
        )}
        {activeMeasurement === "largeur_epaules" && (
          <line x1="30" y1="32" x2="70" y2="32" stroke="#722F37" strokeWidth="2" strokeDasharray="3,2" />
        )}
        {activeMeasurement === "tour_poitrine" && (
          <ellipse cx="50" cy="45" rx="18" ry="8" fill="none" stroke="#722F37" strokeWidth="2" strokeDasharray="3,2" />
        )}
        {activeMeasurement === "tour_taille" && (
          <ellipse cx="50" cy="62" rx="15" ry="6" fill="none" stroke="#722F37" strokeWidth="2" strokeDasharray="3,2" />
        )}
        {activeMeasurement === "tour_hanches" && (
          <ellipse cx="50" cy="80" rx="18" ry="7" fill="none" stroke="#722F37" strokeWidth="2" strokeDasharray="3,2" />
        )}
        {activeMeasurement === "longueur_dos" && (
          <line x1="50" y1="28" x2="50" y2="62" stroke="#722F37" strokeWidth="2" strokeDasharray="3,2" />
        )}
        {activeMeasurement === "longueur_bras" && (
          <line x1="70" y1="32" x2="85" y2="70" stroke="#722F37" strokeWidth="2" strokeDasharray="3,2" />
        )}
        {activeMeasurement === "longueur_jambe" && (
          <line x1="65" y1="80" x2="68" y2="195" stroke="#722F37" strokeWidth="2" strokeDasharray="3,2" />
        )}
      </svg>
    </div>
  );
}

export default function Mesures() {
  const [activeMeasurement, setActiveMeasurement] = useState<string | null>(null);

  return (
    <div className="min-h-screen pb-20 lg:pb-8 bg-white">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white border border-[#722F37] flex items-center justify-center">
              <Ruler className="h-5 w-5 text-[#722F37]" />
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl text-[#722F37]">
              Prise de mesures
            </h1>
          </div>
          <p className="text-gray-600 mt-2">
            Enregistrez vos mesures pour faciliter vos commandes auprès des couturiers
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6">
        <Card className="border border-gray-100 bg-white shadow-sm mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-[#722F37] flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Comment prendre vos mesures ?
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-[#722F37] font-medium">1.</span>
                Utilisez un mètre ruban souple
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#722F37] font-medium">2.</span>
                Mesurez directement sur le corps, avec des vêtements légers
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#722F37] font-medium">3.</span>
                Ne serrez pas trop le mètre ruban
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#722F37] font-medium">4.</span>
                Faites-vous aider si possible pour plus de précision
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border border-gray-100 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-[#722F37]">Guide visuel</CardTitle>
            </CardHeader>
            <CardContent className="bg-white flex justify-center py-6">
              <BodyDiagram activeMeasurement={activeMeasurement} />
            </CardContent>
            <div className="px-6 pb-6">
              <p className="text-sm text-gray-500 text-center">
                Cliquez sur un champ de mesure pour voir où prendre la mesure sur le corps
              </p>
            </div>
          </Card>

          <Card className="border border-gray-100 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-[#722F37]">Mes mesures</CardTitle>
            </CardHeader>
            <CardContent className="bg-white">
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
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3 mt-6">
          <Button className="flex-1 h-12 bg-[#722F37] hover:bg-[#5a252c]" data-testid="button-save-measures">
            <Save className="h-5 w-5 mr-2" />
            Enregistrer mes mesures
          </Button>
          <Button variant="outline" className="h-12 border-gray-200" data-testid="button-scan">
            <Camera className="h-5 w-5" />
          </Button>
        </div>

        <p className="text-center text-gray-500 text-sm mt-4">
          Vos mesures seront automatiquement partagées avec les couturiers lors de vos commandes
        </p>
      </div>
    </div>
  );
}
