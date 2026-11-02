# Cars and weapons — drop folder

1. Put pictures in `vehicles/` or `weapons/`. PNG, JPG or WebP, any size.
   The file name becomes the name: `pegassi-torero.png` → **Pegassi Torero**.
2. Optional: add details in `vehicles.csv` / `weapons.csv`
   (`file,name,category,maker,inspiration,note`). Blank cells are fine.
   `category` drives the filter chips (Super, Muscle, Handgun, Shotgun…).
3. Run `node scripts/import-arsenal.mjs`.
   Pictures are cropped to 16:9 around the subject, converted to WebP and saved in
   `public/media/arsenal/`; the list goes to `src/lib/arsenal.json`, which the guide reads.
