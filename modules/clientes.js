// Carregar página
function loadPage(pageName, event = null) {
    // Ativar item do menu
    document.querySelectorAll('.menu li').forEach(li => {
        li.classList.remove('active');
    });
    
    if (event && event.target.closest('li')) {
        event.target.closest('li').classList.add('active');
    }
    
    // Carregar conteúdo da página
    fetch(`pages/${pageName}.html`)
        .then(response => {
            if (!response.ok) throw new Error('Página não encontrada');
            return response.text();
        })
        .then(html => {
            document.getElementById('page-content').innerHTML = html;
            
            // Inicializar módulo específico
            switch(pageName) {
                case 'home':
                    initHome();
                    break;
                case 'clientes':
                    // Carregar módulo clientes dinamicamente
                    carregarModulo('clientes').then(() => {
                        if (window.clientes && typeof window.clientes.init === 'function') {
                            window.clientes.init();
                        }
                    }).catch(error => {
                        console.error('Erro ao carregar módulo clientes:', error);
                        mostrarMensagem('Erro ao carregar módulo de clientes', 'error');
                    });
                    break;
                case 'estoque':
                    // Carregar módulo estoque se existir
                    if (typeof initEstoque === 'function') {
                        initEstoque();
                    } else {
                        console.log('Módulo estoque não carregado');
                    }
                    break;
                default:
                    console.log(`Página ${pageName} carregada`);
            }
        })
        .catch(error => {
            console.error('Erro ao carregar página:', error);
            document.getElementById('page-content').innerHTML = `
                <div class="card">
                    <h2>Erro ao carregar página</h2>
                    <p>${error.message}</p>
                    <p>Verifique se a pasta "pages/" existe e tem o arquivo ${pageName}.html</p>
                </div>
            `;
        });
}

// Função para carregar módulos dinamicamente
function carregarModulo(nomeModulo) {
    return new Promise((resolve, reject) => {
        const moduloNome = nomeModulo.toLowerCase();
        
        // Se já está carregado e tem init, executar
        if (window[moduloNome] && typeof window[moduloNome].init === 'function') {
            setTimeout(() => {
                try {
                    window[moduloNome].init();
                    resolve();
                } catch (error) {
                    reject(error);
                }
            }, 100);
            return;
        }
        
        // Tentar carregar script se existir
        fetch(`modules/${moduloNome}.js`)
            .then(response => {
                if (!response.ok) throw new Error('Módulo não encontrado');
                return response.text();
            })
            .then(scriptContent => {
                // Executar o script
                const script = document.createElement('script');
                script.textContent = scriptContent;
                document.head.appendChild(script);
                
                // Verificar se módulo foi carregado
                setTimeout(() => {
                    if (window[moduloNome] && typeof window[moduloNome].init === 'function') {
                        window[moduloNome].init();
                        resolve();
                    } else {
                        reject(new Error(`Módulo ${nomeModulo} não possui init()`));
                    }
                }, 100);
            })
            .catch(error => {
                reject(error);
            });
    });
}

// Inicializar página inicial
function initHome() {
    console.log('Inicializando home...');
    
    // Carregar dados financeiros
    carregarDadosFinanceiros();
    
    // Adicionar eventos aos botões
    document.querySelectorAll('.btn-acao').forEach(btn => {
        btn.addEventListener('click', function() {
            const acao = this.dataset.acao;
            executarAcaoInicio(acao);
        });
    });
}

function carregarDadosFinanceiros() {
    // Valores fixos por enquanto
    const entradas = 0;
    const saidas = 0;
    const lucro = 0;
    
    // Atualizar cards
    document.getElementById('lucro-mes').textContent = formatarMoeda(lucro);
    document.getElementById('entradas-mes').textContent = formatarMoeda(entradas);
    document.getElementById('saidas-mes').textContent = formatarMoeda(saidas);
}

function executarAcaoInicio(acao) {
    alert(`Ação: ${acao} (em desenvolvimento)`);
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

// Carregar página inicial por padrão
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se estamos na página correta
    if (document.getElementById('page-content')) {
        loadPage('home');
    }
});

// Funções auxiliares
function mostrarMensagem(texto, tipo = 'info') {
    const mensagem = document.createElement('div');
    mensagem.className = `mensagem mensagem-${tipo}`;
    mensagem.innerHTML = `
        <span>${texto}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    document.querySelector('.main-content').prepend(mensagem);
    
    setTimeout(() => {
        if (mensagem.parentElement) {
            mensagem.remove();
        }
    }, 5000);
}

// Estilos para mensagens
const estiloMensagem = document.createElement('style');
estiloMensagem.textContent = `
    .mensagem {
        padding: 15px;
        margin-bottom: 20px;
        border-radius: 6px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        animation: slideIn 0.3s ease-out;
    }
    
    .mensagem-info {
        background-color: #d1ecf1;
        color: #0c5460;
        border-left: 4px solid #3498db;
    }
    
    .mensagem-success {
        background-color: #d4edda;
        color: #155724;
        border-left: 4px solid #27ae60;
    }
    
    .mensagem-error {
        background-color: #f8d7da;
        color: #721c24;
        border-left: 4px solid #e74c3c;
    }
    
    .mensagem button {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: inherit;
    }
    
    @keyframes slideIn {
        from {
            transform: translateY(-20px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(estiloMensagem);

// Disponibilizar funções globalmente
window.loadPage = loadPage;
window.mostrarMensagem = mostrarMensagem;
window.carregarModulo = carregarModulo;
window.sair = sair;

// Adicionar função sair global
function sair() {
    if (confirm('Deseja realmente sair do sistema?')) {
        window.location.reload();
    }
}
