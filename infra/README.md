

# Infra


## Production
pour faire tourner lichen en production 

il faut lancer le docker-compose
- on utilise greenlock pour gérer les certificats ssl via un challenge http et non dns


## Test

### En local 

en local pour faire tourner les tests il faut lancer un container postgresql avec le script

`./infra/docker/create-postgres-container.bash`

si la db n'est pas initialisé on peut faire lancer un script de migration avec npm, ce n'est pas lancé avec docker compose du coup c'est sur le network local et il n'y a pas de commande supplémentaire à lancé

`npm run migrate:update`

pour lancer les tests

`npm run test`

### Pour la ci

- todo : faire les automatiquement sur les branche : pour chaque push
- il faut lancer un docker compose :
    - il lance la migration
    - il lance les tests
    - il ferme le docker-compose 