FROM node:20.10.0 as build

RUN npm i pm2@latest -g

WORKDIR /app

COPY ./data ./data
COPY ./package.json ./package.json
COPY ./dist ./dist
COPY ./setup.sh ./setup.sh



RUN npm install --omit=dev --prefix ./
RUN chmod +x ./setup.sh

EXPOSE 3000
ENTRYPOINT ["./setup.sh"]