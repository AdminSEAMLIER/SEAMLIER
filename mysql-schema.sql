-- SEAMLIER MySQL Schema for o2switch deployment
-- Run this SQL on your o2switch phpMyAdmin to create all tables

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS `sessions` (
  `session_id` VARCHAR(128) NOT NULL,
  `expires` INT UNSIGNED NOT NULL,
  `data` MEDIUMTEXT,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `password` VARCHAR(255) DEFAULT NULL,
  `first_name` VARCHAR(100) DEFAULT NULL,
  `last_name` VARCHAR(100) DEFAULT NULL,
  `profile_image_url` MEDIUMTEXT DEFAULT NULL,
  `phone` TEXT DEFAULT NULL,
  `role` TEXT NOT NULL DEFAULT 'client',
  `location` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tailors` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `bio` TEXT DEFAULT NULL,
  `specialties` JSON DEFAULT NULL,
  `experience` INT DEFAULT NULL,
  `cover_image_url` TEXT DEFAULT NULL,
  `is_verified` BOOLEAN DEFAULT FALSE,
  `rating` FLOAT DEFAULT 0,
  `review_count` INT DEFAULT 0,
  `portfolio_count` INT DEFAULT 0,
  `subscription_plan` TEXT DEFAULT 'Starter',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `tailors_user_id_idx` (`user_id`),
  CONSTRAINT `tailors_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `portfolio_items` (
  `id` VARCHAR(36) NOT NULL,
  `tailor_id` VARCHAR(36) NOT NULL,
  `image_url` TEXT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `category` VARCHAR(100) DEFAULT NULL,
  `likes_count` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `portfolio_items_tailor_id_idx` (`tailor_id`),
  CONSTRAINT `portfolio_items_tailor_id_fk` FOREIGN KEY (`tailor_id`) REFERENCES `tailors` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `products` (
  `id` VARCHAR(36) NOT NULL,
  `tailor_id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `price` FLOAT NOT NULL,
  `image_url` TEXT NOT NULL,
  `category` VARCHAR(100) DEFAULT NULL,
  `in_stock` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `products_tailor_id_idx` (`tailor_id`),
  CONSTRAINT `products_tailor_id_fk` FOREIGN KEY (`tailor_id`) REFERENCES `tailors` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `reviews` (
  `id` VARCHAR(36) NOT NULL,
  `tailor_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `rating` INT NOT NULL,
  `comment` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `reviews_tailor_id_idx` (`tailor_id`),
  KEY `reviews_user_id_idx` (`user_id`),
  CONSTRAINT `reviews_tailor_id_fk` FOREIGN KEY (`tailor_id`) REFERENCES `tailors` (`id`),
  CONSTRAINT `reviews_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `conversations` (
  `id` VARCHAR(36) NOT NULL,
  `participant1_id` VARCHAR(36) NOT NULL,
  `participant2_id` VARCHAR(36) NOT NULL,
  `last_message_at` TIMESTAMP NULL DEFAULT NULL,
  `last_message_preview` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `conversations_p1_idx` (`participant1_id`),
  KEY `conversations_p2_idx` (`participant2_id`),
  CONSTRAINT `conversations_p1_fk` FOREIGN KEY (`participant1_id`) REFERENCES `users` (`id`),
  CONSTRAINT `conversations_p2_fk` FOREIGN KEY (`participant2_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `messages` (
  `id` VARCHAR(36) NOT NULL,
  `conversation_id` VARCHAR(36) NOT NULL,
  `sender_id` VARCHAR(36) NOT NULL,
  `content` TEXT NOT NULL,
  `sent_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `is_read` BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (`id`),
  KEY `messages_conversation_id_idx` (`conversation_id`),
  KEY `messages_sender_id_idx` (`sender_id`),
  CONSTRAINT `messages_conversation_id_fk` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`),
  CONSTRAINT `messages_sender_id_fk` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `measurements` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `neck` FLOAT DEFAULT NULL,
  `bust` FLOAT DEFAULT NULL,
  `waist` FLOAT DEFAULT NULL,
  `hips` FLOAT DEFAULT NULL,
  `shoulders` FLOAT DEFAULT NULL,
  `arm_length` FLOAT DEFAULT NULL,
  `back_length` FLOAT DEFAULT NULL,
  `inseam` FLOAT DEFAULT NULL,
  `height` FLOAT DEFAULT NULL,
  `weight` FLOAT DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `measurements_user_id_unique` (`user_id`),
  CONSTRAINT `measurements_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `projects` (
  `id` VARCHAR(36) NOT NULL,
  `tailor_id` VARCHAR(36) NOT NULL,
  `client_id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `progress` INT DEFAULT 0,
  `current_step` VARCHAR(50) DEFAULT 'prise_mesures',
  `amount` FLOAT DEFAULT NULL,
  `deadline` TIMESTAMP NULL DEFAULT NULL,
  `model_photo_url` TEXT DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `projects_tailor_id_idx` (`tailor_id`),
  KEY `projects_client_id_idx` (`client_id`),
  CONSTRAINT `projects_tailor_id_fk` FOREIGN KEY (`tailor_id`) REFERENCES `tailors` (`id`),
  CONSTRAINT `projects_client_id_fk` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `appointments` (
  `id` VARCHAR(36) NOT NULL,
  `tailor_id` VARCHAR(36) NOT NULL,
  `client_id` VARCHAR(36) NOT NULL,
  `project_id` VARCHAR(36) DEFAULT NULL,
  `type` VARCHAR(100) NOT NULL,
  `location` VARCHAR(255) DEFAULT NULL,
  `scheduled_at` TIMESTAMP NOT NULL,
  `duration` INT DEFAULT 60,
  `notes` TEXT DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'scheduled',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `appointments_tailor_id_idx` (`tailor_id`),
  KEY `appointments_client_id_idx` (`client_id`),
  KEY `appointments_project_id_idx` (`project_id`),
  CONSTRAINT `appointments_tailor_id_fk` FOREIGN KEY (`tailor_id`) REFERENCES `tailors` (`id`),
  CONSTRAINT `appointments_client_id_fk` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`),
  CONSTRAINT `appointments_project_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `admin_artisans` (
  `id` VARCHAR(36) NOT NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `specialty` VARCHAR(255) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'En attente',
  `city` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `birth_date` VARCHAR(20) DEFAULT NULL,
  `nationality` VARCHAR(100) DEFAULT NULL,
  `id_type` VARCHAR(50) DEFAULT NULL,
  `id_number` VARCHAR(100) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `siret` VARCHAR(50) DEFAULT NULL,
  `company_name` VARCHAR(255) DEFAULT NULL,
  `legal_form` VARCHAR(100) DEFAULT NULL,
  `tva_number` VARCHAR(50) DEFAULT NULL,
  `iban` VARCHAR(50) DEFAULT NULL,
  `years_experience` INT DEFAULT NULL,
  `bio` TEXT DEFAULT NULL,
  `join_date` VARCHAR(20) DEFAULT NULL,
  `subscription_plan` VARCHAR(50) DEFAULT 'Starter',
  `payment_status` VARCHAR(50) DEFAULT 'En attente',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_preferences` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `email_messages` BOOLEAN DEFAULT TRUE,
  `email_appointments` BOOLEAN DEFAULT TRUE,
  `email_promotions` BOOLEAN DEFAULT FALSE,
  `email_newsletter` BOOLEAN DEFAULT TRUE,
  `push_messages` BOOLEAN DEFAULT TRUE,
  `push_appointments` BOOLEAN DEFAULT TRUE,
  `push_promotions` BOOLEAN DEFAULT FALSE,
  `push_orders` BOOLEAN DEFAULT TRUE,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_preferences_user_id_unique` (`user_id`),
  CONSTRAINT `user_preferences_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `admin_settings` (
  `id` VARCHAR(36) NOT NULL,
  `key` VARCHAR(255) NOT NULL,
  `value` TEXT NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `admin_settings_key_unique` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert admin user (password: Artdecoudre2026!)
-- bcrypt hash generated for: Artdecoudre2026!
INSERT INTO `users` (`id`, `email`, `password`, `first_name`, `last_name`, `role`)
VALUES (
  'admin-001',
  'admin@seamlier.fr',
  '$2b$12$LJ3m4ys3uz0b3OIRF8FkruVTHkNQKzPbmSIj7bMsK7O9fPxt0gIXq',
  'Admin',
  'Seamlier',
  'admin'
) ON DUPLICATE KEY UPDATE `email` = `email`;
