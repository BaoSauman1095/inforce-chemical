import Image from "next/image";
import { SOCIALS } from "@/lib/constants";

const LINKS = [
  { href: SOCIALS.facebook, label: "Facebook" },
  { href: SOCIALS.youtube, label: "YouTube" },
  { href: SOCIALS.instagram, label: "Instagram" },
  { href: SOCIALS.tiktok, label: "TikTok" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/[.08] pb-24 md:pb-10">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-5 px-5 py-[30px] md:px-7">
        <div className="flex flex-col items-start gap-3">
          <Image
            src="/brand/logo-horizontal-dark.png"
            alt="IN FORCE CHEMICAL"
            width={858}
            height={248}
            className="h-8 w-auto object-contain opacity-90"
          />
          <p className="text-[13.5px] text-paper/45">
            © {year} IN FORCE CHEMICAL. Всі права захищені.
          </p>
        </div>

        <div className="ml-auto flex flex-wrap gap-2.5">
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-white/[.13] px-4 py-2.5 font-heading text-[12.5px] font-semibold tracking-wide text-paper/[.72] transition-colors hover:border-white/35 hover:text-paper"
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
