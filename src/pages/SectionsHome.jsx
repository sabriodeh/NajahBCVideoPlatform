import { useAuth } from "../auth/useAuth.js";

/**
 * لوحة المواضيع.
 *
 * نائبة مؤقتة للمرحلة ٢: تثبت أن البوابة تعمل وأن الجلسة والدور
 * يُقرآن بصحة. تحلّ محلّها في المرحلة ٣ قراءة المواضيع الفعلية من
 * جدول sections بعد تطبيق السكيما وسياسات RLS.
 */
export default function SectionsHome() {
  const { displayName, isAdmin, profileError } = useAuth();

  return (
    <div className="nj-wrap nj-page">
      <h2 className="nj-kufi">أهلاً {displayName}</h2>
      <p className="nj-lead">
        منصة لجنة التحول الرقمي والذكاء الاصطناعي في كلية الأعمال والاتصال.
      </p>

      {profileError && (
        <div className="nj-note wait" style={{ marginTop: 20 }} role="status">
          تعذّرت قراءة ملفك الشخصي، فتُعرض لك أدنى الصلاحيات. غالباً لم تُطبَّق سياسات RLS
          على جدول profiles بعد.
        </div>
      )}

      <div className="nj-empty" style={{ marginTop: 32 }}>
        <h3>المواضيع قيد الإعداد</h3>
        <p>
          سيظهر هنا موضوعا «وكلاء الذكاء الاصطناعي» و«سياسات الذكاء الاصطناعي» بمجرد تطبيق
          سكيما قاعدة البيانات.
        </p>
        {isAdmin && (
          <p className="nj-hint" style={{ marginTop: 14 }}>
            حسابك يملك صلاحية الإدارة.
          </p>
        )}
      </div>
    </div>
  );
}
