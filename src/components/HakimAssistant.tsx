import { FormEvent, useEffect, useRef, useState } from "react";
import { Bot, BrainCircuit, LoaderCircle, MessageSquare, Pill, Plus, Send, ShieldAlert, Sparkles, Stethoscope, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { useApp } from "../contexts/AppContext";
import { api } from "../services/api";

interface ChatMessage { _id?: string; role: "user" | "assistant"; content: string; intent?: string; suggestions?: string[] }
interface Conversation { _id: string; title: string; preview: string; updatedAt: string; messageCount: number }

export function HakimAssistant() {
  const { language, dir } = useApp();
  const ar = language === "ar";
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { api.aiConversations().then(async items => { setConversations(items); if (items[0]) await openConversation(items[0]._id); else setLoading(false); }).catch(error => { toast.error(error.message); setLoading(false); }); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sending]);

  async function send(text = message) {
    const clean = text.trim();
    if (!clean || sending) return;
    setMessage(""); setSending(true);
    setMessages(items => [...items, { role: "user", content: clean }]);
    try {
      const result = await api.aiChat({ message: clean, language, conversationId });
      setConversationId(result.conversationId);
      setMessages(items => [...items, { role: "assistant", content: result.reply, intent: result.intent, suggestions: result.suggestions }]);
      api.aiConversations().then(setConversations);
    } catch (error) {
      setMessages(items => items.slice(0, -1));
      toast.error(error instanceof Error ? error.message : (ar ? "حكيم غير متاح مؤقتًا" : "Hakim is temporarily unavailable"));
    } finally { setSending(false); }
  }

  function submit(event: FormEvent) { event.preventDefault(); void send(); }
  async function openConversation(id: string) {
    setLoading(true);
    try { const result = await api.aiHistory(id); setConversationId(result.conversationId); setMessages(result.messages || []); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Error"); }
    finally { setLoading(false); }
  }
  function newChat() { setConversationId(null); setMessages([]); setMessage(""); setLoading(false); }
  async function clearChat() {
    if (!conversationId) return newChat();
    try { await api.clearAIConversation(conversationId); const next = conversations.filter(item => item._id !== conversationId); setConversations(next); if (next[0]) await openConversation(next[0]._id); else newChat(); toast.success(ar ? "تم حذف المحادثة" : "Conversation deleted"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Error"); }
  }

  const suggestions = messages.at(-1)?.role === "assistant" ? messages.at(-1)?.suggestions || [] : [];
  const starters = ar ? ["عندي صداع من امبارح", "إيه تحذيرات باندول؟", "محتاج دكتور باطنة"] : ["I have had a headache since yesterday", "What are Panadol warnings?", "I need an internist"];

  return <div className="hakim-workspace" dir={dir}><aside className="hakim-history"><div><span>{ar ? "محادثاتك" : "Your chats"}</span><button onClick={newChat}><Plus /></button></div><button className={!conversationId ? "active" : ""} onClick={newChat}><MessageSquare /><span><b>{ar ? "محادثة جديدة" : "New conversation"}</b><small>{ar ? "ابدأ سؤالًا جديدًا" : "Start a new question"}</small></span></button>{conversations.map(item => <button key={item._id} className={conversationId === item._id ? "active" : ""} onClick={() => openConversation(item._id)}><MessageSquare /><span><b>{item.title}</b><small>{new Date(item.updatedAt).toLocaleDateString(ar ? "ar-EG" : "en-US")}</small></span></button>)}</aside><div className="hakim-page">
    <header className="hakim-header"><div className="hakim-identity"><span><BrainCircuit /></span><div><small><Sparkles />{ar ? "مساعد سلامتك الذكي" : "Salamtak intelligent assistant"}</small><h2>{ar ? "حكيم" : "Hakim"}</h2><p>{ar ? "اسأل عن أعراضك، دواء، أو أقرب تخصص مناسب بخطوات واضحة." : "Ask about symptoms, medication, or the right specialty in clear steps."}</p></div></div><div className="hakim-status"><i />{ar ? "متصل الآن" : "Online now"}</div><button className="hakim-new" onClick={newChat}><Plus />{ar ? "محادثة جديدة" : "New chat"}</button>{conversationId && <button className="hakim-delete" onClick={clearChat} aria-label={ar ? "حذف المحادثة" : "Delete conversation"}><Trash2 /></button>}</header>
    <section className="hakim-safety"><ShieldAlert /><div><b>{ar ? "معلومة إرشادية، مش تشخيص" : "Guidance, not a diagnosis"}</b><span>{ar ? "حكيم لا يحدد جرعات ولا يستبدل الطبيب. في الطوارئ اتصل بالإسعاف 123 فورًا." : "Hakim does not prescribe doses or replace a doctor. In emergencies, call emergency services."}</span></div></section>
    <div className="hakim-chat">
      {loading ? <div className="hakim-loading"><LoaderCircle className="login-loader" />{ar ? "بنجهز حكيم..." : "Preparing Hakim..."}</div> : !messages.length ? <div className="hakim-welcome"><span><Bot /></span><h3>{ar ? "أهلًا، أنا حكيم" : "Hi, I'm Hakim"}</h3><p>{ar ? "هسألك أسئلة قصيرة عشان أفهم حالتك، وأقدر أبحث لك في الأدوية والأطباء المتاحين على سلامتك." : "I'll ask short questions and can search Salamtak's medicines and available doctors."}</p><div>{starters.map((item, index) => <button key={item} onClick={() => send(item)}>{index === 0 ? <UserRound /> : index === 1 ? <Pill /> : <Stethoscope />}{item}</button>)}</div></div> : <div className="hakim-messages">{messages.map((item, index) => <article key={item._id || index} className={`hakim-message ${item.role}`}><span>{item.role === "assistant" ? <Bot /> : <UserRound />}</span><div><small>{item.role === "assistant" ? (ar ? "حكيم" : "Hakim") : (ar ? "أنت" : "You")}</small><p>{item.content}</p></div></article>)}{sending && <article className="hakim-message assistant"><span><Bot /></span><div><small>{ar ? "حكيم" : "Hakim"}</small><div className="hakim-typing"><i /><i /><i /></div></div></article>}<div ref={endRef} /></div>}
    </div>
    {!!suggestions.length && !sending && <div className="hakim-suggestions">{suggestions.slice(0, 4).map(item => <button key={item} onClick={() => send(item)}>{item}</button>)}</div>}
    <form className="hakim-composer" onSubmit={submit}><textarea value={message} onChange={event => setMessage(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} maxLength={600} rows={1} placeholder={ar ? "اكتب سؤالك لحكيم..." : "Ask Hakim..."} /><button disabled={!message.trim() || sending} aria-label={ar ? "إرسال" : "Send"}>{sending ? <LoaderCircle className="login-loader" /> : <Send />}</button><small>{ar ? "Enter للإرسال • Shift + Enter لسطر جديد" : "Enter to send • Shift + Enter for a new line"}</small></form>
  </div></div>;
}
