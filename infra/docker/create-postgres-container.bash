# docker build . --tag lichen_api

POSTGRESQL_LOCAL_PATH='/Users/thomas/data'
docker run --name postgresql \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=psql \
    -p 5432:5432 \
    -v $POSTGRESQL_LOCAL_PATH:/var/lib/postgresql/data \
    -d postgres:14-alpine
