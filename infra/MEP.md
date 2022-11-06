# Pour mettre en production

script rapide mais sensible : _./infra/mep.bash_

les étapes pour mettre en production :

- rebuild l'image docker et le tagger comme étant une image aws

`docker buildx build --platform=linux/amd64 -t 938875074697.dkr.ecr.eu-west-3.amazonaws.com/lichen . `

// buildx pour builder sur la plateforme linux/amd64

- (si ce n'est pas déjà fait) se connecter au DOCKER HOST AWS

`docker login -u AWS -p $(aws ecr get-login-password) 938875074697.dkr.ecr.eu-west-3.amazonaws.com/lichen`

- publier l'image sur aws ecr

`docker push 938875074697.dkr.ecr.eu-west-3.amazonaws.com/lichen`

- se connecter à l'ec2 d'aws

`mssh i-0036004d283e60d17`

- pull l'image (latest) docker depuis l'ec2

`sudo docker pull 938875074697.dkr.ecr.eu-west-3.amazonaws.com/lichen:latest`

- relancer docker compose

` docker compose up -d`

## Pour mettre à jour la db (le script ./infra/docker/run-migrate.bash)

`NODE_ENV=prod docker compose run api npm run migrate:update`
