import { sql } from "drizzle-orm";
import { db } from "./db";

export async function ensureTables() {
  const queries = [
    `CREATE TABLE IF NOT EXISTS sessions (
      session_id VARCHAR(128) PRIMARY KEY,
      expires INT NOT NULL,
      data TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS users (
      id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      email VARCHAR(255) UNIQUE,
      password VARCHAR(255),
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      profile_image_url VARCHAR(500),
      phone VARCHAR(50),
      role VARCHAR(20) NOT NULL DEFAULT 'client',
      location VARCHAR(255),
      created_at DATETIME DEFAULT NOW(),
      updated_at DATETIME DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS tailors (
      id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      user_id CHAR(36) NOT NULL,
      bio TEXT,
      specialties JSON,
      experience INT,
      cover_image_url TEXT,
      is_verified BOOLEAN DEFAULT FALSE,
      rating FLOAT DEFAULT 0,
      review_count INT DEFAULT 0,
      portfolio_count INT DEFAULT 0,
      subscription_plan VARCHAR(50) DEFAULT 'Starter',
      created_at DATETIME DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS portfolio_items (
      id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      tailor_id CHAR(36) NOT NULL,
      image_url TEXT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100),
      likes_count INT DEFAULT 0,
      created_at DATETIME DEFAULT NOW(),
      FOREIGN KEY (tailor_id) REFERENCES tailors(id)
    )`,
    `CREATE TABLE IF NOT EXISTS products (
      id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      tailor_id CHAR(36) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      price FLOAT NOT NULL,
      image_url TEXT NOT NULL,
      category VARCHAR(100),
      in_stock BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT NOW(),
      FOREIGN KEY (tailor_id) REFERENCES tailors(id)
    )`,
    `CREATE TABLE IF NOT EXISTS reviews (
      id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      tailor_id CHAR(36) NOT NULL,
      user_id CHAR(36) NOT NULL,
      rating INT NOT NULL,
      comment TEXT,
      created_at DATETIME DEFAULT NOW(),
      FOREIGN KEY (tailor_id) REFERENCES tailors(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS conversations (
      id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      participant1_id CHAR(36) NOT NULL,
      participant2_id CHAR(36) NOT NULL,
      last_message_at DATETIME,
      last_message_preview TEXT,
      created_at DATETIME DEFAULT NOW(),
      FOREIGN KEY (participant1_id) REFERENCES users(id),
      FOREIGN KEY (participant2_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS messages (
      id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      conversation_id CHAR(36) NOT NULL,
      sender_id CHAR(36) NOT NULL,
      content TEXT NOT NULL,
      sent_at DATETIME DEFAULT NOW(),
      is_read BOOLEAN DEFAULT FALSE,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id),
      FOREIGN KEY (sender_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS measurements (
      id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      user_id CHAR(36) NOT NULL UNIQUE,
      neck FLOAT,
      bust FLOAT,
      waist FLOAT,
      hips FLOAT,
      shoulders FLOAT,
      arm_length FLOAT,
      back_length FLOAT,
      inseam FLOAT,
      height FLOAT,
      weight FLOAT,
      updated_at DATETIME DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS projects (
      id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      tailor_id CHAR(36) NOT NULL,
      client_id CHAR(36) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      progress INT DEFAULT 0,
      current_step VARCHAR(50) DEFAULT 'prise_mesures',
      amount FLOAT,
      deadline DATETIME,
      model_photo_url TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT NOW(),
      updated_at DATETIME DEFAULT NOW(),
      FOREIGN KEY (tailor_id) REFERENCES tailors(id),
      FOREIGN KEY (client_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS appointments (
      id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      tailor_id CHAR(36) NOT NULL,
      client_id CHAR(36) NOT NULL,
      project_id CHAR(36),
      type VARCHAR(100) NOT NULL,
      location VARCHAR(255),
      scheduled_at DATETIME NOT NULL,
      duration INT DEFAULT 60,
      notes TEXT,
      status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
      created_at DATETIME DEFAULT NOW(),
      FOREIGN KEY (tailor_id) REFERENCES tailors(id),
      FOREIGN KEY (client_id) REFERENCES users(id),
      FOREIGN KEY (project_id) REFERENCES projects(id)
    )`,
    `CREATE TABLE IF NOT EXISTS admin_artisans (
      id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      specialty VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'En attente',
      city VARCHAR(100) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      birth_date VARCHAR(20),
      nationality VARCHAR(100),
      id_type VARCHAR(50),
      id_number VARCHAR(100),
      address TEXT,
      siret VARCHAR(50),
      company_name VARCHAR(255),
      legal_form VARCHAR(100),
      tva_number VARCHAR(50),
      iban VARCHAR(50),
      years_experience INT,
      bio TEXT,
      join_date VARCHAR(20),
      subscription_plan VARCHAR(50) DEFAULT 'Starter',
      payment_status VARCHAR(50) DEFAULT 'En attente',
      created_at DATETIME DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS user_preferences (
      id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      user_id CHAR(36) NOT NULL UNIQUE,
      email_messages BOOLEAN DEFAULT TRUE,
      email_appointments BOOLEAN DEFAULT TRUE,
      email_promotions BOOLEAN DEFAULT FALSE,
      email_newsletter BOOLEAN DEFAULT TRUE,
      push_messages BOOLEAN DEFAULT TRUE,
      push_appointments BOOLEAN DEFAULT TRUE,
      push_promotions BOOLEAN DEFAULT FALSE,
      push_orders BOOLEAN DEFAULT TRUE,
      updated_at DATETIME DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS admin_settings (
      id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      \`key\` VARCHAR(255) NOT NULL UNIQUE,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT NOW()
    )`,
  ];

  for (const query of queries) {
    const tableName = query.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
    try {
      await db.execute(sql.raw(query));
      console.log(`  ✓ Table ${tableName} ready`);
    } catch (err: any) {
      console.error(`  ✗ Table ${tableName}: ${err.message}`);
    }
  }
}
