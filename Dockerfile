FROM node:lts-alpine

RUN apk update

RUN apk add tini

ENTRYPOINT ["/sbin/tini", "--"]

RUN apk add openjdk11
RUN apk add python3
RUN apk add ffmpeg

RUN apk update

RUN mkdir /app && chown -R node:node /app

WORKDIR /app

USER node

COPY --chown=node:node package*.json ./

RUN npm ci --omit=dev

RUN npm cache clean --force

COPY --chown=node:node . .

EXPOSE 3000

CMD ["node", "index.js"]
