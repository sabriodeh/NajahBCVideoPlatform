-- ============================================================
-- ⚡ ملف واحد: انسخه كاملاً والصقه في SQL Editor ثم اضغط Run
-- ------------------------------------------------------------
-- هذا دمج للملفات الثلاثة (0001 و 0002 و 0003) في لصقة واحدة.
-- آمن التكرار: إعادة تشغيله لا تُتلف شيئاً.
--
-- لا يمسّ جدول videos ولا يحذف أي حساب.
--
-- بعد التشغيل، شغّل من الطرفية:  node scripts/verify-rls.mjs
-- ============================================================


-- ════════════ 0001_schema.sql ════════════

-- ============================================================
-- ٠٠٠١ — سكيما المواضيع والمداخل
-- ------------------------------------------------------------
-- يُنفَّذ في محرّر SQL على لوحة Supabase.
-- آمن التكرار: إعادة تشغيله لا تُتلف شيئاً.
--
-- لا يمسّ هذا الملف جدول videos ولا profiles إطلاقاً.
-- تقاعد videos مؤجَّل إلى المرحلة ٥ بعد التأكد من عمل كل شيء.
-- ============================================================

-- ---------- المواضيع ----------
-- الشجرة بمستويين: موضوع رئيسي، وفروع تحته عبر parent_id.
-- «سياسات الذكاء الاصطناعي» فرعاها: للمدرسين، وللطلبة.

create table if not exists public.sections (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  description text,
  parent_id   uuid references public.sections(id) on delete cascade,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists sections_parent_order_idx
  on public.sections (parent_id, sort_order);

-- ---------- المداخل ----------
-- كل مدخل يجمع ما يحتاجه عضو الهيئة عن وكيل أو سياسة:
-- رابط الوكيل، وكيفية الدخول إليه، وفيديو شرح، وتعليمات ملزِمة،
-- وروابط مستندات. لا تُرفع أي ملفات — كل المحتوى روابط.

create table if not exists public.entries (
  id                uuid primary key default gen_random_uuid(),
  section_id        uuid not null references public.sections(id) on delete cascade,
  title             text not null,
  summary           text,
  instructions      text,
  agent_url         text,
  agent_access_note text,

  -- نوع الفيديو ومعرّفه. القيد يمنع قيمة ثالثة تسلّلت بالخطأ،
  -- ويشترط أن يأتي النوع والمعرّف معاً أو لا يأتيا.
  video_kind        text check (video_kind in ('drive', 'youtube')),
  video_ref         text,
  constraint entries_video_pair check (
    (video_kind is null and video_ref is null)
    or (video_kind is not null and video_ref is not null)
  ),

  -- روابط المستندات: [{label, url, kind}]
  -- JSONB لا جدول ثالث: تُقرأ وتُكتب دائماً مع مدخلها، ولا نستعلم
  -- عنها منفردة. القيد يضمن أنها مصفوفة لا كائن ولا نص.
  links             jsonb not null default '[]'::jsonb,
  constraint entries_links_is_array check (jsonb_typeof(links) = 'array'),

  sort_order        int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- للمساءلة: من أنشأ المدخل. مفيد كدليل حوكمة لملف AACSB.
  -- (إضافة على الخطة الأصلية — يمكن إسقاط العمود بلا أثر وظيفي.)
  created_by        uuid references auth.users(id) on delete set null default auth.uid()
);

create index if not exists entries_section_order_idx
  on public.entries (section_id, sort_order);

-- ---------- تحديث updated_at تلقائياً ----------
-- الاعتماد على العميل في ضبط الوقت يعني أن أي كتابة تنساه تُبقي
-- التاريخ قديماً بصمت.

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists entries_touch_updated_at on public.entries;
create trigger entries_touch_updated_at
  before update on public.entries
  for each row execute function public.touch_updated_at();


-- ════════════ 0002_rls.sql ════════════

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


-- ════════════ 0003_seed.sql ════════════

-- ============================================================
-- ٠٠٠٣ — المواضيع الأولية
-- ------------------------------------------------------------
-- آمن التكرار: on conflict على slug يجعل إعادة التشغيل تحديثاً
-- لا تكراراً.
-- ============================================================

-- ---------- الموضوعان الرئيسيان ----------

insert into public.sections (slug, title, description, sort_order) values
  (
    'ai-agents',
    'وكلاء الذكاء الاصطناعي',
    'الوكلاء والـ Gems المعتمدة في كلية الأعمال والاتصال، وكيفية الوصول إليها واستخدامها.',
    1
  ),
  (
    'ai-policies',
    'سياسات الذكاء الاصطناعي',
    'السياسات المعتمدة لاستخدام الذكاء الاصطناعي في الكلية.',
    2
  )
on conflict (slug) do update set
  title       = excluded.title,
  description = excluded.description,
  sort_order  = excluded.sort_order;

-- ---------- فرعا السياسات ----------

insert into public.sections (slug, title, description, parent_id, sort_order)
select
  'policies-faculty',
  'السياسات الخاصة بالمدرسين',
  'ما يلتزم به عضو الهيئة التدريسية عند استخدام الذكاء الاصطناعي في التدريس والتقييم.',
  s.id,
  1
from public.sections s where s.slug = 'ai-policies'
on conflict (slug) do update set
  title       = excluded.title,
  description = excluded.description,
  parent_id   = excluded.parent_id,
  sort_order  = excluded.sort_order;

insert into public.sections (slug, title, description, parent_id, sort_order)
select
  'policies-students',
  'السياسات الخاصة بالطلبة',
  'ما يُسمح به وما يُمنع على الطالب عند استخدام الذكاء الاصطناعي في المساقات والمشاريع.',
  s.id,
  2
from public.sections s where s.slug = 'ai-policies'
on conflict (slug) do update set
  title       = excluded.title,
  description = excluded.description,
  parent_id   = excluded.parent_id,
  sort_order  = excluded.sort_order;

-- ---------- تحقّق ----------
-- يجب أن يظهر أربعة صفوف: موضوعان رئيسيان وفرعان تحت السياسات.

select
  coalesce(p.title, '— رئيسي —') as "الأب",
  s.sort_order                   as "الترتيب",
  s.slug                         as "المعرّف",
  s.title                        as "العنوان"
from public.sections s
left join public.sections p on p.id = s.parent_id
order by coalesce(p.sort_order, s.sort_order), s.parent_id nulls first, s.sort_order;
