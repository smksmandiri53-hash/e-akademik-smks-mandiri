# e-Akademik SMKS Mandiri — Firebase Connected V10

Firebase Web configuration for project `e-akademik-smks-mandiri` has been inserted into `firebase-config.js`.

Next steps in Firebase Console:
1. Authentication → Sign-in method → enable Email/Password.
2. Firestore Database → Create database.
3. Deploy/use `firestore.rules`.
4. Create user accounts in Authentication. Then create matching documents under `users/{UID}` with a `role` (`admin`, `guru`, `wali`, `operator`, or `siswa`). For students also set `studentId`.

Do not put Firebase service-account private keys in the web project.


## V11 ROLE SYSTEM
Admin, Guru, Wali, dan Siswa menggunakan akun masing-masing. Siswa hanya dapat mengubah alamat, nama wali, dan nomor HP wali; pembatasan diterapkan melalui Firestore Security Rules.
