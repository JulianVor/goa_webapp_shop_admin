# --- Build stage ---------------------------------------------------------
# Node 22.15+ required - some transitive deps (e.g. @whatwg-node/promise-helpers) enforce
# it via "engines" and fail "yarn install" on Node 20.
FROM node:22-alpine AS build
WORKDIR /app

COPY . .
RUN corepack enable && yarn install --immutable
RUN yarn build

# --- Runtime stage ---------------------------------------------------------
# "medusa build" produces a self-contained deployable app under .medusa/server,
# with its own package.json - only that directory ships in the final image.
FROM node:22-alpine AS runtime
WORKDIR /app

COPY --from=build /app/.medusa/server .
RUN yarn install --production

EXPOSE 9000
CMD ["yarn", "start"]
