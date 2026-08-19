import Link from "next/link";

interface Crumb {
  label: string;
  href?: string;
}

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Хлібні крихти" className="mb-4 flex flex-wrap items-center gap-1.5 text-[13px]">
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-paper/30">/</span>}
          {item.href ? (
            <Link href={item.href} className="text-paper/50 transition-colors hover:text-paper">
              {item.label}
            </Link>
          ) : (
            <span className="text-paper/80">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
