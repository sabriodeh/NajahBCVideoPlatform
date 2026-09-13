/** شاشة انتظار أثناء استعادة الجلسة، قبل أن يُعرف أمسجَّل المستخدم أم لا. */
export function FullScreenLoading({ label = "جارٍ التحقق من الجلسة…" }) {
  return (
    <div className="nj-lock" role="status" aria-live="polite">
      <div className="nj-lock-box" style={{ textAlign: "center" }}>
        <div className="nj-skeleton" style={{ height: 12, width: "60%", margin: "0 auto 14px" }} />
        <div className="nj-skeleton" style={{ height: 12, width: "40%", margin: "0 auto" }} />
        <p className="nj-hint" style={{ marginTop: 20 }}>
          {label}
        </p>
      </div>
    </div>
  );
}
