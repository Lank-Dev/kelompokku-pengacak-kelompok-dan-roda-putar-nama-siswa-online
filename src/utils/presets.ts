export interface PresetList {
  id: string
  title: string
  description: string
  items: string[]
}

const INDONESIAN_FIRST_NAMES = [
  'Aditya', 'Agus', 'Ahmad', 'Aisyah', 'Alamsyah', 'Aldi', 'Alif', 'Amalia', 'Ananda', 'Andi',
  'Angga', 'Annisa', 'Ardi', 'Arief', 'Aris', 'Arya', 'Aulia', 'Bagas', 'Bambang', 'Bayu',
  'Bella', 'Bima', 'Budi', 'Cahyo', 'Chandra', 'Cici', 'Citra', 'Danang', 'Dedi', 'Denny',
  'Dewi', 'Dian', 'Dimas', 'Dinda', 'Dini', 'Doni', 'Eka', 'Endah', 'Fadhil', 'Fajar',
  'Farhan', 'Fathir', 'Febri', 'Fitri', 'Galih', 'Gilang', 'Gita', 'Guntur', 'Hadi', 'Hafiz',
  'Hana', 'Hari', 'Hasan', 'Hendro', 'Heru', 'Hidayat', 'Ilham', 'Imam', 'Indah', 'Indra',
  'Intan', 'Irfan', 'Ivan', 'Joko', 'Kartika', 'Kevin', 'Kiki', 'Krisna', 'Kurniawan', 'Laras',
  'Lia', 'Lukman', 'Maman', 'Maya', 'Mega', 'Melati', 'Mia', 'Miko', 'Mira', 'Muhammad',
  'Nabil', 'Nadia', 'Nanda', 'Naufal', 'Nia', 'Novita', 'Nur', 'Oki', 'Panji', 'Permana',
  'Prasetyo', 'Putra', 'Putri', 'Raden', 'Rafi', 'Rahma', 'Rama', 'Rangga', 'Rian', 'Rina'
]

const INDONESIAN_LAST_NAMES = [
  'Pratama', 'Safitri', 'Kirana', 'Arya', 'Ramadhan', 'Rahman', 'Permata', 'Kusuma', 'Lestari', 'Susilo',
  'Sanjaya', 'Amelia', 'Malik', 'Utami', 'Setiawan', 'Hidayat', 'Saputra', 'Wibowo', 'Nugroho', 'Siregar',
  'Nasution', 'Batubara', 'Lubis', 'Harahap', 'Ginting', 'Sembiring', 'Sitepu', 'Tarigan', 'Sinaga', 'Simanjuntak',
  'Hutapea', 'Pardede', 'Pasaribu', 'Manurung', 'Panjaitan', 'Simatupang', 'Sihombing', 'Nababan', 'Sitompul', 'Hutabarat',
  'Tanjung', 'Chaniago', 'Koto', 'Piliang', 'Caniago', 'Sikumbang', 'Jambak', 'Gusti', 'Anwar', 'Santoso'
]

function generateNames(count: number): string[] {
  const result: string[] = []
  for (let i = 0; i < count; i++) {
    const fn = INDONESIAN_FIRST_NAMES[i % INDONESIAN_FIRST_NAMES.length]
    const ln = INDONESIAN_LAST_NAMES[(i * 3 + 7) % INDONESIAN_LAST_NAMES.length]
    result.push(`${fn} ${ln}`)
  }
  return result
}

export const PRESET_LISTS: PresetList[] = [
  {
    id: 'students-15',
    title: 'Daftar Kelas (15 Murid)',
    description: '15 Nama siswa untuk giliran presentasi atau piket',
    items: generateNames(15),
  },
  {
    id: 'employees-50',
    title: '50 Karyawan / Peserta',
    description: '50 Nama untuk undian gathering atau doorprize departemen',
    items: generateNames(50),
  },
  {
    id: 'employees-100',
    title: '100 Karyawan / Peserta (Besar)',
    description: '100 Nama lengkap untuk undian acara besar / perusahaan',
    items: generateNames(100),
  },
  {
    id: 'numbers-20',
    title: 'Nomor Kupon (1 - 20)',
    description: 'Angka urut 1 sampai 20',
    items: Array.from({ length: 20 }, (_, i) => `Nomor ${i + 1}`),
  },
  {
    id: 'numbers-100',
    title: 'Kupon Undian (1 - 100)',
    description: '100 Kupon untuk undian massal',
    items: Array.from({ length: 100 }, (_, i) => `Kupon #${String(i + 1).padStart(3, '0')}`),
  },
  {
    id: 'numbers-250',
    title: 'Kupon Undian (1 - 250)',
    description: '250 Kupon undian doorprize besar',
    items: Array.from({ length: 250 }, (_, i) => `Kupon #${String(i + 1).padStart(3, '0')}`),
  },
  {
    id: 'lunch',
    title: 'Makan Apa Hari Ini?',
    description: 'Pusing milih menu makan siang atau makan malam',
    items: [
      'Nasi Padang',
      'Ayam Geprek',
      'Bakso & Mie Ayam',
      'Sate Ayam Madura',
      'Nasi Goreng Spesial',
      'Soto Betawi',
      'Gado-Gado',
      'Burger & Kentang',
      'Ramen Jepang',
      'Nasi Uduk Komplit',
    ],
  },
  {
    id: 'doorprize',
    title: 'Hadiah Doorprize',
    description: 'Kategori hadiah untuk acara kantor atau gathering',
    items: [
      '🎁 Smart TV 43"',
      '📱 Smartphone 5G',
      '☕ Mesin Kopi Espresso',
      '🎧 Headphone Wireless',
      '🛴 Sepeda Lipat',
      '💵 Voucher Belanja Rp 500rb',
      '🍳 Air Fryer Digital',
      '🎒 Backpack Anti-Air',
      '⌚ Smartwatch Pro',
      '🎟️ Tiket Wisata 2 Pax',
    ],
  },
  {
    id: 'yes-no',
    title: 'Ya atau Tidak (Quick Decision)',
    description: 'Bantu ambil keputusan spontan',
    items: ['YA! LAKUKAN', 'TIDAK JANGAN', 'COBA LAGI NANTI', 'TANYA TEMAN', 'IKUTI KATA HATI'],
  },
]
