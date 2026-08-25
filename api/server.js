const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "clickfast",
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS scores (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL,
      score INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

app.post("/scores", async (req, res) => {
  const { username, score } = req.body;

  if (
    typeof username !== "string" ||
    !username.trim() ||
    !Number.isInteger(score) ||
    score < 0
  ) {
    return res
      .status(400)
      .json({ error: "username et score (entier positif) requis" });
  }

  try {
    await pool.query(
      "INSERT INTO scores (username, score) VALUES ($1, $2)",
      [username.trim(), score]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "impossible d'enregistrer le score" });
  }
});

app.get("/scores", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT username, score, created_at FROM scores ORDER BY score DESC LIMIT 10"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "impossible de lire le classement" });
  }
});

const PORT = process.env.PORT || 4000;

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`API de scores sur le port ${PORT}`));
  })
  .catch((err) => {
    console.error("Impossible de se connecter à la base au démarrage", err);
    process.exit(1);
  });
