/* ============================================================
   أدوات الوسائط — استخراج معرّفات الفيديو وبناء روابط العرض
   ------------------------------------------------------------
   دوال نقية بلا أي تبعية على الشبكة أو الـ DOM، لتبقى قابلة
   للاختبار وحدها. لا تتحقق هذه الطبقة من صلاحية الوصول إلى
   الملف — التحقق من الصلاحيات مسؤولية درايف نفسه.
   ============================================================ */

/* محارف المعرّفات في جوجل ويوتيوب: حروف وأرقام وشرطة وشرطة سفلية */
const ID_CHARS = "A-Za-z0-9_-";

/* يوتيوب يستخدم أحد عشر محرفاً بالضبط — النظرة الأمامية السالبة
   تمنع اقتطاع أول أحد عشر محرفاً من سلسلة أطول واعتبارها معرّفاً */
const YT = `([${ID_CHARS}]{11})(?![${ID_CHARS}])`;

const isNonEmptyString = (v) => typeof v === "string" && v.length > 0;

const firstMatch = (url, patterns) => {
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
};

/**
 * يستخرج معرّف ملف من رابط جوجل درايف أو مستندات جوجل.
 * @returns {string|null}
 */
export function extractDriveId(url) {
  if (!isNonEmptyString(url)) return null;
  return firstMatch(url, [
    new RegExp(`/file/d/([${ID_CHARS}]{10,})`),
    new RegExp(`[?&]id=([${ID_CHARS}]{10,})`),
    new RegExp(`/d/([${ID_CHARS}]{10,})`),
  ]);
}

/**
 * يستخرج معرّف فيديو يوتيوب من أي من صيغ الروابط الشائعة.
 * @returns {string|null}
 */
export function extractYouTubeId(url) {
  if (!isNonEmptyString(url)) return null;
  /* البوابة على النطاق تمنع التقاط معرّفات من روابط ليست ليوتيوب */
  if (!/(?:youtube\.com|youtube-nocookie\.com|youtu\.be)/i.test(url)) return null;
  return firstMatch(url, [
    new RegExp(`[?&]v=${YT}`),
    new RegExp(`youtu[.]be/${YT}`),
    new RegExp(`/embed/${YT}`),
    new RegExp(`/shorts/${YT}`),
    new RegExp(`/live/${YT}`),
  ]);
}

/** رابط مشغّل درايف المضمَّن. */
export const drivePreviewUrl = (id) =>
  isNonEmptyString(id) ? `https://drive.google.com/file/d/${id}/preview` : null;

/** رابط تضمين يوتيوب — نطاق nocookie لتقليل التتبّع. */
export const youtubeEmbedUrl = (id) =>
  isNonEmptyString(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;

/** الصورة المصغّرة ليوتيوب — علنية دائماً ولا تحتاج مصادقة. */
export const youtubeThumbUrl = (id) =>
  isNonEmptyString(id) ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;

/**
 * يحدّد نوع الفيديو ومعرّفه من رابط واحد، ليتمكّن الأدمن من لصق
 * أي رابط دون اختيار النوع يدوياً.
 * يُجرَّب يوتيوب أولاً لأن نمطه أضيق وأقل احتمالاً للتطابق العرضي.
 * @returns {{kind: "youtube"|"drive", ref: string}|null}
 */
export function parseVideoUrl(url) {
  const yt = extractYouTubeId(url);
  if (yt) return { kind: "youtube", ref: yt };

  const drive = extractDriveId(url);
  if (drive) return { kind: "drive", ref: drive };

  return null;
}
