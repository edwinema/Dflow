ARG NODE_IMAGE=node:22-bookworm-slim
FROM ${NODE_IMAGE} AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM build AS tooling
COPY scripts ./scripts
COPY migrations ./migrations
COPY docs ./docs
COPY test ./test
CMD ["npm", "test"]

FROM build AS production-deps
RUN npm prune --omit=dev

FROM ${NODE_IMAGE}
ENV NODE_ENV=production PORT=3001
WORKDIR /app
COPY --from=production-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node docs ./docs
COPY --chown=node:node migrations ./migrations
USER node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:3001/health/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/main.js"]
