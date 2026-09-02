FROM docker.io/oven/bun:alpine

RUN apk update && apk add tini

ENTRYPOINT ["/sbin/tini", "--"]

RUN mkdir /app && chown -R bun:bun /app
WORKDIR /app
USER bun

COPY --chown=bun:bun . .

RUN bun install --production

EXPOSE 3000

CMD ["bun", "start"]
