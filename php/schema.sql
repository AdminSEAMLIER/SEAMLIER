-- SEAMLIER - Schéma MySQL pour o2switch
-- À exécuter dans phpMyAdmin

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) DEFAULT '',
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) DEFAULT '',
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'client',
    location VARCHAR(255) DEFAULT NULL,
    profile_image_url VARCHAR(500) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tailors (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64),
    specialty VARCHAR(255) DEFAULT '',
    bio TEXT DEFAULT NULL,
    years_experience INT DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    verified TINYINT(1) DEFAULT 0,
    location VARCHAR(255) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS artisans (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) DEFAULT NULL,
    first_name VARCHAR(100) DEFAULT '',
    last_name VARCHAR(100) DEFAULT '',
    email VARCHAR(255) DEFAULT '',
    phone VARCHAR(20) DEFAULT '',
    specialty VARCHAR(255) DEFAULT '',
    city VARCHAR(100) DEFAULT '',
    status VARCHAR(20) DEFAULT 'En attente',
    siret VARCHAR(30) DEFAULT '',
    company_name VARCHAR(255) DEFAULT '',
    legal_form VARCHAR(100) DEFAULT '',
    birth_date VARCHAR(20) DEFAULT '',
    nationality VARCHAR(100) DEFAULT '',
    id_type VARCHAR(50) DEFAULT '',
    id_number VARCHAR(100) DEFAULT '',
    address TEXT DEFAULT NULL,
    tva_number VARCHAR(50) DEFAULT '',
    iban VARCHAR(50) DEFAULT '',
    years_experience INT DEFAULT 0,
    bio TEXT DEFAULT NULL,
    subscription_plan VARCHAR(20) DEFAULT 'Starter',
    payment_status VARCHAR(20) DEFAULT 'En attente',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS portfolio_items (
    id VARCHAR(64) PRIMARY KEY,
    tailor_id VARCHAR(64),
    title VARCHAR(255) DEFAULT '',
    description TEXT DEFAULT NULL,
    image_url VARCHAR(500) DEFAULT '',
    category VARCHAR(100) DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tailor_id) REFERENCES tailors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(64) PRIMARY KEY,
    tailor_id VARCHAR(64),
    title VARCHAR(255) DEFAULT '',
    description TEXT DEFAULT NULL,
    price DECIMAL(10,2) DEFAULT 0,
    image_url VARCHAR(500) DEFAULT '',
    category VARCHAR(100) DEFAULT '',
    in_stock TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tailor_id) REFERENCES tailors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(64) PRIMARY KEY,
    tailor_id VARCHAR(64),
    user_id VARCHAR(64),
    rating INT DEFAULT 5,
    comment TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tailor_id) REFERENCES tailors(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS conversations (
    id VARCHAR(64) PRIMARY KEY,
    user1_id VARCHAR(64),
    user2_id VARCHAR(64),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(64) PRIMARY KEY,
    conversation_id VARCHAR(64),
    sender_id VARCHAR(64),
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS measurements (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64),
    data JSON DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Valeurs par défaut des paramètres
INSERT IGNORE INTO settings (setting_key, setting_value) VALUES
    ('commission', '10'),
    ('minOrderAmount', '30'),
    ('subscriptionPrice', '29'),
    ('trialDays', '30'),
    ('platformName', 'SEAMLIER'),
    ('currency', 'EUR'),
    ('language', 'fr');
