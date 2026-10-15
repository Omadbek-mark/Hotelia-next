# syntax=docker/dockerfile:1
FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=false --non-interactive
COPY . .

# These public URLs are embedded in the browser bundle at build time.
ARG REACT_APP_API_URL
ARG REACT_APP_API_GRAPHQL_URL
ARG REACT_APP_API_WS
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_API_GRAPHQL_URL=$REACT_APP_API_GRAPHQL_URL
ENV REACT_APP_API_WS=$REACT_APP_API_WS
RUN test -n "$REACT_APP_API_URL" \
    && test -n "$REACT_APP_API_GRAPHQL_URL" \
    && test -n "$REACT_APP_API_WS" \
    || (echo "All three public API URL build arguments are required" && exit 1)
RUN yarn build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3001

COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
# next-i18next loads this config and locale JSON files during SSR.
COPY --from=build --chown=node:node /app/next-i18next.config.js ./next-i18next.config.js
RUN chown node:node /app /app/.next

USER node
EXPOSE 3001
CMD ["node", "server.js"]
