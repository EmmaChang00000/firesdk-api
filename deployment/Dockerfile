FROM node:18-alpine

WORKDIR /app

ADD server.js /app/server.js
ADD fire-demo-a766b-firebase-adminsdk-gs1tt-fc21e4f4a3.json /app/fire-demo-a766b-firebase-adminsdk-gs1tt-fc21e4f4a3.json
ADD package.json /app/package.json

RUN [ "npm", "install" ]

CMD ["npm", "start"]
