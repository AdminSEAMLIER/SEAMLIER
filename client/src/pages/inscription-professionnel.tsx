import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, EyeOff, Check, Briefcase, Loader2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { API_ENDPOINTS, apiFetch } from "@/lib/api-config";
import { LanguageToggle } from "@/components/language-toggle";

// Point 2: Schéma mis à jour avec SIRET et Entreprise obligatoires pour le sérieux du profil
const proSchema = z.object({
  firstName: z.string().min(2, "Le prénom est requis"),
  lastName: z.string().min(2, "Le nom est requis"),
  email: z.string().email("Adresse email invalide"),
  phone: z.string().min(8, "Numéro de téléphone invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  confirmPassword: z.string(),
  specialty: z.string().min(1, "Veuillez choisir une spécialité"),
  city: z.string().min(2, "Veuillez indiquer votre ville"),
  yearsExperience: z.string().min(1, "Veuillez indiquer vos années d'expérience"),
  bio: z.string().min(10, "Merci de rédiger une courte présentation"),
  siret: z.string().min(14, "Le SIRET doit comporter 14 chiffres").max(14, "SIRET invalide"),
  companyName: z.string().min(2, "Le nom de l'entreprise est requis"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type ProForm = z.infer<typeof proSchema>;

const specialties = [
  "Couture sur mesure",
  "Retouches",
  "Haute couture",
  "Robes de mariée",
  "Costumes homme",
  "Vêtements traditionnels",
  "Mode enfant",
  "Ameublement & rideaux",
  "Broderie",
  "Maroquinerie",
];

export default function InscriptionProfessionnel() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<ProForm>({
    resolver: zodResolver(proSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      specialty: "",
      city: "",
      yearsExperience: "",
      bio: "",
      siret: "",
      companyName: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: ProForm) => {
      const response = await apiFetch(API_ENDPOINTS.auth.register, {
        method: "POST",
        body: JSON.stringify({
          fullName: `${data.firstName} ${data.lastName}`,
          email: data.email,
          phone: data.phone,
          password: data.password,
          role: "tailor",
          specialty: data.specialty,
          city: data.city,
          yearsExperience: parseInt(data.yearsExperience) || 0,
          bio: data.bio || "",
          siret: data.siret,
          companyName: data.companyName,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Erreur lors de l'inscription");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth-user"] });
      toast({
        title: "Compte créé avec succès",
        description: "Redirection vers le paiement d'adhésion...",
      });
      // Point 2 & 4: Redirection vers le dashboard (ou Stripe si configuré)
      setLocation("/dashboard-pro");
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProForm) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Button>
            </Link>
            <Logo className="text-2xl text-[#722F37]" />
          </div>
          <LanguageToggle />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div className="hidden lg:block">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-white border border-[#722F37] flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-[#722F37]" />
              </div>
              <h1 className="font-serif text-2xl text-[#722F37]">
                Espace Professionnel
              </h1>
            </div>
            <p className="text-gray-600 text-lg mb-8">
              Développez votre atelier et accédez à une clientèle qualifiée.
            </p>

            <div className="space-y-4">
              {["Visibilité accrue", "Gestion de projet", "Paiements sécurisés"].map((benefit, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white border border-[#722F37] flex items-center justify-center">
                    <Check className="h-4 w-4 text-[#722F37]" />
                  </div>
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <Card className="border border-gray-100 shadow-sm">
            <CardContent className="p-6 lg:p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="firstName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prénom</FormLabel>
                        <FormControl><Input placeholder="Prénom" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="lastName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom</FormLabel>
                        <FormControl><Input placeholder="Nom" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="companyName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de l'enseigne / Atelier</FormLabel>
                      <FormControl><Input placeholder="Ex: Atelier de Couture" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="siret" render={({ field }) => (
                    <FormItem>
                      <FormLabel>N° SIRET (14 chiffres)</FormLabel>
                      <FormControl><Input placeholder="123 456 789 00012" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Pro</FormLabel>
                        <FormControl><Input type="email" placeholder="contact@atelier.fr" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Téléphone</FormLabel>
                        <FormControl><Input placeholder="06..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="specialty" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Spécialité</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Sélectionnez" /></SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white text-black">
                          {specialties.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="city" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ville</FormLabel>
                        <FormControl><Input placeholder="Ville" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="yearsExperience" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expérience (ans)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mot de passe</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type={showPassword ? "text" : "password"} {...field} />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3">
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {/* Bouton avec Spinner (Point 3) */}
                  <Button
                    type="submit"
                    className="w-full bg-[#722F37] hover:bg-[#5a1f25] text-white py-6"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Création du profil...</span>
                      </div>
                    ) : (
                      "Valider mon inscription"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}