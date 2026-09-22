const DB_NAME = 'praxis-sandbox';
const DB_VERSION = 1;
const STORE_USERS = 'users';
const STORE_SESSIONS = 'sessions';
const STORE_PROGRESS = 'progress';
const STORE_PROTOCOLS = 'protocols';

let dbPromise = null;

function openDB() {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            if (!db.objectStoreNames.contains(STORE_USERS)) {
                const userStore = db.createObjectStore(STORE_USERS, { keyPath: 'username' });
            }

            if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
                db.createObjectStore(STORE_SESSIONS, { keyPath: 'token' });
            }

            if (!db.objectStoreNames.contains(STORE_PROGRESS)) {
                const progressStore = db.createObjectStore(STORE_PROGRESS, { keyPath: 'id', autoIncrement: true });
                progressStore.createIndex('user_module', ['username', 'moduleId'], { unique: false });
            }

            if (!db.objectStoreNames.contains(STORE_PROTOCOLS)) {
                db.createObjectStore(STORE_PROTOCOLS, { keyPath: 'id' });
            }
        };
    });

    return dbPromise;
}

export const idb = {
    async get(storeName, key) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async set(storeName, value) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(value);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async delete(storeName, key) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    async list(storeName, indexName = null, query = null) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            let request;

            if (indexName && query !== null) {
                const index = store.index(indexName);
                request = index.getAll(query);
            } else {
                request = store.getAll();
            }

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async clear(storeName) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    get users() {
        return {
            get: (username) => this.get(STORE_USERS, username),
            set: (user) => this.set(STORE_USERS, user),
            delete: (username) => this.delete(STORE_USERS, username),
            list: () => this.list(STORE_USERS)
        };
    },

    get sessions() {
        return {
            get: (token) => this.get(STORE_SESSIONS, token),
            set: (session) => this.set(STORE_SESSIONS, session),
            delete: (token) => this.delete(STORE_SESSIONS, token),
            list: () => this.list(STORE_SESSIONS)
        };
    },

    get progress() {
        return {
            get: (id) => this.get(STORE_PROGRESS, id),
            set: (record) => this.set(STORE_PROGRESS, record),
            delete: (id) => this.delete(STORE_PROGRESS, id),
            list: (username, moduleId) => this.list(STORE_PROGRESS, 'user_module', [username, moduleId]),
            listAll: () => this.list(STORE_PROGRESS)
        };
    },

    get protocols() {
        return {
            get: (id) => this.get(STORE_PROTOCOLS, id),
            set: (protocol) => this.set(STORE_PROTOCOLS, protocol),
            delete: (id) => this.delete(STORE_PROTOCOLS, id),
            list: () => this.list(STORE_PROTOCOLS)
        };
    }
};

export default idb;