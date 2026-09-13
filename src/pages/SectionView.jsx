import { Link, useParams } from "react-router";
import { fetchSectionBySlug } from "../api/sections.js";
import { fetchEntriesBySection } from "../api/entries.js";
import { useAsync } from "../lib/useAsync.js";
import { useAuth } from "../auth/useAuth.js";
import { DataStateBlock } from "../components/DataStateBlock.jsx";
import { EntryCover } from "../components/EntryCover.jsx";
import { Icon } from "../components/Icon.jsx";

/** مداخل موضوع واحد، ومعها فروعه إن كانت له فروع. */
export default function SectionView() {
  const { slug } = useParams();
  const { isAdmin } = useAuth();

  const section = useAsync(() => fetchSectionBySlug(slug), [slug]);
  const sectionId = section.data?.id;

  const entries = useAsync(
    () => (sectionId ? fetchEntriesBySection(sectionId) : Promise.resolve([])),
    [sectionId]
  );

  const loading = section.loading || (Boolean(sectionId) && entries.loading);
  const error = section.error || entries.error;

  return (
    <div className="nj-wrap nj-page">
      <Link className="nj-crumb" to="/">
        <Icon name="back" size={15} />
        كل المواضيع
      </Link>

      {section.data && (
        <>
          {section.data.parent && (
            <Link className="nj-crumb" to={`/section/${section.data.parent.slug}`}>
              <Icon name="back" size={15} />
              {section.data.parent.title}
            </Link>
          )}

          <h2 className="nj-kufi" style={{ marginTop: 12 }}>
            {section.data.title}
          </h2>
          {section.data.description && <p className="nj-lead">{section.data.description}</p>}
        </>
      )}

      {/* الفروع أولاً: من يدخل «السياسات» يختار مدرسين أو طلبة قبل
          أن يرى أي مدخل مباشر تحت الموضوع الأب */}
      {section.data?.children?.length > 0 && (
        <div className="nj-cards" style={{ marginTop: 26 }}>
          {section.data.children.map((child) => (
            <Link key={child.id} className="nj-card" to={`/section/${child.slug}`}>
              <span className="nj-card-icon">
                <Icon name="book" size={22} />
              </span>
              <h3 className="nj-kufi">{child.title}</h3>
              {child.description && <p>{child.description}</p>}
            </Link>
          ))}
        </div>
      )}

      <div style={{ marginTop: 30 }}>
        <DataStateBlock
          loading={loading}
          error={error}
          onRetry={() => {
            section.reload();
            entries.reload();
          }}
          isEmpty={!section.loading && !section.data}
          emptyTitle="الموضوع غير موجود"
          emptyBody="ربما حُذف أو تغيّر رابطه."
        >
          {(entries.data || []).length === 0 ? (
            !section.data?.children?.length && (
              <DataStateBlock
                loading={false}
                error={null}
                isEmpty
                emptyTitle="لا مداخل في هذا الموضوع بعد"
                emptyBody={
                  isAdmin
                    ? "أضف أول مدخل من لوحة الإدارة."
                    : "سيظهر المحتوى هنا بمجرد إضافته."
                }
                emptyAction={
                  isAdmin ? (
                    <Link className="nj-btn" to="/admin/new" style={{ marginTop: 14 }}>
                      <Icon name="plus" size={16} />
                      أضف مدخلاً
                    </Link>
                  ) : null
                }
              />
            )
          ) : (
            <ul className="nj-entry-list">
              {entries.data.map((entry) => (
                <li key={entry.id}>
                  <Link className="nj-entry-row" to={`/entry/${entry.id}`}>
                    <div className="nj-entry-cover">
                      <EntryCover
                        title={entry.title}
                        videoKind={entry.video_kind}
                        videoRef={entry.video_ref}
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 className="nj-kufi">{entry.title}</h3>
                      {entry.summary && <p>{entry.summary}</p>}

                      <div className="nj-entry-tags">
                        {entry.agent_url && (
                          <span className="nj-tag">
                            <Icon name="agent" size={13} />
                            وكيل
                          </span>
                        )}
                        {entry.video_kind && (
                          <span className="nj-tag">
                            <Icon name="video" size={13} />
                            فيديو
                          </span>
                        )}
                        {entry.links.length > 0 && (
                          <span className="nj-tag">
                            <Icon name="doc" size={13} />
                            {entry.links.length} مستند
                          </span>
                        )}
                        {entry.instructions && (
                          <span className="nj-tag">
                            <Icon name="alert" size={13} />
                            تعليمات
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DataStateBlock>
      </div>
    </div>
  );
}
