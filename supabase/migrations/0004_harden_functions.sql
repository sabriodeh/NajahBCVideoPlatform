-- ============================================================
-- ٠٠٠٤ — تقوية الدوال
-- ------------------------------------------------------------
-- بناءً على مستشار الأمان في Supabase بعد تطبيق الملفات السابقة.
-- ============================================================

-- handle_new_user كانت قابلة للاستدعاء من anon عبر
-- /rest/v1/rpc/handle_new_user وهي SECURITY DEFINER.
-- هي محفّز على auth.users، والمحفّزات تعمل بلا صلاحية تنفيذ،
-- فسحبها لا يكسر إنشاء الحسابات ويغلق التعريض.
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- touch_updated_at بلا search_path مثبّت: قابلة للاختطاف بجدول
-- مزيَّف في مخطط آخر ضمن مسار البحث.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.touch_updated_at() from public, anon, authenticated;

-- ============================================================
-- تحذيران يبقيان في المستشار، وهما مقصودان:
--
--   is_admin()             تعيد قيمة منطقية عن المستدعي نفسه فقط.
--   admin_update_profile() تفحص is_admin() في أول سطر وترفع
--                          استثناء «forbidden» لغير الأدمن — وهذا
--                          هو الحارس نفسه، لا ثغرة فيه.
-- ============================================================
