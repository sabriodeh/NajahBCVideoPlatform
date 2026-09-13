import { EmptyState, ErrorState, Skeleton } from "./DataState.jsx";

/**
 * يوحّد ترتيب الحالات الأربع: تحميل ← خطأ ← فراغ ← محتوى.
 *
 * كتابته يدوياً في كل صفحة تعني أن صفحةً ما ستنسى حالة الفراغ أو
 * تعرض المحتوى أثناء التحميل.
 */
export function DataStateBlock({
  loading,
  error,
  onRetry,
  isEmpty,
  emptyTitle,
  emptyBody,
  emptyIcon,
  emptyAction,
  skeletonRows = 3,
  children,
}) {
  if (loading) return <Skeleton rows={skeletonRows} />;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;

  if (isEmpty) {
    return (
      <EmptyState title={emptyTitle} icon={emptyIcon}>
        {emptyBody && <p>{emptyBody}</p>}
        {emptyAction}
      </EmptyState>
    );
  }

  return children;
}
