# مكتبة الأعمال والاتصال — منصة الفيديوهات

منصة نشر ومشاهدة الجلسات المرئية (ورش، محاضرات، ندوات، مشاريع طلابية) الخاصة
بكلية الأعمال والاتصال في **جامعة النجاح الوطنية**.

> **الموقع المنشور:** https://sabriodeh.github.io/NajahBCVideoPlatform/
> **المستودع:** https://github.com/sabriodeh/NajahBCVideoPlatform

---

## نظرة عامة

- **الواجهة:** React 19 + Vite 8 (تطبيق صفحة واحدة، عربي بالكامل، اتجاه RTL).
- **قاعدة البيانات والمصادقة:** Supabase (REST + Auth).
- **استضافة الفيديو:** Google Drive — تُخزَّن في قاعدة البيانات معرّفات الملفات
  (`drive_file_id`) فقط، ويُعرض الفيديو عبر مشغّل درايف المضمّن.
- **النشر:** GitHub Pages عبر GitHub Actions (فرع `gh-pages`).

الحسابات **مغلقة**: لا يوجد تسجيل ذاتي. تُنشأ الحسابات من العمادة، وكلمة المرور
المؤقتة هي البريد الجامعي نفسه، ويُجبَر العضو على تغييرها عند أول دخول.

---

## المتطلبات

| الأداة | الإصدار |
| --- | --- |
| Node.js | 20 أو أحدث |
| npm | 10 أو أحدث |

---

## التشغيل محلياً

```bash
git clone https://github.com/sabriodeh/NajahBCVideoPlatform.git
cd NajahBCVideoPlatform
npm ci
npm run dev
```

ثم افتح الرابط الذي تطبعه الأداة (عادةً <http://localhost:5173/NajahBCVideoPlatform/>).

> **ملاحظة:** `base` في [vite.config.js](vite.config.js) مضبوط على
> `/NajahBCVideoPlatform/` لأجل GitHub Pages، لذلك يظهر هذا المسار في رابط
> التطوير المحلي أيضاً. لا تُغيّره إلا إذا تغيّر اسم المستودع.

---

## الأوامر المتاحة

| الأمر | الوظيفة |
| --- | --- |
| `npm run dev` | خادم التطوير مع إعادة التحميل الفوري (HMR) |
| `npm run build` | بناء نسخة الإنتاج إلى `dist/` |
| `npm run preview` | معاينة محلية لمخرجات البناء |
| `npm run lint` | فحص الكود بـ oxlint |
| `npm run lint:fix` | فحص مع إصلاح ما يمكن إصلاحه تلقائياً |
| `npm run check` | فحص + بناء (نفس ما يفعله النشر) — شغّله قبل أي دفع |

---

## بنية المشروع

```
.
├── .github/workflows/deploy.yml   # بناء ونشر تلقائي إلى GitHub Pages
├── docs/                          # توثيق المشروع (ابدأ من هنا)
│   ├── ARCHITECTURE.md            # البنية ونموذج البيانات
│   ├── CONTRIBUTING.md            # أسلوب العمل والفروع
│   ├── ROADMAP.md                 # الأعمال المقترحة والملاحظات التقنية
│   └── ci-workflow.example.yml    # فحص مقترح للـ PR (غير مفعّل بعد)
├── public/                        # ملفات ثابتة تُنسخ كما هي
├── src/
│   ├── App.jsx                    # التطبيق بالكامل (~976 سطراً)
│   ├── main.jsx                   # نقطة الدخول
│   ├── App.css / index.css        # تنسيقات القالب الأصلي
│   └── assets/
├── index.html
└── vite.config.js
```

> معظم منطق التطبيق وتنسيقاته موجود حالياً في ملف واحد هو `src/App.jsx`.
> يوجد مقترح لتقسيمه في [docs/ROADMAP.md](docs/ROADMAP.md) — لم يُنفَّذ بعد.

---

## الإعدادات والمفاتيح

مفاتيح Supabase مكتوبة مباشرة في أعلى [src/App.jsx](src/App.jsx):

```js
const SUPABASE_URL = "https://....supabase.co";
const SUPABASE_ANON_KEY = "eyJ...";
```

هذا **مقصود ومقبول**: مفتاح `anon` مصمَّم ليكون علنياً، وأي تطبيق ثابت يُضمِّنه في
حزمة الجافاسكربت النهائية بغض النظر عن طريقة تمريره. الحماية الحقيقية تأتي من
**Row Level Security** على جداول Supabase، لا من إخفاء المفتاح.

⚠️ **قبل أي تعديل هنا:** السطر `const DEMO = !SUPABASE_URL || !SUPABASE_ANON_KEY;`
يعني أن أي قيمة فارغة تُحوّل المنصة صامتةً إلى **وضع العرض التجريبي** ببيانات
وهمية — دون أي رسالة خطأ في البناء. راجع [docs/ROADMAP.md](docs/ROADMAP.md).

---

## النشر

النشر **تلقائي**: أي دفع إلى فرع `main` يُشغّل
[.github/workflows/deploy.yml](.github/workflows/deploy.yml) الذي يبني المشروع
ويدفع `dist/` إلى فرع `gh-pages`.

- لا تُعدّل فرع `gh-pages` يدوياً — محتواه ناتج بناء يُعاد توليده في كل مرة.
- أي دمج في `main` يعني نشراً مباشراً على الموقع العلني. راجع
  [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).

---

## التوثيق

| المستند | المحتوى |
| --- | --- |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | نموذج البيانات، الأدوار، تدفق المصادقة، الشاشات |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) | تسمية الفروع، الرسائل، دورة المراجعة |
| [docs/ROADMAP.md](docs/ROADMAP.md) | ملاحظات تقنية وأعمال مقترحة مرتَّبة بالأولوية |

---

## التواصل

لجنة التحول الرقمي والذكاء الاصطناعي — كلية الأعمال والاتصال
البريد: <business@najah.edu>
