# Stage 1: Build the Go binary
FROM golang:1.18-alpine AS builder

WORKDIR /app

COPY gemini-cli /app/gemini-cli

RUN cd /app/gemini-cli/cmd/gemini && go build

# Stage 2: Run the Node.js application
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

COPY --from=builder /app/gemini-cli/cmd/gemini/gemini /app/gemini-cli/cmd/gemini/gemini

EXPOSE 3000

CMD ["npm", "start"]
