
/*
 * e-Akademik SMKS Mandiri - ONLINE LAYER V9
 * Backend: Firebase Authentication + Cloud Firestore
 * Isi firebase-config.js dengan konfigurasi project Firebase Anda.
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs,
  query, where, writeBatch, serverTimestamp, deleteDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const cfg = window.FIREBASE_CONFIG || {};
const configured = !!cfg.apiKey && !String(cfg.apiKey).includes("ISI_");
let app, auth, fs, originalSave;
let onlineUser = null;
let onlineProfile = null;
let onlineMode = false;

const COLLECTIONS = ["students","teachers","subjects","grades","behavior","attendance","extra"];
const STAFF = new Set(["admin","guru","wali","operator"]);

function emailFor(username){
  return String(username).trim().toLowerCase().replace(/\s+/g,"") + "@eakademik-smksmandiri.local";
}
function isStaff(){ return onlineProfile && STAFF.has(String(onlineProfile.role||"").toLowerCase()); }
function role(){ return String(onlineProfile?.role||"").toLowerCase(); }

function notify(msg){
  try { alert(msg); } catch(e) {}
}

async function readAllStaffData(){
  const next = structuredClone(window.defaultDB || {
    students:[],teachers:[],subjects:[],grades:[],behavior:[],attendance:[],extra:[],
    settings:{school:"SMKS MANDIRI BANDAR AGUNG",address:"Bandar Sribhawono, Lampung Timur, Lampung",year:"2026/2027",head:"",admin:"",kkm:75}
  });
  for(const c of COLLECTIONS){
    const snap = await getDocs(collection(fs,"schoolData",c,"items"));
    next[c] = snap.docs.map(d => ({...d.data(), id:d.data().id ?? d.id}));
  }
  const settingsSnap = await getDoc(doc(fs,"schoolData","settings"));
  if(settingsSnap.exists()) next.settings = {...next.settings, ...settingsSnap.data()};
  return next;
}

async function readStudentData(studentId){
  const next = structuredClone(window.defaultDB || {students:[],teachers:[],subjects:[],grades:[],behavior:[],attendance:[],extra:[],settings:{}});
  const sref = doc(fs,"schoolData","students","items",String(studentId));
  const ss = await getDoc(sref);
  if(ss.exists()) next.students=[{...ss.data(),id:ss.data().id ?? studentId}];

  // Subjects are safe to expose to authenticated students.
  const subs = await getDocs(collection(fs,"schoolData","subjects","items"));
  next.subjects=subs.docs.map(d=>({...d.data(),id:d.data().id ?? d.id}));

  for(const c of ["grades","behavior","attendance","extra"]){
    const q = query(collection(fs,"schoolData",c,"items"), where("sid","==",String(studentId)));
    const snap = await getDocs(q);
    next[c]=snap.docs.map(d=>({...d.data(),id:d.data().id ?? d.id}));
  }
  const settingsSnap = await getDoc(doc(fs,"schoolData","settings"));
  if(settingsSnap.exists()) next.settings={...next.settings,...settingsSnap.data()};
  return next;
}

async function syncCollection(c, arr){
  const root=collection(fs,"schoolData",c,"items");
  const existing=await getDocs(root);
  const wanted=new Set(arr.map(x=>String(x.id)));
  let batch=writeBatch(fs), count=0;
  const flush=async()=>{if(count){await batch.commit();batch=writeBatch(fs);count=0;}};
  for(const d of existing.docs){
    if(!wanted.has(d.id)){batch.delete(d.ref);count++;if(count>=450)await flush();}
  }
  for(const item of arr){
    const id=String(item.id);
    batch.set(doc(root,id), item, {merge:true});
    count++; if(count>=450) await flush();
  }
  await flush();
}

async function syncStaffData(){
  if(!isStaff()) return;
  for(const c of COLLECTIONS) await syncCollection(c, window.db?.[c] || []);
  await setDoc(doc(fs,"schoolData","settings"), {...(window.db?.settings||{}), updatedAt:serverTimestamp()},{merge:true});
}

function injectStudentUI(){
  if(role()!=="siswa") return;
  const nav=document.getElementById("sideNav");
  if(nav){
    nav.querySelectorAll(".navbtn").forEach(b=>{
      const t=b.innerText||"";
      if(!/Dashboard|Keluar/.test(t)) b.style.display="none";
    });
  }
  let box=document.getElementById("studentOnlineBox");
  if(!box){
    box=document.createElement("div");
    box.id="studentOnlineBox";
    box.className="card";
    box.style.marginTop="18px";
    const dash=document.getElementById("dashboard");
    if(dash) dash.appendChild(box);
  }
  const s=window.db?.students?.[0];
  if(!s) return;
  box.innerHTML=`
    <h3>👨‍🎓 Dashboard Siswa</h3>
    <p><b>${window.esc?.(s.name)||s.name||"-"}</b> — ${window.esc?.(s.nis||s.nisn)||s.nis||s.nisn||"-"}</p>
    <div class="grid">
      <label>Tempat Lahir<input value="${window.esc?.(s.birthPlace)||s.birthPlace||""}" readonly></label>
      <label>Tanggal Lahir<input value="${window.esc?.(s.birthDate)||s.birthDate||""}" readonly></label>
      <label>Alamat<input id="stuAddress" value="${window.esc?.(s.address)||s.address||""}"></label>
      <label>Nama Wali<input id="stuParent" value="${window.esc?.(s.parent)||s.parent||""}"></label>
      <label>No. HP Wali<input id="stuPhone" value="${window.esc?.(s.phone)||s.phone||""}"></label>
    </div>
    <div class="actions">
      <button class="success" id="saveStudentProfile">💾 Simpan Data Diri</button>
      <button class="secondary" id="changePasswordBtn">🔑 Ubah Password</button>
    </div>
    <p style="font-size:12px;color:#64748b">Siswa hanya dapat mengubah Alamat, Nama Wali, dan No. HP Wali. Nama, NIS/NISN, kelas, jurusan, nilai, kehadiran, perilaku, prestasi, dan data akademik lainnya dikunci.</p>
    <div id="studentRequestStatus" style="margin-top:10px"></div>
  `;
  box.querySelector("#saveStudentProfile").onclick=saveStudentProfile;
  box.querySelector("#changePasswordBtn").onclick=()=>notify("Untuk keamanan akun, ubah password melalui menu reset password Firebase atau minta Admin melakukan reset.");
}

async function saveStudentProfile(){
  const s=window.db?.students?.[0];
  if(!s || !onlineUser) return;
  try{
    const changes={
      address:document.getElementById("stuAddress")?.value.trim()||"",
      parent:document.getElementById("stuParent")?.value.trim()||"",
      phone:document.getElementById("stuPhone")?.value.trim()||""
    };
    await setDoc(doc(fs,"schoolData","students","items",String(s.id)), changes, {merge:true});
    Object.assign(s, changes);
    const el=document.getElementById("studentRequestStatus");
    if(el) el.innerHTML='<div class="notice success">Data diri berhasil diperbarui.</div>';
  }catch(e){
    console.error(e);
    const el=document.getElementById("studentRequestStatus");
    if(el) el.innerHTML='<div class="notice error">Data diri gagal disimpan. Hubungi Admin/Wali Kelas.</div>';
  }
}

function applyStaffUI(){
  if(!isStaff()) return;
  // Existing interface is the staff interface. The database rules are the actual protection.
  const title=document.querySelector(".brand h1");
  if(title) title.textContent=`e-Akademik — ${String(onlineProfile.role||"").toUpperCase()}`;
}

async function handleLogin(){
  if(!configured){
    notify("Firebase belum dikonfigurasi. Isi file firebase-config.js terlebih dahulu.");
    return;
  }
  const u=(document.getElementById("loginUser")?.value||"").trim();
  const p=document.getElementById("loginPass")?.value||"";
  if(!u||!p){notify("Username dan password wajib diisi.");return;}
  try{
    await signInWithEmailAndPassword(auth,emailFor(u),p);
  }catch(e){
    console.error(e);
    notify("Login gagal. Periksa username/password dan pastikan akun sudah dibuat di Firebase.");
  }
}

async function onlineLogout(){
  try{await signOut(auth);}catch(e){}
  localStorage.removeItem("eAkademikLoggedIn");
  location.reload();
}

async function onlineSave(){
  if(originalSave) originalSave();
  if(!onlineMode || !isStaff()) return;
  try{
    await syncStaffData();
  }catch(e){
    console.error(e);
    notify("Data tersimpan di layar, tetapi sinkronisasi online gagal. Periksa koneksi/database.");
  }
}

function replaceFunctions(){
  originalSave=window.save;
  window.loginLocal=handleLogin;
  window.logoutLocal=onlineLogout;
  window.save=onlineSave;
}

async function onReadyUser(user){
  onlineUser=user;
  const pSnap=await getDoc(doc(fs,"users",user.uid));
  if(!pSnap.exists()){
    await signOut(auth);
    notify("Akun belum memiliki profil pengguna di Firestore. Admin perlu mengisi users/{UID}.");
    return;
  }
  onlineProfile=pSnap.data();
  onlineMode=true;
  try{
    window.db = isStaff() ? await readAllStaffData() : await readStudentData(onlineProfile.studentId);
    if(window.fillSelects) window.fillSelects();
    if(window.renderAll) window.renderAll();
    const screen=document.getElementById("loginScreen");
    if(screen) screen.style.display="none";
    localStorage.setItem("eAkademikLoggedIn","1");
    setTimeout(()=>{injectStudentUI();applyStaffUI();},200);
  }catch(e){
    console.error(e);
    notify("Gagal memuat data online.");
  }
}

async function boot(){
  if(!configured){
    console.warn("Firebase belum dikonfigurasi. Edit firebase-config.js.");
    // Keep the existing offline app available until configuration is completed.
    return;
  }
  app=initializeApp(cfg);
  auth=getAuth(app);
  fs=getFirestore(app);
  replaceFunctions();
  onAuthStateChanged(auth, user=>{
    if(user) onReadyUser(user);
    else {
      const screen=document.getElementById("loginScreen");
      if(screen) screen.style.display="";
    }
  });
}

window.eAkademikOnline={
  get user(){return onlineUser},
  get profile(){return onlineProfile},
  get configured(){return configured},
  sync:syncStaffData
};

boot();
