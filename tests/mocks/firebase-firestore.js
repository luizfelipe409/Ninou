const emptyDocs = () => ({ docs: [], forEach() {} });
const emptyDoc = () => ({ exists: () => false, data: () => ({}), id: '' });
export function memoryLocalCache() { return {}; }
export function initializeFirestore(app) { return { app }; }
export function getFirestore(app) { return { app }; }
export function doc(...parts) { return { parts }; }
export function collection(...parts) { return { parts }; }
export function collectionGroup(...parts) { return { parts }; }
export function query(source, ...constraints) { return { source, constraints }; }
export function where(...args) { return { type: 'where', args }; }
export function orderBy(...args) { return { type: 'orderBy', args }; }
export function limit(value) { return { type: 'limit', value }; }
export async function getDocs() { return emptyDocs(); }
export async function getDoc() { return emptyDoc(); }
export async function setDoc() {}
export async function updateDoc() {}
export function onSnapshot(_ref, next) { next(emptyDoc()); return () => {}; }
export async function runTransaction(_db, callback) { return callback({ get: async () => emptyDoc(), set() {}, update() {} }); }
export function serverTimestamp() { return Date.now(); }
