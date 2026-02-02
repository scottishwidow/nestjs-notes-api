FROM node:24-alpine AS builder

WORKDIR /app 

COPY package.json pnpm-lock.yaml ./

RUN corepack enable && pnpm install --frozen-lockfile

COPY tsconfig.build.json tsconfig.json ./ 
COPY src ./src 

RUN pnpm run build && pnpm prune -prod 

FROM node:24-alpine AS runner

WORKDIR /app 

COPY --from=builder /app/node_modules ./node_modules 
COPY --from=builder /app/dist ./dist 

CMD ["node", "dist/main.js"]
