import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  onSnapshot, 
  query, 
  where,
  orderBy,
  doc,
  getDoc,
  getDocFromServer,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { getStorage, ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific options for better iframe/long-running session support
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const login = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);

export const storage = getStorage(app);

export { 
  collection, 
  getDocs, 
  onSnapshot, 
  query, 
  where,
  orderBy,
  doc,
  getDoc,
  getDocFromServer,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
  onAuthStateChanged,
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
};

export type VehicleStatus = "AVAILABLE" | "RESERVED" | "SOLD";

export interface Vehicle {
  id: string;
  img: string;
  name: string;
  chassis: string;
  year: number;
  priceJPY: number;
  mileage: string;
  mileageKm: number;
  grade: string;
  transmission: string;
  displacementCc: number;
  displacementLabel: string;
  status: VehicleStatus;
  featured?: boolean;
  featuredOrder?: number;
  stockNumber?: string;
  dateAdded?: string;
  images?: string[];
  description?: string;
  color?: string;
  repaired?: string;
  seatingCapacity?: number;
  driveSystem?: string;
  updatedAt?: any;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const fetchVehicles = async (): Promise<Vehicle[]> => {
  const path = "vehicles";
  try {
    const q = query(collection(db, path), orderBy("year", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Vehicle));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export async function checkIsAdmin(user: any) {
  if (!user) return false;
  if (user.email === 'canuck.in.japan@gmail.com') return true;
  
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    return userDoc.exists() && userDoc.data().role === 'admin';
  } catch (e) {
    console.error("Error checking admin status:", e);
    return false;
  }
}

export const statusStyles: Record<VehicleStatus, string> = {
  AVAILABLE: "bg-success/15 text-success border-success/30",
  RESERVED: "bg-primary/15 text-bronze border-primary/40",
  SOLD: "bg-destructive/15 text-destructive border-destructive/40",
};

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase Connection: Verified");
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();
