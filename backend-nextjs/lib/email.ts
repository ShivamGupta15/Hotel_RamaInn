import nodemailer from "nodemailer";
import { config } from "./config";

export interface VoucherData {
  booking_reference: string;
  guest_name: string;
  guest_email: string;
  room_name: string;
  check_in_date: string;
  check_out_date: string;
  total_nights: number;
  adults: number;
  children: number;
  final_payable: number;
  currency?: string;
}

export function generateVoucherHtml(data: VoucherData): string {
  const ref = data.booking_reference || "N/A";
  const guestName = data.guest_name || "Valued Guest";
  const roomName = data.room_name || "Standard Room";
  const checkIn = data.check_in_date || "";
  const checkOut = data.check_out_date || "";
  const nights = data.total_nights || 1;
  const adults = data.adults || 1;
  const children = data.children || 0;
  const totalAmount = (data.final_payable || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const currency = data.currency || "INR";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Booking Confirmation - Hotel Rama Inn</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: #ffffff; padding: 32px 24px; text-align: center; }
    .header h1 { margin: 0 0 8px 0; font-size: 24px; letter-spacing: 0.5px; }
    .header p { margin: 0; opacity: 0.9; font-size: 14px; }
    .badge { display: inline-block; background: #22c55e; color: #ffffff; font-weight: 600; font-size: 13px; padding: 6px 14px; border-radius: 9999px; margin-top: 16px; text-transform: uppercase; }
    .content { padding: 28px 24px; }
    .details-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    .details-table th, .details-table td { padding: 12px 8px; text-align: left; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .details-table th { color: #64748b; font-weight: 500; width: 40%; }
    .details-table td { font-weight: 600; color: #0f172a; }
    .total-row { background-color: #f8fafc; }
    .total-row th, .total-row td { font-size: 16px; font-weight: 700; color: #1e3a8a; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Hotel Rama Inn</h1>
      <p>Official Booking Voucher & Receipt</p>
      <div class="badge">Confirmed & Paid</div>
    </div>
    <div class="content">
      <p>Dear <strong>${guestName}</strong>,</p>
      <p>Thank you for choosing Hotel Rama Inn. Your reservation is confirmed. Please present this voucher or reference ID upon arrival.</p>
      <table class="details-table">
        <tr><th>Booking Reference</th><td><span style="font-family: monospace; font-size: 15px; color: #2563eb;">${ref}</span></td></tr>
        <tr><th>Room Category</th><td>${roomName}</td></tr>
        <tr><th>Check-in Date</th><td>${checkIn} (from 12:00 PM)</td></tr>
        <tr><th>Check-out Date</th><td>${checkOut} (until 11:00 AM)</td></tr>
        <tr><th>Stay Duration</th><td>${nights} Night(s)</td></tr>
        <tr><th>Guests</th><td>${adults} Adult(s), ${children} Child(ren)</td></tr>
        <tr class="total-row"><th>Total Paid</th><td>${currency} ${totalAmount}</td></tr>
      </table>
    </div>
    <div class="footer">
      <p>Hotel Rama Inn &bull; 24/7 Front Desk Support</p>
      <p>Need to make changes? Contact us at reservations@hotelramainn.com</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendBookingVoucherEmail(data: VoucherData): Promise<boolean> {
  const recipient = data.guest_email;
  const ref = data.booking_reference;

  if (!recipient) {
    console.warn(`[Email] No recipient email found for booking ${ref}`);
    return false;
  }

  // Simulation mode if credentials are not configured
  if (!config.smtpUser || !config.smtpPassword) {
    console.log(
      `[EMAIL SIMULATION] Voucher email successfully queued/dispatched for booking ${ref} to ${recipient}.`
    );
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPassword,
      },
    });

    const html = generateVoucherHtml(data);
    await transporter.sendMail({
      from: config.fromEmail,
      to: recipient,
      subject: `Booking Confirmed: ${ref} - Hotel Rama Inn`,
      html,
    });

    console.log(`[Email] Booking voucher sent to ${recipient} for reference ${ref}`);
    return true;
  } catch (err) {
    console.error(`[Email] Failed to send email to ${recipient}:`, err);
    return false;
  }
}

