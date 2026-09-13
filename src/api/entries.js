import { supabase } from "../lib/supabase.js";
import { isSafeHttpUrl } from "../lib/links.js";

const COLUMNS =
  "id,section_id,title,summary,instructions,agent_url,agent_access_note," +
  "video_kind,video_ref,links,sort_order,created_at,updated_at";

/**
 * ينظّف مدخلاً قادماً من قاعدة البيانات قبل عرضه.
 *
 * الفحص عند الحفظ وحده لا يكفي: صفوف البذرة وأي إدخال يدوي بـ SQL
 * لا تمرّ على النموذج إطلاقاً. فأي رابط غير صالح للعرض كـ href
 * — javascript: مثلاً — يُسقَط هنا قبل أن يصل إلى الواجهة.
 */
export function sanitizeEntry(row) {
  if (!row) return null;

  const links = Array.isArray(row.links) ? row.links : [];

  return {
    ...row,
    agent_url: isSafeHttpUrl(row.agent_url) ? row.agent_url : null,
    links: links
      .filter((l) => l && isSafeHttpUrl(l.url))
      .map((l) => ({
        url: l.url,
        label: typeof l.label === "string" && l.label.trim() ? l.label.trim() : l.url,
        kind: typeof l.kind === "string" ? l.kind : undefined,
      })),
  };
}

/** مداخل موضوع واحد. */
export async function fetchEntriesBySection(sectionId) {
  const { data, error } = await supabase
    .from("entries")
    .select(COLUMNS)
    .eq("section_id", sectionId)
    .order("sort_order")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(sanitizeEntry);
}

/** مدخل واحد بمعرّفه. */
export async function fetchEntry(id) {
  const { data, error } = await supabase.from("entries").select(COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return sanitizeEntry(data);
}

/** كل المداخل — لشاشة الإدارة. */
export async function fetchAllEntries() {
  const { data, error } = await supabase
    .from("entries")
    .select(`${COLUMNS},sections(title,slug)`)
    .order("section_id")
    .order("sort_order");

  if (error) throw new Error(error.message);
  return (data || []).map((r) => ({ ...sanitizeEntry(r), section: r.sections || null }));
}

export async function createEntry(payload) {
  const { data, error } = await supabase.from("entries").insert(payload).select(COLUMNS).single();
  if (error) throw new Error(error.message);
  return sanitizeEntry(data);
}

export async function updateEntry(id, payload) {
  const { data, error } = await supabase
    .from("entries")
    .update(payload)
    .eq("id", id)
    .select(COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return sanitizeEntry(data);
}

export async function deleteEntry(id) {
  const { error } = await supabase.from("entries").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
