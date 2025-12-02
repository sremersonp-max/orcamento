// OFICINA DA FAMÍLIA - Banco de Dados SQLite Local

let db = null;
let SQL = null;

// Inicializar banco de dados
async function initDatabase() {
    try {
        console.log('Iniciando banco de dados SQLite local...');
        
        // Carregar SQL.js LOCALMENTE
        SQL = await initSqlJs({
            locateFile: file => `assets/${file}`  // Arquivos locais na pasta assets
        });
        
        console.log('SQL.js carregado localmente');
        
        // Tentar carregar backup do localStorage
        const backup = localStorage.getItem('oficina_db_backup');
        
        if (backup) {
            try {
                // Carregar do backup
                const byteArray = new Uint8Array(JSON.parse(backup));
                db = new SQL.Database(byteArray);
                console.log('Banco carregado do backup');
            } catch (backupError) {
                console.warn('Erro ao carregar backup, criando novo banco:', backupError);
                db = new SQL.Database();
                criarTabelas();
                criarDadosIniciais();
            }
        } else {
            // Criar novo banco
            db = new SQL.Database();
            criarTabelas();
            criarDadosIniciais();
            console.log('Novo banco criado');
        }
        
        // Tornar db disponível globalmente com métodos síncronos para compatibilidade
        window.db = {
            exec: function(sql, params = []) {
                try {
                    if (!db) {
                        throw new Error('Banco de dados não inicializado');
                    }
                    
                    // Se tiver parâmetros, usar statement preparado
                    if (params && params.length > 0) {
                        const stmt = db.prepare(sql);
                        stmt.bind(params);
                        const results = [];
                        
                        while (stmt.step()) {
                            results.push(stmt.get());
                        }
                        
                        stmt.free();
                        
                        // Retornar no formato esperado pelo código existente
                        if (sql.trim().toUpperCase().startsWith('SELECT')) {
                            const columns = stmt.getColumnNames ? stmt.getColumnNames() : [];
                            return [{
                                columns: columns,
                                values: results
                            }];
                        }
                    } else {
                        // Sem parâmetros, exec direto
                        return db.exec(sql);
                    }
                    
                    return [];
                } catch (error) {
                    console.error('Erro na execução SQL:', error, 'SQL:', sql);
                    throw error;
                }
            },
            
            run: function(sql, params = []) {
                try {
                    if (!db) {
                        throw new Error('Banco de dados não inicializado');
                    }
                    
                    if (params && params.length > 0) {
                        const stmt = db.prepare(sql);
                        stmt.bind(params);
                        stmt.step();
                        stmt.free();
                    } else {
                        db.run(sql);
                    }
                    
                    salvarBackup();
                } catch (error) {
                    console.error('Erro na execução SQL:', error, 'SQL:', sql);
                    throw error;
                }
            },
            
            getRowsModified: function() {
                return db ? db.getRowsModified() : 0;
            }
        };
        
        // Salvar backup periodicamente
        setInterval(salvarBackup, 30000); // A cada 30 segundos
        
        mostrarMensagem('Banco de dados SQLite local pronto!', 'success');
        return db;
        
    } catch (error) {
        console.error('Erro ao iniciar banco de dados local:', error);
        mostrarMensagem('Erro no banco de dados. Tentando modo emergência...', 'error');
        
        // Modo emergência com localStorage
        return iniciarModoEmergencia();
    }
}

// Criar tabelas
function criarTabelas() {
    if (!db) return;
    
    console.log('Criando tabelas...');
    
    const queries = [
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
        
        // Materiais (para estoque)
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
        
        // Projetos
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
        )`
    ];
    
    queries.forEach(query => {
        try {
            db.run(query);
        } catch (error) {
            console.error('Erro criando tabela:', error, 'Query:', query);
        }
    });
    
    console.log('Tabelas criadas com sucesso');
}

// Criar dados iniciais
function criarDadosIniciais() {
    if (!db) return;
    
    console.log('Criando dados iniciais...');
    
    // Cliente de exemplo
    try {
        db.run(
            `INSERT INTO clientes (nome, empresa, telefone, email) 
             VALUES ('Cliente Avulso', '', '', '')`
        );
        console.log('Cliente inicial criado');
    } catch (error) {
        console.error('Erro ao criar cliente inicial:', error);
    }
    
    // Materiais de exemplo
    const materiais = [
        ['ESP3', 'Espelho 3 mm', 'Vidro', 'M²', 155.18, 1000],
        ['ESP4', 'Espelho 4 mm Bisotado', 'Vidro', 'M²', 183.15, 1000],
        ['ESP6', 'Espelho 6 mm Bisotado', 'Vidro', 'M²', 355.20, 1000],
        ['P10', 'P-10 Cavalinho 10mm', 'Ferragem', 'un', 6.20, 500],
        ['SIL', 'Silicone Transparente', 'Acessórios', 'un', 31.90, 200]
    ];
    
    materiais.forEach((m, index) => {
        try {
            db.run(
                `INSERT INTO materiais (codigo, descricao, grupo, unidade_medida, valor_unitario, quantidade) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                m
            );
        } catch (error) {
            console.error(`Erro ao criar material ${m[0]}:`, error);
        }
    });
    
    console.log('Dados iniciais criados com sucesso');
}

// Salvar backup no localStorage
function salvarBackup() {
    if (!db) return;
    
    try {
        const data = db.export();
        const array = Array.from(new Uint8Array(data));
        localStorage.setItem('oficina_db_backup', JSON.stringify(array));
        console.log('Backup salvo');
    } catch (error) {
        console.error('Erro ao salvar backup:', error);
    }
}

// Modo emergência (se SQLite.js falhar)
function iniciarModoEmergencia() {
    console.log('Iniciando modo emergência com localStorage');
    
    window.db = {
        exec: function(sql, params = []) {
            console.log('Modo emergência exec:', sql);
            
            // Simular SELECT de clientes
            if (sql.toUpperCase().includes('SELECT') && sql.toUpperCase().includes('CLIENTES')) {
                const clientesData = localStorage.getItem('clientes_emergencia') || '[]';
                const clientes = JSON.parse(clientesData);
                
                // Ordenar por nome
                const ordenados = clientes.sort((a, b) => 
                    a.nome.localeCompare(b.nome, undefined, { sensitivity: 'base' })
                );
                
                return [{
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
                        cliente.data_cadastro || new Date().toISOString()
                    ])
                }];
            }
            
            // COUNT para orçamentos
            if (sql.toUpperCase().includes('COUNT') && sql.toUpperCase().includes('ORCAMENTOS')) {
                return [{
                    columns: ['total'],
                    values: [[0]] // Sem orçamentos no modo emergência
                }];
            }
            
            return [];
        },
        
        run: function(sql, params = []) {
            console.log('Modo emergência run:', sql);
            
            // INSERT em clientes
            if (sql.toUpperCase().includes('INSERT INTO CLIENTES')) {
                const clientesData = localStorage.getItem('clientes_emergencia') || '[]';
                const clientes = JSON.parse(clientesData);
                
                const novoId = clientes.length > 0 ? 
                    Math.max(...clientes.map(c => c.id || 0)) + 1 : 1;
                
                const novoCliente = {
                    id: novoId,
                    nome: params[0] || '',
                    empresa: params[1] || '',
                    cpf_cnpj: params[2] || '',
                    telefone: params[3] || '',
                    email: params[4] || '',
                    endereco: params[5] || '',
                    observacoes: params[6] || '',
                    data_cadastro: new Date().toISOString()
                };
                
                clientes.push(novoCliente);
                localStorage.setItem('clientes_emergencia', JSON.stringify(clientes));
                return;
            }
            
            // UPDATE em clientes
            if (sql.toUpperCase().includes('UPDATE CLIENTES')) {
                const clientesData = localStorage.getItem('clientes_emergencia') || '[]';
                const clientes = JSON.parse(clientesData);
                const id = params[params.length - 1];
                
                const index = clientes.findIndex(c => c.id == id);
                if (index !== -1) {
                    clientes[index] = {
                        ...clientes[index],
                        nome: params[0] || clientes[index].nome,
                        empresa: params[1] || clientes[index].empresa,
                        cpf_cnpj: params[2] || clientes[index].cpf_cnpj,
                        telefone: params[3] || clientes[index].telefone,
                        email: params[4] || clientes[index].email,
                        endereco: params[5] || clientes[index].endereco,
                        observacoes: params[6] || clientes[index].observacoes
                    };
                    
                    localStorage.setItem('clientes_emergencia', JSON.stringify(clientes));
                }
                return;
            }
            
            // DELETE em clientes
            if (sql.toUpperCase().includes('DELETE FROM CLIENTES')) {
                const clientesData = localStorage.getItem('clientes_emergencia') || '[]';
                let clientes = JSON.parse(clientesData);
                const id = params[0];
                
                clientes = clientes.filter(c => c.id != id);
                localStorage.setItem('clientes_emergencia', JSON.stringify(clientes));
                return;
            }
        },
        
        getRowsModified: function() {
            return 1;
        }
    };
    
    // Criar dados iniciais se não existirem
    if (!localStorage.getItem('clientes_emergencia')) {
        const clientesIniciais = [{
            id: 1,
            nome: 'Cliente Avulso',
            empresa: '',
            telefone: '',
            email: '',
            endereco: '',
            cpf_cnpj: '',
            observacoes: 'Cliente padrão do sistema',
            data_cadastro: new Date().toISOString()
        }];
        localStorage.setItem('clientes_emergencia', JSON.stringify(clientesIniciais));
    }
    
    mostrarMensagem('Sistema rodando em modo emergência (localStorage)', 'warning');
    return null;
}

// Exportar dados
function exportarDados() {
    try {
        const backup = localStorage.getItem('oficina_db_backup');
        if (backup) {
            const blob = new Blob([backup], { type: 'application/octet-stream' });
            return URL.createObjectURL(blob);
        }
        return null;
    } catch (error) {
        console.error('Erro ao exportar dados:', error);
        return null;
    }
}

// Importar dados
function importarDados(arrayBuffer) {
    try {
        if (!SQL) return false;
        
        const data = new Uint8Array(arrayBuffer);
        if (db) db.close();
        
        db = new SQL.Database(data);
        salvarBackup();
        window.location.reload(); // Recarregar para aplicar novo banco
        
        return true;
    } catch (error) {
        console.error('Erro ao importar dados:', error);
        return false;
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', async () => {
    await initDatabase();
    
    // Notificar que o banco está pronto
    if (typeof atualizarDashboard === 'function') {
        atualizarDashboard();
    }
});

// Função sair
function sair() {
    if (confirm('Deseja realmente sair do sistema?')) {
        window.location.reload();
    }
}

// Disponibilizar funções globalmente
window.initDatabase = initDatabase;
window.exportarDados = exportarDados;
window.importarDados = importarDados;
window.salvarBackup = salvarBackup;
window.sair = sair;
