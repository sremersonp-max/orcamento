// modules/database.js
// --- BANCO DE DADOS INDEXEDDB ---
const DB_NAME = 'OficinaDB_v2'; 
const DB_VERSION = 12;
let db;

const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            const stores = [
                'clientes', 'estoque', 'categorias', 'unidades', 
                'cores', 'empresa', 'modelos', 'orcamentos', 
                'vidros_catalogo', 'financeiro'
            ];
            
            stores.forEach(store => {
                if (!db.objectStoreNames.contains(store)) {
                    db.createObjectStore(store, { keyPath: 'id', autoIncrement: true });
                }
            });
        };
        
        request.onsuccess = (event) => { 
            db = event.target.result; 
            resolve(db); 
        };
        
        request.onerror = (event) => reject(event.target.error);
    });
};

const LocalDB = {
    getAll: (storeName) => new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    }),
    
    getById: (storeName, id) => new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(Number(id));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    }),
    
    save: (storeName, data) => new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        if (data.id) data.id = Number(data.id);
        const request = store.put(data);
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = () => reject(request.error);
    }),
    
    delete: (storeName, id) => new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(Number(id));
        request.onsuccess = (event) => resolve(true);
        request.onerror = () => reject(request.error);
    }),
    
    clearAll: (storeName) => new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
    }),
    
    setSingleton: async (storeName, data) => {
        const items = await LocalDB.getAll(storeName);
        if (items.length > 0) data.id = items[0].id;
        return await LocalDB.save(storeName, data);
    }
};

// Variáveis globais
let currentEditingId = null;
let currentBudgetItems = [];
let currentEditingBudgetId = null;
let originalBudgetItems = [];

// Exportar para uso global
window.LocalDB = LocalDB;
window.initDB = initDB;
window.currentEditingId = currentEditingId;
window.currentBudgetItems = currentBudgetItems;
window.currentEditingBudgetId = currentEditingBudgetId;
window.originalBudgetItems = originalBudgetItems;