import type { AuthErrorCode } from '@/api/google/errors'
import type { Locale } from '@/models/landing.interface'

export interface IAuthCopy {
  continue: string
  connecting: string
  privacy: string
  loginTitle: string
  loginDescription: string
  close: string
  goToTools: string
}

export const AUTH_COPY: Record<Locale, IAuthCopy> = {
  en: {
    continue: 'Continue with Google',
    connecting: 'Connecting…',
    privacy: 'We only request playlist access when you connect. Your data stays yours.',
    loginTitle: 'Sign in to use PlayPick tools',
    loginDescription:
      'Connect your Google account to build, clean, and organize your YouTube playlists.',
    close: 'Close',
    goToTools: 'Explore tools',
  },
  ar: {
    continue: 'المتابعة باستخدام Google',
    connecting: 'جاري الاتصال…',
    privacy: 'نطلب إذن القوائم فقط عند الربط. بياناتك تبقى ملكك.',
    loginTitle: 'سجّل الدخول لاستخدام أدوات PlayPick',
    loginDescription:
      'اربط حساب Google لإنشاء وتنظيف وتنظيم قوائم يوتيوب الخاصة بك.',
    close: 'إغلاق',
    goToTools: 'استكشف الأدوات',
  },
}

export const AUTH_ERROR_MESSAGES: Record<
  Locale,
  Record<AuthErrorCode, string>
> = {
  en: {
    missingClientId: 'Google sign-in is not configured yet.',
    scriptUnavailable: 'Could not load Google sign-in. Check your connection and try again.',
    popupBlocked: 'Your browser blocked the Google sign-in popup. Allow popups and try again.',
    popupClosed: 'Sign-in was cancelled before it finished.',
    accessDenied: 'Google access was denied. Grant playlist permission to continue.',
    profileUnavailable: 'Signed in, but your Google profile could not be loaded.',
    unknown: 'Something went wrong while signing in. Please try again.',
  },
  ar: {
    missingClientId: 'تسجيل الدخول عبر Google غير مهيأ بعد.',
    scriptUnavailable: 'تعذر تحميل تسجيل الدخول عبر Google. تحقق من الاتصال وحاول مجدداً.',
    popupBlocked: 'المتصفح منع نافذة تسجيل الدخول. اسمح بالنوافذ المنبثقة وحاول مجدداً.',
    popupClosed: 'تم إلغاء تسجيل الدخول قبل اكتماله.',
    accessDenied: 'تم رفض الوصول من Google. امنح إذن القوائم للمتابعة.',
    profileUnavailable: 'تم تسجيل الدخول، لكن تعذر تحميل ملفك الشخصي.',
    unknown: 'حدث خطأ أثناء تسجيل الدخول. حاول مجدداً.',
  },
}
