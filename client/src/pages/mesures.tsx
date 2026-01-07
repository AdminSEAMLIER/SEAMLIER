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
    <div className="relative w-full max-w-[180px] mx-auto">
      <svg viewBox="0 0 120 280" className="w-full h-auto">
        <defs>
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#faf9f7" />
            <stop offset="100%" stopColor="#f0eeeb" />
          </linearGradient>
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.1"/>
          </filter>
        </defs>
        
        <ellipse cx="60" cy="22" rx="14" ry="17" fill="url(#bodyGradient)" stroke="#722F37" strokeWidth="0.8" filter="url(#softShadow)" />
        
        <ellipse cx="60" cy="40" rx="6" ry="4" fill="url(#bodyGradient)" stroke="#722F37" strokeWidth="0.6" />
        
        <path d="M60 44 
                 C60 44, 42 46, 38 50
                 C34 54, 32 58, 30 65
                 L28 90
                 C28 92, 30 94, 32 94
                 L36 94
                 C38 94, 40 92, 40 90
                 L42 75
                 C42 73, 44 72, 46 73
                 L46 110
                 C46 112, 47 114, 49 114
                 L71 114
                 C73 114, 74 112, 74 110
                 L74 73
                 C76 72, 78 73, 78 75
                 L80 90
                 C80 92, 82 94, 84 94
                 L88 94
                 C90 94, 92 92, 92 90
                 L90 65
                 C88 58, 86 54, 82 50
                 C78 46, 60 44, 60 44
                 Z" 
              fill="url(#bodyGradient)" stroke="#722F37" strokeWidth="0.8" filter="url(#softShadow)" />
        
        <path d="M49 114
                 C49 114, 48 118, 48 122
                 L46 155
                 C46 158, 45 160, 44 162
                 L42 190
                 C42 195, 43 198, 45 200
                 L48 255
                 C48 258, 50 260, 53 260
                 L55 260
                 C58 260, 60 258, 60 255
                 L60 200
                 C60 198, 60 196, 60 194
                 L60 200
                 C60 198, 60 196, 60 194
                 L60 255
                 C60 258, 62 260, 65 260
                 L67 260
                 C70 260, 72 258, 72 255
                 L75 200
                 C77 198, 78 195, 78 190
                 L76 162
                 C75 160, 74 158, 74 155
                 L72 122
                 C72 118, 71 114, 71 114
                 Z" 
              fill="url(#bodyGradient)" stroke="#722F37" strokeWidth="0.8" filter="url(#softShadow)" />

        {activeMeasurement === "tour_cou" && (
          <>
            <ellipse cx="60" cy="40" rx="10" ry="5" fill="none" stroke="#722F37" strokeWidth="2" opacity="0.8" />
            <circle cx="75" cy="40" r="3" fill="#722F37" />
            <text x="82" y="43" fontSize="8" fill="#722F37" fontWeight="500">Cou</text>
          </>
        )}
        {activeMeasurement === "largeur_epaules" && (
          <>
            <line x1="30" y1="52" x2="90" y2="52" stroke="#722F37" strokeWidth="2" />
            <circle cx="30" cy="52" r="2" fill="#722F37" />
            <circle cx="90" cy="52" r="2" fill="#722F37" />
            <text x="95" y="55" fontSize="8" fill="#722F37" fontWeight="500">Épaules</text>
          </>
        )}
        {activeMeasurement === "tour_poitrine" && (
          <>
            <ellipse cx="60" cy="70" rx="28" ry="10" fill="none" stroke="#722F37" strokeWidth="2" opacity="0.8" />
            <circle cx="92" cy="70" r="3" fill="#722F37" />
            <text x="97" y="73" fontSize="8" fill="#722F37" fontWeight="500">Poitrine</text>
          </>
        )}
        {activeMeasurement === "tour_taille" && (
          <>
            <ellipse cx="60" cy="100" rx="22" ry="8" fill="none" stroke="#722F37" strokeWidth="2" opacity="0.8" />
            <circle cx="85" cy="100" r="3" fill="#722F37" />
            <text x="90" y="103" fontSize="8" fill="#722F37" fontWeight="500">Taille</text>
          </>
        )}
        {activeMeasurement === "tour_hanches" && (
          <>
            <ellipse cx="60" cy="125" rx="26" ry="10" fill="none" stroke="#722F37" strokeWidth="2" opacity="0.8" />
            <circle cx="90" cy="125" r="3" fill="#722F37" />
            <text x="95" y="128" fontSize="8" fill="#722F37" fontWeight="500">Hanches</text>
          </>
        )}
        {activeMeasurement === "longueur_dos" && (
          <>
            <line x1="60" y1="44" x2="60" y2="100" stroke="#722F37" strokeWidth="2" />
            <circle cx="60" cy="44" r="2" fill="#722F37" />
            <circle cx="60" cy="100" r="2" fill="#722F37" />
            <text x="15" y="75" fontSize="8" fill="#722F37" fontWeight="500">Dos</text>
          </>
        )}
        {activeMeasurement === "longueur_bras" && (
          <>
            <line x1="82" y1="50" x2="90" y2="94" stroke="#722F37" strokeWidth="2" />
            <circle cx="82" cy="50" r="2" fill="#722F37" />
            <circle cx="90" cy="94" r="2" fill="#722F37" />
            <text x="95" y="75" fontSize="8" fill="#722F37" fontWeight="500">Bras</text>
          </>
        )}
        {activeMeasurement === "longueur_jambe" && (
          <>
            <line x1="68" y1="125" x2="70" y2="255" stroke="#722F37" strokeWidth="2" />
            <circle cx="68" cy="125" r="2" fill="#722F37" />
            <circle cx="70" cy="255" r="2" fill="#722F37" />
            <text x="75" y="190" fontSize="8" fill="#722F37" fontWeight="500">Jambe</text>
          </>
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
