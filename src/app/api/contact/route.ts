/**
 * Contact form delivery.
 *
 * Validation happens here rather than in the browser alone, and delivery goes
 * through a single provider call so no third party script has to run on the
 * page. Without credentials the route reports that it cannot deliver, which the
 * form turns into a visible fallback to email: silently dropping a message a
 * person took the time to write would be worse than admitting the failure.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Why a submission was rejected. */
enum RejectionReason {
  Malformed = "malformed",
  TooShort = "too-short",
  TooLong = "too-long",
  BadEmail = "bad-email",
  Honeypot = "honeypot",
}

interface ContactPayload {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  company?: unknown;
}

const LIMITS = {
  nameMax: 120,
  emailMax: 180,
  messageMin: 10,
  messageMax: 4000,
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(payload: ContactPayload): RejectionReason | null {
  const { name, email, message, company } = payload;

  if (typeof company === "string" && company.trim().length > 0) return RejectionReason.Honeypot;
  if (typeof name !== "string" || typeof email !== "string" || typeof message !== "string") {
    return RejectionReason.Malformed;
  }
  if (name.trim().length === 0 || message.trim().length < LIMITS.messageMin) {
    return RejectionReason.TooShort;
  }
  if (
    name.length > LIMITS.nameMax ||
    email.length > LIMITS.emailMax ||
    message.length > LIMITS.messageMax
  ) {
    return RejectionReason.TooLong;
  }
  if (!EMAIL_PATTERN.test(email)) return RejectionReason.BadEmail;

  return null;
}

export async function POST(request: Request) {
  let payload: ContactPayload;
  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return NextResponse.json({ error: RejectionReason.Malformed }, { status: 400 });
  }

  const rejection = validate(payload);
  if (rejection === RejectionReason.Honeypot) {
    // Accept and drop: telling a bot it was caught only helps the bot.
    return NextResponse.json({ ok: true });
  }
  if (rejection) {
    return NextResponse.json({ error: rejection }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) {
    console.error("[contact] delivery is not configured: set RESEND_API_KEY and CONTACT_TO_EMAIL");
    return NextResponse.json({ error: "not-configured" }, { status: 503 });
  }

  const name = String(payload.name);
  const email = String(payload.email);
  const message = String(payload.message);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: "elpideus.com <onboarding@resend.dev>",
        to: [to],
        reply_to: email,
        subject: `Signal from ${name}`,
        text: `${name} <${email}>\n\n${message}`,
      }),
    });

    if (!response.ok) {
      throw new Error(`resend responded ${response.status}: ${await response.text()}`);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[contact] delivery failed:", error);
    return NextResponse.json({ error: "delivery-failed" }, { status: 502 });
  }
}
