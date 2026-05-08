-- ============================================================
-- Migration 001 — Dossier pro, contrat PDF, notifications
-- Idempotente : utilise IF NOT EXISTS / INFORMATION_SCHEMA
-- Compatible MySQL 5.7+ et 8.x
-- Exécuter via : mysql -u USER -p DATABASE < migrations/001_dossier_contract_notifications.sql
-- Ou coller dans phpMyAdmin (onglet SQL)
-- ============================================================

-- ── 1. TABLE tailors — nouvelles colonnes dossier pro ────────────────────────

-- siret
SET @col := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tailors' AND COLUMN_NAME = 'siret');
SET @sql := IF(@col = 0,
  'ALTER TABLE tailors ADD COLUMN siret VARCHAR(20) NULL AFTER subscription_current_period_end',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- kbis_url
SET @col := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tailors' AND COLUMN_NAME = 'kbis_url');
SET @sql := IF(@col = 0,
  'ALTER TABLE tailors ADD COLUMN kbis_url TEXT NULL AFTER siret',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- kbis_expiry_date
SET @col := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tailors' AND COLUMN_NAME = 'kbis_expiry_date');
SET @sql := IF(@col = 0,
  'ALTER TABLE tailors ADD COLUMN kbis_expiry_date DATE NULL AFTER kbis_url',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- id_card_url
SET @col := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tailors' AND COLUMN_NAME = 'id_card_url');
SET @sql := IF(@col = 0,
  'ALTER TABLE tailors ADD COLUMN id_card_url TEXT NULL AFTER kbis_expiry_date',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- rc_pro_url
SET @col := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tailors' AND COLUMN_NAME = 'rc_pro_url');
SET @sql := IF(@col = 0,
  'ALTER TABLE tailors ADD COLUMN rc_pro_url TEXT NULL AFTER id_card_url',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- iban_rib
SET @col := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tailors' AND COLUMN_NAME = 'iban_rib');
SET @sql := IF(@col = 0,
  'ALTER TABLE tailors ADD COLUMN iban_rib TEXT NULL AFTER rc_pro_url',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- dossier_status
SET @col := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tailors' AND COLUMN_NAME = 'dossier_status');
SET @sql := IF(@col = 0,
  "ALTER TABLE tailors ADD COLUMN dossier_status VARCHAR(20) NOT NULL DEFAULT 'pending' AFTER iban_rib",
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- dossier_rejection_reason
SET @col := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tailors' AND COLUMN_NAME = 'dossier_rejection_reason');
SET @sql := IF(@col = 0,
  'ALTER TABLE tailors ADD COLUMN dossier_rejection_reason TEXT NULL AFTER dossier_status',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;


-- ── 2. TABLE projects — colonne contract_url ──────────────────────────────────

SET @col := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'contract_url');
SET @sql := IF(@col = 0,
  'ALTER TABLE projects ADD COLUMN contract_url TEXT NULL AFTER event_id',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;


-- ── 3. TABLE notifications (CREATE IF NOT EXISTS) ─────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id          VARCHAR(36)  NOT NULL,
  user_id     VARCHAR(36)  NOT NULL,
  type        VARCHAR(50)  NOT NULL,
  title       VARCHAR(255) NOT NULL,
  message     TEXT,
  is_read     TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── Vérification finale ───────────────────────────────────────────────────────
SELECT
  'tailors.siret'                   AS colonne, COUNT(*) AS present FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tailors'      AND COLUMN_NAME='siret'                   UNION ALL
SELECT 'tailors.kbis_url',                       COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tailors'      AND COLUMN_NAME='kbis_url'                UNION ALL
SELECT 'tailors.kbis_expiry_date',               COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tailors'      AND COLUMN_NAME='kbis_expiry_date'        UNION ALL
SELECT 'tailors.id_card_url',                    COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tailors'      AND COLUMN_NAME='id_card_url'             UNION ALL
SELECT 'tailors.rc_pro_url',                     COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tailors'      AND COLUMN_NAME='rc_pro_url'              UNION ALL
SELECT 'tailors.iban_rib',                       COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tailors'      AND COLUMN_NAME='iban_rib'                UNION ALL
SELECT 'tailors.dossier_status',                 COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tailors'      AND COLUMN_NAME='dossier_status'          UNION ALL
SELECT 'tailors.dossier_rejection_reason',       COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='tailors'      AND COLUMN_NAME='dossier_rejection_reason' UNION ALL
SELECT 'projects.contract_url',                  COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='projects'     AND COLUMN_NAME='contract_url'            UNION ALL
SELECT 'table notifications',                    COUNT(*) FROM INFORMATION_SCHEMA.TABLES  WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='notifications';
-- Toutes les lignes doivent afficher present = 1
