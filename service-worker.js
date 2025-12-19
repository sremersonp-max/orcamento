<div class="card">
    <h2 class="card-title">
        <i class="fas fa-home"></i> Painel Geral - <span id="empresa-nome">Sua Oficina</span>
    </h2>
    <div class="dashboard-grid">
        <div class="card stat-card bg-primary-grad">
            <h3>Contatos</h3>
            <p style="font-size: 2.5rem; font-weight: 800;" id="total-contatos">0</p>
        </div>
        <div class="card stat-card bg-danger-grad">
            <h3>Itens em Alerta</h3>
            <p style="font-size: 2.5rem; font-weight: 800;" id="total-alertas">0</p>
        </div>
        <div class="card stat-card bg-success" style="background: linear-gradient(45deg, #2ecc71, #27ae60);">
            <h3>Orçamentos Pendentes</h3>
            <p style="font-size: 2.5rem; font-weight: 800;" id="total-orcamentos">0</p>
        </div>
        <div class="card stat-card" style="background: linear-gradient(45deg, #3498db, #2980b9);">
            <h3>Valor em Estoque</h3>
            <p style="font-size: 2rem; font-weight: 800;" id="valor-estoque">R$ 0,00</p>
        </div>
    </div>
    
    <div style="margin-top: 30px;">
        <h4 class="form-section-title">Ações Rápidas</h4>
        <div class="dashboard-grid">
            <button class="card" style="text-align: center; cursor: pointer; transition: transform 0.3s;" onclick="loadPage('orcamentos')">
                <i class="fas fa-file-invoice-dollar" style="font-size: 2rem; color: var(--primary-color); margin-bottom: 10px;"></i>
                <h3>Novo Orçamento</h3>
                <p style="color: #666;">Criar orçamento rápido</p>
            </button>
            <button class="card" style="text-align: center; cursor: pointer; transition: transform 0.3s;" onclick="loadPage('clientes')">
                <i class="fas fa-user-plus" style="font-size: 2rem; color: var(--success-color); margin-bottom: 10px;"></i>
                <h3>Novo Cliente</h3>
                <p style="color: #666;">Cadastrar cliente</p>
            </button>
            <button class="card" style="text-align: center; cursor: pointer; transition: transform 0.3s;" onclick="loadPage('estoque')">
                <i class="fas fa-boxes" style="font-size: 2rem; color: var(--warning-color); margin-bottom: 10px;"></i>
                <h3>Controle de Estoque</h3>
                <p style="color: #666;">Gerenciar produtos</p>
            </button>
            <button class="card" style="text-align: center; cursor: pointer; transition: transform 0.3s;" onclick="loadPage('financeiro')">
                <i class="fas fa-chart-line" style="font-size: 2rem; color: var(--info-color); margin-bottom: 10px;"></i>
                <h3>Financeiro</h3>
                <p style="color: #666;">Ver movimentações</p>
            </button>
        </div>
    </div>
</div>

<script>
// Script específico para a página home
async function loadHomeData() {
    try {
        const contatos = await LocalDB.getAll('clientes');
        const estoque = await LocalDB.getAll('estoque');
        const orcamentos = await LocalDB.getAll('orcamentos');
        const empresaData = await LocalDB.getAll('empresa');
        const empresa = empresaData[0] || { nome_fantasia: 'Sua Oficina' };
        
        // Atualizar nome da empresa
        document.getElementById('empresa-nome').textContent = empresa.nome_fantasia || empresa.nome || 'Sua Oficina';
        
        // Atualizar contadores
        document.getElementById('total-contatos').textContent = contatos.length;
        
        // Calcular itens em alerta
        const alertas = estoque.filter(i => {
            const total = i.grade ? i.grade.reduce((acc, curr) => acc + Number(curr.quantidade), 0) : 0;
            const min = i.grade ? i.grade.reduce((acc, curr) => acc + Number(curr.minimo), 0) : 0;
            return total <= min;
        }).length;
        document.getElementById('total-alertas').textContent = alertas;
        
        // Calcular orçamentos pendentes
        const orcamentosPendentes = orcamentos.filter(o => o.status === 'Pendente').length;
        document.getElementById('total-orcamentos').textContent = orcamentosPendentes;
        
        // Calcular valor total do estoque
        let valorTotalEstoque = 0;
        estoque.forEach(item => {
            if (item.grade && item.grade.length > 0) {
                item.grade.forEach(variacao => {
                    const quantidade = Number(variacao.quantidade) || 0;
                    const valor = Number(variacao.valor) || 0;
                    valorTotalEstoque += quantidade * valor;
                });
            }
        });
        document.getElementById('valor-estoque').textContent = 
            `R$ ${valorTotalEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
            
    } catch (error) {
        console.error('Erro ao carregar dados da home:', error);
    }
}

// Carregar dados quando a página for exibida
document.addEventListener('DOMContentLoaded', loadHomeData);
</script>