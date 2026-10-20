// Master Data Peserta untuk Pembagi 6 Kelompok (35 Peserta)

export const POOL_1: string[] = [
  'Adika Ramzi',
  'M. Gilank Putra Ramadhan',
  'Nayaka Nur Zaky',
  'Shalahuddin Yusuf Azka',
  'Aila Putri Noviyan',
  'Dirlha Hainnun Ningsih',
  'Hafizal Gustyo Pratama',
  'Neyna Hendriani Liu',
  'Syahrul Salam',
  'Muhammad Haikal',
  'Ardilla Putri Wulansari',
] // 11 orang

export const POOL_2: string[] = [
  'Daffa Putra Gemilang',
  'Muhammad Akbar Ar’rafa',
  'Alfino Fazrurachman',
  'Dzaky Almer Rafif',
  'Ibra Muhammad',
  'Pauziah Lestari',
  'Fahril Ilham',
  'Inayah Nur Azizah',
  'Rafiq Fadhil Fathin',
  'Zidane Adlyndra Assami',
  'Muhammad Zainal Abidin',
  'Raka Apriansyah',
] // 12 orang

export const POOL_3: string[] = [
  'Fatah Rezky Al Gyfari',
  'Kamal Al-Fathir Iskandar',
  'Nava Olivia',
  'Riyan Ade Geandra',
  'Ahmad Daniel Ghifari',
  'Dimas Wahyu Setiyawan',
  'Fatur Rahman Al-Ghozy',
  'Vani Oktaviani',
  'Muhammad Nur Asyifa',
  'Bayu Oktara',
  'Fahrizal Fery Utama',
  'Jamal Dwi Andika',
] // 12 orang

export const PROMOTION_CANDIDATES: string[] = ['Dzaky Almer Rafif', 'Ibra Muhammad']

export interface GroupMember {
  name: string
  originalPool: 1 | 2 | 3
  isPromoted?: boolean
  timestamp: string
}

export interface GroupData {
  id: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
  name: string
  capacity: number
  color: string
  members: GroupMember[]
}

export const INITIAL_GROUPS: GroupData[] = [
  { id: 'A', name: 'Kelompok A', capacity: 6, color: '#EA4335', members: [] },
  { id: 'B', name: 'Kelompok B', capacity: 6, color: '#FBBC05', members: [] },
  { id: 'C', name: 'Kelompok C', capacity: 6, color: '#34A853', members: [] },
  { id: 'D', name: 'Kelompok D', capacity: 6, color: '#00BCD4', members: [] },
  { id: 'E', name: 'Kelompok E', capacity: 6, color: '#4285F4', members: [] },
  { id: 'F', name: 'Kelompok F', capacity: 5, color: '#9C27B0', members: [] },
]
