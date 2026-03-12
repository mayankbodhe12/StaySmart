import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notifications";
import { socket } from "../lib/socket";
import useAuthStore from "../store/authStore";

export default function NotificationBell() {
  const user = useAuthStore((s) => s.user);

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const wrapperRef = useRef(null);

  async function load() {
    try {
      const res = await getMyNotifications();
      setItems(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {}
  }

  useEffect(() => {
    if (!user) return;

    load();

    const userId = user?._id || user?.id || user?.sub;
    if (userId) {
      socket.emit("join:user", { userId });
    }

    const onNewNotification = (n) => {
      setItems((prev) => [n, ...prev].slice(0, 50));
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("notification:new", onNewNotification);

    return () => {
      socket.off("notification:new", onNewNotification);
    };
  }, [user]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (!wrapperRef.current?.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleRead(notificationId) {
    try {
      const target = items.find((item) => item._id === notificationId);
      await markNotificationRead(notificationId);

      setItems((prev) =>
        prev.map((item) =>
          item._id === notificationId ? { ...item, isRead: true } : item
        )
      );

      if (target && !target.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {}
  }

  async function handleReadAll() {
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch {}
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        <span>🔔</span>

        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex min-w-[22px] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold text-white shadow">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20 sm:hidden"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="fixed left-3 right-3 top-20 z-50 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-[370px]">
            <div className="border-b border-slate-200 bg-gradient-to-r from-white to-slate-50 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-slate-900">
                    Notifications
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {unreadCount > 0
                      ? `${unreadCount} unread notification${
                          unreadCount !== 1 ? "s" : ""
                        }`
                      : "You're all caught up"}
                  </div>
                </div>

                {items.length > 0 && unreadCount > 0 && (
                  <button
                    onClick={handleReadAll}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto sm:max-h-[430px]">
              {items.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <div className="text-3xl">🔔</div>
                  <div className="mt-3 text-base font-semibold text-slate-900">
                    No notifications yet
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    New updates and alerts will appear here.
                  </div>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item._id}
                    className={`border-b border-slate-100 px-4 py-4 last:border-b-0 ${
                      item.isRead ? "bg-white" : "bg-slate-50/80"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                          item.isRead ? "bg-slate-300" : "bg-emerald-500"
                        }`}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900">
                              {item.title}
                            </div>
                            <div className="mt-1 text-sm leading-6 text-slate-600">
                              {item.message}
                            </div>
                          </div>

                          {!item.isRead && (
                            <button
                              onClick={() => handleRead(item._id)}
                              className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                              Read
                            </button>
                          )}
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="text-xs text-slate-400">
                            {new Date(item.createdAt).toLocaleString()}
                          </div>

                          {item.link && (
                            <Link
                              to={item.link}
                              onClick={() => {
                                handleRead(item._id);
                                setOpen(false);
                              }}
                              className="text-xs font-medium text-slate-900 underline underline-offset-4"
                            >
                              Open
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
