# AWS

## Se connecter a aws

MFA CODE : le code multifacteur
pour se connecter à aws c'est via une authentification à deux facteurs

- il faut récupérer le code pour l'administrateurs avant de pouvoir se connecter à aws

`sudo aws sts get-session-token --serial-number arn:aws:iam::938875074697:mfa/Administrator --token-code <MFA CODE>`

!!! important !!!
Les droit de connexion en ssh sur le serveur n'est donné que par ip, il faut ajouter votre ip au groupe de sécurité pour le ssh entrant

- il faudra peut être envoyé la clé rsa a aws

` aws ec2-instance-connect send-ssh-public-key --instance-id i-0036004d283e60d17 --region eu-west-3 --instance-os-user ec2-user --ssh-public-key file://$HOME/.ssh/id_rsa.pub`
