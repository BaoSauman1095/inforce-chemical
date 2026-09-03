"use client";

import { cn } from "@/lib/utils";

/**
 * Спільні примітиви для всіх форм сайту. Раніше кожна форма мала власну
 * копію тих самих інпутів, ханіпота, блоку помилки й кнопки зі спінером —
 * тепер розмітка й стилі живуть тут в одному місці.
 */

const FIELD_CLASS =
  "w-full rounded-[11px] border border-[#dcd8d5] bg-white px-4 py-3.5 text-[15px] text-[#141414] outline-none transition-colors focus:border-brand";

export function FormInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(FIELD_CLASS, className)} />;
}

export function FormTextarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(FIELD_CLASS, "resize-y", className)} />;
}

/**
 * Приховане поле-пастка: справжні відвідувачі його не заповнюють, наївні
 * боти — заповнюють. Саме `display: none`, а не винесення за екран:
 * автозаповнення й менеджери паролів знаходять «невидимі» позиційовані
 * інпути і мовчки псують форму справжньому користувачу.
 */
export function Honeypot({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="text"
      tabIndex={-1}
      autoComplete="off"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="hidden"
      aria-hidden="true"
    />
  );
}

export function FormError({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700"
    >
      {children}
    </p>
  );
}

export function FormSuccess({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <p className="font-heading text-[17px] font-bold text-brand">{title}</p>
      {children && (
        <div className="mt-2 text-sm leading-relaxed text-[#5f5b58]">{children}</div>
      )}
    </div>
  );
}

export function SubmitButton({
  loading,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading: boolean }) {
  return (
    <button
      {...props}
      type="submit"
      disabled={loading || props.disabled}
      className={cn(
        "flex items-center justify-center gap-2 rounded-[11px] bg-brand px-6 py-4 font-heading text-[15px] font-bold tracking-wide text-white shadow-cta transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
    >
      {loading ? (
        <>
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          Надсилаємо…
        </>
      ) : (
        children
      )}
    </button>
  );
}

/** Ім'я + телефон — однакова пара полів у кожній формі сайту. */
export function NamePhoneFields({
  name,
  phone,
  onChange,
}: {
  name: string;
  phone: string;
  onChange: (field: "name" | "phone", value: string) => void;
}) {
  return (
    <>
      <FormInput
        type="text"
        required
        minLength={2}
        autoComplete="name"
        placeholder="Ім'я"
        value={name}
        onChange={(e) => onChange("name", e.target.value)}
      />
      <FormInput
        type="tel"
        required
        autoComplete="tel"
        placeholder="Телефон, напр. 0671234567"
        value={phone}
        onChange={(e) => onChange("phone", e.target.value)}
      />
    </>
  );
}
