FROM node:20-alpine

WORKDIR /app

# Copy the whole project (SvelteKit expects /app/src/app.html, /app/src/routes, etc.)
COPY . ./

RUN npm ci
RUN apk add --no-cache wget

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
