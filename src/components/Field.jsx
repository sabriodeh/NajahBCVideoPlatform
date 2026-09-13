/**
 * حقل نموذج موحّد.
 *
 * يضمن ثلاثة أمور كانت ناقصة في النماذج السابقة: تسمية ظاهرة
 * مرتبطة بـ htmlFor (لا placeholder وحده)، وربط رسالة الخطأ
 * والمساعدة بالحقل عبر aria-describedby، وضبط aria-invalid حتى
 * يسمع قارئ الشاشة الخطأ لا أن يراه المبصر وحده.
 */
export function Field({ id, label, error, hint, required, as = "input", children, ...inputProps }) {
  const hintId = hint ? `${id}-hint` : null;
  const errorId = error ? `${id}-error` : null;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  const Tag = as;

  return (
    <div className="nj-field">
      <label htmlFor={id}>
        {label}
        {required && (
          <span aria-hidden="true" style={{ color: "var(--wine)" }}>
            {" *"}
          </span>
        )}
      </label>

      <Tag
        id={id}
        required={required}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy}
        {...inputProps}
      >
        {children}
      </Tag>

      {error && (
        <p className="nj-hint nj-hint-error" id={errorId} role="alert">
          {error}
        </p>
      )}

      {hint && (
        <p className="nj-hint" id={hintId}>
          {hint}
        </p>
      )}
    </div>
  );
}
