export const metadata = { title: "Credits — Leonida Live" };

export default function Credits() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="display text-6xl md:text-7xl">Credits</h1>
      <section className="mt-10 grid gap-3">
        <h2 className="text-2xl font-extrabold">Leonida map</h2>
        <p className="text-haze">Our map&apos;s styling, layers and curated places are by Leonida Live. The base map tiles and landmark positions are adapted from community work, used under the Creative Commons Attribution 4.0 licence:</p>
        <ul className="list-disc pl-5 text-haze">
          <li>GTA VI Map Tiles (CC BY 4.0), <a className="underline text-foam" href="https://map.gtadb.org" target="_blank" rel="noreferrer">map.gtadb.org</a>, base map by Yanis</li>
          <li>GTA VI Landmarks Data (CC BY 4.0), <a className="underline text-foam" href="https://map.gtadb.org" target="_blank" rel="noreferrer">map.gtadb.org</a>, GTADB and contributors</li>
        </ul>
        <p className="text-haze">Changes we made: recoloured for day and night, added a plain style, reduced the landmarks to a curated set and regrouped them into our own categories. Licence: <a className="underline text-foam" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">creativecommons.org/licenses/by/4.0</a>.</p>
      </section>
      <section className="mt-10 grid gap-3">
        <h2 className="text-2xl font-extrabold">Game artwork and music</h2>
        <p className="text-haze">Grand Theft Auto VI artwork, trailers, logos and music belong to Rockstar Games and Take-Two Interactive. Leonida Live is a fan community and isn&apos;t affiliated with or endorsed by them.</p>
      </section>
    </div>
  );
}
