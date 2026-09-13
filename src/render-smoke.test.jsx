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
