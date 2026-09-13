import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../auth/useAuth.js";
import { Field } from "../components/Field.jsx";
import { LOGO_ALT, LOGO_WINE } from "../assets/logo.js";

const MIN_LENGTH = 8;

/**
 * تغيير كلمة المرور.
 *
 * يعمل في وضعين: إجباري عند أول دخول بكلمة المرور المؤقتة (وعندها
 * لا مخرج — الحارس يمنع كل مسار آخر)، واختياري من قائمة الحساب.
 * الوضع يُشتقّ من حالة المصادقة لا من خاصية مُمرَّرة، فلا يمكن
 * الالتفاف عليه بتغيير المسار.
 */
export default function ChangePassword() {
  const { email, mustChangePassword, changePassword } = useAuth();
  const navigate = useNavigate();

  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const forced = mustChangePassword;

  const tooShort = p1.length > 0 && p1.length < MIN_LENGTH;
  const mismatch = p2.length > 0 && p1 !== p2;
  const sameAsEmail =
    p1.length > 0 && p1.trim().toLowerCase() === String(email).trim().toLowerCase();

  const valid = p1.length >= MIN_LENGTH && p1 === p2 && !sameAsEmail;

  const submit = async (e) => {
    e.preventDefault();
    if (!valid) return;
    setError("");
    setBusy(true);
    try {
      await changePassword(p1);
      navigate("/", { replace: true });
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

          <button className="nj-btn" type="submit" disabled={!valid || busy} style={{ width: "100%" }}>
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
        </form>
      </div>
    </div>
  );
}
