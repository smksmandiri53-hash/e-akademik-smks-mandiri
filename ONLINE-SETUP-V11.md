# e-Akademik SMKS Mandiri ONLINE V11

## Konsep hak akses

### 1. ADMIN
Admin adalah pengendali penuh sistem:
- data siswa kelas X-XII
- data guru
- data wali kelas
- mata pelajaran
- nilai
- kehadiran
- perilaku
- prestasi/kegiatan
- raport
- pengaturan sekolah
- akun pengguna dan role
- dapat mengubah/menghapus data yang diperlukan

### 2. GURU
Guru memiliki akun masing-masing dan dapat masuk menggunakan username + password.
Pada versi ini Guru termasuk staff aplikasi sehingga dapat mengelola data akademik yang tersedia.
Pembatasan khusus per mata pelajaran dapat ditambahkan pada tahap berikutnya.

### 3. WALI KELAS
Wali Kelas memiliki akun masing-masing dan dapat mengelola data akademik melalui sistem.
Pada versi ini Wali Kelas termasuk staff aplikasi sehingga dapat mengubah data akademik.
Pembatasan khusus per rombel dapat ditambahkan pada tahap berikutnya.

### 4. SISWA
Setiap siswa memiliki akun sendiri.
Siswa:
- hanya melihat data akademiknya sendiri;
- tidak dapat mengubah nilai;
- tidak dapat mengubah kehadiran;
- tidak dapat mengubah perilaku;
- tidak dapat mengubah prestasi/data akademik;
- tidak dapat mengubah siswa lain;
- hanya dapat mengubah tiga data profil: alamat, nama wali, nomor HP wali.

Pembatasan tersebut diterapkan pada Firestore Rules, bukan hanya pada tampilan.

## Struktur login

Aplikasi memakai Firebase Authentication Email/Password.
Login memakai username yang dipetakan menjadi:
`username@eakademik-smksmandiri.local`

Contoh:
- admin -> admin@eakademik-smksmandiri.local
- guru001 -> guru001@eakademik-smksmandiri.local
- wali001 -> wali001@eakademik-smksmandiri.local
- 1234567890 -> 1234567890@eakademik-smksmandiri.local

Setiap akun harus dibuat di Firebase Authentication, kemudian dibuatkan profil:
`users/{UID}`

Contoh Admin:
{
  "username": "admin",
  "role": "admin",
  "name": "Administrator"
}

Contoh Guru:
{
  "username": "guru001",
  "role": "guru",
  "name": "Nama Guru"
}

Contoh Wali:
{
  "username": "wali001",
  "role": "wali",
  "name": "Nama Wali Kelas"
}

Contoh Siswa:
{
  "username": "1234567890",
  "role": "siswa",
  "studentId": "ID_SISWA_DI_COLLECTION_STUDENTS"
}

## Database

schoolData/students/items/{id}
schoolData/teachers/items/{id}
schoolData/subjects/items/{id}
schoolData/grades/items/{id}
schoolData/behavior/items/{id}
schoolData/attendance/items/{id}
schoolData/extra/items/{id}
schoolData/settings
users/{UID}

## Online gratis

Frontend dapat dipasang di GitHub Pages.
Database + login memakai Firebase Spark/no-cost selama pemakaian berada dalam kuota gratis.

Catatan: GitHub Pages hanya menjadi tempat file HTML/CSS/JS. Data sekolah tetap berada di Firebase Firestore.

## Urutan pemasangan

1. Firebase Console -> Authentication -> Sign-in method -> Email/Password -> Enable.
2. Firebase Console -> Firestore Database -> Create database.
3. Firestore -> Rules -> tempel isi `firestore.rules` -> Publish.
4. Authentication -> Users -> buat akun admin, guru, wali, dan siswa.
5. Salin UID setiap akun.
6. Firestore -> buat collection `users` dan document dengan ID = UID.
7. Isi role sesuai akun.
8. Upload isi ZIP ke repository GitHub.
9. Aktifkan GitHub Pages.
10. Buka alamat GitHub Pages dari HP/laptop.

## Catatan keamanan

- Firebase Web Config boleh berada di frontend; keamanan database ditentukan oleh Firestore Security Rules.
- Jangan pernah memasukkan Service Account private key ke file ZIP atau GitHub.
- Password tidak disimpan di Firestore; Firebase Authentication yang menangani password.
