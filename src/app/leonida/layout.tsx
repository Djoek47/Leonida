import type { Metadata } from "next";

export const metadata: Metadata = { title: "The Leonida guide", description: "Everything known about Leonida, GTA VI's state: Vice City, Leonida Keys, Grassrivers, Port Gellhorn, Ambrosia and Mount Kalaga, with the map.", alternates: { canonical: "/leonida" } };

export default function L({ children }: { children: React.ReactNode }) { return children; }
