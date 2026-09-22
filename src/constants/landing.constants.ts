import {
  ArrowLeftRight,
  BarChart3,
  Copy,
  ListFilter,
  Merge,
  MoveRight,
  Plus,
  Sparkles,
  Wand2,
} from 'lucide-react'

import thumbJavascript from '@/assets/thumb-javascript.jpg'
import thumbMusic from '@/assets/thumb-music.jpg'
import thumbReact from '@/assets/thumb-react.jpg'
import type {
  ILandingCopy,
  IPreviewVideo,
  IToolDefinition,
  Locale,
} from '@/models/landing.interface'

export const LANDING_COPY: Record<Locale, ILandingCopy> = {
  en: {
    tagline: 'Your playlists, finally under control.',
    sub: 'Build, combine, clean, and organize your YouTube playlists in one focused workspace.',
    continue: 'Continue with Google',
    privacy: 'We only request playlist access when you connect. Your data stays yours.',
    tools: 'Tools',
    library: 'Library',
    toolboxLabel: 'THE TOOLBOX',
    toolboxTitle: 'Every playlist job, covered.',
    toolboxDescription:
      'Purpose-built tools replace repetitive playlist chores with clear, reviewable workflows.',
    footerTagline: 'Playlist productivity, without the clutter.',
    privacyLink: 'Privacy',
    termsLink: 'Terms',
    helpLink: 'Help',
    badge: '10 tools. One tidy library.',
    previewTitle: 'Copy videos',
    previewReady: 'Ready',
    previewSource: 'Source · JavaScript Basics',
    previewDestination: 'Destination · React Mastery',
    previewChanges: 'changes ready',
    previewSave: 'Save changes',
  },
  ar: {
    tagline: 'قوائم تشغيلك، تحت السيطرة أخيراً.',
    sub: 'أنشئ وادمج ونظّف ونظّم قوائم يوتيوب في مساحة عمل واحدة.',
    continue: 'المتابعة باستخدام Google',
    privacy: 'نطلب إذن القوائم فقط عند الربط. بياناتك تبقى ملكك.',
    tools: 'الأدوات',
    library: 'المكتبة',
    toolboxLabel: 'صندوق الأدوات',
    toolboxTitle: 'كل مهام القوائم، مغطاة.',
    toolboxDescription:
      'أدوات مخصصة تستبدل مهام القوائم المتكررة بسير عمل واضح وقابل للمراجعة.',
    footerTagline: 'إنتاجية القوائم، بدون فوضى.',
    privacyLink: 'الخصوصية',
    termsLink: 'الشروط',
    helpLink: 'المساعدة',
    badge: '10 أدوات. مكتبة مرتبة واحدة.',
    previewTitle: 'نسخ الفيديوهات',
    previewReady: 'جاهز',
    previewSource: 'المصدر · أساسيات JavaScript',
    previewDestination: 'الوجهة · إتقان React',
    previewChanges: 'تغييرات جاهزة',
    previewSave: 'حفظ التغييرات',
  },
}

export const LANDING_TOOLS: IToolDefinition[] = [
  {
    id: 'copy',
    label: 'Copy videos',
    ar: 'نسخ الفيديوهات',
    desc: 'Copy selected videos between playlists',
    icon: Copy,
  },
  {
    id: 'move',
    label: 'Move videos',
    ar: 'نقل الفيديوهات',
    desc: 'Transfer videos and remove originals',
    icon: MoveRight,
  },
  {
    id: 'build',
    label: 'Build playlist',
    ar: 'إنشاء قائمة',
    desc: 'Create a playlist from many sources',
    icon: Plus,
  },
  {
    id: 'merge',
    label: 'Merge playlists',
    ar: 'دمج القوائم',
    desc: 'Combine playlists in the order you choose',
    icon: Merge,
  },
  {
    id: 'duplicate',
    label: 'Duplicate playlist',
    ar: 'تكرار القائمة',
    desc: 'Clone a playlist with new settings',
    icon: Copy,
  },
  {
    id: 'reorder',
    label: 'Reorder playlist',
    ar: 'إعادة الترتيب',
    desc: 'Sort and arrange every video',
    icon: ListFilter,
  },
  {
    id: 'rename',
    label: 'Rename & number',
    ar: 'تسمية وترقيم',
    desc: 'Add structured labels to your videos',
    icon: Wand2,
  },
  {
    id: 'compare',
    label: 'Compare playlists',
    ar: 'مقارنة القوائم',
    desc: 'Find shared and missing videos',
    icon: ArrowLeftRight,
  },
  {
    id: 'cleaner',
    label: 'Playlist cleaner',
    ar: 'منظف القوائم',
    desc: 'Remove duplicates and unavailable entries',
    icon: Sparkles,
  },
  {
    id: 'insights',
    label: 'Library insights',
    ar: 'إحصاءات المكتبة',
    desc: 'Understand your playlist library',
    icon: BarChart3,
  },
]

export const PREVIEW_VIDEOS: IPreviewVideo[] = [
  {
    id: 1,
    title: 'JavaScript in 100 Seconds',
    channel: 'Fireship',
    image: thumbJavascript,
  },
  {
    id: 2,
    title: 'React Full Course for Beginners',
    channel: 'freeCodeCamp.org',
    image: thumbReact,
  },
  {
    id: 3,
    title: 'TypeScript Tutorial for Beginners',
    channel: 'Programming with Mosh',
    image: thumbJavascript,
  },
  {
    id: 4,
    title: 'Deep Focus — Music for Coding',
    channel: 'Quiet Quest',
    image: thumbMusic,
  },
]

export const PREVIEW_READY_CHANGES = 3
