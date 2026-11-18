/** Lock page scroll while a viewer is open and put the page back exactly where it was on close. */
export function lockScroll(): () => void {
  const y = window.scrollY;
  const prev = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  return () => {
    document.body.style.overflow = prev;
    window.scrollTo(0, y);
    requestAnimationFrame(() => window.scrollTo(0, y));
  };
}
