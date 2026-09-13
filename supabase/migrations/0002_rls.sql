-- ============================================================
-- ٠٠٠٢ — سياسات Row Level Security
-- ------------------------------------------------------------
-- هذا الملف هو البوابة الحقيقية للمنصة.
--
-- شاشة الدخول في الواجهة تمنع العرض لا الوصول: مفتاح anon علني
-- بحكم التصميم — مضمَّن في حزمة الجافاسكربت المنشورة ويستطيع أي
-- زائر قراءته من أدوات المطوّر. من يستدعي REST مباشرة يتجاوز
-- الواجهة كلها. ما يمنعه فعلاً هو غياب أي سياسة لدور anon هنا.
--
-- آمن التكرار.
-- ============================================================

-- ---------- دالة فحص الدور ----------
-- SECURITY DEFINER ضروري لا تجميلي: لو استعلمت السياسة عن profiles
-- مباشرةً لاستدعت سياسات profiles نفسها، فينشأ استدعاء دائري
-- يرفضه Postgres. الدالة تتجاوز RLS داخلها فتكسر الحلقة.
-- search_path مثبَّت لمنع اختطاف الدالة بجدول مزيَّف في مخطط آخر.

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ---------- إغلاق تسريب profiles ----------
-- ⚠️ هذه الأسماء رُصدت على قاعدة الإنتاج الفعلية. سياستان
-- بالدور {public} والشرط true كانتا تكشفان كل صفوف profiles
-- لأي زائر مجهول. إسقاط السياسات بأسماء «متوقَّعة» لا يكفي:
-- لا بد من الأسماء الحقيقية، وإلا بقيت الثغرة مفتوحة بصمت.

drop policy if exists "profiles are public"    on public.profiles;
drop policy if exists "profiles readable"      on public.profiles;
drop policy if exists "user edits own profile" on public.profiles;

-- ---------- تفعيل RLS ----------

alter table public.sections enable row level security;
alter table public.entries  enable row level security;
alter table public.profiles enable row level security;

-- ---------- القراءة: كل مسجّل دخول ----------
-- لا توجد سياسة لدور anon في أي مكان أدناه، وهذا مقصود:
-- بغياب السياسة يرى المجهول صفراً من الصفوف.

drop policy if exists "authenticated read sections" on public.sections;
create policy "authenticated read sections" on public.sections
  for select to authenticated using (true);

drop policy if exists "authenticated read entries" on public.entries;
create policy "authenticated read entries" on public.entries
  for select to authenticated using (true);

-- ---------- الكتابة: الأدمن وحده ----------
-- with check يحرس الصف بعد التعديل، و using يحرسه قبله. لا بد
-- منهما معاً وإلا استطاع غير الأدمن إدراج صف جديد.

drop policy if exists "admin writes sections" on public.sections;
create policy "admin writes sections" on public.sections
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admin writes entries" on public.entries;
create policy "admin writes entries" on public.entries
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- الملفات الشخصية ----------

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select to authenticated
  using (auth.uid() = id or public.is_admin());

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update to authenticated
  using (auth.uid() = id);

-- ---------- منع ترقية النفس إلى أدمن ----------
-- سياسة «حدّث صفّك» وحدها لا تكفي: الصف ملكه فعلاً، فلا شيء يمنعه
-- من PATCH يضع role='admin'. الصلاحية على مستوى العمود هي ما يمنع.

revoke update on public.profiles from authenticated;
grant  update (must_change_password) on public.profiles to authenticated;

-- ⚠️ الـ revoke أعلاه يطال الأدمن أيضاً: الصلاحيات تخصّ الدور لا
-- الصف، و«الأدمن» ليس دوراً في Postgres بل قيمة في عمود. فلا يستطيع
-- أحد تعديل role أو username عبر REST. هذه الدالة هي المسار الوحيد.

create or replace function public.admin_update_profile(
  target              uuid,
  new_role            text    default null,
  new_username        text    default null,
  reset_password_flag boolean default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden: admin role required';
  end if;

  if new_role is not null and new_role not in ('admin', 'member', 'uploader') then
    raise exception 'invalid role: %', new_role;
  end if;

  update public.profiles set
    role                 = coalesce(new_role, role),
    username             = coalesce(new_username, username),
    must_change_password = coalesce(reset_password_flag, must_change_password)
  where id = target;
end;
$$;

revoke all on function public.admin_update_profile(uuid, text, text, boolean) from public, anon;
grant execute on function public.admin_update_profile(uuid, text, text, boolean) to authenticated;

-- ---------- سدّ الوصول المجهول صراحةً ----------
-- احتياط مزدوج: غياب السياسة يكفي، لكن سحب الصلاحيات يجعل النية
-- صريحة ويحمي من سياسة تُضاف لاحقاً بلا انتباه.

revoke all on public.sections from anon;
revoke all on public.entries  from anon;
revoke all on public.profiles from anon;
