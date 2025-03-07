FROM node:16-slim
RUN apt update
RUN apt install -y openssl 

WORKDIR /usr/lichen

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --production

COPY . .

EXPOSE 9000
CMD ["npm", "run", "start"]