FROM denoland/deno:debian

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY deno.json deno.lock ./
COPY server.ts ./
COPY public ./public

RUN deno install --allow-scripts=npm:node-datachannel \
  && deno cache server.ts \
  && mkdir -p /app/.torrent-cache

ENV PORT=8080
ENV HOST=0.0.0.0

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8080/ >/dev/null || exit 1

CMD ["run", "-A", "server.ts"]
