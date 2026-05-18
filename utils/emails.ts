// utils/emails.ts
import { emailTemplate, infoBlock, dateBlock, amountBlock, p, strong } from './emailTemplate';

export function emailBienvenueClient(firstName: string) {
  return {
    subject: 'Bienvenue sur SEAMLIER — Activez votre compte',
    html: emailTemplate({
      title: `Bienvenue, ${firstName}`,
      badge: '✓ Inscription',
      badgeColor: 'bordeaux',
      content: `${p(`Merci d'avoir rejoint ${strong('SEAMLIER')}, la plateforme qui connecte les particuliers avec les meilleurs artisans couturiers de France.`)}${p('Pour activer votre compte, confirmez votre adresse email.')}`,
      ctaText: 'Activer mon compte',
      ctaUrl: 'https://seamlier.fr/verify',
      ctaNote: 'Ce lien expire dans 24 heures.',
    }),
  };
}

export function emailInscriptionArtisan(firstName: string) {
  return {
    subject: 'Votre compte artisan SEAMLIER est créé',
    html: emailTemplate({
      title: `Bienvenue, ${firstName}`,
      badge: '✓ Compte artisan créé',
      badgeColor: 'bordeaux',
      content: `${p(`Votre compte artisan sur ${strong('SEAMLIER')} a bien été créé.`)}${p('Votre profil est en cours de validation. Vous recevrez une confirmation sous 24h.')}${infoBlock('Votre espace artisan', [{ label: 'Plan', value: 'Starter — Gratuit' },{ label: 'Commission', value: '15% (plafonné à 10 commandes/mois)' },{ label: 'Statut', value: 'En attente de validation' }])}`,
      ctaText: 'Accéder à mon espace',
      ctaUrl: 'https://seamlier.fr/dashboard',
    }),
  };
}

export function emailRdvConfirme(firstName: string, tailorName: string, appointmentType: string, date: string, time: string) {
  return {
    subject: `Rendez-vous confirmé — ${date}`,
    html: emailTemplate({
      title: 'Rendez-vous confirmé',
      badge: '✓ Confirmé',
      badgeColor: 'bordeaux',
      content: `${p(`Bonjour ${strong(firstName)},`)}${p(`Votre rendez-vous ${strong(appointmentType)} avec ${strong(tailorName)} est bien confirmé :`)}${dateBlock('RENDEZ-VOUS', date, time, appointmentType)}`,
      ctaText: 'Voir mes rendez-vous',
      ctaUrl: 'https://seamlier.fr/rendez-vous',
      ctaNote: 'Un rappel vous sera envoyé 24h avant le rendez-vous.',
    }),
  };
}

export function emailRappelRdv(firstName: string, tailorName: string, appointmentType: string, date: string, time: string) {
  return {
    subject: `Rappel — Votre rendez-vous demain à ${time}`,
    html: emailTemplate({
      title: 'Rendez-vous demain',
      badge: '⏰ Rappel',
      badgeColor: 'bordeaux',
      content: `${p(`Bonjour ${strong(firstName)},`)}${p(`Votre rendez-vous ${strong(appointmentType)} avec ${strong(tailorName)} a lieu demain.`)}${dateBlock('DEMAIN', date, time, appointmentType)}`,
      ctaText: 'Voir mes rendez-vous',
      ctaUrl: 'https://seamlier.fr/rendez-vous',
    }),
  };
}

export function emailNouveauDevis(clientFirstName: string, tailorName: string, orderTitle: string, deliveryDelay: string, amount: string) {
  return {
    subject: `Nouveau devis reçu — ${orderTitle}`,
    html: emailTemplate({
      title: 'Vous avez reçu un devis',
      badge: 'Nouveau devis',
      badgeColor: 'bordeaux',
      content: `${p(`Bonjour ${strong(clientFirstName)},`)}${p(`L'artisan ${strong(tailorName)} a répondu à votre demande.`)}${infoBlock('DÉTAILS DU DEVIS', [{ label: 'Prestation', value: orderTitle },{ label: 'Artisan', value: tailorName },{ label: 'Délai estimé', value: deliveryDelay },{ label: 'Montant', value: `${amount} €` }])}`,
      ctaText: 'Voir le devis',
      ctaUrl: 'https://seamlier.fr/projets',
      ctaNote: 'Ce devis est valable 7 jours.',
    }),
  };
}

export function emailCommandeAcceptee(clientFirstName: string, tailorName: string, orderTitle: string, deadline: string) {
  return {
    subject: `Commande acceptée — ${orderTitle}`,
    html: emailTemplate({
      title: 'Commande acceptée',
      badge: '✓ Acceptée',
      badgeColor: 'green',
      content: `${p(`Bonjour ${strong(clientFirstName)},`)}${p(`Votre commande ${strong(orderTitle)} a été acceptée par ${strong(tailorName)}.`)}${infoBlock('COMMANDE', [{ label: 'Commande', value: orderTitle },{ label: 'Artisan', value: tailorName },{ label: 'Deadline', value: deadline },{ label: 'Statut', value: 'En cours ✓' }])}`,
      ctaText: 'Voir ma commande',
      ctaUrl: 'https://seamlier.fr/projets',
    }),
  };
}

export function emailCommandeRefusee(clientFirstName: string, tailorName: string, orderTitle: string) {
  return {
    subject: `Commande non disponible — ${orderTitle}`,
    html: emailTemplate({
      title: 'Commande non disponible',
      badge: 'Non disponible',
      badgeColor: 'gray',
      content: `${p(`Bonjour ${strong(clientFirstName)},`)}${p(`Votre commande ${strong(orderTitle)} n'a pas pu être prise en charge par ${strong(tailorName)}.`)}`,
      ctaText: 'Explorer les artisans',
      ctaUrl: 'https://seamlier.fr/artisans',
    }),
  };
}

export function emailPaiementRecu(clientFirstName: string, orderTitle: string, tailorName: string, amount: string, paymentDate: string, transactionId: string) {
  return {
    subject: `Paiement confirmé — ${amount} €`,
    html: emailTemplate({
      title: 'Paiement reçu',
      badge: '✓ Paiement confirmé',
      badgeColor: 'bordeaux',
      content: `${p(`Bonjour ${strong(clientFirstName)},`)}${p("Votre paiement a bien été reçu et sécurisé.")}${amountBlock(amount)}${infoBlock('REÇU', [{ label: 'Commande', value: orderTitle },{ label: 'Artisan', value: tailorName },{ label: 'Date', value: paymentDate },{ label: 'Référence', value: transactionId }])}`,
      ctaText: 'Suivre ma commande',
      ctaUrl: 'https://seamlier.fr/projets',
    }),
  };
}

export function emailDeadline(firstName: string, orderTitle: string, deadline: string) {
  return {
    subject: `⚠ Deadline qui approche — ${orderTitle}`,
    html: emailTemplate({
      title: 'Deadline qui approche',
      badge: '⚠ Urgent',
      badgeColor: 'orange',
      content: `${p(`Bonjour ${strong(firstName)},`)}${p(`Votre commande ${strong(orderTitle)} doit être prête pour le ${strong(deadline)}.`)}${dateBlock('DEADLINE', deadline, undefined, orderTitle, '#c45c00')}`,
      ctaText: 'Voir la commande',
      ctaUrl: 'https://seamlier.fr/projets',
    }),
  };
}

export function emailDemandeAvis(clientFirstName: string, orderTitle: string, tailorName: string, reviewUrl: string) {
  return {
    subject: `Votre avis sur ${tailorName} — SEAMLIER`,
    html: emailTemplate({
      title: 'Votre avis compte',
      badge: '✓ Livraison confirmée',
      badgeColor: 'bordeaux',
      content: `${p(`Bonjour ${strong(clientFirstName)},`)}${p(`Votre commande ${strong(orderTitle)} a été livrée. Partagez votre expérience avec ${strong(tailorName)}.`)}${infoBlock('COMMANDE LIVRÉE', [{ label: 'Commande', value: orderTitle },{ label: 'Artisan', value: tailorName }])}`,
      ctaText: 'Laisser un avis',
      ctaUrl: reviewUrl,
      ctaNote: 'Votre avis sera publié après modération.',
    }),
  };
}
