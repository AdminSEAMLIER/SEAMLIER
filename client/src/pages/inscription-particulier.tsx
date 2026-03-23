import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
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
import { ArrowLeft, Eye, EyeOff, Check } from "lucide-react";
import { Logo } from "@/components/logo";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { API_ENDPOINTS, apiFetch } from "@/lib/api-config";
import { LanguageToggle } from "@/components/language-toggle";

const inscriptionSchema = z.object({
  fullName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Adresse email invalide"),
  phone: z.string().optional(),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  confirmPassword: z.string(),
  cgvAccepted: z.boolean().refine(v => v === true, { message: "Vous devez accepter les CGV et CGU pour continuer." }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type InscriptionForm = z.infer<typeof inscriptionSchema>;

export default function InscriptionParticulier() {
  const { t } = useTranslation();
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
      cgvAccepted: false,
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: InscriptionForm) => {
      const response = await apiFetch(API_ENDPOINTS.auth.register, {
        method: "POST",
        body: JSON.stringify({
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          password: data.password,
          role: "client",
          cgvAccepted: data.cgvAccepted,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Erreur lors de l'inscription");
      }
      return result;
    },
    onSuccess: (result) => {
      if (result.emailVerificationSent) {
        toast({
          title: t('auth.accountCreated'),
          description: t('auth.verifyEmailSent', 'Un email de confirmation a été envoyé. Vérifiez votre boîte de réception pour activer votre compte.'),
        });
        setLocation("/connexion");
      } else {
        queryClient.setQueryData(["auth-user"], {
          id: result.id,
          email: result.email,
          firstName: result.firstName,
          lastName: result.lastName,
          role: result.role,
        });
        toast({
          title: t('auth.accountCreated'),
          description: t('auth.welcomeDesc'),
        });
        setLocation("/dashboard-client");
      }
    },
    onError: (error: Error) => {
      toast({
        title: t('auth.error'),
        description: error.message || t('auth.errorMessage'),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InscriptionForm) => {
    registerMutation.mutate(data);
  };

  const benefits = [
    t('auth.benefits.verified'),
    t('auth.benefits.quotes'),
    t('auth.benefits.measures'),
    t('auth.benefits.messaging'),
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Button>
            </Link>
            <Logo className="text-2xl text-[#601B28]" />
          </div>
          <LanguageToggle />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div className="hidden lg:block">
            <h1 className="font-serif text-xl lg:text-2xl text-[#601B28] mb-4">
              {t('auth.createAccount')}
            </h1>
            <p className="text-gray-600 text-lg mb-8">
              {t('auth.joinCommunity')}
            </p>

            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white border border-[#601B28] flex items-center justify-center">
                    <Check className="h-4 w-4 text-[#601B28]" />
                  </div>
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>

            <div className="mt-12 p-6 bg-gray-50 rounded-lg">
              <p className="text-gray-600 italic">
                "{t('auth.testimonialClient')}"
              </p>
              <p className="text-[#601B28] font-medium mt-3">— Marie L., Paris</p>
            </div>
          </div>

          <div>
            <div className="lg:hidden mb-8">
              <h1 className="font-serif text-xl text-[#601B28] mb-2">
                {t('auth.createAccount')}
              </h1>
              <p className="text-gray-600">
                {t('auth.joinCommunityShort')}
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
                          <FormLabel className="text-gray-700">{t('auth.fullName')}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Marie Dupont" 
                              {...field} 
                              data-testid="input-fullname"
                              className="border-gray-200 focus:border-[#601B28] focus:ring-[#601B28]"
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
                          <FormLabel className="text-gray-700">{t('auth.email')}</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder={t('auth.emailPlaceholder')} 
                              {...field} 
                              data-testid="input-email"
                              className="border-gray-200 focus:border-[#601B28] focus:ring-[#601B28]"
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
                            {t('auth.phoneOptional')}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="tel" 
                              placeholder="06 12 34 56 78" 
                              {...field} 
                              data-testid="input-phone"
                              className="border-gray-200 focus:border-[#601B28] focus:ring-[#601B28]"
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
                          <FormLabel className="text-gray-700">{t('auth.password')}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showPassword ? "text" : "password"} 
                                placeholder={t('auth.minChars')} 
                                {...field} 
                                data-testid="input-password"
                                className="border-gray-200 focus:border-[#601B28] focus:ring-[#601B28] pr-10"
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
                          <FormLabel className="text-gray-700">{t('auth.confirmPassword')}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showConfirmPassword ? "text" : "password"} 
                                placeholder={t('auth.confirmPasswordPlaceholder')} 
                                {...field} 
                                data-testid="input-confirm-password"
                                className="border-gray-200 focus:border-[#601B28] focus:ring-[#601B28] pr-10"
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

                    <FormField
                      control={form.control}
                      name="cgvAccepted"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              id="cgv-particulier"
                              checked={field.value}
                              onChange={field.onChange}
                              className="mt-1 h-4 w-4 accent-[#601B28] cursor-pointer shrink-0"
                              data-testid="checkbox-cgv"
                            />
                            <label htmlFor="cgv-particulier" className="text-sm text-gray-600 leading-snug cursor-pointer">
                              J'accepte les{" "}
                              <Link href="/cgv" className="text-[#601B28] hover:underline font-medium" target="_blank">Conditions Générales de Vente</Link>
                              {" "}et les{" "}
                              <Link href="/cgu" className="text-[#601B28] hover:underline font-medium" target="_blank">Conditions Générales d'Utilisation</Link>
                              {" "}de SEAMLIER.
                            </label>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="pt-2">
                      <Button 
                        type="submit" 
                        className="w-full bg-[#601B28] hover:bg-[#5a1f25] text-white"
                        disabled={registerMutation.isPending}
                        data-testid="button-submit"
                      >
                        {registerMutation.isPending ? t('auth.creating') : t('auth.signup')}
                      </Button>
                    </div>
                  </form>
                </Form>

                <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                  <p className="text-gray-600">
                    {t('auth.hasAccount')}{" "}
                    <Link href="/connexion" className="text-[#601B28] font-medium hover:underline" data-testid="link-login">
                      {t('auth.login')}
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>

            <p className="text-center text-sm text-gray-500 mt-6">
              {t('auth.areYouTailor')}{" "}
              <Link href="/professionnel" className="text-[#601B28] font-medium hover:underline" data-testid="link-pro-signup">
                {t('auth.createProAccount')}
              </Link>
            </p>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 py-6 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-500 text-sm">
            © 2026 SEAMLIER. {t('footer.allRightsReserved')}
          </p>
        </div>
      </footer>
    </div>
  );
}
