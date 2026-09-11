FROM node:20-slim
WORKDIR /app

COPY server/package*.json ./server/
RUN npm --prefix server install --omit=dev

COPY client/package*.json ./client/
RUN npm --prefix client install

COPY server ./server
COPY client ./client
RUN npm --prefix client run build

# Default port 7860 suits Hugging Face Spaces; hosts like Render override PORT at runtime.
ENV PORT=7860
EXPOSE 7860
CMD ["npm", "--prefix", "server", "start"]
