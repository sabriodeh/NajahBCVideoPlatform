import { Link, NavLink, Outlet, useNavigate } from "react-router";
import { useAuth } from "../auth/useAuth.js";
import { LOGO_ALT, LOGO_WHITE } from "../assets/logo.js";

/** الترويسة والتذييل المشتركان لكل الصفحات المحميّة. */
export function AppShell() {
  const { displayName, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const leave = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="nj-app">
      <a className="nj-skip" href="#main">
        تخطَّ إلى المحتوى
      </a>

      <header className="nj-head">
        <div className="nj-wrap nj-head-in">
          <Link className="nj-brand" to="/">
            <img className="nj-logo" src={LOGO_WHITE} alt={LOGO_ALT} />
            <span>
              <b>منصة الذكاء الاصطناعي</b>
              <i>كلية الأعمال والاتصال</i>
            </span>
          </Link>

          <nav className="nj-nav" aria-label="التنقّل الرئيسي">
            {/* NavLink يضبط الحالة النشطة تلقائياً — كان التمييز
                البصري للموقع الحالي غائباً في النسخة السابقة */}
            <NavLink to="/" end className={({ isActive }) => (isActive ? "on" : "")}>
              المواضيع
            </NavLink>

            {isAdmin && (
              <NavLink to="/admin" className={({ isActive }) => (isActive ? "on" : "")}>
                الإدارة
              </NavLink>
            )}

            <NavLink to="/change-password" className={({ isActive }) => (isActive ? "on" : "")}>
              كلمة المرور
            </NavLink>

            <button type="button" onClick={leave}>
              خروج
            </button>
          </nav>
        </div>
      </header>

      <main className="nj-main" id="main">
        <Outlet />
      </main>

      <footer className="nj-foot">
        <div className="nj-wrap nj-foot-in">
          <img src={LOGO_WHITE} alt="" />
          <span>
            لجنة التحول الرقمي والذكاء الاصطناعي — كلية الأعمال والاتصال، جامعة النجاح الوطنية
          </span>
          {displayName && (
            <span style={{ marginInlineStart: "auto", opacity: 0.75 }}>{displayName}</span>
          )}
        </div>
      </footer>
    </div>
  );
}
