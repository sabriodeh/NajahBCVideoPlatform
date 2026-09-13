import { classifyLink, isSafeHttpUrl, LINK_KIND_LABELS } from "../lib/links.js";
import { Icon } from "./Icon.jsx";

const ICON_FOR = {
  doc: "doc",
  sheet: "sheet",
  slide: "slide",
  form: "form",
  folder: "folder",
  file: "file",
  pdf: "pdf",
  other: "link",
};

/**
 * قائمة المستندات المرفقة بمدخل.
 *
 * تُفحص الروابط هنا بـ isSafeHttpUrl حتى لو فُحصت عند الحفظ:
 * صفوف البذرة وأي إدخال يدوي بـ SQL لا تمرّ على نموذج الإدارة
 * إطلاقاً، فالفحص عند العرض هو خط الدفاع الوحيد أمامها.
 */
export function LinkList({ links }) {
  const safe = (Array.isArray(links) ? links : []).filter((l) => l && isSafeHttpUrl(l.url));
  if (safe.length === 0) return null;

  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
      {safe.map((link) => {
        const kind = link.kind && ICON_FOR[link.kind] ? link.kind : classifyLink(link.url);
        return (
          <li key={link.url}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "12px 14px",
                minHeight: 44,
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: "var(--r-sm)",
                textDecoration: "none",
                color: "var(--ink)",
                transition: "border-color var(--dur-fast) var(--ease)",
              }}
            >
              <Icon name={ICON_FOR[kind] || "link"} size={19} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontWeight: 500 }}>{link.label}</span>
                <span className="nj-hint" style={{ margin: 0 }}>
                  {LINK_KIND_LABELS[kind] || LINK_KIND_LABELS.other}
                </span>
              </span>
              <Icon name="external" size={15} title="يفتح في تبويب جديد" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
