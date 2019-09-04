FROM node:slim

COPY . .

RUN npm install --production
RUN npm run build

ENTRYPOINT ["node", "/lib/main.js"]
