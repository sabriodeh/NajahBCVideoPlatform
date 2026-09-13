/* ============================================================
   أدوات الروابط — تصنيف روابط جوجل والتحقق من سلامتها
   ------------------------------------------------------------
   دوال نقية. تُستعمل في عرض قائمة المستندات المرفقة بكل مدخل،
   وفي التحقق من الروابط التي يلصقها الأدمن قبل حفظها.
   ============================================================ */

/** التسميات العربية المعروضة لكل تصنيف. */
export const LINK_KIND_LABELS = {
  doc: "مستند",
  sheet: "جدول بيانات",
  slide: "عرض تقديمي",
  form: "نموذج",
  folder: "مجلد",
  file: "ملف على درايف",
  pdf: "ملف PDF",
  other: "رابط",
};

/* الترتيب مهم: الأنماط الأضيق أولاً، وdocs.google قبل drive.google
   لأن مستندات جوجل لها مسارات خاصة لا تشبه ملفات درايف العادية */
const RULES = [
  [/docs\.google\.com\/document\//i, "doc"],
  [/docs\.google\.com\/spreadsheets\//i, "sheet"],
  [/docs\.google\.com\/presentation\//i, "slide"],
  [/docs\.google\.com\/forms\//i, "form"],
  [/drive\.google\.com\/drive\/folders\//i, "folder"],
  [/drive\.google\.com\/file\//i, "file"],
  [/\.pdf(?:$|[?#])/i, "pdf"],
];

/**
 * يحدّد نوع الرابط لاختيار الأيقونة والتسمية المناسبة.
 * لا يرمي أبداً — يعيد "other" لأي مدخل غير مفهوم.
 * @returns {keyof typeof LINK_KIND_LABELS}
 */
export function classifyLink(url) {
  if (typeof url !== "string" || !url) return "other";
  for (const [pattern, kind] of RULES) {
    if (pattern.test(url)) return kind;
  }
  return "other";
}

/**
 * يتحقق أن الرابط صالح للعرض كـ href.
 *
 * الأدمن يلصق روابط حرة تُصيَّر داخل <a href>، فالمخططات القابلة
 * للتنفيذ (javascript:, data:, vbscript:) تصبح ثغرة XSS مخزَّنة.
 * المتصفحات تتجاهل محارف التحكم داخل المخطط، فـ "java\tscript:"
 * ينفَّذ كـ "javascript:" — لذلك تُنزع هذه المحارف قبل الفحص.
 */
export function isSafeHttpUrl(url) {
  if (typeof url !== "string" || !url) return false;

  /* نزع محارف التحكم ومسافات الأطراف قبل أي حكم */
  // eslint-disable-next-line no-control-regex -- مقصود: هذه المحارف بالذات هي الخطر
  const cleaned = url.replace(/[\u0000-\u001F\u007F]/g, "").trim();
  if (!cleaned) return false;

  try {
    const { protocol } = new URL(cleaned);
    return protocol === "http:" || protocol === "https:";
  } catch {
    /* روابط نسبية أو نص حر ليست صالحة كوجهة خارجية */
    return false;
  }
}
