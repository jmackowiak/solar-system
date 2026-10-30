import { useEffect, useId, useRef, useState } from "react";
import type { Language } from "./i18n";
import Icon from "./Icon";

type CopyStatus = "copying" | "copied" | "manual";

export default function ShareDialog({ language, url, onClose }: {
  language: Language;
  url: string;
  onClose: () => void;
}) {
  const en = language === "en";
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const mounted = useRef(false);
  const [copy, setCopy] = useState<{ url: string; status: CopyStatus } | null>(null);
  const status = copy?.url === url ? copy.status : null;
  const id = useId();
  useEffect(() => {
    mounted.current = true;
    const element = dialog.current;
    if (element && !element.open) element.showModal();
    input.current?.focus({ preventScroll: true });
    input.current?.select();
    return () => {
      mounted.current = false;
      if (element?.open) element.close();
    };
  }, []);
  const copyLink = async () => {
    setCopy({ url, status: "copying" });
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(url);
      if (mounted.current) setCopy({ url, status: "copied" });
    } catch {
      if (!mounted.current) return;
      setCopy({ url, status: "manual" });
      input.current?.focus({ preventScroll: true });
      input.current?.select();
    }
  };
  return <dialog ref={dialog} className="share-dialog" aria-labelledby={`${id}-heading`}
    aria-describedby={`${id}-description ${id}-paused`}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
    }}>
    <div className="share-dialog-heading">
      <div><span className="eyebrow">{en ? "A PLACE WORTH SHARING" : "MIEJSCE WARTE ODKRYCIA"}</span>
        <h2 id={`${id}-heading`}>{en ? "Share view" : "Udostępnij widok"}</h2></div>
      <button className="round-button" onClick={onClose} aria-label={en ? "Close sharing" : "Zamknij udostępnianie"}>
        <Icon name="close" />
      </button>
    </div>
    <p id={`${id}-description`} className="share-description">{en
      ? "Send someone straight to this view, with the selected object, system, simulation time and camera framing."
      : "Wyślij komuś ten widok — z wybranym obiektem, układem, czasem symulacji i kadrem kamery."}</p>
    <label className="share-link-label" htmlFor={`${id}-link`}>{en ? "View link" : "Link do widoku"}</label>
    <input ref={input} id={`${id}-link`} className="share-link-input" value={url} readOnly
      spellCheck={false} autoCapitalize="off" autoComplete="off" onFocus={event => event.currentTarget.select()} />
    <div className="share-paused" id={`${id}-paused`}><Icon name="pause" size={13} />
      {en ? "The shared view opens paused." : "Udostępniony widok otworzy się z wstrzymaną symulacją."}
    </div>
    <button className="share-copy-button" disabled={status === "copying"} onClick={copyLink}>
      {status === "copying" ? (en ? "Copying…" : "Kopiowanie…") : (en ? "Copy link" : "Kopiuj link")}
    </button>
    <p className={`share-copy-status ${status === "manual" ? "manual" : ""}`} role="status" aria-live="polite" aria-atomic="true">
      {status === "copied" ? (en ? "Link copied. Ready to share." : "Link skopiowany. Możesz go udostępnić.")
        : status === "manual" ? (en
          ? "The link is selected. Copy it with Ctrl+C / ⌘C or your device’s Copy command."
          : "Link jest zaznaczony. Skopiuj go skrótem Ctrl+C / ⌘C lub opcją Kopiuj na swoim urządzeniu.") : ""}
    </p>
  </dialog>;
}
