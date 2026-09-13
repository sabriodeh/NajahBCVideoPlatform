import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { CONTACT } from "../config.js";
import { useAuth } from "../auth/useAuth.js";
import { Field } from "../components/Field.jsx";
import { FullScreenLoading } from "../components/Loading.jsx";
import { LOGO_ALT, LOGO_WINE } from "../assets/logo.js";

/** الشاشة الأولى للمنصة. لا يُعرض أي محتوى قبل اجتيازها. */
export default function Login() {
  const { loading, isAuthenticated, signIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return <FullScreenLoading />;

  /* المسجَّل أصلاً لا يرى شاشة الدخول */
  if (isAuthenticated) {
    return <Navigate to={location.state?.from || "/"} replace />;
  }

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signIn(email, password);
      navigate(location.state?.from || "/", { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const canSubmit = email.trim() && password && !busy;

  return (
    <div className="nj-lock">
      <div className="nj-lock-box">
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <img src={LOGO_WINE} alt={LOGO_ALT} style={{ height: 68, maxWidth: "100%" }} />
          <h1 className="nj-kufi" style={{ fontSize: "var(--t-lg)", marginTop: 14 }}>
            منصة الذكاء الاصطناعي
          </h1>
          <p className="nj-hint">كلية الأعمال والاتصال — جامعة النجاح الوطنية</p>
        </div>

        <form className="nj-panel" onSubmit={submit} noValidate>
          <h2 className="nj-kufi" style={{ fontSize: "var(--t-md)", marginBottom: 6 }}>
            دخول أعضاء الهيئة التدريسية
          </h2>
          <p className="nj-hint" style={{ marginBottom: 22 }}>
            المنصة مخصّصة لأعضاء الكلية المسجّلين. لا يوجد تسجيل ذاتي.
          </p>

          {error && (
            <div className="nj-note bad" role="alert">
              {error}
            </div>
          )}

          <Field
            id="email"
            label="البريد الجامعي"
            type="email"
            required
            dir="ltr"
            style={{ textAlign: "left" }}
            autoComplete="username"
            placeholder="name@najah.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
          />

          <Field
            id="password"
            label="كلمة المرور"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
            hint="أول مرة؟ كلمة المرور المؤقتة هي بريدك الجامعي نفسه."
          />

          <button className="nj-btn" type="submit" disabled={!canSubmit} style={{ width: "100%" }}>
            {busy ? "لحظة…" : "دخول"}
          </button>

          <p className="nj-hint" style={{ marginTop: 18, textAlign: "center" }}>
            تعذّر الدخول؟ راسل العمادة على <a href={`mailto:${CONTACT}`}>{CONTACT}</a>
          </p>
        </form>
      </div>
    </div>
  );
}
