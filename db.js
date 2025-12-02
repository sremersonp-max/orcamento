// OFICINA DA FAMÍLIA - Banco de Dados IndexedDB

let db = null;
const DB_NAME = 'oficina_db';
const DB_VERSION = 1;

// Interface compatível com SQL
window.db = {
    exec: async function(sql, params = []) {
        return executarQuery(sql, params);
    },
    
    run: async function(sql, params = []) {
        return executarComando(sql, params);
    },
    
    getRowsModified: function() {
        return 1;
    }
};

// Inicializar IndexedDB
async function initDatabase() {
    return new Promise((resolve, reject) => {
        console.log('Inicializando IndexedDB...');
        
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = function(event) {
            console.error('Erro ao abrir IndexedDB:', event.target.error);
            mostrarMensagem('Erro ao inicializar banco de dados', 'error');
            reject(event.target.error);
        };
        
        request.onsuccess = function(event) {
            db = event.target.result;
            console.log('IndexedDB aberto com sucesso');
            
            // Verificar e criar dados iniciais
            verificarDadosIniciais().then(() => {
                mostrarMensagem('Banco de dados pronto!', 'success');
                resolve(db);
            }).catch(error => {
                console.error('Erro ao verificar dados:', error);
                resolve(db);
            });
        };
        
        request.onupgradeneeded = function(event) {
            console.log('Criando/atualizando estrutura do banco...');
            const db = event.target.result;
            
            // Criar Object Stores (tabelas)
            
            // Clientes
            if (!db.objectStoreNames.contains('clientes')) {
                const clientesStore = db.createObjectStore('clientes', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                clientesStore.createIndex('nome', 'nome', { unique: false });
                clientesStore.createIndex('cpf_cnpj', 'cpf_cnpj', { unique: false });
                clientesStore.createIndex('empresa', 'empresa', { unique: false });
                clientesStore.createIndex('data_cadastro', 'data_cadastro', { unique: false });
            }
            
            // Materiais
            if (!db.objectStoreNames.contains('materiais')) {
                const materiaisStore = db.createObjectStore('materiais', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                materiaisStore.createIndex('codigo', 'codigo', { unique: true });
                materiaisStore.createIndex('grupo', 'grupo', { unique: false });
                materiaisStore.createIndex('descricao', 'descricao', { unique: false });
            }
            
            // Orçamentos
            if (!db.objectStoreNames.contains('orcamentos')) {
                const orcamentosStore = db.createObjectStore('orcamentos', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                orcamentosStore.createIndex('cliente_id', 'cliente_id', { unique: false });
                orcamentosStore.createIndex('status', 'status', { unique: false });
                orcamentosStore.createIndex('data_emissao', 'data_emissao', { unique: false });
            }
            
            // Orçamento Itens
            if (!db.objectStoreNames.contains('orcamento_itens')) {
                const itensStore = db.createObjectStore('orcamento_itens', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                itensStore.createIndex('orcamento_id', 'orcamento_id', { unique: false });
                itensStore.createIndex('material_id', 'material_id', { unique: false });
            }
            
            // Projetos
            if (!db.objectStoreNames.contains('projetos')) {
                const projetosStore = db.createObjectStore('projetos', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                projetosStore.createIndex('codigo', 'codigo', { unique: true });
                projetosStore.createIndex('categoria', 'categoria', { unique: false });
            }
            
            console.log('Estrutura do banco criada');
        };
    });
}

// Verificar e criar dados iniciais
async function verificarDadosIniciais() {
    return new Promise((resolve, reject) => {
        if (!db) {
            resolve();
            return;
        }
        
        const transaction = db.transaction(['clientes'], 'readonly');
        const store = transaction.objectStore('clientes');
        const countRequest = store.count();
        
        countRequest.onsuccess = function() {
            if (countRequest.result === 0) {
                console.log('Criando dados iniciais...');
                criarDadosIniciais().then(resolve).catch(reject);
            } else {
                console.log('Banco já possui dados:', countRequest.result, 'clientes');
                resolve();
            }
        };
        
        countRequest.onerror = function(event) {
            console.error('Erro ao contar clientes:', event.target.error);
            resolve(); // Continuar mesmo com erro
        };
    });
}

// Criar dados iniciais
async function criarDadosIniciais() {
    return new Promise((resolve, reject) => {
        if (!db) {
            resolve();
            return;
        }
        
        const transaction = db.transaction(['clientes', 'materiais'], 'readwrite');
        
        // Cliente inicial
        const clientesStore = transaction.objectStore('clientes');
        const clienteInicial = {
            nome: 'Cliente Avulso',
            empresa: '',
            telefone: '',
            email: '',
            endereco: '',
            cpf_cnpj: '',
            observacoes: 'Cliente padrão do sistema',
            data_cadastro: new Date().toISOString()
        };
        clientesStore.add(clienteInicial);
        
        // Materiais iniciais
        const materiaisStore = transaction.objectStore('materiais');
        const materiais = [
            { codigo: 'ESP3', descricao: 'Espelho 3 mm', grupo: 'Vidro', unidade_medida: 'M²', valor_unitario: 155.18, quantidade: 1000 },
            { codigo: 'ESP4', descricao: 'Espelho 4 mm Bisotado', grupo: 'Vidro', unidade_medida: 'M²', valor_unitario: 183.15, quantidade: 1000 },
            { codigo: 'ESP6', descricao: 'Espelho 6 mm Bisotado', grupo: 'Vidro', unidade_medida: 'M²', valor_unitario: 355.20, quantidade: 1000 },
            { codigo: 'P10', descricao: 'P-10 Cavalinho 10mm', grupo: 'Ferragem', unidade_medida: 'un', valor_unitario: 6.20, quantidade: 500 },
            { codigo: 'SIL', descricao: 'Silicone Transparente', grupo: 'Acessórios', unidade_medida: 'un', valor_unitario: 31.90, quantidade: 200 }
        ];
        
        materiais.forEach(material => {
            materiaisStore.add({
                ...material,
                data_cadastro: new Date().toISOString()
            });
        });
        
        transaction.oncomplete = function() {
            console.log('Dados iniciais criados com sucesso');
            resolve();
        };
        
        transaction.onerror = function(event) {
            console.error('Erro ao criar dados iniciais:', event.target.error);
            reject(event.target.error);
        };
    });
}

// Executar query SELECT
async function executarQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Banco de dados não inicializado'));
            return;
        }
        
        const sqlUpper = sql.toUpperCase();
        
        // SELECT * FROM clientes ORDER BY nome
        if (sqlUpper.includes('SELECT * FROM CLIENTES') && sqlUpper.includes('ORDER BY NOME')) {
            const transaction = db.transaction(['clientes'], 'readonly');
            const store = transaction.objectStore('clientes');
            const request = store.getAll();
            
            request.onsuccess = function() {
                const clientes = request.result;
                
                // Ordenar por nome (case insensitive)
                const ordenados = clientes.sort((a, b) => 
                    a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
                );
                
                resolve([{
                    columns: ['id', 'nome', 'empresa', 'telefone', 'email', 'endereco', 'cpf_cnpj', 'observacoes', 'data_cadastro'],
                    values: ordenados.map(cliente => [
                        cliente.id,
                        cliente.nome || '',
                        cliente.empresa || '',
                        cliente.telefone || '',
                        cliente.email || '',
                        cliente.endereco || '',
                        cliente.cpf_cnpj || '',
                        cliente.observacoes || '',
                        cliente.data_cadastro || ''
                    ])
                }]);
            };
            
            request.onerror = function(event) {
                reject(event.target.error);
            };
            return;
        }
        
        // SELECT COUNT(*) as total FROM orcamentos WHERE cliente_id = ?
        if (sqlUpper.includes('SELECT COUNT(*)') && sqlUpper.includes('ORCAMENTOS') && sqlUpper.includes('CLIENTE_ID')) {
            const transaction = db.transaction(['orcamentos'], 'readonly');
            const store = transaction.objectStore('orcamentos');
            const index = store.index('cliente_id');
            const clienteId = params[0];
            
            const request = index.count(IDBKeyRange.only(clienteId));
            
            request.onsuccess = function() {
                resolve([{
                    columns: ['total'],
                    values: [[request.result]]
                }]);
            };
            
            request.onerror = function(event) {
                reject(event.target.error);
            };
            return;
        }
        
        // Query não suportada
        console.warn('Query não implementada:', sql);
        resolve([]);
    });
}

// Executar comandos INSERT/UPDATE/DELETE
async function executarComando(sql, params = []) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Banco de dados não inicializado'));
            return;
        }
        
        const sqlUpper = sql.toUpperCase();
        
        // INSERT INTO clientes (nome, empresa, cpf_cnpj, telefone, email, endereco, observacoes) VALUES (?, ?, ?, ?, ?, ?, ?)
        if (sqlUpper.includes('INSERT INTO CLIENTES')) {
            const transaction = db.transaction(['clientes'], 'readwrite');
            const store = transaction.objectStore('clientes');
            
            const cliente = {
                nome: params[0] || '',
                empresa: params[1] || '',
                cpf_cnpj: params[2] || '',
                telefone: params[3] || '',
                email: params[4] || '',
                endereco: params[5] || '',
                observacoes: params[6] || '',
                data_cadastro: new Date().toISOString()
            };
            
            const request = store.add(cliente);
            
            request.onsuccess = function() {
                salvarBackup();
                resolve();
            };
            
            request.onerror = function(event) {
                reject(event.target.error);
            };
            return;
        }
        
        // UPDATE clientes SET nome = ?, empresa = ?, cpf_cnpj = ?, telefone = ?, email = ?, endereco = ?, observacoes = ? WHERE id = ?
        if (sqlUpper.includes('UPDATE CLIENTES')) {
            const transaction = db.transaction(['clientes'], 'readwrite');
            const store = transaction.objectStore('clientes');
            const id = params[params.length - 1];
            
            const getRequest = store.get(parseInt(id));
            
            getRequest.onsuccess = function() {
                const cliente = getRequest.result;
                if (cliente) {
                    cliente.nome = params[0] || cliente.nome;
                    cliente.empresa = params[1] || cliente.empresa;
                    cliente.cpf_cnpj = params[2] || cliente.cpf_cnpj;
                    cliente.telefone = params[3] || cliente.telefone;
                    cliente.email = params[4] || cliente.email;
                    cliente.endereco = params[5] || cliente.endereco;
                    cliente.observacoes = params[6] || cliente.observacoes;
                    
                    const updateRequest = store.put(cliente);
                    
                    updateRequest.onsuccess = function() {
                        salvarBackup();
                        resolve();
                    };
                    
                    updateRequest.onerror = function(event) {
                        reject(event.target.error);
                    };
                } else {
                    reject(new Error('Cliente não encontrado'));
                }
            };
            
            getRequest.onerror = function(event) {
                reject(event.target.error);
            };
            return;
        }
        
        // DELETE FROM clientes WHERE id = ?
        if (sqlUpper.includes('DELETE FROM CLIENTES')) {
            const transaction = db.transaction(['clientes'], 'readwrite');
            const store = transaction.objectStore('clientes');
            const id = params[0];
            
            const request = store.delete(parseInt(id));
            
            request.onsuccess = function() {
                salvarBackup();
                resolve();
            };
            
            request.onerror = function(event) {
                reject(event.target.error);
            };
            return;
        }
        
        // Comando não suportado
        console.warn('Comando não implementado:', sql);
        resolve();
    });
}

// Salvar backup simplificado
function salvarBackup() {
    // IndexedDB já persiste automaticamente
    // Podemos apenas marcar data do último backup
    localStorage.setItem('db_last_backup', new Date().toISOString());
}

// Exportar dados
async function exportarDados() {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Banco não inicializado'));
            return;
        }
        
        // Exportar todos os clientes
        const transaction = db.transaction(['clientes'], 'readonly');
        const store = transaction.objectStore('clientes');
        const request = store.getAll();
        
        request.onsuccess = function() {
            const dados = {
                clientes: request.result,
                export_date: new Date().toISOString(),
                total: request.result.length
            };
            
            const blob = new Blob([JSON.stringify(dados, null, 2)], { 
                type: 'application/json' 
            });
            
            resolve(URL.createObjectURL(blob));
        };
        
        request.onerror = function(event) {
            reject(event.target.error);
        };
    });
}

// Importar dados
async function importarDados(jsonString) {
    try {
        const dados = JSON.parse(jsonString);
        
        if (!dados.clientes || !Array.isArray(dados.clientes)) {
            throw new Error('Formato de dados inválido');
        }
        
        const transaction = db.transaction(['clientes'], 'readwrite');
        const store = transaction.objectStore('clientes');
        
        // Limpar clientes existentes
        const clearRequest = store.clear();
        
        clearRequest.onsuccess = function() {
            // Adicionar novos clientes
            dados.clientes.forEach(cliente => {
                store.add(cliente);
            });
            
            transaction.oncomplete = function() {
                mostrarMensagem('Dados importados com sucesso!', 'success');
                salvarBackup();
                window.location.reload(); // Recarregar para aplicar
            };
        };
        
        return true;
    } catch (error) {
        console.error('Erro ao importar dados:', error);
        mostrarMensagem('Erro ao importar dados: ' + error.message, 'error');
        return false;
    }
}

// Função sair
function sair() {
    if (confirm('Deseja realmente sair do sistema?')) {
        window.location.reload();
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initDatabase();
        
        // Notificar que o banco está pronto
        if (typeof atualizarDashboard === 'function') {
            atualizarDashboard();
        }
        
        // Aguardar um pouco antes de carregar a página inicial
        setTimeout(() => {
            if (typeof loadPage === 'function') {
                loadPage('home');
            }
        }, 300);
        
    } catch (error) {
        console.error('Erro fatal ao inicializar banco:', error);
        mostrarMensagem('Erro crítico no banco de dados. Recarregue a página.', 'error');
    }
});

// Disponibilizar funções globalmente
window.initDatabase = initDatabase;
window.exportarDados = exportarDados;
window.importarDados = importarDados;
window.salvarBackup = salvarBackup;
window.sair = sair;
