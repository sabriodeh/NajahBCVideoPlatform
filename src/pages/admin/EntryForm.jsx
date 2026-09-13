import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { createEntry, deleteEntry, fetchEntry, updateEntry } from "../../api/entries.js";
import { fetchSectionTree } from "../../api/sections.js";
import { useAsync } from "../../lib/useAsync.js";
import { classifyLink, isSafeHttpUrl } from "../../lib/links.js";
import { parseVideoUrl } from "../../lib/media.js";
import { drivePreviewUrl, youtubeEmbedUrl } from "../../lib/media.js";
import { Field } from "../../components/Field.jsx";
import { Icon } from "../../components/Icon.jsx";
import { ErrorState, Skeleton } from "../../components/DataState.jsx";

const EMPTY = {
  section_id: "",
  title: "",
  summary: "",
  instructions: "",
  agent_url: "",
  agent_access_note: "",
  video_url: "",
  links: [],
  sort_order: 0,
};

/** يحوّل صفّ قاعدة البيانات إلى قيم النموذج. دالة نقية. */
function toFormValues(entry) {
  if (!entry) return EMPTY;
  return {
    section_id: entry.section_id || "",
    title: entry.title || "",
    summary: entry.summary || "",
    instructions: entry.instructions || "",
    agent_url: entry.agent_url || "",
    agent_access_note: entry.agent_access_note || "",
    video_url:
      entry.video_kind === "youtube"
        ? `https://www.youtube.com/watch?v=${entry.video_ref}`
        : entry.video_kind === "drive"
          ? `https://drive.google.com/file/d/${entry.video_ref}/view`
          : "",
    links: Array.isArray(entry.links) ? entry.links : [],
    sort_order: entry.sort_order ?? 0,
  };
}

/** يسطّح شجرة المواضيع إلى خيارات قائمة منسدلة بإزاحة للفروع. */
function flattenSections(tree, depth = 0, out = []) {
  for (const node of tree || []) {
    out.push({ id: node.id, label: `${"— ".repeat(depth)}${node.title}` });
    flattenSections(node.children, depth + 1, out);
  }
  return out;
}

/**
 * غلاف التحميل.
 *
 * يفصل الجلب عن النموذج حتى تصل القيم الابتدائية جاهزة إلى
 * useState بدل حقنها لاحقاً عبر أثر — وهو نمط يسبّب تصييراً
 * متتالياً، ويدهس ما كتبه المستخدم لو وصل الطلب متأخراً.
 * الـ key يضمن نموذجاً جديداً عند الانتقال بين مدخلين.
 */
export default function EntryForm() {
  const { id } = useParams();
  const sections = useAsync(fetchSectionTree, []);
  const existing = useAsync(() => (id ? fetchEntry(id) : Promise.resolve(null)), [id]);

  if (sections.loading || existing.loading) {
    return (
      <div className="nj-wrap nj-page">
        <Skeleton rows={4} />
      </div>
    );
  }

  return (
    <EntryFormFields
      key={id || "new"}
      id={id}
      initial={toFormValues(existing.data)}
      sections={sections}
    />
  );
}

function EntryFormFields({ id, initial, sections }) {
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  /* ---------- التحقق ---------- */

  const video = form.video_url.trim() ? parseVideoUrl(form.video_url.trim()) : null;
  const videoError =
    form.video_url.trim() && !video
      ? "الرابط غير مفهوم. الصق رابط فيديو من درايف أو يوتيوب."
      : null;

  const agentError =
    form.agent_url.trim() && !isSafeHttpUrl(form.agent_url.trim())
      ? "رابط غير صالح. يجب أن يبدأ بـ https:// أو http://"
      : null;

  const linkErrors = form.links.map((l) =>
    l.url.trim() && !isSafeHttpUrl(l.url.trim())
      ? "رابط غير صالح. يجب أن يبدأ بـ https:// أو http://"
      : null
  );

  const valid =
    form.section_id &&
    form.title.trim() &&
    !videoError &&
    !agentError &&
    linkErrors.every((e) => !e);

  /* ---------- محرّر الروابط ---------- */

  const addLink = () => set({ links: [...form.links, { label: "", url: "" }] });

  const updateLink = (index, patch) =>
    set({ links: form.links.map((l, i) => (i === index ? { ...l, ...patch } : l)) });

  const removeLink = (index) => set({ links: form.links.filter((_, i) => i !== index) });

  /* ---------- الحفظ ---------- */

  const save = async (e) => {
    e.preventDefault();
    if (!valid) return;
    setSaveError("");
    setSaving(true);

    /* الروابط تُنقَّى مرة أخيرة قبل الحفظ: الصفّ الفارغ يُسقَط،
       وكل رابط يُصنَّف ليُعرض بأيقونته الصحيحة */
    const links = form.links
      .filter((l) => l.url.trim() && isSafeHttpUrl(l.url.trim()))
      .map((l) => ({
        url: l.url.trim(),
        label: l.label.trim() || l.url.trim(),
        kind: classifyLink(l.url.trim()),
      }));

    const payload = {
      section_id: form.section_id,
      title: form.title.trim(),
      summary: form.summary.trim() || null,
      instructions: form.instructions.trim() || null,
      agent_url: form.agent_url.trim() || null,
      agent_access_note: form.agent_access_note.trim() || null,
      video_kind: video?.kind || null,
      video_ref: video?.ref || null,
      links,
      sort_order: Number(form.sort_order) || 0,
    };

    try {
      const saved = isEdit ? await updateEntry(id, payload) : await createEntry(payload);
      navigate(`/entry/${saved.id}`, { replace: true });
    } catch (err) {
      setSaveError(err.message);
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      await deleteEntry(id);
      navigate("/admin", { replace: true });
    } catch (err) {
      setSaveError(err.message);
      setSaving(false);
    }
  };

  const options = flattenSections(sections.data);

  return (
    <div className="nj-wrap nj-page" style={{ maxWidth: 820 }}>
      <h2 className="nj-kufi">{isEdit ? "تحرير مدخل" : "مدخل جديد"}</h2>
      <p className="nj-lead">
        كل المحتوى روابط — لا تُرفع ملفات إلى المنصة.
      </p>

      <form className="nj-panel" onSubmit={save} noValidate style={{ marginTop: 22 }}>
        {(saveError || sections.error) && (
          <ErrorState error={saveError || sections.error} />
        )}

        <Field
          id="section"
          label="الموضوع"
          as="select"
          required
          value={form.section_id}
          onChange={(e) => set({ section_id: e.target.value })}
          disabled={saving}
        >
          <option value="">— اختر الموضوع —</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </Field>

        <Field
          id="title"
          label="العنوان"
          required
          value={form.title}
          onChange={(e) => set({ title: e.target.value })}
          disabled={saving}
          placeholder="وكيل تحليل القوائم المالية"
        />

        <Field
          id="summary"
          label="نبذة"
          as="textarea"
          value={form.summary}
          onChange={(e) => set({ summary: e.target.value })}
          disabled={saving}
          hint="سطران يظهران في قائمة المداخل."
        />

        <fieldset className="nj-fieldset">
          <legend className="nj-kufi">
            <Icon name="agent" size={17} /> الوكيل
          </legend>

          <Field
            id="agent-url"
            label="رابط الوكيل"
            dir="ltr"
            style={{ textAlign: "left" }}
            value={form.agent_url}
            onChange={(e) => set({ agent_url: e.target.value })}
            disabled={saving}
            error={agentError}
            placeholder="https://gemini.google.com/gem/..."
          />

          <Field
            id="agent-note"
            label="كيفية الدخول إليه"
            as="textarea"
            value={form.agent_access_note}
            onChange={(e) => set({ agent_access_note: e.target.value })}
            disabled={saving}
            hint="مثال: سجّل الدخول بحساب najah.edu ثم اضغط «استخدام»."
          />
        </fieldset>

        <fieldset className="nj-fieldset">
          <legend className="nj-kufi">
            <Icon name="video" size={17} /> الفيديو
          </legend>

          <Field
            id="video-url"
            label="رابط الفيديو"
            dir="ltr"
            style={{ textAlign: "left" }}
            value={form.video_url}
            onChange={(e) => set({ video_url: e.target.value })}
            disabled={saving}
            error={videoError}
            hint="درايف أو يوتيوب — يُتعرَّف على النوع تلقائياً."
            placeholder="https://drive.google.com/file/d/..."
          />

          {video && (
            <div className="nj-note ok" style={{ marginBottom: 0 }}>
              تعرّفنا على فيديو {video.kind === "youtube" ? "يوتيوب" : "درايف"} — المعرّف{" "}
              <code dir="ltr">{video.ref}</code>
              <div style={{ marginTop: 12, maxWidth: 360 }}>
                <div style={{ aspectRatio: "16 / 9" }}>
                  <iframe
                    src={
                      video.kind === "youtube"
                        ? youtubeEmbedUrl(video.ref)
                        : drivePreviewUrl(video.ref)
                    }
                    title="معاينة"
                    allowFullScreen
                    style={{ width: "100%", height: "100%", border: 0, borderRadius: 4 }}
                  />
                </div>
                <p className="nj-hint">
                  إن ظهرت المعاينة فارغة، تأكد أنك مسجّل بحساب najah.edu — لا يعني ذلك خطأً في
                  الرابط.
                </p>
              </div>
            </div>
          )}
        </fieldset>

        <Field
          id="instructions"
          label="تعليمات مهمّة"
          as="textarea"
          value={form.instructions}
          onChange={(e) => set({ instructions: e.target.value })}
          disabled={saving}
          style={{ minHeight: 160 }}
          hint="تُعرض مميّزة بصرياً لأنها ملزِمة. اترك سطراً فارغاً بين الفقرات."
        />

        <fieldset className="nj-fieldset">
          <legend className="nj-kufi">
            <Icon name="doc" size={17} /> مستندات مرفقة
          </legend>

          {form.links.length === 0 && (
            <p className="nj-hint" style={{ marginBottom: 12 }}>
              روابط جوجل دوكس أو شيتس أو أي ملف على درايف.
            </p>
          )}

          {form.links.map((link, i) => (
            <div key={i} className="nj-link-row">
              <Field
                id={`link-label-${i}`}
                label="الاسم المعروض"
                value={link.label}
                onChange={(e) => updateLink(i, { label: e.target.value })}
                disabled={saving}
                placeholder="نموذج خطة المساق"
              />

              <Field
                id={`link-url-${i}`}
                label="الرابط"
                dir="ltr"
                style={{ textAlign: "left" }}
                value={link.url}
                onChange={(e) => updateLink(i, { url: e.target.value })}
                disabled={saving}
                error={linkErrors[i]}
                placeholder="https://docs.google.com/..."
              />

              <button
                type="button"
                className="nj-btn-ghost"
                onClick={() => removeLink(i)}
                disabled={saving}
                aria-label={`احذف الرابط ${i + 1}`}
              >
                <Icon name="trash" size={16} />
              </button>
            </div>
          ))}

          <button type="button" className="nj-btn-ghost" onClick={addLink} disabled={saving}>
            <Icon name="plus" size={16} />
            أضف رابطاً
          </button>
        </fieldset>

        <Field
          id="sort"
          label="الترتيب"
          type="number"
          value={form.sort_order}
          onChange={(e) => set({ sort_order: e.target.value })}
          disabled={saving}
          hint="الأصغر يظهر أولاً."
        />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
          <button className="nj-btn" type="submit" disabled={!valid || saving}>
            {saving ? "نحفظ…" : isEdit ? "احفظ التعديلات" : "أضف المدخل"}
          </button>

          <button
            type="button"
            className="nj-btn-ghost"
            onClick={() => navigate(-1)}
            disabled={saving}
          >
            إلغاء
          </button>

          {isEdit && (
            <button
              type="button"
              className="nj-btn-ghost"
              onClick={() => setConfirmDelete(true)}
              disabled={saving}
              style={{ marginInlineStart: "auto", color: "var(--wine)" }}
            >
              <Icon name="trash" size={16} />
              احذف
            </button>
          )}
        </div>

        {/* تأكيد قبل الحذف: كان الرفض في النسخة القديمة حذفاً فورياً
            بلا تأكيد ولا تراجع */}
        {confirmDelete && (
          <div className="nj-note bad" style={{ marginTop: 16 }} role="alertdialog">
            <strong>حذف «{form.title}» نهائياً؟</strong>
            <p style={{ margin: "6px 0 12px" }}>لا يمكن التراجع عن هذا.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" className="nj-btn" onClick={remove} disabled={saving}>
                نعم، احذف
              </button>
              <button
                type="button"
                className="nj-btn-ghost"
                onClick={() => setConfirmDelete(false)}
                disabled={saving}
              >
                تراجع
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
