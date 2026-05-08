-- ============================================================
-- Migration 002 — Events (commandes groupées) + fix colonnes
-- Idempotente : utilise IF NOT EXISTS / INFORMATION_SCHEMA
-- Compatible MySQL 5.7+ et 8.x
-- ============================================================

-- ── 1. TABLE events (CREATE IF NOT EXISTS) ───────────────────────────────────

CREATE TABLE IF NOT EXISTS events (
  id                      VARCHAR(36)    NOT NULL,
  name                    VARCHAR(255)   NOT NULL,
  event_date              DATE           NOT NULL,
  tailor_id               VARCHAR(36)    NOT NULL,
  organizer_id            VARCHAR(36)    NOT NULL,
  invite_code             VARCHAR(10)    NOT NULL,
  description             TEXT,
  validation_code         VARCHAR(10),
  registration_deadline   DATE,
  status                  VARCHAR(50)    NOT NULL DEFAULT 'pending_tailor_approval',
  max_participants        INT,
  price_per_person        FLOAT,
  price_group             FLOAT,
  delivery_date           DATE,
  inspiration_photos      JSON,
  created_at              TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_invite_code (invite_code),
  CONSTRAINT fk_event_tailor    FOREIGN KEY (tailor_id)    REFERENCES tailors(id) ON DELETE CASCADE,
  CONSTRAINT fk_event_organizer FOREIGN KEY (organizer_id) REFERENCES users(id)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 2. TABLE event_participants (CREATE IF NOT EXISTS) ───────────────────────

CREATE TABLE IF NOT EXISTS event_participants (
  id          VARCHAR(36)    NOT NULL,
  event_id    VARCHAR(36)    NOT NULL,
  user_id     VARCHAR(36)    NOT NULL,
  project_id  VARCHAR(36),
  joined_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_event_user (event_id, user_id),
  CONSTRAINT fk_ep_event   FOREIGN KEY (event_id)   REFERENCES events(id)   ON DELETE CASCADE,
  CONSTRAINT fk_ep_user    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_ep_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 3. TABLE projects — colonnes delivery_date et event_id ──────────────────

-- delivery_date
SET @col := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'delivery_date');
SET @sql := IF(@col = 0,
  'ALTER TABLE projects ADD COLUMN delivery_date DATE NULL',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- event_id
SET @col := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'event_id');
SET @sql := IF(@col = 0,
  'ALTER TABLE projects ADD COLUMN event_id VARCHAR(36) NULL',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ── 4. Vérification finale ────────────────────────────────────────────────────

SELECT
  'table events'                  AS objet, COUNT(*) AS present FROM INFORMATION_SCHEMA.TABLES  WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='events' UNION ALL
SELECT 'table event_participants', COUNT(*) FROM INFORMATION_SCHEMA.TABLES  WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='event_participants' UNION ALL
SELECT 'projects.delivery_date',   COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='projects' AND COLUMN_NAME='delivery_date' UNION ALL
SELECT 'projects.event_id',        COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='projects' AND COLUMN_NAME='event_id';
-- Toutes les lignes doivent afficher present = 1
