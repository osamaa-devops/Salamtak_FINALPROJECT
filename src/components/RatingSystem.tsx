import { useState } from "react";
import { BarChart3, BadgeCheck, CalendarDays, MessageSquare, Plus, Quote, Star, ThumbsUp, TrendingUp, UserRound } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { useApp } from "../contexts/AppContext";
import { api, getStoredUser } from "../services/api";
import { useAsyncData } from "../hooks/useAsyncData";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";

type Category = "doctor" | "clinic" | "lab" | "hospital";
interface Review { id: string; patientName: string; rating: number; comment: string; date: string; verified: boolean; helpful: number; category: Category; targetName: string }
interface Stats { overall: number; totalReviews: number; distribution: Record<number, number>; categories: Record<string, number> }

const emptyStats: Stats = { overall: 0, totalReviews: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, categories: { quality: 0, waiting: 0, staff: 0, cleanliness: 0, value: 0 } };

export function RatingSystem(_props?: { onNavigate?: (state: string) => void; onBack?: () => void }) {
  const { dir, language } = useApp();
  const ar = language === "ar";
  const currentUser = getStoredUser();
  const isDoctor = currentUser?.role === "doctor";
  const [category, setCategory] = useState<Category>("doctor");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ targetId: "", rating: 0, comment: "", quality: 0, waiting: 0 });
  const activeCategory: Category = isDoctor ? "doctor" : category;
  const { data, setData, isLoading, error } = useAsyncData(
    () => api.reviews(activeCategory, ratingFilter || undefined, isDoctor ? currentUser?._id : undefined),
    [activeCategory, ratingFilter, isDoctor ? currentUser?._id : "", refreshKey],
  );
  const { data: doctorData } = useAsyncData(() => isDoctor ? Promise.resolve([]) : api.doctors(), [isDoctor]);
  const doctors = Array.isArray(doctorData) ? doctorData : [];

  const rawStats = data?.stats || {};
  const stats: Stats = {
    overall: Number(rawStats.overall) || 0,
    totalReviews: Number(rawStats.totalReviews) || 0,
    distribution: { ...emptyStats.distribution, ...(rawStats.distribution || {}) },
    categories: { ...emptyStats.categories, ...(rawStats.categories || {}) },
  };
  const reviewItems = Array.isArray(data?.items) ? data.items : [];
  const reviews: Review[] = reviewItems.map((review: any, index: number) => ({
    id: String(review?._id || index),
    patientName: String(review?.patientName || (ar ? "مريض" : "Patient")),
    rating: Math.min(5, Math.max(0, Number(review?.rating) || 0)),
    comment: String(review?.comment || ""),
    date: review?.createdAt ? String(review.createdAt).slice(0, 10) : "-",
    verified: Boolean(review?.verified), helpful: Number(review?.helpful) || 0,
    category: review?.category || "doctor", targetName: String(review?.targetName || "-"),
  }));
  const positiveCount = (stats.distribution[5] || 0) + (stats.distribution[4] || 0);
  const positiveRate = stats.totalReviews ? Math.round((positiveCount / stats.totalReviews) * 100) : 0;

  function Stars({ value, interactive, onChange, size = "normal" }: { value: number; interactive?: boolean; onChange?: (value: number) => void; size?: "normal" | "large" }) {
    return <div className={`rating-stars ${interactive ? "interactive" : ""} ${size}`}>{[1,2,3,4,5].map((star) => <button type="button" key={star} disabled={!interactive} className={star <= value ? "filled" : ""} onClick={() => onChange?.(star)} aria-label={`${star}`}><Star /></button>)}</div>;
  }

  async function markHelpful(id: string) {
    try {
      const updated = await api.markReviewHelpful(id);
      setData({ stats, items: reviewItems.map((review: any) => review._id === id ? updated : review) });
    } catch (helpfulError) { toast.error(helpfulError instanceof Error ? helpfulError.message : "Error"); }
  }

  async function submitReview() {
    const selectedDoctor = doctors.find((doctor: any) => doctor.user?._id === form.targetId);
    if (activeCategory === "doctor" && !selectedDoctor) return toast.error(ar ? "اختر الطبيب أولاً" : "Choose a doctor first");
    if (!form.rating) return toast.error(ar ? "اختر التقييم العام" : "Choose an overall rating");
    if (form.comment.trim().length < 10) return toast.error(ar ? "اكتب تعليقًا من 10 أحرف على الأقل" : "Write at least 10 characters");
    setSaving(true);
    try {
      await api.createReview({
        targetId: activeCategory === "doctor" ? form.targetId : undefined,
        targetName: activeCategory === "doctor" ? selectedDoctor.user.name : activeCategory,
        category: activeCategory, rating: form.rating, comment: form.comment.trim(),
        categories: { quality: form.quality, waiting: form.waiting, staff: 0, cleanliness: 0, value: 0 },
      });
      setForm({ targetId: "", rating: 0, comment: "", quality: 0, waiting: 0 });
      setShowForm(false); setRefreshKey((value) => value + 1);
      toast.success(ar ? "تم نشر تقييمك، شكرًا لك" : "Your review was published");
    } catch (submitError) { toast.error(submitError instanceof Error ? submitError.message : (ar ? "تعذر نشر التقييم" : "Unable to publish review")); }
    finally { setSaving(false); }
  }

  const categoryLabels: Record<Category, string> = {
    doctor: ar ? "الأطباء" : "Doctors", clinic: ar ? "العيادات" : "Clinics",
    lab: ar ? "المعامل" : "Labs", hospital: ar ? "المستشفيات" : "Hospitals",
  };
  const detailLabels: Record<string, string> = {
    quality: ar ? "جودة الرعاية" : "Care quality", waiting: ar ? "وقت الانتظار" : "Waiting time",
    staff: ar ? "التعامل" : "Staff", cleanliness: ar ? "النظافة" : "Cleanliness", value: ar ? "القيمة مقابل السعر" : "Value",
  };

  return <div className="ratings-v2" dir={dir}>
    <header className="ratings-v2-head"><div><span>{ar ? "جودة الرعاية" : "Care quality"}</span><h2>{isDoctor ? (ar ? "آراء مرضاك" : "Patient feedback") : (ar ? "التقييمات" : "Reviews")}</h2><p>{isDoctor ? (ar ? "اعرف ما يقدّره المرضى وما يمكن تحسينه في تجربتهم معك." : "See what patients value and what can improve in their experience.") : (ar ? "شارك تجربتك بوضوح لمساعدة الآخرين وتحسين الخدمة." : "Share your experience to help others and improve care.")}</p></div>{!isDoctor && <button onClick={() => setShowForm(true)}><Plus />{ar ? "إضافة تقييم" : "Add review"}</button>}</header>

    {!isDoctor && <nav className="rating-categories">{(["doctor","clinic","lab","hospital"] as Category[]).map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => { setCategory(item); setRatingFilter(null); }}>{categoryLabels[item]}</button>)}</nav>}

    <section className="ratings-summary-v2">
      <div className="rating-score"><div><strong>{stats.overall.toFixed(1)}</strong><span>/ 5</span></div><Stars value={Math.round(stats.overall)} /><p>{ar ? `بناءً على ${stats.totalReviews} تقييم` : `Based on ${stats.totalReviews} reviews`}</p></div>
      <div><span><MessageSquare /></span><p><b>{stats.totalReviews}</b><small>{ar ? "إجمالي التقييمات" : "Total reviews"}</small></p></div>
      <div><span><TrendingUp /></span><p><b>{positiveRate}%</b><small>{ar ? "تجارب إيجابية" : "Positive experiences"}</small></p></div>
      <div><span><BadgeCheck /></span><p><b>{reviews.filter((review) => review.verified).length}</b><small>{ar ? "تقييمات موثقة" : "Verified reviews"}</small></p></div>
    </section>

    <div className="ratings-layout-v2">
      <aside className="ratings-insights">
        <section className="rating-distribution"><header><BarChart3 /><div><h3>{ar ? "توزيع التقييم" : "Rating distribution"}</h3><p>{ar ? "عدد الآراء لكل درجة" : "Reviews by score"}</p></div></header><div>{[5,4,3,2,1].map((value) => { const count = stats.distribution[value] || 0; const width = stats.totalReviews ? (count / stats.totalReviews) * 100 : 0; return <button key={value} className={ratingFilter === value ? "active" : ""} onClick={() => setRatingFilter(ratingFilter === value ? null : value)}><span>{value}<Star /></span><i><b style={{ width: `${width}%` }} /></i><small>{count}</small></button>; })}</div><button className={ratingFilter === null ? "show-all active" : "show-all"} onClick={() => setRatingFilter(null)}>{ar ? "عرض كل التقييمات" : "Show all reviews"}</button></section>
        <section className="rating-details"><header><Star /><div><h3>{ar ? "تفاصيل التجربة" : "Experience details"}</h3><p>{ar ? "متوسط عناصر الخدمة" : "Average service areas"}</p></div></header><div>{Object.entries(stats.categories).map(([key, value]) => <div key={key}><span>{detailLabels[key]}</span><p><i><b style={{ width: `${(Number(value) / 5) * 100}%` }} /></i><strong>{Number(value).toFixed(1)}</strong></p></div>)}</div></section>
      </aside>

      <main className="reviews-board"><header><div><Quote /><span><b>{isDoctor ? (ar ? "ماذا يقول مرضاك؟" : "What patients say") : (ar ? `تقييمات ${categoryLabels[activeCategory]}` : `${categoryLabels[activeCategory]} reviews`)}</b><small>{ratingFilter ? (ar ? `تقييم ${ratingFilter} نجوم` : `${ratingFilter}-star reviews`) : (ar ? "كل الآراء المنشورة" : "All published feedback")}</small></span></div><i>{reviews.length} {ar ? "رأي" : "reviews"}</i></header><div className="reviews-list-v2">
        {isLoading && <div className="reviews-empty"><div className="loading-spinner" /><p>{ar ? "جاري تحميل التقييمات..." : "Loading reviews..."}</p></div>}
        {error && <div className="reviews-empty error"><p>{error}</p></div>}
        {!isLoading && !error && reviews.map((review) => <article key={review.id}>
          <header><span className="review-avatar">{review.patientName.slice(0,1) || <UserRound />}</span><div><div><h3>{review.patientName}</h3>{review.verified && <span><BadgeCheck />{ar ? "موثّق" : "Verified"}</span>}</div><p><CalendarDays />{review.date}<i>•</i>{review.targetName}</p></div><Stars value={review.rating} /></header>
          <blockquote>{review.comment}</blockquote>
          <footer><button onClick={() => markHelpful(review.id)}><ThumbsUp />{ar ? "مفيد" : "Helpful"}<b>{review.helpful}</b></button><span>{review.rating}/5 <Star /></span></footer>
        </article>)}
        {!isLoading && !error && !reviews.length && <div className="reviews-empty"><span><MessageSquare /></span><h3>{ar ? "لا توجد تقييمات هنا بعد" : "No reviews here yet"}</h3><p>{ar ? "ستظهر آراء المرضى عند إضافتها." : "Patient feedback will appear here."}</p></div>}
      </div></main>
    </div>

    <Dialog open={showForm} onOpenChange={setShowForm}><DialogContent className="rating-form-dialog" dir={dir}><DialogHeader><DialogTitle>{ar ? "شارك تقييمك" : "Share your review"}</DialogTitle><DialogDescription>{ar ? "اختر مقدم الخدمة ثم قيّم تجربتك بوضوح." : "Choose the provider and rate your experience."}</DialogDescription></DialogHeader><div className="rating-form-v2">
      {activeCategory === "doctor" && <label><span>{ar ? "الطبيب" : "Doctor"}</span><select value={form.targetId} onChange={(event) => setForm((current) => ({ ...current, targetId: event.target.value }))}><option value="">{ar ? "اختر الطبيب الذي تعاملت معه" : "Choose your doctor"}</option>{doctors.map((doctor: any) => <option key={doctor._id} value={doctor.user?._id}>{doctor.user?.name} — {doctor.specialty}</option>)}</select></label>}
      <section className="overall-rating-picker"><span>{ar ? "تقييمك العام" : "Overall rating"}</span><Stars value={form.rating} interactive size="large" onChange={(value) => setForm((current) => ({ ...current, rating: value }))} /><p>{form.rating ? (ar ? `${form.rating} من 5` : `${form.rating} out of 5`) : (ar ? "اضغط على النجوم" : "Select the stars")}</p></section>
      <div className="rating-form-details"><div><span>{ar ? "جودة الرعاية" : "Care quality"}</span><Stars value={form.quality} interactive onChange={(value) => setForm((current) => ({ ...current, quality: value }))} /></div><div><span>{ar ? "وقت الانتظار" : "Waiting time"}</span><Stars value={form.waiting} interactive onChange={(value) => setForm((current) => ({ ...current, waiting: value }))} /></div></div>
      <label><span>{ar ? "اكتب تجربتك" : "Your experience"}</span><textarea rows={4} value={form.comment} onChange={(event) => setForm((current) => ({ ...current, comment: event.target.value }))} placeholder={ar ? "ما الذي أعجبك؟ وما الذي يمكن تحسينه؟" : "What worked well, and what could improve?"} /><small>{form.comment.length}/10 {ar ? "أحرف كحد أدنى" : "minimum characters"}</small></label>
      <button className="rating-submit" disabled={saving} onClick={submitReview}><Star />{saving ? (ar ? "جارٍ النشر..." : "Publishing...") : (ar ? "نشر التقييم" : "Publish review")}</button>
    </div></DialogContent></Dialog>
  </div>;
}
