# AWS

## problèmes

- si on peut pas relancer le docker-compose parce qu'un port est déjà pris

c'est docker qui s'est mal arrêter est qui est toujours owner du port
sudo service docker stop
sudo rm -f /var/lib/docker/network/files/local-kv.db
sudo service docker start

- si on ne retrouve plus le container
  docker-compose up --force-recreate
