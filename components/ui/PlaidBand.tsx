import { cx } from "./cx";

// Mustard plaid band for the landing hero only. Pattern lives in `.plaid` in globals.css.
export default function PlaidBand({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className={cx("plaid border-b-2 border-ink px-5 pt-[26px] pb-[54px] sm:px-10", className)}>
      {children}
    </section>
  );
}
