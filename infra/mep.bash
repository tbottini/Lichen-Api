set -x

docker buildx build --platform=linux/amd64 -t 938875074697.dkr.ecr.eu-west-3.amazonaws.com/lichen .

docker login --username AWS --password $(aws ecr get-login-password) 938875074697.dkr.ecr.eu-west-3.amazonaws.com/lichen

docker push 938875074697.dkr.ecr.eu-west-3.amazonaws.com/lichen

mssh i-0036004d283e60d17 << 'ENDSSH'
echo $HOME

set -x

docker login --username AWS --password $(aws ecr get-login-password) 938875074697.dkr.ecr.eu-west-3.amazonaws.com/lichen

docker pull 938875074697.dkr.ecr.eu-west-3.amazonaws.com/lichen:latest

docker-compose up -d

ENDSSH
