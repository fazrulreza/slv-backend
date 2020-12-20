# Server

## URL

https://localhost:2020/graphql

## How to run

### Install
1. run `npm install` or if using yarn, `yarn install` in terminal
2. Generate self-signed certificates and put it in /certificates folder (create folder)

### Run in dev mode

1. run `npm run dev` or if using yarn, `yarn dev` in terminal

### Run in prod mode

1. run `npm run build` or if using yarn, `yarn build` in terminal
2. run `npm run start` or if using yarn, `yarn start` in terminal

### Run (PM2) in prod

1. run `yarn build` in terminal
2. run `pm2 start yarn --name backend -- start` 
