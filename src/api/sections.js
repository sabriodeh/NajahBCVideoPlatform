import { supabase } from "../lib/supabase.js";

const COLUMNS = "id,slug,title,description,parent_id,sort_order";

/** ترتيب ثابت: حسب sort_order ثم أبجدياً عربياً عند التساوي. */
const byOrder = (a, b) =>
  a.sort_order - b.sort_order || String(a.title).localeCompare(String(b.title), "ar");

/**
 * يحوّل صفوفاً مسطّحة إلى شجرة مستويين.
 *
 * دالة نقية ومُصدَّرة لتُختبر بلا شبكة. تتسامح مع البيانات
 * المعطوبة: الصف الذي يشير إلى أب غير موجود يُعامَل جذراً بدل أن
 * يختفي من الواجهة بصمت.
 */
export function buildSectionTree(rows) {
  if (!Array.isArray(rows)) return [];

  const byId = new Map(rows.map((r) => [r.id, { ...r, children: [] }]));
  const roots = [];

  for (const node of byId.values()) {
    const parent = node.parent_id ? byId.get(node.parent_id) : null;
    if (parent && parent !== node) parent.children.push(node);
    else roots.push(node);
  }

  roots.sort(byOrder);
  for (const node of byId.values()) node.children.sort(byOrder);

  return roots;
}

/** شجرة المواضيع كاملة. */
export async function fetchSectionTree() {
  const { data, error } = await supabase.from("sections").select(COLUMNS).order("sort_order");
  if (error) throw new Error(error.message);
  return buildSectionTree(data);
}

/** موضوع واحد بمعرّفه النصّي، ومعه فروعه المباشرة. */
export async function fetchSectionBySlug(slug) {
  const { data, error } = await supabase.from("sections").select(COLUMNS).order("sort_order");
  if (error) throw new Error(error.message);

  const section = (data || []).find((s) => s.slug === slug);
  if (!section) return null;

  return {
    ...section,
    children: (data || []).filter((s) => s.parent_id === section.id).sort(byOrder),
    parent: section.parent_id ? (data || []).find((s) => s.id === section.parent_id) || null : null,
  };
}
