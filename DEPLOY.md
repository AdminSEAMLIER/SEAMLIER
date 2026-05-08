# DEPLOY.md — Déploiement SEAMLiER sur o2switch

## Variables à personnaliser

```bash
SSH_USER="ton_identifiant_cpanel"          # ex: seaml1234
SSH_HOST="sXXXXXX.o2switch.net"            # ex: s789012.o2switch.net
APP_DIR="~/www/seamlier"                   # répertoire de l'app dans cPanel NodeJS Selector
```

---

## Déploiement standard (à faire à chaque mise à jour)

```bash
# 1. Se connecter au serveur
ssh $SSH_USER@$SSH_HOST

# 2. Aller dans le répertoire de l'application
cd $APP_DIR

# 3. Récupérer les derniers changements
git pull origin main

# 4. Installer les dépendances si package.json a changé
npm install --omit=dev

# 5. Builder le projet (frontend Vite + serveur esbuild)
npm run build

# 6. Redémarrer Passenger
touch tmp/restart.txt
```

> **Vérification** : attendre ~10 secondes puis ouvrir le site. Si besoin, vider le cache navigateur.

---

## Première installation sur le serveur

### 1. Cloner le dépôt

```bash
cd ~
git clone https://github.com/TON_USER/seamlier.git www/seamlier
cd www/seamlier
```

### 2. Créer le fichier .env

```bash
cp .env.example .env
nano .env
```

Renseigner toutes les variables (voir section Variables d'environnement ci-dessous).

### 3. Créer le dossier tmp (requis par Passenger)

```bash
mkdir -p tmp
```

### 4. Installer les dépendances et builder

```bash
npm install --omit=dev
npm run build
```

### 5. Configurer Passenger dans cPanel

Dans cPanel → **NodeJS Selector** → **Create Application** :

| Champ | Valeur |
|---|---|
| Node.js version | 18.x ou 20.x |
| Application mode | Production |
| Application root | `www/seamlier` |
| Application URL | `/` (ou sous-domaine) |
| Application startup file | `dist/index.cjs` |

Cliquer **Create** puis **Run NPM Install**.

### 6. Premier démarrage

```bash
touch tmp/restart.txt
```

---

## Variables d'environnement (.env)

```env
NODE_ENV=production
PORT=5000

MYSQL_DATABASE_URL=mysql://user:password@localhost:3306/seamlier_db

SESSION_SECRET=une_chaine_aleatoire_longue_et_secrete

# Email (Nodemailer)
SMTP_HOST=smtp.o2switch.net
SMTP_PORT=587
SMTP_USER=contact@seamlier.fr
SMTP_PASS=mot_de_passe_email

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLIC_KEY=pk_live_...
```

---

## Structure du build

```
dist/
├── index.cjs        ← serveur Express (point d'entrée Passenger)
└── public/          ← frontend React (servi par Express via express.static)
    ├── index.html
    ├── assets/
    └── ...
```

---

## Commandes utiles en SSH

```bash
# Voir les logs Passenger / erreurs serveur
tail -f ~/logs/seamlier.log
# ou selon la config cPanel :
tail -f ~/logs/seamlier_nodejs.log

# Redémarrer manuellement l'application
touch $APP_DIR/tmp/restart.txt

# Vérifier que Node.js est actif
ps aux | grep node

# Vérifier l'espace disque
df -h ~

# Voir la version Node utilisée
node --version
```

---

## Rollback rapide

```bash
ssh $SSH_USER@$SSH_HOST
cd $APP_DIR

# Revenir au commit précédent
git log --oneline -5          # identifier le commit cible
git checkout COMMIT_HASH      # ou : git reset --hard HEAD~1

npm run build
touch tmp/restart.txt
```

---

## Checklist avant chaque déploiement

- [ ] `npm run check` passe sans erreur TypeScript en local
- [ ] `npm run build` réussit en local
- [ ] Les variables `.env` sensibles ne sont pas committées
- [ ] Le webhook Stripe pointe vers la bonne URL de production
- [ ] `SESSION_SECRET` est une valeur aléatoire forte (≥ 32 chars)
