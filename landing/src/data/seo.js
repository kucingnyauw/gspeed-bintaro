/**
 * Data konten setiap halaman (PAGE) untuk website Gspeed.
 * Setiap objek merepresentasikan satu halaman lengkap dengan metadata SEO, hero, dan sections.
 * Fokus konten: Bengkel spesialis performa dan tuning Vespa modern.
 *
 * @constant
 * @type {Array<{
*   path: string,
*   name: string,
*   meta: {
*     title: string,
*     description: string,
*     keywords: string,
*     robots: string,
*     canonical: string,
*     ogTitle: string,
*     ogDescription: string,
*     ogImage: string,
*     ogType: string
*   },
*   hero: {
*     title: string,
*     subtitle: string,
*     backgroundImage?: string,
*     ctaPrimary?: { text: string, href: string },
*     ctaSecondary?: { text: string, href: string }
*   },
*   sections?: Array<{
*     id: string,
*     title: string,
*     subtitle?: string,
*     content?: string,
*     embedUrl?: string,
*     address?: string,
*     email?: string,
*     phone?: string
*   }>
* }>}
*/
const SEO = [
 {
   path: "/",
   name: "Home",
   meta: {
     title: "Gspeed | Bengkel Spesialis Performa & Tuning Vespa",
     description:
       "Bengkel Vespa terpercaya untuk servis rutin, remap ECU, racik CVT anti gredek, hingga bore up harian. Tingkatkan respons dan tenaga Vespa modern Anda di Gspeed.",
     keywords:
       "bengkel vespa tangerang, tune up vespa, dyno test vespa, remap ecu vespa, setting cvt vespa, bore up vespa, gspeed, servis vespa matic",
     robots: "index, follow",
     canonical: "https://gspeed.id/",
     ogTitle: "Gspeed – Bawa Performa Vespa Anda ke Level Berikutnya",
     ogDescription:
       "Solusi performa Vespa berbasis data Dyno. Kami hilangkan gredek dan maksimalkan tenaga mesin untuk harian maupun touring.",
     ogImage: "https://gspeed.id/images/og-home.jpg",
     ogType: "website",
   },
   hero: {
     title: "Bawa Performa Vespa Anda ke Level Berikutnya",
     subtitle:
       "Dari sekadar servis rutin penghilang gredek hingga upgrade mesin ekstrem. Kami men-tuning Vespa Anda berdasarkan data nyata dari mesin Dyno, bukan tebak-tebakan feeling.",
     backgroundImage:
       "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1920&q=80",
     ctaPrimary: { text: "Reservasi Jadwal", href: "/contact" },
     ctaSecondary: { text: "Cek Paket Upgrade", href: "/products" },
   },
   sections: [
     {
       id: "features",
       title: "Kenapa Harus Gspeed?",
       subtitle:
         "Kami tidak cuma membongkar mesin, tapi mengukur dan menganalisa. Kombinasi mekanik spesialis Vespa dan mesin Dyno modern menjamin hasil yang aman untuk harian.",
     },
     {
       id: "process",
       title: "Proses Kerja Transparan",
       subtitle: "Anda berhak tahu apa yang kami kerjakan. Semua progres dan data grafis peningkatan tenaga akan kami laporkan dengan detail.",
     },
     {
       id: "stats",
       title: "Gspeed dalam Angka",
       subtitle: "Ratusan Vespisti telah mempercayakan mesin mereka di garasi kami.",
     },
     {
       id: "testimonials",
       title: "Kata Mereka yang Sudah Mampir",
       subtitle:
         "Review jujur dari para pengguna Vespa setelah merasakan racikan tangan tim Gspeed.",
     },
   ],
 },
 {
   path: "/about",
   name: "About",
   meta: {
     title: "Tentang Gspeed | Perjalanan Bengkel Vespa Berbasis Data",
     description:
       "Berawal dari tongkrongan komunitas, Gspeed kini menjadi rujukan Vespisti untuk urusan performa. Kenali tim mekanik handal kami.",
     keywords:
       "sejarah gspeed, bengkel komunitas vespa, spesialis vespa matic, tim mekanik gspeed, bengkel vespa profesional",
     robots: "index, follow",
     canonical: "https://gspeed.id/about",
     ogTitle: "Tentang Kami - Kisah & Tim Dibalik Layar Gspeed",
     ogDescription:
       "Kami percaya setiap Vespa punya potensi tersembunyi yang bisa dimaksimalkan tanpa harus mengorbankan kenyamanan.",
     ogImage: "https://gspeed.id/images/og-about.jpg",
     ogType: "article",
   },
   hero: {
     title: "Kisah di Balik Garasi Gspeed",
     subtitle:
       "Lahir dari keresahan akan masalah gredek CVT yang tak kunjung sembuh, kini kami berevolusi menjadi bengkel spesialis tuning Vespa.",
     backgroundImage:
       "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=1920&q=80",
   },
   sections: [
     {
       id: "story",
       title: "Awal Mula Perjalanan",
       content:
         "Gspeed berdiri di awal tahun 2018. Awalnya, kami cuma sekumpulan anak Vespa yang frustrasi dengan penyakit bawaan matic Eropa ini: gredek, tarikan bawah lemot, dan gampang overheat. Bermula dari oprek-oprek di garasi kecil, meracik sudut pulley dan berat roller sendiri, lambat laun banyak teman komunitas yang minta motornya di-settingin juga. Dari situ, kami mulai serius. Kami berinvestasi di mesin Dyno test khusus roda dua, memperdalam ilmu mapping ECU, dan merekrut tenaga mekanik bersertifikat. Sekarang, Gspeed bukan lagi sekadar bengkel, tapi 'laboratorium' tempat lahirnya Vespa-vespa kencang namun tetap asik buat dipakai sunmori atau sekadar ngopi sore.",
     },
     {
       id: "team",
       title: "Tim Eksekutor Kami",
       subtitle:
         "Diisi oleh para Vespisti tulen yang paham betul sela-sela mesin i-get, 3V, hingga Quasar.",
     },
     {
       id: "values",
       title: "Standar & Filosofi Gspeed",
     },
   ],
 },
 {
   path: "/products",
   name: "Products",
   meta: {
     title: "Katalog Part & Paket Upgrade Vespa | Gspeed",
     description:
       "Tersedia paket anti gredek, custom CVT, remap ECU, piggyback, hingga knalpot aftermarket untuk Vespa Sprint, Primavera, dan GTS.",
     keywords:
       "paket cvt vespa, mangkok ganda custom, remap ecu vespa iget, paket bore up vespa, knalpot racing vespa, part aftermarket vespa",
     robots: "index, follow",
     canonical: "https://gspeed.id/products",
     ogTitle: "Katalog Produk & Paket Performa Vespa - Gspeed",
     ogDescription:
       "Pilih racikan performa yang sesuai dengan gaya berkendara dan budget Anda. Semua part sudah lulus uji dyno.",
     ogImage: "https://gspeed.id/images/og-products.jpg",
     ogType: "website",
   },
   hero: {
     title: "Katalog Part & Racikan Performa",
     subtitle:
       "Kami hanya menyediakan komponen aftermarket yang terbukti performanya. Mulai dari per CVT, kampas ganda, hingga noken as racing.",
     backgroundImage:
       "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1920&q=80",
   },
   sections: [
     {
       id: "categories",
       title: "Menu Upgrade Gspeed",
       subtitle:
         "Semua komponen dipasang presisi dan langsung di-setting basah di atas mesin Dyno.",
     },
   ],
 },

];

export default SEO;