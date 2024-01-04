# Lichen Api

[a relative link](infra/README.md)

## Les variables d'environnement

Pour faire fonctionner le projet, il faut définir les variables d'environnement, en fonction de l'environnement il faut choisir le bon fichier d'env

`.env` : production
`.env.dev` : developpement
`.env.staging` : staging
`.env.test` : test

Les variables d'environnements :

- DATABASE_URL
- JWT_SECRET
- MAILJET_APIKEY_PUBLIC
- MAILJET_APIKEY_PRIVATE

## Faire une migration

**En local** :

- pour setup la db du serveur : `npm run migrate:update`
- pour celle des tests : `npm run migrate:test`

**En prod**:

- accédez au serveur
- entrez dans le container docker avec la commande `docker-compose run api bash`
- lancez la commande de migration : `npm run migrate:prod`

**Environement de recettage**

url api : api.test.staging
url app web : app.test.staging

- port
  - api : 9100
  - web : 8082
