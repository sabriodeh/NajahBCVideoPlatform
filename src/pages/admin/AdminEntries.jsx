import { Link } from "react-router";
import { fetchAllEntries } from "../../api/entries.js";
import { useAsync } from "../../lib/useAsync.js";
import { DataStateBlock } from "../../components/DataStateBlock.jsx";
import { EntryCover } from "../../components/EntryCover.jsx";
import { Icon } from "../../components/Icon.jsx";

/** يجمع المداخل تحت عناوين مواضيعها. */
function groupBySection(entries) {
  const groups = new Map();
  for (const entry of entries || []) {
    const key = entry.section?.title || "بلا موضوع";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry);
  }
  return [...groups.entries()];
}

/** لوحة إدارة المحتوى. */
export default function AdminEntries() {
  const { loading, error, data, reload } = useAsync(fetchAllEntries, []);
  const groups = groupBySection(data);

  return (
    <div className="nj-wrap nj-page">
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <h2 className="nj-kufi">إدارة المحتوى</h2>
          <p className="nj-lead">إضافة الوكلاء والسياسات وتحريرها.</p>
        </div>

        <Link className="nj-btn" to="/admin/new" style={{ textDecoration: "none" }}>
          <Icon name="plus" size={16} />
          مدخل جديد
        </Link>
      </div>

      <div style={{ marginTop: 28 }}>
        <DataStateBlock
          loading={loading}
          error={error}
          onRetry={reload}
          isEmpty={!data || data.length === 0}
          emptyTitle="لا مداخل بعد"
          emptyBody="ابدأ بإضافة أول وكيل أو سياسة."
          emptyAction={
            <Link className="nj-btn" to="/admin/new" style={{ marginTop: 14 }}>
              <Icon name="plus" size={16} />
              مدخل جديد
            </Link>
          }
        >
          {groups.map(([sectionTitle, entries]) => (
            <section key={sectionTitle} style={{ marginBottom: 32 }}>
              <h3 className="nj-kufi" style={{ fontSize: "var(--t-md)", marginBottom: 12 }}>
                {sectionTitle}
                <span className="nj-hint" style={{ display: "inline", marginInlineStart: 8 }}>
                  ({entries.length})
                </span>
              </h3>

              <ul className="nj-entry-list">
                {entries.map((entry) => (
                  <li key={entry.id}>
                    <div className="nj-entry-row" style={{ cursor: "default" }}>
                      <div className="nj-entry-cover" style={{ width: 96 }}>
                        <EntryCover
                          title={entry.title}
                          videoKind={entry.video_kind}
                          videoRef={entry.video_ref}
                        />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ margin: 0 }}>{entry.title}</h4>
                        <div className="nj-entry-tags">
                          {entry.agent_url && <span className="nj-tag">وكيل</span>}
                          {entry.video_kind && (
                            <span className="nj-tag">
                              {entry.video_kind === "youtube" ? "يوتيوب" : "درايف"}
                            </span>
                          )}
                          {entry.links.length > 0 && (
                            <span className="nj-tag">{entry.links.length} مستند</span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Link
                          className="nj-btn-ghost"
                          to={`/entry/${entry.id}`}
                          style={{ textDecoration: "none" }}
                        >
                          عرض
                        </Link>
                        <Link
                          className="nj-btn-ghost"
                          to={`/admin/edit/${entry.id}`}
                          style={{ textDecoration: "none" }}
                        >
                          <Icon name="edit" size={15} />
                          تحرير
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </DataStateBlock>
      </div>
    </div>
  );
}
