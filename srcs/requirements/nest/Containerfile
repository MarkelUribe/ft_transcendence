FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci


FROM deps AS dev

# Utilities used by healthchecks/entrypoint in dev
RUN apk add --no-cache wget netcat-openbsd

COPY tools/entrypoint.sh /entrypoint.sh
RUN chmod 755 /entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["npm", "run", "start:dev"]


FROM deps AS build

COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build


FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

# Runtime deps only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Runtime utilities for healthchecks/entrypoint
RUN apk add --no-cache wget netcat-openbsd

COPY --from=build /app/dist ./dist
COPY tools/entrypoint.sh /entrypoint.sh
RUN chmod 755 /entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "dist/main.js"]
