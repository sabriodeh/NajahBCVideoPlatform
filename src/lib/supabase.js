/* ============================================================
   عميل Supabase الموحّد
   ------------------------------------------------------------
   نسخة واحدة لكل التطبيق. المكتبة الرسمية تتكفّل بحفظ الجلسة
   وتجديد الرمز تلقائياً — وهو ما كانت طبقة fetch اليدوية
   السابقة تفتقده، فكان المستخدم يُطرد عند كل تحديث للصفحة،
   وتفشل طلباته صامتةً بعد ساعة من انتهاء صلاحية الرمز.
   ============================================================ */

import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "../config.js";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // لا نستخدم روابط سحرية ولا OAuth
    storageKey: "njbc.auth",
  },
});
