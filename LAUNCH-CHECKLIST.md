# Leonida Live: launch session checklist

Everything is built and committed. When you're back, we go through this in order.
Have these logins ready; each step tells you what to paste where.

## 1. Accounts to create (about 30 min, can do before the session)
| Service | What for | You'll give me / paste into Vercel |
|---|---|---|
| GitHub | code | empty private repo `leonida-live` |
| Vercel | hosting | import the repo (see DEPLOY.md) |
| Supabase | database, sign-in, clip storage | Project URL + anon key |
| Discord Developer Portal | "Sign in with Discord" + club role bot | Client ID + secret → Supabase Auth |
| Twitch Developer Console | "Sign in with Twitch" | Client ID + secret → Supabase Auth |
| Google Cloud | Google sign-in + YouTube Data API (auto-upload compilations) | OAuth client ID + secret |
| Microsoft Azure (Entra) | Xbox gamertag check via Microsoft sign-in | Application ID + secret; Xbox Live access needs Microsoft approval (weeks) |
| PayPal Business | payouts (PayPal Payouts API needs approval) | Client ID + secret, later |
| Domain | leonidalive.com (or similar) | add in Vercel → Domains |

PlayStation has no public sign-in for third-party sites, so PSN stays on the profile-code check that's already built.

## 2. Push and deploy (15 min, together)
1. Unzip `leonida-live.tar.gz`, open in Cursor.
2. `git remote add origin <your repo URL>` then `git push -u origin main`.
3. Vercel: import, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, deploy.

## 3. Database (10 min, together)
1. Supabase SQL editor: run `supabase/schema.sql`.
2. Sign in on the live site once, then make yourself owner (SQL in DEPLOY.md).
3. Run `supabase/seed.sql` for a test round with three clips.

## 4. Test the whole loop (30 min, together)
- [ ] Sign in with email, Discord, Twitch, Google
- [ ] Send a clip (file upload and link) → appears in Staff → Review queue
- [ ] Approve it, set the YouTube timestamp
- [ ] Vote: blocked while club-only → set yourself `is_club` → vote counts, vote moves
- [ ] Staff → Staff and settings: switch voting to everyone, give a second account the reviewer role
- [ ] Close the round → winnings appear on the winner's dashboard → Redeem → Staff → Payouts → Mark paid
- [ ] Claim a clip from a second account → approve in Staff → Claims
- [ ] Club application → approve → member sees the Members' room
- [ ] Versus application → Staff → Versus
- [ ] Phone check on the live URL (iPhone + Android), day and night mode

## 5. Video pipeline (next build, after the loop works)
Clip upload (Supabase Storage) → staff review queue → auto-trim and caption with FFmpeg (server job) → staff orders the week's clips → compilation rendered with chapter markers → uploaded to YouTube via the YouTube Data API with each clip's timestamp → timestamps written back so "Watch" on each clip jumps to its moment. Needs: Google Cloud project with YouTube Data API, and a small worker (Supabase Edge Function or a $5 server) for FFmpeg.

## Open items only you can decide
- Company running the contest: rules name Mytikas 73 Inc.; confirm or change.
- Contact email: rules use contact@leonidalive.com (placeholder).
- Legal review of the contest rules before the first paid round.
- Social handles: check `leonidalive` is free on each platform.

## 6. Pre-launch: recruit the Triple Comma Club (start right after deploy)
The club page already takes applications and works before GTA VI is out, since proof comes from GTA Online.
- Offer "Founding member" status to everyone approved before Nov 19 (first 100): permanent badge, and they're the very first voters in Week 1.
- Where to find $1B GTA Online players: r/gtaonline money threads, GTA Online grinding Discords, TikTok/YouTube creators who post bank balances, Twitch GTA Online streamers.
- Post on the new socials with the seal logo (D or O): "Made $1’000’000’000 in GTA Online? Prove it. Founding seats open until Nov 19."
- Review every application by hand (Staff → ’’’ Club). Watch for edited clips; the club code in their Social Club bio is the main check.
