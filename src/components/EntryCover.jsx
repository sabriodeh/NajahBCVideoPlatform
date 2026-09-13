import { useState } from "react";
import { youtubeThumbUrl } from "../lib/media.js";
import { Icon } from "./Icon.jsx";

/* تدرّجات من ألوان الهوية — يُختار واحد بثبات من نصّ العنوان،
   فيبقى غلاف المدخل نفسه في كل زيارة بدل أن يتغيّر عشوائياً */
const GRADIENTS = [
  "linear-gradient(135deg, #901939, #5e0f25)",
  "linear-gradient(135deg, #5e0f25, #2b1119)",
  "linear-gradient(135deg, #a93352, #901939)",
  "linear-gradient(135deg, #7a5f66, #5e0f25)",
];

const hashOf = (text) => {
  let h = 0;
  for (let i = 0; i < String(text).length; i++) h = (h * 31 + String(text).charCodeAt(i)) | 0;
  return Math.abs(h);
};

/** أول حرفين ذَوَي معنى من العنوان. */
const initials = (title) => {
  const clean = String(title || "").trim();
  if (!clean) return "؟";
  const words = clean.split(/\s+/).filter(Boolean);
  return words.length >= 2 ? words[0][0] + words[1][0] : clean.slice(0, 2);
};

/**
 * غلاف المدخل.
 *
 * يوتيوب يعطي صورة مصغّرة علنية تعمل دائماً. أما درايف فمصغّراته
 * تتطلّب ملفاً عاماً، وملفاتنا مقيّدة على نطاق الجامعة — فتفشل
 * حتماً. لذلك يُولَّد غلاف من ألوان الهوية وأحرف العنوان بدل
 * مربّع مكسور.
 */
export function EntryCover({ title, videoKind, videoRef }) {
  const [failed, setFailed] = useState(false);

  const thumb = videoKind === "youtube" && videoRef ? youtubeThumbUrl(videoRef) : null;
  const showImage = thumb && !failed;

  return (
    <div
      style={{
        position: "relative",
        aspectRatio: "16 / 9",
        borderRadius: "var(--r-sm)",
        overflow: "hidden",
        background: showImage ? "#000" : GRADIENTS[hashOf(title) % GRADIENTS.length],
        display: "grid",
        placeItems: "center",
        flex: "none",
      }}
    >
      {showImage ? (
        <img
          src={thumb}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <span
          className="nj-kufi"
          aria-hidden="true"
          style={{
            color: "var(--sand)",
            fontSize: "clamp(1.1rem, 4vw, 1.8rem)",
            opacity: 0.85,
            letterSpacing: "0.02em",
          }}
        >
          {initials(title)}
        </span>
      )}

      {videoKind && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            insetInlineEnd: 8,
            insetBlockEnd: 8,
            background: "rgb(0 0 0 / 55%)",
            color: "#fff",
            borderRadius: "var(--r-sm)",
            padding: "4px 7px",
            display: "inline-flex",
          }}
        >
          <Icon name="play" size={13} />
        </span>
      )}
    </div>
  );
}
