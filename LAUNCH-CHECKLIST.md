# Live From Leonida: launch session checklist

Everything is built and committed. When you're back, we go through this in order.
Have these logins ready; each step tells you what to paste where.

## 1. Accounts to create (about 30 min, can do before the session)
| Service | What for | You'll give me / paste into Vercel |
|---|---|---|
| GitHub | code | empty private repo `leonida-live` |
| Vercel | hosting | import the repo (see DEPLOY.md) |
| Supabase | database, sign-in, clip storage | Project URL + anon key |
| Discord Developer Portal | "Sign in with Discord" only — chat is now on-site | Client ID + secret → Supabase Auth |
| Twitch Developer Console | "Sign in with Twitch" | Client ID + secret → Supabase Auth |
| Google Cloud | Google sign-in + YouTube Data API (auto-upload compilations) | OAuth client ID + secret |
| Microsoft Azure (Entra) | Xbox gamertag check via Microsoft sign-in | Application ID + secret; Xbox Live access needs Microsoft approval (weeks) |
| Stripe | subscriptions and $0.99 downloads | secret key + webhook secret → Vercel |
| PayPal / Venmo / Cash App / Interac / Wise | paying winners and creators by hand | your own accounts, no API needed |
| Domain | livefromleonida.com (or similar) | add in Vercel → Domains |

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
- [ ] Vote as a free account: one vote, totals hidden, a new pick moves it
- [ ] Vote as a member: 4 votes on different clips, each worth the tier weight, totals visible
- [ ] Staff → Staff and settings: switch voting to everyone, give a second account the reviewer role
- [ ] Close the round → winnings appear on the winner's dashboard → Redeem → Staff → Payouts → Mark paid
- [ ] Claim a clip from a second account → approve in Staff → Claims
- [ ] Subscribe with Stripe test card 4242… → tier and credits land on the profile
- [ ] Vote counts per tier: Free 1, Street 2, Hustler 4, Kingpin 6
- [ ] Voting only opens inside the deadline window before a round closes
- [ ] Upload two days running → streak goes up; skip two days → it resets
- [ ] Pick a Daily Drop winner in admin → they appear in Trending for a week
- [ ] Add three tags to a clip → a fourth is refused
- [ ] Download with a credit → balance drops, creator earns $0.70
- [ ] Download with no credits → $0.99 checkout → webhook writes the row
- [ ] Send 3 clips on a free account → third is refused
- [ ] Send a 3-minute contest clip → refused before upload
- [ ] Chat: post in the Lobby, confirm a free account can't open Members
- [ ] Phone check on the live URL (iPhone + Android), day and night mode

## 5. Video pipeline (next build, after the loop works)
Clip upload (Supabase Storage) → staff review queue → auto-trim and caption with FFmpeg (server job) → staff orders the week's clips → compilation rendered with chapter markers → uploaded to YouTube via the YouTube Data API with each clip's timestamp → timestamps written back so "Watch" on each clip jumps to its moment. Needs: Google Cloud project with YouTube Data API, and a small worker (Supabase Edge Function or a $5 server) for FFmpeg.

## Open items only you can decide
- Company running the contest: rules say "Organized by Live From Leonida" (no company name).
- Contact email: rules use contact@livefromleonida.com (placeholder).
- Legal review of the contest rules before the first paid round.
- Social handles: check `livefromleonida` is free on each platform.

## 6. Pre-launch: get the first paying members (start right after deploy)
The prize pool is $25 a week until 200 people subscribe, so the first members are what
make the pot worth entering. Say that out loud on the pricing page and in the videos —
it's the honest pitch and it's also the strongest one.

Targets, roughly in order of how well they convert:
- People who already upload GTA clips to TikTok and YouTube Shorts. They want downloads.
- GTA Online veterans with money and hours — the people who'd have joined the old club.

Push the yearly plan: it's 20–22% cheaper for them and it funds a quarter of a year of
prizes up front for you.
