FROM node:alpine

WORKDIR /usr/lichen

COPY . .
RUN ls

RUN ls

RUN yarn

COPY srcs srcs

RUN ls

CMD ["yarn", "start:dev"]