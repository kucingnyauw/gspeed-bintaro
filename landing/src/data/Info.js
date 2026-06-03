/**
 * Data informasi utama (INFO) untuk website G-Speed.
 * Digunakan untuk konfigurasi global, footer, dan metadata schema/Local SEO.
 *
 * @constant
 * @type {Object}
 */
const INFO = {
    /** Nama bengkel */
    name: "G-Speed",
    
    /** Deskripsi singkat (cocok untuk meta description default & footer) */
    description: "Bengkel Motor Spesialis Vespa - Melayani servis, sparepart, modifikasi, dan perawatan rutin Vespa kesayangan Anda.",
    
    /** Kata kunci pencarian utama (Global SEO) */
    keywords: "bengkel vespa, servis vespa tangerang, sparepart vespa, bengkel motor pondok aren, modifikasi vespa, g-speed vespa",
    
    /** URL Logo bengkel */
    logoUrl: "https://gtgytvjziuptkvpobzuq.supabase.co/storage/v1/object/public/assets/1000007137.png",
    
    /** Kontak Telepon / WhatsApp (Gunakan format +62 untuk link wa.me otomatis) */
    phone: "+6287899242234",
    
    /** Email bisnis (Opsional, sangat disarankan untuk trust factor SEO) */
    email: "info@gspeed-vespa.id",
    
    /** Alamat lengkap bengkel */
    address: "Jl. Pd. Betung Raya No.60 A, Pd. Betung, Kec. Pd. Aren, Kota Tangerang Selatan, Banten 15221",
    
    /** Link Google Maps (Berguna untuk tombol "Arahkan ke Lokasi") */
    googleMapsUrl: "https://maps.google.com/maps?width=600&height=400&hl=en&q=G%20speed%20bintaro&t=&z=14&ie=UTF8&iwloc=B&output=embed", 
    
    /** Jam operasional (Sangat penting untuk Local SEO Schema Markup) */
    businessHours: {
      open: "09:00",
      close: "18:00",
      workingDays: "Senin - Sabtu"
    },
    
    /** Tautan Media Sosial (Mendukung Open Graph & validasi bisnis di Google) */
    socialMedia: {
      instagram: "https://instagram.com/gspeed.vespa",
      facebook: "https://facebook.com/gspeed.vespa"
    }
  };
  
  export default INFO;