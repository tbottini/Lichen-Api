# Infra

_Gestion des certificats_ : on utilise greenlock pour gérer les certificats ssl via un challenge http et non dns

## Production

pour faire tourner lichen en production : [./AWS.md]

## Test

### En local

- Via docker-compose de dev

`docker-compose -f ./docker-compose.dev.yaml -d --build`


- Via les dockerfiles

en local pour faire tourner les tests il faut lancer un container postgresql avec le script

`./infra/docker/create-postgres-container.bash`

si la db n'est pas initialisé on peut faire lancer un script de migration avec npm, ce n'est pas lancé avec docker compose du coup c'est sur le network local et il n'y a pas de commande supplémentaire à lancé

`npm run migrate:test`

pour lancer les tests

`npm run test`

### Pour la ci

- todo : faire les tests automatiquement sur les branche : pour chaque push
- il faut lancer un docker compose :
  - il lance la migration
  - il lance les tests
  - il ferme le docker-compose
