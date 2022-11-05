FROM node:16-slim
RUN apt update
RUN apt install -y openssl 

WORKDIR /usr/lichen

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci
RUN npm run generate

COPY . .

EXPOSE 8080
CMD ["npm", "run", "start:prod"]