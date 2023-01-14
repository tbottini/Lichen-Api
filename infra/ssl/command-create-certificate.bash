docker-compose run --rm  certbot certonly --webroot --webroot-path /var/www/certbot/ -d api.reseau-lichen.fr -d app.reseau-lichen.fr -d api.test.reseau-lichen.fr -d app.test.reseau-lichen.fr


# on reçoit les certificats à /etc/letsencrypt/live/api.reseau-lichen.fr/fullchain.pem et /etc/letsencrypt/live/api.reseau-lichen.fr/privkey.pem