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
    checkmark: "✅",
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
        clue1: "Tablo Depo-Arşiv'den çalınmadı.",
        clue2: "Cam Kesici'yi kullanan kişi Aylin değildi.",
        clue3: "Ziyaretçi kayıtlarına göre Cem, o gece Restorasyon Atölyesi'ne hiç girmedi.",
        clue4: "Olay yerindeki kesim izi, kullanılan aletin doğrudan cam kesimi olduğunu gösteriyor.",
        clue5: "Kart Kopyalayıcı cihazı, Baran'ın imzasıyla kayıtlıydı.",
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
    suspect001: "Aylin Kara",
    suspect002: "Baran Yıldız",
    suspect003: "Cem Aras",
    suspect004: "Ayşe Öztürk",
    suspect005: "Can Arslan",
    suspect006: "Deniz Yıldız",
    icon001: "👤",
    icon002: "👩",
    icon003: "👨",
    icon004: "👩",
    icon005: "👨",
    icon006: "👤",
    bio001: "Baş Restoratör. Müzede 8 yıldır çalışıyor. Tablo restorasyonu konusunda uzman. Çalışma saatleri 09:00-17:00.",
    bio002: "Gece Güvenlik Şefi. 3 yıldır müzede görevli. Tüm güvenlik sistemlerinden sorumlu. Gece 18:00-06:00 arası görevde.",
    bio003: "Bağışçı ve koleksiyoncu. Müzenin önemli destekçilerinden biri. Nadir tabloların sahibi. Genellikle hafta sonları müzeyi ziyaret eder.",
  },
  locations: {
    location001: "Ana Galeri",
    location002: "Restorasyon Atölyesi",
    location003: "Depo-Arşiv",
    location004: "Oda 501",
    location005: "Oda 502",
    location006: "Oda 503",
    icon001: "🖼️",
    icon002: "🛠️",
    icon003: "📦",
    icon004: "🛏️",
    icon005: "🛏️",
    icon006: "🛏️",
    desc001: "Müzenin ana sergi alanı. Değerli tabloların sergilendiği bölüm. Güvenlik kameraları ve alarm sistemleri mevcut.",
    desc002: "Tablo ve eserlerin onarım ve restorasyon işlemlerinin yapıldığı atölye. Sadece yetkili personel girebilir.",
    desc003: "Eserlerin depolandığı arşiv bölümü. İklim kontrollü ortam. Sıkı güvenlik protokolleri var.",
  },
  weapons: {
    weapon001: "Cam Kesici",
    weapon002: "Manyetik Kart Kopyalayıcı",
    weapon003: "Sessiz Matkap",
    weapon004: "Yastık",
    weapon005: "Bardak",
    weapon006: "Halat",
    icon001: "🔪",
    icon002: "💳",
    icon003: "🔩",
    icon004: "🛏️",
    icon005: "🥛",
    icon006: "🪢",
    desc001: "Özel cam kesme aleti. Vitrin camlarını sessizce ve temiz bir şekilde kesmek için kullanılır.",
    desc002: "Güvenlik kartlarını kopyalamak için kullanılan cihaz. Manyetik şerit bilgilerini okur ve kopyalar.",
    desc003: "Düşük sesli elektrikli matkap. Duvar delmek veya kilit mekanizmalarını aşmak için kullanılabilir.",
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
  result: {
    success: {
      title: "Tebrikler!",
      message: "Vakayı başarıyla çözdünüz!",
    },
    failure: {
      title: "Yanlış Çözüm",
      message: "Seçimleriniz doğru değil. Kanıtları tekrar gözden geçirin.",
    },
    stats: {
      duration: "Süre",
      attempts: "Deneme Sayısı",
    },
    actions: {
      retry: "Tekrar Dene",
      dashboard: "Dashboard'a Dön",
      nextCase: "Sonraki Vaka",
    },
    validation: {
      wrongSuspect: "Yanlış şüpheli seçtiniz.",
      wrongLocation: "Yanlış konum seçtiniz.",
      wrongWeapon: "Yanlış silah seçtiniz.",
    },
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

