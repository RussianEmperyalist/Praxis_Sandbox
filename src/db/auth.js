import { idb } from './idb.js';

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;
const BCRYPT_ROUNDS = 10;
const TOKEN_KEY = 'auth_token';

let bcrypt = null;

async function loadBcrypt() {
    if (bcrypt) return bcrypt;

    // bcryptjs is a UMD bundle included as a classic <script> in index.html, which
    // registers window.dcodeIO.bcrypt. Loading it with fetch + eval does not work
    // inside an ES module: the bundle is strict-mode there, so its UMD wrapper
    // receives `this === undefined` and cannot reach the global object.
    const lib = typeof window !== 'undefined' && window.dcodeIO
        ? window.dcodeIO.bcrypt
        : null;

    if (!lib || typeof lib.hash !== 'function') {
        console.error('bcryptjs is not available on window.dcodeIO.bcrypt');
        throw new Error('Не удалось загрузить библиотеку шифрования');
    }

    bcrypt = lib;
    return bcrypt;
}

function generateToken() {
    return crypto.randomUUID();
}

function generateSessionId() {
    return crypto.randomUUID();
}

function persistToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

export const auth = {
    async register(username, password) {
        const existingUser = await idb.users.get(username);
        if (existingUser) {
            throw new Error('Пользователь с таким именем уже существует');
        }

        const bcryptLib = await loadBcrypt();
        const passwordHash = await bcryptLib.hash(password, BCRYPT_ROUNDS);

        const user = {
            username,
            passwordHash,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        await idb.users.set(user);

        // Registration signs the user in right away, otherwise the app would
        // bounce back to the auth screen with no session token stored.
        const token = generateToken();
        await idb.sessions.set({
            token,
            username,
            sessionId: generateSessionId(),
            createdAt: Date.now(),
            expiresAt: Date.now() + SESSION_DURATION
        });
        persistToken(token);

        return { success: true, username, token };
    },

    async login(username, password) {
        const user = await idb.users.get(username);
        if (!user) {
            throw new Error('Неверное имя пользователя или пароль');
        }

        const bcryptLib = await loadBcrypt();
        const isValid = await bcryptLib.compare(password, user.passwordHash);
        if (!isValid) {
            throw new Error('Неверное имя пользователя или пароль');
        }

        const token = generateToken();
        const session = {
            token,
            username,
            sessionId: generateSessionId(),
            createdAt: Date.now(),
            expiresAt: Date.now() + SESSION_DURATION
        };

        await idb.sessions.set(session);
        persistToken(token);

        return { success: true, token, username };
    },

    async logout(token) {
        await idb.sessions.delete(token);
        return { success: true };
    },

    async validateSession(token) {
        const session = await idb.sessions.get(token);
        if (!session) {
            return { valid: false };
        }

        if (Date.now() > session.expiresAt) {
            await idb.sessions.delete(token);
            return { valid: false };
        }

        const user = await idb.users.get(session.username);
        if (!user) {
            await idb.sessions.delete(token);
            return { valid: false };
        }

        session.expiresAt = Date.now() + SESSION_DURATION;
        await idb.sessions.set(session);

        return { valid: true, username: session.username, user };
    },

    async getCurrentUser() {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) return null;

        const result = await this.validateSession(token);
        if (!result.valid) {
            localStorage.removeItem(TOKEN_KEY);
            return null;
        }

        return result.user;
    },

    setToken(token) {
        persistToken(token);
    },

    clearToken() {
        localStorage.removeItem(TOKEN_KEY);
    },

    getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }
};

export default auth;