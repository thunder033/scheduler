# Runtime image for scheduler-api. The build context is the project root and
# expects `dist/` from `nx run scheduler-api:prune-lockfile` (bundle + pruned
# package.json and lockfile); use `nx run scheduler-api:docker:build`.
ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

COPY dist/package.json dist/package-lock.json ./
RUN npm ci --omit=dev

COPY dist/ ./

USER node
EXPOSE ${PORT}

CMD ["node", "--enable-source-maps", "main.js"]
