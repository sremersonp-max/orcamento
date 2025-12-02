// OFICINA DA FAMÍLIA - Banco de Dados SQLite

let db = null;
let SQL = null;

// Inicializar banco de dados
async function initDatabase() {
    try {
        // Carregar SQL.js
        SQL = await initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });
        
        // Tentar carregar backup do localStorage
        const backup = localStorage.getItem('oficina_db_backup');
        
        if (backup) {
            // Carregar do backup
            const byteArray = new Uint8Array(JSON.parse(backup));
            db = new SQL.Database(byteArray);
            console.log('Banco carregado do backup');
        } else {
            // Criar novo banco
            db = new SQL.Database();
            criarTabelas();
            criarDadosIniciais();
            console.log('Novo banco criado');
        }
        
        window.db = db; // Disponibilizar globalmente
        
        // Salvar backup periodicamente
        setInterval(salvarBackup, 30000); // A cada 30 segundos
        
        mostrarMensagem('Banco de dados pronto!', 'success');
        return db;
        
    } catch (error) {
        console.error('Erro ao iniciar banco:', error);
        mostrarMensagem('Erro no banco de dados. Usando modo offline.', 'error');
        
        // Fallback para localStorage simples
        return null;
    }
}

// Criar tabelas
function criarTabelas() {
    const queries = [
        // Materiais
        `CREATE TABLE IF NOT EXISTS materiais (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo TEXT UNIQUE NOT NULL,
            descricao TEXT NOT NULL,
            grupo TEXT NOT NULL,
            unidade_medida TEXT NOT NULL,
            valor_unitario REAL NOT NULL,
            quantidade REAL DEFAULT 0,
            imagem TEXT,
            observacoes TEXT,
            data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Clientes
        `CREATE TABLE IF NOT EXISTS clientes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            empresa TEXT,
            telefone TEXT,
            email TEXT,
            endereco TEXT,
            cpf_cnpj TEXT,
            observacoes TEXT,
            data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Projetos (modelos)
        `CREATE TABLE IF NOT EXISTS projetos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            codigo TEXT UNIQUE,
            categoria TEXT NOT NULL,
            descricao TEXT,
            imagem TEXT,
            personalizado BOOLEAN DEFAULT 0,
            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Orçamentos
        `CREATE TABLE IF NOT EXISTS orcamentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cliente_id INTEGER,
            projeto_id INTEGER,
            codigo TEXT UNIQUE,
            status TEXT DEFAULT 'aberto',
            custo_total REAL DEFAULT 0,
            margem REAL DEFAULT 0,
            desconto REAL DEFAULT 0,
            valor_total REAL DEFAULT 0,
            observacoes TEXT,
            data_emissao DATETIME DEFAULT CURRENT_TIMESTAMP,
            data_validade DATE,
            FOREIGN KEY (cliente_id) REFERENCES clientes(id),
            FOREIGN KEY (projeto_id) REFERENCES projetos(id)
        )`,
        
        // Itens do Orçamento
        `CREATE TABLE IF NOT EXISTS orcamento_itens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            orcamento_id INTEGER NOT NULL,
            material_id INTEGER NOT NULL,
            quantidade REAL NOT NULL,
            valor_unitario REAL NOT NULL,
            total REAL NOT NULL,
            observacoes TEXT,
            FOREIGN KEY (orcamento_id) REFERENCES orcamentos(id),
            FOREIGN KEY (material_id) REFERENCES materiais(id)
        )`,
        
        // Movimentações Financeiras
        `CREATE TABLE IF NOT EXISTS movimentacoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tipo TEXT NOT NULL,
            descricao TEXT NOT NULL,
            valor REAL NOT NULL,
            categoria TEXT,
            data DATETIME DEFAULT CURRENT_TIMESTAMP,
            observacoes TEXT
        )`,
        
        // Projeto Materiais (relação projeto x material)
        `CREATE TABLE IF NOT EXISTS projeto_materiais (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            projeto_id INTEGER NOT NULL,
            material_id INTEGER NOT NULL,
            quantidade REAL NOT NULL,
            FOREIGN KEY (projeto_id) REFERENCES projetos(id),
            FOREIGN KEY (material_id) REFERENCES materiais(id)
        )`
    ];
    
    queries.forEach(query => {
        try {
            db.run(query);
        } catch (error) {
            console.error('Erro criando tabela:', error);
        }
    });
}

// Criar dados iniciais
function criarDadosIniciais() {
    // Materiais de exemplo
    const materiais = [
        ['ESP3', 'Espelho 3 mm', 'Vidro', 'M²', 155.18, 1000],
        ['ESP4', 'Espelho 4 mm Bisotado', 'Vidro', 'M²', 183.15, 1000],
        ['ESP6', 'Espelho 6 mm Bisotado', 'Vidro', 'M²', 355.20, 1000],
        ['P10', 'P-10 Cavalinho 10mm', 'Ferragem', 'un', 6.20, 500],
        ['SIL', 'Silicone Transparente', 'Acessórios', 'un', 31.90, 200]
    ];
    
    materiais.forEach(m => {
        db.run(
            `INSERT OR IGNORE INTO materiais (codigo, descricao, grupo, unidade_medida, valor_unitario, quantidade) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            m
        );
    });
    
    // Clientes de exemplo
    db.run(
        `INSERT OR IGNORE INTO clientes (nome, empresa, telefone, email) 
         VALUES ('Cliente Avulso', '', '', '')`
    );
    
    // Projetos de exemplo
    const projetos = [
        ['Fixo Simples', 'FX001', 'Fixo', 'Janela fixa padrão', 0],
        ['Porta Pivotante', 'PP001', 'Porta', 'Porta pivotante básica', 0],
        ['Box Banheiro', 'BX001', 'Box', 'Box para banheiro', 0]
    ];
    
    projetos.forEach(p => {
        db.run(
            `INSERT OR IGNORE INTO projetos (nome, codigo, categoria, descricao, personalizado) 
             VALUES (?, ?, ?, ?, ?)`,
            p
        );
    });
}

// Salvar backup no localStorage
function salvarBackup() {
    if (!db) return;
    
    try {
        const data = db.export();
        const array = Array.from(new Uint8Array(data));
        localStorage.setItem('oficina_db_backup', JSON.stringify(array));
    } catch (error) {
        console.error('Erro ao salvar backup:', error);
    }
}

// Exportar dados
function exportarDados() {
    if (!db) return null;
    
    const data = db.export();
    const blob = new Blob([data], { type: 'application/octet-stream' });
    return URL.createObjectURL(blob);
}

// Importar dados
function importarDados(arrayBuffer) {
    if (!db || !SQL) return false;
    
    try {
        const data = new Uint8Array(arrayBuffer);
        db.close();
        db = new SQL.Database(data);
        window.db = db;
        salvarBackup();
        return true;
    } catch (error) {
        console.error('Erro ao importar:', error);
        return false;
    }
}

// Executar query com tratamento de erro
function executarQuery(sql, params = []) {
    if (!db) {
        throw new Error('Banco de dados não inicializado');
    }
    
    try {
        if (sql.trim().toUpperCase().startsWith('SELECT')) {
            return db.exec(sql, params);
        } else {
            db.run(sql, params);
            return { changes: db.getRowsModified() };
        }
    } catch (error) {
        console.error('Query error:', error);
        throw error;
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', async () => {
    await initDatabase();
    if (typeof atualizarDashboard === 'function') {
        atualizarDashboard();
    }
});

// Disponibilizar funções globalmente
window.initDatabase = initDatabase;
window.exportarDados = exportarDados;
window.importarDados = importarDados;
window.executarQuery = executarQuery;
window.salvarBackup = salvarBackup;
