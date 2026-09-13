import { drivePreviewUrl, youtubeEmbedUrl } from "../lib/media.js";
import { Icon } from "./Icon.jsx";

/**
 * مشغّل الفيديو — درايف أو يوتيوب.
 *
 * مبنيّ ليعمل في الحالتين دون انتظار حسم مسألة تضمين درايف المقيّد:
 *
 * قِسنا أن درايف لا يمنع التأطير بترويسة، لكن الملف بلا صلاحية
 * وصول يعرض إطاراً فارغاً تماماً — بلا رسالة ولا «اطلب صلاحية».
 * ويبقى احتمال أن يحجب المتصفح كوكيز الطرف الثالث فلا تصل جلسة
 * جوجل إلى الإطار، فيرى حتى العضو المخوَّل فراغاً.
 *
 * لذلك زر «افتح في درايف» ظاهر دائماً لا عند الفشل فقط: لا سبيل
 * لاكتشاف الإطار الفارغ برمجياً — فهو من أصل مختلف — والاكتفاء
 * بالتضمين يترك المستخدم أمام مستطيل أسود بلا تفسير ولا مخرج.
 */
export function VideoPlayer({ kind, videoRef, title }) {
  if (!kind || !videoRef) return null;

  const isDrive = kind === "drive";
  const src = isDrive ? drivePreviewUrl(videoRef) : youtubeEmbedUrl(videoRef);
  if (!src) return null;

  const externalUrl = isDrive
    ? `https://drive.google.com/file/d/${videoRef}/view`
    : `https://www.youtube.com/watch?v=${videoRef}`;

  return (
    <figure style={{ margin: 0 }}>
      <div
        style={{
          position: "relative",
          aspectRatio: "16 / 9",
          background: "#000",
          borderRadius: "var(--r-md)",
          overflow: "hidden",
          border: "1px solid var(--line)",
        }}
      >
        <iframe
          src={src}
          title={title ? `فيديو: ${title}` : "مشغّل الفيديو"}
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
        />
      </div>

      <figcaption
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginTop: 12,
        }}
      >
        {isDrive && (
          <p className="nj-hint" style={{ margin: 0, flex: "1 1 320px" }}>
            لم يظهر الفيديو؟ تأكد أنك مسجّل الدخول في هذا المتصفح بحساب جامعة النجاح — الملفات
            مقيّدة على نطاق <span dir="ltr">najah.edu</span>.
          </p>
        )}

        <a
          className="nj-btn-ghost"
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: "none", marginInlineStart: isDrive ? "auto" : 0 }}
        >
          <Icon name="external" size={16} />
          {isDrive ? "افتح في درايف" : "افتح في يوتيوب"}
        </a>
      </figcaption>
    </figure>
  );
}
