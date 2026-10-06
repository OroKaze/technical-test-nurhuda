FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/web/tsconfig.json apps/web/tsconfig.json
COPY apps/web/vite.config.ts apps/web/vite.config.ts
COPY apps/web/index.html apps/web/index.html
COPY apps/web/src apps/web/src
RUN pnpm install --frozen-lockfile
ARG VITE_APP_MODE=employee
ARG VITE_API_BASE_URL=http://localhost:3000
ENV VITE_APP_MODE=$VITE_APP_MODE
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN pnpm --filter @dexa/web build

FROM nginx:1.27-alpine
COPY apps/web/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
