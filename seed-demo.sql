-- ============================================================
-- SEAMLiER — Artisans de démo
-- Mot de passe de tous les comptes : Demo2026!
-- Idempotent : INSERT IGNORE ne modifie rien si déjà présent
-- ============================================================

-- ── 1. Sophie Moreau — Paris · Robes de mariée & haute couture ──────────────

INSERT IGNORE INTO users (
  id, email, password, first_name, last_name, role,
  phone, location, email_verified, created_at
) VALUES (
  'demo-user-sophie-0001',
  'sophie.moreau@demo-seamlier.fr',
  '$2b$12$94Pcn8GjZak5qxKO3s./zOf6mga5/w0CLaxnFD.XfPIp.xqXXZAKy',
  'Sophie', 'Moreau', 'tailor',
  '+33 6 11 22 33 44', 'Paris', 1, NOW()
);

INSERT IGNORE INTO tailors (
  id, user_id, bio, specialties, experience,
  is_verified, rating, review_count, portfolio_count,
  subscription_plan, dossier_status, siret, created_at
) VALUES (
  'demo-tailor-sophie-001',
  'demo-user-sophie-0001',
  'Couturière spécialisée en robes de mariée sur mesure et haute couture parisienne. Chaque création est unique, pensée pour sublimer votre silhouette le jour J.',
  '["Robe de mariée","Haute couture","Robe de soirée","Retouches"]',
  8, 1, 4.9, 47, 12,
  'Pro', 'validated', '75234567800012', NOW()
);

INSERT IGNORE INTO admin_artisans (
  id, first_name, last_name, specialty, status, city,
  email, phone, years_experience, bio,
  subscription_plan, payment_status, join_date, created_at
) VALUES (
  'demo-admin-sophie-001',
  'Sophie', 'Moreau', 'Robe de mariée & haute couture', 'Vérifié', 'Paris',
  'sophie.moreau@demo-seamlier.fr', '+33 6 11 22 33 44', 8,
  'Couturière spécialisée en robes de mariée sur mesure et haute couture parisienne.',
  'Pro', 'Payé', '08/05/2026', NOW()
);

-- ── 2. Amadou Diallo — Lyon · Costumes & retouches ──────────────────────────

INSERT IGNORE INTO users (
  id, email, password, first_name, last_name, role,
  phone, location, email_verified, created_at
) VALUES (
  'demo-user-amadou-0002',
  'amadou.diallo@demo-seamlier.fr',
  '$2b$12$94Pcn8GjZak5qxKO3s./zOf6mga5/w0CLaxnFD.XfPIp.xqXXZAKy',
  'Amadou', 'Diallo', 'tailor',
  '+33 6 55 66 77 88', 'Lyon', 1, NOW()
);

INSERT IGNORE INTO tailors (
  id, user_id, bio, specialties, experience,
  is_verified, rating, review_count, portfolio_count,
  subscription_plan, dossier_status, siret, created_at
) VALUES (
  'demo-tailor-amadou-002',
  'demo-user-amadou-0002',
  'Tailleur lyonnais avec 12 ans d'expérience dans la confection de costumes sur mesure pour hommes et femmes. Retouches express disponibles sous 48h.',
  '["Costume homme","Tailleur femme","Retouches","Vêtements de cérémonie"]',
  12, 1, 4.7, 83, 20,
  'Starter', 'validated', '69123456700034', NOW()
);

INSERT IGNORE INTO admin_artisans (
  id, first_name, last_name, specialty, status, city,
  email, phone, years_experience, bio,
  subscription_plan, payment_status, join_date, created_at
) VALUES (
  'demo-admin-amadou-002',
  'Amadou', 'Diallo', 'Costumes & retouches sur mesure', 'Vérifié', 'Lyon',
  'amadou.diallo@demo-seamlier.fr', '+33 6 55 66 77 88', 12,
  'Tailleur lyonnais avec 12 ans d\'expérience dans la confection de costumes sur mesure.',
  'Starter', 'Payé', '08/05/2026', NOW()
);

-- ── 3. Yasmine Bensaid — Bordeaux · Mode africaine & créations ──────────────

INSERT IGNORE INTO users (
  id, email, password, first_name, last_name, role,
  phone, location, email_verified, created_at
) VALUES (
  'demo-user-yasmine-0003',
  'yasmine.bensaid@demo-seamlier.fr',
  '$2b$12$94Pcn8GjZak5qxKO3s./zOf6mga5/w0CLaxnFD.XfPIp.xqXXZAKy',
  'Yasmine', 'Bensaid', 'tailor',
  '+33 6 98 76 54 32', 'Bordeaux', 1, NOW()
);

INSERT IGNORE INTO tailors (
  id, user_id, bio, specialties, experience,
  is_verified, rating, review_count, portfolio_count,
  subscription_plan, dossier_status, siret, created_at
) VALUES (
  'demo-tailor-yasmine-003',
  'demo-user-yasmine-0003',
  'Créatrice bordelaise spécialisée dans la mode africaine contemporaine et les tenues de fête sur mesure. Tissus wax, bazin et soieries importés directement.',
  '["Mode africaine","Boubou & tenues de fête","Robes de soirée","Créations originales"]',
  5, 1, 4.8, 31, 9,
  'Starter', 'validated', '33098765400056', NOW()
);

INSERT IGNORE INTO admin_artisans (
  id, first_name, last_name, specialty, status, city,
  email, phone, years_experience, bio,
  subscription_plan, payment_status, join_date, created_at
) VALUES (
  'demo-admin-yasmine-003',
  'Yasmine', 'Bensaid', 'Mode africaine & créations sur mesure', 'Vérifié', 'Bordeaux',
  'yasmine.bensaid@demo-seamlier.fr', '+33 6 98 76 54 32', 5,
  'Créatrice spécialisée dans la mode africaine contemporaine et les tenues de fête sur mesure.',
  'Starter', 'Payé', '08/05/2026', NOW()
);

-- ============================================================
-- Vérification rapide
-- ============================================================
SELECT u.email, u.first_name, u.last_name, t.is_verified, t.rating, t.dossier_status
FROM users u
JOIN tailors t ON t.user_id = u.id
WHERE u.email LIKE '%demo-seamlier.fr';
