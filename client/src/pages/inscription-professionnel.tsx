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
import { ArrowLeft, Eye, EyeOff, Check, Briefcase } from "lucide-react";
import { Logo } from "@/components/logo";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { API_ENDPOINTS, phpFetch, safeParse } from "@/lib/api-config";
import { LanguageToggle } from "@/components/language-toggle";

const proSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Adresse email invalide"),
  phone: z.string().min(8, "Numéro de téléphone invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  confirmPassword: z.string(),
  specialty: z.string().min(1, "Veuillez choisir une spécialité"),
  city: z.string().min(2, "Veuillez indiquer votre ville"),
  yearsExperience: z.string().min(1, "Veuillez indiquer vos années d'expérience"),
  bio: z.string().optional(),
  siret: z.string().optional(),
  companyName: z.string().optional(),
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
      const response = await phpFetch(API_ENDPOINTS.auth.register, {
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
          siret: data.siret || "",
          companyName: data.companyName || "",
        }),
      });
      const result = await safeParse(response);
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Erreur lors de l'inscription");
      }
      return result;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["auth-user"] });
      toast({
        title: "Compte professionnel créé",
        description: "Bienvenue sur SEAMLIER ! Votre profil est en cours de vérification.",
      });
      setLocation("/professionnel/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'inscription.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProForm) => {
    registerMutation.mutate(data);
  };

  const benefits = [
    "Visibilité auprès de milliers de clients",
    "Gestion simplifiée de vos rendez-vous",
    "Portfolio en ligne pour présenter vos créations",
    "Messagerie intégrée avec vos clients",
    "Tableau de bord professionnel complet",
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back-pro">
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
              <div className="w-10 h-10 rounded-full bg-[#722F37]/10 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-[#722F37]" />
              </div>
              <h1 className="font-serif text-xl lg:text-2xl text-[#722F37]">
                Rejoignez SEAMLIER en tant que professionnel
              </h1>
            </div>
            <p className="text-gray-600 text-lg mb-8">
              Développez votre activité et touchez de nouveaux clients grâce à notre plateforme dédiée aux artisans de la couture.
            </p>

            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white border border-[#722F37] flex items-center justify-center">
                    <Check className="h-4 w-4 text-[#722F37]" />
                  </div>
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>

            <div className="mt-12 p-6 bg-gray-50 rounded-lg">
              <p className="text-gray-600 italic">
                "SEAMLIER m'a permis de tripler ma clientèle en 6 mois. La plateforme est intuitive et mes clients adorent pouvoir réserver en ligne."
              </p>
              <p className="text-[#722F37] font-medium mt-3">— Fatou D., Couturière à Lyon</p>
            </div>
          </div>

          <div>
            <div className="lg:hidden mb-8">
              <h1 className="font-serif text-xl text-[#722F37] mb-2">
                Inscription Professionnel
              </h1>
              <p className="text-gray-600">
                Créez votre profil artisan et rejoignez notre communauté.
              </p>
            </div>

            <Card className="border border-gray-100 shadow-sm">
              <CardContent className="p-6 lg:p-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Prénom</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Fatou"
                                {...field}
                                data-testid="input-pro-firstname"
                                className="border-gray-200 focus:border-[#722F37] focus:ring-[#722F37]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Nom</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Diallo"
                                {...field}
                                data-testid="input-pro-lastname"
                                className="border-gray-200 focus:border-[#722F37] focus:ring-[#722F37]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Email professionnel</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="fatou@atelier-couture.fr"
                              {...field}
                              data-testid="input-pro-email"
                              className="border-gray-200 focus:border-[#722F37] focus:ring-[#722F37]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Téléphone</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="06 12 34 56 78"
                              {...field}
                              data-testid="input-pro-phone"
                              className="border-gray-200 focus:border-[#722F37] focus:ring-[#722F37]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="specialty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Spécialité principale</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-pro-specialty" className="border-gray-200 focus:border-[#722F37] focus:ring-[#722F37]">
                                <SelectValue placeholder="Choisissez votre spécialité" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {specialties.map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Ville</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Lyon"
                                {...field}
                                data-testid="input-pro-city"
                                className="border-gray-200 focus:border-[#722F37] focus:ring-[#722F37]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="yearsExperience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Années d'expérience</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="5"
                                {...field}
                                data-testid="input-pro-experience"
                                className="border-gray-200 focus:border-[#722F37] focus:ring-[#722F37]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Présentez-vous (optionnel)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Décrivez votre parcours, vos spécialités, ce qui vous passionne dans la couture..."
                              {...field}
                              data-testid="input-pro-bio"
                              className="border-gray-200 focus:border-[#722F37] focus:ring-[#722F37] min-h-[80px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Entreprise (optionnel)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Atelier Couture"
                                {...field}
                                data-testid="input-pro-company"
                                className="border-gray-200 focus:border-[#722F37] focus:ring-[#722F37]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="siret"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">SIRET (optionnel)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="123 456 789 00012"
                                {...field}
                                data-testid="input-pro-siret"
                                className="border-gray-200 focus:border-[#722F37] focus:ring-[#722F37]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Mot de passe</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Minimum 8 caractères"
                                {...field}
                                data-testid="input-pro-password"
                                className="border-gray-200 focus:border-[#722F37] focus:ring-[#722F37] pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                data-testid="button-toggle-pro-password"
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Confirmer le mot de passe</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Retapez votre mot de passe"
                                {...field}
                                data-testid="input-pro-confirm-password"
                                className="border-gray-200 focus:border-[#722F37] focus:ring-[#722F37] pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                data-testid="button-toggle-pro-confirm-password"
                              >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="pt-2">
                      <Button
                        type="submit"
                        className="w-full bg-[#722F37] hover:bg-[#5a1f25] text-white"
                        disabled={registerMutation.isPending}
                        data-testid="button-pro-submit"
                      >
                        {registerMutation.isPending ? "Création en cours..." : "Créer mon compte professionnel"}
                      </Button>
                    </div>

                    <p className="text-center text-sm text-gray-500">
                      En vous inscrivant, vous acceptez nos{" "}
                      <Link href="/cgv" className="text-[#722F37] hover:underline">Conditions Générales</Link>
                      {" "}et notre{" "}
                      <Link href="/confidentialite" className="text-[#722F37] hover:underline">Politique de Confidentialité</Link>.
                    </p>
                  </form>
                </Form>

                <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                  <p className="text-gray-600">
                    Vous avez déjà un compte ?{" "}
                    <Link href="/connexion" className="text-[#722F37] font-medium hover:underline" data-testid="link-pro-login">
                      Se connecter
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>

            <p className="text-center text-sm text-gray-500 mt-6">
              Vous êtes un particulier ?{" "}
              <Link href="/particulier" className="text-[#722F37] font-medium hover:underline" data-testid="link-particulier-signup">
                Créer un compte client
              </Link>
            </p>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 py-6 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-500 text-sm">
            © 2026 SEAMLIER. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
