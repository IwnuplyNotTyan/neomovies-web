# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json ./
COPY apps ./apps
COPY packages ./packages
RUN pnpm install --frozen-lockfile

FROM deps AS build
ARG APP_NAME=web-desktop
RUN test -n "$APP_NAME"
RUN pnpm --filter ${APP_NAME} build

FROM nginx:1.27-alpine AS runtime
ARG APP_NAME=web-desktop
COPY --from=build /app/apps/${APP_NAME}/dist /usr/share/nginx/html
RUN cat > /etc/nginx/conf.d/default.conf <<'NGINX'
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
NGINX
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
