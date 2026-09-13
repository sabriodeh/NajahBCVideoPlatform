import { Link, useParams } from "react-router";
import { fetchEntry } from "../api/entries.js";
import { useAsync } from "../lib/useAsync.js";
import { useAuth } from "../auth/useAuth.js";
import { DataStateBlock } from "../components/DataStateBlock.jsx";
import { LinkList } from "../components/LinkList.jsx";
import { VideoPlayer } from "../components/VideoPlayer.jsx";
import { Icon } from "../components/Icon.jsx";
import { supabase } from "../lib/supabase.js";

/** اسم الموضوع الأب لعرضه في مسار التنقّل. */
async function fetchParentSection(sectionId) {
  if (!sectionId) return null;
  const { data } = await supabase
    .from("sections")
    .select("slug,title")
    .eq("id", sectionId)
    .maybeSingle();
  return data || null;
}

/** المدخل الكامل: الوكيل، الفيديو، التعليمات، المستندات. */
export default function EntryView() {
  const { id } = useParams();
  const { isAdmin } = useAuth();

  const entry = useAsync(() => fetchEntry(id), [id]);
  const sectionId = entry.data?.section_id;
  const parent = useAsync(() => fetchParentSection(sectionId), [sectionId]);

  const e = entry.data;

  return (
    <div className="nj-wrap nj-page">
      <DataStateBlock
        loading={entry.loading}
        error={entry.error}
        onRetry={entry.reload}
        isEmpty={!entry.loading && !e}
        emptyTitle="المدخل غير موجود"
        emptyBody="ربما حُذف أو تغيّر رابطه."
        skeletonRows={4}
      >
        {e && (
          <article style={{ maxWidth: 820 }}>
            <Link className="nj-crumb" to={parent.data ? `/section/${parent.data.slug}` : "/"}>
              <Icon name="back" size={15} />
              {parent.data?.title || "كل المواضيع"}
            </Link>

            <header style={{ marginTop: 12 }}>
              <h2 className="nj-kufi">{e.title}</h2>
              {e.summary && <p className="nj-lead">{e.summary}</p>}

              {isAdmin && (
                <Link
                  className="nj-btn-ghost"
                  to={`/admin/edit/${e.id}`}
                  style={{ marginTop: 14, textDecoration: "none" }}
                >
                  <Icon name="edit" size={15} />
                  تحرير هذا المدخل
                </Link>
              )}
            </header>

            {/* الوكيل أولاً: هو الغرض من الزيارة في موضوع الوكلاء */}
            {e.agent_url && (
              <section className="nj-block nj-block-agent">
                <h3 className="nj-kufi">
                  <Icon name="agent" size={19} />
                  الوكيل
                </h3>

                {e.agent_access_note && <p style={{ marginBottom: 14 }}>{e.agent_access_note}</p>}

                <a
                  className="nj-btn"
                  href={e.agent_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none" }}
                >
                  <Icon name="external" size={16} />
                  افتح الوكيل
                </a>
              </section>
            )}

            {e.video_kind && e.video_ref && (
              <section className="nj-block">
                <h3 className="nj-kufi">
                  <Icon name="video" size={19} />
                  شرح مصوّر
                </h3>
                <VideoPlayer kind={e.video_kind} videoRef={e.video_ref} title={e.title} />
              </section>
            )}

            {/* التعليمات مميّزة بصرياً لأنها ملزِمة لا اختيارية */}
            {e.instructions && (
              <section className="nj-block nj-block-rules">
                <h3 className="nj-kufi">
                  <Icon name="alert" size={19} />
                  تعليمات مهمّة
                </h3>
                <div className="nj-prose">
                  {String(e.instructions)
                    .split(/\n{2,}/)
                    .map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                </div>
              </section>
            )}

            {e.links.length > 0 && (
              <section className="nj-block">
                <h3 className="nj-kufi">
                  <Icon name="doc" size={19} />
                  مستندات مرفقة
                </h3>
                <LinkList links={e.links} />
              </section>
            )}
          </article>
        )}
      </DataStateBlock>
    </div>
  );
}
