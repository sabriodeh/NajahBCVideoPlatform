import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router";
import { CONTACT, configError } from "./config.js";
import { AuthProvider } from "./auth/AuthProvider.jsx";
import { RequireAuth } from "./auth/RequireAuth.jsx";
import { RequireAdmin } from "./auth/RequireAdmin.jsx";
import { AppShell } from "./components/AppShell.jsx";
import Login from "./pages/Login.jsx";
import ChangePassword from "./pages/ChangePassword.jsx";
import SectionsHome from "./pages/SectionsHome.jsx";
import SectionView from "./pages/SectionView.jsx";
import EntryView from "./pages/EntryView.jsx";
import { FullScreenLoading } from "./components/Loading.jsx";

/* شاشات الإدارة محمّلة على الطلب: أغلب الأعضاء ليسوا أدمن ولا
   يفتحونها أبداً، فلا معنى لتحميل نموذج الإدارة كاملاً معهم. */
const AdminEntries = lazy(() => import("./pages/admin/AdminEntries.jsx"));
const EntryForm = lazy(() => import("./pages/admin/EntryForm.jsx"));

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
            <Route path="/section/:slug" element={<SectionView />} />
            <Route path="/entry/:id" element={<EntryView />} />

            <Route element={<RequireAdmin />}>
              <Route
                path="/admin"
                element={
                  <Suspense fallback={<FullScreenLoading label="جارٍ فتح لوحة الإدارة…" />}>
                    <AdminEntries />
                  </Suspense>
                }
              />
              <Route
                path="/admin/new"
                element={
                  <Suspense fallback={<FullScreenLoading label="جارٍ فتح النموذج…" />}>
                    <EntryForm />
                  </Suspense>
                }
              />
              <Route
                path="/admin/edit/:id"
                element={
                  <Suspense fallback={<FullScreenLoading label="جارٍ فتح النموذج…" />}>
                    <EntryForm />
                  </Suspense>
                }
              />
            </Route>
          </Route>
        </Route>

        {/* أي مسار مجهول يمرّ عبر الحارس، فينتهي إلى الدخول إن لم تكن ثمة جلسة */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
