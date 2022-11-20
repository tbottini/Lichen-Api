

# Situation Actuelle

on utilise un ALB et un NLB
le NLB permet d'avoir une adresse fixe

on utilise ACM pour générer des certificats tls/ssl

ACM est connecté à ALB pour fournir un certificat pour chaque requête https

- OVH gère le nom de domaine, et redirige api.reseau-lichen.fr app.reseau-lichen.fr vers l'adresse ip static du NLB

## Axes d'améliorations

Est ce qu'on peut transitionner vers un système uniquement NLB ?

### Uniquement ALB 

- on peut avoir un load balancer uniquement applicatif, alb fonctionne avec un nom DNS qui font référence à son ip actuelle
( ? pourquoi on peut pas avoir une adresse statique sur l'ALB ? )
    - on utilise OVH pour gérer le nom de domaine
        - est ce qu'on peut rediriger un nom de domaine vers un alias DNS AWS ? (NX ?)
        - faire un déplacmeent du nom de domaine sur le service Route53


# Sauvegarde Manip (revenir à l'état actuel)

ACM :
- créé un certificat pour les deux noms de domaines

- t1 : target sur les instances ec2
    - en http 80/443
- créer un alb qui pointe en https:443 sur la target (t1)
    - rajouter le certificat
    - rajouter un pointeur sur 80 qui pointe sur la target (sinon le http ne fonctionnera pas)
- t2 : target qui pointe sur l'alb en tcp:443/80
- créer un nlb qui pointe sur la target alb t2 en tcp:443/80
- créer deux elasticIP
    - assigner les deux pour europe3 b et c du NLB
- côté OVH
    - mettre la zone DNS A sur l'adresse ip de la zone C pour les deux nom de domaines

- côté applicatif
    - faire un nginx qui faire du reverse proxy sur le serveur web et api
    - dans un docker-compose on peut faire du reverse proxy en mettant l'hostname sur le nom du container (le nom est définit dans le docker-compose)
    - ce qui écoute le http renvoie sur le https
    - on rajoute un serveur par defaut (les deux autres serveur ne doivent donc pas être par defaut.., on doit spécifier leurs server_name à chaque fois)
        - dans ce serveur par defaut on ajoute un endpoint /health qui retourne 200 
            - ça servira pour le health check des targets
