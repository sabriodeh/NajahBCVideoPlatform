import { createContext } from "react";

/** سياق المصادقة — يُعبّأ من AuthProvider ويُقرأ عبر useAuth. */
export const AuthContext = createContext(null);
