if (!process.env.MYSQL_DATABASE_URL) {
  throw new Error("MYSQL_DATABASE_URL manquant — configurez la variable d'environnement.");
}

export default {
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.MYSQL_DATABASE_URL,
  },
};
