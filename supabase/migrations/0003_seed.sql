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
