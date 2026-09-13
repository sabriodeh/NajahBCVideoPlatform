import { Link, Outlet } from "react-router";
import { useAuth } from "./useAuth.js";

/**
 * حارس شاشات الإدارة. يُستعمل داخل RequireAuth، فالمستخدم هنا
 * مسجّل حتماً والسؤال الوحيد هو دوره.
 *
 * تُعرض رسالة صريحة بدل التحويل الصامت: العضو الذي فتح رابطاً
 * إدارياً يستحق أن يعرف أن الصفحة موجودة لكنها ليست له، لا أن
 * يُقذف إلى الرئيسية بلا تفسير.
 */
export function RequireAdmin() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="nj-wrap nj-page">
        <div className="nj-empty">
          <h3>هذه الصفحة لإدارة المنصة</h3>
          <p style={{ marginBottom: 18 }}>
            حسابك لا يملك صلاحية الإدارة. إن كنت تظن أن هذا خطأ، راجع لجنة التحول الرقمي.
          </p>
          <Link className="nj-btn" to="/">
            العودة إلى المواضيع
          </Link>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
