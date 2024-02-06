FROM node:14

# Install dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    libnss3 \
    libxkbcommon-x11-0 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    ffmpeg \
    imagemagick \
    webp \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/whatsapp-aduin

COPY package*.json ./

# Install dependencies without running Puppeteer installation
RUN npm set puppeteer_skip_chromium_download true && \
    npm install

COPY . .

# Tell Puppeteer to use the installed Chromium package
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

CMD ["node", "wabot.js"]
