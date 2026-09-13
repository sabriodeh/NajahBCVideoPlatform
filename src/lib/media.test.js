import { describe, expect, it } from "vitest";
import {
  extractDriveId,
  extractYouTubeId,
  drivePreviewUrl,
  youtubeEmbedUrl,
  youtubeThumbUrl,
  parseVideoUrl,
} from "./media.js";

/* معرّف درايف حقيقي الشكل (33 محرفاً) ومعرّف يوتيوب (11 محرفاً بالضبط) */
const DRIVE_ID = "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs";
const YT_ID = "dQw4w9WgXcQ";

describe("extractDriveId", () => {
  it("يستخرج المعرّف من رابط /file/d/ القياسي", () => {
    expect(extractDriveId(`https://drive.google.com/file/d/${DRIVE_ID}/view?usp=sharing`)).toBe(DRIVE_ID);
  });

  it("يستخرج المعرّف من رابط open?id=", () => {
    expect(extractDriveId(`https://drive.google.com/open?id=${DRIVE_ID}`)).toBe(DRIVE_ID);
  });

  it("يستخرج المعرّف من معامل id في وسط الرابط", () => {
    expect(extractDriveId(`https://drive.google.com/uc?export=download&id=${DRIVE_ID}`)).toBe(DRIVE_ID);
  });

  it("يستخرج المعرّف من رابط مستند جوجل /d/", () => {
    expect(extractDriveId(`https://docs.google.com/document/d/${DRIVE_ID}/edit`)).toBe(DRIVE_ID);
  });

  it("يعيد null للمدخلات الفارغة أو غير النصية", () => {
    for (const bad of [null, undefined, "", 0, false, {}, []]) {
      expect(extractDriveId(bad)).toBeNull();
    }
  });

  it("يعيد null لرابط بلا معرّف", () => {
    expect(extractDriveId("https://drive.google.com/drive/my-drive")).toBeNull();
  });

  it("يرفض المعرّفات الأقصر من عشرة محارف", () => {
    expect(extractDriveId("https://drive.google.com/file/d/abc123/view")).toBeNull();
  });
});

describe("extractYouTubeId", () => {
  it("يستخرج من watch?v=", () => {
    expect(extractYouTubeId(`https://www.youtube.com/watch?v=${YT_ID}`)).toBe(YT_ID);
  });

  it("يستخرج من youtu.be المختصر", () => {
    expect(extractYouTubeId(`https://youtu.be/${YT_ID}`)).toBe(YT_ID);
  });

  it("يستخرج من /embed/", () => {
    expect(extractYouTubeId(`https://www.youtube.com/embed/${YT_ID}`)).toBe(YT_ID);
  });

  it("يستخرج من /shorts/", () => {
    expect(extractYouTubeId(`https://www.youtube.com/shorts/${YT_ID}`)).toBe(YT_ID);
  });

  it("يستخرج من /live/", () => {
    expect(extractYouTubeId(`https://www.youtube.com/live/${YT_ID}`)).toBe(YT_ID);
  });

  it("يتجاهل المعاملات الزائدة مثل قائمة التشغيل ووقت البدء", () => {
    expect(extractYouTubeId(`https://www.youtube.com/watch?v=${YT_ID}&list=PLabc&index=2`)).toBe(YT_ID);
    expect(extractYouTubeId(`https://youtu.be/${YT_ID}?t=30`)).toBe(YT_ID);
  });

  it("يقبل نطاق الهاتف و nocookie", () => {
    expect(extractYouTubeId(`https://m.youtube.com/watch?v=${YT_ID}`)).toBe(YT_ID);
    expect(extractYouTubeId(`https://www.youtube-nocookie.com/embed/${YT_ID}`)).toBe(YT_ID);
  });

  it("يعيد null للمدخلات الفارغة أو غير النصية", () => {
    for (const bad of [null, undefined, "", 0, false, {}, []]) {
      expect(extractYouTubeId(bad)).toBeNull();
    }
  });

  it("يرفض ما ليس أحد عشر محرفاً بالضبط", () => {
    expect(extractYouTubeId("https://www.youtube.com/watch?v=tooshort")).toBeNull();
    expect(extractYouTubeId("https://www.youtube.com/watch?v=waaaaaaaaaytoolong123")).toBeNull();
  });

  it("لا يخلط رابط درايف على أنه يوتيوب", () => {
    expect(extractYouTubeId(`https://drive.google.com/file/d/${DRIVE_ID}/view`)).toBeNull();
  });
});

describe("بناء الروابط", () => {
  it("يبني رابط معاينة درايف", () => {
    expect(drivePreviewUrl(DRIVE_ID)).toBe(`https://drive.google.com/file/d/${DRIVE_ID}/preview`);
  });

  it("يبني رابط تضمين يوتيوب بنطاق nocookie حمايةً للخصوصية", () => {
    expect(youtubeEmbedUrl(YT_ID)).toBe(`https://www.youtube-nocookie.com/embed/${YT_ID}`);
  });

  it("يبني رابط الصورة المصغّرة ليوتيوب", () => {
    expect(youtubeThumbUrl(YT_ID)).toBe(`https://img.youtube.com/vi/${YT_ID}/hqdefault.jpg`);
  });

  it("يعيد null لمعرّف غير صالح بدل تركيب رابط معطوب", () => {
    expect(drivePreviewUrl(null)).toBeNull();
    expect(youtubeEmbedUrl("")).toBeNull();
    expect(youtubeThumbUrl(undefined)).toBeNull();
  });
});

describe("parseVideoUrl", () => {
  it("يتعرّف على يوتيوب", () => {
    expect(parseVideoUrl(`https://youtu.be/${YT_ID}`)).toEqual({ kind: "youtube", ref: YT_ID });
  });

  it("يتعرّف على درايف", () => {
    expect(parseVideoUrl(`https://drive.google.com/file/d/${DRIVE_ID}/view`)).toEqual({
      kind: "drive",
      ref: DRIVE_ID,
    });
  });

  it("يقدّم يوتيوب عند التطابق لأن نمطه أضيق", () => {
    expect(parseVideoUrl(`https://www.youtube.com/watch?v=${YT_ID}`).kind).toBe("youtube");
  });

  it("يعيد null لما لا يُفهم", () => {
    expect(parseVideoUrl("https://example.com/video.mp4")).toBeNull();
    expect(parseVideoUrl(null)).toBeNull();
  });
});
