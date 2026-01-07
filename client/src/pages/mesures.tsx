import { Ruler, Camera, Save, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const measurements = [
  { id: "tour_poitrine", label: "Tour de poitrine", unit: "cm", placeholder: "88" },
  { id: "tour_taille", label: "Tour de taille", unit: "cm", placeholder: "72" },
  { id: "tour_hanches", label: "Tour de hanches", unit: "cm", placeholder: "96" },
  { id: "longueur_dos", label: "Longueur du dos", unit: "cm", placeholder: "42" },
  { id: "largeur_epaules", label: "Largeur d'épaules", unit: "cm", placeholder: "40" },
  { id: "longueur_bras", label: "Longueur des bras", unit: "cm", placeholder: "60" },
  { id: "tour_cou", label: "Tour de cou", unit: "cm", placeholder: "38" },
  { id: "longueur_jambe", label: "Longueur de jambe", unit: "cm", placeholder: "105" },
];

export default function Mesures() {
  return (
    <div className="min-h-screen pb-20 lg:pb-8 bg-white">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
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

      <div className="max-w-2xl mx-auto px-4 lg:px-6 py-6">
        <Card className="border-gray-100 shadow-sm mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-[#722F37] flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Comment prendre vos mesures ?
            </CardTitle>
          </CardHeader>
          <CardContent>
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

        <Card className="border-gray-100 shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-[#722F37]">Mes mesures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {measurements.map((m) => (
                <div key={m.id} className="flex items-center gap-4">
                  <Label htmlFor={m.id} className="w-40 text-sm text-gray-700">
                    {m.label}
                  </Label>
                  <div className="flex-1 flex items-center gap-2">
                    <Input
                      id={m.id}
                      type="number"
                      placeholder={m.placeholder}
                      className="border-gray-200"
                      data-testid={`input-${m.id}`}
                    />
                    <span className="text-gray-500 text-sm w-8">{m.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
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
