// OFICINA DA FAMÍLIA - Sistema Principal

let db = null;
let currentPage = 'home';

// Carregar página
async function loadPage(pageName) {
    currentPage = pageName;
    
    // Atualizar menu
    document.querySelectorAll('.menu li').forEach(li => {
        li.classList.remove('active');
    });
    event.target.closest('li').classList.add('active');
    
    // Mostrar loading
    document.getElementById('page-content').innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i> Carregando...
        </div>
    `;
    
    try {
        // Carregar HTML da página
        const response = await fetch(`pages/${pageName}.html`);
        if (!response.ok) throw new Error('Página não encontrada');
        
        const html = await response.text();
        document.getElementById('page-content').innerHTML = html;
        
        // Inicializar módulo da página
        switch(pageName) {
            case 'home':
                initHome();
                break;
            case 'estoque':
                if (window.initEstoque) initEstoque();
                break;
            case 'orcamentos':
                if (window.initOrcamentos) initOrcamentos();
                break;
            case 'clientes':
                if (window.initClientes) initClientes();
                break;
            case 'projetos':
                if (window.initProjetos) initProjetos();
                break;
            case 'financas':
                if (window.initFinancas) initFinancas();
                break;
            case 'config':
                if (window.initConfig) initConfig();
                break;
        }
    } catch (error) {
        console.error('Erro ao carregar página:', error);
        mostrarMensagem(`Erro: ${error.message}`, 'error');
        
        document.getElementById('page-content').innerHTML = `
            <div class="card">
                <h2>Erro ao carregar</h2>
                <p>${error.message}</p>
                <button onclick="loadPage('home')" class="btn btn-primary">
                    <i class="fas fa-home"></i> Voltar ao Início
                </button>
            </div>
        `;
    }
}

// Inicializar página inicial
function initHome() {
    // Atualizar dados financeiros
    atualizarDashboard();
    
    // Configurar eventos dos botões
    document.querySelectorAll('.btn-acao').forEach(btn => {
        btn.addEventListener('click', function() {
            const acao = this.dataset.acao;
            executarAcaoRapida(acao);
        });
    });
}

// Atualizar dashboard
function atualizarDashboard() {
    if (!db) return;
    
    try {
        // Obter mês atual
        const hoje = new Date();
        const mesAtual = hoje.getMonth() + 1;
        const anoAtual = hoje.getFullYear();
        
        // Buscar movimentações do mês
        const entradas = db.exec(`
            SELECT COALESCE(SUM(valor), 0) as total 
            FROM movimentacoes 
            WHERE tipo = 'entrada' 
            AND strftime('%m', data) = '${mesAtual.toString().padStart(2, '0')}'
            AND strftime('%Y', data) = '${anoAtual}'
        `)[0]?.values[0]?.[0] || 0;
        
        const saidas = db.exec(`
            SELECT COALESCE(SUM(valor), 0) as total 
            FROM movimentacoes 
            WHERE tipo = 'saida' 
            AND strftime('%m', data) = '${mesAtual.toString().padStart(2, '0')}'
            AND strftime('%Y', data) = '${anoAtual}'
        `)[0]?.values[0]?.[0] || 0;
        
        const lucro = entradas - saidas;
        
        // Atualizar UI
        document.getElementById('lucro-mes').textContent = formatarMoeda(lucro);
        document.getElementById('entradas-mes').textContent = formatarMoeda(entradas);
        document.getElementById('saidas-mes').textContent = formatarMoeda(saidas);
        
    } catch (error) {
        console.log('Dashboard erro:', error);
        // Valores padrão
        document.getElementById('lucro-mes').textContent = 'R$ 0,00';
        document.getElementById('entradas-mes').textContent = 'R$ 0,00';
        document.getElementById('saidas-mes').textContent = 'R$ 0,00';
    }
}

// Executar ação rápida
function executarAcaoRapida(acao) {
    switch(acao) {
        case 'criar-orcamento':
            loadPage('orcamentos');
            break;
        case 'cadastrar-cliente':
            loadPage('clientes');
            break;
        case 'cadastrar-material':
            loadPage('estoque');
            break;
        case 'ver-relatorio':
            mostrarMensagem('Relatório em desenvolvimento', 'info');
            break;
        default:
            mostrarMensagem(`Ação "${acao}" em desenvolvimento`, 'info');
    }
}

// Formatar moeda
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

// Mostrar mensagem
function mostrarMensagem(texto, tipo = 'info') {
    // Remover mensagens anteriores
    const mensagensAntigas = document.querySelectorAll('.mensagem-flutuante');
    mensagensAntigas.forEach(msg => msg.remove());
    
    const mensagem = document.createElement('div');
    mensagem.className = `mensagem-flutuante mensagem-${tipo}`;
    mensagem.innerHTML = `
        <div class="mensagem-conteudo">
            <span>${texto}</span>
            <button onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.querySelector('.main-content').appendChild(mensagem);
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
        if (mensagem.parentElement) {
            mensagem.remove();
        }
    }, 5000);
}

// Sair do sistema
function sair() {
    if (confirm('Deseja realmente sair do sistema?')) {
        localStorage.removeItem('db_backup');
        mostrarMensagem('Saindo do sistema...', 'info');
        setTimeout(() => {
            // Em produção, redirecionaria para login
            location.reload();
        }, 1000);
    }
}

// Função global para uso em outros módulos
window.loadPage = loadPage;
window.formatarMoeda = formatarMoeda;
window.mostrarMensagem = mostrarMensagem;
