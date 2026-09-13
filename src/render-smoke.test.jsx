/* ============================================================
   اختبارات تصيير سريعة
   ------------------------------------------------------------
   تُصيَّر الصفحات المحميّة بسياق مصادقة مُصطنَع، دون حاجة إلى
   حساب حقيقي ولا إلى jsdom. الغرض رصد ما لا يظهر في lint ولا في
   build: استيراد خاطئ، أو قراءة حقل من كائن فارغ، أو انهيار عند
   التصيير — وكلها كانت ستمرّ إلى المرحلة ٣ بلا كشف.
   ============================================================ */

import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router";
import { AuthContext } from "./auth/context.js";
import { RequireAdmin } from "./auth/RequireAdmin.jsx";
import { AppShell } from "./components/AppShell.jsx";
import Login from "./pages/Login.jsx";
import ChangePassword from "./pages/ChangePassword.jsx";
import SectionsHome from "./pages/SectionsHome.jsx";
import SectionView from "./pages/SectionView.jsx";
import EntryView from "./pages/EntryView.jsx";
import { VideoPlayer } from "./components/VideoPlayer.jsx";
import { LinkList } from "./components/LinkList.jsx";
import { EntryCover } from "./components/EntryCover.jsx";

const baseAuth = {
  loading: false,
  session: null,
  user: null,
  profile: null,
  profileError: null,
  email: "",
  displayName: "",
  role: "member",
  isAdmin: false,
  isAuthenticated: false,
  mustChangePassword: false,
  signIn: async () => {},
  signOut: async () => {},
  changePassword: async () => ({ passwordChanged: true, flagCleared: true }),
};

const render = (ui, auth = {}, path = "/") =>
  renderToString(
    <AuthContext.Provider value={{ ...baseAuth, ...auth }}>
      <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
    </AuthContext.Provider>
  );

describe("Login", () => {
  it("يصيّر نموذج الدخول لغير المسجّل", () => {
    const html = render(<Login />);
    expect(html).toContain("دخول أعضاء الهيئة التدريسية");
    expect(html).toContain("البريد الجامعي");
  });

  it("يوضّح أن كلمة المرور المؤقتة هي البريد", () => {
    expect(render(<Login />)).toContain("كلمة المرور المؤقتة هي بريدك الجامعي");
  });
});

describe("ChangePassword", () => {
  const forced = { mustChangePassword: true, email: "someone@najah.edu" };

  it("يصيّر الوضع الإجباري", () => {
    expect(render(<ChangePassword />, forced)).toContain("اختر كلمة مرور جديدة");
  });

  /* انحدار مرصود: في الوضع الإجباري لا ترويسة ولا تنقّل ولا زر
     رجوع، والحارس يعيد كل مسار آخر إلى هنا. فمن تعذّر عليه إتمام
     التغيير كان يبقى محبوساً بلا مخرج سوى مسح بيانات الموقع. */
  it("يعرض مخرجاً بالخروج من الحساب حتى في الوضع الإجباري", () => {
    expect(render(<ChangePassword />, forced)).toContain("الخروج من الحساب");
  });

  it("يعرض زر الرجوع في الوضع الاختياري فقط", () => {
    const optional = render(<ChangePassword />, { mustChangePassword: false });
    expect(optional).toContain("رجوع");
    expect(render(<ChangePassword />, forced)).not.toContain(">رجوع<");
  });

  it("لا ينهار إن كان البريد غير معرّف", () => {
    expect(() => render(<ChangePassword />, { email: undefined })).not.toThrow();
  });
});

describe("SectionsHome", () => {
  it("يحيّي العضو باسمه", () => {
    expect(render(<SectionsHome />, { displayName: "د. محمد ابو عمر" })).toContain(
      "د. محمد ابو عمر"
    );
  });

  it("ينبّه عند تعذّر قراءة الملف الشخصي", () => {
    expect(render(<SectionsHome />, { profileError: "permission denied" })).toContain(
      "تعذّرت قراءة ملفك الشخصي"
    );
  });
});

describe("RequireAdmin", () => {
  const tree = (
    <Routes>
      <Route element={<RequireAdmin />}>
        <Route path="/" element={<p>محتوى إداري</p>} />
      </Route>
    </Routes>
  );

  it("يمنع غير الأدمن برسالة صريحة لا بتحويل صامت", () => {
    const html = render(tree, { isAdmin: false });
    expect(html).toContain("هذه الصفحة لإدارة المنصة");
    expect(html).not.toContain("محتوى إداري");
  });

  it("يمرّر الأدمن", () => {
    expect(render(tree, { isAdmin: true })).toContain("محتوى إداري");
  });
});

describe("AppShell", () => {
  const tree = (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<p>الصفحة</p>} />
      </Route>
    </Routes>
  );

  it("يعرض رابط التخطّي والتنقّل", () => {
    const html = render(tree, { displayName: "عضو" });
    expect(html).toContain("تخطَّ إلى المحتوى");
    expect(html).toContain("المواضيع");
  });

  it("يُظهر رابط الإدارة للأدمن وحده", () => {
    expect(render(tree, { isAdmin: true })).toContain("الإدارة");
    expect(render(tree, { isAdmin: false })).not.toContain("الإدارة");
  });
});

/* ------------------------------------------------------------
   المرحلة ٣
   ------------------------------------------------------------ */

describe("VideoPlayer", () => {
  /* لا سبيل لاكتشاف إطار درايف الفارغ برمجياً — فهو من أصل مختلف.
     فزر الفتح الخارجي والتنبيه ليسا تحسيناً بل المخرج الوحيد. */
  it("يعرض زر «افتح في درايف» وتنبيه najah.edu دائماً لا عند الفشل فقط", () => {
    const html = renderToString(<VideoPlayer kind="drive" videoRef="1abcDEFghij" title="س" />);
    expect(html).toContain("افتح في درايف");
    expect(html).toContain("najah.edu");
    expect(html).toContain("/preview");
  });

  it("يستخدم nocookie ليوتيوب حمايةً للخصوصية", () => {
    const html = renderToString(<VideoPlayer kind="youtube" videoRef="dQw4w9WgXcQ" title="س" />);
    expect(html).toContain("youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(html).toContain("افتح في يوتيوب");
  });

  it("لا يصيّر شيئاً بلا فيديو", () => {
    expect(renderToString(<VideoPlayer kind={null} videoRef={null} />)).toBe("");
  });
});

describe("LinkList", () => {
  it("يُسقط الروابط الخبيثة عند العرض", () => {
    const html = renderToString(
      <LinkList
        links={[
          { label: "سليم", url: "https://docs.google.com/document/d/1abcDEFghi/edit" },
          { label: "خبيث", url: "javascript:alert(1)" },
        ]}
      />
    );
    expect(html).toContain("سليم");
    expect(html).not.toContain("خبيث");
    expect(html).not.toContain("javascript:");
  });

  it("يفتح الروابط في تبويب جديد بأمان", () => {
    const html = renderToString(<LinkList links={[{ label: "أ", url: "https://example.com" }]} />);
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("لا يصيّر شيئاً بلا روابط صالحة", () => {
    expect(renderToString(<LinkList links={[{ url: "javascript:x" }]} />)).toBe("");
    expect(renderToString(<LinkList links={[]} />)).toBe("");
  });
});

describe("EntryCover", () => {
  it("يستخدم مصغّرة يوتيوب الحقيقية", () => {
    const html = renderToString(<EntryCover title="س" videoKind="youtube" videoRef="dQw4w9WgXcQ" />);
    expect(html).toContain("img.youtube.com/vi/dQw4w9WgXcQ");
  });

  /* مصغّرات درايف تتطلّب ملفاً عاماً، وملفاتنا مقيّدة على النطاق
     فتفشل حتماً — لذلك غلاف مولَّد بدل مربّع مكسور */
  it("يولّد غلافاً لفيديو درايف بدل مصغّرة فاشلة", () => {
    const html = renderToString(<EntryCover title="ورشة الأتمتة" videoKind="drive" videoRef="1abc" />);
    expect(html).not.toContain("drive.google.com/thumbnail");
    expect(html).toContain("linear-gradient");
  });
});

describe("صفحات المرحلة ٣", () => {
  it("SectionView تصيّر دون انهيار", () => {
    expect(() => render(<SectionView />, { isAdmin: true }, "/section/ai-agents")).not.toThrow();
  });

  it("EntryView تصيّر دون انهيار", () => {
    expect(() => render(<EntryView />, { isAdmin: false }, "/entry/1")).not.toThrow();
  });

  it("SectionsHome تصيّر دون انهيار", () => {
    expect(() => render(<SectionsHome />, { displayName: "عضو" })).not.toThrow();
  });
});
