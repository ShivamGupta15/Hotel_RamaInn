/**
 * Application Configuration
 * Mirrors Python app.config.settings with seamless environment variable parsing
 */

export const config = {
  appName: process.env.APP_NAME || "Hotel Rama Inn",
  debug: process.env.DEBUG === "true",
  secretKey: process.env.SECRET_KEY || "change-me-in-production",
  allowedOrigins: process.env.ALLOWED_ORIGINS
    ? parseAllowedOrigins(process.env.ALLOWED_ORIGINS)
    : ["http://localhost:5173", "http://localhost:3000"],

  databaseUrl: process.env.DATABASE_URL || "",

  // Razorpay
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || "",
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "your_webhook_secret",

  // Stripe (optional fallback)
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",

  // Email (SMTP)
  smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
  smtpPort: parseInt(process.env.SMTP_PORT || "587", 10),
  smtpUser: process.env.SMTP_USER || "",
  smtpPassword: process.env.SMTP_PASSWORD || "",
  fromEmail: process.env.FROM_EMAIL || "noreply@hotelramainn.com",

  // Booking Hold
  bookingHoldMinutes: parseInt(process.env.BOOKING_HOLD_MINUTES || "10", 10),
};

function parseAllowedOrigins(val: string): string[] {
  try {
    if (val.startsWith("[") && val.endsWith("]")) {
      return JSON.parse(val);
    }
    return val.split(",").map((s) => s.trim());
  } catch {
    return ["http://localhost:5173", "http://localhost:3000"];
  }
}

