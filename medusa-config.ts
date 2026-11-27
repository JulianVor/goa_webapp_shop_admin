import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  admin: {
    backendUrl: process.env.MEDUSA_BACKEND_URL,
  },
  modules: [
    {
      // Without this, the local file provider defaults uploaded file URLs to
      // "http://localhost:9000/static/..." (see @medusajs/file-local's LocalFileService),
      // which only resolves on whoever's own machine has something listening on that port -
      // never for an actual visitor/admin browser. Product images upload "successfully" but
      // never render anywhere, including in the Admin Dashboard's own media preview.
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-local",
            id: "local",
            options: {
              backend_url: `${process.env.MEDUSA_BACKEND_URL}/static`,
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            // Registered provider id ends up as "pp_stripe_stripe" (Stripe's own
            // identifier "stripe" + this "id: stripe") - goa_webapp_shop's
            // APP_STRIPE_PROVIDER_ID must match this exactly.
            resolve: "@medusajs/medusa/payment-stripe",
            id: "stripe",
            options: {
              apiKey: process.env.STRIPE_API_KEY,
              webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
              // Without this, Stripe only authorizes the charge ("requires_capture") and
              // leaves it to someone to manually hit "Capture Payment" per order in the
              // Medusa Admin - verified against node_modules/@medusajs/payment-stripe's
              // actual source: `capture: true` is what sets the PaymentIntent's
              // capture_method to "automatic" instead of "manual".
              capture: true,
            },
          },
        ],
      },
    },
  ],
})
