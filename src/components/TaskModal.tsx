import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useApp } from "../contexts/AppContext";

interface TaskModalProps { title: string; description?: string; children: ReactNode; onClose: () => void; size?: "large" | "wide" }

export function TaskModal({ title, description, children, onClose, size = "large" }: TaskModalProps) {
  const { dir } = useApp();
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return createPortal(<div className="task-modal-backdrop" dir={dir} onMouseDown={onClose}>
    <section className={`task-modal task-modal--${size}`} role="dialog" aria-modal="true" aria-labelledby="task-modal-title" onMouseDown={event => event.stopPropagation()}>
      <header className="task-modal-header"><div><h2 id="task-modal-title">{title}</h2>{description && <p>{description}</p>}</div><button onClick={onClose} aria-label="Close"><X /></button></header>
      <div className="task-modal-body">{children}</div>
    </section>
  </div>, document.body);
}
