import NextLink from "next/link";
import type { ComponentProps } from "react";

/** Link that also works in the static preview (plain relative <a>, resolved against a <base> tag). */
export default function Link({ href, ...rest }: ComponentProps<typeof NextLink>) {
  if (process.env.NEXT_PUBLIC_STATIC === "1" && typeof href === "string" && href.startsWith("/")) {
    const m = href.match(/^([^?#]*)(.*)$/)!;
    const rel = m[1] === "/" ? "index.html" : `${m[1].slice(1).replace(/\/$/, "")}/index.html`;
    return <a href={rel + m[2]} {...(rest as object)} />;
  }
  return <NextLink href={href} {...rest} />;
}
