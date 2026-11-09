import Link from "@/components/A";

export const metadata = { title: "Off the map — Live From Leonida" };

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <p className="sign-sm inline-block !text-base">Wrong exit</p>
      <h1 className="display mt-6 text-[clamp(3rem,10vw,7rem)] leading-none">404</h1>
      <p className="mt-4 text-lg text-haze">This road doesn&apos;t go anywhere in Leonida. The page moved, or it never existed.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-hot">Back to the front page</Link>
        <Link href="/clips" className="btn btn-ghost">This week&apos;s clips</Link>
      </div>
    </div>
  );
}
