import { describe, expect, it } from "vitest";
import { buildSectionTree } from "./sections.js";
import { sanitizeEntry } from "./entries.js";
import { describeDataError } from "../lib/errors.js";

describe("buildSectionTree", () => {
  const rows = [
    { id: "p2", title: "السياسات", parent_id: null, sort_order: 2 },
    { id: "c2", title: "للطلبة", parent_id: "p2", sort_order: 2 },
    { id: "p1", title: "الوكلاء", parent_id: null, sort_order: 1 },
    { id: "c1", title: "للمدرسين", parent_id: "p2", sort_order: 1 },
  ];

  it("يبني جذوراً وفروعاً", () => {
    const tree = buildSectionTree(rows);
    expect(tree).toHaveLength(2);
    expect(tree[0].title).toBe("الوكلاء");
    expect(tree[1].children.map((c) => c.title)).toEqual(["للمدرسين", "للطلبة"]);
  });

  it("يرتّب الجذور والفروع بـ sort_order", () => {
    const tree = buildSectionTree(rows);
    expect(tree.map((s) => s.sort_order)).toEqual([1, 2]);
    expect(tree[1].children.map((c) => c.sort_order)).toEqual([1, 2]);
  });

  /* البيانات المعطوبة لا يجوز أن تُخفي محتوى بصمت: الصف اليتيم
     يُعرض جذراً بدل أن يختفي من الواجهة بلا أثر */
  it("يعامل الصف ذا الأب المفقود جذراً بدل إسقاطه", () => {
    const tree = buildSectionTree([{ id: "x", title: "يتيم", parent_id: "لا-يوجد", sort_order: 1 }]);
    expect(tree).toHaveLength(1);
    expect(tree[0].title).toBe("يتيم");
  });

  it("لا ينهار على مدخلات غير صالحة", () => {
    for (const bad of [null, undefined, "نص", 42, {}]) {
      expect(buildSectionTree(bad)).toEqual([]);
    }
  });

  it("لا يدخل في حلقة إن أشار صف إلى نفسه", () => {
    const tree = buildSectionTree([{ id: "a", title: "أ", parent_id: "a", sort_order: 1 }]);
    expect(tree).toHaveLength(1);
  });
});

describe("sanitizeEntry", () => {
  /* خط الدفاع الأخير: صفوف البذرة وأي إدراج يدوي بـ SQL لا تمرّ
     على نموذج الإدارة، فالفحص عند العرض هو الوحيد أمامها */
  it("يُسقط الروابط ذات المخططات القابلة للتنفيذ", () => {
    const clean = sanitizeEntry({
      title: "س",
      agent_url: "javascript:alert(1)",
      links: [
        { label: "سليم", url: "https://docs.google.com/x" },
        { label: "خبيث", url: "javascript:alert(1)" },
        { label: "خبيث٢", url: "data:text/html,<script>" },
      ],
    });

    expect(clean.agent_url).toBeNull();
    expect(clean.links).toHaveLength(1);
    expect(clean.links[0].url).toBe("https://docs.google.com/x");
  });

  it("يُبقي رابط الوكيل السليم", () => {
    const clean = sanitizeEntry({ title: "س", agent_url: "https://gemini.google.com/gem/x" });
    expect(clean.agent_url).toBe("https://gemini.google.com/gem/x");
  });

  it("يستبدل التسمية الفارغة بالرابط نفسه بدل ترك فراغ", () => {
    const clean = sanitizeEntry({
      title: "س",
      links: [{ label: "   ", url: "https://example.com/a" }],
    });
    expect(clean.links[0].label).toBe("https://example.com/a");
  });

  it("يتسامح مع links ليست مصفوفة", () => {
    for (const bad of [null, undefined, "نص", 5, {}]) {
      expect(sanitizeEntry({ title: "س", links: bad }).links).toEqual([]);
    }
  });

  it("يعيد null للصف الفارغ", () => {
    expect(sanitizeEntry(null)).toBeNull();
  });
});

describe("describeDataError", () => {
  it("يميّز السكيما غير المطبَّقة", () => {
    const info = describeDataError('relation "public.entries" does not exist');
    expect(info.kind).toBe("not-migrated");
    expect(info.title).toBe("المنصة قيد التهيئة");
  });

  it("يميّز منع الصلاحيات", () => {
    expect(describeDataError("permission denied for table entries").kind).toBe("forbidden");
    expect(describeDataError("new row violates row-level security policy").kind).toBe("forbidden");
  });

  it("يميّز انقطاع الشبكة", () => {
    expect(describeDataError("Failed to fetch").kind).toBe("offline");
  });

  it("يحتفظ بالنصّ الأصلي للأخطاء المجهولة", () => {
    const info = describeDataError("مفاجأة غير متوقّعة");
    expect(info.kind).toBe("unknown");
    expect(info.raw).toBe("مفاجأة غير متوقّعة");
  });

  it("يعيد null عند غياب الخطأ", () => {
    expect(describeDataError(null)).toBeNull();
    expect(describeDataError("")).toBeNull();
  });
});
