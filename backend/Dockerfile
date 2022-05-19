FROM node:16-alpine

WORKDIR /app

RUN mkdir db
RUN mkdir src

COPY package.json /app/
COPY tsconfig.json /app/

COPY db/ /app/db/
COPY src/ /app/src/

RUN yarn
RUN yarn build

CMD ["yarn", "start"]
