import React, { useState, useEffect, useMemo, useRef } from "react";

/* ============================================================
   منصة فيديوهات كلية الأعمال والاتصال — جامعة النجاح الوطنية
   ------------------------------------------------------------
   ضع بيانات مشروع Supabase هنا. إن تركتهما فارغين تعمل المنصة
   في "وضع العرض" ببيانات تجريبية في الذاكرة.
   ============================================================ */
const SUPABASE_URL = "https://unbhwhglyxpasqnyeaoy.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_mtqTRLgW5sElFTp9-kQYqw_bv4T4GzT";

const DEMO = !SUPABASE_URL || !SUPABASE_ANON_KEY;

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
    img.onload = () => {
      clearTimeout(timer);
      resolve(true);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(false);
    };
    img.src = `https://drive.google.com/thumbnail?id=${fileId}&sz=w200`;
  });
}

/* ---------- بيانات العرض التجريبي ---------- */

const CATEGORIES = ["ورشة تدريبية", "محاضرة", "ندوة", "مشروع طلابي"];

let demoSeq = 100;
const demoVideos = [
  {
    id: "d1",
    owner_id: "u0",
    owner_name: "عمادة الكلية",
    title: "الأتمتة الذكية باستخدام AI Agents و n8n",
    description:
      "ورشة عملية مع عبد الله أبو عليان، محلل بيانات أول في KPMG، حول بناء أنظمة أتمتة تربط Gmail وGoogle Sheets وWhatsApp وتصميم Workflows تختصر الوقت والجهد.",
    drive_file_id: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    category: "ورشة تدريبية",
    published: true,
    created_at: "2026-04-17",
  },
  {
    id: "d2",
    owner_id: "u1",
    owner_name: "د. رناد حمدان",
    title: "تحليل البيانات لصنّاع القرار",
    description:
      "كيف تقرأ لوحة مؤشرات وتفرّق بين الارتباط والسببية قبل أن تبني عليها قراراً إدارياً.",
    drive_file_id: "1QxMPvVyHKZLdY8uWnGT3cRfE9pAsDjX2",
    category: "محاضرة",
    published: true,
    created_at: "2026-03-28",
  },
  {
    id: "d3",
    owner_id: "u2",
    owner_name: "أ. سامر قاسم",
    title: "بناء العلامة التجارية على المنصات الرقمية",
    description:
      "من اختيار نبرة الخطاب إلى قياس الأثر: مسار كامل لإدارة حضور رقمي متماسك.",
    drive_file_id: "1LmNoPqRsTuVwXyZ0123456789abcdefg",
    category: "ورشة تدريبية",
    published: true,
    created_at: "2026-03-11",
  },
  {
    id: "d4",
    owner_id: "u3",
    owner_name: "فريق نادي الريادة",
    title: "من الفكرة إلى النموذج الأولي في أسبوعين",
    description:
      "عرض لثلاثة مشاريع طلابية وصلت من ورقة بيضاء إلى نموذج قابل للاختبار.",
    drive_file_id: "1ZaBcDeFgHiJkLmNoPqRsTuVwXyZ98765",
    category: "مشروع طلابي",
    published: true,
    created_at: "2026-02-19",
  },
  {
    id: "d5",
    owner_id: "u4",
    owner_name: "د. ليان عودة",
    title: "مهارات العرض والإقناع أمام الجمهور",
    description:
      "بنية الرسالة، إدارة التوتر، والتعامل مع الأسئلة الصعبة في نهاية العرض.",
    drive_file_id: "1PoIuYtReWqAsDfGhJkLzXcVbNm456789",
    category: "ندوة",
    published: true,
    created_at: "2026-01-30",
  },
  {
    id: "d6",
    owner_id: "u5",
    owner_name: "أ. محمود صلاح",
    title: "أساسيات المحاسبة الإدارية للمشاريع الناشئة",
    description:
      "التكاليف الثابتة والمتغيرة، نقطة التعادل، وقراءة التدفق النقدي شهرياً.",
    drive_file_id: "1MnBvCxZaSdFgHjKlPoIuYtReWq1234567",
    category: "محاضرة",
    published: false,
    created_at: "2026-04-29",
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
  async signUp(email, password, username) {
    if (DEMO)
      return { user: { id: "me", email, username, role: "admin" }, token: "demo" };
    const r = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, data: { username } }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.msg || d.error_description || "تعذّر إنشاء الحساب");
    return { user: { ...d.user, username, role: "uploader" }, token: d.access_token };
  },

  async signIn(email, password) {
    if (DEMO)
      return {
        user: { id: "me", email, username: email.split("@")[0], role: "admin" },
        token: "demo",
      };
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error_description || d.msg || "بيانات الدخول غير صحيحة");
    const p = await rest(
      `profiles?id=eq.${d.user.id}&select=username,role`,
      {},
      d.access_token
    ).then((x) => x.json());
    return {
      user: { ...d.user, username: p?.[0]?.username, role: p?.[0]?.role || "uploader" },
      token: d.access_token,
    };
  },

  async listPublished() {
    if (DEMO) return demoVideos.filter((v) => v.published);
    const r = await rest(
      "videos?select=*,profiles(username)&published=eq.true&order=created_at.desc"
    );
    const d = await r.json();
    return d.map((v) => ({ ...v, owner_name: v.profiles?.username }));
  },

  async listMine(userId, token) {
    if (DEMO) return demoVideos.filter((v) => v.owner_id === userId);
    const r = await rest(
      `videos?select=*&owner_id=eq.${userId}&order=created_at.desc`,
      {},
      token
    );
    return r.json();
  },

  async listPending(token) {
    if (DEMO) return demoVideos.filter((v) => !v.published);
    const r = await rest(
      "videos?select=*,profiles(username)&published=eq.false&order=created_at.desc",
      {},
      token
    );
    const d = await r.json();
    return d.map((v) => ({ ...v, owner_name: v.profiles?.username }));
  },

  async addVideo(payload, token) {
    if (DEMO) {
      const row = {
        ...payload,
        id: "d" + ++demoSeq,
        published: false,
        created_at: new Date().toISOString().slice(0, 10),
      };
      demoVideos.unshift(row);
      return row;
    }
    const r = await rest("videos", { method: "POST", body: JSON.stringify(payload) }, token);
    const d = await r.json();
    if (!r.ok) throw new Error(d.message || "تعذّر حفظ الفيديو");
    return d[0];
  },

  async setPublished(id, value, token) {
    if (DEMO) {
      const v = demoVideos.find((x) => x.id === id);
      if (v) v.published = value;
      return;
    }
    await rest(
      `videos?id=eq.${id}`,
      { method: "PATCH", body: JSON.stringify({ published: value }) },
      token
    );
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
   التنسيقات
   ============================================================ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Reem+Kufi:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap');

.nj {
  --wine:#6A1B32;
  --wine-deep:#42101E;
  --wine-soft:#8C3049;
  --sand:#E6D7BE;
  --parchment:#F7F1E7;
  --surface:#FFFDF9;
  --brass:#B08A45;
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
.nj h1,.nj h2,.nj h3{margin:0;line-height:1.25;font-weight:600;letter-spacing:-.01em;}
.nj p{margin:0;}
.nj button{font-family:inherit;cursor:pointer;border:none;background:none;color:inherit;}
.nj input,.nj textarea,.nj select{font-family:inherit;font-size:var(--t-base);}
.nj :focus-visible{outline:2px solid var(--brass);outline-offset:3px;border-radius:2px;}

.nj-kufi{font-family:'Reem Kufi',serif;font-weight:600;}
.nj-wrap{max-width:1120px;margin:0 auto;padding:0 24px;}

/* الترويسة */
.nj-head{background:var(--wine);border-bottom:1px solid var(--brass);position:sticky;top:0;z-index:40;}
.nj-head-in{display:flex;align-items:center;gap:28px;height:68px;}
.nj-brand{display:flex;align-items:center;gap:12px;color:var(--parchment);}
.nj-seal{width:34px;height:34px;flex:none;border:1.5px solid var(--brass);border-radius:50%;
  display:grid;place-items:center;font-family:'Reem Kufi',serif;font-size:.95rem;color:var(--sand);}
.nj-brand b{font-family:'Reem Kufi',serif;font-size:1.05rem;font-weight:600;display:block;}
.nj-brand span{display:block;font-size:var(--t-xs);color:var(--sand);opacity:.85;margin-top:-2px;}
.nj-nav{display:flex;gap:4px;margin-inline-start:auto;align-items:center;}
.nj-nav button{color:var(--sand);padding:8px 14px;font-size:var(--t-sm);border-radius:3px;}
.nj-nav button:hover{background:rgba(255,255,255,.09);}
.nj-nav button.on{color:var(--parchment);background:rgba(0,0,0,.22);}
.nj-cta{background:var(--sand)!important;color:var(--wine-deep)!important;font-weight:600;}
.nj-cta:hover{background:#fff!important;}

/* البطل */
.nj-hero{background:var(--wine-deep);color:var(--parchment);padding:56px 0 64px;overflow:hidden;}
.nj-hero-grid{display:grid;grid-template-columns:1fr 1.15fr;gap:48px;align-items:center;}
.nj-eyebrow{font-size:var(--t-sm);color:var(--sand);opacity:.8;margin-bottom:14px;}
.nj-hero h1{font-family:'Reem Kufi',serif;font-size:var(--t-2xl);font-weight:600;line-height:1.35;}
.nj-hero-desc{color:var(--sand);margin-top:16px;max-width:46ch;font-size:var(--t-base);opacity:.92;}
.nj-hero-meta{display:flex;gap:20px;margin-top:22px;font-size:var(--t-sm);color:var(--sand);opacity:.75;}

/* لوح البوستر خلف الصورة */
.nj-poster{position:relative;}
.nj-poster::before{content:'';position:absolute;inset:18px -18px -18px 18px;background:var(--sand);border-radius:3px;}
.nj-poster-in{position:relative;aspect-ratio:16/9;border:1px solid var(--brass);border-radius:3px;
  overflow:hidden;background:var(--wine);}
.nj-poster-in img{width:100%;height:100%;object-fit:cover;display:block;}

@media (prefers-reduced-motion:no-preference){
  .nj-rise{animation:njRise .7s cubic-bezier(.2,.7,.3,1) both;}
  .nj-rise-2{animation-delay:.12s;}
}
@keyframes njRise{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:none;}}

/* شريط الترشيح */
.nj-bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:28px 0 20px;border-bottom:1px solid var(--line);}
.nj-chip{padding:6px 14px;border:1px solid var(--line);border-radius:2px;font-size:var(--t-sm);color:var(--muted);background:var(--surface);}
.nj-chip:hover{border-color:var(--brass);color:var(--ink);}
.nj-chip.on{background:var(--wine);color:var(--parchment);border-color:var(--wine);}
.nj-search{margin-inline-start:auto;position:relative;}
.nj-search input{width:230px;padding:8px 14px;border:1px solid var(--line);border-radius:2px;background:var(--surface);color:var(--ink);}
.nj-search input::placeholder{color:var(--muted);}

/* الشبكة */
.nj-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:26px;padding:32px 0 64px;}
.nj-card{background:var(--surface);border:1px solid var(--line);border-radius:4px;overflow:hidden;
  text-align:right;display:flex;flex-direction:column;transition:border-color .18s;}
.nj-card:hover{border-color:var(--brass);}
.nj-thumb{aspect-ratio:16/9;background:var(--wine);position:relative;display:grid;place-items:center;overflow:hidden;}
.nj-thumb img{width:100%;height:100%;object-fit:cover;}
.nj-thumb-fb{font-family:'Reem Kufi',serif;color:var(--sand);font-size:1.6rem;opacity:.45;}
.nj-card-body{padding:16px 18px 18px;display:flex;flex-direction:column;flex:1;}
.nj-card h3{font-size:var(--t-md);margin-bottom:8px;}
.nj-card p{font-size:var(--t-sm);color:var(--muted);line-height:1.65;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.nj-card-foot{margin-top:auto;padding-top:14px;display:flex;justify-content:space-between;
  align-items:center;font-size:var(--t-xs);color:var(--muted);}
.nj-tag{color:var(--wine);border-inline-start:2px solid var(--brass);padding-inline-start:8px;}

/* النماذج */
.nj-panel{background:var(--surface);border:1px solid var(--line);border-radius:4px;padding:32px;}
.nj-page{padding:44px 0 72px;}
.nj-page h2{font-family:'Reem Kufi',serif;font-size:var(--t-xl);margin-bottom:8px;}
.nj-page .nj-lead{color:var(--muted);margin-bottom:28px;max-width:60ch;}
.nj-field{margin-bottom:18px;}
.nj-field label{display:block;font-size:var(--t-sm);font-weight:500;margin-bottom:6px;}
.nj-field input,.nj-field textarea,.nj-field select{width:100%;padding:10px 13px;border:1px solid var(--line);
  border-radius:2px;background:var(--parchment);color:var(--ink);}
.nj-field textarea{min-height:96px;resize:vertical;line-height:1.7;}
.nj-hint{font-size:var(--t-xs);color:var(--muted);margin-top:6px;}
.nj-btn{background:var(--wine);color:var(--parchment);padding:11px 26px;border-radius:2px;font-weight:500;font-size:var(--t-sm);}
.nj-btn:hover{background:var(--wine-soft);}
.nj-btn:disabled{opacity:.5;cursor:not-allowed;}
.nj-btn-ghost{border:1px solid var(--line);color:var(--muted);padding:9px 18px;border-radius:2px;font-size:var(--t-sm);}
.nj-btn-ghost:hover{border-color:var(--wine);color:var(--wine);}

.nj-note{padding:12px 16px;border-radius:2px;font-size:var(--t-sm);margin-bottom:18px;border-inline-start:3px solid;}
.nj-note.ok{background:#F0F4EC;border-color:#5C7A3F;color:#3C5228;}
.nj-note.bad{background:#FBEDEF;border-color:var(--wine);color:var(--wine);}
.nj-note.wait{background:#FAF3E4;border-color:var(--brass);color:#6B5320;}

/* المشاهدة */
.nj-player{aspect-ratio:16/9;width:100%;border:1px solid var(--line);border-radius:4px;background:#000;}
.nj-watch-meta{display:flex;gap:18px;align-items:baseline;font-size:var(--t-sm);color:var(--muted);margin-top:14px;}

/* الجداول */
.nj-row{display:flex;gap:18px;align-items:center;padding:16px 0;border-bottom:1px solid var(--line);}
.nj-row-thumb{width:118px;aspect-ratio:16/9;flex:none;background:var(--wine);border-radius:3px;overflow:hidden;}
.nj-row-thumb img{width:100%;height:100%;object-fit:cover;}
.nj-row-main{flex:1;min-width:0;}
.nj-row-main h4{margin:0 0 2px;font-size:var(--t-base);font-weight:600;}
.nj-row-main span{font-size:var(--t-xs);color:var(--muted);}
.nj-row-acts{display:flex;gap:8px;flex:none;}

.nj-empty{text-align:center;padding:64px 24px;color:var(--muted);}
.nj-empty h3{font-family:'Reem Kufi',serif;color:var(--ink);margin-bottom:8px;font-size:var(--t-md);}

.nj-foot{background:var(--wine-deep);color:var(--sand);padding:36px 0;font-size:var(--t-sm);}
.nj-foot-in{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;opacity:.8;}

.nj-demo{background:var(--brass);color:#2B1119;text-align:center;padding:7px;font-size:var(--t-xs);font-weight:500;}

@media (max-width:900px){
  .nj-grid{grid-template-columns:repeat(2,1fr);}
  .nj-hero-grid{grid-template-columns:1fr;gap:36px;}
  .nj-hero h1{font-size:var(--t-xl);}
}
@media (max-width:620px){
  .nj-grid{grid-template-columns:1fr;}
  .nj-head-in{height:auto;padding:12px 0;flex-wrap:wrap;gap:12px;}
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
  if (failed || !id)
    return <div className="nj-thumb-fb">{(title || "؟").slice(0, 2)}</div>;
  return <img src={thumbUrl(id)} alt="" onError={() => setFailed(true)} loading="lazy" />;
}

function Card({ v, onOpen }) {
  return (
    <button className="nj-card" onClick={() => onOpen(v)}>
      <div className="nj-thumb">
        <Thumb id={v.drive_file_id} title={v.title} />
      </div>
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
        (!term ||
          v.title.includes(term) ||
          (v.description || "").includes(term) ||
          (v.owner_name || "").includes(term))
    );
  }, [rest, cat, q]);

  return (
    <>
      {featured && (
        <section className="nj-hero">
          <div className="nj-wrap nj-hero-grid">
            <div className="nj-rise">
              <div className="nj-eyebrow">أحدث جلسة مسجّلة</div>
              <h1>{featured.title}</h1>
              <p className="nj-hero-desc">{featured.description}</p>
              <div className="nj-hero-meta">
                <span>{featured.owner_name}</span>
                <span>{featured.category}</span>
                <span>{featured.created_at}</span>
              </div>
              <div style={{ marginTop: 26 }}>
                <button
                  className="nj-btn"
                  style={{ background: "var(--sand)", color: "var(--wine-deep)" }}
                  onClick={() => onOpen(featured)}
                >
                  شاهد الجلسة
                </button>
              </div>
            </div>

            <div className="nj-poster nj-rise nj-rise-2">
              <button
                className="nj-poster-in"
                onClick={() => onOpen(featured)}
                aria-label={`تشغيل ${featured.title}`}
                style={{ display: "grid", placeItems: "center", width: "100%", padding: 0 }}
              >
                <Thumb id={featured.drive_file_id} title={featured.title} />
              </button>
            </div>
          </div>
        </section>
      )}

      <div className="nj-wrap">
        <div className="nj-bar">
          {["الكل", ...CATEGORIES].map((c) => (
            <button
              key={c}
              className={"nj-chip" + (cat === c ? " on" : "")}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
          <div className="nj-search">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث عن جلسة أو مُحاضِر"
              aria-label="بحث"
            />
          </div>
        </div>

        {shown.length ? (
          <div className="nj-grid">
            {shown.map((v) => (
              <Card key={v.id} v={v} onOpen={onOpen} />
            ))}
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
    return () => {
      on = false;
    };
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

      <iframe
        className="nj-player"
        src={playerUrl(v.drive_file_id)}
        allow="autoplay; fullscreen"
        allowFullScreen
        title={v.title}
      />

      <h2 className="nj-kufi" style={{ fontSize: "var(--t-xl)", marginTop: 24 }}>
        {v.title}
      </h2>
      <div className="nj-watch-meta">
        <span>{v.owner_name || "عضو في الكلية"}</span>
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
            {related.map((r) => (
              <Card key={r.id} v={r} onOpen={onOpen} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Auth({ onDone }) {
  const [mode, setMode] = useState("in");
  const [f, setF] = useState({ email: "", password: "", username: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr("");
    setBusy(true);
    try {
      const res =
        mode === "in"
          ? await api.signIn(f.email, f.password)
          : await api.signUp(f.email, f.password, f.username);
      onDone(res);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="nj-wrap nj-page" style={{ maxWidth: 470 }}>
      <h2>{mode === "in" ? "تسجيل الدخول" : "حساب جديد"}</h2>
      <p className="nj-lead">
        {mode === "in"
          ? "ادخل لتضيف جلساتك وتتابع حالة نشرها."
          : "الحساب متاح لأعضاء هيئة التدريس وطلبة الكلية."}
      </p>

      <div className="nj-panel">
        {err && <div className="nj-note bad">{err}</div>}

        {mode === "up" && (
          <div className="nj-field">
            <label htmlFor="u">الاسم الظاهر</label>
            <input
              id="u"
              value={f.username}
              onChange={(e) => setF({ ...f, username: e.target.value })}
              placeholder="د. رناد حمدان"
            />
          </div>
        )}

        <div className="nj-field">
          <label htmlFor="e">البريد الجامعي</label>
          <input
            id="e"
            type="email"
            value={f.email}
            onChange={(e) => setF({ ...f, email: e.target.value })}
            placeholder="name@najah.edu"
          />
        </div>

        <div className="nj-field">
          <label htmlFor="p">كلمة المرور</label>
          <input
            id="p"
            type="password"
            value={f.password}
            onChange={(e) => setF({ ...f, password: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </div>

        <button className="nj-btn" onClick={submit} disabled={busy || !f.email || !f.password}>
          {busy ? "لحظة…" : mode === "in" ? "دخول" : "إنشاء الحساب"}
        </button>

        <button
          className="nj-btn-ghost"
          style={{ marginInlineStart: 10 }}
          onClick={() => {
            setMode(mode === "in" ? "up" : "in");
            setErr("");
          }}
        >
          {mode === "in" ? "ليس لدي حساب" : "لدي حساب بالفعل"}
        </button>
      </div>
    </div>
  );
}

function AddVideo({ user, token, onSaved }) {
  const [f, setF] = useState({ url: "", title: "", description: "", category: CATEGORIES[0] });
  const [state, setState] = useState("idle"); // idle | checking | ok | bad
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const fileId = extractDriveId(f.url);
  const timer = useRef();

  useEffect(() => {
    clearTimeout(timer.current);
    if (!fileId) {
      setState("idle");
      return;
    }
    setState("checking");
    timer.current = setTimeout(async () => {
      setState((await checkPublic(fileId)) ? "ok" : "bad");
    }, 500);
    return () => clearTimeout(timer.current);
  }, [fileId]);

  const save = async () => {
    setErr("");
    setBusy(true);
    try {
      const row = await api.addVideo(
        {
          owner_id: user.id,
          owner_name: user.username,
          title: f.title.trim(),
          description: f.description.trim(),
          drive_file_id: fileId,
          original_url: f.url.trim(),
          category: f.category,
        },
        token
      );
      onSaved(row);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
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
          <input
            id="url"
            value={f.url}
            onChange={(e) => setF({ ...f, url: e.target.value })}
            placeholder="https://drive.google.com/file/d/…/view"
            dir="ltr"
            style={{ textAlign: "left" }}
          />
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
          <div
            className="nj-row-thumb"
            style={{ width: "100%", maxWidth: 260, margin: "4px 0 20px" }}
          >
            <Thumb id={fileId} title={f.title} />
          </div>
        )}

        <div className="nj-field">
          <label htmlFor="t">عنوان الجلسة</label>
          <input
            id="t"
            value={f.title}
            onChange={(e) => setF({ ...f, title: e.target.value })}
            placeholder="الأتمتة الذكية باستخدام AI Agents و n8n"
          />
        </div>

        <div className="nj-field">
          <label htmlFor="c">التصنيف</label>
          <select
            id="c"
            value={f.category}
            onChange={(e) => setF({ ...f, category: e.target.value })}
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="nj-field">
          <label htmlFor="d">نبذة</label>
          <textarea
            id="d"
            value={f.description}
            onChange={(e) => setF({ ...f, description: e.target.value })}
            placeholder="ماذا يتعلّم المشاهد من هذه الجلسة؟ سطران يكفيان."
          />
        </div>

        <button className="nj-btn" onClick={save} disabled={busy || state !== "ok" || !f.title.trim()}>
          {busy ? "نحفظ…" : "أرسل للمراجعة"}
        </button>
      </div>
    </div>
  );
}

function MyVideos({ user, token, onOpen, onAdd, refresh }) {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    api.listMine(user.id, token).then(setRows);
  }, [user.id, token, refresh]);

  const del = async (id) => {
    await api.remove(id, token);
    setRows(rows.filter((r) => r.id !== id));
  };

  return (
    <div className="nj-wrap nj-page">
      <h2>جلساتي</h2>
      <p className="nj-lead">كل ما أضفته، وحالة كل جلسة.</p>

      {rows.length === 0 ? (
        <div className="nj-empty">
          <h3>لم تضف جلسة بعد</h3>
          <p style={{ marginBottom: 18 }}>ابدأ برابط فيديو واحد من درايفك.</p>
          <button className="nj-btn" onClick={onAdd}>
            أضف جلسة
          </button>
        </div>
      ) : (
        <div className="nj-panel">
          {rows.map((r) => (
            <div className="nj-row" key={r.id}>
              <div className="nj-row-thumb">
                <Thumb id={r.drive_file_id} title={r.title} />
              </div>
              <div className="nj-row-main">
                <h4>{r.title}</h4>
                <span>
                  {r.category} · {r.published ? "منشورة" : "قيد المراجعة"}
                </span>
              </div>
              <div className="nj-row-acts">
                {r.published && (
                  <button className="nj-btn-ghost" onClick={() => onOpen(r)}>
                    عرض
                  </button>
                )}
                <button className="nj-btn-ghost" onClick={() => del(r.id)}>
                  حذف
                </button>
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
  const load = () => api.listPending(token).then(setRows);
  useEffect(() => {
    load();
  }, [token]);

  const act = async (id, value) => {
    if (value) await api.setPublished(id, true, token);
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
              <div className="nj-row-thumb">
                <Thumb id={r.drive_file_id} title={r.title} />
              </div>
              <div className="nj-row-main">
                <h4>{r.title}</h4>
                <span>
                  {r.owner_name || "—"} · {r.category}
                </span>
              </div>
              <div className="nj-row-acts">
                <button className="nj-btn" onClick={() => act(r.id, true)}>
                  انشر
                </button>
                <button className="nj-btn-ghost" onClick={() => act(r.id, false)}>
                  ارفض
                </button>
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

  useEffect(() => {
    api.listPublished().then(setVideos);
  }, [tick]);

  const open = (v) => {
    setCurrent(v);
    setView("watch");
    window.scrollTo?.(0, 0);
  };
  const go = (v) => {
    setView(v);
    window.scrollTo?.(0, 0);
  };

  const user = session?.user;
  const isAdmin = user?.role === "admin";

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
          <button className="nj-brand" onClick={() => go("home")}>
            <span className="nj-seal" aria-hidden="true">ن</span>
            <span>
              <b>مكتبة الأعمال والاتصال</b>
              <span>جامعة النجاح الوطنية</span>
            </span>
          </button>

          <nav className="nj-nav">
            <button className={view === "home" ? "on" : ""} onClick={() => go("home")}>
              المكتبة
            </button>
            {user && (
              <button className={view === "mine" ? "on" : ""} onClick={() => go("mine")}>
                جلساتي
              </button>
            )}
            {isAdmin && (
              <button className={view === "admin" ? "on" : ""} onClick={() => go("admin")}>
                المراجعة
              </button>
            )}
            {user ? (
              <>
                <button className="nj-cta" onClick={() => go("add")}>
                  أضف جلسة
                </button>
                <button
                  onClick={() => {
                    setSession(null);
                    go("home");
                  }}
                >
                  خروج
                </button>
              </>
            ) : (
              <button className="nj-cta" onClick={() => go("auth")}>
                دخول الأعضاء
              </button>
            )}
          </nav>
        </div>
      </header>

      <main>
        {view === "home" && <Home videos={videos} onOpen={open} />}

        {view === "watch" && current && (
          <Watch v={current} videos={videos} onOpen={open} onBack={() => go("home")} />
        )}

        {view === "auth" && (
          <Auth
            onDone={(s) => {
              setSession(s);
              go("mine");
            }}
          />
        )}

        {view === "add" && user && (
          <AddVideo
            user={user}
            token={session.token}
            onSaved={() => {
              setTick((t) => t + 1);
              go("mine");
            }}
          />
        )}

        {view === "mine" && user && (
          <MyVideos
            user={user}
            token={session.token}
            refresh={tick}
            onOpen={open}
            onAdd={() => go("add")}
          />
        )}

        {view === "admin" && isAdmin && (
          <Admin token={session.token} onChanged={() => setTick((t) => t + 1)} />
        )}
      </main>

      <footer className="nj-foot">
        <div className="nj-wrap nj-foot-in">
          <span>كلية الأعمال والاتصال — جامعة النجاح الوطنية، نابلس</span>
          <span>الفيديوهات مستضافة على درايف ناشريها</span>
        </div>
      </footer>
    </div>
  );
}
