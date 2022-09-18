FROM node:16-slim
RUN apt update
RUN apt install -y openssl 

WORKDIR /usr/lichen

COPY package*.json ./
COPY prisma ./prisma/

RUN yarn

RUN npx prisma -v

RUN yarn generate

COPY . .

EXPOSE 8080
CMD ["yarn", "start:dev"]