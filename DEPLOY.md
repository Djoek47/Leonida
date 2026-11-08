# Live From Leonida: GitHub, Vercel, Supabase, Cursor

## 1. GitHub (5 min)
1. github.com/new, name `leonida-live`, Private, leave every box unticked (no README, no .gitignore).
2. Unzip `leonida-live.tar.gz`, open the folder in Cursor, then in Cursor's terminal:
   ```bash
   git remote add origin https://github.com/<your-account>/leonida-live.git
   git push -u origin main
   ```
   (The project already has its git history; the branch is `main`.)

## 2. Supabase (10 min)
1. supabase.com, New project, name `leonida-live`, region `Canada (Central)` or `US East`.
2. SQL Editor: run `supabase/schema.sql`, then `supabase/schema-v2.sql`, then `supabase/schema-v3.sql`. Order matters — each builds on the last. All three are safe to re-run.
3. Authentication, Providers: turn on Email, Discord, Twitch, Google (each needs a client ID/secret from that platform's developer portal; callback URL is shown on the provider screen).
4. Authentication, URL Configuration: Site URL `https://livefromleonida.com` (or the Vercel URL); add `http://localhost:3000/**` and `https://*.vercel.app/**` to Redirect URLs.
5. Project Settings, API: copy the Project URL and the `anon` public key.
6. After you sign in once on the live site, make yourself owner in the SQL editor:
   ```sql
   update profiles set role = 'owner', is_admin = true where id = (select id from auth.users where email = 'YOUR@EMAIL');
   ```
7. Database, Replication: make sure `chat_messages` is in the `supabase_realtime` publication, or chat won't update live.

## 3. Vercel (5 min)
1. vercel.com/new, Import `leonida-live` from GitHub. Framework: Next.js (auto). Project name: `leonida-live`.
2. Environment Variables (Production + Preview) — see `.env.example`:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon key
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role key (Project Settings → API). **Server only. Never prefix it with `NEXT_PUBLIC_`** — it bypasses every row-level security rule.
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (step 4)
   - `NEXT_PUBLIC_SITE_URL` = the live URL, no trailing slash
3. Deploy. Then Settings, Domains: add `livefromleonida.com` if you buy it.

Without the Stripe keys the site still runs: the subscribe and paid-download
buttons return "payments are not switched on yet" instead of breaking.

## 4. Stripe (15 min)
1. stripe.com, create the account, finish the business profile (needed before live charges).
2. Developers → API keys: copy the **secret key** into Vercel as `STRIPE_SECRET_KEY`.
3. Developers → Webhooks → Add endpoint:
   - URL `https://livefromleonida.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.created`,
     `customer.subscription.updated`, `customer.subscription.deleted`,
     `invoice.payment_succeeded`, `invoice.payment_failed`
   - Copy the signing secret into Vercel as `STRIPE_WEBHOOK_SECRET`.
4. Prices are created on the fly from the `tiers` table, so there is nothing to set up
   in the Stripe dashboard. To change a price, edit the row — no deploy needed:
   ```sql
   update tiers set monthly_cents = 900, annual_cents = 8500 where id = 'hustler';
   ```
5. Test with Stripe's test keys and card `4242 4242 4242 4242` before going live.
   Locally, forward the webhook with `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

## 5. Watermark worker (runs anywhere but Vercel)
`worker/watermark.mjs` stamps the uploader's name onto approved clips with ffmpeg and
puts the stamped copy back in Supabase Storage. Vercel functions have no ffmpeg and time
out, so this runs on any cheap always-on box — a $5 VPS, Fly, Railway, or a Pi at home:
```bash
npm i @supabase/supabase-js        # plus ffmpeg on PATH
SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node worker/watermark.mjs
# or from cron: node worker/watermark.mjs --once
```
It polls `clips` for `watermark_status = 'queued'` and works through them one at a time.
Slow is fine — nothing on the site waits for it.

## 6. Money, month to month
- **Prize money** goes out weekly from the admin console: Prize payouts tab.
- **Creator download earnings** go out monthly: Creator payouts tab → pick the month →
  Create payouts. That cuts one row per creator over the $10 minimum and stamps their
  downloads as paid. Then pay each by PayPal, Venmo, Cash App, Interac or Wise and hit
  Mark paid. Nothing is sent automatically, so a mistake can't send real money.
- Every subscription, credit, download and payout is written to `money_events`. That's
  the table to export at tax time.

## 7. Working in Cursor
```bash
npm install
cp .env.example .env.local   # paste the Supabase and Stripe values
npm run dev                   # http://localhost:3000
```
- Without `.env.local` the site runs in preview mode with sample data.
- Push to `main` → Vercel deploys production. Push any other branch → Vercel preview URL. Batch changes on a branch, merge when ready.
- Map refresh after GTADB updates: `./scripts/gtadb-sync.sh` (needs Python + Pillow).
- Static artifact preview build: `./scripts/preview.sh`.

## 5. Socials to register (handle `livefromleonida` everywhere)
YouTube, Twitch, TikTok, X, Instagram and Facebook, all on the handle `livefromleonida`. Chat lives on the site now, so there is no Discord server to run — Discord is only kept as a sign-in option.
Profile picture: `brand/live-from-leonida-avatar-1000.png`. Banners: `brand/banner-*.png` (YouTube 2560×1440, X 1500×500, Twitch 1200×480, Facebook 1640×624).
