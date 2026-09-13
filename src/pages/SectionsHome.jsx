import { Link } from "react-router";
import { fetchSectionTree } from "../api/sections.js";
import { useAsync } from "../lib/useAsync.js";
import { useAuth } from "../auth/useAuth.js";
import { DataStateBlock } from "../components/DataStateBlock.jsx";
import { Icon } from "../components/Icon.jsx";

const ICON_FOR_SLUG = {
  "ai-agents": "agent",
  "ai-policies": "book",
};

/** لوحة المواضيع — أول ما يراه العضو بعد الدخول. */
export default function SectionsHome() {
  const { displayName, isAdmin, profileError } = useAuth();
  const { loading, error, data, reload } = useAsync(fetchSectionTree, []);

  return (
    <div className="nj-wrap nj-page">
      <h2 className="nj-kufi">أهلاً {displayName}</h2>
      <p className="nj-lead">
        منصة لجنة التحول الرقمي والذكاء الاصطناعي — كلية الأعمال والاتصال.
      </p>

      {/* تشخيص صامت لولا هذا التنبيه: العضو يرى منصة تعمل لكن
          بأدنى صلاحية، ولا يعرف السبب. غالباً سياسات profiles. */}
      {profileError && (
        <div className="nj-note wait" style={{ marginTop: 20 }} role="status">
          تعذّرت قراءة ملفك الشخصي، فتُعرض لك أدنى الصلاحيات. أبلغ لجنة التحول الرقمي.
        </div>
      )}

      <div style={{ marginTop: 30 }}>
        <DataStateBlock
          loading={loading}
          error={error}
          onRetry={reload}
          isEmpty={!data || data.length === 0}
          emptyTitle="لا مواضيع بعد"
          emptyBody={
            isAdmin
              ? "أضف المواضيع من لوحة الإدارة أو نفّذ ملف البذرة 0003_seed.sql."
              : "ستظهر المواضيع هنا بمجرد إضافتها."
          }
        >
          <div className="nj-cards">
            {(data || []).map((section) => (
              <Link key={section.id} className="nj-card" to={`/section/${section.slug}`}>
                <span className="nj-card-icon">
                  <Icon name={ICON_FOR_SLUG[section.slug] || "book"} size={24} />
                </span>

                <h3 className="nj-kufi">{section.title}</h3>
                {section.description && <p>{section.description}</p>}

                {section.children.length > 0 && (
                  <ul className="nj-card-sub">
                    {section.children.map((child) => (
                      <li key={child.id}>
                        <Icon name="back" size={13} />
                        {child.title}
                      </li>
                    ))}
                  </ul>
                )}
              </Link>
            ))}
          </div>
        </DataStateBlock>
      </div>
    </div>
  );
}
