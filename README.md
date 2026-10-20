# Leonida Live

Weekly GTA VI clip contest (send → staff review → compilation video → public vote → top 3 paid 50/30/20) plus **Versus**: live console-vs-console challenges on Twitch, and a Leonida guide built from Rockstar's official press kit.

Stack: Next.js 15 (App Router) · Tailwind 4 · Supabase (auth, Postgres, storage) · Vercel.

## Run locally
```bash
npm install
npm run dev
```
Without env vars the site runs in **preview mode** with sample data and a demo admin user.

## Go live
1. Create a Supabase project, run `supabase/schema.sql` in the SQL editor.
2. Enable auth providers: Email, Discord, Twitch, Google.
3. Copy `.env.example` to `.env.local` (and to Vercel env):
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Make yourself staff: `update profiles set is_admin = true where id = '<your user id>';`

## Pages
| Route | What it does |
|---|---|
| `/` | Hero, prize split, how it works, Versus, guide, affiliate shop |
| `/clips` | Current round, compilation embed, vote (1 per account, movable) |
| `/submit` | Upload file / paste link with gamertag; claim a clip that's yours |
| `/dashboard` | My clips, votes, winnings, redeem, gamertag proof, payout method |
| `/versus` | Formats, match flow, apply to play |
| `/leonida` | Places, people, Ultimate Edition / Vintage pack items, guides |
| `/admin` | Review queue (keyboard A/R/J/K), weekly round, payouts, claims, Versus |
| `/rules` | Draft contest rules (needs legal review) |

## Content updates
Edit `src/lib/content.ts` when Rockstar publishes new info. Press-kit images live in `public/media` (converted by `scripts/assets.sh`).

## Not built yet
- Xbox gamertag auto-verification (needs Microsoft/Xbox Live app approval); PSN uses a profile code checked by staff.
- Automatic payouts (PayPal Payouts API) — staff mark paid with a transaction ref for now.
- Higgsfield integration (no confirmed public API) — edited link is pasted in review.
- PC uploader app, mobile app (Expo, same Supabase backend).

## Map data
The Leonida map uses GTADB open data: "GTA VI Landmarks Data (CC BY 4.0) — https://map.gtadb.org" and "GTA VI Map Tiles (CC BY 4.0) — https://map.gtadb.org". Refresh with `./scripts/gtadb-sync.sh --photos` (git pulls https://github.com/rolux/gtadb.org). We simplify the data (fewer fields, resized photos); the attribution line on the map must stay.
