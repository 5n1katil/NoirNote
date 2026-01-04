/**
 * NoirNote — Türkçe metin kaynağı (tek kaynak).
 *
 * Kurallar:
 * - Kullanıcıya görünen tüm metinler buradan gelmeli.
 * - Bileşenler/sayfalar içinde metin sabitlemeyin.
 * - Gelecekte `texts.en.ts` eklemek için anahtar yapısını semantik tutun.
 */
export const textsTR = {
  common: {
    appName: "NoirNote",
    loading: "Yükleniyor…",
    continue: "Devam et",
    back: "Geri",
    close: "Kapat",
    cancel: "İptal",
  },
  meta: {
    title: "NoirNote",
    description:
      "NoirNote: cinayet çıkarımı ve mantık bulmacası oyunu. (Kurulum aşaması)",
  },
  home: {
    title: "NoirNote",
    subtitle:
      "Cinayet çıkarımı ve mantık bulmacaları için minimal temel kurulum.",
    primaryCta: "Giriş yap",
    secondaryCta: "Gösterge paneline git",
  },
  login: {
    title: "Giriş",
    subtitle: "Devam etmek için Google hesabınla giriş yap.",
    googleButton: "Google ile giriş yap",
    signingIn: "Giriş yapılıyor…",
    redirecting: "Yönlendiriliyorsun…",
  },
  nav: {
    dashboard: "Gösterge Paneli",
    profile: "Profil",
    leaderboard: "Liderlik Tablosu",
    logout: "Çıkış yap",
    login: "Giriş",
  },
  dashboard: {
    title: "Gösterge Paneli",
    placeholder:
      "Burası oyun akışı için başlangıç noktası olacak. (İskelet sayfa)",
  },
  profile: {
    title: "Profil",
    placeholder:
      "Burası profil ayarları ve istatistikler için ayrılacak. (İskelet sayfa)",
  },
  leaderboard: {
    title: "Liderlik Tablosu",
    placeholder:
      "Burası puanlar ve sıralamalar için ayrılacak. (İskelet sayfa)",
  },
  errors: {
    unknown: "Bir şeyler ters gitti.",
    network: "Ağ bağlantısı hatası. Lütfen tekrar dene.",
    authPopupClosed: "Giriş penceresi kapatıldı.",
    authFailed: "Giriş başarısız. Lütfen tekrar dene.",
    configMissing:
      "Uygulama yapılandırması eksik. Lütfen ortam değişkenlerini kontrol et.",
  },
  a11y: {
    appLogoAlt: "NoirNote logosu",
  },
} as const;

export type TextsTR = typeof textsTR;

