FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/contracts/tsconfig.json packages/contracts/tsconfig.json
COPY packages/contracts/src packages/contracts/src
COPY apps/employee-service/package.json apps/employee-service/package.json
COPY apps/employee-service/tsconfig.json apps/employee-service/tsconfig.json
COPY apps/employee-service/src apps/employee-service/src
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @dexa/contracts build
RUN pnpm --filter @dexa/employee-service build
RUN pnpm --filter @dexa/employee-service deploy --legacy --prod /app/runtime
RUN cp -r apps/employee-service/dist /app/runtime/dist

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/runtime ./
RUN mkdir -p /app/uploads && chown -R app:app /app/uploads
USER app
CMD ["node", "dist/main.js"]
