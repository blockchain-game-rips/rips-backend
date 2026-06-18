FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY tsconfig*.json ./
COPY src ./src

RUN yarn build

FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production

COPY --from=builder /app/lib ./lib
COPY db ./db
COPY schema.graphql ./

CMD ["node", "lib/main.js"]
