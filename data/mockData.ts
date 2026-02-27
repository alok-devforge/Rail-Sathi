import { Train, CrowdReport, DensityLevel } from '../types';

// ─── Seat Chart Entry ─────────────────────────────────────────────────────────
// availability key format: "FROM_CODE-TO_CODE" → "AVAILABLE" | null (null = occupied/WL)

export interface SeatEntry {
  trainId: string;
  seatNumber: string;
  coachId: string;
  availability: Record<string, string | null>;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  REAL TRAIN DATA — Indian Railways
//  Source: NTES / IRCTC official timetables
// ═══════════════════════════════════════════════════════════════════════════════

export const MOCK_TRAINS: Train[] = [

  // ── 1. Howrah Rajdhani Express ───────────────────────────────────────────────
  {
    id: '12301',
    number: '12301',
    name: 'Howrah Rajdhani Express',
    from: 'Howrah',
    to: 'New Delhi',
    departure: '16:55',
    arrival: '10:00',
    duration: '17h 05m',
    route: [
      { code: 'HWH',  name: 'Howrah Jn',             dist: 0,    arr: '--',   dep: '16:55' },
      { code: 'ASN',  name: 'Asansol Jn',             dist: 200,  arr: '19:08',dep: '19:10' },
      { code: 'DHN',  name: 'Dhanbad Jn',             dist: 261,  arr: '19:55',dep: '20:00' },
      { code: 'GAYA', name: 'Gaya Jn',                dist: 393,  arr: '22:10',dep: '22:20' },
      { code: 'DDU',  name: 'Pt. D.D. Upadhyaya Jn', dist: 533,  arr: '00:45',dep: '00:55' },
      { code: 'ALD',  name: 'Prayagraj Jn',           dist: 710,  arr: '02:55',dep: '03:00' },
      { code: 'CNB',  name: 'Kanpur Central',         dist: 882,  arr: '04:55',dep: '05:00' },
      { code: 'NDLS', name: 'New Delhi',              dist: 1447, arr: '10:00',dep: '--'    },
    ],
  },

  // ── 2. Mumbai Rajdhani Express ───────────────────────────────────────────────
  {
    id: '12951',
    number: '12951',
    name: 'Mumbai Rajdhani Express',
    from: 'Mumbai Central',
    to: 'New Delhi',
    departure: '17:00',
    arrival: '08:35',
    duration: '15h 35m',
    route: [
      { code: 'BCT',  name: 'Mumbai Central',  dist: 0,    arr: '--',   dep: '17:00' },
      { code: 'BRC',  name: 'Vadodara Jn',     dist: 392,  arr: '20:05',dep: '20:10' },
      { code: 'RTM',  name: 'Ratlam Jn',       dist: 541,  arr: '22:30',dep: '22:35' },
      { code: 'KOTA', name: 'Kota Jn',         dist: 735,  arr: '01:45',dep: '01:50' },
      { code: 'MTJ',  name: 'Mathura Jn',      dist: 1018, arr: '05:30',dep: '05:35' },
      { code: 'NDLS', name: 'New Delhi',       dist: 1386, arr: '08:35',dep: '--'    },
    ],
  },

  // ── 3. Tamil Nadu Express ────────────────────────────────────────────────────
  {
    id: '12621',
    number: '12621',
    name: 'Tamil Nadu Express',
    from: 'New Delhi',
    to: 'Chennai Central',
    departure: '22:30',
    arrival: '07:10',
    duration: '32h 40m',
    route: [
      { code: 'NDLS', name: 'New Delhi',        dist: 0,    arr: '--',   dep: '22:30' },
      { code: 'CNB',  name: 'Kanpur Central',   dist: 440,  arr: '03:40',dep: '03:45' },
      { code: 'ALD',  name: 'Prayagraj Jn',     dist: 634,  arr: '05:30',dep: '05:35' },
      { code: 'DDU',  name: 'Pt. D.D. Upadhyaya Jn', dist: 784, arr: '07:30',dep: '07:45' },
      { code: 'NGP',  name: 'Nagpur',           dist: 1170, arr: '15:00',dep: '15:15' },
      { code: 'BPQ',  name: 'Balharshah',       dist: 1494, arr: '21:00',dep: '21:15' },
      { code: 'SC',   name: 'Secunderabad Jn',  dist: 1762, arr: '02:30',dep: '02:45' },
      { code: 'RU',   name: 'Renigunta Jn',     dist: 2010, arr: '05:00',dep: '05:05' },
      { code: 'MAS',  name: 'Chennai Central',  dist: 2188, arr: '07:10',dep: '--'    },
    ],
  },

  // ── 4. Karnataka Express ─────────────────────────────────────────────────────
  {
    id: '12627',
    number: '12627',
    name: 'Karnataka Express',
    from: 'Bangalore',
    to: 'New Delhi',
    departure: '20:15',
    arrival: '11:30',
    duration: '39h 15m',
    route: [
      { code: 'SBC',  name: 'Bangalore City Jn', dist: 0,    arr: '--',   dep: '20:15' },
      { code: 'DMM',  name: 'Davanagere',         dist: 270,  arr: '23:30',dep: '23:33' },
      { code: 'UBL',  name: 'Hubballi Jn',        dist: 440,  arr: '02:15',dep: '02:25' },
      { code: 'GTL',  name: 'Guntakal Jn',        dist: 650,  arr: '06:50',dep: '07:00' },
      { code: 'WADI', name: 'Wadi',               dist: 793,  arr: '09:35',dep: '09:40' },
      { code: 'SC',   name: 'Secunderabad Jn',    dist: 956,  arr: '12:05',dep: '12:15' },
      { code: 'NGP',  name: 'Nagpur',             dist: 1368, arr: '20:15',dep: '20:25' },
      { code: 'BPL',  name: 'Bhopal Jn',          dist: 1769, arr: '03:20',dep: '03:30' },
      { code: 'JHS',  name: 'Jhansi Jn',          dist: 1930, arr: '06:05',dep: '06:10' },
      { code: 'AGC',  name: 'Agra Cantt',         dist: 2093, arr: '08:45',dep: '08:50' },
      { code: 'NDLS', name: 'New Delhi',          dist: 2288, arr: '11:30',dep: '--'    },
    ],
  },

  // ── 5. Saraighat Express ─────────────────────────────────────────────────────
  {
    id: '12345',
    number: '12345',
    name: 'Saraighat Express',
    from: 'Howrah',
    to: 'Guwahati',
    departure: '15:50',
    arrival: '05:45',
    duration: '13h 55m',
    route: [
      { code: 'HWH',  name: 'Howrah Jn',        dist: 0,   arr: '--',   dep: '15:50' },
      { code: 'BDC',  name: 'Bandel Jn',         dist: 59,  arr: '16:41',dep: '16:43' },
      { code: 'BWN',  name: 'Barddhaman Jn',     dist: 96,  arr: '17:18',dep: '17:20' },
      { code: 'JSME', name: 'Jasidih Jn',        dist: 284, arr: '20:48',dep: '20:50' },
      { code: 'JMP',  name: 'Jamalpur Jn',       dist: 312, arr: '21:25',dep: '21:27' },
      { code: 'BGP',  name: 'Bhagalpur Jn',      dist: 390, arr: '22:32',dep: '22:35' },
      { code: 'KIU',  name: 'Kishanganj',        dist: 483, arr: '00:18',dep: '00:20' },
      { code: 'NJP',  name: 'New Jalpaiguri',    dist: 562, arr: '02:00',dep: '02:10' },
      { code: 'NBQ',  name: 'New Bongaigaon',    dist: 694, arr: '04:04',dep: '04:06' },
      { code: 'GHY',  name: 'Guwahati',          dist: 768, arr: '05:45',dep: '--'    },
    ],
  },

  // ── 6. Bhopal Shatabdi Express ───────────────────────────────────────────────
  {
    id: '12002',
    number: '12002',
    name: 'Bhopal Shatabdi Express',
    from: 'New Delhi',
    to: 'Habibganj',
    departure: '06:00',
    arrival: '13:55',
    duration: '7h 55m',
    route: [
      { code: 'NDLS', name: 'New Delhi',    dist: 0,   arr: '--',   dep: '06:00' },
      { code: 'AGC',  name: 'Agra Cantt',  dist: 195, arr: '08:00',dep: '08:03' },
      { code: 'GWL',  name: 'Gwalior Jn',  dist: 321, arr: '09:20',dep: '09:22' },
      { code: 'JHS',  name: 'Jhansi Jn',   dist: 403, arr: '10:40',dep: '10:43' },
      { code: 'BIN',  name: 'Bina Jn',     dist: 530, arr: '12:12',dep: '12:14' },
      { code: 'BPL',  name: 'Bhopal Jn',   dist: 701, arr: '13:45',dep: '13:48' },
      { code: 'HBJ',  name: 'Habibganj',   dist: 706, arr: '13:55',dep: '--'    },
    ],
  },

  // ── 7. Telangana Express ─────────────────────────────────────────────────────
  {
    id: '12723',
    number: '12723',
    name: 'Telangana Express',
    from: 'New Delhi',
    to: 'Secunderabad',
    departure: '06:15',
    arrival: '06:30',
    duration: '24h 15m',
    route: [
      { code: 'NDLS', name: 'New Delhi',        dist: 0,    arr: '--',   dep: '06:15' },
      { code: 'AGC',  name: 'Agra Cantt',       dist: 195,  arr: '08:40',dep: '08:45' },
      { code: 'GWL',  name: 'Gwalior Jn',       dist: 321,  arr: '10:10',dep: '10:12' },
      { code: 'JHS',  name: 'Jhansi Jn',        dist: 403,  arr: '11:45',dep: '11:48' },
      { code: 'BPL',  name: 'Bhopal Jn',        dist: 701,  arr: '15:00',dep: '15:10' },
      { code: 'NGP',  name: 'Nagpur',           dist: 1094, arr: '21:00',dep: '21:15' },
      { code: 'WADI', name: 'Wadi',             dist: 1375, arr: '02:25',dep: '02:30' },
      { code: 'SC',   name: 'Secunderabad Jn',  dist: 1544, arr: '06:30',dep: '--'    },
    ],
  },

  // ── 8. Poorvottar Sampark Kranti Exp ─────────────────────────────────────────
  {
    id: '12502',
    number: '12502',
    name: 'Poorvottar Sampark Kranti',
    from: 'New Delhi',
    to: 'Guwahati',
    departure: '16:10',
    arrival: '22:05',
    duration: '30h 00m',
    route: [
      { code: 'NDLS', name: 'New Delhi',       dist: 0,    arr: '--',   dep: '16:10' },
      { code: 'LKO',  name: 'Lucknow Jn',      dist: 497,  arr: '22:10',dep: '22:20' },
      { code: 'GKP',  name: 'Gorakhpur Jn',    dist: 695,  arr: '01:15',dep: '01:25' },
      { code: 'CPR',  name: 'Chhapra Jn',      dist: 802,  arr: '03:20',dep: '03:25' },
      { code: 'PNBE', name: 'Patna Jn',        dist: 994,  arr: '05:35',dep: '05:45' },
      { code: 'BGP',  name: 'Bhagalpur Jn',    dist: 1228, arr: '09:05',dep: '09:10' },
      { code: 'NJP',  name: 'New Jalpaiguri',  dist: 1540, arr: '14:00',dep: '14:10' },
      { code: 'NBQ',  name: 'New Bongaigaon',  dist: 1637, arr: '16:20',dep: '16:25' },
      { code: 'GHY',  name: 'Guwahati',        dist: 1736, arr: '22:05',dep: '--'    },
    ],
  },

  // ── 9. August Kranti Rajdhani Express ────────────────────────────────────────
  {
    id: '12953',
    number: '12953',
    name: 'August Kranti Rajdhani',
    from: 'Mumbai Central',
    to: 'Hazrat Nizamuddin',
    departure: '17:40',
    arrival: '10:55',
    duration: '17h 15m',
    route: [
      { code: 'BCT',  name: 'Mumbai Central',     dist: 0,    arr: '--',   dep: '17:40' },
      { code: 'STD',  name: 'Surat',              dist: 263,  arr: '20:55',dep: '21:00' },
      { code: 'BRC',  name: 'Vadodara Jn',        dist: 392,  arr: '22:10',dep: '22:15' },
      { code: 'RTM',  name: 'Ratlam Jn',          dist: 541,  arr: '00:35',dep: '00:40' },
      { code: 'KOTA', name: 'Kota Jn',            dist: 735,  arr: '03:45',dep: '03:50' },
      { code: 'AGC',  name: 'Agra Cantt',         dist: 1008, arr: '07:48',dep: '07:50' },
      { code: 'NZM',  name: 'Hazrat Nizamuddin',  dist: 1195, arr: '10:55',dep: '--'    },
    ],
  },

  // ── 10. Sealdah Rajdhani Express ─────────────────────────────────────────────
  {
    id: '12313',
    number: '12313',
    name: 'Sealdah Rajdhani Express',
    from: 'Sealdah',
    to: 'New Delhi',
    departure: '14:05',
    arrival: '10:00',
    duration: '19h 55m',
    route: [
      { code: 'SDAH', name: 'Sealdah',              dist: 0,    arr: '--',   dep: '14:05' },
      { code: 'BWN',  name: 'Barddhaman Jn',        dist: 96,   arr: '15:23',dep: '15:25' },
      { code: 'DHN',  name: 'Dhanbad Jn',           dist: 249,  arr: '17:35',dep: '17:40' },
      { code: 'GAYA', name: 'Gaya Jn',              dist: 381,  arr: '19:45',dep: '19:55' },
      { code: 'DDU',  name: 'Pt. D.D. Upadhyaya Jn',dist: 521, arr: '21:40',dep: '21:50' },
      { code: 'CNB',  name: 'Kanpur Central',       dist: 870,  arr: '01:20',dep: '01:25' },
      { code: 'NDLS', name: 'New Delhi',            dist: 1435, arr: '10:00',dep: '--'    },
    ],
  },

  // ── 11. Coromandel Express ───────────────────────────────────────────────────
  {
    id: '12841',
    number: '12841',
    name: 'Coromandel Express',
    from: 'Howrah',
    to: 'Chennai Central',
    departure: '14:30',
    arrival: '17:25',
    duration: '26h 55m',
    route: [
      { code: 'HWH',  name: 'Howrah Jn',        dist: 0,    arr: '--',   dep: '14:30' },
      { code: 'KGP',  name: 'Kharagpur Jn',     dist: 122,  arr: '16:32',dep: '16:35' },
      { code: 'BLS',  name: 'Balasore',         dist: 215,  arr: '18:10',dep: '18:12' },
      { code: 'BBS',  name: 'Bhubaneswar',      dist: 442,  arr: '21:05',dep: '21:15' },
      { code: 'VSKP', name: 'Visakhapatnam',    dist: 791,  arr: '05:15',dep: '05:25' },
      { code: 'MAS',  name: 'Chennai Central',  dist: 1663, arr: '17:25',dep: '--'    },
    ],
  },

  // ── 12. East Coast Express ───────────────────────────────────────────────────
  {
    id: '18645',
    number: '18645',
    name: 'East Coast Express',
    from: 'Howrah',
    to: 'Visakhapatnam',
    departure: '21:45',
    arrival: '20:15',
    duration: '22h 30m',
    route: [
      { code: 'HWH',  name: 'Howrah Jn',        dist: 0,    arr: '--',   dep: '21:45' },
      { code: 'KGP',  name: 'Kharagpur Jn',     dist: 122,  arr: '23:35',dep: '23:40' },
      { code: 'BLS',  name: 'Balasore',         dist: 215,  arr: '01:02',dep: '01:04' },
      { code: 'BBS',  name: 'Bhubaneswar',      dist: 442,  arr: '04:10',dep: '04:20' },
      { code: 'VSKP', name: 'Visakhapatnam',    dist: 791,  arr: '11:15',dep: '--'    },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
//  SEAT CHART — PNR-style data per train
//  key: "FROM-TO" → "AVAILABLE" | null (null = occupied / WL)
// ═══════════════════════════════════════════════════════════════════════════════

export const MOCK_SEAT_CHART: SeatEntry[] = [

  // ── 12301 Howrah Rajdhani ────────────────────────────────────────────────────
  { trainId: '12301', seatNumber: 'A1-4',  coachId: 'A1', availability: { 'HWH-NDLS': 'AVAILABLE' } },
  { trainId: '12301', seatNumber: 'A1-8',  coachId: 'A1', availability: { 'HWH-DDU': 'AVAILABLE', 'DDU-NDLS': null } },
  { trainId: '12301', seatNumber: 'A1-12', coachId: 'A1', availability: { 'HWH-DDU': null, 'DDU-NDLS': 'AVAILABLE' } },
  { trainId: '12301', seatNumber: 'B1-22', coachId: 'B1', availability: { 'HWH-NDLS': null } },
  { trainId: '12301', seatNumber: 'B1-30', coachId: 'B1', availability: { 'HWH-GAYA': 'AVAILABLE', 'GAYA-NDLS': null } },
  { trainId: '12301', seatNumber: 'B2-5',  coachId: 'B2', availability: { 'HWH-GAYA': null, 'GAYA-NDLS': 'AVAILABLE' } },
  { trainId: '12301', seatNumber: 'B2-17', coachId: 'B2', availability: { 'HWH-CNB': 'AVAILABLE', 'CNB-NDLS': null } },
  { trainId: '12301', seatNumber: 'B3-9',  coachId: 'B3', availability: { 'HWH-CNB': null, 'CNB-NDLS': 'AVAILABLE' } },

  // ── 12951 Mumbai Rajdhani ────────────────────────────────────────────────────
  { trainId: '12951', seatNumber: 'A1-2',  coachId: 'A1', availability: { 'BCT-NDLS': 'AVAILABLE' } },
  { trainId: '12951', seatNumber: 'A1-6',  coachId: 'A1', availability: { 'BCT-KOTA': 'AVAILABLE', 'KOTA-NDLS': null } },
  { trainId: '12951', seatNumber: 'A1-10', coachId: 'A1', availability: { 'BCT-KOTA': null, 'KOTA-NDLS': 'AVAILABLE' } },
  { trainId: '12951', seatNumber: 'B1-14', coachId: 'B1', availability: { 'BCT-BRC': 'AVAILABLE', 'BRC-NDLS': null } },
  { trainId: '12951', seatNumber: 'B1-28', coachId: 'B1', availability: { 'BCT-BRC': null, 'BRC-NDLS': 'AVAILABLE' } },
  { trainId: '12951', seatNumber: 'B2-3',  coachId: 'B2', availability: { 'BCT-NDLS': null } },
  { trainId: '12951', seatNumber: 'B2-11', coachId: 'B2', availability: { 'BCT-MTJ': 'AVAILABLE', 'MTJ-NDLS': null } },

  // ── 12621 Tamil Nadu Express ─────────────────────────────────────────────────
  { trainId: '12621', seatNumber: 'S1-18', coachId: 'S1', availability: { 'NDLS-MAS': 'AVAILABLE' } },
  { trainId: '12621', seatNumber: 'S1-33', coachId: 'S1', availability: { 'NDLS-NGP': 'AVAILABLE', 'NGP-MAS': null } },
  { trainId: '12621', seatNumber: 'S2-7',  coachId: 'S2', availability: { 'NDLS-NGP': null, 'NGP-MAS': 'AVAILABLE' } },
  { trainId: '12621', seatNumber: 'S2-44', coachId: 'S2', availability: { 'NDLS-CNB': 'AVAILABLE', 'CNB-MAS': null } },
  { trainId: '12621', seatNumber: 'S3-12', coachId: 'S3', availability: { 'NDLS-CNB': null, 'CNB-MAS': 'AVAILABLE' } },
  { trainId: '12621', seatNumber: 'S3-28', coachId: 'S3', availability: { 'NDLS-MAS': null } },

  // ── 12345 Saraighat Express ──────────────────────────────────────────────────
  { trainId: '12345', seatNumber: 'S5-42', coachId: 'S5', availability: { 'HWH-BWN': null, 'BWN-GHY': 'AVAILABLE' } },
  { trainId: '12345', seatNumber: 'S5-43', coachId: 'S5', availability: { 'HWH-NJP': 'AVAILABLE', 'NJP-GHY': null } },
  { trainId: '12345', seatNumber: 'S5-44', coachId: 'S5', availability: { 'HWH-GHY': null } },
  { trainId: '12345', seatNumber: 'S6-10', coachId: 'S6', availability: { 'HWH-BWN': 'AVAILABLE', 'BWN-GHY': null } },
  { trainId: '12345', seatNumber: 'S6-11', coachId: 'S6', availability: { 'HWH-GHY': 'AVAILABLE' } },
  { trainId: '12345', seatNumber: 'S6-12', coachId: 'S6', availability: { 'HWH-NJP': null, 'NJP-GHY': 'AVAILABLE' } },

  // ── 12002 Bhopal Shatabdi ────────────────────────────────────────────────────
  { trainId: '12002', seatNumber: 'CC-14', coachId: 'CC1', availability: { 'NDLS-HBJ': 'AVAILABLE' } },
  { trainId: '12002', seatNumber: 'CC-22', coachId: 'CC1', availability: { 'NDLS-JHS': 'AVAILABLE', 'JHS-HBJ': null } },
  { trainId: '12002', seatNumber: 'CC-38', coachId: 'CC1', availability: { 'NDLS-JHS': null, 'JHS-HBJ': 'AVAILABLE' } },
  { trainId: '12002', seatNumber: 'EC-6',  coachId: 'EC1', availability: { 'NDLS-HBJ': 'AVAILABLE' } },
  { trainId: '12002', seatNumber: 'EC-10', coachId: 'EC1', availability: { 'NDLS-BPL': 'AVAILABLE', 'BPL-HBJ': null } },

  // ── 12627 Karnataka Express ──────────────────────────────────────────────────
  { trainId: '12627', seatNumber: 'S1-5',  coachId: 'S1', availability: { 'SBC-NDLS': 'AVAILABLE' } },
  { trainId: '12627', seatNumber: 'S2-20', coachId: 'S2', availability: { 'SBC-NGP': 'AVAILABLE', 'NGP-NDLS': null } },
  { trainId: '12627', seatNumber: 'S3-15', coachId: 'S3', availability: { 'SBC-NGP': null, 'NGP-NDLS': 'AVAILABLE' } },
  { trainId: '12627', seatNumber: 'S4-8',  coachId: 'S4', availability: { 'SBC-SC': 'AVAILABLE', 'SC-NDLS': null } },
  { trainId: '12627', seatNumber: 'S4-35', coachId: 'S4', availability: { 'SBC-SC': null, 'SC-NDLS': 'AVAILABLE' } },

  // ── 12723 Telangana Express ──────────────────────────────────────────────────
  { trainId: '12723', seatNumber: 'S1-10', coachId: 'S1', availability: { 'NDLS-SC': 'AVAILABLE' } },
  { trainId: '12723', seatNumber: 'S2-18', coachId: 'S2', availability: { 'NDLS-NGP': 'AVAILABLE', 'NGP-SC': null } },
  { trainId: '12723', seatNumber: 'S3-4',  coachId: 'S3', availability: { 'NDLS-NGP': null, 'NGP-SC': 'AVAILABLE' } },

  // ── 12502 Poorvottar Sampark Kranti ─────────────────────────────────────────
  { trainId: '12502', seatNumber: 'S3-6',  coachId: 'S3', availability: { 'NDLS-GHY': 'AVAILABLE' } },
  { trainId: '12502', seatNumber: 'S4-24', coachId: 'S4', availability: { 'NDLS-NJP': 'AVAILABLE', 'NJP-GHY': null } },
  { trainId: '12502', seatNumber: 'S5-16', coachId: 'S5', availability: { 'NDLS-NJP': null, 'NJP-GHY': 'AVAILABLE' } },
  { trainId: '12502', seatNumber: 'S6-30', coachId: 'S6', availability: { 'NDLS-PNBE': 'AVAILABLE', 'PNBE-GHY': null } },

  // ── 12953 August Kranti Rajdhani ─────────────────────────────────────────────
  { trainId: '12953', seatNumber: 'A1-3',  coachId: 'A1', availability: { 'BCT-NZM': 'AVAILABLE' } },
  { trainId: '12953', seatNumber: 'B1-20', coachId: 'B1', availability: { 'BCT-KOTA': 'AVAILABLE', 'KOTA-NZM': null } },
  { trainId: '12953', seatNumber: 'B2-12', coachId: 'B2', availability: { 'BCT-KOTA': null, 'KOTA-NZM': 'AVAILABLE' } },

  // ── 12313 Sealdah Rajdhani ───────────────────────────────────────────────────
  { trainId: '12313', seatNumber: 'A1-7',  coachId: 'A1', availability: { 'SDAH-NDLS': 'AVAILABLE' } },
  { trainId: '12313', seatNumber: 'B1-15', coachId: 'B1', availability: { 'SDAH-DDU': 'AVAILABLE', 'DDU-NDLS': null } },
  { trainId: '12313', seatNumber: 'B2-9',  coachId: 'B2', availability: { 'SDAH-DDU': null, 'DDU-NDLS': 'AVAILABLE' } },

  // ── 12841 Coromandel Express ──────────────────────────────────────────────────
  { trainId: '12841', seatNumber: 'S1-5',  coachId: 'S1', availability: { 'HWH-MAS':  null } },
  { trainId: '12841', seatNumber: 'S2-12', coachId: 'S2', availability: { 'HWH-KGP':  'AVAILABLE', 'KGP-MAS': null } },
  { trainId: '12841', seatNumber: 'S3-28', coachId: 'S3', availability: { 'HWH-KGP':  null, 'KGP-MAS': 'AVAILABLE' } },

  // ── 18645 East Coast Express ─────────────────────────────────────────────────
  { trainId: '18645', seatNumber: 'S4-7',  coachId: 'S4', availability: { 'HWH-VSKP': null } },
  { trainId: '18645', seatNumber: 'S5-19', coachId: 'S5', availability: { 'HWH-KGP':  null, 'KGP-VSKP': 'AVAILABLE' } },
  { trainId: '18645', seatNumber: 'S6-33', coachId: 'S6', availability: { 'HWH-BBS':  null, 'BBS-VSKP': 'AVAILABLE' } },

  // ── DEMO: split scenario entries ─────────────────────────────────────────────
  // Train 12301, HWH→ALD: no direct seat; split via GAYA works
  //   Leg 1: B1-30 covers HWH→GAYA (already exists above)
  //   Leg 2: A2-7  covers GAYA→ALD  ← added here for the demo
  { trainId: '12301', seatNumber: 'A2-7',  coachId: 'A2', availability: { 'GAYA-ALD': 'AVAILABLE', 'ALD-NDLS': null } },
];

// ═══════════════════════════════════════════════════════════════════════════════
//  CROWD DATA — per-train coach crowd levels
// ═══════════════════════════════════════════════════════════════════════════════

function crowdFor(trainNo: string, coaches: [string, DensityLevel][]): CrowdReport[] {
  return coaches.map(([coachId, densityLevel]) => ({
    trainNo, coachId, densityLevel, timestamp: Date.now(), isSynced: true,
  }));
}

export const MOCK_CROWD_DATA: CrowdReport[] = [
  ...crowdFor('12301', [
    ['GEN-1','HIGH'], ['GEN-2','HIGH'], ['S1','MEDIUM'], ['S2','LOW'],
    ['S3','LOW'], ['S4','MEDIUM'], ['S5','LOW'], ['B1','LOW'],
    ['B2','LOW'], ['B3','LOW'], ['A1','LOW'], ['A2','LOW'],
  ]),
  ...crowdFor('12951', [
    ['GEN-1','HIGH'], ['GEN-2','HIGH'], ['S1','HIGH'], ['S2','MEDIUM'],
    ['S3','LOW'], ['B1','LOW'], ['B2','LOW'], ['A1','LOW'],
  ]),
  ...crowdFor('12621', [
    ['GEN-1','HIGH'], ['GEN-2','HIGH'], ['S1','HIGH'], ['S2','HIGH'],
    ['S3','MEDIUM'], ['S4','LOW'], ['S5','LOW'], ['A1','LOW'],
  ]),
  ...crowdFor('12345', [
    ['GEN-1','HIGH'], ['GEN-2','HIGH'], ['S1','MEDIUM'], ['S2','LOW'],
    ['S3','LOW'], ['S4','MEDIUM'], ['S5','LOW'], ['S6','LOW'], ['A1','LOW'],
  ]),
  ...crowdFor('12002', [
    ['CC1','MEDIUM'], ['CC2','MEDIUM'], ['CC3','LOW'], ['EC1','LOW'],
  ]),
  ...crowdFor('12627', [
    ['GEN-1','HIGH'], ['GEN-2','HIGH'], ['S1','HIGH'], ['S2','MEDIUM'],
    ['S3','LOW'], ['S4','LOW'], ['A1','LOW'],
  ]),
  ...crowdFor('12723', [
    ['GEN-1','HIGH'], ['GEN-2','HIGH'], ['S1','HIGH'], ['S2','MEDIUM'],
    ['S3','LOW'], ['A1','LOW'],
  ]),
  ...crowdFor('12502', [
    ['GEN-1','HIGH'], ['GEN-2','HIGH'], ['S1','HIGH'], ['S2','MEDIUM'],
    ['S3','LOW'], ['S4','LOW'], ['S5','LOW'], ['S6','LOW'],
  ]),
  ...crowdFor('12953', [
    ['GEN-1','HIGH'], ['S1','MEDIUM'], ['B1','LOW'], ['B2','LOW'], ['A1','LOW'],
  ]),
  ...crowdFor('12313', [
    ['GEN-1','HIGH'], ['S1','MEDIUM'], ['B1','LOW'], ['B2','LOW'], ['A1','LOW'],
  ]),
  ...crowdFor('12841', [
    ['GEN-1','HIGH'], ['S1','HIGH'], ['S2','MEDIUM'], ['S3','LOW'], ['S4','LOW'],
  ]),
  ...crowdFor('18645', [
    ['GEN-1','HIGH'], ['S1','HIGH'], ['S2','HIGH'], ['S3','MEDIUM'], ['S4','LOW'],
  ]),
];

// ═══════════════════════════════════════════════════════════════════════════════
//  STATION MASTER — code ↔ name lookup
// ═══════════════════════════════════════════════════════════════════════════════

export const STATION_NAMES: Record<string, string> = {
  // Metros & Terminals
  NDLS: 'New Delhi',        NZM: 'Hazrat Nizamuddin',  DLI: 'Old Delhi',
  HWH:  'Howrah Jn',       SDAH: 'Sealdah',            BCT: 'Mumbai Central',
  CSTM: 'Mumbai CST',      MAS:  'Chennai Central',    SBC: 'Bangalore City Jn',
  SC:   'Secunderabad Jn', HYB:  'Hyderabad Decan',    PUNE: 'Pune Jn',
  AMD:  'Ahmedabad Jn',    BRC:  'Vadodara Jn',        STD: 'Surat',
  // North
  LKO:  'Lucknow Jn',      CNB:  'Kanpur Central',     ALD:  'Prayagraj Jn',
  BSB:  'Varanasi Jn',     GKP:  'Gorakhpur Jn',       CPR:  'Chhapra Jn',
  PNBE: 'Patna Jn',        RJPB: 'Rajendra Nagar',     MGS:  'Mughalsarai Jn',
  DDU:  'Pt. D.D. Upadhyaya Jn',
  // East
  ASN:  'Asansol Jn',      DHN:  'Dhanbad Jn',         GAYA: 'Gaya Jn',
  BGP:  'Bhagalpur Jn',    JSME: 'Jasidih Jn',         JMP:  'Jamalpur Jn',
  KIU:  'Kishanganj',      NJP:  'New Jalpaiguri',     NBQ:  'New Bongaigaon',
  GHY:  'Guwahati',        BDC:  'Bandel Jn',          BWN:  'Barddhaman Jn',
  KGP:  'Kharagpur Jn',    BLS:  'Balasore',           BBS:  'Bhubaneswar',
  VSKP: 'Visakhapatnam',   PURI: 'Puri',               CTC:  'Cuttack Jn',
  // Central & West
  BPL:  'Bhopal Jn',       HBJ:  'Habibganj',          NGP:  'Nagpur',
  JHS:  'Jhansi Jn',       GWL:  'Gwalior Jn',         AGC:  'Agra Cantt',
  MTJ:  'Mathura Jn',      RTM:  'Ratlam Jn',          KOTA: 'Kota Jn',
  BIN:  'Bina Jn',         ITJ:  'Itarsi Jn',          ET:   'Itarsi',
  // South
  GTL:  'Guntakal Jn',     WADI: 'Wadi',               BPQ:  'Balharshah',
  RU:   'Renigunta Jn',    GTL2: 'Guntakal',            UBL:  'Hubballi Jn',
  DMM:  'Davanagere',
};

// Legacy alias used by seatAlgorithm
export const STATION_CODES: Record<string, string> = Object.fromEntries(
  Object.entries(STATION_NAMES).map(([code, name]) => [name, code])
);

// ═══════════════════════════════════════════════════════════════════════════════
//  TRAIN AVAILABILITY — mock seat status per train (shown on results screen)
// ═══════════════════════════════════════════════════════════════════════════════

export const TRAIN_AVAILABILITY: Record<string, { status: 'AVAILABLE' | 'RAC' | 'WL'; count: number; cls: string }> = {
  '12301': { status: 'WL',        count: 47, cls: '3A' },
  '12951': { status: 'AVAILABLE', count: 8,  cls: '3A' },
  '12621': { status: 'WL',        count: 23, cls: 'SL' },
  '12627': { status: 'AVAILABLE', count: 15, cls: 'SL' },
  '12345': { status: 'WL',        count: 18, cls: 'SL' },
  '12002': { status: 'AVAILABLE', count: 32, cls: 'CC' },
  '12723': { status: 'WL',        count: 61, cls: 'SL' },
  '12502': { status: 'RAC',       count: 6,  cls: 'SL' },
  '12953': { status: 'WL',        count: 34, cls: '3A' },
  '12313': { status: 'WL',        count: 29, cls: '3A' },
  '12841': { status: 'WL',        count: 38, cls: 'SL' },
  '18645': { status: 'WL',        count: 15, cls: 'SL' },
};
