FROM node:lts-alpine

RUN apk update && apk add tini

ENTRYPOINT ["/sbin/tini", "--"]

RUN mkdir /app && chown -R node:node /app
WORKDIR /app
USER node

COPY --chown=node:node . .

RUN npm ci --omit=dev

EXPOSE 3000

CMD ["node", "index.js"]
