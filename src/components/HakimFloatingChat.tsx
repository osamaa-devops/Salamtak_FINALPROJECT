import { FormEvent, useEffect, useRef, useState } from "react";
import { Bot, ExternalLink, LoaderCircle, MessageCircle, Minus, Plus, Send, X } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { api } from "../services/api";
import { toast } from "sonner@2.0.3";

interface Props { onOpenPage: () => void }
interface Message { role: "user" | "assistant"; content: string }

export function HakimFloatingChat({ onOpenPage }: Props) {
  const { language, dir } = useApp(); const ar = language === "ar";
  const [open, setOpen] = useState(false); const [minimized, setMinimized] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]); const [text, setText] = useState(""); const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!open || historyLoaded) return; api.aiHistory().then(result => { setConversationId(result.conversationId); setMessages(result.messages || []); }).catch(() => {}).finally(() => setHistoryLoaded(true)); }, [open, historyLoaded]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sending]);
  async function send(event?: FormEvent) { event?.preventDefault(); const clean = text.trim(); if (!clean || sending) return; setText(""); setSending(true); setMessages(items => [...items, { role: "user", content: clean }]); try { const result = await api.aiChat({ message: clean, language, conversationId }); setConversationId(result.conversationId); setMessages(items => [...items, { role: "assistant", content: result.reply }]); } catch (error) { setMessages(items => items.slice(0, -1)); toast.error(error instanceof Error ? error.message : "Error"); } finally { setSending(false); } }
  function newChat() { setConversationId(null); setMessages([]); setText(""); setHistoryLoaded(true); }
  return <div className="hakim-float" dir={dir}>{open && <section className={minimized ? "hakim-widget minimized" : "hakim-widget"}><header><span><Bot /></span><div><b>{ar ? "حكيم" : "Hakim"}</b><small><i />{ar ? "مساعدك الصحي متصل" : "Health assistant online"}</small></div><button onClick={newChat} title={ar ? "محادثة جديدة" : "New chat"}><Plus /></button><button onClick={() => setMinimized(v => !v)}>{minimized ? <MessageCircle /> : <Minus />}</button><button onClick={() => setOpen(false)}><X /></button></header>{!minimized && <><div className="hakim-widget-body">{!messages.length ? <div className="hakim-widget-welcome"><Bot /><b>{ar ? "أهلًا، أنا حكيم" : "Hi, I'm Hakim"}</b><p>{ar ? "اسألني عن عرض، دواء، أو تخصص طبي." : "Ask about a symptom, medicine, or specialty."}</p></div> : messages.map((item, index) => <div key={index} className={`hakim-widget-msg ${item.role}`}>{item.content}</div>)}{sending && <div className="hakim-widget-msg assistant typing">•••</div>}<div ref={endRef} /></div><form onSubmit={send}><input value={text} onChange={event => setText(event.target.value)} placeholder={ar ? "اكتب رسالتك..." : "Type your message..."} maxLength={600} /><button disabled={!text.trim() || sending}>{sending ? <LoaderCircle className="login-loader" /> : <Send />}</button></form><button className="hakim-widget-expand" onClick={() => { setOpen(false); onOpenPage(); }}><ExternalLink />{ar ? "فتح حكيم وعرض المحادثات" : "Open Hakim and chat history"}</button></>}</section>}<button className={open ? "hakim-fab active" : "hakim-fab"} onClick={() => { if (open) setOpen(false); else { setOpen(true); setMinimized(false); } }} aria-label={ar ? "فتح حكيم" : "Open Hakim"}>{open ? <X /> : <><Bot /><i /></>}</button></div>;
}
