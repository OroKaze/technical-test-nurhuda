FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/contracts/tsconfig.json packages/contracts/tsconfig.json
COPY packages/contracts/src packages/contracts/src
COPY apps/identity-service/package.json apps/identity-service/package.json
COPY apps/identity-service/tsconfig.json apps/identity-service/tsconfig.json
COPY apps/identity-service/src apps/identity-service/src
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @dexa/contracts build
RUN pnpm --filter @dexa/identity-service build
RUN pnpm --filter @dexa/identity-service deploy --legacy --prod /app/runtime
RUN cp -r apps/identity-service/dist /app/runtime/dist

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/runtime ./
USER app
CMD ["node", "dist/main.js"]
