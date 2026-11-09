"use client";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <p className="sign-sm inline-block !text-base">Wasted</p>
      <h1 className="display mt-6 text-5xl md:text-7xl leading-none">Something broke.</h1>
      <p className="mt-4 text-lg text-haze">That one&apos;s on us. Nothing you did is lost: try again, and if it keeps happening, tell staff in the chat.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button onClick={reset} className="btn btn-hot">Try again</button>
        <button onClick={() => { location.href = "/"; }} className="btn btn-ghost">Front page</button>
      </div>
    </div>
  );
}
