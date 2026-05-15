FROM oven/bun:1.1
WORKDIR /usr/src/app

# Copy dependency files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install

# Copy application source
COPY . .

# Set environment to production
ENV NODE_ENV=production

# Expose the port
EXPOSE 3000

# Start the application
CMD [ "bun", "run", "src/app.ts" ]
