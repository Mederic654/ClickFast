// Valeurs bidons : suffisantes pour passer la vérification des variables
// d'environnement au chargement de server.js, jamais utilisées pour une
// vraie connexion (les tests ci-dessous ne touchent pas la base).
process.env.DB_HOST = "localhost";
process.env.DB_PORT = "5432";
process.env.DB_USER = "test";
process.env.DB_PASSWORD = "test";
process.env.DB_NAME = "test";

const request = require("supertest");
const app = require("./server");

describe("POST /scores - validation", () => {
  test("refuse un score sans username", async () => {
    const res = await request(app).post("/scores").send({ score: 10 });
    expect(res.status).toBe(400);
  });

  test("refuse un score négatif", async () => {
    const res = await request(app)
      .post("/scores")
      .send({ username: "test", score: -5 });
    expect(res.status).toBe(400);
  });

  test("refuse un score non entier", async () => {
    const res = await request(app)
      .post("/scores")
      .send({ username: "test", score: 4.5 });
    expect(res.status).toBe(400);
  });
});
