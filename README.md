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
