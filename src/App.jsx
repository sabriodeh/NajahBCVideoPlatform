import { Navigate, Route, Routes } from "react-router";
import { CONTACT, configError } from "./config.js";
import { AuthProvider } from "./auth/AuthProvider.jsx";
import { RequireAuth } from "./auth/RequireAuth.jsx";
import { RequireAdmin } from "./auth/RequireAdmin.jsx";
import { AppShell } from "./components/AppShell.jsx";
import Login from "./pages/Login.jsx";
import ChangePassword from "./pages/ChangePassword.jsx";
import SectionsHome from "./pages/SectionsHome.jsx";

/**
 * شاشة خطأ الإعداد.
 *
 * النسخة السابقة كانت تتعامل مع المفاتيح الناقصة بالتحوّل الصامت
 * إلى «وضع عرض» ببيانات وهمية — أي أن موقع الكلية قد ينشر أسماء
 * ومحتوى ملفَّقين دون أن يفشل البناء. الفشل الظاهر أأمن بكثير.
 */
function ConfigErrorScreen({ message }) {
  return (
    <div className="nj-lock">
      <div className="nj-lock-box">
        <div className="nj-panel">
          <h1 className="nj-kufi" style={{ fontSize: "var(--t-md)", marginBottom: 10 }}>
            المنصة غير مهيّأة
          </h1>
          <div className="nj-note bad" role="alert">
            {message}
          </div>
          <p className="nj-hint">
            هذه رسالة فنّية تخصّ من ينشر المنصة. إن كنت عضو هيئة تدريسية، راسل{" "}
            <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

/** نائبة مؤقتة لشاشات الإدارة حتى المرحلة ٤. */
function AdminPlaceholder() {
  return (
    <div className="nj-wrap nj-page">
      <h2 className="nj-kufi">إدارة المحتوى</h2>
      <p className="nj-lead">إضافة الوكلاء والسياسات وتحريرها.</p>
      <div className="nj-empty" style={{ marginTop: 28 }}>
        <h3>قيد الإنشاء</h3>
        <p>ستتوفّر إدارة المداخل بعد تطبيق سكيما قاعدة البيانات.</p>
      </div>
    </div>
  );
}

export default function App() {
  if (configError) return <ConfigErrorScreen message={configError} />;

  return (
    <AuthProvider>
      <Routes>
        {/* عامّ: الشاشة الوحيدة التي تُعرض بلا جلسة */}
        <Route path="/login" element={<Login />} />

        {/* كل ما بعده يتطلّب جلسة */}
        <Route element={<RequireAuth />}>
          {/* خارج القشرة عمداً: في الوضع الإجباري لا تنقّل ولا مخرج */}
          <Route path="/change-password" element={<ChangePassword />} />

          <Route element={<AppShell />}>
            <Route path="/" element={<SectionsHome />} />

            <Route element={<RequireAdmin />}>
              <Route path="/admin" element={<AdminPlaceholder />} />
            </Route>
          </Route>
        </Route>

        {/* أي مسار مجهول يمرّ عبر الحارس، فينتهي إلى الدخول إن لم تكن ثمة جلسة */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
