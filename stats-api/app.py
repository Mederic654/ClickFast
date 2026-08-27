import os

from flask import Flask, jsonify
import psycopg2

TABLE = "scores"
COLUMN_USERNAME = "username"
COLUMN_SCORE = "score"

app = Flask(__name__)

REQUIRED_ENV_VARS = ["DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME"]
missing = [name for name in REQUIRED_ENV_VARS if not os.environ.get(name)]
if missing:
    raise RuntimeError(
        "Variables d'environnement manquantes : " + ", ".join(missing)
    )

DB_CONFIG = {
    "host": os.environ["DB_HOST"],
    "port": os.environ["DB_PORT"],
    "user": os.environ["DB_USER"],
    "password": os.environ["DB_PASSWORD"],
    "dbname": os.environ["DB_NAME"],
}


@app.route("/stats")
def stats():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
    except psycopg2.OperationalError:
        return jsonify({"error": "base de données injoignable"}), 503

    try:
        with conn.cursor() as cur:
            cur.execute(
                f"""
                SELECT
                    COUNT(*),
                    COUNT(DISTINCT {COLUMN_USERNAME}),
                    COALESCE(MAX({COLUMN_SCORE}), 0)
                FROM {TABLE}
                """
            )
            parties_jouees, joueurs_distincts, meilleur_score = cur.fetchone()

        return (
            jsonify(
                {
                    "meilleur_score": meilleur_score,
                    "parties_jouees": parties_jouees,
                    "joueurs_distincts": joueurs_distincts,
                }
            ),
            200,
        )
    except psycopg2.Error:
        return jsonify({"error": "impossible de lire les statistiques"}), 500
    finally:
        conn.close()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
