#build stage
FROM  node:18-alpine AS build
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

#production stage
FROM  node:18-alpine
WORKDIR /usr/src/app
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
COPY --from=build /usr/src/app/dist ./dist
COPY .env ./
COPY package*.json ./
# COPY --from=build /usr/src/app/node_modules ./node_modules
# COPY --from=build /usr/src/app/package*.json ./
# To be used when database connection added
 COPY --from=build /usr/src/app/prisma ./prisma

RUN npm install --only=production




RUN rm package*.json

EXPOSE 3000
#can't use start:prod beacuse package.json is removed
CMD [ "node", "dist/main.js" ]

