import { Navigate, Outlet, useLocation } from "react-router";
import { FullScreenLoading } from "../components/Loading.jsx";
import { useAuth } from "./useAuth.js";

/**
 * حارس البوابة. لا يُصيَّر أي محتوى محميّ قبل أن تُحسم حالة الجلسة،
 * فلا تومض المحتويات للحظة أمام غير المسجّل.
 *
 * ملاحظة أمنية: هذا الحارس يمنع العرض لا الوصول. مفتاح anon علني،
 * فمن يستدعي REST مباشرة يتجاوز هذا كله — المنع الحقيقي هو غياب
 * سياسات RLS لدور anon.
 */
export function RequireAuth() {
  const { loading, isAuthenticated, mustChangePassword } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenLoading />;

  if (!isAuthenticated) {
    /* حفظ الوجهة المقصودة للعودة إليها بعد الدخول */
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  /* كلمة المرور المؤقتة تحجب كل شيء عدا شاشة تغييرها */
  if (mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  return <Outlet />;
}
