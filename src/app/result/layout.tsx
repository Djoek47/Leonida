import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Results: Clip of the Week winners",
  description: "Every Live From Leonida Clip of the Week winner, announced Thursdays at 1:00pm Eastern.",
  alternates: { canonical: "/result" },
};
export default function L({ children }: { children: React.ReactNode }) { return children; }
