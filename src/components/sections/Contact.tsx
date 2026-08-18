"use client";

/**
 * Canopus: the contact star.
 *
 * The form posts to an internal route so no third party script ever runs on the
 * page. Delivery failures are reported plainly, because unlike passive data a
 * message the visitor typed must never disappear silently.
 */

import { useState, type SyntheticEvent } from "react";
import clsx from "clsx";

import { ActionButton, ActionTone, Eyebrow, Hairline, Prose, Tag } from "@/components/ui/primitives";
import { SendIcon } from "@/components/ui/Icon";
import { SocialRow } from "@/components/ui/SocialLinks";
import { CONTACT } from "@/lib/content/contact";
import { CursorMode, setCursorMode } from "@/lib/state/cursor";

/** Lifecycle of the contact form. */
enum FormPhase {
  Idle = "idle",
  Sending = "sending",
  Sent = "sent",
  Failed = "failed",
}

const PHASE_MESSAGE: Record<FormPhase, string> = {
  [FormPhase.Idle]: "",
  [FormPhase.Sending]: "Transmitting.",
  [FormPhase.Sent]: "Message received. Expect an answer shortly.",
  [FormPhase.Failed]: "Transmission failed. Email works too: elpideus@gmail.com",
};

const FIELD_CLASS =
  "w-full rounded-[3px] border border-signal/20 bg-void/60 px-3 py-2 text-[13px] text-frost " +
  "placeholder:text-dim/70 transition-colors focus:border-signal/60 focus:outline-none";

const textCursorProps = {
  onPointerEnter: () => setCursorMode(CursorMode.Text),
  onPointerLeave: () => setCursorMode(CursorMode.Default),
} as const;

export function ContactSection() {
  const [phase, setPhase] = useState<FormPhase>(FormPhase.Idle);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setPhase(FormPhase.Sending);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: String(data.get("name") ?? ""),
          email: String(data.get("email") ?? ""),
          message: String(data.get("message") ?? ""),
          // Honeypot: real people never fill this in.
          company: String(data.get("company") ?? ""),
        }),
      });

      if (!response.ok) throw new Error(`contact route responded ${response.status}`);
      setPhase(FormPhase.Sent);
      form.reset();
    } catch (error) {
      console.error("[contact] delivery failed:", error);
      setPhase(FormPhase.Failed);
    }
  }

  return (
    <div className="space-y-4">
      <Prose>
        {CONTACT.body.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
      </Prose>

      <div className="flex flex-wrap gap-1.5">
        <Tag className="border-beacon/30 text-beacon">{CONTACT.availability}</Tag>
        <Tag>{CONTACT.responseTime}</Tag>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div className="grid grid-cols-2 gap-2.5">
          <label className="block">
            <span className="u-eyebrow mb-1 block">Name</span>
            <input
              name="name"
              required
              autoComplete="name"
              className={FIELD_CLASS}
              placeholder="Who is calling"
              {...textCursorProps}
            />
          </label>
          <label className="block">
            <span className="u-eyebrow mb-1 block">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className={FIELD_CLASS}
              placeholder="Where to answer"
              {...textCursorProps}
            />
          </label>
        </div>

        <label className="block">
          <span className="u-eyebrow mb-1 block">Message</span>
          <textarea
            name="message"
            required
            rows={4}
            className={clsx(FIELD_CLASS, "resize-none")}
            placeholder="Project, role, question, idea"
            data-native-scroll
            {...textCursorProps}
          />
        </label>

        {/* Honeypot, hidden from people and from assistive technology. */}
        <input
          name="company"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="pointer-events-none absolute h-0 w-0 opacity-0"
        />

        <div className="flex items-center gap-3">
          <ActionButton
            type="submit"
            tone={ActionTone.Primary}
            disabled={phase === FormPhase.Sending}
          >
            <SendIcon size={13} />
            {phase === FormPhase.Sending ? "Sending" : "Send"}
          </ActionButton>

          {phase !== FormPhase.Idle ? (
            <p
              className={clsx(
                "font-mono text-[10px] uppercase tracking-[0.16em]",
                phase === FormPhase.Failed ? "text-warning" : "text-signal",
              )}
              role="status"
            >
              {PHASE_MESSAGE[phase]}
            </p>
          ) : null}
        </div>
      </form>

      <Hairline />

      <div>
        <Eyebrow className="mb-2">Elsewhere</Eyebrow>
        <SocialRow />
      </div>
    </div>
  );
}
