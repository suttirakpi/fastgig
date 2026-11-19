import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, errorMessage } from "../lib/api";
import { formatPay } from "../lib/format";
import type { ChatJob, ChatReply } from "../lib/types";

interface Msg {
  id: number;
  from: "user" | "bot";
  text: string;
  jobs?: ChatJob[];
  action?: ChatReply["action"];
}

const GREETING: Msg = {
  id: 0,
  from: "bot",
  text: 'สวัสดีครับ! พิมพ์งานที่คุณสนใจได้เลย เช่น "ทำสีบ้าน", "อาหาร", "ขนของ" หรือพิมพ์ "ลงงาน" ถ้าต้องการจ้างคน',
};

export default function ChatAssistant() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const nextId = useRef(1);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy, open]);

  function push(msg: Omit<Msg, "id">) {
    setMessages((m) => [...m, { ...msg, id: nextId.current++ }]);
  }

  async function onSend(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    push({ from: "user", text });
    setBusy(true);
    try {
      const { data } = await api.post<ChatReply>("/chat", { message: text });
      push({
        from: "bot",
        text: data.reply,
        jobs: data.jobs,
        action: data.action,
      });
    } catch (err) {
      push({ from: "bot", text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  function goCreate(category: string | null) {
    setOpen(false);
    navigate(
      category
        ? `/jobs/new?category=${encodeURIComponent(category)}`
        : "/jobs/new",
    );
  }

  if (!open) {
    return (
      <button
        className="chat-fab"
        aria-label="เปิดแชทผู้ช่วยหางาน"
        onClick={() => setOpen(true)}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
          <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" />
        </svg>
      </button>
    );
  }

  return (
    <section className="chat-sheet" aria-label="ผู้ช่วยหางาน">
      <header className="chat-head">
        <strong>Chatbot ผู้ช่วยหางาน</strong>
        <button
          className="chat-close"
          aria-label="ปิดแชท"
          onClick={() => setOpen(false)}
        >
          ✕
        </button>
      </header>

      <div className="chat-body">
        {messages.map((m) => (
          <div
            key={m.id}
            className={m.from === "user" ? "bubble user" : "bubble bot"}
          >
            <div>{m.text}</div>
            {m.jobs?.map((j) => (
              <div className="chat-job" key={j.id}>
                <strong>{j.title}</strong>
                <span className="muted">{j.description}</span>
                <span className="muted">
                  {formatPay(j.payMin, j.payMax)}
                  {j.locationText ? ` · ${j.locationText}` : ""}
                </span>
                <Link
                  className="btn btn-small"
                  to={`/jobs/${j.id}`}
                  onClick={() => setOpen(false)}
                >
                  ดูรายละเอียด
                </Link>
              </div>
            ))}
            {m.action?.type === "create_job" && (
              <button
                className="btn btn-small"
                onClick={() => goCreate(m.action?.category ?? null)}
              >
                ไปหน้าสร้างงาน
              </button>
            )}
          </div>
        ))}
        {busy && <div className="bubble bot typing">กำลังคิด...</div>}
        <div ref={endRef} />
      </div>

      <form className="chat-input" onSubmit={(e) => void onSend(e)}>
        <input
          className="input"
          placeholder="พิมพ์ข้อความ..."
          value={input}
          maxLength={300}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="btn btn-small" disabled={busy || !input.trim()}>
          Send
        </button>
      </form>
    </section>
  );
}
