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
