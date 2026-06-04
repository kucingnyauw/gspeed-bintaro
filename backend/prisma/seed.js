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
// DATA MASTER (DENGAN DESKRIPSI)
// ============================================================
const sparepartData = [
  { name: "Kampas Rem Depan Vespa Sprint", description: "Kampas rem depan original untuk Vespa Sprint 150. Material semi-metallic memberikan daya cengkeram optimal dan tahan panas. Cocok untuk penggunaan harian maupun touring jarak jauh." },
  { name: "Kampas Rem Belakang Vespa Primavera", description: "Kampas rem belakang berkualitas tinggi untuk Vespa Primavera. Teknologi ceramic composite memastikan pengereman halus tanpa bunyi. Lifetime lebih panjang dibanding kampas standar." },
  { name: "Kampas Rem Depan Racing Malossi", description: "Kampas rem racing Malossi untuk performa maksimal. Material sintered metal memberikan grip superior pada kecepatan tinggi. Direkomendasikan untuk penggunaan racing dan harian sporty." },
  { name: "Oli Mesin Motul 2T", description: "Oli mesin 2-tak Motul 510 Technosynthese. Formula ester synthetic memberikan pelumasan optimal, mengurangi asap, dan membersihkan mesin. Cocok untuk Vespa PX, Sprint, dan model 2T lainnya." },
  { name: "Oli Mesin Motul 4T", description: "Oli mesin 4-tak Motul 7100 full synthetic. Memberikan perlindungan maksimal pada mesin Vespa matic. Mengurangi gesekan, menjaga kebersihan mesin, dan memperpanjang umur mesin." },
  { name: "Oli Mesin Castrol Power 1", description: "Oli mesin Castrol Power 1 10W-40 semi-synthetic. Teknologi Power Release Formula memberikan akselerasi lebih responsif. Cocok untuk Vespa GTS, Primavera, dan Sprint 4T." },
  { name: "Oli Gardan Vespa Matic", description: "Oli gardan khusus Vespa matic SAE 80W-90. Melindungi gear transmisi dari keausan, mengurangi suara kasar, dan memastikan perpindahan gigi halus. Ganti setiap 8.000 km." },
  { name: "Busi NGK Racing Vespa", description: "Busi NGK Iridium IX Racing untuk Vespa. Elektroda iridium ultra-tipis memberikan percikan api lebih kuat dan efisien. Akselerasi lebih responsif dan konsumsi bahan bakar lebih irit." },
  { name: "Busi Denso Iridium Racing", description: "Busi Denso Iridium Power dengan teknologi 0.4mm center electrode. Memberikan pembakaran sempurna, start mudah di pagi hari, dan performa mesin optimal di semua RPM." },
  { name: "Busi NGK Platinum Vespa", description: "Busi NGK G-Power Platinum untuk Vespa harian. Elektroda platinum memberikan umur pakai 2x lebih lama dibanding busi standar. Performa stabil dan harga terjangkau." },
  { name: "Filter Udara Malossi Racing", description: "Filter udara racing Malossi Red Sponge. Material sponge berpori besar meningkatkan airflow ke mesin. Washable dan reusable, cocok untuk setup racing dan harian kencang." },
  { name: "Filter Udara Standar Vespa", description: "Filter udara original Vespa berkualitas OEM. Menyaring debu dan kotoran dengan efisiensi tinggi. Menjaga performa mesin tetap optimal dan konsumsi BBM irit." },
  { name: "Filter Oli Vespa Matic", description: "Filter oli Vespa matic original. Menyaring partikel dan kotoran dari oli mesin untuk melindungi komponen mesin. Ganti setiap 5.000 km atau bersamaan dengan ganti oli." },
  { name: "Filter Bensin Vespa", description: "Filter bensin Vespa dengan mesh stainless steel. Menyaring kotoran dan air dari bahan bakar sebelum masuk karburator/injektor. Mencegah tersumbatnya sistem bahan bakar." },
  { name: "Rantai Keteng Vespa PX", description: "Rantai keteng Vespa PX 150 original DID Japan. Material hardened steel menjamin ketahanan dan presisi timing mesin. Ganti setiap 20.000 km untuk performa optimal." },
  { name: "Rantai Keteng Vespa Sprint", description: "Rantai keteng Vespa Sprint 150. Kualitas OEM dengan ketahanan tinggi terhadap stretching. Memastikan timing valve akurat untuk performa mesin maksimal." },
  { name: "Gear Set Rasio 4.0 Racing", description: "Gear set rasio 4.0 racing untuk Vespa. Memberikan akselerasi lebih cepat dengan top speed optimal. Material forged steel tahan beban tinggi. Cocok untuk harian sporty." },
  { name: "Gear Set Rasio 3.8 Standar", description: "Gear set rasio 3.8 standar Vespa. Rasio original untuk keseimbangan akselerasi dan top speed. Nyaman untuk riding harian dalam kota dengan konsumsi BBM efisien." },
  { name: "Gear Set Rasio 4.2 Drag", description: "Gear set rasio 4.2 untuk drag race. Akselerasi brutal di lintasan pendek. Material chromoly steel super kuat. Khusus racing, tidak disarankan untuk harian." },
  { name: "Ban Luar Pirelli Angel Scooter 110/70", description: "Ban Pirelli Angel Scooter 110/70-12. Pattern multi-compound memberikan grip optimal di kondisi basah maupun kering. Mileage panjang cocok untuk daily commute." },
  { name: "Ban Luar Michelin City Grip 120/70", description: "Ban Michelin City Grip 120/70-12. Teknologi silica compound memberikan cengkeraman superior di jalan basah. Pattern anti-aquaplaning untuk keamanan maksimal." },
  { name: "Ban Luar Metzeler Sportec 130/70", description: "Ban Metzeler Sportec Street 130/70-12. Ban sport touring dengan grip racing. Compound dual memberikan mileage baik di tengah dan grip maksimal di sisi ban." },
  { name: "Ban Dalam Vespa 10 Inch", description: "Ban dalam Vespa ukuran 10 inch. Karet butyl berkualitas tinggi tahan bocor halus. Cocok untuk Vespa klasik dengan velg 10 inch. Pentil lurus standar." },
  { name: "Ban Dalam Vespa 12 Inch", description: "Ban dalam Vespa ukuran 12 inch. Material karet elastis premium dengan ketebalan merata. Tahan tekanan tinggi dan perubahan suhu. Pentil bengkok untuk velg racing." },
  { name: "Aki Kering MotoBatt 12V", description: "Aki kering MotoBatt MBTZ10S 12V maintenance free. Teknologi AGM (Absorbent Glass Mat) tahan getaran dan posisi tidur. Start mudah, umur pakai 3x lebih lama." },
  { name: "Aki Kering Yuasa YTZ7S", description: "Aki kering Yuasa YTZ7S original Japan. Factory activated, siap pakai tanpa isi air aki. Cranking power besar untuk start mesin cepat. Tahan getaran dan kebocoran." },
  { name: "Aki Kering GS Astra", description: "Aki kering GS Astra MF 12V 6Ah. Maintenance free dengan teknologi calcium-calcium. Harga terjangkau kualitas terjamin. Garansi resmi 6 bulan." },
  { name: "Lampu Depan LED Proyektor Vespa", description: "Lampu depan LED proyektor untuk Vespa GTS/Sprint. Teknologi projector lens memberikan cahaya fokus dan terang. Cut-off jelas, tidak menyilaukan pengendara lain." },
  { name: "Lampu Belakang LED Vespa GTS", description: "Lampu belakang LED custom Vespa GTS. LED chip 5050 super terang dengan 3 mode: running, rem, dan sein. Plug and play tanpa potong kabel." },
  { name: "Lampu Sein LED Sequential", description: "Lampu sein LED sequential flowing. Efek bergerak mengalir seperti mobil premium. LED amber super terang, waterproof, dan tahan getaran. Universal fit untuk Vespa." },
  { name: "Kampas Kopling Malossi Fly Clutch", description: "Kampas kopling racing Malossi Fly Clutch. Material kevlar-carbon memberikan grip maksimal tanpa slip. Tahan panas tinggi untuk pemakaian racing dan touring." },
  { name: "Kampas Kopling Racing Polini", description: "Kampas kopling Polini Speed Clutch. Material sintered metal untuk transfer tenaga maksimal. Engagement point presisi, cocok untuk setup mesin racing high performance." },
  { name: "Shockbreaker Depan Bitubo Vespa GTS", description: "Shockbreaker depan Bitubo untuk Vespa GTS 300. Fully adjustable preload, compression, dan rebound. Tabung gas eksternal untuk stabilitas redaman maksimal." },
  { name: "Shockbreaker Belakang Ohlins Vespa", description: "Shockbreaker belakang Ohlins HO 142 untuk Vespa. Kualitas premium Swedia dengan adjustable preload dan rebound. Handling superior di tikungan dan jalan bergelombang." },
  { name: "Shockbreaker Depan YSS Racing", description: "Shockbreaker depan YSS Racing Series. Tabung gas dengan adjustable preload. Piston 30mm memberikan redaman progresif. Upgrade signifikan dari shockbreaker standar." },
  { name: "Bearing Roda Depan SKF Premium", description: "Bearing roda depan SKF Explorer Series. Seal 2RSH melindungi dari air dan debu. Putaran halus dan umur pakai panjang. Made in Italy kualitas terjamin." },
  { name: "Bearing Roda Belakang NTN Japan", description: "Bearing roda belakang NTN original Japan. Precision grade ABEC-3 untuk putaran presisi tinggi. Seal contact rubber tahan air dan kotoran." },
  { name: "Bearing Steering Koyo", description: "Bearing steering Koyo tapered roller. Mengurangi berat setang dan meningkatkan stabilitas kemudi. Kualitas OEM untuk berbagai model Vespa." },
  { name: "Kabel Gas Domino Racing", description: "Kabel gas Domino Racing Quick Action. Kabel stainless steel anti-karat dengan housing teflon liner. Tarikan gas lebih ringan dan responsif. Universal Vespa." },
  { name: "Kabel Rem Depan Vespa Original", description: "Kabel rem depan Vespa original Piaggio. Panjang presisi sesuai model. Housing PVC tahan cuaca dan inner cable galvanis anti-karat." },
  { name: "Kabel Kopling Vespa PX", description: "Kabel kopling Vespa PX 150 original. Inner cable 2.5mm kuat dengan housing spiral steel. Tarikan kopling halus dan tidak mudah putus." },
  { name: "Piston Kit Polini 200cc Racing", description: "Piston kit Polini 200cc forged racing. Diameter 68mm dengan ring racing. Material aluminium forged T6 ringan dan tahan panas. Meningkatkan kompresi dan tenaga." },
  { name: "Piston Kit Malossi 175cc", description: "Piston kit Malossi 175cc cast performance. Diameter 64mm dengan coating anti-friction. Piston pin 15mm dengan circlip racing. Cocok untuk bore up harian." },
  { name: "Piston Kit Standar 150cc", description: "Piston kit standar Vespa 150cc OEM quality. Diameter 62mm dengan ring 3 lapis. Material cast aluminium dengan coating graphite. Ideal untuk rebuild mesin standar." },
  { name: "Spion Oval Chrome Vespa", description: "Spion oval chrome Vespa classic. Kaca cembung wide angle untuk pandangan lebih luas. Stem adjustable dengan joint ball. Finishing chrome mengkilap tahan karat." },
  { name: "Spion Lipat Racing CNC", description: "Spion lipat racing CNC aluminium. Desain aerodinamis dengan bracket 360° adjustable. Kaca blue tint anti-glare. Lipat praktis untuk parkir di tempat sempit." },
  { name: "Spion Bar End MotoGadget", description: "Spion bar end MotoGadget Glassless. Kaca Hindsight technology tanpa frame. Pemasangan di ujung stang untuk tampilan minimalis racing. Buatan Jerman." },
  { name: "Knalpot Racing Akrapovic Vespa", description: "Knalpot Akrapovic Racing Line titanium untuk Vespa. Suara deep bass khas Akra. Bobot ringan 60% lebih ringan dari standar. Power increase +3.5 HP." },
  { name: "Knalpot Racing Yoshimura Vespa", description: "Knalpot Yoshimura Tri-Oval stainless steel. Teknologi TRI-Oval untuk flow gas buang optimal. Suara racing khas Yoshimura. Include dB killer untuk harian." },
  { name: "Knalpot Racing Leo Vince", description: "Knalpot Leo Vince GP Corsa. Desain MotoGP style dengan carbon end cap. Suara agresif dengan performa meningkat. E-approved legal untuk jalan raya." },
  { name: "CDI Racing BRT Powermax", description: "CDI racing BRT Powermax dual band. Teknologi dual curve untuk akselerasi bawah dan top speed atas. Limiter 12.000 RPM. Plug and play tanpa ubahan kabel." },
  { name: "CDI Racing Rextor Adjustable", description: "CDI racing Rextor Programmable. Adjustable timing curve 0-60 derajat. 5 preset map untuk berbagai kebutuhan. Monitor RPM realtime via LED indikator." },
  { name: "CDI Standar Vespa Original", description: "CDI standar Vespa original Piaggio. Timing fixed sesuai spesifikasi pabrik. Kualitas OEM terjamin untuk penggunaan harian. Cocok untuk motor standar." },
  { name: "Paking Mesin Set Vespa PX", description: "Paking mesin set Vespa PX 150 lengkap. Termasuk paking head, blok, crankcase, dan intake. Material asbestos-free tahan panas tinggi. Set 12 pcs." },
  { name: "Paking Mesin Set Vespa Sprint", description: "Paking mesin set Vespa Sprint 150. Kualitas OEM dengan presisi laser cut. Material graphite composite tahan kompresi tinggi. Set lengkap 10 pcs." },
  { name: "Seal Mesin Vespa 2T Full Set", description: "Seal mesin full set Vespa 2-tak. Termasuk seal crank, seal gigi transmisi, dan seal kopling. Material nitrile rubber tahan oli dan panas. Set 8 pcs." },
  { name: "Roller CVT Malossi 12gr", description: "Roller CVT Malossi 12 gram. Material special plastic dengan inti kuningan. Tahan aus dan tidak mudah penyok. Mempengaruhi karakter akselerasi dan top speed." },
  { name: "Roller CVT Polini 10gr", description: "Roller CVT Polini 10 gram. Bobot ringan untuk akselerasi lebih cepat. Material composite low friction. Cocok untuk setup racing dan harian responsif." },
  { name: "Roller CVT Dr Pulley 11gr", description: "Roller CVT Dr Pulley Sliding 11 gram. Desain unik dengan sliding surface. Mengurangi gesekan pada ramp plate. Akselerasi halus tanpa hentakan." },
  { name: "Belt CVT Vespa Matic Racing", description: "Belt CVT racing reinforced untuk Vespa matic. Material aramid fiber dengan lebar 24mm. Tahan panas dan tidak mudah mulur. Meningkatkan transfer tenaga ke roda." },
];

const serviceData = [
  { name: "Service Ringan Vespa Matic", description: "Service ringan meliputi ganti oli mesin, pembersihan filter udara, pengecekan CVT, pengecekan rem, dan pengecekan kelistrikan. Estimasi pengerjaan 1-2 jam." },
  { name: "Service Ringan Vespa 2-Tak", description: "Service ringan Vespa 2-tak meliputi ganti oli samping, pembersihan karburator, setel platina/ignition timing, pembersihan busi, dan pengecekan kompresi. Estimasi 1-2 jam." },
  { name: "Service Ringan Vespa 4-Tak", description: "Service ringan Vespa 4-tak meliputi ganti oli mesin, pembersihan throttle body, pengecekan valve clearance, dan pengecekan sistem injeksi. Estimasi 1-2 jam." },
  { name: "Tune Up Mesin 2-Tak", description: "Tune up menyeluruh mesin 2-tak meliputi setel karburator, setel timing pengapian, pembersihan exhaust port, dan pengecekan reed valve. Meningkatkan performa dan efisiensi." },
  { name: "Tune Up Mesin 4-Tak", description: "Tune up mesin 4-tak meliputi penyetelan valve clearance, pembersihan injector/throttle body, reset ECU, dan pengecekan sensor. Performa mesin kembali optimal." },
  { name: "Tune Up Racing Performance", description: "Tune up racing meliputi dyno test, setting karburator/injeksi untuk performa maksimal, penyesuaian timing pengapian, dan fine tuning AFR. Termasuk printout dyno chart." },
  { name: "Ganti Oli Mesin & Gardan", description: "Paket ganti oli mesin dan gardan lengkap. Termasuk oli mesin full synthetic 1.2L dan oli gardan 250ml. Pengecekan filter oli dan pembersihan magnet drain plug." },
  { name: "Ganti Oli Mesin Sintetik", description: "Ganti oli mesin dengan oli full synthetic premium. Pilihan Motul 7100 atau Castrol Power 1. Termasuk jasa ganti dan pengecekan kebocoran. Cocok untuk Vespa matic dan sport." },
  { name: "Ganti Oli Mesin Racing", description: "Ganti oli racing special untuk setup mesin high performance. Oli Motul 300V dengan ester core technology. Memberikan perlindungan maksimal pada RPM tinggi." },
  { name: "Cuci Motor Detailing Premium", description: "Cuci motor detailing premium meliputi foam wash, pembersihan detail dengan kuas, poles body, coating wax, pembersihan mesin, dan semir ban. Motor seperti baru keluar dealer." },
  { name: "Cuci Motor Biasa", description: "Cuci motor standar meliputi semprot air, foam wash, bilas, keringkan, dan semir ban. Pengerjaan cepat 15-20 menit. Bersih bebas debu dan lumpur." },
  { name: "Cuci Motor + Poles Body", description: "Cuci motor + poles body untuk menghilangkan swirl marks dan baret halus. Menggunakan dual action polisher dan compound premium. Hasil glossy seperti kaca." },
  { name: "Balancing & Spooring Roda", description: "Balancing dan spooring roda depan-belakang. Menggunakan mesin balancing digital. Menghilangkan getaran di setang dan meningkatkan stabilitas handling." },
  { name: "Overhaul Mesin 2-Tak Full", description: "Overhaul total mesin 2-tak meliputi turun mesin, ganti piston kit, boring silinder, ganti semua seal dan bearing, serta penyetelan ulang. Mesin kembali seperti baru." },
  { name: "Overhaul Mesin 4-Tak Full", description: "Overhaul total mesin 4-tak meliputi turun mesin, ganti ring piston, skir klep, ganti seal klep, ganti tensioner rantai keteng, dan ganti gasket full set." },
  { name: "Overhaul Mesin Racing", description: "Overhaul spesifikasi racing meliputi bore up, porting polish, ganti piston forged, camshaft racing, dan pengaturan ulang ECU/karburator. Output tenaga maksimal." },
  { name: "Tambal Ban Tubeless", description: "Tambal ban tubeless dengan metode mushroom plug dari dalam. Lebih aman dan permanen dibanding tambal tusuk dari luar. Termasuk balancing roda." },
  { name: "Tambal Ban Biasa", description: "Tambal ban biasa (tube type) dengan patch dingin. Proses lem dan patch rubber. Cocok untuk ban dalam Vespa klasik. Pengerjaan cepat 15 menit." },
  { name: "Ganti Ban Baru + Balancing", description: "Paket ganti ban baru termasuk balancing dan pemasangan. Tersedia berbagai merek: Pirelli, Michelin, Metzeler. Termasuk pentil baru dan pembuangan ban bekas." },
  { name: "Service CVT & Pulley", description: "Service CVT dan pulley meliputi pembersihan total, ganti roller, pengecekan belt, pembersihan torque driver, dan pelumasan moving part. Tarikan kembali responsif." },
  { name: "Service Karburator Vespa", description: "Service karburator meliputi pembongkaran, pembersihan ultrasonic, ganti main jet/pilot jet sesuai kebutuhan, setel AFR, dan sinkronisasi. Mesin lebih halus dan irit." },
  { name: "Service Injeksi Vespa Matic", description: "Service sistem injeksi meliputi pembersihan injector dengan ultrasonic cleaner, pembersihan throttle body, reset TPS, dan pengecekan fuel pump. Tarikan lebih responsif." },
  { name: "Ganti Kampas Rem Depan & Belakang", description: "Paket ganti kampas rem depan dan belakang. Termasuk pembersihan kaliper, piston, dan sliding pin. Pilihan kampas standar atau racing sesuai kebutuhan." },
  { name: "Bore Up Mesin 175cc", description: "Bore up mesin 150cc ke 175cc menggunakan piston kit Malossi. Termasuk boring silinder, porting intake/exhaust, dan penyetelan ulang. Estimasi kenaikan 3-4 HP." },
  { name: "Bore Up Mesin 200cc Racing", description: "Bore up ekstrem ke 200cc menggunakan piston Polini forged. Termasuk boring dan honing presisi CNC, porting polish full, dan dyno tuning. Output hingga 20+ HP." },
  { name: "Setting Karburator Racing", description: "Setting karburator racing meliputi penggantian jet sesuai setup mesin, setel ketinggian pelampung, setel jarum skep, dan fine tuning AFR menggunakan wideband O2 sensor." },
  { name: "Setting ECU Racing Vespa", description: "Setting ECU racing menggunakan software Rexxer Pro. Remapping fuel map, ignition timing, rev limiter, dan speed limiter. Termasuk dyno test before-after." },
  { name: "Pemasangan Knalpot Racing", description: "Jasa pemasangan knalpot racing aftermarket. Termasuk penyesuaian bracket, pemasangan gasket baru, dan pengecekan kebocoran. Tersedia juga jasa setting ulang." },
  { name: "Pemasangan CDI Racing", description: "Pemasangan CDI racing plug and play. Termasuk penyetelan timing dasar dan pengecekan kelistrikan. Bisa request setting timing sesuai karakter mesin." },
  { name: "Overhaul Suspensi Depan", description: "Overhaul suspensi depan meliputi ganti seal, ganti oli, pembersihan tabung, dan pengecekan bushing. Handling kembali mantap tanpa bocor." },
  { name: "Ganti Seal Shockbreaker", description: "Ganti seal shockbreaker depan-belakang. Termasuk pembersihan tabung, ganti oli, dan pengecekan shaft. Satu set untuk shockbreaker depan atau belakang." },
  { name: "Setting Suspensi Racing", description: "Setting suspensi untuk racing meliputi penyesuaian preload, rebound, dan compression damping. Menggunakan tools khusus untuk pengukuran sag dan stroke." },
  { name: "Pengecatan Body Vespa", description: "Jasa pengecatan body Vespa full set. Mulai dari pengamplasan, epoxy primer, cat warna pilihan, clear coat, dan compounding. Hasil showroom quality dengan garansi." },
  { name: "Pemasangan Aksesoris Racing", description: "Jasa pemasangan berbagai aksesoris racing: rearset, clip-on handlebar, windshield, belly pan, dll. Pengerjaan rapi dan presisi sesuai standar racing." },
  { name: "Modifikasi Custom Vespa", description: "Jasa modifikasi custom Vespa sesuai permintaan. Dari classic resto, cafe racer, scrambler, hingga modern custom. Konsultasi gratis dan pengerjaan detail." },
];

const defaultSettings = [
  { key: "tax_rate", value: "11" },
  { key: "mechanic_max_tasks", value: "5" },
  { key: "shift_min_starting_cash", value: "1000000" },
  { key: "stock_low_threshold", value: "5" },
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
  "Sprint 150",
  "Primavera 150",
  "GTS Super 300",
  "GTS Super Sport 300",
  "GTS Super Tech 300",
  "PX 150",
  "S 125",
  "LX 125",
  "Vespa 946",
  "Sprint S 150",
  "Primavera S 150",
  "Elettrica",
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
// SEEDING
// ============================================================
async function seed() {
  await cleanDatabase();
  console.log("🌱 Mulai seeding database (PRODUCTION VOLUME - MAX 7000 DATA)...\n");

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
  // STEP 2: Customers & Vehicles (80 customers)
  // ============================================================
  console.log("👥 [2/6] Membuat 80 Customers & Vehicles...");

  const dbCustomers = [];
  for (let i = 0; i < 80; i++) {
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

  console.log(`   ✅ ${dbCustomers.length} customers created (~${Math.floor(dbCustomers.length * 2)} vehicles)\n`);

  // ============================================================
  // STEP 3: Products & Initial Stock (DENGAN DESKRIPSI)
  // ============================================================
  console.log(`🏍️  [3/6] Membuat Products & Initial Stock (${sparepartData.length + serviceData.length} products)...`);

  const spareparts = [];
  const services = [];

  for (let i = 0; i < sparepartData.length; i++) {
    const price = faker.number.int({ min: 15000, max: 1000000 });
    const cost = Math.floor(price * 0.6);
    const initialStock = faker.number.int({ min: 50, max: 150 });

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
        effectiveFrom: new Date("2026-01-01"),
      },
    });

    await prisma.stockMovement.create({
      data: {
        productId: p.id,
        type: "IN",
        sourceType: "PURCHASE",
        quantity: initialStock,
        recordedById: admins[0].id,
        note: "Stok awal",
        createdAt: new Date("2026-01-01"),
      },
    });
  }

  for (let i = 0; i < serviceData.length; i++) {
    const price = faker.number.int({ min: 50000, max: 1000000 });
    const cost = Math.floor(price * 0.4);

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
        effectiveFrom: new Date("2026-01-01"),
      },
    });
  }

  console.log(`   ✅ ${spareparts.length} spareparts & ${services.length} services created (dengan deskripsi)\n`);

  // ============================================================
  // STEP 4: Shifts & Expenses (3 bulan: Jan-Mar 2026)
  // ============================================================
  console.log("🕐 [4/6] Membuat Shifts & Expenses (Jan - Mar 2026)...");

  const shifts = [];
  const startDate = new Date("2026-01-01");
  const endDate = new Date("2026-03-31");

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 0) continue; // Minggu libur

    const cashier = faker.helpers.arrayElement(cashiers);

    const openedAt = new Date(d);
    openedAt.setHours(8, 0, 0, 0);

    const closedAt = new Date(d);
    closedAt.setHours(20, 0, 0, 0);

    const cashSales = faker.number.int({ min: 800000, max: 8000000 });
    const endingCash = 1000000 + cashSales;

    const shift = await prisma.shift.create({
      data: {
        cashierId: cashier.id,
        status: "CLOSED",
        startingCash: 1000000,
        endingCash: endingCash,
        expectedCash: endingCash,
        cashSales: cashSales,
        cashIn: 0,
        cashOut: 0,
        discrepancy: 0,
        openedAt,
        closedAt: closedAt,
      },
    });
    shifts.push(shift);

    const numExpenses = faker.number.int({ min: 1, max: 3 });
    for (let e = 0; e < numExpenses; e++) {
      await prisma.expense.create({
        data: {
          title: faker.helpers.arrayElement(expenseTitles),
          amount: faker.number.int({ min: 15000, max: 300000 }),
          category: faker.helpers.arrayElement(["SUPPLIES", "MAINTENANCE", "UTILITIES", "RENT", "OTHER"]),
          shiftId: shift.id,
          recordedById: shift.cashierId,
          date: openedAt,
        },
      });
    }
  }

  console.log(`   ✅ ${shifts.length} shifts created (ALL CLOSED)\n`);

  // ============================================================
  // STEP 5: Orders
  // ============================================================
  console.log("📋 [5/6] Membuat Orders dengan STRICT BUSINESS LOGIC...\n");
  console.log("   ⚠️  1 ORDER = 1 MEKANIK (tidak campur) | Order Number anti-duplicate\n");

  let orderCount = 0;
  let globalOrderCounter = 0;

  const mechanicDailyTasks = {};
  mechanics.forEach((m) => {
    mechanicDailyTasks[m.id] = {};
  });

  const stockTracker = {};
  spareparts.forEach((sp) => {
    stockTracker[sp.id] = sp.stock;
  });

  for (const shift of shifts) {
    const shiftDay = shift.openedAt.toISOString().split("T")[0];

    mechanics.forEach((m) => {
      if (!mechanicDailyTasks[m.id][shiftDay]) {
        mechanicDailyTasks[m.id][shiftDay] = 0;
      }
    });

    const totalOrders = faker.number.int({ min: 8, max: 15 });

    const draftCount = Math.max(0, Math.floor(totalOrders * 0.05));
    const queuedCount = Math.max(0, Math.floor(totalOrders * 0.10));
    const inProgressCount = Math.max(0, Math.floor(totalOrders * 0.15));
    const completedCount = Math.max(0, Math.floor(totalOrders * 0.20));
    const closedCount = Math.max(0, Math.floor(totalOrders * 0.45));
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

      const customer = faker.helpers.arrayElement(dbCustomers);
      const vehicles = await prisma.vehicle.findMany({
        where: { customerId: customer.id },
      });

      if (vehicles.length === 0) continue;

      const vehicle = faker.helpers.arrayElement(vehicles);

      let assignedMechanicId = null;

      if (!["DRAFT", "CANCELLED"].includes(status)) {
        const availableMechanics = mechanics.filter(
          (m) => (mechanicDailyTasks[m.id][shiftDay] || 0) < 5
        );

        if (availableMechanics.length > 0) {
          assignedMechanicId = faker.helpers.arrayElement(availableMechanics).id;
          mechanicDailyTasks[assignedMechanicId][shiftDay] = (mechanicDailyTasks[assignedMechanicId][shiftDay] || 0) + 1;
        }
      }

      let subtotal = 0;
      const selectedItems = [];
      const numItems = faker.number.int({ min: 1, max: 5 });

      for (let j = 0; j < numItems; j++) {
        const isService = faker.datatype.boolean({ probability: 0.4 });
        const product = faker.helpers.arrayElement(isService ? services : spareparts);
        const qty = isService ? 1 : faker.number.int({ min: 1, max: 3 });
        const itemSubtotal = product.price * qty;
        subtotal += itemSubtotal;

        selectedItems.push({
          product,
          qty,
          subtotal: itemSubtotal,
          isService,
        });
      }

      const tax = Math.round(subtotal * 0.11);
      const total = subtotal + tax;

      const baseDate = new Date(shift.openedAt);
      baseDate.setMinutes(baseDate.getMinutes() + faker.number.int({ min: 10, max: 500 }));

      let diagnosedAt = null;
      let startedAt = null;
      let completedAt = null;
      let closedAt = null;
      let deletedAt = null;
      let paymentMethod = null;
      let paymentStatus = "PENDING";
      let amountPaid = 0;
      let changeAmount = 0;
      let paidAt = null;

      switch (status) {
        case "DRAFT":
          break;

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
          paymentStatus = "PAID";
          paidAt = completedAt;
          amountPaid = paymentMethod === "CASH" ? total + faker.number.int({ min: 0, max: 200000 }) : total;
          changeAmount = paymentMethod === "CASH" ? amountPaid - total : 0;
          break;

        case "CLOSED":
          diagnosedAt = new Date(baseDate);
          startedAt = new Date(baseDate.getTime() + 15 * 60000);
          completedAt = new Date(baseDate.getTime() + faker.number.int({ min: 30, max: 150 }) * 60000);
          closedAt = new Date(baseDate.getTime() + faker.number.int({ min: 60, max: 200 }) * 60000);
          paymentMethod = faker.helpers.arrayElement(["CASH", "QRIS"]);
          paymentStatus = "PAID";
          paidAt = closedAt;
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
          orderNumber,
          status: status,
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
          updatedAt: closedAt || completedAt || startedAt || diagnosedAt || baseDate,
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

        if (item.isService && assignedMechanicId && !["DRAFT", "CANCELLED"].includes(status)) {
          await prisma.mechanicAssignment.create({
            data: {
              orderItemId: orderItem.id,
              mechanicId: assignedMechanicId,
              startAt: ["QUEUED"].includes(status) ? null : startedAt,
              endAt: ["QUEUED", "IN_PROGRESS"].includes(status) ? null : completedAt,
            },
          });
        }

        if (item.product.type === "SPAREPART" && ["IN_PROGRESS", "COMPLETED", "CLOSED"].includes(status)) {
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

      if (!["DRAFT", "CANCELLED"].includes(status)) {
        await prisma.payment.create({
          data: {
            orderId: order.id,
            method: paymentMethod,
            amountPaid: amountPaid,
            change: changeAmount,
            status: paymentStatus,
            paidAt: paidAt,
          },
        });
      }

      const statusFlow = [];

      statusFlow.push({
        status: "DRAFT",
        note: "Pesanan dibuat",
        changedById: shift.cashierId,
        createdAt: baseDate,
      });

      if (["QUEUED", "IN_PROGRESS", "COMPLETED", "CLOSED"].includes(status)) {
        statusFlow.push({
          status: "QUEUED",
          note: "Masuk antrian pengerjaan",
          changedById: shift.cashierId,
          createdAt: diagnosedAt || new Date(baseDate.getTime() + 5 * 60000),
        });
      }

      if (["IN_PROGRESS", "COMPLETED", "CLOSED"].includes(status)) {
        statusFlow.push({
          status: "IN_PROGRESS",
          note: `Mekanik ${mechanics.find(m => m.id === assignedMechanicId)?.fullName || "Unknown"} mulai pengerjaan`,
          changedById: assignedMechanicId || shift.cashierId,
          createdAt: startedAt || new Date(baseDate.getTime() + 20 * 60000),
        });
      }

      if (["COMPLETED", "CLOSED"].includes(status)) {
        statusFlow.push({
          status: "COMPLETED",
          note: "Pengerjaan selesai, menunggu pembayaran",
          changedById: assignedMechanicId || shift.cashierId,
          createdAt: completedAt || new Date(baseDate.getTime() + 60 * 60000),
        });
      }

      if (status === "CLOSED") {
        statusFlow.push({
          status: "CLOSED",
          note: "Pembayaran lunas, motor diambil pelanggan",
          changedById: shift.cashierId,
          createdAt: closedAt || new Date(baseDate.getTime() + 90 * 60000),
        });
      }

      if (status === "CANCELLED") {
        statusFlow.push({
          status: "CANCELLED",
          note: "Pesanan dibatalkan",
          changedById: shift.cashierId,
          createdAt: deletedAt || new Date(baseDate.getTime() + 10 * 60000),
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

  console.log(`   ✅ ${orderCount} orders created (1 order = 1 mekanik)\n`);

  // ============================================================
  // STEP 6: Notifications
  // ============================================================
  console.log("🔔 [6/6] Membuat Notifications...");

  await prisma.notification.create({
    data: {
      title: "Seeding Selesai",
      message: `Database berhasil di-seed.\n\nUsers: ${createdUsers.length}\nCustomers: ${dbCustomers.length}\nOrders: ${orderCount}\nShifts: ${shifts.length}\nProducts: ${spareparts.length + services.length}`,
      type: "SUCCESS",
      userId: admins[0].id,
    },
  });

  for (const user of createdUsers) {
    if (user.role === "ADMIN") continue;
    await prisma.notification.create({
      data: {
        title: "Selamat Bekerja",
        message: `Halo ${user.fullName}, sistem siap digunakan dengan data production.`,
        type: "INFO",
        userId: user.id,
      },
    });
  }

  console.log(`   ✅ ${createdUsers.length} notifications created\n`);

  // ============================================================
  // TOTAL ESTIMASI
  // ============================================================
  const totalEstimasi =
    defaultSettings.length +                              // settings (4)
    createdUsers.length +                                 // users (26)
    dbCustomers.length +                                  // customers (80)
    Math.floor(dbCustomers.length * 2) +                  // vehicles (~160)
    (spareparts.length + services.length) +               // products (95)
    (spareparts.length + services.length) +               // productPriceHistory (95)
    spareparts.length +                                   // stockMovement awal (60)
    shifts.length +                                       // shifts (~78)
    Math.floor(shifts.length * 2) +                       // expenses (~156)
    orderCount +                                          // orders (~900)
    Math.floor(orderCount * 3) +                          // orderItems (~2700)
    Math.floor(orderCount * 0.4) +                        // mechanicAssignments (~360)
    Math.floor(orderCount * 0.9) +                        // payments (~810)
    Math.floor(orderCount * 3.5) +                        // orderStatusHistory (~3150)
    createdUsers.length;                                  // notifications (26)

  console.log("==================================================");
  console.log("✅ SEEDING BERHASIL");
  console.log("==================================================");
  console.log(`⚙️  Settings       : ${defaultSettings.length}`);
  console.log(`👥 Users          : ${createdUsers.length} (${admins.length} Admin, ${cashiers.length} Kasir, ${mechanics.length} Mekanik)`);
  console.log(`👤 Customers      : ${dbCustomers.length}`);
  console.log(`🚗 Vehicles       : ~${Math.floor(dbCustomers.length * 2)}`);
  console.log(`🏍️  Products       : ${spareparts.length + services.length} (${spareparts.length} Spareparts, ${services.length} Services)`);
  console.log(`📝 Deskripsi      : ✅ Semua produk memiliki deskripsi`);
  console.log(`🕐 Shifts         : ${shifts.length} (ALL CLOSED)`);
  console.log(`💰 Expenses       : ~${Math.floor(shifts.length * 2)}`);
  console.log(`📋 Orders         : ${orderCount}`);
  console.log(`📦 OrderItems     : ~${Math.floor(orderCount * 3)}`);
  console.log(`🔧 Assignments    : ~${Math.floor(orderCount * 0.4)}`);
  console.log(`💳 Payments       : ~${Math.floor(orderCount * 0.9)}`);
  console.log(`📜 Status History : ~${Math.floor(orderCount * 3.5)}`);
  console.log(`🔔 Notifications  : ${createdUsers.length}`);
  console.log(`--------------------------------------------------`);
  console.log(`📊 TOTAL ESTIMASI : ~${totalEstimasi} data`);
  console.log(`🔧 Mekanik/Order  : 1 Mekanik per Order (tidak campur)`);
  console.log("==================================================");
}

seed()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("❌ Seeding gagal:", e);
    await prisma.$disconnect();
    process.exit(1);
  });