/* ============================================================
   سياق المصادقة
   ------------------------------------------------------------
   مصدر الحقيقة الوحيد لحالة الدخول والدور. يجمع بين جلسة
   Supabase وملف العضو في جدول profiles، ولا يعلن الجاهزية إلا
   بعد اكتمال الاثنين معاً.
   ============================================================ */

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase.js";
import { AuthContext } from "./context.js";

const PROFILE_COLUMNS = "username,role,department,division,must_change_password";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [profile, setProfile] = useState(null);
  /* أي مستخدم ينتمي إليه `profile` الحالي — يمنع اعتبار ملف
     مستخدم سابق صالحاً للمستخدم الجديد أثناء التبديل */
  const [profileUid, setProfileUid] = useState(null);
  const [profileError, setProfileError] = useState(null);

  const uid = session?.user?.id ?? null;

  /* استعادة الجلسة المحفوظة، ثم متابعة كل تغيّر لاحق */
  useEffect(() => {
    let alive = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data?.session ?? null);
      setSessionReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!alive) return;
      setSession(next ?? null);
      setSessionReady(true);
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  /* جلب ملف العضو كلما تغيّر المستخدم */
  useEffect(() => {
    /* لا تصفير متزامن هنا: القيم تُشتق أدناه من تطابق المعرّف،
       فالخروج أو تبديل المستخدم يُبطلها دون إعادة تصيير إضافية */
    if (!uid) return;

    let alive = true;
    supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", uid)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!alive) return;
        setProfile(data ?? null);
        /* يُضبط حتى عند الفشل، وإلا بقي التطبيق في حالة تحميل أبدية */
        setProfileUid(uid);
        setProfileError(error ? error.message : null);
      });

    return () => {
      alive = false;
    };
  }, [uid]);

  /* الجاهزية مربوطة بالمستخدم نفسه لا براية منفصلة، فلا تُقرأ
     بيانات مستخدم سابق على أنها بيانات الحالي */
  const profileReady = uid === null || profileUid === uid;
  const loading = !sessionReady || !profileReady;

  /* الملف صالح فقط إن كان يخصّ المستخدم الحالي */
  const activeProfile = uid && profileUid === uid ? profile : null;

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(email || "").trim(),
      password,
    });
    if (error) {
      /* رسالة واحدة للحالتين عمداً: التمييز بين «بريد غير مسجّل»
         و«كلمة مرور خاطئة» يكشف من يملك حساباً */
      throw new Error("البريد الجامعي أو كلمة المرور غير صحيحة.");
    }
    return data;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  /**
   * يغيّر كلمة المرور ثم يرفع راية الإجبار.
   *
   * العمليتان منفصلتان عند Supabase: تغيير كلمة المرور في نظام
   * المصادقة، ورفع الراية في جدول profiles. قد تنجح الأولى وتفشل
   * الثانية (سياسات RLS غير مطبَّقة، أو صلاحية العمود ناقصة، أو
   * انقطاع الشبكة) — وعندها تكون كلمة المرور قد تغيّرت فعلاً بينما
   * يظل الحارس يعيد المستخدم إلى شاشة التغيير إلى الأبد.
   *
   * لذلك تُعاد النتيجة مفصَّلة بدل ابتلاع فشل الخطوة الثانية.
   * @returns {Promise<{passwordChanged: true, flagCleared: boolean}>}
   */
  const changePassword = useCallback(
    async (newPassword) => {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw new Error(error.message || "تعذّر تغيير كلمة المرور.");

      if (!uid) return { passwordChanged: true, flagCleared: true };

      const { error: flagError } = await supabase
        .from("profiles")
        .update({ must_change_password: false })
        .eq("id", uid);

      if (!flagError) {
        setProfile((p) => (p ? { ...p, must_change_password: false } : p));
      }

      return { passwordChanged: true, flagCleared: !flagError };
    },
    [uid]
  );

  const value = useMemo(
    () => ({
      loading,
      session,
      user: session?.user ?? null,
      profile: activeProfile,
      profileError,
      email: session?.user?.email ?? "",
      displayName: activeProfile?.username || session?.user?.email || "",
      /* الدور الافتراضي هو الأدنى صلاحية: تعذّر قراءة الملف
         يجب ألا يمنح صلاحيات، وRLS هي الحكم النهائي على أي حال */
      role: activeProfile?.role === "admin" ? "admin" : "member",
      isAdmin: activeProfile?.role === "admin",
      isAuthenticated: Boolean(session),
      mustChangePassword: Boolean(activeProfile?.must_change_password),
      signIn,
      signOut,
      changePassword,
    }),
    [loading, session, activeProfile, profileError, signIn, signOut, changePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
