import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, EyeOff, Scissors, Check } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const inscriptionSchema = z.object({
  fullName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Adresse email invalide"),
  phone: z.string().optional(),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type InscriptionForm = z.infer<typeof inscriptionSchema>;

export default function InscriptionParticulier() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<InscriptionForm>({
    resolver: zodResolver(inscriptionSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: InscriptionForm) => {
      const response = await apiRequest("POST", "/api/auth/register", {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: "client",
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Compte créé avec succès",
        description: "Bienvenue sur L'Art de Coudre !",
      });
      setLocation("/particulier");
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'inscription",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InscriptionForm) => {
    registerMutation.mutate(data);
  };

  const benefits = [
    "Accédez à des couturiers vérifiés",
    "Recevez des devis personnalisés",
    "Sauvegardez vos mesures",
    "Messagerie directe avec les professionnels",
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Scissors className="h-6 w-6 text-[#722F37]" />
            <span className="font-['Parisienne'] text-2xl text-[#722F37]">L'Art de Coudre</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div className="hidden lg:block">
            <h1 className="font-serif text-4xl text-[#722F37] mb-4">
              Créez votre compte
            </h1>
            <p className="text-gray-600 text-lg mb-8">
              Rejoignez notre communauté et trouvez le couturier idéal pour vos projets.
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
                "J'ai trouvé une couturière exceptionnelle pour ma robe de mariée. 
                Le processus était simple et le résultat magnifique !"
              </p>
              <p className="text-[#722F37] font-medium mt-3">— Marie L., Paris</p>
            </div>
          </div>

          <div>
            <div className="lg:hidden mb-8">
              <h1 className="font-serif text-3xl text-[#722F37] mb-2">
                Créez votre compte
              </h1>
              <p className="text-gray-600">
                Rejoignez notre communauté de passionnés.
              </p>
            </div>

            <Card className="border border-gray-100 shadow-sm">
              <CardContent className="p-6 lg:p-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Nom complet</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Marie Dupont" 
                              {...field} 
                              data-testid="input-fullname"
                              className="border-gray-200 focus:border-[#722F37] focus:ring-[#722F37]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Adresse email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="marie@exemple.com" 
                              {...field} 
                              data-testid="input-email"
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
                          <FormLabel className="text-gray-700">
                            Téléphone <span className="text-gray-400">(optionnel)</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="tel" 
                              placeholder="06 12 34 56 78" 
                              {...field} 
                              data-testid="input-phone"
                              className="border-gray-200 focus:border-[#722F37] focus:ring-[#722F37]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                                data-testid="input-password"
                                className="border-gray-200 focus:border-[#722F37] focus:ring-[#722F37] pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                data-testid="button-toggle-password"
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
                                placeholder="Confirmez votre mot de passe" 
                                {...field} 
                                data-testid="input-confirm-password"
                                className="border-gray-200 focus:border-[#722F37] focus:ring-[#722F37] pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                data-testid="button-toggle-confirm-password"
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
                        data-testid="button-submit"
                      >
                        {registerMutation.isPending ? "Création en cours..." : "Créer mon compte"}
                      </Button>
                    </div>

                    <p className="text-center text-sm text-gray-500">
                      En créant un compte, vous acceptez nos{" "}
                      <a href="#" className="text-[#722F37] hover:underline">conditions d'utilisation</a>
                      {" "}et notre{" "}
                      <a href="#" className="text-[#722F37] hover:underline">politique de confidentialité</a>.
                    </p>
                  </form>
                </Form>

                <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                  <p className="text-gray-600">
                    Déjà un compte ?{" "}
                    <Link href="/connexion" className="text-[#722F37] font-medium hover:underline" data-testid="link-login">
                      Se connecter
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>

            <p className="text-center text-sm text-gray-500 mt-6">
              Vous êtes couturier ?{" "}
              <Link href="/inscription-professionnel" className="text-[#722F37] font-medium hover:underline" data-testid="link-pro-signup">
                Créer un compte professionnel
              </Link>
            </p>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 py-6 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-500 text-sm">
            © 2026 L'Art de Coudre. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
