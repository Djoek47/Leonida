import "server-only";

import { led, setRank, asset, button, code, esc, hero, heading, list, para, plain, rows, shell, SITE, small } from "./layout";

/** Every email the site sends, in one place.
 *
 *  Everyday mail (look "sign"): signing in, confirming an address, plan and
 *  badge changes. Money mail (look "night"): anything bought, paid or won.
 *  Each template returns a subject, the HTML and a plain-text twin. */

export type Email = { subject: string; html: string; text: string };
type D = Record<string, unknown>;

export const money = (cents: unknown) => {
  const n = Number(cents ?? 0) / 100;
  return `$${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}`;
};
const s = (v: unknown, fallback = "") => (v === null || v === undefined || v === "" ? fallback : String(v));
const tierName = (t: unknown) => ({ free: "Free", street: "Street", hustler: "Hustler", kingpin: "Kingpin" } as Record<string, string>)[s(t)] ?? s(t, "your plan");
const RANK: Record<string, number> = { free: 0, street: 1, hustler: 2, kingpin: 3 };
const PERKS: Record<string, string[]> = {
  street: ["Upload up to 4 clips a day.", "3 clip downloads a month", "No ads", "Members chat access."],
  hustler: ["Upload up to 6 clips a day.", "8 clip downloads a month", "Leonida Economist and the weekly Meta Brief", "Feature 1 clip."],
  kingpin: ["8 clips a day", "20 clip downloads a month", "Deep Analytics and 3 featured per month."],
};
const PLACE = ["", "1st", "2nd", "3rd"];
const PERIOD: Record<string, string> = { week: "Clip of the Week", month: "Clip of the Month", year: "Clip of the Year" };
const date = (iso: unknown) => {
  const d = new Date(s(iso));
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
};

const hi = (name: string) => `Hey ${esc(name)},`;
const L = "sign" as const, N = "night" as const;
const FOR_ACCOUNT = "You're getting this because it's about your Live From Leonida account.";

function sign(subject: string, preheader: string, body: string[], text: (string | false | null | undefined)[], reason = FOR_ACCOUNT): Email {
  return { subject, html: shell({ look: L, preheader, body, reason }), text: plain(text) };
}
function night(subject: string, preheader: string, body: string[], text: (string | false | null | undefined)[], reason = FOR_ACCOUNT): Email {
  return { subject, html: shell({ look: N, preheader, body, reason }), text: plain(text) };
}

/* ─────────────────────────── Account and sign-in ─────────────────────────── */

export function authEmail(kind: string, d: { name: string; link?: string; token?: string; newEmail?: string }): Email | null {
  const { name, link, token, newEmail } = d;
  // The site signs in by link, so links carry the whole flow; only reauthentication uses a typed code.
  const codeLine: string[] = [];
  const codeText = null;
  void token;
  const expiry = small("The link works once and run out in an hour. If this wasn't you, ignore this email and nothing changes.", L);

  switch (kind) {
    case "signup":
      return sign("Confirm your email to finish signing up", "One tap and your account is live.", [
        heading("You're one tap from Leonida.", L),
        para(`${hi(name)} confirm this address and your account is open: upload clips, vote, and enter every prize round. No card needed.`, L),
        button("Confirm my email", link ?? SITE, L), ...codeLine, expiry,
      ], [`${name}, confirm your email to finish signing up.`, "", `Confirm: ${link}`, codeText, "", "If you didn't sign up, ignore this email."]);

    case "magiclink":
      return sign("Your sign-in link", "Tap to sign in. Works once, for one hour.", [
        heading("Here's your way in.", L),
        para(`${hi(name)} tap the button to sign in to Live From Leonida.`, L),
        button("Sign me in", link ?? SITE, L), ...codeLine, expiry,
      ], [`${name}, here's your sign-in link:`, link, codeText, "", "Works once, for one hour. If you didn't ask for it, ignore this email."]);

    case "recovery":
      return sign("Reset your password", "Pick a new password. The link works for one hour.", [
        heading("New password, same account.", L),
        para(`${hi(name)} someone asked to reset the password on this account. If it was you, choose a new one here:`, L),
        button("Choose a new password", link ?? SITE, L), ...codeLine,
        small("If you didn't ask for this, your password hasn't changed and you can ignore this email.", L),
      ], [`${name}, reset your password here:`, link, codeText, "", "If you didn't ask for this, ignore it. Your password hasn't changed."]);

    case "email_change_current":
      return sign("Confirm your email change", `Moving your account to ${newEmail ?? "a new address"}.`, [
        heading("Changing your email?", L),
        para(`${hi(name)} your account is being moved to <strong>${esc(newEmail ?? "a new address")}</strong>. Confirm from this address to allow it.`, L),
        button("Yes, change it", link ?? SITE, L), ...codeLine,
        small("Didn't ask for this? Don't confirm, and change your password from your settings.", L),
      ], [`${name}, your account is being moved to ${newEmail}.`, `Confirm: ${link}`, codeText, "", "Didn't ask for this? Don't confirm, and change your password."]);

    case "email_change_new":
      return sign("Confirm your new email", "Confirm this address for your Live From Leonida account.", [
        heading("Confirm your new address.", L),
        para(`${hi(name)} confirm this address and it becomes the one you sign in with. Your clips, wallet and plan stay exactly as they are.`, L),
        button("Confirm this address", link ?? SITE, L), ...codeLine, expiry,
      ], [`${name}, confirm your new email:`, link, codeText]);

    case "invite":
      return sign("You're invited to Live From Leonida", "Your account is ready. Set it up in a minute.", [
        heading("You've been invited.", L),
        para(`${hi(name)} an account has been set up for you on Live From Leonida, the GTA VI clip contest. Accept to choose your password.`, L),
        button("Accept the invite", link ?? SITE, L), expiry,
      ], ["You've been invited to Live From Leonida.", `Accept: ${link}`]);

    case "reauthentication":
      return sign("Your confirmation code", "Use this code to confirm it's you.", [
        heading("Confirm it's you.", L),
        para(`${hi(name)} enter this code to finish what you started:`, L),
        code(token ?? "", L),
        small("If you didn't start anything, change your password from your settings.", L),
      ], [`${name}, your confirmation code: ${token}`]);
  }
  return null;
}

/* ─────────────────────────── Everything else ─────────────────────────── */

export function eventEmail(kind: string, d: D, name: string): Email | null {
  setRank(d.tier ?? d.new_tier);
  switch (kind) {
    /* ── Everyday ── */
    case "plan_changed": {
      const from = s(d.from), to = s(d.to);
      const up = (RANK[to] ?? 0) > (RANK[from] ?? 0);
      return sign(up ? `You moved up to ${tierName(to)}` : `Your plan is now ${tierName(to)}`,
        `${tierName(from)} → ${tierName(to)}`, [
        heading(up ? `${tierName(to)}. Moving up.` : `You're on ${tierName(to)} now.`, L),
        para(`${hi(name)} your plan changed from <strong>${esc(tierName(from))}</strong> to <strong>${esc(tierName(to))}</strong>. It's live now.`, L),
        list(PERKS[to] ?? [], L),
        button("See your dashboard", `${SITE}/dashboard`, L),
        small("Billing changes show up on your next receipt. You can change or cancel any time in settings.", L),
      ], [`${name}, your plan changed from ${tierName(from)} to ${tierName(to)}.`, ...(PERKS[to] ?? []).map((p) => `- ${p}`), "", `${SITE}/dashboard`]);
    }

    case "plan_ended":
      return sign("Your membership has ended", "You're on the free plan. Your clips and wallet are safe.", [
        heading("Your membership has ended.", L),
        para(`${hi(name)} your <strong>${esc(tierName(d.from))}</strong> plan is over and you're back on Free. Nothing is lost: your clips, badges and wallet balance stay put, and you can still upload, vote and win every prize.`, L),
        para("Unused download credits don't carry over.", L),
        button("Come back any time", `${SITE}/pricing`, L),
      ], [`${name}, your ${tierName(d.from)} plan has ended. You're on Free.`, "Your clips, badges and wallet are safe.", `${SITE}/pricing`]);

    case "payment_failed":
      return sign("Your payment didn't go through", "Update your card to keep your plan.", [
        heading("That payment didn't go through.", L),
        para(`${hi(name)} we couldn't take the payment for your <strong>${esc(tierName(d.tier))}</strong> plan. Your perks stay on for now while the card is retried.`, L),
        para("Usually it's an expired card or a bank check. Updating your payment method fixes it.", L),
        button("Update payment", `${SITE}/settings`, L),
      ], [`${name}, the payment for your ${tierName(d.tier)} plan didn't go through.`, `Update it: ${SITE}/settings`]);

    case "badge_earned":
      return sign(`Badge unlocked: ${s(d.label, "New badge")}`, s(d.blurb, "A new badge for your wall."), [
        `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;"><tr><td bgcolor="#00704a" style="background:#00704a;border:3px solid #ffffff;box-shadow:0 0 0 2px #00704a;border-radius:10px;padding:10px 18px;font-family:'Arial Black',Arial,sans-serif;font-size:13px;font-weight:900;letter-spacing:2px;color:#ffffff;">BADGE UNLOCKED</td></tr></table>`,
        heading(s(d.label, "New badge"), L),
        para(`${hi(name)} ${esc(s(d.blurb, "you earned a new badge."))} It's on your profile now.`, L),
        d.next ? small(`Next up: <strong>${esc(d.next)}</strong>${d.toGo ? `, ${esc(d.toGo)} more clip${Number(d.toGo) === 1 ? "" : "s"} away` : ""}.`, L) : "",
        button("See your badges", `${SITE}/dashboard`, L),
      ], [`${name}, badge unlocked: ${s(d.label)}. ${s(d.blurb)}`, `${SITE}/dashboard`]);

    case "gamertag_approved":
      return sign("Your gamertag is verified", "Proof checked and approved.", [
        heading("Verified.", L),
        para(`${hi(name)} your proof checked out — your gamertag is confirmed as yours. Prize money for clips under that tag can now be paid to you.`, L),
        button("Open your dashboard", `${SITE}/dashboard`, L),
      ], [`${name}, your gamertag is verified.`, `${SITE}/dashboard`]);
    case "gamertag_rejected":
      return sign("We couldn't verify your gamertag", "One more try needed.", [
        heading("Not quite.", L),
        para(`${hi(name)} we couldn't verify your gamertag from what you sent.${d.note ? ` The reviewer said: &ldquo;${esc(String(d.note))}&rdquo;.` : ""} Try again from your dashboard — a clearer photo, or the profile-code route, usually settles it.`, L),
        button("Try again", `${SITE}/dashboard`, L),
      ], [`${name}, we couldn't verify your gamertag${d.note ? ` — ${s(d.note)}` : ""}. Try again: ${SITE}/dashboard`]);
    case "gamertag_verified":
      return sign("Your gamertag is verified", `${s(d.gamertag)} is confirmed as yours.`, [
        heading("Verified.", L),
        para(`${hi(name)} <strong>${esc(d.gamertag)}</strong> is confirmed as yours. Prize money for clips under that tag can now be paid to you.`, L),
        button("Open your dashboard", `${SITE}/dashboard`, L),
      ], [`${name}, ${s(d.gamertag)} is verified.`, `${SITE}/dashboard`]);

    case "withdrawal_requested":
      return sign(`Withdrawal requested: ${money(d.amount)}`, "We've got it. Staff send withdrawals by hand.", [
        heading("Withdrawal on its way to staff.", L),
        para(`${hi(name)} you asked to withdraw <strong>${money(d.amount)}</strong> from your wallet.`, L),
        rows([
          ["Amount", money(d.amount)],
          ["Send to", esc(`${s(d.method, "payout method")}${d.handle ? ` · ${s(d.handle)}` : ""}`)],
          ...(d.balance != null ? [["Left in your wallet", money(d.balance)] as [string, string]] : []),
        ], L),
        small("Staff send withdrawals by hand, usually within a few days. You'll get another email when it's sent. Wrong payout details? Fix them in settings.", L),
        small("How we pay you, so you can spot a fake: we only ever send money to the payout details saved in your account. We will never ask for a password, a card number, a login code, or for you to send us money first. If a message asks for any of that, it isn't us — reply to this email instead.", L),
        button("See your wallet", `${SITE}/wallet`, L),
      ], [`${name}, you asked to withdraw ${money(d.amount)} to ${s(d.method)} ${s(d.handle)}.`, `Left in wallet: ${money(d.balance)}`]);

    case "wallet_credit":
      return sign(`${money(d.amount)} added to your wallet`, s(d.note, "Staff added money to your wallet."), [
        heading(`${money(d.amount)} added.`, L),
        para(`${hi(name)} staff added <strong>${money(d.amount)}</strong> to your wallet${d.note ? `: ${esc(d.note)}` : "."}`, L),
        rows([["Wallet balance", money(d.balance)]], L),
        button("See your wallet", `${SITE}/wallet`, L),
      ], [`${name}, ${money(d.amount)} was added to your wallet. Balance: ${money(d.balance)}`]);

    /* ── Money ── */
    case "plan_started": {
      const t = s(d.tier);
      const annual = d.period === "annual";
      return night(`Welcome to ${tierName(t)}`, `You're in. ${tierName(t)} is live on your account.`, [
        hero({ img: asset(`medal-${t}.png`), imgAlt: `${tierName(t)} medal`, kicker: "Membership unlocked", figure: esc(tierName(t)),
          caption: `${money(d.amount)} ${annual ? "a year" : "a month"}${d.test ? " · test mode, no charge" : ""}` }),
        para(`${hi(name)} you're in. Your <strong>${esc(tierName(t))}</strong> perks are switched on right now:`, N),
        list(PERKS[t] ?? [], N),
        rows([
          ["Plan", esc(`${tierName(t)} · ${annual ? "yearly" : "monthly"}`)],
          ["Paid", money(d.amount)],
          ["Download credits this cycle", esc(s(d.credits, "0"))],
          ...(d.renews ? [["Renews", esc(date(d.renews))] as [string, string]] : []),
        ], N),
        button("Start using it", `${SITE}/dashboard`, N),
        small(`Stay subscribed and your medal earns a star every 4 months. Change or cancel any time in settings.${d.test ? " This was a test-mode purchase: no card was charged." : ""}`, N),
      ], [`${name}, welcome to ${tierName(t)}.`, `Paid: ${money(d.amount)} ${annual ? "a year" : "a month"}${d.test ? " (test mode, no charge)" : ""}`,
          ...(PERKS[t] ?? []).map((p) => `- ${p}`), "", `${SITE}/dashboard`], "Your receipt for a Live From Leonida membership.");
    }

    case "renewal_receipt":
      return night(`Receipt: ${tierName(d.tier)} renewed`, `${money(d.amount)} paid. Fresh credits are in.`, [
        hero({ img: asset(`medal-${s(d.tier, "street")}.png`), imgAlt: "", kicker: `${tierName(d.tier)} renewed`, figure: money(d.amount), caption: "Paid. Thanks for sticking around." }),
        para(`${hi(name)} your <strong>${esc(tierName(d.tier))}</strong> plan renewed and this cycle's download credits are loaded.`, N),
        rows([
          ["Plan", esc(tierName(d.tier))],
          ["Amount", money(d.amount)],
          ...(d.invoice ? [["Receipt no.", esc(d.invoice)] as [string, string]] : []),
          ...(d.renews ? [["Next renewal", esc(date(d.renews))] as [string, string]] : []),
        ], N),
        button("See receipts", `${SITE}/wallet`, N),
      ], [`${name}, ${tierName(d.tier)} renewed. Paid ${money(d.amount)}.`, d.invoice ? `Receipt ${s(d.invoice)}` : null], "Your receipt for a Live From Leonida membership.");

    case "payment_receipt":
      return night(`Receipt: ${money(d.amount)} paid`, s(d.what, "Payment received."), [
        hero({ img: asset("logo.png"), imgAlt: "", kicker: "Payment received", figure: money(d.amount) }),
        para(`${hi(name)} thanks, your payment went through.`, N),
        rows([["For", esc(s(d.what, "Live From Leonida"))], ["Amount", money(d.amount)], ...(d.invoice ? [["Receipt no.", esc(d.invoice)] as [string, string]] : [])], N),
        button("See receipts", `${SITE}/wallet`, N),
      ], [`${name}, payment received: ${money(d.amount)} for ${s(d.what)}.`], "Your Live From Leonida receipt.");

    case "download_receipt":
      return night(`Your download: ${s(d.title, "a clip")}`, `${money(d.creator)} of it went to ${s(d.gamertag, "the player")}.`, [
        hero({ img: asset("logo.png"), imgAlt: "", kicker: "Clip bought", figure: money(d.amount), caption: esc(s(d.title, "A clip")) }),
        para(`${hi(name)} the clip is yours to download, and you can grab it again from the clip page any time without paying twice.`, N),
        rows([
          ["Clip", esc(s(d.title, "A clip"))],
          ["Player", esc(s(d.gamertag, "—"))],
          ["You paid", money(d.amount)],
          ["To the player", money(d.creator)],
        ], N),
        button("Download it", `${SITE}/clips?clip=${encodeURIComponent(s(d.clip))}`, N),
        small("Clips are for your own videos and edits. Credit the player when you post.", N),
      ], [`${name}, you bought "${s(d.title)}" for ${money(d.amount)}. ${money(d.creator)} went to ${s(d.gamertag)}.`, `${SITE}/clips`], "Your Live From Leonida receipt.");

    case "clip_sold":
      return night(`Cha-ching. +${money(d.amount)} for your clip`, `Someone downloaded "${s(d.title, "your clip")}".`, [
        hero({ img: asset("cash.png"), imgAlt: "Cash", kicker: "Your clip just sold", figure: `+${money(d.amount)}`, caption: esc(s(d.title, "Your clip")) }),
        para(`${hi(name)} someone downloaded <strong>${esc(s(d.title, "your clip"))}</strong>. The money is already in your wallet.`, N),
        rows([["Earned", `+${money(d.amount)}`], ["Wallet balance", money(d.balance)]], N),
        button("See your wallet", `${SITE}/wallet`, N),
        small("Every member download pays the player. Keep sending clips: the good ones sell over and over.", N),
      ], [`${name}, "${s(d.title)}" was downloaded. +${money(d.amount)} in your wallet. Balance: ${money(d.balance)}.`], "You're getting this because one of your clips earned money.");

    case "clip_approved":
      return sign("Your clip has been approved", "Your clip has been approved and is now live.", [
        heading("Approved.", L),
        led([["Status", "LIVE"], ["Views", "0"], ["Round", esc(s(d.round, "WEEK"))]]),
        para(`${hi(name)} your clip has been approved and is now live.`, L),
        rows([["Clip", esc(s(d.title, "Your clip"))], ["Status", "Approved"]], L),
        button("See it on your dashboard", `${SITE}/dashboard`, L),
      ], [`${name}, your clip has been approved and is now live.`, `${SITE}/dashboard`]);

    case "admin_new_clip":
      setRank("kingpin");
      return sign(`New clip to review: ${s(d.title, "Untitled")}`, `${s(d.gamertag)} just sent a clip.`, [
        heading("New clip in the queue.", L),
        led([["Waiting", esc(s(d.waiting, "1"))], ["Length", `${esc(s(d.duration, "?"))}s`], ["Round", esc(s(d.round, "WEEK"))]]),
        rows([["Title", esc(s(d.title, "Untitled"))], ["Gamertag", esc(s(d.gamertag))], ["Platform", esc(s(d.platform).toUpperCase())]], L),
        button("Review it in the console", `${SITE}/console?tab=clips`, L),
        small("Approve puts it live and into its weekly round. Disapprove tells the creator.", L),
      ], [`New clip to review: ${s(d.title)} by ${s(d.gamertag)}.`, `${SITE}/console?tab=clips`], "You're getting this because you're staff on Live From Leonida.");

    case "admin_support":
      setRank("kingpin");
      return sign(`Support: ${s(d.subject, "New request")}`, `${s(d.topic)} · ${s(d.email)}`, [
        heading("New support request.", L),
        rows([["Topic", esc(s(d.topic))], ["From", esc(s(d.email))], ["Subject", esc(s(d.subject))]], L),
        para(esc(s(d.message)).replace(/\n/g, "<br>"), L),
        button("Open it in the console", `${SITE}/console?tab=support`, L),
      ], [`Support request from ${s(d.email)}: ${s(d.subject)}`, s(d.message), `${SITE}/console?tab=support`], "You're getting this because you're staff on Live From Leonida.");

    case "support_received":
      return sign("We got your message", "A real person reads every request.", [
        heading("Message received.", L),
        led([["Ticket", esc(s(d.ref))], ["Status", "OPEN"]]),
        para(`${hi(name)} thanks for writing in about <strong>${esc(s(d.subject))}</strong>. We read every request and reply from the console, usually within a day.`, L),
        button("See your requests", `${SITE}/support`, L),
      ], [`${name}, we got your message (${s(d.ref)}).`, `${SITE}/support`]);

    case "support_reply":
      return sign(`Reply to: ${s(d.subject)}`, "Support answered your request.", [
        heading("We answered.", L),
        para(esc(s(d.reply)).replace(/\n/g, "<br>"), L),
        rows([["Ticket", esc(s(d.ref))], ["Status", esc(s(d.status, "answered").toUpperCase())]], L),
        button("Open your requests", `${SITE}/support`, L),
      ], [`Support replied to ${s(d.subject)}:`, s(d.reply), `${SITE}/support`]);

    case "clip_disapproved":
      return sign("Your clip has been disapproved", "Your clip has been disapproved.", [
        heading("Disapproved.", L),
        para(`${hi(name)} your clip has been disapproved.`, L),
        rows([["Clip", esc(s(d.title, "Your clip"))], ["Status", "Disapproved"]], L),
        button("See your dashboard", `${SITE}/dashboard`, L),
      ], [`${name}, your clip has been disapproved.`, `${SITE}/dashboard`]);

    case "prize_won": {
      const place = Number(d.place ?? 1);
      const award = PERIOD[s(d.period)] ?? "the round";
      return night(place === 1 ? `You won ${award}. ${money(d.amount)} is yours.` : `${PLACE[place]} place: ${money(d.amount)} is yours`,
        `${s(d.title, "Your clip")} placed ${PLACE[place]} in ${s(d.contest, award)}.`, [
        hero({ img: asset(`place-${place}.png`), imgAlt: `${PLACE[place]} place`, kicker: `${PLACE[place]} place · ${award}`, figure: money(d.amount), caption: esc(s(d.contest)) }),
        heading(place === 1 ? "The whole state voted. You won." : `On the podium. ${PLACE[place]} place.`, N),
        para(`${hi(name)} your clip <strong>${esc(s(d.title, "your clip"))}</strong> finished <strong>${PLACE[place]}</strong> in ${esc(s(d.contest, award))}. The ${place === 1 ? "gold" : place === 2 ? "silver" : "bronze"} badge is on your profile.`, N),
        rows([["Place", PLACE[place]], ["Prize", money(d.amount)], ["Round", esc(s(d.contest, award))]], N),
        led([["Place", PLACE[place].toUpperCase()], ["Prize", money(d.amount)]]),
        para("Weekly prizes are processed after the winner is announced and valid payment details are provided. You'll get one more email when it's paid.", N),
        button("See the results", `${SITE}/clips`, N),
        small("Make sure your gamertag is verified and your payout details are set, so nothing holds the money up.", N),
      ], [`${name}, "${s(d.title)}" placed ${PLACE[place]} in ${s(d.contest, award)}. Prize: ${money(d.amount)}.`, "Weekly prizes are processed after the winner is announced and valid payment details are provided."], "You're getting this because your clip won a prize.");
    }

    case "prize_paid":
      return night(`${money(d.amount)} just landed in your wallet`, "Your prize money is in.", [
        hero({ img: asset("cash.png"), imgAlt: "Cash", kicker: "Prize money in", figure: `+${money(d.amount)}` }),
        para(`${hi(name)} your prize${d.place ? ` for ${esc(PLACE[Number(d.place)] ?? "")} place` : ""} is in your wallet. Withdraw it whenever you like.`, N),
        rows([["Prize", `+${money(d.amount)}`], ["Wallet balance", money(d.balance)]], N),
        button("Withdraw", `${SITE}/wallet`, N),
      ], [`${name}, +${money(d.amount)} prize money is in your wallet. Balance: ${money(d.balance)}.`, `${SITE}/wallet`], "You're getting this because you won a prize.");

    case "payout_sent":
      return night(`Sent: ${money(d.amount)} is on its way to you`, `Paid to ${s(d.method, "your payout account")}.`, [
        hero({ img: asset("cash.png"), imgAlt: "Cash", kicker: "Money sent", figure: money(d.amount) }),
        para(`${hi(name)} we sent <strong>${money(d.amount)}</strong> to you. Depending on the service it can take a little while to show up.`, N),
        rows([
          ["Amount", money(d.amount)],
          ["Sent to", esc(`${s(d.method, "payout account")}${d.handle ? ` · ${s(d.handle)}` : ""}`)],
          ...(d.reference ? [["Reference", esc(d.reference)] as [string, string]] : []),
        ], N),
        button("See your wallet", `${SITE}/wallet`, N),
        small("Nothing after a few days? Check the payout details in settings and tell staff in the chat.", N),
        small("We only ever pay to the details saved in your account, and we never ask for a password, a card number, a login code, or money up front. Anything asking for those isn't from us.", N),
      ], [`${name}, we sent you ${money(d.amount)} via ${s(d.method)} ${s(d.handle)}.`, d.reference ? `Reference: ${s(d.reference)}` : null], "You're getting this because money was sent to you.");
  }
  return null;
}
