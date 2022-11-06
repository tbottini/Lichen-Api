# Pour mettre en production

script rapide mais sensible : _./infra/mep.bash_

### Les étapes :

1. rebuild l'image docker et le tagger comme étant une image aws

_buildx : pour builder sur la plateforme linux/amd64_

`docker buildx build --platform=linux/amd64 -t 938875074697.dkr.ecr.eu-west-3.amazonaws.com/lichen . `

2. (si ce n'est pas déjà fait) se connecter au DOCKER HOST AWS

`docker login -u AWS -p $(aws ecr get-login-password) 938875074697.dkr.ecr.eu-west-3.amazonaws.com/lichen`

3. publier l'image sur aws ecr

`docker push 938875074697.dkr.ecr.eu-west-3.amazonaws.com/lichen`

---

4. se connecter à l'ec2 d'aws

`mssh i-0036004d283e60d17`

5. pull l'image (latest) docker depuis l'ec2

`sudo docker pull 938875074697.dkr.ecr.eu-west-3.amazonaws.com/lichen:latest`

6. relancer docker compose

` docker compose up -d`

### Pour mettre à jour la db (le script ./infra/docker/run-migrate.bash)

`NODE_ENV=production docker compose run api npm run migrate:update`
