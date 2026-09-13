import { useCallback, useEffect, useState } from "react";

/**
 * ينفّذ دالة غير متزامنة ويتابع حالتها.
 *
 * يوحّد نمط التحميل/الخطأ/البيانات في كل الصفحات بدل تكراره،
 * ويضمن أمرين يسهل نسيانهما يدوياً: تجاهل نتيجة طلب قديم بعد
 * تغيّر المدخلات، وعدم ضبط الحالة بعد تفكيك المكوّن.
 *
 * @param {() => Promise<any>} fn
 * @param {any[]} deps
 */
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const [nonce, setNonce] = useState(0);

  /** إعادة الجلب يدوياً بعد تعديل أو حذف. */
  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));

    Promise.resolve()
      .then(fn)
      .then((data) => {
        if (alive) setState({ loading: false, error: null, data });
      })
      .catch((err) => {
        if (alive) setState({ loading: false, error: err?.message || String(err), data: null });
      });

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- المدخلات يحدّدها المستدعي
  }, [...deps, nonce]);

  return { ...state, reload };
}
