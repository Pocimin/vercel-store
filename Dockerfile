FROM node:24-bookworm-slim AS base

RUN apt-get update \
  && apt-get install -y --no-install-recommends lua5.4 ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN corepack enable

ARG VITE_API_URL
ARG VITE_TURNSTILE_SITE_KEY
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
COPY scripts ./scripts

RUN pnpm install --frozen-lockfile
RUN pnpm db:generate
RUN pnpm build

ENV NODE_ENV=production

CMD ["node", "apps/api/dist/server.js"]
