import { useTranslation } from 'react-i18next'

function App() {
  const { t, i18n } = useTranslation()

  const changeLanguage = async (language: 'en' | 'ar') => {
    await i18n.changeLanguage(language)

    localStorage.setItem('language', language)

    document.documentElement.lang = language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">{t('app.name')}</h1>

            <p className="mt-2 text-gray-500">{t('app.tagline')}</p>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => changeLanguage('en')} className="rounded-lg border px-3 py-2">
              EN
            </button>

            <button type="button" onClick={() => changeLanguage('ar')} className="rounded-lg border px-3 py-2">
              عربي
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}

export default App
