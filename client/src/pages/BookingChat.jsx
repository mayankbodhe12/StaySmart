import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getBookingMessages,
  sendBookingMessage,
  markBookingMessagesRead,
} from "../api/messages";
import useAuthStore from "../store/authStore";
import { socket } from "../lib/socket";

export default function BookingChat() {
  const { bookingId } = useParams();
  const user = useAuthStore((s) => s.user);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const bottomRef = useRef(null);

  async function load() {
    setErr("");
    setLoading(true);

    try {
      const res = await getBookingMessages(bookingId);
      setMessages(res.data.messages || []);
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to load chat");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      await load();
      try {
        await markBookingMessagesRead(bookingId);
      } catch {}
    })();
  }, [bookingId]);

  useEffect(() => {
    socket.emit("join:booking", { bookingId });

    const onMessage = (msg) => {
      if (String(msg.bookingId) !== String(bookingId)) return;
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("chat:message", onMessage);

    return () => {
      socket.off("chat:message", onMessage);
    };
  }, [bookingId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!text.trim()) return;

    setSending(true);

    try {
      await sendBookingMessage(bookingId, text);
      setText("");
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  const myId = user?._id || user?.id || user?.sub;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">

      <div className="mx-auto max-w-4xl px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between">

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Booking Chat
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              Communicate with your host or guest
            </p>
          </div>

          <Link
            to="/bookings"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back
          </Link>

        </div>

        {err && (
          <div className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {err}
          </div>
        )}

        {/* Chat Container */}
        <div className="mt-6 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)]">

          {/* Messages */}
          <div className="h-[520px] overflow-y-auto bg-slate-50 px-5 py-6 space-y-4">

            {loading ? (
              <div className="text-slate-600 text-sm">
                Loading chat...
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-slate-500 text-sm">
                No messages yet.
              </div>
            ) : (
              messages.map((m) => {

                const mine = String(m.senderId) === String(myId);

                return (
                  <div
                    key={m._id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >

                    <div
                      className={`max-w-[70%] rounded-[20px] px-4 py-3 shadow-sm ${
                        mine
                          ? "bg-black text-white"
                          : "bg-white border border-slate-200 text-slate-800"
                      }`}
                    >

                      <div className="text-[11px] opacity-70 mb-1">
                        {m.senderRole}
                      </div>

                      <div className="text-sm leading-relaxed">
                        {m.text}
                      </div>

                      <div className="text-[11px] opacity-70 mt-2 text-right">
                        {new Date(m.createdAt).toLocaleTimeString()}
                      </div>

                    </div>

                  </div>
                );
              })
            )}

            <div ref={bottomRef} />

          </div>

          {/* Message Input */}
          <div className="border-t border-slate-200 p-4 flex gap-3">

            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
            />

            <button
              onClick={handleSend}
              disabled={sending}
              className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {sending ? "Sending..." : "Send"}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}