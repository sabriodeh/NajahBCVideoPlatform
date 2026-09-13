/* ============================================================
   ترجمة أخطاء قاعدة البيانات إلى رسائل مفهومة
   ------------------------------------------------------------
   دوال نقية. الغرض ألا يرى عضو الهيئة نصّاً إنجليزياً من PostgREST
   مثل «relation public.entries does not exist»، وألا يظن أن
   المنصة معطوبة حين تكون السكيما لم تُطبَّق بعد.
   ============================================================ */

/** المنصة منشورة لكن سكيما قاعدة البيانات لم تُنفَّذ بعد. */
const NOT_MIGRATED =
  /relation .* does not exist|could not find the table|schema cache|does not exist/i;

/** السكيما موجودة لكن سياسات RLS تمنع هذا المستخدم. */
const FORBIDDEN = /permission denied|row-level security|insufficient privilege|JWT/i;

/** انقطاع شبكة أو تعذّر الوصول إلى Supabase. */
const OFFLINE = /failed to fetch|network|networkerror|load failed/i;

/**
 * @returns {{kind: "not-migrated"|"forbidden"|"offline"|"unknown",
 *            title: string, detail: string, raw: string}|null}
 */
export function describeDataError(message) {
  if (!message) return null;
  const raw = String(message);

  if (NOT_MIGRATED.test(raw)) {
    return {
      kind: "not-migrated",
      title: "المنصة قيد التهيئة",
      detail:
        "لم تُنشأ جداول المحتوى في قاعدة البيانات بعد. هذه خطوة إعداد تقوم بها لجنة التحول الرقمي مرة واحدة، وسيظهر المحتوى فور اكتمالها.",
      raw,
    };
  }

  if (FORBIDDEN.test(raw)) {
    return {
      kind: "forbidden",
      title: "لا صلاحية لعرض هذا المحتوى",
      detail: "حسابك لا يملك صلاحية القراءة هنا. راجع لجنة التحول الرقمي إن كنت تظن أن هذا خطأ.",
      raw,
    };
  }

  if (OFFLINE.test(raw)) {
    return {
      kind: "offline",
      title: "تعذّر الاتصال",
      detail: "تحقّق من اتصالك بالشبكة ثم أعد المحاولة.",
      raw,
    };
  }

  return {
    kind: "unknown",
    title: "تعذّر تحميل المحتوى",
    detail: "حدث خطأ غير متوقّع. أعد المحاولة، وإن تكرر فأبلغ لجنة التحول الرقمي.",
    raw,
  };
}
