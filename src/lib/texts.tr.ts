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
    questionMark: "?",
    cross: "✗",
    about: "Hakkında",
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
  cases: {
    list: {
      title: "Vakalar",
      startButton: "Vakayı Başlat",
    },
    briefing: "Durum Raporu",
    clues: "Kanıtlar",
    notFound: "Vaka bulunamadı",
    case001: {
      title: "Müze Soygunu",
      briefing:
        "Dün gece saat 23:00'te müze güvenlik sisteminden alarm çaldı. Güvenlik görevlileri olay yerine vardığında, önemli bir tablo kayıptı. Olay yerinde bazı ipuçları bulundu.",
      clues: {
        clue1: "Katil, suç mahallinde bir parmak izi bırakmış.",
        clue2: "Olay yerinde bulunan eşya, şüphelilerden birinin evinde de var.",
        clue3: "Şahit ifadesine göre, katil olay yerinden koşarak kaçmış.",
        clue4: "Suç aleti, suç mahallinden 100 metre uzakta bulunmuş.",
        clue5: "Katil, olay sırasında sağlak bir kişi olmalı.",
      },
    },
    case002: {
      title: "Otel Cinayeti",
      briefing:
        "Lüks otelin 5. katında bir oda hizmetçisi ceset buldu. Kurban, odasında ölü bulundu ve birkaç değerli eşya eksikti. Kapı zorla açılmıştı.",
      clues: {
        clue1: "Güvenlik kamerası, olay saatinde 3 şüphelinin koridorda olduğunu gösteriyor.",
        clue2: "Kurbanın yanında bulunan eşya, şüphelilerden birinin daha önce kaybettiği bir parça.",
        clue3: "Oda anahtarı, suç mahallinin yakınında bulunmuş.",
        clue4: "Olay yerindeki izler, katilin aceleyle kaçtığını gösteriyor.",
        clue5: "Kurbanın cep telefonu kayıp ve henüz bulunamadı.",
      },
    },
  },
  suspects: {
    suspect001: "Ahmet Yılmaz",
    suspect002: "Zeynep Kaya",
    suspect003: "Mehmet Demir",
    suspect004: "Ayşe Öztürk",
    suspect005: "Can Arslan",
    suspect006: "Deniz Yıldız",
    icon001: "👤",
    icon002: "👩",
    icon003: "👨",
    icon004: "👩",
    icon005: "👨",
    icon006: "👤",
  },
  locations: {
    location001: "Müze Girişi",
    location002: "Sergi Salonu",
    location003: "Depo",
    location004: "Oda 501",
    location005: "Oda 502",
    location006: "Oda 503",
    icon001: "🚪",
    icon002: "🖼️",
    icon003: "📦",
    icon004: "🛏️",
    icon005: "🛏️",
    icon006: "🛏️",
  },
  weapons: {
    weapon001: "Bıçak",
    weapon002: "Çekiç",
    weapon003: "Silah",
    weapon004: "Yastık",
    weapon005: "Bardak",
    weapon006: "Halat",
    icon001: "🔪",
    icon002: "🔨",
    icon003: "🔫",
    icon004: "🛏️",
    icon005: "🥛",
    icon006: "🪢",
  },
  grid: {
    title: "İnceleme Tablosu",
    suspects: "KİM",
    locations: "NEREDE",
    weapons: "NEYLE",
    finalDeduction: "Son Çıkarım",
    submitReport: "Raporu Gönder",
    submitDisabledHint: "Tüm alanları doldurun",
  },
  difficulty: {
    label: "Zorluk:",
    easy: "Kolay",
    medium: "Orta",
    hard: "Zor",
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

