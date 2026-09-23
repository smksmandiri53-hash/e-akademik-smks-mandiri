# e-Akademik SMKS Mandiri V9 — Online

Versi ini disiapkan untuk:
- GitHub Pages sebagai frontend.
- Firebase Authentication untuk login.
- Cloud Firestore untuk database online.
- Role: admin, guru, wali, operator, siswa.
- Siswa hanya membaca data akademiknya sendiri.
- Siswa tidak dapat menulis nilai, kehadiran, perilaku, prestasi, atau data akademik.
- Siswa dapat mengirim pengajuan perubahan data diri melalui `profileRequests`.
- Admin/Wali/Guru mengelola data akademik.
- Raport V8 tetap digunakan, termasuk alamat, nama wali, dan TTD wali.

## 1. Buat Firebase
1. Buka Firebase Console.
2. Create project baru.
3. Tambahkan Web App.
4. Aktifkan Authentication > Sign-in method > Email/Password.
5. Buat Firestore Database.
6. Salin Firebase Web Config ke `firebase-config.js`.

## 2. Deploy rules
Gunakan isi `firestore.rules` pada Firestore Rules.

## 3. Membuat akun
Firebase Authentication harus memiliki akun untuk setiap pengguna. Karena login aplikasi memakai username, aplikasi memetakan:
`username` -> `username@eakademik-smksmandiri.local`

Contoh:
- username `admin` menjadi `admin@eakademik-smksmandiri.local`
- username `1234567890` menjadi `1234567890@eakademik-smksmandiri.local`

Setelah akun dibuat di Authentication, buat dokumen:
`users/{UID}`

Admin:
{
  "username": "admin",
  "role": "admin",
  "name": "Administrator"
}

Guru:
{
  "username": "123456789",
  "role": "guru",
  "name": "Nama Guru"
}

Wali kelas:
{
  "username": "987654321",
  "role": "wali",
  "name": "Nama Wali Kelas"
}

Siswa:
{
  "username": "1234567890",
  "role": "siswa",
  "studentId": "ID_SISWA_DI_COLLECTION_STUDENTS"
}

## 4. Data akademik
Collection yang dipakai:
schoolData/students/items/{id}
schoolData/teachers/items/{id}
schoolData/subjects/items/{id}
schoolData/grades/items/{id}
schoolData/behavior/items/{id}
schoolData/attendance/items/{id}
schoolData/extra/items/{id}
schoolData/settings

## 5. Penting
Jangan memasukkan Service Account private key ke GitHub.
Firebase Web API key/config bukan pengganti Firestore Security Rules. Keamanan data ditentukan oleh rules.

## 6. GitHub Pages
Upload `index.html`, `online.js`, `firebase-config.js`, `firestore.rules`, `manifest.json`, dan `sw.js` ke repository GitHub Pages.
