FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api-gateway/package.json apps/api-gateway/package.json
COPY apps/api-gateway/tsconfig.json apps/api-gateway/tsconfig.json
COPY apps/api-gateway/src apps/api-gateway/src
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @dexa/api-gateway build
RUN pnpm --filter @dexa/api-gateway deploy --legacy --prod /app/runtime
RUN cp -r apps/api-gateway/dist /app/runtime/dist

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/runtime ./
USER app
CMD ["node", "dist/main.js"]
