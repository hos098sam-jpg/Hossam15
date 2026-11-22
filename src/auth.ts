import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  setDoc,
  getDoc,
  getDocFromCache,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import type { User } from './types';
import { getSecureCache, setSecureCache } from './utils/secureStorage';
import { getDeviceInfoPayload } from './utils/deviceFingerprint';

const firebaseConfig = {
  apiKey: "AIzaSyDdwnLfJbsQ8hbXP-CzocjaejmvYC4FOh4",
  authDomain: "alesraa-academy.firebaseapp.com",
  projectId: "alesraa-academy",
  storageBucket: "alesraa-academy.firebasestorage.app",
  messagingSenderId: "158593983527",
  appId: "1:158593983527:web:4646886c1bd03491109a02",
  measurementId: "G-KQ152GCF4W"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

let firestoreDb: ReturnType<typeof getFirestore>;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch {
  firestoreDb = getFirestore(app);
}
export const db = firestoreDb;

export function getFriendlyAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التأكد من صحة البيانات أو استعادة كلمة المرور.';
    case 'auth/email-already-in-use':
      return 'البريد الإلكتروني مسجل مسبقاً في المنصة، يرجى تسجيل الدخول بدلاً من إنشاء حساب جديد.';
    case 'auth/weak-password':
      return 'كلمة المرور ضعيفة، يرجى كتابة كلمة مرور قوية لا تقل عن 6 خانات.';
    case 'auth/invalid-email':
      return 'صيغة البريد الإلكتروني غير صالحة، يرجى التأكد من كتابة البريد بشكل صحيح.';
    case 'auth/too-many-requests':
      return 'تم حظر المحاولات مؤقتاً بسبب تكرار الطلبات الخاطئة، يرجى الانتظار والمحاولة لاحقاً.';
    case 'auth/network-request-failed':
      return 'تعذر الاتصال بالشبكة، يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً.';
    case 'auth/user-disabled':
      return 'تم تعطيل هذا الحساب من قبل إدارة المنصة، يرجى التواصل مع المشرف العام.';
    case 'auth/requires-recent-login':
      return 'يرجى إعادة تسجيل الدخول للتحقق من هويتك قبل تنفيذ هذه العملية.';
    case 'auth/popup-closed-by-user':
      return 'تم إغلاق نافذة تسجيل الدخول قبل إتمام العملية.';
    default:
      return 'حدث خطأ أثناء الاتصال بالخادم، يرجى المحاولة مرة أخرى.';
  }
}

export async function loginWithEmail(email: string, pass: string): Promise<any> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = pass.trim();
  const credential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
  return credential.user;
}

let pendingSignupProfile: Partial<User> | null = null;

export function getPendingSignupProfile(): Partial<User> | null {
  return pendingSignupProfile;
}

export async function signupWithEmail(
  email: string,
  pass: string,
  profileData: Partial<User>
): Promise<{ user: any; profile: User }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = pass.trim();
  const deviceInfo = await getDeviceInfoPayload().catch(() => ({ deviceId: '', deviceName: '' }));

  const compositeName = [
    profileData.firstName,
    profileData.secondName,
    profileData.thirdName,
    profileData.lastName,
  ]
    .map((s) => (s || '').trim())
    .filter(Boolean)
    .join(' ');

  const resolvedStudentName =
    (profileData.name && profileData.name.trim() && profileData.name.trim() !== 'مستخدم منصة المتفلسفة '
      ? profileData.name.trim()
      : compositeName) || 'طالب منصة المتفلسفة ';

  const enrichedProfileData: Partial<User> = {
    ...profileData,
    name: resolvedStudentName,
    email: cleanEmail,
    role: 'student',
    platform: 'al_motafalsifa',
    status: 'active',
    schoolYear: 'الصف الأول الثانوي',
    enrolledCourseIds: [],
    examResults: {},
  };

  pendingSignupProfile = enrichedProfileData;

  const credential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
  const fbUser = credential.user;

  pendingSignupProfile = { ...enrichedProfileData, id: fbUser.uid };
  setSecureCache('al_motafalsifa_current_user', { ...enrichedProfileData, id: fbUser.uid });

  try {
    await updateProfile(fbUser, { displayName: resolvedStudentName });
  } catch {}

  const userRef = doc(db, 'users', fbUser.uid);
  const userDoc: Record<string, any> = {
    uid: fbUser.uid,
    id: fbUser.uid,
    name: resolvedStudentName,
    firstName: profileData.firstName || '',
    secondName: profileData.secondName || '',
    thirdName: profileData.thirdName || '',
    lastName: profileData.lastName || '',
    email: cleanEmail,
    phone: profileData.phone || '',
    parentPhone: profileData.parentPhone || profileData.fatherPhone || profileData.motherPhone || '',
    fatherPhone: profileData.fatherPhone || '',
    motherPhone: profileData.motherPhone || '',
    nationalId: profileData.nationalId || '',
    governorate: profileData.governorate || 'السويس',
    schoolName: profileData.schoolName || '',
    educationSystem: profileData.educationSystem || 'عربي',
    division: profileData.division || '',
    religion: profileData.religion || 'التربية الدينية الإسلامية',
    gender: profileData.gender || 'ذكر',
    schoolYear: 'الصف الأول الثانوي',
    role: 'student',
    platform: 'al_motafalsifa',
    status: 'active',
    emailVerified: true,
    currentDeviceId: deviceInfo.deviceId || undefined,
    currentDeviceName: deviceInfo.deviceName || undefined,
    enrolledCourseIds: [],
    examResults: {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    registeredAt: new Date().toISOString().split('T')[0],
  };

  try {
    await setDoc(userRef, userDoc, { merge: true });
  } catch (firestoreError: any) {
    pendingSignupProfile = null;
    throw new Error('فشل حفظ بيانات الحساب. يرجى المحاولة مرة أخرى.');
  }

  const finalProfile = {
    ...userDoc,
    name: resolvedStudentName,
    examResults: {},
  } as unknown as User;

  setSecureCache('al_motafalsifa_current_user', finalProfile);
  pendingSignupProfile = null;
  return { user: fbUser, profile: finalProfile };
}

export async function resetPassword(email: string) {
  const cleanEmail = email.trim();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('الرجاء إدخال بريد إلكتروني صالح.');
  }
  return await sendPasswordResetEmail(auth, cleanEmail);
}

export async function resendEmailVerification() {
  if (!auth.currentUser) {
    throw new Error('يجب تسجيل الدخول لإعادة إرسال رسالة التفعيل.');
  }
  return await sendEmailVerification(auth.currentUser);
}

export async function logoutUser() {
  return await firebaseSignOut(auth);
}

export async function getFirebaseIdToken(forceRefresh: boolean = false): Promise<string | null> {
  if (!auth.currentUser) return null;
  try {
    return await auth.currentUser.getIdToken(forceRefresh);
  } catch (e) {
    console.error('Error getting Firebase ID token:', e);
    return null;
  }
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const fbToken = await getFirebaseIdToken();
  let token = fbToken;
  if (!token && typeof window !== 'undefined') {
    try {
      token = localStorage.getItem('al_motafalsifa_auth_token');
    } catch {}
  }
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(url, { ...options, headers });
}

function isBlockedUser(uid: string, data?: any): boolean {
  if (uid === 'teacher-1822115595240' || uid === 'SfE3LtThTFfDbYBAQuTsdLaRXVs1') return true;
  if (data) {
    if (data.phone === 'teacher-4879' || data.phone === '4879') return true;
    if (data.name?.trim() === 'حسام احمد مساعد') return true;
    const email = String(data.email || '').trim().toLowerCase();
    if (email.endsWith('@qalb-alam.edu') || email.endsWith('@qalbalelm.edu')) return true;
    if (data.platform === 'qalb_al_elm') return true;
  }
  return false;
}

export async function fetchUserProfile(uid: string): Promise<User | null> {
  if (isBlockedUser(uid)) return null;
  try {
    const userDocRef = doc(db, 'users', uid);
    let snap: any = null;
    try {
      snap = await getDocFromCache(userDocRef);
    } catch {}
    const cachedData = snap?.exists?.() ? snap.data() : null;
    if (!snap || !snap.exists() || !cachedData?.name || cachedData?.name === 'مستخدم منصة المتفلسفة ' || !cachedData?.phone) {
      try {
        const freshSnap = await getDoc(userDocRef);
        if (freshSnap && freshSnap.exists()) snap = freshSnap;
      } catch {}
    }
    if (snap && snap.exists()) {
      const data = snap.data() as User;
      if (isBlockedUser(uid, data)) return null;
      const compositeName = [data.firstName, data.secondName, data.thirdName, data.lastName]
        .map((s) => (s || '').trim())
        .filter(Boolean)
        .join(' ');
      const isOwnerTeacherEmail = String(data.email || '').trim().toLowerCase() === 'almtflsft@gmail.com';
      const repairedName =
        data.name && data.name.trim() && data.name.trim() !== 'مستخدم منصة المتفلسفة ' && data.name.trim() !== 'طالب منصة المتفلسفة '
          ? data.name.trim()
          : compositeName || (data.email === 'hos098sam@gmail.com' ? 'إدارة المنصة' : isOwnerTeacherEmail ? 'أ/ سوزان كريم فهمي' : data.name);
      const emailPhoneMatch = (data.email || '').match(/^(\d{10,14})@al-motafalsifa\.edu$/i);
      const repairedPhone = (data.phone && data.phone.trim()) || (emailPhoneMatch ? emailPhoneMatch[1] : '');
      const repairedParentPhone = (data.parentPhone && data.parentPhone.trim()) || data.fatherPhone || data.motherPhone || '';
      return {
        ...data,
        role: isOwnerTeacherEmail ? 'teacher' : data.role,
        name: repairedName,
        phone: repairedPhone,
        parentPhone: repairedParentPhone,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile from Firestore:', error);
    return null;
  }
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  return await signInWithPopup(auth, provider);
}

export function subscribeToAuthChanges(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export function formatPhoneE164(phone: string): string {
  let clean = phone.trim().replace(/[\s\-\(\)]/g, '');
  if (clean.startsWith('+')) return clean;
  if (clean.startsWith('00')) return '+' + clean.slice(2);
  if (clean.startsWith('01')) return '+2' + clean;
  if (clean.startsWith('1') && clean.length === 10) return '+20' + clean;
  if (clean.startsWith('0')) return '+2' + clean;
  return '+20' + clean;
}

export async function getIdToken(forceRefresh: boolean = false): Promise<string | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  return await currentUser.getIdToken(forceRefresh);
}

export async function deleteUserFromFirestore(uid: string): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', uid);
    await deleteDoc(userRef);
    return true;
  } catch (err) {
    console.warn('Error deleting user doc from Firestore:', err);
    return false;
  }
}

export async function getIdTokenFromAuth(forceRefresh: boolean = false): Promise<string | null> {
  try {
    if (auth.currentUser) return await auth.currentUser.getIdToken(forceRefresh);
  } catch (err) {
    console.warn('Failed to retrieve Firebase ID token:', err);
  }
  return null;
}
