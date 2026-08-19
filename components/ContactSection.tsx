import { PHONE_DISPLAY, PHONE_TEL, SOCIALS } from "@/lib/constants";
import ContactForm from "./ContactForm";

const SOCIAL_LINKS = [
  {
    href: SOCIALS.instagram,
    name: "Instagram",
    handle: "@inforcechemical_",
    icon: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
      </>
    ),
  },
  {
    href: SOCIALS.tiktok,
    name: "TikTok",
    handle: "@inforcechemical_",
    icon: (
      <path
        fill="currentColor"
        stroke="none"
        d="M16.6 3c.4 2.2 1.9 3.9 4.1 4.2v3.1c-1.5 0-3-.5-4.1-1.3v6.8c0 3.4-2.8 6.2-6.2 6.2S4.2 19.2 4.2 15.8s2.8-6.2 6.2-6.2c.4 0 .8 0 1.2.1v3.2c-.4-.1-.8-.2-1.2-.2-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.4 3-3.1V3h3.2z"
      />
    ),
  },
  {
    href: SOCIALS.facebook,
    name: "Facebook",
    handle: "In Force Chemical",
    icon: (
      <path
        fill="currentColor"
        stroke="none"
        d="M15 3h-2.5C10 3 8.5 4.6 8.5 7.3V10H6v3.5h2.5V21H12v-7.5h2.6L15 10h-3V7.6c0-.9.4-1.4 1.4-1.4H15V3z"
      />
    ),
  },
  {
    href: SOCIALS.youtube,
    name: "YouTube",
    handle: "In Force Chemical",
    icon: (
      <>
        <rect x="2" y="5.5" width="20" height="13" rx="4" fill="currentColor" stroke="none" />
        <path d="M10.5 9.2v5.6l5-2.8z" fill="#0d0d0d" stroke="none" />
      </>
    ),
  },
];

export default function ContactSection() {
  return (
    <section
      id="contacts"
      className="mx-auto max-w-[1240px] scroll-mt-[90px] px-5 pb-24 md:px-7"
    >
      <div className="mb-7 flex items-baseline gap-4">
        <h2 className="font-heading text-[28px] font-extrabold tracking-tight sm:text-[36px] md:text-[44px]">
          Контакти
        </h2>
        <span className="h-px flex-1 bg-white/[.12]" />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6 rounded-[18px] border border-white/10 bg-white/[.03] px-[30px] py-8">
          <div>
            <p className="font-heading text-[11.5px] font-medium uppercase tracking-[.15em] text-paper/45">
              Телефон
            </p>
            <a
              href={`tel:${PHONE_TEL}`}
              className="mt-2.5 block font-heading text-[28px] font-extrabold tracking-tight text-paper transition-colors hover:text-brand-light sm:text-[34px] md:text-[40px]"
            >
              {PHONE_DISPLAY}
            </a>
            <p className="mt-2 text-sm leading-relaxed text-paper/55">
              Безкоштовно з усіх номерів України
            </p>
          </div>

          <div className="h-px bg-white/10" />

          <div>
            <p className="mb-3.5 font-heading text-[11.5px] font-medium uppercase tracking-[.15em] text-paper/45">
              Соцмережі
            </p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.03] px-4 py-3.5 text-paper transition-colors hover:border-brand/70 hover:bg-brand/[.12]"
                >
                  <span className="grid h-[34px] w-[34px] flex-none place-items-center rounded-[9px] bg-brand/[.18] text-brand-light">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      {s.icon}
                    </svg>
                  </span>
                  <span className="flex flex-col">
                    <span className="font-heading text-sm font-semibold">{s.name}</span>
                    <span className="text-[12.5px] text-paper/50">{s.handle}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div className="h-px bg-white/10" />

          <div>
            <p className="font-heading text-[11.5px] font-medium uppercase tracking-[.15em] text-paper/45">
              Логістика
            </p>
            <p className="mt-2.5 text-[15px] leading-relaxed text-paper/[.72]">
              Доставка по всій Україні. Відвантаження зі складу після
              погодження заявки.
            </p>
          </div>
        </div>

        <ContactForm />
      </div>
    </section>
  );
}
