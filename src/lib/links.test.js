import { describe, expect, it } from "vitest";
import { classifyLink, isSafeHttpUrl, LINK_KIND_LABELS } from "./links.js";

describe("classifyLink", () => {
  const cases = [
    ["https://docs.google.com/document/d/1abcDEFghi/edit", "doc"],
    ["https://docs.google.com/spreadsheets/d/1abcDEFghi/edit#gid=0", "sheet"],
    ["https://docs.google.com/presentation/d/1abcDEFghi/edit", "slide"],
    ["https://docs.google.com/forms/d/1abcDEFghi/viewform", "form"],
    ["https://drive.google.com/drive/folders/1abcDEFghi", "folder"],
    ["https://drive.google.com/file/d/1abcDEFghi/view", "file"],
    ["https://example.com/policy.pdf", "pdf"],
    ["https://example.com/policy.PDF?v=2", "pdf"],
    ["https://example.com/anything", "other"],
  ];

  for (const [url, expected] of cases) {
    it(`يصنّف ${url} كـ ${expected}`, () => {
      expect(classifyLink(url)).toBe(expected);
    });
  }

  it("يعيد other للمدخلات الفارغة أو غير النصية بدل الانهيار", () => {
    for (const bad of [null, undefined, "", 0, {}, []]) {
      expect(classifyLink(bad)).toBe("other");
    }
  });

  it("لكل تصنيف تسمية عربية للعرض", () => {
    const kinds = ["doc", "sheet", "slide", "form", "folder", "file", "pdf", "other"];
    for (const k of kinds) {
      expect(typeof LINK_KIND_LABELS[k]).toBe("string");
      expect(LINK_KIND_LABELS[k].length).toBeGreaterThan(0);
    }
  });
});

describe("isSafeHttpUrl", () => {
  it("يقبل http و https", () => {
    expect(isSafeHttpUrl("https://docs.google.com/x")).toBe(true);
    expect(isSafeHttpUrl("http://example.com")).toBe(true);
  });

  /* الأدمن يلصق روابط حرة تُعرض كـ <a href> — لذا رفض المخططات
     القابلة للتنفيذ شرط أمني لا تجميلي */
  it("يرفض المخططات القابلة للتنفيذ", () => {
    const hostile = [
      "javascript:alert(1)",
      "JavaScript:alert(1)",
      "  javascript:alert(1)",
      "\njavascript:alert(1)",
      "java\tscript:alert(1)",
      "data:text/html;base64,PHNjcmlwdD4=",
      "vbscript:msgbox(1)",
      "file:///etc/passwd",
    ];
    for (const bad of hostile) {
      expect(isSafeHttpUrl(bad)).toBe(false);
    }
  });

  it("يرفض المدخلات الفارغة وغير النصية", () => {
    for (const bad of [null, undefined, "", 0, {}, [], "ليس رابطاً"]) {
      expect(isSafeHttpUrl(bad)).toBe(false);
    }
  });
});
