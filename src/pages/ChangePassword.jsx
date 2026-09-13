import { useState } from "react";
import { useNavigate } from "react-router";
import { CONTACT } from "../config.js";
import { useAuth } from "../auth/useAuth.js";
import { Field } from "../components/Field.jsx";
import { LOGO_ALT, LOGO_WINE } from "../assets/logo.js";

const MIN_LENGTH = 8;

/**
 * تغيير كلمة المرور.
 *
 * يعمل في وضعين: إجباري عند أول دخول بكلمة المرور المؤقتة (وعندها
 * يمنع الحارس كل مسار آخر)، واختياري من قائمة التنقّل. الوضع
 * يُشتقّ من حالة المصادقة لا من خاصية مُمرَّرة، فلا يُلتفّ عليه
 * بتغيير المسار.
 */
export default function ChangePassword() {
  const { email, mustChangePassword, changePassword, signOut } = useAuth();
  const navigate = useNavigate();

  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [error, setError] = useState("");
  const [stuck, setStuck] = useState(false);
  const [busy, setBusy] = useState(false);

  const forced = mustChangePassword;

  const tooShort = p1.length > 0 && p1.length < MIN_LENGTH;
  const mismatch = p2.length > 0 && p1 !== p2;
  const sameAsEmail =
    p1.length > 0 && p1.trim().toLowerCase() === String(email || "").trim().toLowerCase();

  const valid = p1.length >= MIN_LENGTH && p1 === p2 && !sameAsEmail;

  const leave = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!valid) return;
    setError("");
    setStuck(false);
    setBusy(true);
    try {
      const { flagCleared } = await changePassword(p1);
      if (flagCleared) {
        navigate("/", { replace: true });
        return;
      }
      /* كلمة المرور تغيّرت فعلاً لكن الراية لم تُرفع. التنقّل الآن
         يعيده الحارس إلى هنا بلا نهاية، فالصمت هنا أسوأ من الخطأ */
      setStuck(true);
      setBusy(false);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="nj-lock">
      <div className="nj-lock-box">
        {forced && (
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <img src={LOGO_WINE} alt={LOGO_ALT} style={{ height: 56, maxWidth: "100%" }} />
          </div>
        )}

        <form className="nj-panel" onSubmit={submit} noValidate>
          <h1 className="nj-kufi" style={{ fontSize: "var(--t-md)", marginBottom: 6 }}>
            {forced ? "اختر كلمة مرور جديدة" : "تغيير كلمة المرور"}
          </h1>
          <p className="nj-hint" style={{ marginBottom: 22 }}>
            {forced
              ? "حسابك ما زال يستخدم كلمة المرور المؤقتة. اختر كلمة مرور خاصة بك للمتابعة."
              : "اختر كلمة مرور جديدة لحسابك."}
          </p>

          {error && (
            <div className="nj-note bad" role="alert">
              {error}
            </div>
          )}

          {stuck && (
            <div className="nj-note wait" role="alert">
              <strong>كلمة المرور تغيّرت فعلاً</strong> — استخدم الجديدة في أي دخول قادم. لكن
              تعذّر رفع علامة «كلمة مرور مؤقتة» عن حسابك، فقد تُعاد إلى هذه الشاشة. راسل{" "}
              <a href={`mailto:${CONTACT}`}>{CONTACT}</a> لرفعها.
            </div>
          )}

          <Field
            id="new-password"
            label="كلمة المرور الجديدة"
            type="password"
            required
            autoComplete="new-password"
            value={p1}
            onChange={(e) => setP1(e.target.value)}
            disabled={busy}
            error={
              tooShort
                ? `كلمة المرور قصيرة — ${MIN_LENGTH} أحرف على الأقل.`
                : sameAsEmail
                  ? "لا تستخدم بريدك الجامعي ككلمة مرور."
                  : null
            }
            hint={`${MIN_LENGTH} أحرف على الأقل، ولا تكن بريدك الجامعي.`}
          />

          <Field
            id="confirm-password"
            label="أعد كتابتها"
            type="password"
            required
            autoComplete="new-password"
            value={p2}
            onChange={(e) => setP2(e.target.value)}
            disabled={busy}
            error={mismatch ? "الكلمتان غير متطابقتين." : null}
          />

          <button
            className="nj-btn"
            type="submit"
            disabled={!valid || busy}
            style={{ width: "100%" }}
          >
            {busy ? "نحفظ…" : "احفظ كلمة المرور"}
          </button>

          {!forced && (
            <button
              type="button"
              className="nj-btn-ghost"
              onClick={() => navigate(-1)}
              disabled={busy}
              style={{ width: "100%", marginTop: 10 }}
            >
              رجوع
            </button>
          )}

          {/* مخرج دائم.
              في الوضع الإجباري لا ترويسة ولا تنقّل ولا زر رجوع،
              والحارس يعيد كل مسار آخر إلى هنا. فمن تعذّر عليه إتمام
              التغيير — نسي ما كتبه، أو رفضت Supabase كلمته، أو
              انقطعت الشبكة — يبقى محبوساً بلا أي مخرج سوى مسح
              بيانات الموقع. الخروج آمن دائماً: يعيده إلى شاشة الدخول. */}
          <button
            type="button"
            className="nj-btn-ghost"
            onClick={leave}
            style={{ width: "100%", marginTop: 10 }}
          >
            الخروج من الحساب
          </button>

          {forced && (
            <p className="nj-hint" style={{ marginTop: 14, textAlign: "center" }}>
              تحتاج مساعدة؟ راسل <a href={`mailto:${CONTACT}`}>{CONTACT}</a>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
