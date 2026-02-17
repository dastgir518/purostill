FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

# Build the application
ARG WORDPRESS_GRAPHQL_URL
ARG WOOCOMMERCE_URL
ENV WORDPRESS_GRAPHQL_URL="https://backend-ps.purostill.com/graphql"
ENV WOOCOMMERCE_URL="https://backend-ps.purostill.com"
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_51KFlmQFxErB4qQFItKczw4cyNWGAZoSAk0AC1Pmlvjn9PNTCnVW3BgidxAtMEYqHReFsoBuGma2AVIEzEGFioPLF00tiax7bgV"
ENV STRIPE_SECRET_KEY="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"
ENV NEXT_PUBLIC_GOOGLE_ANALYTICS_ID="G-6ZZ2VWKZLP"
ENV NEXT_PUBLIC_GOOGLE_ADS_ID="AW-11078664575"

RUN ls -la lib/ components/
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
