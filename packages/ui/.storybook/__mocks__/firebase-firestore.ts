// Comprehensive mock for firebase/firestore used in Storybook
// Stubs all named exports that are transitively imported by app code

export class Timestamp {
  seconds: number;
  nanoseconds: number;

  constructor(seconds: number, nanoseconds: number) {
    this.seconds = seconds;
    this.nanoseconds = nanoseconds;
  }

  toDate(): Date {
    return new Date(this.seconds * 1000);
  }

  static now(): Timestamp {
    return new Timestamp(Math.floor(Date.now() / 1000), 0);
  }

  static fromDate(date: Date): Timestamp {
    return new Timestamp(Math.floor(date.getTime() / 1000), 0);
  }
}

// Query constraints
export function limit() { return {}; }
export function where() { return {}; }
export function orderBy() { return {}; }
export function startAfter() { return {}; }
export function endBefore() { return {}; }
export function startAt() { return {}; }
export function endAt() { return {}; }
export function limitToLast() { return {}; }

// Document/collection references
export function collection() { return {}; }
export function doc() { return {}; }
export function query() { return {}; }
export function documentId() { return '__id__'; }

// CRUD operations
export function getDocs() {
  return Promise.resolve({ docs: [], empty: true, size: 0, forEach: () => {} });
}
export function getDoc() {
  return Promise.resolve({ exists: () => false, data: () => null, id: '' });
}
export function setDoc() { return Promise.resolve(); }
export function updateDoc() { return Promise.resolve(); }
export function deleteDoc() { return Promise.resolve(); }
export function addDoc() { return Promise.resolve({ id: 'mock-id' }); }

// Emulator
export function connectFirestoreEmulator() {}
export function getFirestore() { return {}; }

// Field values
export function serverTimestamp() { return {}; }
export function arrayUnion() { return {}; }
export function arrayRemove() { return {}; }
export function increment() { return {}; }
export function deleteField() { return {}; }

// Snapshot listeners
export function onSnapshot() { return () => {}; }

// Aggregation
export function getCountFromServer() {
  return Promise.resolve({ data: () => ({ count: 0 }) });
}

// Batch/transaction
export function writeBatch() {
  return { set: () => {}, update: () => {}, delete: () => {}, commit: () => Promise.resolve() };
}
export function runTransaction() { return Promise.resolve(); }
