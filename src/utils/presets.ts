export interface PresetList {
  id: string
  title: string
  description: string
  items: string[]
}

export const PRESET_LISTS: PresetList[] = [
  {
    id: 'students',
    title: 'Daftar Nama Murid',
    description: '15 Nama siswa untuk giliran presentasi atau piket',
    items: [
      'Aditya Pratama',
      'Bella Safitri',
      'Citra Kirana',
      'Dimas Arya',
      'Eka Ramadhan',
      'Fadhil Rahman',
      'Gita Permata',
      'Hendra Kusuma',
      'Indah Lestari',
      'Joko Susilo',
      'Kevin Sanjaya',
      'Lia Amelia',
      'Maulana Malik',
      'Nadia Utami',
      'Oki Setiawan',
    ],
  },
  {
    id: 'numbers',
    title: 'Nomor Acak (1 - 20)',
    description: 'Angka urut 1 sampai 20 untuk undian kupon',
    items: Array.from({ length: 20 }, (_, i) => `Nomor ${i + 1}`),
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
