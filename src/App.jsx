import React, { useState, useEffect, useMemo, useRef } from "react";

/* ============================================================
   منصة فيديوهات كلية الأعمال والاتصال — جامعة النجاح الوطنية
   النسخة النهائية
   ------------------------------------------------------------
   الحسابات مغلقة: تُنشأ من العمادة عبر seed-members.mjs فقط.
   لا يوجد تسجيل ذاتي. كلمة المرور المؤقتة = البريد الجامعي،
   ويُجبَر العضو على تغييرها عند أول دخول.
   ============================================================ */
const SUPABASE_URL = "https://unbhwhglyxpasqnyeaoy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuYmh3aGdseXhwYXNxbnllYW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMDI3NDgsImV4cCI6MjEwNDc3ODc0OH0.CT-XdePs74rXIFyhmeQ14b0A09HTqSSb4Wk3VlFTCEU";

const DEMO = !SUPABASE_URL || !SUPABASE_ANON_KEY;

/* شعار الكلية — مضمّن كي يعمل في أي بيئة بلا مسارات ملفات */
const LOGO = "data:image/png;base64,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";

/* ---------- أدوات درايف ---------- */

function extractDriveId(url) {
  if (!url) return null;
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]{10,})/,
    /[?&]id=([a-zA-Z0-9_-]{10,})/,
    /\/d\/([a-zA-Z0-9_-]{10,})/,
  ];
  for (const p of patterns) {
    const m = String(url).match(p);
    if (m) return m[1];
  }
  return null;
}

const thumbUrl = (id) => `https://drive.google.com/thumbnail?id=${id}&sz=w800`;
const playerUrl = (id) => `https://drive.google.com/file/d/${id}/preview`;

function checkPublic(fileId) {
  if (DEMO) return new Promise((r) => setTimeout(() => r(true), 700));
  return new Promise((resolve) => {
    const img = new Image();
    const timer = setTimeout(() => resolve(false), 8000);
    img.onload = () => { clearTimeout(timer); resolve(true); };
    img.onerror = () => { clearTimeout(timer); resolve(false); };
    img.src = `https://drive.google.com/thumbnail?id=${fileId}&sz=w200`;
  });
}

/* ---------- ثوابت ---------- */

const CATEGORIES = ["ورشة تدريبية", "محاضرة", "ندوة", "مشروع طلابي"];
const CONTACT = "business@najah.edu";

/* ---------- بيانات وضع العرض ---------- */

let demoSeq = 100;
const demoVideos = [
  {
    id: "d1", owner_id: "me", owner_name: "د. محمد ابو عمر",
    department: "ذكاء الأعمال", division: "دائرة الأعمال",
    title: "الأتمتة الذكية باستخدام AI Agents و n8n",
    description:
      "ورشة عملية حول بناء أنظمة أتمتة تربط Gmail وGoogle Sheets وWhatsApp، وتصميم Workflows متقدمة تنفّذ مهام تسويقية وتقنية تلقائياً.",
    drive_file_id: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    category: "ورشة تدريبية", published: true, created_at: "2026-04-17",
  },
  {
    id: "d2", owner_id: "u1", owner_name: "د. شذا قمحية",
    department: "التمويل والاستثمار", division: "دائرة الأعمال",
    title: "قراءة القوائم المالية قبل قرار الاستثمار",
    description: "ما الذي تخفيه الأرقام، وكيف تميّز بين نمو حقيقي وتجميل محاسبي.",
    drive_file_id: "1QxMPvVyHKZLdY8uWnGT3cRfE9pAsDjX2",
    category: "محاضرة", published: true, created_at: "2026-03-28",
  },
  {
    id: "d3", owner_id: "u2", owner_name: "أ. لما الشنطي",
    department: "الاتصال والتسويق الرقمي", division: "دائرة الأعمال",
    title: "بناء العلامة التجارية على المنصات الرقمية",
    description: "من اختيار نبرة الخطاب إلى قياس الأثر: مسار كامل لحضور رقمي متماسك.",
    drive_file_id: "1LmNoPqRsTuVwXyZ0123456789abcdefg",
    category: "ورشة تدريبية", published: true, created_at: "2026-03-11",
  },
  {
    id: "d4", owner_id: "u3", owner_name: "د. غادة دعيبس",
    department: "صناعة المحتوى الرقمي", division: "دائرة الاتصال",
    title: "كتابة السيناريو للمحتوى القصير",
    description: "بنية الثلاثين ثانية: الخطّاف، الوعد، والدفع نحو الفعل.",
    drive_file_id: "1ZaBcDeFgHiJkLmNoPqRsTuVwXyZ98765",
    category: "ورشة تدريبية", published: true, created_at: "2026-02-19",
  },
  {
    id: "d5", owner_id: "u4", owner_name: "د. عامر قاسم",
    department: "العلاقات العامة", division: "دائرة الاتصال",
    title: "إدارة الاتصال في الأزمات",
    description: "الساعات الأولى، الناطق الواحد، والتعامل مع الرواية المضادة.",
    drive_file_id: "1PoIuYtReWqAsDfGhJkLzXcVbNm456789",
    category: "ندوة", published: true, created_at: "2026-01-30",
  },
  {
    id: "d6", owner_id: "u5", owner_name: "أ. نائل موسى",
    department: "اقتصاد رقمي وتجارة إلكترونية", division: "دائرة الأعمال",
    title: "مشاريع الطلبة في التجارة الإلكترونية",
    description: "عرض لثلاثة متاجر بناها طلبة المساق من الصفر حتى أول عملية بيع.",
    drive_file_id: "1MnBvCxZaSdFgHjKlPoIuYtReWq1234567",
    category: "مشروع طلابي", published: false, created_at: "2026-04-29",
  },
];

/* ---------- طبقة البيانات ---------- */

const rest = (path, opts = {}, token) =>
  fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token || SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(opts.headers || {}),
    },
  });

const api = {
  async signIn(email, password) {
    if (DEMO) {
      return {
        token: "demo",
        user: {
          id: "me", email, username: "د. محمد ابو عمر", role: "admin",
          department: "ذكاء الأعمال", division: "دائرة الأعمال",
          must_change_password: password.trim() === email.trim(),
        },
      };
    }
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error("البريد أو كلمة المرور غير صحيحة.");
    const p = await rest(
      `profiles?id=eq.${d.user.id}&select=username,role,department,division,must_change_password`,
      {}, d.access_token
    ).then((x) => x.json());
    return {
      token: d.access_token,
      user: { ...d.user, ...(p?.[0] || { role: "uploader" }) },
    };
  },

  async changePassword(newPassword, token, userId) {
    if (DEMO) return;
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: "PUT",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: newPassword }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.msg || "تعذّر تغيير كلمة المرور.");
    await rest(
      `profiles?id=eq.${userId}`,
      { method: "PATCH", body: JSON.stringify({ must_change_password: false }) },
      token
    );
  },

  async listPublished() {
    if (DEMO) return demoVideos.filter((v) => v.published);
    const r = await rest(
      "videos?select=*,profiles(username,department,division)&published=eq.true&order=created_at.desc"
    );
    const d = await r.json();
    return d.map((v) => ({
      ...v,
      owner_name: v.profiles?.username,
      department: v.profiles?.department,
      division: v.profiles?.division,
    }));
  },

  async listMine(userId, token) {
    if (DEMO) return demoVideos.filter((v) => v.owner_id === userId);
    const r = await rest(
      `videos?select=*&owner_id=eq.${userId}&order=created_at.desc`, {}, token
    );
    return r.json();
  },

  async listPending(token) {
    if (DEMO) return demoVideos.filter((v) => !v.published);
    const r = await rest(
      "videos?select=*,profiles(username,department)&published=eq.false&order=created_at.desc",
      {}, token
    );
    const d = await r.json();
    return d.map((v) => ({ ...v, owner_name: v.profiles?.username, department: v.profiles?.department }));
  },

  async addVideo(payload, token) {
    if (DEMO) {
      const row = { ...payload, id: "d" + ++demoSeq, published: false,
        created_at: new Date().toISOString().slice(0, 10) };
      demoVideos.unshift(row);
      return row;
    }
    const r = await rest("videos", { method: "POST", body: JSON.stringify(payload) }, token);
    const d = await r.json();
    if (!r.ok) throw new Error(d.message || "تعذّر حفظ الجلسة.");
    return d[0];
  },

  async setPublished(id, value, token) {
    if (DEMO) {
      const v = demoVideos.find((x) => x.id === id);
      if (v) v.published = value;
      return;
    }
    await rest(`videos?id=eq.${id}`,
      { method: "PATCH", body: JSON.stringify({ published: value }) }, token);
  },

  async remove(id, token) {
    if (DEMO) {
      const i = demoVideos.findIndex((x) => x.id === id);
      if (i > -1) demoVideos.splice(i, 1);
      return;
    }
    await rest(`videos?id=eq.${id}`, { method: "DELETE" }, token);
  },
};

/* ============================================================
   التنسيقات — لوحة ألوان الكلية الرسمية
   ============================================================ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Reem+Kufi:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap');

.nj {
  --wine:#901939;
  --wine-deep:#5E0F25;
  --wine-soft:#A93352;
  --sand:#E6D7BE;
  --parchment:#F7F1E7;
  --surface:#FFFDF9;
  --brass:#C0A063;
  --ink:#2B1119;
  --muted:#7A5F66;
  --line:#E3D5BC;

  --t-xs:.78rem; --t-sm:.9rem; --t-base:1rem; --t-md:1.2rem;
  --t-lg:1.5rem; --t-xl:1.95rem; --t-2xl:2.44rem;

  direction:rtl; text-align:right;
  font-family:'IBM Plex Sans Arabic',system-ui,sans-serif;
  color:var(--ink); background:var(--parchment);
  min-height:100vh; font-size:var(--t-base); line-height:1.7;
  -webkit-font-smoothing:antialiased;
}
.nj *{box-sizing:border-box;}
.nj h1,.nj h2,.nj h3,.nj h4{margin:0;line-height:1.25;font-weight:600;letter-spacing:-.01em;}
.nj p{margin:0;}
.nj button{font-family:inherit;cursor:pointer;border:none;background:none;color:inherit;}
.nj input,.nj textarea,.nj select{font-family:inherit;font-size:var(--t-base);}
.nj :focus-visible{outline:2px solid var(--brass);outline-offset:3px;border-radius:2px;}

.nj-kufi{font-family:'Reem Kufi',serif;font-weight:600;}
.nj-wrap{max-width:1120px;margin:0 auto;padding:0 24px;}

/* الترويسة */
.nj-head{background:var(--wine);border-bottom:1px solid var(--brass);position:sticky;top:0;z-index:40;}
.nj-head-in{display:flex;align-items:center;gap:28px;height:76px;}
.nj-brand{display:flex;align-items:center;gap:13px;color:var(--parchment);}
.nj-logo{height:46px;width:auto;display:block;flex:none;}
.nj-brand b{font-family:'Reem Kufi',serif;font-size:1.08rem;font-weight:600;display:block;}
.nj-brand i{display:block;font-style:normal;font-size:var(--t-xs);color:var(--sand);opacity:.85;margin-top:-1px;}
.nj-nav{display:flex;gap:4px;margin-inline-start:auto;align-items:center;}
.nj-nav button{color:var(--sand);padding:8px 14px;font-size:var(--t-sm);border-radius:3px;}
.nj-nav button:hover{background:rgba(255,255,255,.11);}
.nj-nav button.on{color:#fff;background:rgba(0,0,0,.24);}
.nj-cta{background:var(--sand)!important;color:var(--wine-deep)!important;font-weight:600;}
.nj-cta:hover{background:#fff!important;}

/* البطل */
.nj-hero{background:var(--wine-deep);color:var(--parchment);padding:56px 0 64px;overflow:hidden;}
.nj-hero-grid{display:grid;grid-template-columns:1fr 1.15fr;gap:48px;align-items:center;}
.nj-eyebrow{font-size:var(--t-sm);color:var(--sand);opacity:.8;margin-bottom:14px;}
.nj-hero h1{font-family:'Reem Kufi',serif;font-size:var(--t-2xl);font-weight:600;line-height:1.35;}
.nj-hero-desc{color:var(--sand);margin-top:16px;max-width:46ch;opacity:.92;}
.nj-hero-meta{display:flex;gap:20px;margin-top:22px;font-size:var(--t-sm);color:var(--sand);opacity:.75;flex-wrap:wrap;}

.nj-poster{position:relative;}
.nj-poster::before{content:'';position:absolute;inset:18px -18px -18px 18px;background:var(--sand);border-radius:3px;}
.nj-poster-in{position:relative;aspect-ratio:16/9;border:1px solid var(--brass);border-radius:3px;
  overflow:hidden;background:var(--wine);width:100%;padding:0;display:grid;place-items:center;}
.nj-poster-in img{width:100%;height:100%;object-fit:cover;display:block;}

@media (prefers-reduced-motion:no-preference){
  .nj-rise{animation:njRise .7s cubic-bezier(.2,.7,.3,1) both;}
  .nj-rise-2{animation-delay:.12s;}
}
@keyframes njRise{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:none;}}

/* الترشيح */
.nj-bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:28px 0 20px;border-bottom:1px solid var(--line);}
.nj-chip{padding:6px 14px;border:1px solid var(--line);border-radius:2px;font-size:var(--t-sm);color:var(--muted);background:var(--surface);}
.nj-chip:hover{border-color:var(--brass);color:var(--ink);}
.nj-chip.on{background:var(--wine);color:var(--parchment);border-color:var(--wine);}
.nj-search{margin-inline-start:auto;}
.nj-search input{width:240px;padding:8px 14px;border:1px solid var(--line);border-radius:2px;background:var(--surface);color:var(--ink);}
.nj-search input::placeholder{color:var(--muted);}

/* الشبكة */
.nj-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:26px;padding:32px 0 64px;}
.nj-card{background:var(--surface);border:1px solid var(--line);border-radius:4px;overflow:hidden;
  text-align:right;display:flex;flex-direction:column;transition:border-color .18s;padding:0;}
.nj-card:hover{border-color:var(--brass);}
.nj-thumb{aspect-ratio:16/9;background:var(--wine);position:relative;display:grid;place-items:center;overflow:hidden;}
.nj-thumb img{width:100%;height:100%;object-fit:cover;}
.nj-thumb-fb{font-family:'Reem Kufi',serif;color:var(--sand);font-size:1.7rem;opacity:.5;}
.nj-card-body{padding:16px 18px 18px;display:flex;flex-direction:column;flex:1;}
.nj-card h3{font-size:var(--t-md);margin-bottom:8px;}
.nj-card p{font-size:var(--t-sm);color:var(--muted);line-height:1.65;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.nj-card-foot{margin-top:auto;padding-top:14px;display:flex;justify-content:space-between;
  align-items:center;gap:10px;font-size:var(--t-xs);color:var(--muted);}
.nj-tag{color:var(--wine);border-inline-start:2px solid var(--brass);padding-inline-start:8px;flex:none;}

/* النماذج */
.nj-panel{background:var(--surface);border:1px solid var(--line);border-radius:4px;padding:32px;}
.nj-page{padding:44px 0 72px;}
.nj-page h2{font-family:'Reem Kufi',serif;font-size:var(--t-xl);margin-bottom:8px;}
.nj-lead{color:var(--muted);margin-bottom:28px;max-width:62ch;}
.nj-field{margin-bottom:18px;}
.nj-field label{display:block;font-size:var(--t-sm);font-weight:500;margin-bottom:6px;}
.nj-field input,.nj-field textarea,.nj-field select{width:100%;padding:10px 13px;border:1px solid var(--line);
  border-radius:2px;background:var(--parchment);color:var(--ink);}
.nj-field textarea{min-height:96px;resize:vertical;line-height:1.7;}
.nj-hint{font-size:var(--t-xs);color:var(--muted);margin-top:6px;}
.nj-btn{background:var(--wine);color:var(--parchment);padding:11px 26px;border-radius:2px;font-weight:500;font-size:var(--t-sm);}
.nj-btn:hover{background:var(--wine-soft);}
.nj-btn:disabled{opacity:.45;cursor:not-allowed;}
.nj-btn-ghost{border:1px solid var(--line);color:var(--muted);padding:9px 18px;border-radius:2px;font-size:var(--t-sm);}
.nj-btn-ghost:hover{border-color:var(--wine);color:var(--wine);}

.nj-note{padding:12px 16px;border-radius:2px;font-size:var(--t-sm);margin-bottom:18px;border-inline-start:3px solid;}
.nj-note.ok{background:#F0F4EC;border-color:#5C7A3F;color:#3C5228;}
.nj-note.bad{background:#FBEDEF;border-color:var(--wine);color:var(--wine);}
.nj-note.wait{background:#FAF3E4;border-color:#9C7B33;color:#6B5320;}

/* المشاهدة */
.nj-player{aspect-ratio:16/9;width:100%;border:1px solid var(--line);border-radius:4px;background:#000;}
.nj-watch-meta{display:flex;gap:18px;align-items:baseline;font-size:var(--t-sm);color:var(--muted);margin-top:14px;flex-wrap:wrap;}

/* الصفوف */
.nj-row{display:flex;gap:18px;align-items:center;padding:16px 0;border-bottom:1px solid var(--line);}
.nj-row:last-child{border-bottom:none;padding-bottom:0;}
.nj-row-thumb{width:118px;aspect-ratio:16/9;flex:none;background:var(--wine);border-radius:3px;overflow:hidden;display:grid;place-items:center;}
.nj-row-thumb img{width:100%;height:100%;object-fit:cover;}
.nj-row-main{flex:1;min-width:0;}
.nj-row-main h4{font-size:var(--t-base);margin-bottom:2px;}
.nj-row-main span{font-size:var(--t-xs);color:var(--muted);}
.nj-row-acts{display:flex;gap:8px;flex:none;}

.nj-empty{text-align:center;padding:64px 24px;color:var(--muted);}
.nj-empty h3{font-family:'Reem Kufi',serif;color:var(--ink);margin-bottom:8px;font-size:var(--t-md);}

.nj-foot{background:var(--wine-deep);color:var(--sand);padding:34px 0;font-size:var(--t-sm);}
.nj-foot-in{display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap;}
.nj-foot img{height:40px;opacity:.9;}
.nj-foot span{opacity:.78;}

.nj-demo{background:var(--brass);color:#2B1119;text-align:center;padding:7px;font-size:var(--t-xs);font-weight:500;}

/* شاشة القفل */
.nj-lock{min-height:70vh;display:grid;place-items:center;padding:40px 24px;}
.nj-lock-box{width:100%;max-width:430px;}

@media (max-width:900px){
  .nj-grid{grid-template-columns:repeat(2,1fr);}
  .nj-hero-grid{grid-template-columns:1fr;gap:36px;}
  .nj-hero h1{font-size:var(--t-xl);}
}
@media (max-width:620px){
  .nj-grid{grid-template-columns:1fr;}
  .nj-head-in{height:auto;padding:12px 0;flex-wrap:wrap;gap:12px;}
  .nj-logo{height:38px;}
  .nj-nav{margin-inline-start:0;width:100%;overflow-x:auto;}
  .nj-search{margin-inline-start:0;width:100%;}
  .nj-search input{width:100%;}
  .nj-poster::before{inset:12px -12px -12px 12px;}
  .nj-panel{padding:22px;}
}
`;

/* ---------- عناصر مشتركة ---------- */

function Thumb({ id, title }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [id]);
  if (failed || !id) return <div className="nj-thumb-fb">{(title || "؟").slice(0, 2)}</div>;
  return <img src={thumbUrl(id)} alt="" onError={() => setFailed(true)} loading="lazy" />;
}

function Card({ v, onOpen }) {
  return (
    <button className="nj-card" onClick={() => onOpen(v)}>
      <div className="nj-thumb"><Thumb id={v.drive_file_id} title={v.title} /></div>
      <div className="nj-card-body">
        <h3>{v.title}</h3>
        <p>{v.description}</p>
        <div className="nj-card-foot">
          <span className="nj-tag">{v.category}</span>
          <span>{v.owner_name || "عضو في الكلية"}</span>
        </div>
      </div>
    </button>
  );
}

/* ---------- الصفحات ---------- */

function Home({ videos, onOpen }) {
  const [cat, setCat] = useState("الكل");
  const [q, setQ] = useState("");
  const [featured, ...rest] = videos;

  const shown = useMemo(() => {
    const term = q.trim();
    return rest.filter(
      (v) =>
        (cat === "الكل" || v.category === cat) &&
        (!term || v.title.includes(term) || (v.description || "").includes(term) ||
          (v.owner_name || "").includes(term) || (v.department || "").includes(term))
    );
  }, [rest, cat, q]);

  if (!videos.length)
    return (
      <div className="nj-wrap nj-empty" style={{ padding: "110px 24px" }}>
        <h3>المكتبة فارغة</h3>
        <p>أول جلسة تُنشر ستظهر هنا.</p>
      </div>
    );

  return (
    <>
      <section className="nj-hero">
        <div className="nj-wrap nj-hero-grid">
          <div className="nj-rise">
            <div className="nj-eyebrow">أحدث جلسة مسجّلة</div>
            <h1>{featured.title}</h1>
            <p className="nj-hero-desc">{featured.description}</p>
            <div className="nj-hero-meta">
              <span>{featured.owner_name}</span>
              {featured.department && <span>{featured.department}</span>}
              <span>{featured.created_at}</span>
            </div>
            <div style={{ marginTop: 26 }}>
              <button className="nj-btn"
                style={{ background: "var(--sand)", color: "var(--wine-deep)" }}
                onClick={() => onOpen(featured)}>
                شاهد الجلسة
              </button>
            </div>
          </div>

          <div className="nj-poster nj-rise nj-rise-2">
            <button className="nj-poster-in" onClick={() => onOpen(featured)}
              aria-label={`تشغيل ${featured.title}`}>
              <Thumb id={featured.drive_file_id} title={featured.title} />
            </button>
          </div>
        </div>
      </section>

      <div className="nj-wrap">
        <div className="nj-bar">
          {["الكل", ...CATEGORIES].map((c) => (
            <button key={c} className={"nj-chip" + (cat === c ? " on" : "")}
              onClick={() => setCat(c)}>{c}</button>
          ))}
          <div className="nj-search">
            <input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث عن جلسة أو مُحاضِر أو تخصّص" aria-label="بحث" />
          </div>
        </div>

        {shown.length ? (
          <div className="nj-grid">
            {shown.map((v) => <Card key={v.id} v={v} onOpen={onOpen} />)}
          </div>
        ) : (
          <div className="nj-empty">
            <h3>لا توجد جلسات مطابقة</h3>
            <p>جرّب تصنيفاً آخر أو امسح كلمة البحث.</p>
          </div>
        )}
      </div>
    </>
  );
}

function Watch({ v, onBack, videos, onOpen }) {
  const [alive, setAlive] = useState(null);
  useEffect(() => {
    let on = true;
    checkPublic(v.drive_file_id).then((r) => on && setAlive(r));
    return () => { on = false; };
  }, [v.drive_file_id]);

  const related = videos.filter((x) => x.id !== v.id && x.category === v.category).slice(0, 3);

  return (
    <div className="nj-wrap nj-page">
      <button className="nj-btn-ghost" onClick={onBack} style={{ marginBottom: 22 }}>
        رجوع إلى المكتبة
      </button>

      {alive === false && (
        <div className="nj-note bad">
          هذا الفيديو لم يعد متاحاً على درايف. ربما حذفه الناشر أو غيّر صلاحية مشاركته.
        </div>
      )}

      <iframe className="nj-player" src={playerUrl(v.drive_file_id)}
        allow="autoplay; fullscreen" allowFullScreen title={v.title} />

      <h2 className="nj-kufi" style={{ fontSize: "var(--t-xl)", marginTop: 24 }}>{v.title}</h2>
      <div className="nj-watch-meta">
        <span>{v.owner_name || "عضو في الكلية"}</span>
        {v.department && <span>{v.department}</span>}
        <span className="nj-tag">{v.category}</span>
        <span>{v.created_at}</span>
      </div>
      <p style={{ marginTop: 16, maxWidth: "68ch", color: "var(--muted)" }}>{v.description}</p>

      {related.length > 0 && (
        <>
          <h3 className="nj-kufi" style={{ marginTop: 52, fontSize: "var(--t-md)" }}>
            من التصنيف نفسه
          </h3>
          <div className="nj-grid" style={{ paddingTop: 20 }}>
            {related.map((r) => <Card key={r.id} v={r} onOpen={onOpen} />)}
          </div>
        </>
      )}
    </div>
  );
}

function Login({ onDone }) {
  const [f, setF] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr(""); setBusy(true);
    try { onDone(await api.signIn(f.email, f.password)); }
    catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="nj-wrap nj-page" style={{ maxWidth: 470 }}>
      <h2>دخول الأعضاء</h2>
      <p className="nj-lead">
        الدخول متاح لأعضاء هيئة التدريس في كلية الأعمال والاتصال.
      </p>

      <div className="nj-panel">
        {err && <div className="nj-note bad">{err}</div>}

        <div className="nj-field">
          <label htmlFor="e">البريد الجامعي</label>
          <input id="e" type="email" dir="ltr" style={{ textAlign: "left" }}
            value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })}
            placeholder="name@najah.edu" autoComplete="username" />
        </div>

        <div className="nj-field">
          <label htmlFor="p">كلمة المرور</label>
          <input id="p" type="password" value={f.password} autoComplete="current-password"
            onChange={(e) => setF({ ...f, password: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && submit()} />
          <div className="nj-hint">
            أول مرة؟ كلمة المرور المؤقتة هي بريدك الجامعي نفسه.
          </div>
        </div>

        <button className="nj-btn" onClick={submit} disabled={busy || !f.email || !f.password}>
          {busy ? "لحظة…" : "دخول"}
        </button>

        <p className="nj-hint" style={{ marginTop: 18 }}>
          لا تملك حساباً أو نسيت كلمة المرور؟ راسل العمادة: {CONTACT}
        </p>
      </div>
    </div>
  );
}

function ChangePassword({ session, onDone, forced }) {
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const sameAsEmail = p1.trim().toLowerCase() === session.user.email.trim().toLowerCase();
  const ok = p1.length >= 8 && p1 === p2 && !sameAsEmail;

  const submit = async () => {
    setErr(""); setBusy(true);
    try {
      await api.changePassword(p1, session.token, session.user.id);
      onDone();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className={forced ? "nj-lock" : "nj-wrap nj-page"} style={forced ? {} : { maxWidth: 470 }}>
      <div className={forced ? "nj-lock-box" : ""}>
        <h2 className="nj-kufi" style={{ fontSize: "var(--t-xl)", marginBottom: 8 }}>
          {forced ? "اختر كلمة مرور جديدة" : "تغيير كلمة المرور"}
        </h2>
        <p className="nj-lead">
          {forced
            ? "حسابك ما زال يستخدم كلمة المرور المؤقتة. اختر كلمة مرور خاصة بك للمتابعة."
            : "اختر كلمة مرور جديدة لحسابك."}
        </p>

        <div className="nj-panel">
          {err && <div className="nj-note bad">{err}</div>}

          <div className="nj-field">
            <label htmlFor="n1">كلمة المرور الجديدة</label>
            <input id="n1" type="password" value={p1} autoComplete="new-password"
              onChange={(e) => setP1(e.target.value)} />
            <div className="nj-hint">ثمانية أحرف على الأقل، ولا تكن بريدك الجامعي.</div>
          </div>

          <div className="nj-field">
            <label htmlFor="n2">أعد كتابتها</label>
            <input id="n2" type="password" value={p2} autoComplete="new-password"
              onChange={(e) => setP2(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ok && submit()} />
            {p2 && p1 !== p2 && (
              <div className="nj-hint" style={{ color: "var(--wine)" }}>
                الكلمتان غير متطابقتين.
              </div>
            )}
            {sameAsEmail && p1 && (
              <div className="nj-hint" style={{ color: "var(--wine)" }}>
                لا تستخدم بريدك الجامعي ككلمة مرور.
              </div>
            )}
          </div>

          <button className="nj-btn" onClick={submit} disabled={busy || !ok}>
            {busy ? "نحفظ…" : "احفظ كلمة المرور"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddVideo({ user, token, onSaved }) {
  const [f, setF] = useState({ url: "", title: "", description: "", category: CATEGORIES[0] });
  const [state, setState] = useState("idle");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const fileId = extractDriveId(f.url);
  const timer = useRef();

  useEffect(() => {
    clearTimeout(timer.current);
    if (!fileId) { setState("idle"); return; }
    setState("checking");
    timer.current = setTimeout(async () => {
      setState((await checkPublic(fileId)) ? "ok" : "bad");
    }, 500);
    return () => clearTimeout(timer.current);
  }, [fileId]);

  const save = async () => {
    setErr(""); setBusy(true);
    try {
      const row = await api.addVideo({
        owner_id: user.id,
        owner_name: user.username,
        department: user.department,
        division: user.division,
        title: f.title.trim(),
        description: f.description.trim(),
        drive_file_id: fileId,
        original_url: f.url.trim(),
        category: f.category,
      }, token);
      onSaved(row);
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="nj-wrap nj-page" style={{ maxWidth: 720 }}>
      <h2>أضف جلسة</h2>
      <p className="nj-lead">
        ارفع الفيديو على درايفك أولاً، اضبط مشاركته على «أي شخص لديه الرابط»، ثم الصق الرابط هنا.
        تظهر الجلسة في المكتبة بعد مراجعة العمادة.
      </p>

      <div className="nj-panel">
        {err && <div className="nj-note bad">{err}</div>}

        <div className="nj-field">
          <label htmlFor="url">رابط الفيديو على جوجل درايف</label>
          <input id="url" value={f.url} dir="ltr" style={{ textAlign: "left" }}
            onChange={(e) => setF({ ...f, url: e.target.value })}
            placeholder="https://drive.google.com/file/d/…/view" />
          {f.url && !fileId && (
            <div className="nj-hint" style={{ color: "var(--wine)" }}>
              الرابط غير مفهوم. افتح الفيديو في درايف وانسخ الرابط من شريط العنوان.
            </div>
          )}
        </div>

        {state === "checking" && <div className="nj-note wait">نتحقق من إتاحة الملف…</div>}
        {state === "ok" && <div className="nj-note ok">الملف متاح للعموم وجاهز للعرض.</div>}
        {state === "bad" && (
          <div className="nj-note bad">
            الملف خاص. افتحه في درايف ← مشاركة ← «أي شخص لديه الرابط» ← مُشاهِد، ثم أعد المحاولة.
          </div>
        )}

        {state === "ok" && (
          <div className="nj-row-thumb" style={{ width: "100%", maxWidth: 260, margin: "4px 0 20px" }}>
            <Thumb id={fileId} title={f.title} />
          </div>
        )}

        <div className="nj-field">
          <label htmlFor="t">عنوان الجلسة</label>
          <input id="t" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })}
            placeholder="الأتمتة الذكية باستخدام AI Agents و n8n" />
        </div>

        <div className="nj-field">
          <label htmlFor="c">التصنيف</label>
          <select id="c" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className="nj-field">
          <label htmlFor="d">نبذة</label>
          <textarea id="d" value={f.description}
            onChange={(e) => setF({ ...f, description: e.target.value })}
            placeholder="ماذا يتعلّم المشاهد من هذه الجلسة؟ سطران يكفيان." />
        </div>

        <button className="nj-btn" onClick={save}
          disabled={busy || state !== "ok" || !f.title.trim()}>
          {busy ? "نحفظ…" : "أرسل للمراجعة"}
        </button>
      </div>
    </div>
  );
}

function MyVideos({ user, token, onOpen, onAdd, refresh }) {
  const [rows, setRows] = useState([]);
  useEffect(() => { api.listMine(user.id, token).then(setRows); }, [user.id, token, refresh]);

  const del = async (id) => {
    await api.remove(id, token);
    setRows(rows.filter((r) => r.id !== id));
  };

  return (
    <div className="nj-wrap nj-page">
      <h2>جلساتي</h2>
      <p className="nj-lead">{user.username} — {user.department || "كلية الأعمال والاتصال"}</p>

      {rows.length === 0 ? (
        <div className="nj-empty">
          <h3>لم تضف جلسة بعد</h3>
          <p style={{ marginBottom: 18 }}>ابدأ برابط فيديو واحد من درايفك.</p>
          <button className="nj-btn" onClick={onAdd}>أضف جلسة</button>
        </div>
      ) : (
        <div className="nj-panel">
          {rows.map((r) => (
            <div className="nj-row" key={r.id}>
              <div className="nj-row-thumb"><Thumb id={r.drive_file_id} title={r.title} /></div>
              <div className="nj-row-main">
                <h4>{r.title}</h4>
                <span>{r.category} · {r.published ? "منشورة" : "قيد المراجعة"}</span>
              </div>
              <div className="nj-row-acts">
                {r.published && <button className="nj-btn-ghost" onClick={() => onOpen(r)}>عرض</button>}
                <button className="nj-btn-ghost" onClick={() => del(r.id)}>حذف</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Admin({ token, onChanged }) {
  const [rows, setRows] = useState([]);
  useEffect(() => { api.listPending(token).then(setRows); }, [token]);

  const act = async (id, publish) => {
    if (publish) await api.setPublished(id, true, token);
    else await api.remove(id, token);
    setRows(rows.filter((r) => r.id !== id));
    onChanged();
  };

  return (
    <div className="nj-wrap nj-page">
      <h2>المراجعة</h2>
      <p className="nj-lead">جلسات بانتظار قرار النشر.</p>

      {rows.length === 0 ? (
        <div className="nj-empty">
          <h3>لا شيء بانتظار المراجعة</h3>
          <p>كل الجلسات المرسلة تمت معالجتها.</p>
        </div>
      ) : (
        <div className="nj-panel">
          {rows.map((r) => (
            <div className="nj-row" key={r.id}>
              <div className="nj-row-thumb"><Thumb id={r.drive_file_id} title={r.title} /></div>
              <div className="nj-row-main">
                <h4>{r.title}</h4>
                <span>{r.owner_name || "—"} · {r.department || r.category}</span>
              </div>
              <div className="nj-row-acts">
                <button className="nj-btn" onClick={() => act(r.id, true)}>انشر</button>
                <button className="nj-btn-ghost" onClick={() => act(r.id, false)}>ارفض</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   التطبيق
   ============================================================ */

export default function App() {
  const [view, setView] = useState("home");
  const [current, setCurrent] = useState(null);
  const [session, setSession] = useState(null);
  const [videos, setVideos] = useState([]);
  const [tick, setTick] = useState(0);

  useEffect(() => { api.listPublished().then(setVideos); }, [tick]);

  const go = (v) => { setView(v); window.scrollTo?.(0, 0); };
  const open = (v) => { setCurrent(v); go("watch"); };

  const user = session?.user;
  const isAdmin = user?.role === "admin";
  const mustChange = !!user?.must_change_password;

  return (
    <div className="nj">
      <style>{CSS}</style>

      {DEMO && (
        <div className="nj-demo">
          وضع العرض — البيانات تجريبية. أضف مفاتيح Supabase في أعلى الملف لتشغيل المنصة فعلياً.
        </div>
      )}

      <header className="nj-head">
        <div className="nj-wrap nj-head-in">
          <button className="nj-brand" onClick={() => !mustChange && go("home")}>
            <img src={LOGO} className="nj-logo" alt="شعار كلية الأعمال والاتصال" />
            <span>
              <b>مكتبة الأعمال والاتصال</b>
              <i>جامعة النجاح الوطنية</i>
            </span>
          </button>

          {!mustChange && (
            <nav className="nj-nav">
              <button className={view === "home" ? "on" : ""} onClick={() => go("home")}>المكتبة</button>
              {user && (
                <button className={view === "mine" ? "on" : ""} onClick={() => go("mine")}>جلساتي</button>
              )}
              {isAdmin && (
                <button className={view === "admin" ? "on" : ""} onClick={() => go("admin")}>المراجعة</button>
              )}
              {user ? (
                <>
                  <button className="nj-cta" onClick={() => go("add")}>أضف جلسة</button>
                  <button className={view === "pwd" ? "on" : ""} onClick={() => go("pwd")}>كلمة المرور</button>
                  <button onClick={() => { setSession(null); go("home"); }}>خروج</button>
                </>
              ) : (
                <button className="nj-cta" onClick={() => go("login")}>دخول الأعضاء</button>
              )}
            </nav>
          )}
        </div>
      </header>

      <main>
        {mustChange ? (
          <ChangePassword
            forced
            session={session}
            onDone={() => {
              setSession({ ...session, user: { ...user, must_change_password: false } });
              go("mine");
            }}
          />
        ) : (
          <>
            {view === "home" && <Home videos={videos} onOpen={open} />}

            {view === "watch" && current && (
              <Watch v={current} videos={videos} onOpen={open} onBack={() => go("home")} />
            )}

            {view === "login" && (
              <Login onDone={(s) => { setSession(s); go(s.user.must_change_password ? "mine" : "mine"); }} />
            )}

            {view === "pwd" && user && (
              <ChangePassword session={session} onDone={() => go("mine")} />
            )}

            {view === "add" && user && (
              <AddVideo user={user} token={session.token}
                onSaved={() => { setTick((t) => t + 1); go("mine"); }} />
            )}

            {view === "mine" && user && (
              <MyVideos user={user} token={session.token} refresh={tick}
                onOpen={open} onAdd={() => go("add")} />
            )}

            {view === "admin" && isAdmin && (
              <Admin token={session.token} onChanged={() => setTick((t) => t + 1)} />
            )}
          </>
        )}
      </main>

      <footer className="nj-foot">
        <div className="nj-wrap nj-foot-in">
          <img src={LOGO} alt="" />
          <span>كلية الأعمال والاتصال — جامعة النجاح الوطنية، نابلس</span>
          <span>الجلسات مستضافة على درايف ناشريها</span>
        </div>
      </footer>
    </div>
  );
}
