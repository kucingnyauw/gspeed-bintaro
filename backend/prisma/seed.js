import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { faker } from "@faker-js/faker/locale/id_ID";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "rifkyf589@gmail.com";

// ============================================================
// UTILITY: Code Generator (ANTI DUPLICATE)
// ============================================================
function generateOrderNumber(date, counter) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const seq = String(counter).padStart(4, "0");
  const rand = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `ORD-${yyyy}${mm}${dd}-${seq}-${rand}`;
}

function generateSku(type, index) {
  const prefix = type === "SPAREPART" ? "SP" : "SV";
  return `${prefix}-${String(index + 1).padStart(3, "0")}`;
}

// ============================================================
// DATA MASTER - DIPERBANYAK VARIAN (120 Sparepart + 60 Service = 180 Produk)
// ============================================================
const sparepartData = [
  // REM & KAMPAS (8 varian)
  { name: "Kampas Rem Depan Vespa Sprint", description: "Kampas rem depan original untuk Vespa Sprint 150. Material semi-metallic." },
  { name: "Kampas Rem Belakang Vespa Primavera", description: "Kampas rem belakang berkualitas tinggi untuk Vespa Primavera." },
  { name: "Kampas Rem Depan Racing Malossi", description: "Kampas rem racing Malossi untuk performa maksimal." },
  { name: "Kampas Rem Belakang Racing Malossi", description: "Kampas rem belakang racing Malossi. Material sintered metal." },
  { name: "Kampas Rem Depan Brembo Vespa", description: "Kampas rem depan Brembo SA series. Kualitas premium Italia." },
  { name: "Kampas Rem Belakang Brembo Vespa", description: "Kampas rem belakang Brembo. Performa pengereman superior." },
  { name: "Kampas Rem Depan EBC Racing", description: "Kampas rem depan EBC Double-H sintered. Untuk racing dan touring." },
  { name: "Kampas Rem Belakang EBC Racing", description: "Kampas rem belakang EBC. Ketahanan panas tinggi." },

  // OLI MESIN (12 varian)
  { name: "Oli Mesin Motul 2T", description: "Oli mesin 2-tak Motul 510 Technosynthese. Formula ester synthetic." },
  { name: "Oli Mesin Motul 4T", description: "Oli mesin 4-tak Motul 7100 full synthetic 10W-40." },
  { name: "Oli Mesin Motul 300V Racing", description: "Oli racing Motul 300V 15W-50. Ester core technology." },
  { name: "Oli Mesin Castrol Power 1", description: "Oli mesin Castrol Power 1 10W-40 semi-synthetic." },
  { name: "Oli Mesin Castrol Edge", description: "Oli mesin Castrol Edge 5W-40 full synthetic. Titanium FST." },
  { name: "Oli Mesin Shell Advance Ultra", description: "Oli Shell Advance Ultra 10W-40. PurePlus technology." },
  { name: "Oli Mesin Shell Advance AX7", description: "Oli Shell Advance AX7 10W-40 semi-synthetic." },
  { name: "Oli Mesin Repsol Moto", description: "Oli Repsol Moto 4T 10W-40 full synthetic." },
  { name: "Oli Mesin Repsol Racing", description: "Oli Repsol Racing 4T 10W-50. Untuk performa tinggi." },
  { name: "Oli Mesin Liqui Moly", description: "Oli Liqui Moly 4T 10W-40. Teknologi MoS2 anti-friction." },
  { name: "Oli Mesin Yamalube", description: "Oli Yamalube 4T 10W-40 semi-synthetic. Kualitas OEM." },
  { name: "Oli Mesin AHM MPX2", description: "Oli AHM MPX2 10W-30. Untuk motor matic harian." },

  // OLI GARDAN & TRANSMISI (5 varian)
  { name: "Oli Gardan Vespa Matic", description: "Oli gardan khusus Vespa matic SAE 80W-90." },
  { name: "Oli Gardan Motul", description: "Oli gardan Motul 80W-90 mineral. Pelumasan optimal." },
  { name: "Oli Gardan Castrol", description: "Oli gardan Castrol 80W-90. Anti-wear protection." },
  { name: "Oli Transmisi Vespa PX", description: "Oli transmisi Vespa PX SAE 30. Untuk gear box." },
  { name: "Oli Transmisi Racing", description: "Oli transmisi racing 75W-140 full synthetic." },

  // BUSI (8 varian)
  { name: "Busi NGK Racing Vespa", description: "Busi NGK Iridium IX Racing CR8EIX-9." },
  { name: "Busi NGK Platinum Vespa", description: "Busi NGK G-Power Platinum CR8EGP." },
  { name: "Busi NGK Standar Vespa", description: "Busi NGK standar CR8E. Kualitas OEM." },
  { name: "Busi Denso Iridium Racing", description: "Busi Denso Iridium Power IU24. 0.4mm electrode." },
  { name: "Busi Denso Platinum", description: "Busi Denso Platinum PK20PR-P8. Durabilitas tinggi." },
  { name: "Busi Denso Standar", description: "Busi Denso standar U24ESR-N. Kualitas OEM." },
  { name: "Busi Champion Racing", description: "Busi Champion Iridium 9401. Performa racing." },
  { name: "Busi Splitfire Racing", description: "Busi Splitfire Triple Platinum. Multi-spark." },

  // FILTER (10 varian)
  { name: "Filter Udara Malossi Racing", description: "Filter udara racing Malossi Red Sponge. Washable." },
  { name: "Filter Udara Standar Vespa", description: "Filter udara original Vespa kualitas OEM." },
  { name: "Filter Udara K&N Racing", description: "Filter udara K&N high flow. Reusable lifetime." },
  { name: "Filter Udara BMC Racing", description: "Filter udara BMC race. Cotton gauze material." },
  { name: "Filter Udara DNA Racing", description: "Filter udara DNA high performance. Made in Italy." },
  { name: "Filter Oli Vespa Matic", description: "Filter oli Vespa matic original." },
  { name: "Filter Oli Racing Malossi", description: "Filter oli racing Malossi. High flow rate." },
  { name: "Filter Bensin Vespa", description: "Filter bensin Vespa mesh stainless steel." },
  { name: "Filter Bensin Racing", description: "Filter bensin racing high flow. 40 micron." },
  { name: "Filter CVT Vespa Matic", description: "Filter CVT Vespa matic. Mencegah debu masuk." },

  // RANTAI & GEAR (8 varian)
  { name: "Rantai Keteng Vespa PX", description: "Rantai keteng Vespa PX 150 original DID Japan." },
  { name: "Rantai Keteng Vespa Sprint", description: "Rantai keteng Vespa Sprint 150 OEM quality." },
  { name: "Rantai Keteng Racing DID", description: "Rantai keteng racing DID gold series." },
  { name: "Rantai Keteng Racing RK", description: "Rantai keteng racing RK Takasago Japan." },
  { name: "Gear Set Rasio 3.8 Standar", description: "Gear set rasio 3.8 standar Vespa. OEM quality." },
  { name: "Gear Set Rasio 4.0 Racing", description: "Gear set rasio 4.0 racing. Akselerasi cepat." },
  { name: "Gear Set Rasio 4.2 Drag", description: "Gear set rasio 4.2 untuk drag race." },
  { name: "Gear Set Rasio 3.5 Touring", description: "Gear set rasio 3.5 untuk top speed maksimal." },

  // BAN LUAR (10 varian)
  { name: "Ban Pirelli Angel Scooter 110/70", description: "Ban Pirelli Angel Scooter 110/70-12. Multi-compound." },
  { name: "Ban Pirelli Angel Scooter 120/70", description: "Ban Pirelli Angel Scooter 120/70-12. Pattern bi-compound." },
  { name: "Ban Pirelli Diablo Rosso 130/70", description: "Ban Pirelli Diablo Rosso Scooter 130/70-12. Sport." },
  { name: "Ban Michelin City Grip 120/70", description: "Ban Michelin City Grip 120/70-12. Silica compound." },
  { name: "Ban Michelin City Grip 130/70", description: "Ban Michelin City Grip 130/70-12. Anti-aquaplaning." },
  { name: "Ban Michelin Pilot Street 110/70", description: "Ban Michelin Pilot Street 110/70-12. Commuting." },
  { name: "Ban Metzeler Sportec 130/70", description: "Ban Metzeler Sportec Street 130/70-12. Sport touring." },
  { name: "Ban Metzeler Feelfree 120/70", description: "Ban Metzeler Feelfree 120/70-12. Wet grip optimal." },
  { name: "Ban Maxxis Diamond 110/70", description: "Ban Maxxis Diamond 110/70-12. Budget friendly." },
  { name: "Ban IRC Eagle Grip 120/70", description: "Ban IRC Eagle Grip 120/70-12. Durabilitas tinggi." },

  // BAN DALAM (4 varian)
  { name: "Ban Dalam Vespa 10 Inch", description: "Ban dalam Vespa 10 inch. Karet butyl." },
  { name: "Ban Dalam Vespa 12 Inch", description: "Ban dalam Vespa 12 inch. Karet premium." },
  { name: "Ban Dalam Racing 10 Inch", description: "Ban dalam racing 10 inch. Lebih tebal anti bocor." },
  { name: "Ban Dalam Racing 12 Inch", description: "Ban dalam racing 12 inch. Material heavy duty." },

  // AKI (6 varian)
  { name: "Aki Kering MotoBatt 12V", description: "Aki kering MotoBatt MBTZ10S. AGM technology." },
  { name: "Aki Kering Yuasa YTZ7S", description: "Aki kering Yuasa YTZ7S original Japan." },
  { name: "Aki Kering Yuasa YTZ10S", description: "Aki kering Yuasa YTZ10S. Cranking power besar." },
  { name: "Aki Kering GS Astra", description: "Aki kering GS Astra MF 12V 6Ah." },
  { name: "Aki Basah Yuasa", description: "Aki basah Yuasa YB9B. Untuk Vespa klasik." },
  { name: "Aki Lithium Racing", description: "Aki lithium Shido LTZ10S. Bobot ringan." },

  // LAMPU (8 varian)
  { name: "Lampu Depan LED Proyektor Vespa", description: "Lampu depan LED proyektor. Cut-off jelas." },
  { name: "Lampu Depan LED Bi-LED", description: "Lampu depan Bi-LED projector. High-low beam." },
  { name: "Lampu Belakang LED Vespa GTS", description: "Lampu belakang LED custom Vespa GTS." },
  { name: "Lampu Belakang LED Smoked", description: "Lampu belakang LED smoked lens. Tampilan gelap." },
  { name: "Lampu Sein LED Sequential", description: "Lampu sein LED sequential flowing." },
  { name: "Lampu Sein LED Smoke", description: "Lampu sein LED smoked universal Vespa." },
  { name: "Lampu DRL LED Strip", description: "Lampu DRL LED strip flexible. Daytime running light." },
  { name: "Lampu Kabut LED", description: "Lampu kabut LED mini proyektor. Tahan air." },

  // KOPLING (6 varian)
  { name: "Kampas Kopling Malossi Fly", description: "Kampas kopling racing Malossi Fly Clutch." },
  { name: "Kampas Kopling Polini Speed", description: "Kampas kopling Polini Speed Clutch." },
  { name: "Kampas Kopling Standar Vespa", description: "Kampas kopling standar Vespa OEM." },
  { name: "Kampas Kopling Racing Kevlar", description: "Kampas kopling kevlar racing. Tahan panas." },
  { name: "Per CVT Racing Malossi", description: "Per CVT racing Malossi kuning. 1500 RPM." },
  { name: "Per CVT Racing Polini", description: "Per CVT racing Polini biru. 2000 RPM." },

  // SHOCKBREAKER (8 varian)
  { name: "Shockbreaker Depan Bitubo Vespa", description: "Shockbreaker depan Bitubo fully adjustable." },
  { name: "Shockbreaker Belakang Ohlins Vespa", description: "Shockbreaker belakang Ohlins HO 142." },
  { name: "Shockbreaker Depan YSS Racing", description: "Shockbreaker depan YSS Racing Series. Gas." },
  { name: "Shockbreaker Belakang YSS Racing", description: "Shockbreaker belakang YSS G-Series. Adjustable." },
  { name: "Shockbreaker Depan KYB", description: "Shockbreaker depan KYB Excel-G. OEM replacement." },
  { name: "Shockbreaker Belakang KYB", description: "Shockbreaker belakang KYB Gas-A-Just." },
  { name: "Shockbreaker Depan Racing KTC", description: "Shockbreaker depan KTC Racing. Preload adjustable." },
  { name: "Shockbreaker Belakang Racing KTC", description: "Shockbreaker belakang KTC Racing. Tabung gas." },

  // BEARING (6 varian)
  { name: "Bearing Roda Depan SKF", description: "Bearing roda depan SKF Explorer Series." },
  { name: "Bearing Roda Belakang NTN", description: "Bearing roda belakang NTN original Japan." },
  { name: "Bearing Steering Koyo", description: "Bearing steering Koyo tapered roller." },
  { name: "Bearing Roda Depan NSK", description: "Bearing roda depan NSK Japan. Precision grade." },
  { name: "Bearing Roda Belakang FAG", description: "Bearing roda belakang FAG Germany." },
  { name: "Bearing CVT Vespa", description: "Bearing CVT Vespa matic. Needle bearing." },

  // KABEL (5 varian)
  { name: "Kabel Gas Domino Racing", description: "Kabel gas Domino Racing Quick Action." },
  { name: "Kabel Rem Depan Vespa Original", description: "Kabel rem depan Vespa original Piaggio." },
  { name: "Kabel Kopling Vespa PX", description: "Kabel kopling Vespa PX 150 original." },
  { name: "Kabel Spedometer Vespa", description: "Kabel spedometer Vespa original." },
  { name: "Kabel Choke Vespa 2T", description: "Kabel choke Vespa 2-tak. Kualitas OEM." },

  // PISTON (6 varian)
  { name: "Piston Kit Polini 200cc", description: "Piston kit Polini 200cc forged racing." },
  { name: "Piston Kit Malossi 175cc", description: "Piston kit Malossi 175cc cast performance." },
  { name: "Piston Kit Standar 150cc", description: "Piston kit standar Vespa 150cc OEM." },
  { name: "Piston Kit 62mm Racing", description: "Piston kit 62mm racing. Forged aluminium." },
  { name: "Piston Kit 63mm Touring", description: "Piston kit 63mm touring. Cast piston." },
  { name: "Piston Kit 65mm Drag", description: "Piston kit 65mm drag race. High compression." },

  // SPION (4 varian)
  { name: "Spion Oval Chrome Vespa", description: "Spion oval chrome Vespa classic. Wide angle." },
  { name: "Spion Lipat Racing CNC", description: "Spion lipat racing CNC aluminium." },
  { name: "Spion Bar End MotoGadget", description: "Spion bar end MotoGadget Glassless." },
  { name: "Spion Universal Black", description: "Spion universal black. Adjustable joint." },

  // KNALPOT (6 varian)
  { name: "Knalpot Akrapovic Racing", description: "Knalpot Akrapovic Racing Line titanium." },
  { name: "Knalpot Yoshimura Tri-Oval", description: "Knalpot Yoshimura Tri-Oval stainless." },
  { name: "Knalpot Leo Vince GP", description: "Knalpot Leo Vince GP Corsa. Carbon end cap." },
  { name: "Knalpot R9 Racing", description: "Knalpot R9 Racing Generation 5. Stainless." },
  { name: "Knalpot SC Project", description: "Knalpot SC Project CR-T. MotoGP style." },
  { name: "Knalpot Arrow Racing", description: "Knalpot Arrow Pro-Race. Titanium." },

  // CDI (4 varian)
  { name: "CDI Racing BRT Powermax", description: "CDI racing BRT Powermax dual band." },
  { name: "CDI Racing Rextor Programmable", description: "CDI racing Rextor adjustable. 5 maps." },
  { name: "CDI Standar Vespa", description: "CDI standar Vespa original Piaggio." },
  { name: "CDI Racing TDR", description: "CDI racing TDR. Limiter 14.000 RPM." },

  // PAKING & SEAL (4 varian)
  { name: "Paking Mesin Set Vespa PX", description: "Paking mesin set Vespa PX 150 lengkap." },
  { name: "Paking Mesin Set Vespa Sprint", description: "Paking mesin set Vespa Sprint 150." },
  { name: "Seal Mesin Vespa 2T Set", description: "Seal mesin full set Vespa 2-tak." },
  { name: "Seal Mesin Vespa 4T Set", description: "Seal mesin full set Vespa 4-tak." },

  // ROLLER & BELT CVT (6 varian)
  { name: "Roller CVT Malossi 10gr", description: "Roller CVT Malossi 10 gram. Akselerasi cepat." },
  { name: "Roller CVT Malossi 12gr", description: "Roller CVT Malossi 12 gram. Balanced." },
  { name: "Roller CVT Polini 9gr", description: "Roller CVT Polini 9 gram. Racing." },
  { name: "Roller CVT Dr Pulley 11gr", description: "Roller CVT Dr Pulley Sliding 11 gram." },
  { name: "Belt CVT Vespa Racing", description: "Belt CVT racing reinforced. Aramid fiber." },
  { name: "Belt CVT Vespa Standar", description: "Belt CVT standar Vespa. Kualitas OEM." },
];

const serviceData = [
  // SERVICE RINGAN (8 varian)
  { name: "Service Ringan Vespa Matic", description: "Ganti oli, bersihkan filter udara, cek CVT, cek rem, cek kelistrikan. 1-2 jam." },
  { name: "Service Ringan Vespa 2-Tak", description: "Ganti oli samping, bersihkan karburator, setel platina, bersihkan busi, cek kompresi." },
  { name: "Service Ringan Vespa 4-Tak", description: "Ganti oli, bersihkan throttle body, cek valve clearance, cek sistem injeksi." },
  { name: "Service Ringan Motor Matic Lain", description: "Service ringan untuk motor matic non-Vespa." },
  { name: "Service Ringan Motor Bebek", description: "Service ringan motor bebek 4-tak." },
  { name: "Service Ringan Motor Sport", description: "Service ringan motor sport 150cc-250cc." },
  { name: "Service Express 30 Menit", description: "Service express: ganti oli + cek cepat. 30 menit selesai." },
  { name: "Service Malam", description: "Service malam hari (diatas jam 8 malam). Extra charge 25%." },

  // TUNE UP (6 varian)
  { name: "Tune Up Mesin 2-Tak", description: "Setel karburator, timing, bersihkan exhaust port, cek reed valve." },
  { name: "Tune Up Mesin 4-Tak", description: "Setel valve clearance, bersihkan injector, reset ECU, cek sensor." },
  { name: "Tune Up Racing Performance", description: "Dyno test, setting karburator/injeksi, timing adjustment, AFR tuning." },
  { name: "Tune Up Irit BBM", description: "Setting mesin untuk efisiensi BBM maksimal. Target irit 10-15%." },
  { name: "Tune Up Touring", description: "Setting mesin untuk touring jarak jauh. Fokus reliability dan kenyamanan." },
  { name: "Dyno Test Only", description: "Tes dyno saja tanpa tuning. Printout grafik HP dan torsi." },

  // GANTI OLI (5 varian)
  { name: "Ganti Oli Mesin & Gardan", description: "Paket ganti oli mesin + gardan. Oli full synthetic." },
  { name: "Ganti Oli Mesin Sintetik", description: "Ganti oli full synthetic premium. Motul/Castrol/Shell." },
  { name: "Ganti Oli Mesin Racing", description: "Ganti oli racing Motul 300V. Untuk mesin high performance." },
  { name: "Ganti Oli Mesin Mineral", description: "Ganti oli mineral standar. Budget friendly." },
  { name: "Ganti Oli Gardan Only", description: "Ganti oli gardan saja. SAE 80W-90." },

  // CUCI MOTOR (6 varian)
  { name: "Cuci Motor Detailing Premium", description: "Foam wash, kuas detail, poles body, coating wax, bersihkan mesin, semir ban." },
  { name: "Cuci Motor Biasa", description: "Semprot air, foam wash, bilas, keringkan, semir ban. 15-20 menit." },
  { name: "Cuci Motor + Poles Body", description: "Cuci + poles body. Hilangkan swirl marks dan baret halus." },
  { name: "Cuci Mesin Motor", description: "Pembersihan mesin dengan chemical khusus. Bebas oli dan kotoran." },
  { name: "Cuci Rantai & Gear", description: "Pembersihan rantai dan gear set. Termasuk pelumasan ulang." },
  { name: "Coating Nano Ceramic", description: "Coating nano ceramic 9H. Proteksi cat 2 tahun. Include detailing." },

  // OVERHAUL (6 varian)
  { name: "Overhaul Mesin 2-Tak Full", description: "Turun mesin, ganti piston, boring, ganti seal & bearing, setel ulang." },
  { name: "Overhaul Mesin 4-Tak Full", description: "Turun mesin, ganti ring piston, skir klep, ganti seal klep, gasket set." },
  { name: "Overhaul Mesin Racing", description: "Bore up, porting polish, piston forged, camshaft racing, ECU tuning." },
  { name: "Overhaul Suspensi Depan", description: "Ganti seal, ganti oli, bersihkan tabung, cek bushing." },
  { name: "Overhaul CVT Full", description: "Bongkar total CVT, ganti belt, roller, per, bersihkan torque driver." },
  { name: "Overhaul Karburator", description: "Bongkar, bersihkan ultrasonic, ganti jet, setel AFR." },

  // BAN (5 varian)
  { name: "Tambal Ban Tubeless", description: "Tambal ban tubeless metode mushroom plug dari dalam. Aman & permanen." },
  { name: "Tambal Ban Biasa", description: "Tambal ban tube type dengan patch dingin. 15 menit." },
  { name: "Ganti Ban Baru + Balancing", description: "Paket ganti ban baru + balancing. Pilihan Pirelli/Michelin/Metzeler." },
  { name: "Balancing & Spooring Roda", description: "Balancing digital + spooring. Hilangkan getaran setang." },
  { name: "Ganti Ban Dalam Only", description: "Ganti ban dalam saja. Karet butyl premium." },

  // MODIFIKASI & UPGRADE (8 varian)
  { name: "Bore Up Mesin 175cc", description: "Bore up 150cc ke 175cc. Piston kit Malossi." },
  { name: "Bore Up Mesin 200cc Racing", description: "Bore up ekstrem ke 200cc. Piston Polini forged. CNC." },
  { name: "Setting Karburator Racing", description: "Ganti jet, setel pelampung, jarum skep, fine tuning AFR wideband." },
  { name: "Setting ECU Racing", description: "Remapping ECU Rexxer Pro. Fuel map, ignition, rev limiter." },
  { name: "Pemasangan Knalpot Racing", description: "Jasa pemasangan knalpot aftermarket. Include setting ulang." },
  { name: "Pemasangan CDI Racing", description: "Pemasangan CDI racing plug and play. Include timing setting." },
  { name: "Pengecatan Body Vespa", description: "Cat full set. Epoxy primer, cat warna, clear coat, compounding." },
  { name: "Modifikasi Custom Vespa", description: "Jasa modifikasi custom: classic, cafe racer, scrambler, modern." },

  // SERVIS KHUSUS (8 varian)
  { name: "Service CVT & Pulley", description: "Bersihkan total CVT, ganti roller, cek belt, pelumasan moving part." },
  { name: "Service Karburator Vespa", description: "Bongkar, bersihkan ultrasonic, ganti jet, setel AFR, sinkronisasi." },
  { name: "Service Injeksi Vespa", description: "Bersihkan injector ultrasonic, throttle body, reset TPS, cek fuel pump." },
  { name: "Ganti Kampas Rem Full", description: "Ganti kampas rem depan-belakang + bersihkan kaliper." },
  { name: "Service AC Motor", description: "Service AC motor. Isi freon, bersihkan kondensor, cek kompresor." },
  { name: "Service Speedometer", description: "Perbaikan speedometer digital/analog. Ganti gear, kabel, atau sensor." },
  { name: "Service Kelistrikan", description: "Troubleshooting kelistrikan: kabel, sekring, relay, saklar." },
  { name: "Service Starter Motor", description: "Service dinamo starter. Ganti brush, bersihkan komutator." },
];

const defaultSettings = [
  { key: "tax_rate", value: "11" },
  { key: "mechanic_max_tasks", value: "5" },
  { key: "shift_min_starting_cash", value: "1000000" },
  { key: "stock_low_threshold", value: "5" },
  { key: "enable_ppn", value: "true" },
  { key: "enable_pph", value: "true" },
  { key: "pph_rate", value: "0.5" },
  { key: "ppn_rate", value: "11" },
];

// 26 Users: 2 Admin, 5 Kasir, 19 Mekanik
const userData = [
  { email: ADMIN_EMAIL, fullName: "Admin Utama", phone: "081234500001", role: "ADMIN", isActive: true, isAuthenticated: true },
  { email: "admin2@bengkel.com", fullName: "Admin Kedua", phone: "081234500002", role: "ADMIN", isActive: true, isAuthenticated: true },
  { email: "kasir1@bengkel.com", fullName: "Budi Santoso", phone: "081234500003", role: "CASHIER", isActive: true },
  { email: "kasir2@bengkel.com", fullName: "Siti Rahayu", phone: "081234500004", role: "CASHIER", isActive: true },
  { email: "kasir3@bengkel.com", fullName: "Agus Wijaya", phone: "081234500005", role: "CASHIER", isActive: true },
  { email: "kasir4@bengkel.com", fullName: "Dewi Lestari", phone: "081234500006", role: "CASHIER", isActive: true },
  { email: "kasir5@bengkel.com", fullName: "Rina Marlina", phone: "081234500007", role: "CASHIER", isActive: true },
  { email: "mekanik1@bengkel.com", fullName: "Andi Pratama", phone: "081234500008", role: "MECHANIC", isActive: true },
  { email: "mekanik2@bengkel.com", fullName: "Rudi Hartono", phone: "081234500009", role: "MECHANIC", isActive: true },
  { email: "mekanik3@bengkel.com", fullName: "Dodi Permana", phone: "081234500010", role: "MECHANIC", isActive: true },
  { email: "mekanik4@bengkel.com", fullName: "Hendra Gunawan", phone: "081234500011", role: "MECHANIC", isActive: true },
  { email: "mekanik5@bengkel.com", fullName: "Yanto Supriadi", phone: "081234500012", role: "MECHANIC", isActive: true },
  { email: "mekanik6@bengkel.com", fullName: "Bambang Susilo", phone: "081234500013", role: "MECHANIC", isActive: true },
  { email: "mekanik7@bengkel.com", fullName: "Eko Prasetyo", phone: "081234500014", role: "MECHANIC", isActive: true },
  { email: "mekanik8@bengkel.com", fullName: "Asep Saepudin", phone: "081234500015", role: "MECHANIC", isActive: true },
  { email: "mekanik9@bengkel.com", fullName: "Jajang Mulyana", phone: "081234500016", role: "MECHANIC", isActive: true },
  { email: "mekanik10@bengkel.com", fullName: "Ujang Kurniawan", phone: "081234500017", role: "MECHANIC", isActive: true },
  { email: "mekanik11@bengkel.com", fullName: "Tatang Suherman", phone: "081234500018", role: "MECHANIC", isActive: true },
  { email: "mekanik12@bengkel.com", fullName: "Dadang Hermawan", phone: "081234500019", role: "MECHANIC", isActive: true },
  { email: "mekanik13@bengkel.com", fullName: "Ade Rahmat", phone: "081234500020", role: "MECHANIC", isActive: true },
  { email: "mekanik14@bengkel.com", fullName: "Iwan Setiawan", phone: "081234500021", role: "MECHANIC", isActive: true },
  { email: "mekanik15@bengkel.com", fullName: "Rudi Irawan", phone: "081234500022", role: "MECHANIC", isActive: true },
  { email: "mekanik16@bengkel.com", fullName: "Dedi Supardi", phone: "081234500023", role: "MECHANIC", isActive: true },
  { email: "mekanik17@bengkel.com", fullName: "Cecep Hermansyah", phone: "081234500024", role: "MECHANIC", isActive: true },
  { email: "mekanik18@bengkel.com", fullName: "Asep Sunandar", phone: "081234500025", role: "MECHANIC", isActive: true },
  { email: "mekanik19@bengkel.com", fullName: "Udin Sedunia", phone: "081234500026", role: "MECHANIC", isActive: true },
];

const vespaModels = [
  "Sprint 150", "Primavera 150", "GTS Super 300", "GTS Super Sport 300",
  "GTS Super Tech 300", "PX 150", "S 125", "LX 125", "Vespa 946",
  "Sprint S 150", "Primavera S 150", "Elettrica",
];

const expenseTitles = [
  "Beli ATK Kantor", "Beli Kopi & Snack Tim", "Bensin Test Ride Motor",
  "Biaya Kebersihan Bengkel", "Parkir Harian", "Peralatan Kebersihan",
  "Air Mineral Galon", "Sarung Tangan Mekanik", "Lap Microfiber",
  "Cairan Pembersih Rantai", "Listrik Bulanan", "Internet Bulanan",
  "Peralatan Bengkel", "Seragam Mekanik", "Promosi & Iklan",
  "Beli Oli & Cairan", "Sewa Alat Diagnostik", "Kalibrasi Tools",
  "Perbaikan Kompresor", "Safety Equipment", "Iuran Kebersihan",
  "Langganan Software", "Biaya Training Mekanik", "Bensin Generator",
  "Maintenance AC", "Pest Control", "Biaya Sertifikasi",
];

// ============================================================
// CLEAN DATABASE
// ============================================================
async function cleanDatabase() {
  console.log("🧹 Membersihkan database...\n");
  await prisma.notification.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.mechanicAssignment.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.productPriceHistory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.file.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Database berhasil dibersihkan\n");
}

// ============================================================
// SEEDING - 6 BULAN (Jan 2026 - Jun 2026) ~200 order/bulan
// ============================================================
async function seed() {
  await cleanDatabase();
  console.log("🌱 Mulai seeding database (180 PRODUK - ~200 ORDER/BULAN - JAN-JUN 2026)...\n");

  // ============================================================
  // STEP 1: Settings & Users (26 users)
  // ============================================================
  console.log("⚙️  [1/6] Membuat Settings & Users...");
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
  console.log(`   ✅ ${createdUsers.length} users created (${admins.length} Admin, ${cashiers.length} Kasir, ${mechanics.length} Mekanik)\n`);

  // ============================================================
  // STEP 2: Customers & Vehicles (200 customers)
  // ============================================================
  console.log("👥 [2/6] Membuat 200 Customers & Vehicles...");
  const dbCustomers = [];
  for (let i = 0; i < 200; i++) {
    const customer = await prisma.customer.create({
      data: {
        name: faker.person.fullName(),
        phone: faker.phone.number("08##########"),
      },
    });
    dbCustomers.push(customer);

    const vehicleCount = faker.number.int({ min: 1, max: 3 });
    for (let v = 0; v < vehicleCount; v++) {
      await prisma.vehicle.create({
        data: {
          plateNumber: `B ${faker.number.int({ min: 1000, max: 9999 })} ${faker.string.alpha({ length: 3, casing: "upper" })}`,
          brand: "Vespa",
          model: faker.helpers.arrayElement(vespaModels),
          customerId: customer.id,
        },
      });
    }
  }
  console.log(`   ✅ ${dbCustomers.length} customers created (~${dbCustomers.length * 2} vehicles)\n`);

  // ============================================================
  // STEP 3: Products & Initial Stock (180 produk: 120 sparepart + 60 service)
  // ============================================================
  console.log(`🏍️  [3/6] Membuat Products & Initial Stock (${sparepartData.length + serviceData.length} products)...`);

  const spareparts = [];
  const services = [];

  for (let i = 0; i < sparepartData.length; i++) {
    const price = faker.number.int({ min: 15000, max: 1500000 });
    const cost = Math.floor(price * 0.55);
    // Stok awal besar agar tidak habis (200-500 unit)
    const initialStock = faker.number.int({ min: 200, max: 500 });

    const p = await prisma.product.create({
      data: {
        name: sparepartData[i].name,
        sku: generateSku("SPAREPART", i),
        type: "SPAREPART",
        description: sparepartData[i].description,
        price, cost, stock: initialStock, isActive: true,
      },
    });
    spareparts.push(p);

    await prisma.productPriceHistory.create({
      data: { productId: p.id, price: p.price, cost: p.cost, effectiveFrom: new Date("2026-01-01") },
    });
    await prisma.stockMovement.create({
      data: { productId: p.id, type: "IN", sourceType: "PURCHASE", quantity: initialStock, recordedById: admins[0].id, note: "Stok awal 2026", createdAt: new Date("2026-01-01") },
    });
  }

  for (let i = 0; i < serviceData.length; i++) {
    const price = faker.number.int({ min: 50000, max: 2000000 });
    const cost = Math.floor(price * 0.35);

    const p = await prisma.product.create({
      data: {
        name: serviceData[i].name,
        sku: generateSku("SERVICE", i),
        type: "SERVICE",
        description: serviceData[i].description,
        price, cost, stock: 0, isActive: true,
      },
    });
    services.push(p);

    await prisma.productPriceHistory.create({
      data: { productId: p.id, price: p.price, cost: p.cost, effectiveFrom: new Date("2026-01-01") },
    });
  }
  console.log(`   ✅ ${spareparts.length} spareparts & ${services.length} services created\n`);

  // ============================================================
  // STEP 4: Shifts & Expenses (Jan 2026 - Jun 2026 = 6 bulan)
  // ============================================================
  console.log("🕐 [4/6] Membuat Shifts & Expenses (Jan 2026 - Jun 2026)...\n");

  const shifts = [];
  const startDate = new Date("2026-01-01");
  const endDate = new Date("2026-06-30");

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 0) continue; // Minggu libur

    const cashier = faker.helpers.arrayElement(cashiers);
    const openedAt = new Date(d);
    openedAt.setHours(8, 0, 0, 0);
    const closedAt = new Date(d);
    closedAt.setHours(20, 0, 0, 0);

    const cashSales = faker.number.int({ min: 500000, max: 6000000 });
    const endingCash = 1000000 + cashSales;

    const shift = await prisma.shift.create({
      data: {
        cashierId: cashier.id, status: "CLOSED", startingCash: 1000000,
        endingCash, expectedCash: endingCash, cashSales, cashIn: 0, cashOut: 0, discrepancy: 0,
        openedAt, closedAt,
      },
    });
    shifts.push(shift);

    // Expense 0-3 per shift
    const numExpenses = faker.number.int({ min: 0, max: 3 });
    for (let e = 0; e < numExpenses; e++) {
      await prisma.expense.create({
        data: {
          title: faker.helpers.arrayElement(expenseTitles),
          amount: faker.number.int({ min: 15000, max: 500000 }),
          category: faker.helpers.arrayElement(["SUPPLIES", "MAINTENANCE", "UTILITIES", "RENT", "OTHER"]),
          shiftId: shift.id, recordedById: shift.cashierId, date: openedAt,
        },
      });
    }
  }
  console.log(`   ✅ ${shifts.length} shifts created (ALL CLOSED)\n`);

  // ============================================================
  // STEP 5: Orders (~200 order per bulan, 6 bulan = ~1200 orders)
  // ============================================================
  console.log("📋 [5/6] Membuat Orders (~200/bulan)...\n");

  let orderCount = 0;
  let globalOrderCounter = 0;

  const mechanicDailyTasks = {};
  mechanics.forEach((m) => { mechanicDailyTasks[m.id] = {}; });

  // Stock tracker: simpan stok real-time, pastikan tidak < 0
  const stockTracker = {};
  spareparts.forEach((sp) => { stockTracker[sp.id] = sp.stock; });

  // Restock periodik: setiap bulan restock produk yang stoknya menipis
  const months = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06"];

  // Group shifts by month
  const shiftsByMonth = {};
  for (const shift of shifts) {
    const monthKey = `${shift.openedAt.getFullYear()}-${String(shift.openedAt.getMonth() + 1).padStart(2, "0")}`;
    if (!shiftsByMonth[monthKey]) shiftsByMonth[monthKey] = [];
    shiftsByMonth[monthKey].push(shift);
  }

  for (const monthKey of months) {
    const monthShifts = shiftsByMonth[monthKey] || [];
    if (monthShifts.length === 0) continue;

    // RESTOCK AWAL BULAN: restock produk yang stoknya < 50
    console.log(`   📦 Restock awal bulan ${monthKey}...`);
    const [year, month] = monthKey.split("-").map(Number);
    const restockDate = new Date(year, month - 1, 1, 8, 0, 0);

    for (const sp of spareparts) {
      const currentStock = stockTracker[sp.id];
      if (currentStock < 50) {
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

    // Tambah variasi: ADJUSTMENT acak untuk beberapa produk (stock opname)
    const adjustmentProducts = faker.helpers.arrayElements(spareparts, faker.number.int({ min: 3, max: 8 }));
    for (const sp of adjustmentProducts) {
      const adjQty = faker.number.int({ min: -5, max: 10 });
      if (adjQty !== 0) {
        stockTracker[sp.id] = Math.max(0, stockTracker[sp.id] + adjQty);

        await prisma.product.update({
          where: { id: sp.id },
          data: { stock: { increment: adjQty } },
        });

        await prisma.stockMovement.create({
          data: {
            productId: sp.id,
            type: "ADJUSTMENT",
            sourceType: "ADJUSTMENT",
            quantity: Math.abs(adjQty),
            recordedById: admins[0].id,
            note: adjQty > 0 ? "Stock opname: kelebihan" : "Stock opname: kekurangan",
            createdAt: new Date(restockDate.getTime() + 3600000),
          },
        });
      }
    }

    // Target ~200 order per bulan
    const targetOrders = faker.number.int({ min: 190, max: 210 });
    let ordersThisMonth = 0;

    const shuffledShifts = faker.helpers.shuffle([...monthShifts]);

    for (const shift of shuffledShifts) {
      if (ordersThisMonth >= targetOrders) break;

      const shiftDay = shift.openedAt.toISOString().split("T")[0];

      mechanics.forEach((m) => {
        if (!mechanicDailyTasks[m.id][shiftDay]) mechanicDailyTasks[m.id][shiftDay] = 0;
      });

      // Maksimal 8 order per shift
      const maxOrdersThisShift = Math.min(8, targetOrders - ordersThisMonth);
      const totalOrders = faker.number.int({ min: 3, max: maxOrdersThisShift });
      if (totalOrders <= 0) continue;

      // Distribusi status
      const draftCount = Math.max(0, Math.floor(totalOrders * 0.03));
      const queuedCount = Math.max(0, Math.floor(totalOrders * 0.08));
      const inProgressCount = Math.max(0, Math.floor(totalOrders * 0.12));
      const completedCount = Math.max(0, Math.floor(totalOrders * 0.22));
      const closedCount = Math.max(0, Math.floor(totalOrders * 0.50));
      const cancelledCount = Math.max(0, totalOrders - draftCount - queuedCount - inProgressCount - completedCount - closedCount);

      const orderStatuses = [
        ...Array(draftCount).fill("DRAFT"),
        ...Array(queuedCount).fill("QUEUED"),
        ...Array(inProgressCount).fill("IN_PROGRESS"),
        ...Array(completedCount).fill("COMPLETED"),
        ...Array(closedCount).fill("CLOSED"),
        ...Array(cancelledCount).fill("CANCELLED"),
      ];

      for (let i = orderStatuses.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [orderStatuses[i], orderStatuses[j]] = [orderStatuses[j], orderStatuses[i]];
      }

      for (const status of orderStatuses) {
        globalOrderCounter++;
        ordersThisMonth++;

        const customer = faker.helpers.arrayElement(dbCustomers);
        const vehicles = await prisma.vehicle.findMany({ where: { customerId: customer.id } });
        if (vehicles.length === 0) continue;
        const vehicle = faker.helpers.arrayElement(vehicles);

        let assignedMechanicId = null;
        if (!["DRAFT", "CANCELLED"].includes(status)) {
          const availableMechanics = mechanics.filter((m) => (mechanicDailyTasks[m.id][shiftDay] || 0) < 5);
          if (availableMechanics.length > 0) {
            assignedMechanicId = faker.helpers.arrayElement(availableMechanics).id;
            mechanicDailyTasks[assignedMechanicId][shiftDay] = (mechanicDailyTasks[assignedMechanicId][shiftDay] || 0) + 1;
          }
        }

        let subtotal = 0;
        const selectedItems = [];
        const numItems = faker.number.int({ min: 1, max: 4 });

        for (let j = 0; j < numItems; j++) {
          const isService = faker.datatype.boolean({ probability: 0.35 });
          const product = faker.helpers.arrayElement(isService ? services : spareparts);
          const qty = isService ? 1 : faker.number.int({ min: 1, max: 3 });
          const itemSubtotal = product.price * qty;
          subtotal += itemSubtotal;
          selectedItems.push({ product, qty, subtotal: itemSubtotal, isService });
        }

        const tax = Math.round(subtotal * 0.11);
        const total = subtotal + tax;

        const baseDate = new Date(shift.openedAt);
        baseDate.setMinutes(baseDate.getMinutes() + faker.number.int({ min: 10, max: 600 }));

        let diagnosedAt = null, startedAt = null, completedAt = null, closedAt = null, deletedAt = null;
        let paymentMethod = null, paymentStatus = "PENDING", amountPaid = 0, changeAmount = 0, paidAt = null;

        switch (status) {
          case "DRAFT": break;
          case "QUEUED":
            diagnosedAt = new Date(baseDate);
            paymentMethod = faker.helpers.arrayElement(["CASH", "QRIS"]);
            break;
          case "IN_PROGRESS":
            diagnosedAt = new Date(baseDate);
            startedAt = new Date(baseDate.getTime() + 15 * 60000);
            paymentMethod = faker.helpers.arrayElement(["CASH", "QRIS"]);
            break;
          case "COMPLETED":
            diagnosedAt = new Date(baseDate);
            startedAt = new Date(baseDate.getTime() + 15 * 60000);
            completedAt = new Date(baseDate.getTime() + faker.number.int({ min: 30, max: 150 }) * 60000);
            paymentMethod = faker.helpers.arrayElement(["CASH", "QRIS"]);
            paymentStatus = "PAID"; paidAt = completedAt;
            amountPaid = paymentMethod === "CASH" ? total + faker.number.int({ min: 0, max: 200000 }) : total;
            changeAmount = paymentMethod === "CASH" ? amountPaid - total : 0;
            break;
          case "CLOSED":
            diagnosedAt = new Date(baseDate);
            startedAt = new Date(baseDate.getTime() + 15 * 60000);
            completedAt = new Date(baseDate.getTime() + faker.number.int({ min: 30, max: 150 }) * 60000);
            closedAt = new Date(baseDate.getTime() + faker.number.int({ min: 60, max: 200 }) * 60000);
            paymentMethod = faker.helpers.arrayElement(["CASH", "QRIS"]);
            paymentStatus = "PAID"; paidAt = closedAt;
            amountPaid = paymentMethod === "CASH" ? total + faker.number.int({ min: 0, max: 200000 }) : total;
            changeAmount = paymentMethod === "CASH" ? amountPaid - total : 0;
            break;
          case "CANCELLED":
            deletedAt = new Date(baseDate.getTime() + 10 * 60000);
            break;
        }

        const orderNumber = generateOrderNumber(baseDate, globalOrderCounter);
        const order = await prisma.order.create({
          data: {
            orderNumber, status, subtotal, tax, total,
            diagnosedAt, startedAt, completedAt, closedAt, deletedAt,
            cashierId: shift.cashierId, shiftId: shift.id,
            customerId: customer.id, vehicleId: vehicle.id,
            createdAt: baseDate,
            updatedAt: closedAt || completedAt || startedAt || diagnosedAt || baseDate,
          },
        });
        orderCount++;

        for (const item of selectedItems) {
          const orderItem = await prisma.orderItem.create({
            data: {
              orderId: order.id, productId: item.product.id,
              productNameSnapshot: item.product.name, quantity: item.qty,
              unitPrice: item.product.price, unitCostSnapshot: item.product.cost,
              subtotal: item.subtotal,
            },
          });

          if (item.isService && assignedMechanicId && !["DRAFT", "CANCELLED"].includes(status)) {
            await prisma.mechanicAssignment.create({
              data: {
                orderItemId: orderItem.id, mechanicId: assignedMechanicId,
                startAt: ["QUEUED"].includes(status) ? null : startedAt,
                endAt: ["QUEUED", "IN_PROGRESS"].includes(status) ? null : completedAt,
              },
            });
          }

          // STOCK OUT: hanya jika sparepart dan status pengerjaan sudah mulai
          // PASTIKAN STOK CUKUP SEBELUM MENGURANGI
          if (item.product.type === "SPAREPART" && ["IN_PROGRESS", "COMPLETED", "CLOSED"].includes(status)) {
            if (stockTracker[item.product.id] >= item.qty) {
              await prisma.stockMovement.create({
                data: {
                  productId: item.product.id, type: "OUT", sourceType: "SALE",
                  quantity: item.qty, orderItemId: orderItem.id,
                  recordedById: shift.cashierId, createdAt: startedAt || diagnosedAt,
                },
              });
              await prisma.product.update({ where: { id: item.product.id }, data: { stock: { decrement: item.qty } } });
              stockTracker[item.product.id] -= item.qty;
            } else {
              // Jika stok tidak cukup, skip pengurangan (stok tetap tidak berubah, tidak minus)
              // Log peringatan di note
              await prisma.stockMovement.create({
                data: {
                  productId: item.product.id, type: "OUT", sourceType: "SALE",
                  quantity: 0, orderItemId: orderItem.id,
                  recordedById: shift.cashierId,
                  note: `PERINGATAN: Stok tidak mencukupi untuk ${item.product.name}. Order tetap diproses.`,
                  createdAt: startedAt || diagnosedAt,
                },
              });
            }
          }
        }

        if (!["DRAFT", "CANCELLED"].includes(status)) {
          await prisma.payment.create({
            data: { orderId: order.id, method: paymentMethod, amountPaid, change: changeAmount, status: paymentStatus, paidAt },
          });
        }

        // Status flow history
        const statusFlow = [];
        statusFlow.push({ status: "DRAFT", note: "Pesanan dibuat", changedById: shift.cashierId, createdAt: baseDate });

        if (["QUEUED", "IN_PROGRESS", "COMPLETED", "CLOSED"].includes(status)) {
          statusFlow.push({ status: "QUEUED", note: "Masuk antrian pengerjaan", changedById: shift.cashierId, createdAt: diagnosedAt || new Date(baseDate.getTime() + 5 * 60000) });
        }
        if (["IN_PROGRESS", "COMPLETED", "CLOSED"].includes(status)) {
          statusFlow.push({ status: "IN_PROGRESS", note: `Mekanik ${mechanics.find((m) => m.id === assignedMechanicId)?.fullName || "Unknown"} mulai pengerjaan`, changedById: assignedMechanicId || shift.cashierId, createdAt: startedAt || new Date(baseDate.getTime() + 20 * 60000) });
        }
        if (["COMPLETED", "CLOSED"].includes(status)) {
          statusFlow.push({ status: "COMPLETED", note: "Pengerjaan selesai, menunggu pembayaran", changedById: assignedMechanicId || shift.cashierId, createdAt: completedAt || new Date(baseDate.getTime() + 60 * 60000) });
        }
        if (status === "CLOSED") {
          statusFlow.push({ status: "CLOSED", note: "Pembayaran lunas, motor diambil pelanggan", changedById: shift.cashierId, createdAt: closedAt || new Date(baseDate.getTime() + 90 * 60000) });
        }
        if (status === "CANCELLED") {
          statusFlow.push({ status: "CANCELLED", note: "Pesanan dibatalkan", changedById: shift.cashierId, createdAt: deletedAt || new Date(baseDate.getTime() + 10 * 60000) });
        }

        for (const flow of statusFlow) {
          await prisma.orderStatusHistory.create({
            data: { orderId: order.id, status: flow.status, note: flow.note, changedById: flow.changedById, createdAt: flow.createdAt },
          });
        }
      }
    }
  }
  console.log(`   ✅ ${orderCount} orders created\n`);

  // ============================================================
  // STEP 6: Notifications
  // ============================================================
  console.log("🔔 [6/6] Membuat Notifications...");
  await prisma.notification.create({
    data: { title: "Seeding Selesai", message: `Database berhasil di-seed.\n\nProduk: ${spareparts.length + services.length}\nUsers: ${createdUsers.length}\nCustomers: ${dbCustomers.length}\nOrders: ${orderCount}\nShifts: ${shifts.length}`, type: "SUCCESS", userId: admins[0].id },
  });
  for (const user of createdUsers) {
    if (user.role === "ADMIN") continue;
    await prisma.notification.create({
      data: { title: "Selamat Bekerja", message: `Halo ${user.fullName}, sistem siap digunakan dengan data production.`, type: "INFO", userId: user.id },
    });
  }
  console.log(`   ✅ ${createdUsers.length} notifications created\n`);

  // ============================================================
  // TOTAL ESTIMASI
  // ============================================================
  const totalEstimasi =
    defaultSettings.length + createdUsers.length + dbCustomers.length +
    dbCustomers.length * 2 + (spareparts.length + services.length) +
    (spareparts.length + services.length) + spareparts.length + shifts.length +
    Math.floor(shifts.length * 1.5) + orderCount + Math.floor(orderCount * 2.5) +
    Math.floor(orderCount * 0.4) + Math.floor(orderCount * 0.9) +
    Math.floor(orderCount * 3.5) + createdUsers.length +
    spareparts.length * 7; // Restock + adjustment bulanan

  console.log("==================================================");
  console.log("✅ SEEDING BERHASIL");
  console.log("==================================================");
  console.log(`⚙️  Settings       : ${defaultSettings.length}`);
  console.log(`👥 Users          : ${createdUsers.length}`);
  console.log(`👤 Customers      : ${dbCustomers.length}`);
  console.log(`🚗 Vehicles       : ~${dbCustomers.length * 2}`);
  console.log(`🏍️  Spareparts     : ${spareparts.length}`);
  console.log(`🔧 Services       : ${services.length}`);
  console.log(`🕐 Shifts         : ${shifts.length}`);
  console.log(`💰 Expenses       : ~${Math.floor(shifts.length * 1.5)}`);
  console.log(`📋 Orders         : ${orderCount}`);
  console.log(`📦 OrderItems     : ~${Math.floor(orderCount * 2.5)}`);
  console.log(`🔧 Assignments    : ~${Math.floor(orderCount * 0.4)}`);
  console.log(`💳 Payments       : ~${Math.floor(orderCount * 0.9)}`);
  console.log(`📜 Status History : ~${Math.floor(orderCount * 3.5)}`);
  console.log(`📊 Stock Movements: ~${spareparts.length * 7 + Math.floor(orderCount * 1.5)}`);
  console.log(`🔔 Notifications  : ${createdUsers.length}`);
  console.log(`--------------------------------------------------`);
  console.log(`📊 TOTAL ESTIMASI : ~${totalEstimasi} data`);
  console.log(`📅 Periode        : Jan 2026 - Jun 2026 (6 bulan)`);
  console.log(`📊 Rata-rata      : ~${Math.round(orderCount / 6)} order/bulan`);
  console.log("==================================================");
}

seed()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("❌ Seeding gagal:", e);
    await prisma.$disconnect();
    process.exit(1);
  });