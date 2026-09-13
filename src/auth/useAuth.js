import { useContext } from "react";
import { AuthContext } from "./context.js";

/** حالة الدخول والدور والإجراءات. يجب أن يكون داخل AuthProvider. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth يجب أن يُستدعى داخل AuthProvider.");
  return ctx;
}
