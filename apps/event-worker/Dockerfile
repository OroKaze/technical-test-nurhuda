FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/contracts/tsconfig.json packages/contracts/tsconfig.json
COPY packages/contracts/src packages/contracts/src
COPY apps/event-worker/package.json apps/event-worker/package.json
COPY apps/event-worker/tsconfig.json apps/event-worker/tsconfig.json
COPY apps/event-worker/src apps/event-worker/src
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @dexa/contracts build
RUN pnpm --filter @dexa/event-worker build
RUN pnpm --filter @dexa/event-worker deploy --legacy --prod /app/runtime
RUN cp -r apps/event-worker/dist /app/runtime/dist

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/runtime ./
USER app
CMD ["node", "dist/main.js"]
