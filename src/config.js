/* ============================================================
   إعدادات الاتصال بـ Supabase
   ------------------------------------------------------------
   مفتاح anon علني بحكم التصميم: يُضمَّن في حزمة الجافاسكربت
   المنشورة ويستطيع أي زائر قراءته. الحماية الحقيقية هي Row
   Level Security على الجداول، لا إخفاء المفتاح.

   يمكن تجاوز القيم بمتغيّرات بيئة عند تدوير المفاتيح، لكن
   القيم المضمّنة تبقى احتياطاً حتى لا ينتج عن بيئة ناقصة
   تطبيقٌ بلا اتصال.
   ============================================================ */

const FALLBACK_URL = "https://unbhwhglyxpasqnyeaoy.supabase.co";
const FALLBACK_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuYmh3aGdseXhwYXNxbnllYW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMDI3NDgsImV4cCI6MjEwNDc3ODc0OH0.CT-XdePs74rXIFyhmeQ14b0A09HTqSSb4Wk3VlFTCEU";

/* متغيّر البيئة يُعتمد فقط إن كان نصاً غير فارغ — القيمة الفارغة
   تعني بيئة ناقصة لا نيّة لتعطيل الاتصال */
const pick = (envValue, fallback) => {
  const v = typeof envValue === "string" ? envValue.trim() : "";
  return v || fallback;
};

export const SUPABASE_URL = pick(import.meta.env?.VITE_SUPABASE_URL, FALLBACK_URL);
export const SUPABASE_ANON_KEY = pick(import.meta.env?.VITE_SUPABASE_ANON_KEY, FALLBACK_ANON_KEY);

/**
 * سبب تعطّل الإعداد، أو null إن كان سليماً.
 *
 * النسخة السابقة كانت تحوّل المفاتيح الناقصة إلى «وضع عرض» صامت
 * ببيانات وهمية — أي أن موقع الكلية العلني كان قد ينشر أسماء
 * ومحتوى ملفَّقين دون أن يفشل البناء ودون أن ينتبه أحد. هنا
 * يُعرض الخطأ صراحةً بدل إخفائه.
 */
export const configError = (() => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return "مفاتيح Supabase غير مضبوطة. راجع src/config.js أو متغيّرات البيئة.";
  }
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(SUPABASE_URL)) {
    return `عنوان Supabase غير صالح: ${SUPABASE_URL}`;
  }
  return null;
})();

/** التواصل مع العمادة عند تعذّر الدخول. */
export const CONTACT = "business@najah.edu";
