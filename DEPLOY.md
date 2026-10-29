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
2. SQL Editor, paste all of `supabase/schema.sql`, Run.
3. Authentication, Providers: turn on Email, Discord, Twitch, Google (each needs a client ID/secret from that platform's developer portal; callback URL is shown on the provider screen).
4. Authentication, URL Configuration: Site URL `https://livefromleonida.com` (or the Vercel URL); add `http://localhost:3000/**` and `https://*.vercel.app/**` to Redirect URLs.
5. Project Settings, API: copy the Project URL and the `anon` public key.
6. After you sign in once on the live site, make yourself owner in the SQL editor:
   ```sql
   update profiles set role = 'owner', is_admin = true where id = (select id from auth.users where email = 'YOUR@EMAIL');
   ```

## 3. Vercel (5 min)
1. vercel.com/new, Import `leonida-live` from GitHub. Framework: Next.js (auto). Project name: `leonida-live`.
2. Environment Variables (Production + Preview):
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon key
3. Deploy. Then Settings, Domains: add `livefromleonida.com` if you buy it.

## 4. Working in Cursor
```bash
npm install
cp .env.example .env.local   # paste the two Supabase values
npm run dev                   # http://localhost:3000
```
- Without `.env.local` the site runs in preview mode with sample data.
- Push to `main` → Vercel deploys production. Push any other branch → Vercel preview URL. Batch changes on a branch, merge when ready.
- Map refresh after GTADB updates: `./scripts/gtadb-sync.sh` (needs Python + Pillow).
- Static artifact preview build: `./scripts/preview.sh`.

## 5. Socials to register (handle `livefromleonida` everywhere)
YouTube, Twitch, TikTok, X, Instagram, Facebook, Discord server (invite `discord.gg/livefromleonida` needs Server Boost level 3 for a vanity URL; otherwise update the link in `src/lib/content.ts`).
Profile picture: `brand/live-from-leonida-avatar-1000.png`. Banners: `brand/banner-*.png` (YouTube 2560×1440, X 1500×500, Twitch 1200×480, Facebook 1640×624).
