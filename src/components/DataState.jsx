import { describeDataError } from "../lib/errors.js";
import { Icon } from "./Icon.jsx";

/** هيكل عظمي أثناء التحميل — أهدأ من دوّارة وأقرب لشكل النتيجة. */
export function Skeleton({ rows = 3 }) {
  return (
    <div style={{ display: "grid", gap: 14 }} role="status" aria-label="جارٍ التحميل">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="nj-skeleton"
          style={{ height: 86, borderRadius: "var(--r-md)" }}
        />
      ))}
    </div>
  );
}

/**
 * رسالة خطأ مفهومة.
 *
 * أهمّ حالاتها «السكيما لم تُطبَّق»: المنصة قد تُنشر قبل تنفيذ ملفات
 * الترحيل، وعندها يعيد PostgREST خطأً إنجليزياً عن جدول غير موجود.
 * عرضه كما هو يوحي بأن المنصة معطوبة، بينما هي تنتظر خطوة إعداد.
 */
export function ErrorState({ error, onRetry }) {
  const info = describeDataError(error);
  if (!info) return null;

  return (
    <div className="nj-note bad" role="alert" style={{ display: "grid", gap: 8 }}>
      <strong style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Icon name="alert" size={18} />
        {info.title}
      </strong>
      <span>{info.detail}</span>

      {onRetry && (
        <span>
          <button type="button" className="nj-btn-ghost" onClick={onRetry} style={{ marginTop: 6 }}>
            أعد المحاولة
          </button>
        </span>
      )}

      {info.kind === "unknown" && (
        <details style={{ marginTop: 4 }}>
          <summary className="nj-hint" style={{ cursor: "pointer" }}>
            التفاصيل الفنّية
          </summary>
          <code style={{ fontSize: "var(--t-xs)", wordBreak: "break-word" }}>{info.raw}</code>
        </details>
      )}
    </div>
  );
}

/** حالة فراغ موحّدة. */
export function EmptyState({ title, children, icon = "book" }) {
  return (
    <div className="nj-empty">
      <span style={{ color: "var(--brass)", display: "inline-flex", marginBottom: 10 }}>
        <Icon name={icon} size={30} />
      </span>
      <h3>{title}</h3>
      {children}
    </div>
  );
}
