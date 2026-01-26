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
import { ArrowLeft, Eye, EyeOff, Check, Users, TrendingUp, MessageCircle } from "lucide-react";
import { Logo } from "@/components/logo";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { LanguageToggle } from "@/components/language-toggle";

const inscriptionProSchema = z.object({
  fullName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Adresse email invalide"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
  location: z.string().min(2, "Veuillez indiquer votre ville"),
  experience: z.string().min(1, "Veuillez sélectionner votre expérience"),
  specialties: z.string().min(2, "Veuillez indiquer vos spécialités"),
  bio: z.string().optional(),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type InscriptionProForm = z.infer<typeof inscriptionProSchema>;

export default function InscriptionProfessionnel() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<InscriptionProForm>({
    resolver: zodResolver(inscriptionProSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      location: "",
      experience: "",
      specialties: "",
      bio: "",
      password: "",
      confirmPassword: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: InscriptionProForm) => {
      const response = await apiRequest("POST", "/api/auth/register-pro", {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        location: data.location,
        experience: parseInt(data.experience),
        specialties: data.specialties.split(",").map(s => s.trim()),
        bio: data.bio,
        password: data.password,
        role: "tailor",
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('auth.proAccountCreated'),
        description: t('auth.welcomeProDesc2'),
      });
      setLocation("/professionnel");
    },
    onError: (error: Error) => {
      toast({
        title: t('auth.error'),
        description: error.message || t('auth.errorMessage'),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InscriptionProForm) => {
    registerMutation.mutate(data);
  };

  const benefits = [
    { icon: Users, text: t('auth.proBenefits.clients') },
    { icon: TrendingUp, text: t('auth.proBenefits.growth') },
    { icon: MessageCircle, text: t('auth.proBenefits.messaging') },
    { icon: Check, text: t('auth.proBenefits.portfolio') },
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
            <Logo className="text-2xl text-[#722F37]" />
          </div>
          <LanguageToggle />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div className="hidden lg:block">
            <h1 className="font-serif text-4xl text-[#722F37] mb-4">
              {t('auth.joinOurNetwork')}
            </h1>
            <p className="text-gray-600 text-lg mb-8">
              {t('auth.developActivity')}
            </p>

            <div className="space-y-5">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white border border-[#722F37] flex items-center justify-center">
                    <benefit.icon className="h-5 w-5 text-[#722F37]" />
                  </div>
                  <span className="text-gray-700">{benefit.text}</span>
                </div>
              ))}
            </div>

            <div className="mt-12 p-6 bg-gray-50 rounded-lg">
              <p className="text-gray-600 italic">
                "{t('auth.testimonialPro')}"
              </p>
              <p className="text-[#722F37] font-medium mt-3">— Sophie M., Lyon</p>
            </div>
          </div>

          <div>
            <div className="lg:hidden mb-8">
              <h1 className="font-serif text-3xl text-[#722F37] mb-2">
                {t('auth.joinOurNetwork')}
              </h1>
              <p className="text-gray-600">
                {t('auth.developActivityShort')}
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
                          <FormLabel className="text-gray-700">{t('auth.workshopName')}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Atelier Sophie Couture" 
                              {...field} 
                              data-testid="input-fullname"
                              className="border-gray-200 focus:border-[#722F37] focus:ring-[#722F37]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">{t('auth.proEmail')}</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="contact@atelier.com" 
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
                            <FormLabel className="text-gray-700">{t('auth.phone')}</FormLabel>
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
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">{t('auth.city')}</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Lyon" 
                                {...field} 
                                data-testid="input-location"
                                className="border-gray-200 focus:border-[#722F37] focus:ring-[#722F37]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="experience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">{t('auth.yearsExperience')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger 
                                  data-testid="select-experience"
                                  className="border-gray-200 focus:border-[#722F37] focus:ring-[#722F37]"
                                >
                                  <SelectValue placeholder={t('auth.select')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1">{t('auth.lessThan2')}</SelectItem>
                                <SelectItem value="3">{t('auth.twoToFive')}</SelectItem>
                                <SelectItem value="7">{t('auth.fiveToTen')}</SelectItem>
                                <SelectItem value="15">{t('auth.moreThan10')}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="specialties"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">{t('auth.specialties')}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={t('auth.specialtiesPlaceholder')} 
                              {...field} 
                              data-testid="input-specialties"
                              className="border-gray-200 focus:border-[#722F37] focus:ring-[#722F37]"
                            />
                          </FormControl>
                          <p className="text-xs text-gray-500 mt-1">{t('auth.separateByComma')}</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">
                            {t('auth.presentation')} <span className="text-gray-400">({t('auth.optional')})</span>
                          </FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder={t('auth.presentationPlaceholder')} 
                              {...field} 
                              data-testid="input-bio"
                              className="border-gray-200 focus:border-[#722F37] focus:ring-[#722F37] min-h-[100px]"
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
                          <FormLabel className="text-gray-700">{t('auth.confirmPassword')}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showConfirmPassword ? "text" : "password"} 
                                placeholder={t('auth.confirmPasswordPlaceholder')} 
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
                        {registerMutation.isPending ? t('auth.creating') : t('auth.signupPro')}
                      </Button>
                    </div>

                    <p className="text-center text-sm text-gray-500">
                      {t('auth.termsAccept')}{" "}
                      <a href="#" className="text-[#722F37] hover:underline">{t('auth.termsOfUse')}</a>
                      {" "}{t('auth.and')}{" "}
                      <a href="#" className="text-[#722F37] hover:underline">{t('auth.privacyPolicy')}</a>.
                    </p>
                  </form>
                </Form>

                <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                  <p className="text-gray-600">
                    {t('auth.hasAccount')}{" "}
                    <Link href="/connexion" className="text-[#722F37] font-medium hover:underline" data-testid="link-login">
                      {t('auth.login')}
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>

            <p className="text-center text-sm text-gray-500 mt-6">
              {t('auth.areYouClient')}{" "}
              <Link href="/inscription-particulier" className="text-[#722F37] font-medium hover:underline" data-testid="link-client-signup">
                {t('auth.createClientAccount')}
              </Link>
            </p>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 py-6 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-500 text-sm">
            © 2026 L'Art de Coudre. {t('footer.allRightsReserved')}
          </p>
        </div>
      </footer>
    </div>
  );
}
