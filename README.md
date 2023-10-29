# Lichen-Api

## Faire une migration

**en local** :

- lancer la commande : `npm run migrate:update`
- et la commande : `npm run migrate:test` pour la db de test

**en prod**:

- accéder au serveur
- entrez dans le container docker avec la commande `docker-compose run api bash`
- lancer la commande de migration : `npm run migrate:prod`

## Attention

- pour passer un array de string en query on utilise pas `query[]` plusieurs fois mais on utilise `query` une seule fois et les différentes valeurs sont séparés par une ','

## staging

url : api.test.staging
app.test.staging

- port
  - api : 9100
  - web : 8082
