import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { faker } from "@faker-js/faker/locale/id_ID";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "rifkyf589@gmail.com";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function orderNumber(date) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `ORD-${yyyy}${mm}${dd}-${rand}`;
}

function generateSku(type, index) {
  const prefix = type === "SPAREPART" ? "SP" : "SV";
  return `${prefix}-${String(index + 1).padStart(3, "0")}`;
}

function generatePlateNumber() {
  const prefixes = [
    "B",
    "B",
    "B",
    "B",
    "F",
    "F",
    "D",
    "D",
    "E",
    "A",
    "T",
    "L",
    "N",
    "H",
    "Z",
  ];
  const prefix = faker.helpers.arrayElement(prefixes);
  return `${prefix} ${faker.number.int({
    min: 1000,
    max: 9999,
  })} ${faker.string.alpha({ length: 3, casing: "upper" })}`;
}

function setTime(baseDate, hour, minute = 0) {
  const d = new Date(baseDate);
  d.setHours(hour, minute + faker.number.int({ min: 0, max: 59 }), 0, 0);
  return d;
}

function formatCurrency(amount) {
  return `Rp${amount.toLocaleString("id-ID")}`;
}

function formatDate(date) {
  return (
    new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) + " WIB"
  );
}

// ============================================================================
// DATA SPAREPART - 120 items (diperbanyak)
// ============================================================================

const sparepartData = [
  // REM & KAMPAS (10)
  {
    name: "Kampas Rem Depan Vespa Sprint 150",
    description:
      "Kampas rem depan original Piaggio untuk Vespa Sprint 150. Material semi-metallic, ketahanan panas tinggi.",
  },
  {
    name: "Kampas Rem Belakang Vespa Primavera",
    description:
      "Kampas rem belakang OEM Vespa Primavera 150. Performa pengereman optimal di berbagai kondisi.",
  },
  {
    name: "Kampas Rem Depan Racing Malossi",
    description:
      "Kampas rem racing Malossi MHR. Material sintered metal, cocok untuk racing dan harian.",
  },
  {
    name: "Kampas Rem Belakang Racing Malossi",
    description:
      "Kampas rem belakang Malossi MHR. Gesekan maksimal, tahan fading di suhu tinggi.",
  },
  {
    name: "Kampas Rem Depan Brembo SA",
    description:
      "Kampas rem depan Brembo SA series. Kualitas premium Italia untuk Vespa GTS/Sprint.",
  },
  {
    name: "Kampas Rem Belakang Brembo SP",
    description:
      "Kampas rem belakang Brembo SP. Performa superior, minim brake dust.",
  },
  {
    name: "Kampas Rem Depan EBC Double-H",
    description:
      "Kampas rem depan EBC Double-H sintered. Untuk racing dan touring jarak jauh.",
  },
  {
    name: "Kampas Rem Belakang EBC Kevlar",
    description:
      "Kampas rem belakang EBC organic kevlar. Halus, tidak bising, ramah disk.",
  },
  {
    name: "Kampas Rem Depan Nissin Racing",
    description:
      "Kampas rem depan Nissin racing compound. Made in Japan, grip maksimal.",
  },
  {
    name: "Kampas Rem Belakang TRW Lucas",
    description:
      "Kampas rem belakang TRW Lucas. Kualitas Eropa, harga terjangkau.",
  },

  // OLI MESIN (15)
  {
    name: "Oli Mesin Motul 5100 10W-40",
    description:
      "Oli mesin Motul 5100 Technosynthese semi-synthetic 10W-40. Untuk Vespa 4-tak.",
  },
  {
    name: "Oli Mesin Motul 7100 10W-40",
    description:
      "Oli mesin Motul 7100 full synthetic 10W-40. Ester technology, performa tinggi.",
  },
  {
    name: "Oli Mesin Motul 300V 15W-50",
    description:
      "Oli racing Motul 300V 15W-50. Ester Core, untuk mesin high performance.",
  },
  {
    name: "Oli Mesin Castrol Power 1 10W-40",
    description:
      "Oli mesin Castrol Power 1 semi-synthetic 10W-40. Akselerasi responsif.",
  },
  {
    name: "Oli Mesin Castrol Edge 5W-40",
    description:
      "Oli mesin Castrol Edge full synthetic 5W-40. Titanium FST, perlindungan maksimal.",
  },
  {
    name: "Oli Mesin Shell Advance Ultra 10W-40",
    description:
      "Oli Shell Advance Ultra full synthetic 10W-40. PurePlus gas-to-liquid technology.",
  },
  {
    name: "Oli Mesin Shell Advance AX7 10W-40",
    description:
      "Oli Shell Advance AX7 semi-synthetic 10W-40. Cocok untuk harian.",
  },
  {
    name: "Oli Mesin Repsol Moto 4T 10W-40",
    description:
      "Oli Repsol Moto 4T full synthetic 10W-40. Formula racing dari MotoGP.",
  },
  {
    name: "Oli Mesin Repsol Racing 10W-50",
    description:
      "Oli Repsol Racing 4T 10W-50. Untuk mesin modifikasi performa tinggi.",
  },
  {
    name: "Oli Mesin Liqui Moly 4T 10W-40",
    description:
      "Oli Liqui Moly 4T 10W-40. Teknologi MoS2 anti-friction buatan Jerman.",
  },
  {
    name: "Oli Mesin Yamalube 4T 10W-40",
    description: "Oli Yamalube 4T semi-synthetic 10W-40. Kualitas OEM Yamaha.",
  },
  {
    name: "Oli Mesin AHM MPX2 10W-30",
    description: "Oli AHM MPX2 10W-30. Untuk motor matic Honda harian.",
  },
  {
    name: "Oli Mesin Top 1 Action Matic",
    description: "Oli Top 1 Action Matic 10W-30. Formula khusus motor matic.",
  },
  {
    name: "Oli Mesin Federal Matic 10W-30",
    description: "Oli Federal Matic 10W-30. Ekonomis, cocok untuk harian.",
  },
  {
    name: "Oli Mesin Motul Scooter Expert 5W-40",
    description:
      "Oli Motul Scooter Expert LE 5W-40. Khusus skuter matic Vespa.",
  },

  // OLI GARDAN & TRANSMISI (6)
  {
    name: "Oli Gardan Motul 80W-90",
    description:
      "Oli gardan Motul 80W-90 mineral. Pelumasan optimal untuk gardan Vespa matic.",
  },
  {
    name: "Oli Gardan Castrol 80W-90",
    description: "Oli gardan Castrol 80W-90. Anti-wear protection, tahan lama.",
  },
  {
    name: "Oli Gardan Top 1 80W-90",
    description:
      "Oli gardan Top 1 80W-90. Formulasi khusus gardan motor matic.",
  },
  {
    name: "Oli Transmisi Vespa PX SAE 30",
    description:
      "Oli transmisi Vespa PX SAE 30 original. Untuk gear box Vespa klasik.",
  },
  {
    name: "Oli Transmisi Racing 75W-140",
    description:
      "Oli transmisi racing full synthetic 75W-140. Tahan beban berat.",
  },
  {
    name: "Oli Gardan AHM 80W-90",
    description:
      "Oli gardan AHM 80W-90 original Honda. Untuk motor matic Honda.",
  },

  // BUSI (10)
  {
    name: "Busi NGK Iridium CR8EIX-9",
    description:
      "Busi NGK Iridium IX CR8EIX-9. 0.6mm electrode, performa racing.",
  },
  {
    name: "Busi NGK G-Power CR8EGP",
    description:
      "Busi NGK G-Power Platinum CR8EGP. Durabilitas tinggi, akselerasi responsif.",
  },
  {
    name: "Busi NGK Standar CR8E",
    description: "Busi NGK standar CR8E. Kualitas OEM, cocok untuk harian.",
  },
  {
    name: "Busi Denso Iridium IU24",
    description:
      "Busi Denso Iridium Power IU24. 0.4mm center electrode, ignitability superior.",
  },
  {
    name: "Busi Denso Platinum PK20PR-P8",
    description:
      "Busi Denso Platinum PK20PR-P8. Long life, 60.000 km durability.",
  },
  {
    name: "Busi Denso Standar U24ESR-N",
    description: "Busi Denso standar U24ESR-N. Kualitas OEM Japan.",
  },
  {
    name: "Busi Champion Iridium 9401",
    description: "Busi Champion Iridium 9401. Performa racing, multi-spark.",
  },
  {
    name: "Busi Splitfire Triple Platinum",
    description:
      "Busi Splitfire Triple Platinum. Teknologi multi-spark, akselerasi cepat.",
  },
  {
    name: "Busi NGK Racing CR10EIX-9",
    description:
      "Busi NGK Iridium Racing CR10EIX-9. Cold type untuk mesin bore up.",
  },
  {
    name: "Busi Bosch Super Plus",
    description:
      "Busi Bosch Super Plus YR7DE. Kualitas Jerman, harga terjangkau.",
  },

  // FILTER (12)
  {
    name: "Filter Udara Malossi Red Sponge",
    description:
      "Filter udara racing Malossi Red Sponge. Washable, high airflow.",
  },
  {
    name: "Filter Udara Original Vespa",
    description:
      "Filter udara original Piaggio Vespa. Kualitas OEM, filtrasi optimal.",
  },
  {
    name: "Filter Udara K&N High Flow",
    description:
      "Filter udara K&N high flow. Reusable lifetime, washable cotton.",
  },
  {
    name: "Filter Udara BMC Race",
    description: "Filter udara BMC race. Cotton gauze material, made in Italy.",
  },
  {
    name: "Filter Udara DNA High Performance",
    description: "Filter udara DNA high performance. Italian design, washable.",
  },
  {
    name: "Filter Oli Vespa Matic Original",
    description: "Filter oli Vespa matic original Piaggio. Filtrasi maksimal.",
  },
  {
    name: "Filter Oli Racing Malossi",
    description:
      "Filter oli racing Malossi. High flow rate, untuk mesin bore up.",
  },
  {
    name: "Filter Bensin Vespa Mesh",
    description:
      "Filter bensin Vespa mesh stainless steel. Tahan karat, reusable.",
  },
  {
    name: "Filter Bensin Racing High Flow",
    description:
      "Filter bensin racing high flow 40 micron. Aliran bensin maksimal.",
  },
  {
    name: "Filter CVT Vespa Matic",
    description: "Filter CVT Vespa matic. Mencegah debu masuk ke ruang CVT.",
  },
  {
    name: "Filter Udara Polini Conical",
    description:
      "Filter udara Polini conical. Bentuk kerucut, airflow maksimal.",
  },
  {
    name: "Filter Oli HiFlo Filtro",
    description: "Filter oli HiFlo Filtro HF183. Kualitas aftermarket premium.",
  },

  // RANTAI & GEAR (8)
  {
    name: "Rantai Keteng Vespa PX DID",
    description:
      "Rantai keteng Vespa PX 150 original DID Japan. Kualitas premium.",
  },
  {
    name: "Rantai Keteng Vespa Sprint OEM",
    description: "Rantai keteng Vespa Sprint 150 OEM quality. Made in Japan.",
  },
  {
    name: "Rantai Keteng Racing DID Gold",
    description: "Rantai keteng racing DID gold series. Untuk mesin bore up.",
  },
  {
    name: "Rantai Keteng Racing RK Takasago",
    description: "Rantai keteng racing RK Takasago Japan. Kekuatan maksimal.",
  },
  {
    name: "Gear Set Rasio 3.8 Standar",
    description:
      "Gear set rasio 3.8 standar Vespa. OEM quality, akselerasi normal.",
  },
  {
    name: "Gear Set Rasio 4.0 Racing",
    description: "Gear set rasio 4.0 racing. Akselerasi cepat untuk harian.",
  },
  {
    name: "Gear Set Rasio 4.2 Drag",
    description: "Gear set rasio 4.2 untuk drag race. Akselerasi brutal.",
  },
  {
    name: "Gear Set Rasio 3.5 Touring",
    description: "Gear set rasio 3.5 untuk top speed maksimal. Cocok touring.",
  },

  // BAN (15)
  {
    name: "Ban Pirelli Angel Scooter 110/70-12",
    description:
      "Ban Pirelli Angel Scooter 110/70-12. Multi-compound, wet grip optimal.",
  },
  {
    name: "Ban Pirelli Angel Scooter 120/70-12",
    description:
      "Ban Pirelli Angel Scooter 120/70-12. Pattern bi-compound, touring.",
  },
  {
    name: "Ban Pirelli Diablo Rosso 130/70-12",
    description:
      "Ban Pirelli Diablo Rosso Scooter 130/70-12. Sport performance.",
  },
  {
    name: "Ban Michelin City Grip 120/70-12",
    description:
      "Ban Michelin City Grip 120/70-12. Silica compound, anti-aquaplaning.",
  },
  {
    name: "Ban Michelin City Grip 130/70-12",
    description:
      "Ban Michelin City Grip 130/70-12. Durabilitas tinggi, grip basah.",
  },
  {
    name: "Ban Michelin Pilot Street 110/70-12",
    description: "Ban Michelin Pilot Street 110/70-12. Commuting harian, irit.",
  },
  {
    name: "Ban Metzeler Sportec 130/70-12",
    description: "Ban Metzeler Sportec Street 130/70-12. Sport touring Jerman.",
  },
  {
    name: "Ban Metzeler Feelfree 120/70-12",
    description: "Ban Metzeler Feelfree 120/70-12. Wet grip superior, nyaman.",
  },
  {
    name: "Ban Maxxis Diamond 110/70-12",
    description:
      "Ban Maxxis Diamond 110/70-12. Budget friendly, durabilitas baik.",
  },
  {
    name: "Ban IRC Eagle Grip 120/70-12",
    description: "Ban IRC Eagle Grip 120/70-12. Made in Japan, tahan lama.",
  },
  {
    name: "Ban IRC Urban Master 130/70-12",
    description: "Ban IRC Urban Master 130/70-12. Desain agresif, grip kering.",
  },
  {
    name: "Ban Dalam Vespa 10 Inch Premium",
    description: "Ban dalam Vespa 10 inch. Karet butyl premium, anti bocor.",
  },
  {
    name: "Ban Dalam Vespa 12 Inch HD",
    description: "Ban dalam Vespa 12 inch. Karet heavy duty, lebih tebal.",
  },
  {
    name: "Ban Swallow X-Worm 110/70-12",
    description: "Ban Swallow X-Worm 110/70-12. Thailand, value for money.",
  },
  {
    name: "Ban FDR Genzi Pro 120/70-12",
    description: "Ban FDR Genzi Pro 120/70-12. Produk lokal, grip baik.",
  },

  // AKI (7)
  {
    name: "Aki Kering MotoBatt MBTZ10S",
    description:
      "Aki kering MotoBatt MBTZ10S. AGM technology, maintenance free.",
  },
  {
    name: "Aki Kering Yuasa YTZ7S",
    description: "Aki kering Yuasa YTZ7S original Japan. Cranking power besar.",
  },
  {
    name: "Aki Kering Yuasa YTZ10S",
    description: "Aki kering Yuasa YTZ10S. Untuk Vespa GTS 300.",
  },
  {
    name: "Aki Kering GS Astra MF 12V",
    description:
      "Aki kering GS Astra MF 12V 6Ah. Buatan Indonesia, harga terjangkau.",
  },
  {
    name: "Aki Basah Yuasa YB9B",
    description: "Aki basah Yuasa YB9B. Untuk Vespa klasik PX/Sprint lama.",
  },
  {
    name: "Aki Lithium Shido LTZ10S",
    description: "Aki lithium Shido LTZ10S. Bobot ringan, umur panjang.",
  },
  {
    name: "Aki Kering Incoe MF 12V",
    description: "Aki kering Incoe MF 12V 5Ah. Ekonomis, garansi 6 bulan.",
  },

  // LAMPU (10)
  {
    name: "Lampu Depan LED Proyektor Vespa",
    description: "Lampu depan LED proyektor. Cut-off jelas, plug and play.",
  },
  {
    name: "Lampu Depan Bi-LED Projector",
    description: "Lampu depan Bi-LED projector. High-low beam dalam satu unit.",
  },
  {
    name: "Lampu Belakang LED Vespa GTS Custom",
    description: "Lampu belakang LED custom Vespa GTS. Plug and play.",
  },
  {
    name: "Lampu Belakang LED Smoked Lens",
    description: "Lampu belakang LED smoked lens. Tampilan gelap elegan.",
  },
  {
    name: "Lampu Sein LED Sequential",
    description: "Lampu sein LED sequential flowing. Efek mengalir.",
  },
  {
    name: "Lampu Sein LED Smoke Universal",
    description: "Lampu sein LED smoked universal Vespa. Tahan air.",
  },
  {
    name: "Lampu DRL LED Strip Flexible",
    description: "Lampu DRL LED strip flexible. Daytime running light, 12V.",
  },
  {
    name: "Lampu Kabut LED Mini Proyektor",
    description:
      "Lampu kabut LED mini proyektor. Tahan air, bracket universal.",
  },
  {
    name: "Lampu Depan LED H4 6500K",
    description:
      "Lampu LED H4 6500K putih terang. Cocok untuk reflector standar.",
  },
  {
    name: "Lampu Hazard LED Kit",
    description: "Kit lampu hazard LED. Termasuk relay dan switch.",
  },

  // KOPLING & CVT (10)
  {
    name: "Kampas Kopling Malossi Fly Clutch",
    description:
      "Kampas kopling racing Malossi Fly Clutch. Akselerasi responsif.",
  },
  {
    name: "Kampas Kopling Polini Speed Clutch",
    description: "Kampas kopling Polini Speed Clutch. 3 arm system.",
  },
  {
    name: "Kampas Kopling Standar Vespa OEM",
    description: "Kampas kopling standar Vespa OEM. Kualitas original Piaggio.",
  },
  {
    name: "Kampas Kopling Racing Kevlar",
    description: "Kampas kopling kevlar racing. Tahan panas, tidak slip.",
  },
  {
    name: "Per CVT Racing Malossi Kuning",
    description: "Per CVT racing Malossi kuning. 1500 RPM, akselerasi cepat.",
  },
  {
    name: "Per CVT Racing Polini Biru",
    description: "Per CVT racing Polini biru. 2000 RPM, untuk racing.",
  },
  {
    name: "Roller CVT Malossi 10gr",
    description: "Roller CVT Malossi 10 gram. Set 6 pcs, akselerasi ringan.",
  },
  {
    name: "Roller CVT Malossi 12gr",
    description: "Roller CVT Malossi 12 gram. Balanced untuk harian.",
  },
  {
    name: "Roller CVT Polini 9gr",
    description: "Roller CVT Polini 9 gram. Racing, putaran atas cepat.",
  },
  {
    name: "Roller CVT Dr Pulley 11gr",
    description: "Roller CVT Dr Pulley Sliding 11 gram. Minim gesekan.",
  },

  // SHOCKBREAKER (10)
  {
    name: "Shockbreaker Depan Bitubo Adjustable",
    description: "Shockbreaker depan Bitubo fully adjustable. Made in Italy.",
  },
  {
    name: "Shockbreaker Belakang Ohlins HO 142",
    description: "Shockbreaker belakang Ohlins HO 142. Piggyback reservoir.",
  },
  {
    name: "Shockbreaker Depan YSS Racing Series",
    description:
      "Shockbreaker depan YSS Racing Series. Gas, adjustable preload.",
  },
  {
    name: "Shockbreaker Belakang YSS G-Series",
    description: "Shockbreaker belakang YSS G-Series. Tabung gas, adjustable.",
  },
  {
    name: "Shockbreaker Depan KYB Excel-G",
    description: "Shockbreaker depan KYB Excel-G. OEM replacement, nyaman.",
  },
  {
    name: "Shockbreaker Belakang KYB Gas-A-Just",
    description: "Shockbreaker belakang KYB Gas-A-Just. Monotube.",
  },
  {
    name: "Shockbreaker Depan KTC Racing",
    description: "Shockbreaker depan KTC Racing. Preload adjustable.",
  },
  {
    name: "Shockbreaker Belakang KTC Racing",
    description: "Shockbreaker belakang KTC Racing. Tabung gas eksternal.",
  },
  {
    name: "Shockbreaker Depan Ohlins FGRT",
    description: "Shockbreaker depan Ohlins FGRT. Fully adjustable, racing.",
  },
  {
    name: "Shockbreaker Belakang Bitubo Twin",
    description: "Shockbreaker belakang Bitubo Twin. Adjustable damping.",
  },

  // BEARING (7)
  {
    name: "Bearing Roda Depan SKF Explorer",
    description: "Bearing roda depan SKF Explorer Series. Made in Sweden.",
  },
  {
    name: "Bearing Roda Belakang NTN Japan",
    description: "Bearing roda belakang NTN original Japan.",
  },
  {
    name: "Bearing Steering Koyo Tapered",
    description: "Bearing steering Koyo tapered roller. Set atas-bawah.",
  },
  {
    name: "Bearing Roda Depan NSK Precision",
    description: "Bearing roda depan NSK Japan. Precision grade ABEC-5.",
  },
  {
    name: "Bearing Roda Belakang FAG Germany",
    description: "Bearing roda belakang FAG Germany. Kualitas premium.",
  },
  {
    name: "Bearing CVT Vespa Matic",
    description: "Bearing CVT Vespa matic. Needle bearing 20x29x18.",
  },
  {
    name: "Bearing Kruk As NTN",
    description: "Bearing kruk as NTN Japan. Untuk Vespa 2-tak.",
  },

  // KABEL (6)
  {
    name: "Kabel Gas Domino Quick Action",
    description: "Kabel gas Domino Racing Quick Action. Response cepat.",
  },
  {
    name: "Kabel Rem Depan Vespa Original",
    description: "Kabel rem depan Vespa original Piaggio. Panjang standar.",
  },
  {
    name: "Kabel Kopling Vespa PX 150",
    description: "Kabel kopling Vespa PX 150 original. Kualitas OEM.",
  },
  {
    name: "Kabel Spedometer Vespa",
    description: "Kabel spedometer Vespa original. Akurat, tahan lama.",
  },
  {
    name: "Kabel Choke Vespa 2T",
    description: "Kabel choke Vespa 2-tak. Kualitas OEM, gerakan halus.",
  },
  {
    name: "Kabel Gas Racing Venhill",
    description: "Kabel gas racing Venhill. Teflon lined, made in UK.",
  },

  // PISTON (7)
  {
    name: "Piston Kit Polini 200cc Forged",
    description: "Piston kit Polini 200cc forged racing. Kompresi tinggi.",
  },
  {
    name: "Piston Kit Malossi 175cc Cast",
    description: "Piston kit Malossi 175cc cast performance. Bore up standar.",
  },
  {
    name: "Piston Kit Standar Vespa 150cc",
    description: "Piston kit standar Vespa 150cc OEM. Kualitas original.",
  },
  {
    name: "Piston Kit 62mm Racing Forged",
    description: "Piston kit 62mm racing. Forged aluminium, ringan.",
  },
  {
    name: "Piston Kit 63mm Touring Cast",
    description: "Piston kit 63mm touring. Cast piston, durabilitas tinggi.",
  },
  {
    name: "Piston Kit 65mm Drag High Comp",
    description: "Piston kit 65mm drag race. High compression, dome piston.",
  },
  {
    name: "Piston Kit Athena 170cc",
    description: "Piston kit Athena 170cc. Made in Italy, racing.",
  },

  // KNALPOT (7)
  {
    name: "Knalpot Akrapovic Racing Line",
    description:
      "Knalpot Akrapovic Racing Line titanium. Suara bass, performa.",
  },
  {
    name: "Knalpot Yoshimura Tri-Oval",
    description: "Knalpot Yoshimura Tri-Oval stainless. Khas Yoshimura.",
  },
  {
    name: "Knalpot Leo Vince GP Corsa",
    description: "Knalpot Leo Vince GP Corsa. Carbon end cap, ringan.",
  },
  {
    name: "Knalpot R9 Racing Gen 5",
    description: "Knalpot R9 Racing Generation 5. Stainless, suara racing.",
  },
  {
    name: "Knalpot SC Project CR-T",
    description: "Knalpot SC Project CR-T. MotoGP style, titanium.",
  },
  {
    name: "Knalpot Arrow Pro-Race",
    description: "Knalpot Arrow Pro-Race. Titanium, homologated.",
  },
  {
    name: "Knalpot Nobi 3 Bold",
    description: "Knalpot Nobi 3 Bold. Produk lokal, kualitas racing.",
  },

  // CDI (5)
  {
    name: "CDI Racing BRT Powermax",
    description: "CDI racing BRT Powermax dual band. Plug and play.",
  },
  {
    name: "CDI Racing Rextor Programmable",
    description: "CDI racing Rextor adjustable. 5 maps, USB programmable.",
  },
  {
    name: "CDI Standar Vespa Original",
    description: "CDI standar Vespa original Piaggio. Kualitas OEM.",
  },
  {
    name: "CDI Racing TDR",
    description: "CDI racing TDR. Limiter 14.000 RPM, timing advance.",
  },
  {
    name: "CDI Racing BRT I-Max",
    description: "CDI racing BRT I-Max. Smart chip, auto mapping.",
  },

  // PAKING & SEAL (5)
  {
    name: "Paking Mesin Set Vespa PX 150",
    description: "Paking mesin set Vespa PX 150 lengkap. 12 pcs.",
  },
  {
    name: "Paking Mesin Set Vespa Sprint 150",
    description: "Paking mesin set Vespa Sprint 150. OEM quality.",
  },
  {
    name: "Seal Mesin Vespa 2T Full Set",
    description: "Seal mesin full set Vespa 2-tak. 8 pcs, oil seal.",
  },
  {
    name: "Seal Mesin Vespa 4T Full Set",
    description: "Seal mesin full set Vespa 4-tak. 10 pcs.",
  },
  {
    name: "Seal Shockbreaker Vespa Set",
    description: "Seal shockbreaker Vespa set. Depan-belakang.",
  },

  // BELT CVT (4)
  {
    name: "Belt CVT Vespa Racing Reinforced",
    description: "Belt CVT racing reinforced. Aramid fiber, tahan panas.",
  },
  {
    name: "Belt CVT Vespa Standar OEM",
    description: "Belt CVT standar Vespa. Kualitas OEM Piaggio.",
  },
  {
    name: "Belt CVT Malossi Kevlar",
    description: "Belt CVT Malossi Kevlar. Untuk mesin bore up.",
  },
  {
    name: "Belt CVT Polini Performance",
    description: "Belt CVT Polini Performance. Made in Italy.",
  },
];

const serviceData = [
  // SERVICE RINGAN (10)
  {
    name: "Service Ringan Vespa Matic",
    description:
      "Ganti oli mesin, bersihkan filter udara, cek CVT, cek rem, cek kelistrikan, cek ban. Estimasi 1-2 jam.",
  },
  {
    name: "Service Ringan Vespa 2-Tak",
    description:
      "Ganti oli samping, bersihkan karburator, setel platina, bersihkan busi, cek kompresi. Estimasi 1-1.5 jam.",
  },
  {
    name: "Service Ringan Vespa 4-Tak",
    description:
      "Ganti oli, bersihkan throttle body, cek valve clearance, cek sistem injeksi, reset ECU. Estimasi 1.5-2 jam.",
  },
  {
    name: "Service Ringan Motor Matic Non-Vespa",
    description:
      "Service ringan untuk motor matic Honda/Yamaha/Suzuki. Ganti oli, cek CVT, cek rem.",
  },
  {
    name: "Service Ringan Motor Bebek",
    description:
      "Service ringan motor bebek 4-tak. Ganti oli, bersihkan karburator, setel rantai.",
  },
  {
    name: "Service Ringan Motor Sport",
    description:
      "Service ringan motor sport 150cc-250cc. Ganti oli, cek rantai, cek busi.",
  },
  {
    name: "Service Express 30 Menit",
    description:
      "Service express: ganti oli + cek cepat. 30 menit selesai. Khusus hari kerja.",
  },
  {
    name: "Service Malam (Extra Charge)",
    description: "Service malam hari di atas jam 8 malam. Extra charge 25%.",
  },
  {
    name: "Service Weekend (Sabtu-Minggu)",
    description: "Service khusus weekend. Tetap buka, antrian lebih panjang.",
  },
  {
    name: "Service Ringan + Cuci Motor",
    description: "Paket service ringan + cuci motor biasa. Hemat waktu.",
  },

  // TUNE UP (8)
  {
    name: "Tune Up Mesin 2-Tak",
    description:
      "Setel karburator, timing ignition, bersihkan exhaust port, cek reed valve, cek kompresi.",
  },
  {
    name: "Tune Up Mesin 4-Tak",
    description:
      "Setel valve clearance, bersihkan injector, reset ECU, cek sensor O2, cek MAP sensor.",
  },
  {
    name: "Tune Up Racing Performance",
    description:
      "Dyno test, setting karburator/injeksi, timing adjustment, AFR tuning wideband.",
  },
  {
    name: "Tune Up Irit BBM",
    description:
      "Setting mesin untuk efisiensi BBM maksimal. Target irit 10-15%.",
  },
  {
    name: "Tune Up Touring",
    description:
      "Setting mesin untuk touring jarak jauh. Fokus reliability dan kenyamanan.",
  },
  {
    name: "Dyno Test Only",
    description: "Tes dyno saja tanpa tuning. Printout grafik HP dan torsi.",
  },
  {
    name: "Tune Up + Dyno Test",
    description:
      "Paket tune up lengkap + dyno test. Include printout before-after.",
  },
  {
    name: "Carb Sync & Balance",
    description:
      "Sinkronisasi karburator multi-silinder. Gunakan vacuum gauge.",
  },

  // GANTI OLI (6)
  {
    name: "Ganti Oli Mesin + Gardan",
    description: "Paket ganti oli mesin + gardan. Oli full synthetic pilihan.",
  },
  {
    name: "Ganti Oli Mesin Full Synthetic",
    description:
      "Ganti oli full synthetic premium. Pilihan Motul/Castrol/Shell.",
  },
  {
    name: "Ganti Oli Mesin Racing",
    description: "Ganti oli racing Motul 300V. Untuk mesin high performance.",
  },
  {
    name: "Ganti Oli Mesin Semi-Synthetic",
    description:
      "Ganti oli semi-synthetic. Seimbang antara performa dan harga.",
  },
  {
    name: "Ganti Oli Gardan Only",
    description: "Ganti oli gardan saja. SAE 80W-90, semua merek.",
  },
  {
    name: "Flush & Ganti Oli Mesin",
    description:
      "Engine flush + ganti oli baru. Membersihkan kerak dan endapan.",
  },

  // CUCI & DETAILING (8)
  {
    name: "Cuci Motor Detailing Premium",
    description:
      "Foam wash, kuas detail, poles body, coating wax, bersihkan mesin, semir ban. 2-3 jam.",
  },
  {
    name: "Cuci Motor Biasa",
    description:
      "Semprot air, foam wash, bilas, keringkan, semir ban. 15-20 menit.",
  },
  {
    name: "Cuci Motor + Poles Body",
    description:
      "Cuci + poles body. Hilangkan swirl marks dan baret halus. 1-2 jam.",
  },
  {
    name: "Cuci Mesin Motor",
    description:
      "Pembersihan mesin dengan chemical khusus. Bebas oli dan kotoran membandel.",
  },
  {
    name: "Cuci Rantai & Gear",
    description:
      "Pembersihan rantai dan gear set. Termasuk pelumasan ulang dengan chain lube.",
  },
  {
    name: "Coating Nano Ceramic 9H",
    description:
      "Coating nano ceramic 9H. Proteksi cat 2-3 tahun. Include detailing.",
  },
  {
    name: "Coating Glass 5H",
    description: "Coating glass 5H. Proteksi 1 tahun. Harga lebih terjangkau.",
  },
  {
    name: "Detailing Interior & Bagasi",
    description: "Pembersihan detail interior, bagasi, dan helm in box.",
  },

  // OVERHAUL (8)
  {
    name: "Overhaul Mesin 2-Tak Full",
    description:
      "Turun mesin, ganti piston, boring, ganti seal & bearing, setel ulang. 3-7 hari.",
  },
  {
    name: "Overhaul Mesin 4-Tak Full",
    description:
      "Turun mesin, ganti ring piston, skir klep, ganti seal klep, gasket set. 3-7 hari.",
  },
  {
    name: "Overhaul Mesin Racing Bore Up",
    description:
      "Bore up, porting polish, piston forged, camshaft racing, ECU tuning. 1-2 minggu.",
  },
  {
    name: "Overhaul Suspensi Depan",
    description:
      "Ganti seal, ganti oli, bersihkan tabung, cek bushing. 2-3 jam.",
  },
  {
    name: "Overhaul CVT Full",
    description:
      "Bongkar total CVT, ganti belt, roller, per, bersihkan torque driver. 1.5-2 jam.",
  },
  {
    name: "Overhaul Karburator Ultrasonic",
    description:
      "Bongkar, bersihkan ultrasonic, ganti jet, setel AFR. 1-2 jam.",
  },
  {
    name: "Overhaul Rem Full System",
    description:
      "Bongkar kaliper, ganti seal, bersihkan piston, ganti minyak rem, bleeding. 2-3 jam.",
  },
  {
    name: "Overhaul Transmisi Manual",
    description:
      "Bongkar gear box, ganti bearing, ganti seal, ganti oli transmisi.",
  },

  // BAN (6)
  {
    name: "Tambal Ban Tubeless Mushroom",
    description:
      "Tambal ban tubeless metode mushroom plug dari dalam. Aman & permanen.",
  },
  {
    name: "Tambal Ban Biasa Patch Dingin",
    description: "Tambal ban tube type dengan patch dingin. 15 menit.",
  },
  {
    name: "Ganti Ban Baru + Balancing",
    description:
      "Paket ganti ban baru + balancing digital. Pilihan Pirelli/Michelin/Metzeler.",
  },
  {
    name: "Balancing & Spooring Roda",
    description: "Balancing digital + spooring. Hilangkan getaran setang.",
  },
  {
    name: "Ganti Ban Dalam Only",
    description: "Ganti ban dalam saja. Karet butyl premium, anti bocor.",
  },
  {
    name: "Tukar Ban Depan-Belakang",
    description:
      "Rotasi ban depan ke belakang dan sebaliknya. Include balancing.",
  },

  // PERFORMANCE (8)
  {
    name: "Bore Up Mesin 175cc",
    description: "Bore up 150cc ke 175cc. Piston kit Malossi, include porting.",
  },
  {
    name: "Bore Up Mesin 200cc Racing",
    description:
      "Bore up ekstrem ke 200cc. Piston Polini forged. CNC porting. 1-2 minggu.",
  },
  {
    name: "Setting Karburator Racing",
    description:
      "Ganti jet, setel pelampung, jarum skep, fine tuning AFR wideband.",
  },
  {
    name: "Setting ECU Racing Rexxer",
    description:
      "Remapping ECU Rexxer Pro. Fuel map, ignition, rev limiter, fan temp.",
  },
  {
    name: "Pemasangan Knalpot Racing",
    description:
      "Jasa pemasangan knalpot aftermarket. Include setting ulang AFR.",
  },
  {
    name: "Pemasangan CDI Racing",
    description: "Pemasangan CDI racing plug and play. Include timing setting.",
  },
  {
    name: "Pemasangan Shockbreaker Racing",
    description:
      "Pemasangan shockbreaker aftermarket. Include setting preload.",
  },
  {
    name: "Pemasangan Big Brake Kit",
    description:
      "Pemasangan big brake kit. Include bracket, kaliper, master rem.",
  },

  // MODIFIKASI (4)
  {
    name: "Pengecatan Body Vespa Full",
    description:
      "Cat full set. Epoxy primer, cat warna, clear coat, compounding. 1-2 minggu.",
  },
  {
    name: "Modifikasi Custom Vespa",
    description:
      "Jasa modifikasi custom: classic, cafe racer, scrambler, modern.",
  },
  {
    name: "Restorasi Vespa Klasik Full",
    description:
      "Restorasi Vespa klasik full atau partial. Body, mesin, kaki-kaki.",
  },
  {
    name: "Custom Airbrush & Sticker",
    description: "Custom airbrush body atau helm. Desain bebas request.",
  },

  // SERVICE KHUSUS (10)
  {
    name: "Service CVT & Pulley",
    description:
      "Bersihkan total CVT, ganti roller, cek belt, pelumasan moving part. 1-2 jam.",
  },
  {
    name: "Service Karburator Ultrasonic",
    description:
      "Bongkar, bersihkan ultrasonic, ganti jet, setel AFR, sinkronisasi.",
  },
  {
    name: "Service Injeksi Vespa",
    description:
      "Bersihkan injector ultrasonic, throttle body, reset TPS, cek fuel pump.",
  },
  {
    name: "Ganti Kampas Rem Full Set",
    description:
      "Ganti kampas rem depan-belakang + bersihkan kaliper + bleeding.",
  },
  {
    name: "Service AC Motor",
    description:
      "Service AC motor. Isi freon, bersihkan kondensor, cek kompresor.",
  },
  {
    name: "Service Speedometer",
    description:
      "Perbaikan speedometer digital/analog. Ganti gear, kabel, atau sensor.",
  },
  {
    name: "Service Kelistrikan",
    description:
      "Troubleshooting kelistrikan: kabel, sekring, relay, saklar, konektor.",
  },
  {
    name: "Service Starter Motor",
    description:
      "Service dinamo starter. Ganti brush, bersihkan komutator, tes.",
  },
  {
    name: "Service Spull & Kiprok",
    description: "Ganti spull pengisian, cek kiprok, tes output charging.",
  },
  {
    name: "Service Fuel Pump",
    description: "Cek tekanan fuel pump, bersihkan filter, ganti jika rusak.",
  },

  // PASANG AKSESORIS (7)
  {
    name: "Ganti Spion",
    description:
      "Jasa ganti spion. Berbagai model tersedia (oval, bar end, lipat).",
  },
  {
    name: "Pasang Cover Jok Custom",
    description:
      "Pemasangan cover jok custom. Bahan pilihan (MBTech, synthetic leather).",
  },
  {
    name: "Pasang Windshield",
    description:
      "Pemasangan windshield Vespa. Berbagai ukuran (pendek, sedang, tinggi).",
  },
  {
    name: "Pasang Hand Grip",
    description: "Pemasangan hand grip racing. Bahan karet/CNC aluminium.",
  },
  {
    name: "Pasang Floor Mat",
    description: "Pemasangan floor mat Vespa. Anti slip, presisi.",
  },
  {
    name: "Pasang Alarm Motor",
    description:
      "Pemasangan alarm motor. Include sensor getar, remote, sirine.",
  },
  {
    name: "Pasang Phone Mount",
    description: "Pemasangan phone mount. Gagdet mount dengan charging port.",
  },
];

// ============================================================================
// PATTERN SEEDS
// ============================================================================

const sparepartCategories = {};
sparepartData.forEach((sp, i) => {
  const sku = generateSku("SPAREPART", i);
  const name = sp.name.toLowerCase();
  if (name.includes("kampas rem")) sparepartCategories[sku] = "REM";
  else if (name.includes("oli mesin")) sparepartCategories[sku] = "OLI_MESIN";
  else if (name.includes("oli gardan") || name.includes("oli transmisi"))
    sparepartCategories[sku] = "OLI_GARDAN";
  else if (name.includes("busi")) sparepartCategories[sku] = "BUSI";
  else if (name.includes("filter")) sparepartCategories[sku] = "FILTER";
  else if (name.includes("rantai") || name.includes("gear"))
    sparepartCategories[sku] = "RANTAI";
  else if (name.includes("ban dalam")) sparepartCategories[sku] = "BAN_DALAM";
  else if (name.includes("ban ")) sparepartCategories[sku] = "BAN";
  else if (name.includes("aki")) sparepartCategories[sku] = "AKI";
  else if (name.includes("lampu")) sparepartCategories[sku] = "LAMPU";
  else if (name.includes("kampas kopling") || name.includes("per cvt"))
    sparepartCategories[sku] = "KOPLING";
  else if (name.includes("roller")) sparepartCategories[sku] = "ROLLER";
  else if (name.includes("belt cvt")) sparepartCategories[sku] = "BELT_CVT";
  else if (name.includes("shockbreaker"))
    sparepartCategories[sku] = "SHOCKBREAKER";
  else if (name.includes("bearing")) sparepartCategories[sku] = "BEARING";
  else if (name.includes("kabel")) sparepartCategories[sku] = "KABEL";
  else if (name.includes("piston")) sparepartCategories[sku] = "PISTON";
  else if (
    name.includes("spion") ||
    name.includes("hand grip") ||
    name.includes("cover jok")
  )
    sparepartCategories[sku] = "AKSESORIS";
  else if (name.includes("knalpot")) sparepartCategories[sku] = "KNALPOT";
  else if (name.includes("cdi")) sparepartCategories[sku] = "CDI";
  else if (name.includes("paking") || name.includes("seal"))
    sparepartCategories[sku] = "SEAL";
  else if (name.includes("per cvt")) sparepartCategories[sku] = "PER_CVT";
});

const servicePatterns = {
  serviceRingan: {
    trigger: (name) =>
      name.toLowerCase().includes("service ringan") ||
      name.toLowerCase().includes("service express"),
    addonServiceChance: 0.25,
    addonServices: [
      "Ganti Oli Mesin Full Synthetic",
      "Ganti Oli Mesin + Gardan",
      "Ganti Oli Mesin Semi-Synthetic",
    ],
    sparepartChance: 0.35,
    sparepartTypes: ["OLI_MESIN", "BUSI", "FILTER"],
  },
  overhaul: {
    trigger: (name) => name.toLowerCase().includes("overhaul"),
    addonServiceChance: 0.15,
    addonServices: ["Ganti Oli Mesin Racing", "Service CVT & Pulley"],
    sparepartChance: 0.8,
    sparepartTypes: ["PISTON", "PAKING", "BEARING", "SEAL", "OLI_MESIN"],
  },
  gantiBan: {
    trigger: (name) => name.toLowerCase().includes("ganti ban"),
    addonServiceChance: 0.6,
    addonServices: ["Balancing & Spooring Roda"],
    sparepartChance: 0.3,
    sparepartTypes: ["BAN_DALAM", "BAN"],
  },
  boreUp: {
    trigger: (name) => name.toLowerCase().includes("bore up"),
    addonServiceChance: 0.5,
    addonServices: ["Setting Karburator Racing", "Setting ECU Racing Rexxer"],
    sparepartChance: 0.9,
    sparepartTypes: ["PISTON", "CDI", "KNALPOT", "KOPLING", "CVT"],
  },
  cuciMotor: {
    trigger: (name) =>
      name.toLowerCase().includes("cuci motor") &&
      !name.toLowerCase().includes("detailing"),
    addonServiceChance: 0.25,
    addonServices: ["Cuci Motor + Poles Body", "Coating Nano Ceramic 9H"],
    sparepartChance: 0.1,
    sparepartTypes: ["AKSESORIS"],
  },
  serviceCVT: {
    trigger: (name) => name.toLowerCase().includes("cvt"),
    addonServiceChance: 0.25,
    addonServices: ["Overhaul CVT Full"],
    sparepartChance: 0.65,
    sparepartTypes: ["ROLLER", "BELT_CVT", "PER_CVT", "BEARING"],
  },
  tuneUp: {
    trigger: (name) =>
      name.toLowerCase().includes("tune up") ||
      name.toLowerCase().includes("dyno"),
    addonServiceChance: 0.3,
    addonServices: ["Dyno Test Only", "Carb Sync & Balance"],
    sparepartChance: 0.5,
    sparepartTypes: ["BUSI", "CDI", "FILTER", "OLI_MESIN"],
  },
};

// ============================================================================
// SETTINGS
// ============================================================================

const defaultSettings = [
  { key: "mechanic_max_tasks", value: "5" },
  { key: "shift_min_starting_cash", value: "1000000" },
  { key: "stock_low_threshold", value: "5" },
  { key: "enable_ppn", value: "true" },
  { key: "enable_pph", value: "true" },
  { key: "pph_rate", value: "0.5" },
  { key: "ppn_rate", value: "11" },
  { key: "monthly_revenue_target", value: "50000000" },
  { key: "daily_revenue_target", value: "2000000" },
  { key: "monthly_profit_target", value: "10000000" },
  { key: "yearly_revenue_target", value: "600000000" },
  { key: "monthly_order_target", value: "300" },
  { key: "daily_order_target", value: "15" },
];

// ============================================================================
// USERS - Production-like names
// ============================================================================

const userData = [
  {
    email: ADMIN_EMAIL,
    fullName: "Rifky Fauzan",
    phone: "081298765431",
    role: "ADMIN",
    isActive: true,
    isAuthenticated: true,
  },
  {
    email: "ahmad.fauzi@bengkel.com",
    fullName: "Ahmad Fauzi",
    phone: "081298765432",
    role: "ADMIN",
    isActive: true,
    isAuthenticated: true,
  },
  {
    email: "budi.santoso@bengkel.com",
    fullName: "Budi Santoso",
    phone: "081298765433",
    role: "CASHIER",
    isActive: true,
    isAuthenticated: true,
  },
  {
    email: "siti.nurhaliza@bengkel.com",
    fullName: "Siti Nurhaliza",
    phone: "081298765434",
    role: "CASHIER",
    isActive: true,
    isAuthenticated: true,
  },
  {
    email: "agus.wijaya@bengkel.com",
    fullName: "Agus Wijaya",
    phone: "081298765435",
    role: "CASHIER",
    isActive: true,
    isAuthenticated: true,
  },
  {
    email: "dewi.lestari@bengkel.com",
    fullName: "Dewi Lestari",
    phone: "081298765436",
    role: "CASHIER",
    isActive: true,
    isAuthenticated: true,
  },
  {
    email: "andi.pratama@bengkel.com",
    fullName: "Andi Pratama",
    phone: "081298765437",
    role: "MECHANIC",
    isActive: true,
    isAuthenticated: true,
  },
  {
    email: "rudi.hartono@bengkel.com",
    fullName: "Rudi Hartono",
    phone: "081298765438",
    role: "MECHANIC",
    isActive: true,
    isAuthenticated: true,
  },
  {
    email: "dodi.permana@bengkel.com",
    fullName: "Dodi Permana",
    phone: "081298765439",
    role: "MECHANIC",
    isActive: true,
    isAuthenticated: true,
  },
  {
    email: "hendra.gunawan@bengkel.com",
    fullName: "Hendra Gunawan",
    phone: "081298765440",
    role: "MECHANIC",
    isActive: true,
    isAuthenticated: true,
  },
  {
    email: "yanto.supriadi@bengkel.com",
    fullName: "Yanto Supriadi",
    phone: "081298765441",
    role: "MECHANIC",
    isActive: true,
    isAuthenticated: true,
  },
  {
    email: "eko.prasetyo@bengkel.com",
    fullName: "Eko Prasetyo",
    phone: "081298765442",
    role: "MECHANIC",
    isActive: true,
    isAuthenticated: true,
  },
];

const vehicleBrands = [
  {
    brand: "Vespa",
    models: [
      "Sprint 150",
      "Primavera 150",
      "GTS Super 300",
      "GTS Super Sport 300",
      "PX 150",
      "S 125",
      "LX 125",
      "Vespa 946",
      "Sprint S 150",
      "Primavera S 150",
    ],
  },
  {
    brand: "Honda",
    models: [
      "Vario 150",
      "Vario 160",
      "Beat",
      "Scoopy",
      "PCX 160",
      "ADV 160",
      "CBR 150R",
      "CBR 250RR",
      "CRF 150L",
      "Supra X 125",
      "CB150R",
      "Forza 250",
    ],
  },
  {
    brand: "Yamaha",
    models: [
      "NMAX 155",
      "Aerox 155",
      "XMAX 250",
      "Lexi 125",
      "Mio M3",
      "Fazzio",
      "R15",
      "MT-15",
      "Vixion",
      "WR 155R",
      "Tracer 250",
    ],
  },
  {
    brand: "Suzuki",
    models: [
      "Address 125",
      "Nex II",
      "GSX-R150",
      "GSX-S150",
      "Satria F150",
      "Smash",
      "Inazuma 250",
    ],
  },
  {
    brand: "Kawasaki",
    models: [
      "Ninja 250",
      "Z250",
      "W175",
      "KLX 150",
      "D-Tracker 150",
      "Ninja ZX-25R",
    ],
  },
  {
    brand: "Piaggio",
    models: ["Medley 150", "Liberty 125", "MP3 300", "Beverly 300"],
  },
];

const expenseTitles = [
  "Beli ATK Kantor",
  "Beli Kopi & Snack Tim",
  "Bensin Test Ride Motor",
  "Biaya Kebersihan Bengkel",
  "Parkir Harian",
  "Peralatan Kebersihan",
  "Air Mineral Galon",
  "Sarung Tangan Mekanik",
  "Lap Microfiber",
  "Cairan Pembersih Rantai",
  "Peralatan Bengkel Kecil",
  "Seragam Mekanik Baru",
  "Promosi Instagram & FB",
  "Beli Oli & Cairan Display",
  "Sewa Alat Diagnostik",
  "Kalibrasi Tools",
  "Perbaikan Kompresor",
  "Safety Equipment",
  "Iuran Kebersihan Pasar",
  "Langganan Software Bengkel",
  "Biaya Training Mekanik",
  "Bensin Generator",
  "Maintenance AC",
  "Pest Control Bulanan",
  "Biaya Sertifikasi ISO",
  "Service Komputer Kasir",
  "Beli Printer Struk",
  "Kertas Thermal Roll",
  "Biaya Notaris & Legal",
  "Langganan WiFi Biznet",
  "Listrik PLN Bulanan",
  "Telepon & Pulsa",
  "Sewa Tempat Bulanan",
  "Bensin Operasional Harian",
  "Makan Siang Karyawan",
];

// ============================================================================
// CLEANUP
// ============================================================================

async function cleanDatabase() {
  console.log("Membersihkan database...");
  const tables = [
    "Notification",
    "OrderStatusHistory",
    "MechanicAssignment",
    "StockMovement",
    "Payment",
    "OrderItem",
    "Order",
    "Expense",
    "Shift",
    "ProductPriceHistory",
    "Product",
    "Vehicle",
    "Customer",
    "Setting",
    "File",
    "User",
  ];
  for (const table of tables) {
    await prisma[table.charAt(0).toLowerCase() + table.slice(1)].deleteMany();
  }
  console.log("Database berhasil dibersihkan\n");
}

// ============================================================================
// MAIN SEED
// ============================================================================

async function seed() {
  await cleanDatabase();
  console.log("Mulai seeding database (Jan 2025 - 18 Juni 2026)...\n");

  // STEP 1: Settings & Users
  console.log("[1/7] Membuat Settings & Users...");
  for (const setting of defaultSettings) {
    await prisma.setting.create({ data: setting });
  }
  const createdUsers = [];
  for (const user of userData) {
    createdUsers.push(await prisma.user.create({ data: user }));
  }
  const admins = createdUsers.filter((u) => u.role === "ADMIN");
  const cashiers = createdUsers.filter((u) => u.role === "CASHIER");
  const mechanics = createdUsers.filter((u) => u.role === "MECHANIC");
  console.log(
    `   ${createdUsers.length} users created (${admins.length} admin, ${cashiers.length} kasir, ${mechanics.length} mekanik)\n`
  );

  // STEP 2: Customers & Vehicles
  console.log("[2/7] Membuat Customers & Vehicles...");
  const dbCustomers = [];
  for (let i = 0; i < 300; i++) {
    const customer = await prisma.customer.create({
      data: {
        name: faker.person.fullName(),
        phone: faker.phone.number("08##########"),
        createdAt: faker.date.between({ from: "2024-06-01", to: "2025-01-01" }),
      },
    });
    dbCustomers.push(customer);
    const vehicleCount = faker.number.int({ min: 1, max: i < 25 ? 4 : 2 });
    for (let v = 0; v < vehicleCount; v++) {
      const brandData = faker.helpers.arrayElement(vehicleBrands);
      await prisma.vehicle.create({
        data: {
          plateNumber: generatePlateNumber(),
          brand: brandData.brand,
          model: faker.helpers.arrayElement(brandData.models),
          customerId: customer.id,
        },
      });
    }
  }
  console.log(`   ${dbCustomers.length} customers created\n`);

  // STEP 3: Products
  console.log(
    `[3/7] Membuat Products (${sparepartData.length} spareparts + ${serviceData.length} services)...`
  );
  const spareparts = [];
  const services = [];

  for (let i = 0; i < sparepartData.length; i++) {
    const price = faker.number.int({ min: 15000, max: 2500000 });
    const cost = Math.floor(price * 0.55);
    const initialStock = faker.number.int({ min: 200, max: 600 });
    const p = await prisma.product.create({
      data: {
        name: sparepartData[i].name,
        sku: generateSku("SPAREPART", i),
        type: "SPAREPART",
        description: sparepartData[i].description,
        price,
        cost,
        stock: initialStock,
        isActive: true,
      },
    });
    spareparts.push(p);
    await prisma.productPriceHistory.create({
      data: {
        productId: p.id,
        price: p.price,
        cost: p.cost,
        effectiveFrom: new Date("2025-01-01"),
      },
    });
    await prisma.stockMovement.create({
      data: {
        productId: p.id,
        type: "IN",
        sourceType: "PURCHASE",
        quantity: initialStock,
        recordedById: admins[0].id,
        note: "Stok awal 2025",
        createdAt: new Date("2025-01-01"),
      },
    });
  }

  for (let i = 0; i < serviceData.length; i++) {
    const price = faker.number.int({ min: 35000, max: 3500000 });
    const cost = Math.floor(price * 0.35);
    const p = await prisma.product.create({
      data: {
        name: serviceData[i].name,
        sku: generateSku("SERVICE", i),
        type: "SERVICE",
        description: serviceData[i].description,
        price,
        cost,
        stock: 0,
        isActive: true,
      },
    });
    services.push(p);
    await prisma.productPriceHistory.create({
      data: {
        productId: p.id,
        price: p.price,
        cost: p.cost,
        effectiveFrom: new Date("2025-01-01"),
      },
    });
  }
  console.log(
    `   ${spareparts.length} spareparts & ${services.length} services created\n`
  );

  // STEP 4: Shifts & Expenses
  console.log("[4/7] Membuat Shifts & Expenses (Jan 2025 - 18 Juni 2026)...");
  const shifts = [];
  const startDate = new Date("2025-01-01");
  const endDate = new Date("2026-06-18");
  const shiftsByMonth = {};

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 0) continue;

    const cashier = faker.helpers.arrayElement(cashiers);
    const openedAt = setTime(d, 8, 0);
    const closedAt = setTime(d, 20, 0);
    const cashSales = faker.number.int({ min: 500000, max: 12000000 });

    const shift = await prisma.shift.create({
      data: {
        cashierId: cashier.id,
        status: "CLOSED",
        startingCash: 1000000,
        endingCash: 1000000 + cashSales,
        expectedCash: 1000000 + cashSales,
        cashSales,
        cashIn: 0,
        cashOut: 0,
        discrepancy:
          faker.helpers.maybe(
            () => faker.number.int({ min: -50000, max: 50000 }),
            { probability: 0.12 }
          ) || 0,
        openedAt,
        closedAt,
      },
    });
    shifts.push(shift);

    const monthKey = `${openedAt.getFullYear()}-${String(
      openedAt.getMonth() + 1
    ).padStart(2, "0")}`;
    if (!shiftsByMonth[monthKey]) shiftsByMonth[monthKey] = [];
    shiftsByMonth[monthKey].push(shift);

    const numExpenses = faker.number.int({ min: 0, max: 5 });
    for (let e = 0; e < numExpenses; e++) {
      await prisma.expense.create({
        data: {
          title: faker.helpers.arrayElement(expenseTitles),
          amount: faker.number.int({ min: 10000, max: 1500000 }),
          category: faker.helpers.arrayElement([
            "SUPPLIES",
            "MAINTENANCE",
            "UTILITIES",
            "RENT",
            "OTHER",
          ]),
          shiftId: shift.id,
          recordedById: shift.cashierId,
          date: faker.date.between({ from: openedAt, to: closedAt }),
        },
      });
    }
  }
  console.log(`   ${shifts.length} shifts created\n`);

  // STEP 5: Orders
  console.log(
    "[5/7] Membuat Orders dengan pattern bisnis realistis (~300/bulan)..."
  );
  let orderCount = 0;
  const mechanicDailyTasks = {};
  mechanics.forEach((m) => {
    mechanicDailyTasks[m.id] = {};
  });
  const stockTracker = {};
  spareparts.forEach((sp) => {
    stockTracker[sp.id] = sp.stock;
  });

  const allMonths = Object.keys(shiftsByMonth).sort();

  for (const monthKey of allMonths) {
    const monthShifts = shiftsByMonth[monthKey];
    if (!monthShifts?.length) continue;

    const [year, month] = monthKey.split("-").map(Number);
    const restockDate = new Date(year, month - 1, 1, 8, 0, 0);

    for (const sp of spareparts) {
      const currentStock = stockTracker[sp.id];
      if (currentStock < 80) {
        const restockQty = faker.number.int({ min: 100, max: 300 });
        stockTracker[sp.id] = currentStock + restockQty;
        await prisma.product.update({
          where: { id: sp.id },
          data: { stock: { increment: restockQty } },
        });
        await prisma.stockMovement.create({
          data: {
            productId: sp.id,
            type: "IN",
            sourceType: "PURCHASE",
            quantity: restockQty,
            recordedById: admins[0].id,
            note: `Restock bulanan ${monthKey}`,
            createdAt: restockDate,
          },
        });
      }
    }

    const adjustmentProducts = faker.helpers.arrayElements(
      spareparts,
      faker.number.int({ min: 10, max: 20 })
    );
    for (const sp of adjustmentProducts) {
      const adjQty = faker.number.int({ min: -8, max: 15 });
      if (adjQty !== 0) {
        stockTracker[sp.id] = Math.max(0, stockTracker[sp.id] + adjQty);
        await prisma.product.update({
          where: { id: sp.id },
          data: { stock: { increment: adjQty } },
        });
        await prisma.stockMovement.create({
          data: {
            productId: sp.id,
            type: adjQty > 0 ? "IN" : "OUT",
            sourceType: "ADJUSTMENT",
            quantity: Math.abs(adjQty),
            recordedById: admins[0].id,
            note:
              adjQty > 0
                ? "Stock opname: surplus ditemukan"
                : "Stock opname: selisih kurang",
            createdAt: new Date(restockDate.getTime() + 3600000),
          },
        });
      }
    }

    const targetOrders = faker.number.int({ min: 280, max: 330 });
    let ordersThisMonth = 0;
    const shuffledShifts = faker.helpers.shuffle([...monthShifts]);

    for (const shift of shuffledShifts) {
      if (ordersThisMonth >= targetOrders) break;

      const shiftDay = shift.openedAt.toISOString().split("T")[0];
      mechanics.forEach((m) => {
        if (!mechanicDailyTasks[m.id][shiftDay])
          mechanicDailyTasks[m.id][shiftDay] = 0;
      });

      const maxOrdersThisShift = Math.min(12, targetOrders - ordersThisMonth);
      const totalOrders = faker.number.int({ min: 2, max: maxOrdersThisShift });
      if (totalOrders <= 0) continue;

      const statusDistribution = [
        ...Array(Math.max(0, Math.floor(totalOrders * 0.06))).fill("QUEUED"),
        ...Array(Math.max(0, Math.floor(totalOrders * 0.1))).fill(
          "IN_PROGRESS"
        ),
        ...Array(Math.max(0, Math.floor(totalOrders * 0.25))).fill("COMPLETED"),
        ...Array(Math.max(0, Math.floor(totalOrders * 0.55))).fill("CLOSED"),
        ...Array(
          Math.max(0, totalOrders - Math.floor(totalOrders * 0.96))
        ).fill("CANCELLED"),
      ];

      for (let i = statusDistribution.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [statusDistribution[i], statusDistribution[j]] = [
          statusDistribution[j],
          statusDistribution[i],
        ];
      }

      for (const status of statusDistribution) {
        ordersThisMonth++;
        const customer = faker.helpers.arrayElement(dbCustomers);
        const vehicles = await prisma.vehicle.findMany({
          where: { customerId: customer.id },
        });
        if (vehicles.length === 0) continue;
        const vehicle = faker.helpers.arrayElement(vehicles);

        let assignedMechanicId = null;
        if (status !== "CANCELLED") {
          const availableMechanics = mechanics.filter(
            (m) => (mechanicDailyTasks[m.id][shiftDay] || 0) < 5
          );
          if (availableMechanics.length > 0) {
            assignedMechanicId =
              faker.helpers.arrayElement(availableMechanics).id;
            mechanicDailyTasks[assignedMechanicId][shiftDay] =
              (mechanicDailyTasks[assignedMechanicId][shiftDay] || 0) + 1;
          }
        }

        let subtotal = 0;
        const selectedItems = [];
        const mainService = faker.helpers.arrayElement(services);
        const mainSubtotal = mainService.price;
        subtotal += mainSubtotal;
        selectedItems.push({
          product: mainService,
          qty: 1,
          subtotal: mainSubtotal,
          isService: true,
        });

        for (const [, pattern] of Object.entries(servicePatterns)) {
          if (pattern.trigger(mainService.name)) {
            if (
              faker.datatype.boolean({
                probability: pattern.addonServiceChance,
              })
            ) {
              const addonServiceName = faker.helpers.arrayElement(
                pattern.addonServices
              );
              const addonService = services.find(
                (s) => s.name === addonServiceName
              );
              if (
                addonService &&
                !selectedItems.find((i) => i.product.id === addonService.id)
              ) {
                const addonSubtotal = addonService.price;
                subtotal += addonSubtotal;
                selectedItems.push({
                  product: addonService,
                  qty: 1,
                  subtotal: addonSubtotal,
                  isService: true,
                });
              }
            }
            if (
              faker.datatype.boolean({ probability: pattern.sparepartChance })
            ) {
              const numSpareparts = faker.number.int({ min: 1, max: 4 });
              const matchingSpareparts = spareparts.filter((sp) =>
                pattern.sparepartTypes.some(
                  (type) => sparepartCategories[sp.sku] === type
                )
              );
              if (matchingSpareparts.length > 0) {
                for (let sp = 0; sp < numSpareparts; sp++) {
                  const sparepart =
                    faker.helpers.arrayElement(matchingSpareparts);
                  if (
                    !selectedItems.find((i) => i.product.id === sparepart.id)
                  ) {
                    const spQty = faker.number.int({ min: 1, max: 3 });
                    const spSubtotal = sparepart.price * spQty;
                    subtotal += spSubtotal;
                    selectedItems.push({
                      product: sparepart,
                      qty: spQty,
                      subtotal: spSubtotal,
                      isService: false,
                    });
                  }
                }
              }
            }
            break;
          }
        }

        if (faker.datatype.boolean({ probability: 0.15 })) {
          const extraSparepart = faker.helpers.arrayElement(spareparts);
          if (!selectedItems.find((i) => i.product.id === extraSparepart.id)) {
            const extraQty = faker.number.int({ min: 1, max: 2 });
            const extraSubtotal = extraSparepart.price * extraQty;
            subtotal += extraSubtotal;
            selectedItems.push({
              product: extraSparepart,
              qty: extraQty,
              subtotal: extraSubtotal,
              isService: false,
            });
          }
        }

        const tax = Math.round(subtotal * 0.11);
        const total = subtotal + tax;

        const baseDate = setTime(
          shift.openedAt,
          faker.number.int({ min: 8, max: 19 }),
          faker.number.int({ min: 0, max: 59 })
        );

        let diagnosedAt = null,
          startedAt = null,
          completedAt = null,
          closedAt = null,
          deletedAt = null;
        let paymentMethod = null,
          paymentStatus = "PENDING",
          amountPaid = 0,
          changeAmount = 0,
          paidAt = null;

        switch (status) {
          case "QUEUED":
            diagnosedAt = new Date(baseDate);
            paymentMethod = faker.helpers.arrayElement(["CASH", "QRIS"]);
            break;
          case "IN_PROGRESS":
            diagnosedAt = new Date(baseDate);
            startedAt = new Date(baseDate.getTime() + 10 * 60000);
            paymentMethod = faker.helpers.arrayElement(["CASH", "QRIS"]);
            break;
          case "COMPLETED":
            diagnosedAt = new Date(baseDate);
            startedAt = new Date(baseDate.getTime() + 10 * 60000);
            completedAt = new Date(
              baseDate.getTime() +
                faker.number.int({ min: 25, max: 150 }) * 60000
            );
            paymentMethod = faker.helpers.arrayElement(["CASH", "QRIS"]);
            paymentStatus = "PAID";
            paidAt = completedAt;
            amountPaid =
              paymentMethod === "CASH"
                ? total + faker.number.int({ min: 0, max: 150000 })
                : total;
            changeAmount = paymentMethod === "CASH" ? amountPaid - total : 0;
            break;
          case "CLOSED":
            diagnosedAt = new Date(baseDate);
            startedAt = new Date(baseDate.getTime() + 10 * 60000);
            completedAt = new Date(
              baseDate.getTime() +
                faker.number.int({ min: 25, max: 150 }) * 60000
            );
            closedAt = new Date(
              baseDate.getTime() +
                faker.number.int({ min: 50, max: 200 }) * 60000
            );
            paymentMethod = faker.helpers.arrayElement(["CASH", "QRIS"]);
            paymentStatus = "PAID";
            paidAt = closedAt;
            amountPaid =
              paymentMethod === "CASH"
                ? total + faker.number.int({ min: 0, max: 150000 })
                : total;
            changeAmount = paymentMethod === "CASH" ? amountPaid - total : 0;
            break;
          case "CANCELLED":
            deletedAt = new Date(baseDate.getTime() + 8 * 60000);
            break;
        }

        const generatedOrderNumber = orderNumber(baseDate);
        const order = await prisma.order.create({
          data: {
            orderNumber: generatedOrderNumber,
            status,
            subtotal,
            tax,
            total,
            diagnosedAt,
            startedAt,
            completedAt,
            closedAt,
            deletedAt,
            cashierId: shift.cashierId,
            shiftId: shift.id,
            customerId: customer.id,
            vehicleId: vehicle.id,
            createdAt: baseDate,
            updatedAt:
              closedAt || completedAt || startedAt || diagnosedAt || baseDate,
          },
        });
        orderCount++;

        for (const item of selectedItems) {
          const orderItem = await prisma.orderItem.create({
            data: {
              orderId: order.id,
              productId: item.product.id,
              productNameSnapshot: item.product.name,
              quantity: item.qty,
              unitPrice: item.product.price,
              unitCostSnapshot: item.product.cost,
              subtotal: item.subtotal,
            },
          });

          if (item.isService && assignedMechanicId && status !== "CANCELLED") {
            await prisma.mechanicAssignment.create({
              data: {
                orderItemId: orderItem.id,
                mechanicId: assignedMechanicId,
                startAt: ["QUEUED"].includes(status) ? null : startedAt,
                endAt: ["QUEUED", "IN_PROGRESS"].includes(status)
                  ? null
                  : completedAt,
              },
            });
          }

          if (
            item.product.type === "SPAREPART" &&
            ["IN_PROGRESS", "COMPLETED", "CLOSED"].includes(status)
          ) {
            if (stockTracker[item.product.id] >= item.qty) {
              await prisma.stockMovement.create({
                data: {
                  productId: item.product.id,
                  type: "OUT",
                  sourceType: "SALE",
                  quantity: item.qty,
                  orderItemId: orderItem.id,
                  recordedById: shift.cashierId,
                  createdAt: startedAt || diagnosedAt,
                },
              });
              await prisma.product.update({
                where: { id: item.product.id },
                data: { stock: { decrement: item.qty } },
              });
              stockTracker[item.product.id] -= item.qty;
            }
          }
        }

        if (status !== "CANCELLED") {
          await prisma.payment.create({
            data: {
              orderId: order.id,
              method: paymentMethod,
              amountPaid,
              change: changeAmount,
              status: paymentStatus,
              paidAt,
            },
          });
        }

        const statusFlow = [];
        const notes = {
          QUEUED: [
            "Masuk antrian pengerjaan",
            "Menunggu mekanik tersedia",
            "Antrian service",
            "Order diterima kasir",
          ],
          IN_PROGRESS: [
            "Mekanik mulai pengerjaan",
            "Service sedang dikerjakan",
            "Proses perbaikan dimulai",
            "Diagnosa selesai, mulai perbaikan",
          ],
          COMPLETED: [
            "Pengerjaan selesai",
            "Service selesai, menunggu pembayaran",
            "Motor siap diambil",
            "QC selesai, siap serah terima",
          ],
          CLOSED: [
            "Pembayaran lunas",
            "Motor diambil pelanggan",
            "Transaksi selesai",
            "Pesanan ditutup",
          ],
          CANCELLED: [
            "Pesanan dibatalkan pelanggan",
            "Order dicancel",
            "Pelanggan batal servis",
            "Dibatalkan oleh kasir",
          ],
        };

        statusFlow.push({
          status: "QUEUED",
          note: faker.helpers.arrayElement(notes.QUEUED),
          changedById: shift.cashierId,
          createdAt: diagnosedAt || new Date(baseDate.getTime() + 3 * 60000),
        });

        if (["IN_PROGRESS", "COMPLETED", "CLOSED"].includes(status)) {
          statusFlow.push({
            status: "IN_PROGRESS",
            note: faker.helpers.arrayElement(notes.IN_PROGRESS),
            changedById: assignedMechanicId || shift.cashierId,
            createdAt: startedAt || new Date(baseDate.getTime() + 15 * 60000),
          });
        }

        if (["COMPLETED", "CLOSED"].includes(status)) {
          statusFlow.push({
            status: "COMPLETED",
            note: faker.helpers.arrayElement(notes.COMPLETED),
            changedById: assignedMechanicId || shift.cashierId,
            createdAt: completedAt || new Date(baseDate.getTime() + 50 * 60000),
          });
        }

        if (status === "CLOSED") {
          statusFlow.push({
            status: "CLOSED",
            note: faker.helpers.arrayElement(notes.CLOSED),
            changedById: shift.cashierId,
            createdAt: closedAt || new Date(baseDate.getTime() + 80 * 60000),
          });
        }

        if (status === "CANCELLED") {
          statusFlow.push({
            status: "CANCELLED",
            note: faker.helpers.arrayElement(notes.CANCELLED),
            changedById: shift.cashierId,
            createdAt: deletedAt || new Date(baseDate.getTime() + 8 * 60000),
          });
        }

        for (const flow of statusFlow) {
          await prisma.orderStatusHistory.create({
            data: {
              orderId: order.id,
              status: flow.status,
              note: flow.note,
              changedById: flow.changedById,
              createdAt: flow.createdAt,
            },
          });
        }
      }
    }
  }
  console.log(`   ${orderCount} orders created\n`);

  // STEP 6: Notifications
  console.log("[6/7] Membuat Notifications...");
  const roleLabels = { CASHIER: "Kasir", MECHANIC: "Mekanik" };

  for (const user of createdUsers) {
    if (user.role === "ADMIN") continue;
    const title = "Selamat Datang di G Speed Bintaro";
    const message = `## Selamat Datang\n\nHalo **${
      user.fullName
    }**,\n\nAkun Anda telah berhasil dibuat sebagai **${
      roleLabels[user.role]
    }** di G Speed Bintaro.\n\nSelamat bergabung dan semoga bekerja dengan baik.\nJika ada pertanyaan, silakan hubungi admin.`;
    await prisma.notification.create({
      data: { title, message, type: "SUCCESS", userId: user.id },
    });

    const adminTitle = `User Baru - ${user.fullName}`;
    const adminMsg = `## User Baru Ditambahkan\n\n**Nama:** ${
      user.fullName
    }\n**Email:** ${user.email}\n**Role:** ${
      roleLabels[user.role]
    }\n**Telepon:** ${user.phone || "-"}\n\n**Waktu:** ${formatDate(
      new Date()
    )}`;
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          title: adminTitle,
          message: adminMsg,
          type: "INFO",
          userId: admin.id,
        },
      });
    }
  }

  const lowThreshold = parseInt(
    defaultSettings.find((s) => s.key === "stock_low_threshold").value,
    10
  );
  const finalProducts = await prisma.product.findMany({
    where: { type: "SPAREPART", isActive: true },
  });
  for (const product of finalProducts) {
    if (product.stock === 0) {
      const title = `Stok Habis - ${product.name}`;
      const message = `## Peringatan Stok Habis\n\n**Produk:** ${
        product.name
      }\n**SKU:** ${
        product.sku
      }\n**Stok Saat Ini:** 0 unit\n\n> Segera lakukan pembelian ulang.\n\n**Waktu:** ${formatDate(
        new Date()
      )}`;
      for (const admin of admins) {
        await prisma.notification.create({
          data: { title, message, type: "ERROR", userId: admin.id },
        });
      }
    } else if (product.stock <= lowThreshold) {
      const title = `Stok Rendah - ${product.name}`;
      const message = `## Peringatan Stok Rendah\n\n**Produk:** ${
        product.name
      }\n**SKU:** ${product.sku}\n**Stok Saat Ini:** ${
        product.stock
      } unit\n**Batas Minimum:** ${lowThreshold} unit\n\n> Segera lakukan pembelian ulang.\n\n**Waktu:** ${formatDate(
        new Date()
      )}`;
      for (const admin of admins) {
        await prisma.notification.create({
          data: { title, message, type: "WARNING", userId: admin.id },
        });
      }
    }
  }
  console.log(`   Notifications created\n`);

  // STEP 7: Price History
  console.log("[7/7] Membuat Price History Updates...");
  const priceChangeMonths = ["2025-04", "2025-08", "2025-12", "2026-04"];
  for (const monthKey of priceChangeMonths) {
    const [year, month] = monthKey.split("-").map(Number);
    const changeDate = new Date(year, month - 1, 1);
    if (changeDate > endDate) continue;

    const productsToUpdate = faker.helpers.arrayElements(
      [...spareparts, ...services],
      Math.floor((spareparts.length + services.length) * 0.25)
    );
    for (const product of productsToUpdate) {
      const priceIncrease = faker.datatype.boolean({ probability: 0.65 });
      const changePercent = faker.number.float({ min: 0.03, max: 0.12 });
      const newPrice = priceIncrease
        ? Math.round(product.price * (1 + changePercent))
        : Math.round(product.price * (1 - changePercent));
      const newCost = Math.round(
        newPrice * (product.type === "SPAREPART" ? 0.55 : 0.35)
      );

      await prisma.product.update({
        where: { id: product.id },
        data: { price: newPrice, cost: newCost },
      });
      await prisma.productPriceHistory.create({
        data: {
          productId: product.id,
          price: newPrice,
          cost: newCost,
          effectiveFrom: changeDate,
        },
      });
    }
  }
  console.log(
    `   Price history created for ${priceChangeMonths.length} periods\n`
  );

  // SUMMARY
  const totalNotifications = await prisma.notification.count();
  const totalVehicles = await prisma.vehicle.count();
  const totalExpenses = await prisma.expense.count();

  console.log("==================================================");
  console.log("SEEDING BERHASIL");
  console.log("==================================================");
  console.log(`Settings       : ${defaultSettings.length}`);
  console.log(
    `Users          : ${createdUsers.length} (${admins.length} admin, ${cashiers.length} kasir, ${mechanics.length} mekanik)`
  );
  console.log(`Customers      : ${dbCustomers.length}`);
  console.log(
    `Vehicles       : ${totalVehicles} (${vehicleBrands.length} brands)`
  );
  console.log(`Spareparts     : ${spareparts.length}`);
  console.log(`Services       : ${services.length}`);
  console.log(`Shifts         : ${shifts.length}`);
  console.log(`Orders         : ${orderCount}`);
  console.log(`Expenses       : ${totalExpenses}`);
  console.log(`Notifications  : ${totalNotifications}`);
  console.log("--------------------------------------------------");
  console.log(`Periode        : Jan 2025 - 18 Juni 2026 (18 bulan)`);
  console.log(`Rata-rata      : ~${Math.round(orderCount / 18)} order/bulan`);
  console.log(`Status         : NO DRAFT, realistic patterns`);
  console.log(`Notif Format   : Markdown`);
  console.log("==================================================");
}

seed()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("Seeding gagal:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
