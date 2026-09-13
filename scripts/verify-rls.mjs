#!/usr/bin/env node
/* ============================================================
   التحقق من سياسات RLS
   ------------------------------------------------------------
   يثبت أن البوابة تعمل على مستوى قاعدة البيانات لا الواجهة فقط.
   شغّله بعد تنفيذ ملفات supabase/migrations.

       node scripts/verify-rls.mjs

   للفحوص التي تحتاج تسجيل دخول (عضو وأدمن)، مرّر البيانات عبر
   متغيّرات البيئة حتى لا تدخل سجلّ الأوامر:

       NJBC_MEMBER_EMAIL=... NJBC_MEMBER_PASSWORD=... \
       NJBC_ADMIN_EMAIL=...  NJBC_ADMIN_PASSWORD=...  \
       node scripts/verify-rls.mjs

   لا تُرسل أي بيانات إلى أي جهة غير مشروع Supabase الخاص بالكلية.
   ============================================================ */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/* تُقرأ المفاتيح من config.js نفسه حتى لا تتفرّق النسخ */
function readConfig() {
  const src = readFileSync(join(root, "src", "config.js"), "utf8");
  const url = src.match(/FALLBACK_URL\s*=\s*"([^"]+)"/)?.[1];
  const key = src.match(/FALLBACK_ANON_KEY\s*=\s*\n?\s*"([^"]+)"/)?.[1];
  if (!url || !key) {
    console.error("تعذّرت قراءة المفاتيح من src/config.js");
    process.exit(2);
  }
  return { url: url.replace(/\/$/, ""), key };
}

const { url: SUPABASE_URL, key: ANON } = readConfig();

let passed = 0;
let failed = 0;

const ok = (msg) => {
  console.log(`  \x1b[32m✓\x1b[0m ${msg}`);
  passed++;
};
const bad = (msg, detail) => {
  console.log(`  \x1b[31m✗\x1b[0m ${msg}`);
  if (detail) console.log(`      \x1b[90m${detail}\x1b[0m`);
  failed++;
};

const rest = (path, { method = "GET", token, body } = {}) =>
  fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${token || ANON}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

async function signIn(email, password) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) return null;
  const d = await r.json();
  return { token: d.access_token, id: d.user?.id };
}

/* ---------- ١) المجهول لا يقرأ ---------- */

async function anonymousReads() {
  console.log("\n\x1b[1m١) الزائر المجهول لا يقرأ شيئاً\x1b[0m");
  for (const table of ["entries", "sections", "profiles"]) {
    const r = await rest(`${table}?select=*`);
    if (!r.ok) {
      ok(`${table} — مرفوض (${r.status})`);
      continue;
    }
    const rows = await r.json();
    if (Array.isArray(rows) && rows.length === 0) {
      ok(`${table} — فارغ`);
    } else {
      bad(
        `${table} — سُرّب ${rows.length} صفاً للمجهول`,
        JSON.stringify(rows).slice(0, 160)
      );
    }
  }
}

/* ---------- ٢) المجهول لا يكتب ---------- */

async function anonymousWrite() {
  console.log("\n\x1b[1m٢) الزائر المجهول لا يكتب\x1b[0m");
  const r = await rest("entries", {
    method: "POST",
    body: { title: "اختبار اختراق — يجب أن يُرفض" },
  });
  if (r.ok) {
    bad("قُبل إدراج من مجهول", await r.text());
  } else {
    ok(`الإدراج مرفوض (${r.status})`);
  }
}

/* ---------- ٣) العضو يقرأ ولا يكتب ولا يرقّي نفسه ---------- */

async function memberChecks() {
  const email = process.env.NJBC_MEMBER_EMAIL;
  const password = process.env.NJBC_MEMBER_PASSWORD;
  console.log("\n\x1b[1m٣) عضو عادي\x1b[0m");
  if (!email || !password) {
    console.log("  \x1b[90m— متجاوَز: اضبط NJBC_MEMBER_EMAIL و NJBC_MEMBER_PASSWORD\x1b[0m");
    return;
  }
  const session = await signIn(email, password);
  if (!session) return bad("تعذّر تسجيل دخول العضو");
  ok("سجّل الدخول");

  const read = await rest("sections?select=*", { token: session.token });
  const rows = read.ok ? await read.json() : [];
  rows.length > 0 ? ok(`يقرأ المواضيع (${rows.length})`) : bad("لا يقرأ المواضيع — القراءة معطّلة للأعضاء");

  const write = await rest("entries", {
    method: "POST",
    token: session.token,
    body: { title: "عضو يحاول الكتابة" },
  });
  write.ok ? bad("العضو استطاع الكتابة") : ok(`الكتابة مرفوضة (${write.status})`);

  const promote = await rest(`profiles?id=eq.${session.id}`, {
    method: "PATCH",
    token: session.token,
    body: { role: "admin" },
  });
  const promoted = promote.ok ? await promote.json() : [];
  if (promote.ok && promoted.some?.((p) => p.role === "admin")) {
    bad("العضو رقّى نفسه إلى أدمن", "صلاحية العمود لم تُطبَّق");
  } else {
    ok(`ترقية النفس مرفوضة (${promote.status})`);
  }
}

/* ---------- ٤) الأدمن يقرأ ويكتب فعلاً ---------- */

async function adminChecks() {
  const email = process.env.NJBC_ADMIN_EMAIL;
  const password = process.env.NJBC_ADMIN_PASSWORD;
  console.log("\n\x1b[1m٤) الأدمن (وإلا كان الـ revoke قد كسر الإدارة)\x1b[0m");
  if (!email || !password) {
    console.log("  \x1b[90m— متجاوَز: اضبط NJBC_ADMIN_EMAIL و NJBC_ADMIN_PASSWORD\x1b[0m");
    return;
  }
  const session = await signIn(email, password);
  if (!session) return bad("تعذّر تسجيل دخول الأدمن");
  ok("سجّل الدخول");

  const sections = await rest("sections?select=id,slug&limit=1", { token: session.token });
  const list = sections.ok ? await sections.json() : [];
  if (!list.length) return bad("لا مواضيع — نفّذ 0003_seed.sql أولاً");

  const created = await rest("entries", {
    method: "POST",
    token: session.token,
    body: { section_id: list[0].id, title: "مدخل تجريبي — سيُحذف" },
  });
  if (!created.ok) {
    return bad(`الأدمن لا يستطيع الكتابة (${created.status})`, await created.text());
  }
  const [row] = await created.json();
  ok("الأدمن أنشأ مدخلاً");

  const del = await rest(`entries?id=eq.${row.id}`, { method: "DELETE", token: session.token });
  del.ok ? ok("وحذفه (نُظّف الأثر)") : bad("تعذّر حذف المدخل التجريبي — احذفه يدوياً");
}

/* ---------- التشغيل ---------- */

console.log(`\x1b[1mفحص RLS على\x1b[0m ${SUPABASE_URL}`);

await anonymousReads();
await anonymousWrite();
await memberChecks();
await adminChecks();

console.log(`\n\x1b[1mالنتيجة:\x1b[0m ${passed} ناجح، ${failed} فاشل\n`);

if (failed > 0) {
  console.log("\x1b[31mلا تنتقل إلى المرحلة ٣ قبل معالجة ما فشل.\x1b[0m\n");
  process.exit(1);
}
console.log("\x1b[32mالبوابة تعمل على مستوى قاعدة البيانات.\x1b[0m\n");
