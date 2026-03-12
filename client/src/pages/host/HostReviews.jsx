import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getHostReviewsDashboard } from "../../api/hostReviews";
import { replyToReview } from "../../api/reviews";

function StatCard({ label, value, sub, tone = "default" }) {
  const tones = {
    default: "bg-white border-slate-200",
    dark: "bg-slate-900 border-slate-900 text-white",
    gold: "bg-amber-50 border-amber-200",
    green: "bg-emerald-50 border-emerald-200",
  };

  return (
    <div
      className={`rounded-[24px] border p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] ${tones[tone] || tones.default}`}
    >
      <div
        className={`text-xs font-medium ${
          tone === "dark" ? "text-white/70" : "text-slate-500"
        }`}
      >
        {label}
      </div>
      <div
        className={`mt-2 text-2xl font-bold ${
          tone === "dark" ? "text-white" : "text-slate-900"
        }`}
      >
        {value}
      </div>
      {sub ? (
        <div
          className={`mt-1 text-xs ${
            tone === "dark" ? "text-white/70" : "text-slate-500"
          }`}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
}

function RatingRow({ star, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="w-12 text-sm font-medium text-slate-700">{star}★</div>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-3 rounded-full bg-black transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="w-12 text-right text-sm text-slate-600">{count}</div>
    </div>
  );
}

function ReviewToneBadge({ rating }) {
  if (rating >= 5) {
    return (
      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
        Excellent
      </span>
    );
  }

  if (rating >= 4) {
    return (
      <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
        Positive
      </span>
    );
  }

  if (rating >= 3) {
    return (
      <span className="inline-flex items-center rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-700">
        Mixed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
      Needs attention
    </span>
  );
}

export default function HostReviews() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const [replyBox, setReplyBox] = useState({});
  const [replyLoadingId, setReplyLoadingId] = useState("");

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const res = await getHostReviewsDashboard();
      setData(res.data);
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to load host reviews");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleReply(reviewId) {
    const text = (replyBox[reviewId] || "").trim();
    if (!text) return;

    try {
      setReplyLoadingId(reviewId);
      await replyToReview(reviewId, text);
      await load();
      setReplyBox((prev) => ({ ...prev, [reviewId]: "" }));
    } catch (e) {
      alert(e.response?.data?.message || "Failed to save reply");
    } finally {
      setReplyLoadingId("");
    }
  }

  const meta = data?.meta || {
    totalReviews: 0,
    averageRating: 0,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-amber-300/10 blur-3xl" />

          <div className="relative z-[1] flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 shadow-sm sm:text-sm">
                <span>⭐ Reputation dashboard</span>
                <span className="text-white/30">•</span>
                <span>Guest feedback insights</span>
              </div>

              <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Host Reviews
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
                Track guest satisfaction, review listing performance, and reply
                professionally to build trust and strengthen your hosting brand.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/80">
                  📈 Rating insights
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/80">
                  💬 Reply to feedback
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/80">
                  🏡 Listing reputation
                </span>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={load}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Refresh Reviews
              </button>

              <Link
                to="/host/listings"
                className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Back to Listings
              </Link>
            </div>
          </div>
        </div>

        {err && (
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {err}
          </div>
        )}

        {loading ? (
          <div className="mt-6 rounded-[24px] border border-slate-200 bg-white p-5 text-slate-600 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            Loading reviews...
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Average Rating"
                value={`⭐ ${meta.averageRating || 0}`}
                sub="Overall guest satisfaction"
                tone="dark"
              />
              <StatCard
                label="Total Reviews"
                value={meta.totalReviews || 0}
                sub="Across all your listings"
                tone="default"
              />
              <StatCard
                label="5★ Reviews"
                value={meta.breakdown?.["5"] || 0}
                sub="Top satisfaction level"
                tone="gold"
              />
              <StatCard
                label="Positive Share"
                value={
                  meta.totalReviews > 0
                    ? `${Math.round(
                        (((meta.breakdown?.["5"] || 0) +
                          (meta.breakdown?.["4"] || 0)) /
                          meta.totalReviews) *
                          100,
                      )}%`
                    : "0%"
                }
                sub="4★ and 5★ reviews"
                tone="green"
              />
            </div>

            {/* Breakdown + listing summary */}
            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)] sm:p-6">
                <div className="text-xl font-bold text-slate-900">
                  Rating Breakdown
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  Distribution of ratings across all reviews
                </div>

                <div className="mt-6 space-y-4">
                  <RatingRow
                    star={5}
                    count={meta.breakdown?.["5"] || 0}
                    total={meta.totalReviews || 0}
                  />
                  <RatingRow
                    star={4}
                    count={meta.breakdown?.["4"] || 0}
                    total={meta.totalReviews || 0}
                  />
                  <RatingRow
                    star={3}
                    count={meta.breakdown?.["3"] || 0}
                    total={meta.totalReviews || 0}
                  />
                  <RatingRow
                    star={2}
                    count={meta.breakdown?.["2"] || 0}
                    total={meta.totalReviews || 0}
                  />
                  <RatingRow
                    star={1}
                    count={meta.breakdown?.["1"] || 0}
                    total={meta.totalReviews || 0}
                  />
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)] sm:p-6 lg:col-span-2">
                <div className="text-xl font-bold text-slate-900">
                  Listing Summary
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  Performance snapshot for each reviewed listing
                </div>

                <div className="mt-5 space-y-3">
                  {(data?.listingSummary || []).length === 0 ? (
                    <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                      No reviews yet for your listings.
                    </div>
                  ) : (
                    data.listingSummary.map((item) => (
                      <div
                        key={item.listingId}
                        className="flex items-center justify-between gap-4 rounded-[22px] border border-slate-200 bg-slate-50/80 p-4"
                      >
                        <div className="min-w-0">
                          <div className="line-clamp-1 font-semibold text-slate-900">
                            {item.title}
                          </div>
                          <div className="mt-1 line-clamp-1 text-sm text-slate-500">
                            {item.locationText}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <div className="font-semibold text-slate-900">
                            ⭐ {item.averageRating || 0}
                          </div>
                          <div className="text-sm text-slate-500">
                            {item.totalReviews} review
                            {item.totalReviews !== 1 ? "s" : ""}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Latest feedback */}
            <div className="mt-8 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)] sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-xl font-bold text-slate-900">
                    Latest Guest Feedback
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Review recent comments and respond where needed
                  </div>
                </div>

                <div className="text-sm text-slate-500">
                  {(data?.latestReviews || []).length} recent review
                  {(data?.latestReviews || []).length !== 1 ? "s" : ""}
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {(data?.latestReviews || []).length === 0 ? (
                  <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                    <div className="text-lg font-semibold text-slate-800">
                      No reviews yet
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      Once guests leave feedback, it will appear here.
                    </p>
                  </div>
                ) : (
                  data.latestReviews.map((r) => (
                    <div
                      key={r._id}
                      className="rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
                    >
                      <div className="border-b border-slate-100 bg-gradient-to-r from-white to-slate-50 px-5 py-5 sm:px-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="font-semibold text-slate-900">
                                {r.guestId?.name || r.guestId?.email || "Guest"}
                              </div>
                              <ReviewToneBadge rating={r.rating} />
                            </div>

                            <div className="mt-2 text-xs text-slate-500">
                              {r.listingId?.title || "Listing"} •{" "}
                              {new Date(r.createdAt).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-900">
                            ⭐ {r.rating}/5
                          </div>
                        </div>
                      </div>

                      <div className="px-5 py-5 sm:px-6">
                        <div className="rounded-[20px] bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700">
                          {r.comment || "No comment provided."}
                        </div>

                        {r.hostReply?.text ? (
                          <div className="mt-4 rounded-[20px] border border-slate-200 bg-white p-4">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Host reply
                            </div>
                            <div className="mt-2 text-sm leading-7 text-slate-700">
                              {r.hostReply.text}
                            </div>
                            {r.hostReply.repliedAt && (
                              <div className="mt-2 text-xs text-slate-500">
                                Replied on{" "}
                                {new Date(
                                  r.hostReply.repliedAt,
                                ).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="mt-4 rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                            <div className="text-sm font-semibold text-slate-800">
                              Write a reply
                            </div>
                            <textarea
                              value={replyBox[r._id] || ""}
                              onChange={(e) =>
                                setReplyBox((prev) => ({
                                  ...prev,
                                  [r._id]: e.target.value,
                                }))
                              }
                              placeholder="Thank the guest, acknowledge their feedback, and respond professionally..."
                              className="mt-3 min-h-[110px] w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black"
                            />

                            <button
                              onClick={() => handleReply(r._id)}
                              disabled={replyLoadingId === r._id}
                              className="mt-3 rounded-2xl bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                            >
                              {replyLoadingId === r._id ? "Saving..." : "Reply"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}