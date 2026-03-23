import { useState } from "react";
import { useLocation } from "wouter";
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
import { Logo } from "@/components/logo";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { LanguageToggle } from "@/components/language-toggle";
import { Loader2, Scissors, MapPin, Briefcase, FileText } from "lucide-react";

const setupSchema = z.object({
  location: z.string().min(2, "Veuillez indiquer votre ville"),
  experience: z.string().min(1, "Veuillez sélectionner votre expérience"),
  specialties: z.string().min(2, "Veuillez indiquer vos spécialités"),
  bio: z.string().optional(),
});

type SetupForm = z.infer<typeof setupSchema>;

export default function ProSetup() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["/api/user/me"],
  });

  const form = useForm<SetupForm>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      location: "",
      experience: "",
      specialties: "",
      bio: "",
    },
  });

  const setupMutation = useMutation({
    mutationFn: async (data: SetupForm) => {
      // First update user location
      await apiRequest("PATCH", "/api/user/me", {
        location: data.location,
      });
      
      // Then create tailor profile
      const response = await apiRequest("POST", "/api/user/me/tailor", {
        specialties: data.specialties.split(",").map(s => s.trim()),
        experience: parseInt(data.experience),
        bio: data.bio || "",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/me/tailor"] });
      toast({
        title: t('auth.profileCreated'),
        description: t('auth.welcomeProDesc'),
      });
      setLocation("/dashboard-pro");
    },
    onError: (error: Error) => {
      toast({
        title: t('auth.error'),
        description: error.message || t('auth.errorMessage'),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SetupForm) => {
    setupMutation.mutate(data);
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#601B28]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Logo className="text-[#601B28]" textClassName="text-[#601B28]" />
          <LanguageToggle />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-[#601B28]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Scissors className="h-8 w-8 text-[#601B28]" />
          </div>
          <h1 className="font-serif text-3xl lg:text-4xl text-[#601B28] mb-3">
            {t('proSetup.title')}
          </h1>
          <p className="text-gray-600 text-lg">
            {t('proSetup.subtitle')}
          </p>
        </div>

        <Card className="border border-gray-100 shadow-sm">
          <CardContent className="p-6 bg-white">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-[#601B28]" />
                        {t('proSetup.city')}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t('proSetup.cityPlaceholder')} 
                          {...field} 
                          data-testid="input-location"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="specialties"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Scissors className="h-4 w-4 text-[#601B28]" />
                        {t('proSetup.specialties')}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t('proSetup.specialtiesPlaceholder')} 
                          {...field} 
                          data-testid="input-specialties"
                        />
                      </FormControl>
                      <p className="text-xs text-gray-500">{t('proSetup.specialtiesHint')}</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-[#601B28]" />
                        {t('proSetup.experience')}
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-experience">
                            <SelectValue placeholder={t('proSetup.experiencePlaceholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">{t('proSetup.exp1')}</SelectItem>
                          <SelectItem value="3">{t('proSetup.exp3')}</SelectItem>
                          <SelectItem value="5">{t('proSetup.exp5')}</SelectItem>
                          <SelectItem value="10">{t('proSetup.exp10')}</SelectItem>
                          <SelectItem value="15">{t('proSetup.exp15')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#601B28]" />
                        {t('proSetup.bio')}
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={t('proSetup.bioPlaceholder')} 
                          className="min-h-[120px] resize-none"
                          {...field} 
                          data-testid="input-bio"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-[#601B28] hover:bg-[#4E1522]"
                  disabled={setupMutation.isPending}
                  data-testid="button-submit-setup"
                >
                  {setupMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('common.loading')}
                    </>
                  ) : (
                    t('proSetup.submit')
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
