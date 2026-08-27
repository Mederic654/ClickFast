Journal de bord :

2-

Comparaison entre avant la selection de l'image ngix et après (FROM nginx, COPY . ., sans dockerignore ciblé) et la version finale (image épinglée, fichiers copiés un par un, utilisateur non-root) :

- Taille : 63,4 Mo -> 27 Mo
- Build à froid : 4,7 s -> 4,2 s
- Build à chaud (cache) : 0,6 s dans les deux cas
- Contexte transféré au build : 49,77 kB  -> quelques centaines d'octets

Vérification de la racine servie (docker run --rm  ls -a /usr/share/nginx/html) : sur la première image on retrouve .git, .dockerignore, et même les Dockerfile eux-mêmes en plus des fichiers du jeu. Sur l'image finale seuls index.html, style.css et script.js apparaissent.

Accroc rencontré : un simple USER nginx en fin de Dockerfile faisait planter le conteneur au démarrage avec :

open() "/run/nginx.pid" failed (13: Permission denied)

Cause : les dossiers où nginx écrit au démarrage (cache, fichier pid) appartiennent à root sur l'image officielle. Complication supplémentaire : /var/run est un lien symbolique vers /run sous Alpine, et un chown -R sur /var/run ne suit pas ce lien - il fallait chown /run directement pour que ça marche. Deuxième blocage indépendant : se binder sur le port 80 demande normalement les droits root ; réglé avec setcap cap_net_bind_service=+ep sur le binaire nginx, qui donne ce droit précis sans lancer le process en root.

3-

API Express (2 routes : POST /scores, GET /scores) + Postgres, lancés à la main avec docker run, options une par une, sans network custom (bridge par défaut).

Commandes utilisées :

```
docker volume create clickfast-db-data
docker run -d --name clickfast-db -e POSTGRES_USER=clickfast -e POSTGRES_PASSWORD=clickfast -e POSTGRES_DB=clickfast -p 5432:5432 -v clickfast-db-data:/var/lib/postgresql/data postgres:16-alpine
docker network inspect bridge
docker build -t clickfast-scores-api ./api
docker run -d --name clickfast-scores-api -p 4000:4000 -e DB_HOST=<IP interne> -e DB_PORT=5432 -e DB_USER=clickfast -e DB_PASSWORD=clickfast -e DB_NAME=clickfast clickfast-scores-api
```

Sans network custom, l'API ne joint Postgres que par son IP interne (trouvée via docker network inspect bridge), pas par son nom, ça représente une étape manuelle en plus à chaque lancement.

Dockerfile de l'API : en une seule étape, pas multi-stage.

Premier essai raté : npm ci --omit=dev échouait avec "The npm ci command can only install with an existing package-lock.json". Cause : le package-lock.json n'existait pas encore. Corrigé avec npm install --package-lock-only pour le générer sans installer node_modules en local.

Problème rencontré en testant la persistance des données (docker rm + docker run tout neuf sur le même volume, pour vérifier que les scores survivent) : le nouveau conteneur Postgres a reçu une IP interne différente sur le bridge par défaut. L'API, lancée avec l'ancienne IP en variable d'environnement, ne trouvait plus la base (ECONNREFUSED). Il a fallu faire docker network inspect bridge de nouveau pour récupérer la nouvelle IP et relancer l'API.

4-

Création d'un network custom, pour que l'API et la base se joignent par leur nom plutôt que par une IP qui change à chaque recréation

```
docker network create clickfast-network
docker run -d --name clickfast-db --network clickfast-network -e POSTGRES_USER=clickfast -e POSTGRES_PASSWORD=clickfast -e POSTGRES_DB=clickfast -v clickfast-db-data:/var/lib/postgresql/data postgres:16-alpine
docker run -d --name clickfast-scores-api --network clickfast-network -p 4000:4000 -e DB_HOST=clickfast-db -e DB_PORT=5432 -e DB_USER=clickfast -e DB_PASSWORD=clickfast -e DB_NAME=clickfast clickfast-scores-api
```

L'API se connecte désormais avec DB_HOST=clickfast-db (le nom du conteneur)

5-

Suppression des valeurs par défaut sur les identifiants de connexion dans server.js (host/user/password ne retombent plus sur localhost/postgres si une variable manque). Ajout d'une vérification au démarrage : si DB_HOST, DB_PORT, DB_USER, DB_PASSWORD ou DB_NAME manque, l'API affiche la liste des variables manquantes et s'arrête.

Ajout d'un .gitignore (node_modules/, .env), d'un api/.env.

6-

Écriture d'un docker-compose.yml qui regroupe les 4 services (game, scores-api, db, adminer) sur le network et le volume clickfast-db-data déjà créés.  plus aucune valeur en dur dans le fichier compose.

Problème lors du premier lancement (docker compose up -d --build) :

7- 

Service stats-api (Python/Flask), route /stats sur la table scores existante, mêmes variables d'env que l'étape 5. 

8- 

3 images taguées 1.0.0 et poussées sur Docker Hub (jamais latest). docker-compose.prod.yml créé (image: au lieu de build:, plus de external). Testé dans un dossier vide avec juste ce fichier + .env : stack complète up, jeu jouable, sans code source.

9- 

Tableau mesures des 3 images :

| Image      | Taille  | Couche max | Froid | Chaud | 1re réponse |
| ---------- | ------- | ---------- | ----- | ----- | ------------ |
| clickfast  | 95,8 Mo | 52,3 Mo    | 2,4 s | 1,0 s | 7,1 s        |
| scores-api | 238 Mo  | 155 Mo     | 3,5 s | 1,1 s | 7,2 s        |
| stats-api  | 208 Mo  | 87,5 Mo    | 4,2 s | 0,9 s | 7,3 s        |

palier 1

phase 1 - lint puis test : ajout d'ESLint (config générée avec eslint --init, option "syntax and problems"), script npm run lint dans package.json. Workflow séparé en deux jobs, lint et test, avec needs: lint sur le job test pour que test attende que lint ait réussi.

Phase 2 - publier une image taguée au sha : job build-and-push ajouté, dépend de test, condition if: sur github.ref == 'refs/heads/main' && github.event_name == 'push' pour ne jamais publier depuis une pull request. Authentification via docker/login-action avec deux secrets du repo (DOCKERHUB_USERNAME, DOCKERHUB_TOKEN), publication via docker/build-push-action, tag = ${{ github.sha }}.

Phase 3 - mesurer avant d'optimiser : cache: 'npm' était déjà présent sur actions/setup-node depuis la phase 2, donc pas de vraie mesure "avant" disponible. Retiré temporairement, mesuré, remis.

|              | Run total | Job test                                         | Taille image |
| ------------ | --------- | ------------------------------------------------ | ------------ |
| Avant cache  | 62s       | 67s                                              | 25,7 Mo      |
| Après cache | 53s       | ~20s (le plus long des 3 versions en parallèle) | 25,7 Mo      |
