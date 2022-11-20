
docker buildx build --platform=linux/amd64 -t 938875074697.dkr.ecr.eu-west-3.amazonaws.com/lichen-reverse-proxy .

docker login --username AWS --password $(aws ecr get-login-password) 938875074697.dkr.ecr.eu-west-3.amazonaws.com/lichen-reverse-proxy

docker push 938875074697.dkr.ecr.eu-west-3.amazonaws.com/lichen-reverse-proxy

mssh i-0036004d283e60d17 << 'ENDSSH'

docker login --username AWS --password $(aws ecr get-login-password) 938875074697.dkr.ecr.eu-west-3.amazonaws.com/lichen-reverse-proxy

docker-compose up -d

ENDSSH
