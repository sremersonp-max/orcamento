// app.js - Arquivo principal do aplicativo

// --- PÁGINAS ---
const pages = {
    home: async () => {
        const contatos = await LocalDB.getAll('clientes');
        const estoque = await LocalDB.getAll('estoque');
        const empresaData = await LocalDB.getAll('empresa');
        const empresa = empresaData[0] || { 
            nome_fantasia: 'Sua Oficina', 
            razao_social: 'Sua Oficina LTDA' 
        };
        
        const alertas = estoque.filter(i => {
            const total = i.grade ? i.grade.reduce((acc, curr) => acc + Number(curr.quantidade), 0) : 0;
            const min = i.grade ? i.grade.reduce((acc, curr) => acc + Number(curr.minimo), 0) : 0;
            return total <= min;
        }).length;
        
        return `
        <div class="card">
            <h2 class="card-title">
                <i class="fas fa-home"></i> Painel Geral - ${empresa.nome_fantasia || empresa.nome || 'Sua Oficina'}
            </h2>
            <div class="dashboard-grid">
                <div class="card stat-card bg-primary-grad">
                    <h3>Contatos</h3>
                    <p style="font-size: 2.5rem; font-weight: 800;">${contatos.length}</p>
                </div>
                <div class="card stat-card bg-danger-grad">
                    <h3>Itens em Alerta</h3>
                    <p style="font-size: 2.5rem; font-weight: 800;">${alertas}</p>
                </div>
            </div>
        </div>`;
    },

    modelos: async () => `
        <div class="card">
            <h2 class="card-title"><i class="fas fa-layer-group"></i> Engenharia de Modelos (Projetos)</h2>
            <form id="form-modelo" onsubmit="handleSalvarModelo(event)" class="form-container">
                <h4 id="form-label-mod" class="form-section-title">Novo Modelo de Produto</h4>
                <div class="form-grid">
                    <div class="form-group col-span-2">
                        <label>Nome do Projeto (ex: Janela 02 Folhas)</label>
                        <input type="text" id="mod-nome" class="form-control" required placeholder="Digite o nome do produto">
                    </div>
                </div>
                <div class="mt-4">
                    <label style="font-weight: 700;">Estrutura da Receita (L = Largura, H = Altura)</label>
                    <p style="font-size: 0.8rem; color: #666; margin-bottom: 10px;">
                        Exemplos: (L+50)*2 ou (L*H)/1000000 para m² ou apenas 4 para quantidade fixa
                    </p>
                    <div id="recipe-container" class="recipe-container"></div>
                    <button type="button" class="btn-outline btn-dashed" onclick="adicionarLinhaReceita()">
                        <i class="fas fa-plus"></i> Novo Componente
                    </button>
                </div>
                <div class="btn-group mt-4">
                    <button type="submit" class="btn-primary" id="btn-save-mod">Gravar Modelo</button>
                    <button type="button" class="btn-outline" onclick="resetModeloForm()" id="btn-cancel-mod" style="display:none">
                        Cancelar Edição
                    </button>
                </div>
            </form>
            <div id="lista-modelos"></div>
        </div>`,

    orcamentos: async () => {
        const modelos = await LocalDB.getAll('modelos');
        const clientes = await LocalDB.getAll('clientes');
        const cores = await LocalDB.getAll('cores');
        const vidros = await LocalDB.getAll('vidros_catalogo');
        
        window.currentBudgetItems = [];
        
        return `
        <div class="card no-print">
            <h2 class="card-title"><i class="fas fa-file-invoice-dollar"></i> Orçamentos Profissionais</h2>
            
            <div class="settings-tabs">
                <button class="tab-btn active" id="btn-tab-novo" onclick="switchBudgetTab('tab-novo-orc', event)">
                    Gerar Novo Orçamento
                </button>
                <button class="tab-btn" id="btn-tab-hist" onclick="switchBudgetTab('tab-historico-orc', event); renderHistoricoOrcamentos();">
                    Consultar Histórico (Baixas/Financeiro)
                </button>
            </div>

            <div id="tab-novo-orc" class="tab-content active">
                <div class="form-container">
                    <div class="form-grid">
                        <div class="form-group col-span-2">
                            <label>Pesquisar Cliente</label>
                            <div style="display: flex; gap: 10px;">
                                <input type="text" id="search-cliente" class="form-control" placeholder="Digite nome do cliente..." 
                                       onkeyup="filtrarClientes(this.value)" style="flex: 1;">
                                <button type="button" class="btn-outline" onclick="abrirCadastroClienteRapido()">
                                    <i class="fas fa-user-plus"></i> Novo Cliente
                                </button>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Cliente Selecionado</label>
                            <select id="orc-cliente" class="form-control" required>
                                <option value="">Selecione o cliente...</option>
                                ${clientes.map(c => `<option value="${c.nome}">${c.nome}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Margem de Lucro (%)</label>
                            <input type="number" id="orc-margem" class="form-control" value="30" 
                                   onchange="renderResumoOrcamento(); atualizarComponentesPreview(document.getElementById('orc-modelo').value);">
                        </div>
                    </div>
                    <div class="form-grid" style="background: #f0f7ff; padding: 25px; border-radius: 12px; border: 1px solid var(--accent-color);">
                        <div class="form-group col-span-2">
                            <label>Projeto Base</label>
                            <select id="orc-modelo" class="form-control" 
                                    onchange="toggleGlassSelector(this.value); atualizarComponentesPreview(this.value)">
                                <option value="">Escolha o modelo...</option>
                                ${modelos.map(m => `<option value="${m.id}">${m.nome}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Largura L (mm)</label>
                            <input type="number" id="orc-largura" class="form-control" value="1000" 
                                   onchange="atualizarComponentesPreview(document.getElementById('orc-modelo').value)">
                        </div>
                        <div class="form-group">
                            <label>Altura H (mm)</label>
                            <input type="number" id="orc-altura" class="form-control" value="1000" 
                                   onchange="atualizarComponentesPreview(document.getElementById('orc-modelo').value)">
                        </div>
                        <div class="form-group">
                            <label>Cor Alumínio</label>
                            <select id="orc-cor-alu" class="form-control" 
                                    onchange="atualizarComponentesPreview(document.getElementById('orc-modelo').value)">
                                ${cores.map(c => `<option value="${c.nome}">${c.nome}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group" id="glass-selector-container" style="display:none">
                            <label>Tipo de Vidro</label>
                            <select id="orc-vidro-tipo" class="form-control">
                                <option value="">Selecione o Vidro...</option>
                                ${vidros.map(v => `<option value="${v.id}">${v.nome} - ${v.espessura}mm (${v.cor})</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Qtd</label>
                            <input type="number" id="orc-qtd" class="form-control" value="1">
                        </div>
                        <button type="button" class="btn-primary" style="align-self: end;" onclick="adicionarItemOrcamento()">
                            <i class="fas fa-plus"></i> Incluir no Orçamento
                        </button>
                    </div>
                </div>
                
                <!-- ÁREA DE VISUALIZAÇÃO DOS COMPONENTES DO PRODUTO -->
                <div id="components-preview" class="components-preview">
                    <h5><i class="fas fa-list"></i> COMPONENTES DO PRODUTO (VISUALIZAÇÃO)</h5>
                    <div id="components-list"></div>
                    <div id="components-subtotal" style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #e0e0ff; font-weight: bold; display: flex; justify-content: space-between; font-size: 0.9rem;">
                        <span>SUBTOTAL (CUSTO):</span>
                        <span id="components-total-valor" style="color: var(--primary-color);">R$ 0,00</span>
                    </div>
                </div>
                
                <div id="resumo-orcamento-lista"></div>
                <div id="botoes-finalizacao" style="display:none; text-align: right; margin-top: 25px;">
                    <button class="btn-outline" onclick="loadPage('orcamentos')">Limpar Tudo</button>
                    <button class="btn-primary" onclick="salvarOrcamentoNoBanco()" style="background: var(--info-color);">
                        <i class="fas fa-save"></i> Gravar no Histórico
                    </button>
                    <button class="btn-primary" style="background: var(--success-color);" onclick="prepararPDFNovoOrcamento()">
                        <i class="fas fa-file-pdf"></i> Imprimir PDF de Venda
                    </button>
                </div>
            </div>

            <div id="tab-historico-orc" class="tab-content">
                <div id="lista-historico-orcamentos"></div>
            </div>
        </div>
        <div id="printable-area"></div>`;
    },

    financeiro: async () => {
        const logs = await LocalDB.getAll('financeiro');
        const saldoTotal = logs.reduce((acc, curr) => 
            acc + (curr.tipo === 'Crédito' ? curr.valor : -curr.valor), 0);
        
        return `
        <div class="card">
            <h2 class="card-title"><i class="fas fa-hand-holding-usd"></i> Gestão Financeira</h2>
            
            <div class="form-container">
                <h4 class="form-section-title">Novo Lançamento Manual</h4>
                <form id="form-financeiro" onsubmit="handleSalvarLancamento(event)" class="form-grid">
                    <div class="form-group col-span-2">
                        <label>Descrição</label>
                        <input type="text" id="fin-desc" class="form-control" required placeholder="Ex: Compra de parafusos">
                    </div>
                    <div class="form-group">
                        <label>Tipo</label>
                        <select id="fin-tipo" class="form-control">
                            <option value="Crédito">Entrada (Crédito)</option>
                            <option value="Débito">Saída (Débito)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Valor (R$)</label>
                        <input type="number" id="fin-valor" class="form-control" step="0.01" required>
                    </div>
                    <button type="submit" class="btn-primary" style="align-self: end;">Lançar Caixa</button>
                </form>
            </div>

            <div class="dashboard-grid mb-4">
                <div class="card stat-card bg-primary-grad">
                    <h3>Saldo Atual em Caixa</h3>
                    <p style="font-size: 2.5rem; font-weight: 800;">
                        R$ ${saldoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>
            </div>

            <h4 class="form-section-title">Histórico de Movimentações</h4>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Data/Hora</th>
                        <th>Descrição</th>
                        <th>Tipo</th>
                        <th class="text-right">Valor</th>
                        <th class="text-right">Ação</th>
                    </tr>
                </thead>
                <tbody>
                    ${logs.length === 0 ? 
                        '<tr><td colspan="5" class="empty-msg">Nenhuma movimentação.</td></tr>' : 
                        logs.reverse().map(l => `
                        <tr>
                            <td>${new Date(l.data).toLocaleString()}</td>
                            <td>${l.descricao}</td>
                            <td>
                                <span class="badge ${l.tipo === 'Crédito' ? 'badge-success' : 'badge-danger'}">
                                    ${l.tipo}
                                </span>
                            </td>
                            <td class="text-right" style="color: ${l.tipo === 'Crédito' ? '#27ae60' : '#e74c3c'}; font-weight:bold;">
                                R$ ${(l.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td class="text-right">
                                <button onclick="removerLancamento(${l.id})" class="action-btn delete-btn">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>`).join('')
                    }
                </tbody>
            </table>
        </div>`;
    },

    clientes: async () => `
        <div class="card">
            <h2 class="card-title">Gestão de Contatos</h2>
            <form id="form-cliente" onsubmit="handleSalvarCliente(event)" class="form-container">
                <div class="form-grid">
                    <div class="form-group col-span-2">
                        <label>Nome / Razão Social</label>
                        <input type="text" id="cli-nome" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Tipo</label>
                        <select id="cli-tipo" class="form-control">
                            <option value="cliente">Cliente</option>
                            <option value="fornecedor">Fornecedor</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Doc (CPF/CNPJ)</label>
                        <input type="text" id="cli-doc" class="form-control">
                    </div>
                    <div class="form-group">
                        <label>Telefone</label>
                        <input type="text" id="cli-tel" class="form-control" placeholder="(00) 00000-0000">
                    </div>
                    <div class="form-group">
                        <label>E-mail</label>
                        <input type="email" id="cli-email" class="form-control">
                    </div>
                    <div class="form-group">
                        <label>Saldo Atual (R$)</label>
                        <input type="number" id="cli-saldo" class="form-control" step="0.01" value="0.00">
                    </div>
                    <div class="form-group col-span-2">
                        <label>Endereço Completo</label>
                        <input type="text" id="cli-endereco" class="form-control">
                    </div>
                </div>
                <div class="btn-group">
                    <button type="submit" class="btn-primary" id="btn-save-cli">Gravar Contato</button>
                    <button type="button" class="btn-outline" onclick="resetClienteForm()" id="btn-cancel-cli" style="display:none">
                        Cancelar
                    </button>
                    <button type="button" class="btn-outline" onclick="salvarEIrParaOrcamento()" id="btn-salvar-orcamento" 
                            style="background: var(--success-color); color: white; display: none;">
                        <i class="fas fa-file-invoice-dollar"></i> Salvar e Ir para Orçamento
                    </button>
                </div>
            </form>
            <div id="lista-clientes"></div>
        </div>`,

    estoque: async () => {
        const unidades = await LocalDB.getAll('unidades');
        const categorias = await LocalDB.getAll('categorias');
        const estoque = await LocalDB.getAll('estoque');
        
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
        
        return `
        <div class="card">
            <h2 class="card-title">Controle de Estoque Detalhado</h2>
            
            <div class="dashboard-grid mb-4">
                <div class="card stat-card bg-primary-grad">
                    <h3>Valor Total do Estoque</h3>
                    <p style="font-size: 2.5rem; font-weight: 800;">
                        R$ ${valorTotalEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>
            </div>
            
            <form id="form-estoque" onsubmit="handleSalvarItem(event)" class="form-container">
                <div class="form-grid">
                    <div class="form-group">
                        <label>Cód. SKU / Ref</label>
                        <input type="text" id="est-codigo-pai" class="form-control">
                    </div>
                    <div class="form-group col-span-2">
                        <label>Nome do Produto</label>
                        <input type="text" id="est-nome" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Categoria</label>
                        <select id="est-cat" class="form-control">
                            ${categorias.map(c => `<option value="${c.nome}">${c.nome}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Uni. Entrada</label>
                        <select id="est-uni-entrada" class="form-control">
                            ${unidades.map(u => `<option value="${u.sigla}">${u.sigla}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Uni. Saída</label>
                        <select id="est-uni-saida" class="form-control">
                            ${unidades.map(u => `<option value="${u.sigla}">${u.sigla}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Fator de Conversão</label>
                        <input type="number" id="est-fator" class="form-control" step="0.001" value="1.000">
                    </div>
                </div>
                <div id="color-rows-container" class="color-rows-container"></div>
                <button type="button" class="btn-outline btn-dashed" onclick="adicionarLinhaCor()">
                    <i class="fas fa-plus"></i> Adicionar Variação de Cor/Preço
                </button>
                <div class="btn-group mt-4">
                    <button type="submit" class="btn-primary" id="btn-save-est">Confirmar Alterações</button>
                    <button type="button" class="btn-outline" onclick="resetEstoqueForm()" id="btn-cancel-est" style="display:none">
                        Cancelar Edição
                    </button>
                </div>
            </form>
            <div id="lista-estoque"></div>
        </div>`;
    },

    configuracoes: async () => {
        const empresa = (await LocalDB.getAll('empresa'))[0] || {};
        return `
        <div class="card">
            <h2 class="card-title">Configurações</h2>
            <div class="settings-tabs">
                <button class="tab-btn active" onclick="switchTab('tab-empresa', event)">Dados da Empresa</button>
                <button class="tab-btn" onclick="switchTab('tab-vidros', event)">Catálogo de Vidros</button>
                <button class="tab-btn" onclick="switchTab('tab-unidades', event)">Unidades</button>
                <button class="tab-btn" onclick="switchTab('tab-categorias', event)">Categorias</button>
                <button class="tab-btn" onclick="switchTab('tab-cores', event)">Cores</button>
            </div>
            <div id="tab-empresa" class="tab-content active">
                <form onsubmit="handleSalvarEmpresa(event)" class="form-container">
                    <div class="empresa-fields">
                        <h4>Dados Principais</h4>
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Razão Social *</label>
                                <input type="text" id="emp-razao-social" class="form-control" value="${empresa.razao_social || ''}" required>
                            </div>
                            <div class="form-group">
                                <label>Nome Fantasia *</label>
                                <input type="text" id="emp-nome-fantasia" class="form-control" value="${empresa.nome_fantasia || empresa.nome || ''}" required>
                            </div>
                            <div class="form-group">
                                <label>CNPJ</label>
                                <input type="text" id="emp-cnpj" class="form-control" value="${empresa.cnpj || ''}" placeholder="00.000.000/0000-00">
                            </div>
                            <div class="form-group">
                                <label>Inscrição Estadual</label>
                                <input type="text" id="emp-inscricao-estadual" class="form-control" value="${empresa.inscricao_estadual || ''}">
                            </div>
                        </div>
                    </div>
                    
                    <div class="empresa-fields">
                        <h4>Contato e Endereço</h4>
                        <div class="form-grid">
                            <div class="form-group col-span-2">
                                <label>Endereço Completo</label>
                                <input type="text" id="emp-endereco" class="form-control" value="${empresa.endereco || ''}" placeholder="Rua, Número, Bairro">
                            </div>
                            <div class="form-group">
                                <label>Cidade</label>
                                <input type="text" id="emp-cidade" class="form-control" value="${empresa.cidade || ''}">
                            </div>
                            <div class="form-group">
                                <label>Estado (UF)</label>
                                <input type="text" id="emp-estado" class="form-control" value="${empresa.estado || ''}" placeholder="SP" maxlength="2">
                            </div>
                            <div class="form-group">
                                <label>CEP</label>
                                <input type="text" id="emp-cep" class="form-control" value="${empresa.cep || ''}" placeholder="00000-000">
                            </div>
                            <div class="form-group">
                                <label>Telefone Principal *</label>
                                <input type="text" id="emp-telefone" class="form-control" value="${empresa.telefone || ''}" required placeholder="(00) 00000-0000">
                            </div>
                            <div class="form-group">
                                <label>Telefone Secundário</label>
                                <input type="text" id="emp-telefone2" class="form-control" value="${empresa.telefone2 || ''}" placeholder="(00) 00000-0000">
                            </div>
                            <div class="form-group">
                                <label>E-mail</label>
                                <input type="email" id="emp-email" class="form-control" value="${empresa.email || ''}" placeholder="empresa@exemplo.com">
                            </div>
                            <div class="form-group">
                                <label>Site</label>
                                <input type="text" id="emp-site" class="form-control" value="${empresa.site || ''}" placeholder="https://www.exemplo.com">
                            </div>
                        </div>
                    </div>
                    
                    <div class="empresa-fields">
                        <h4>Configurações do Sistema</h4>
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Margem de Lucro Padrão (%)</label>
                                <input type="number" id="emp-margem-padrao" class="form-control" value="${empresa.margem_padrao || 30}" min="0" max="100" step="0.1">
                            </div>
                            <div class="form-group">
                                <label>Prazo de Validade Orçamento (dias)</label>
                                <input type="number" id="emp-prazo-validade" class="form-control" value="${empresa.prazo_validade || 10}" min="1" max="90">
                            </div>
                            <div class="form-group">
                                <label>Observação Padrão em Orçamentos</label>
                                <textarea id="emp-obs-padrao" class="form-control" rows="3" placeholder="Observações que aparecerão em todos os orçamentos">${empresa.obs_padrao || ''}</textarea>
                            </div>
                        </div>
                    </div>
                    
                    <button type="submit" class="btn-primary mt-4">
                        <i class="fas fa-save"></i> Salvar Todas as Configurações
                    </button>
                </form>
            </div>
            <div id="tab-vidros" class="tab-content">
                <form onsubmit="handleSalvarVidroCatalogo(event)" class="form-grid">
                    <input type="text" id="vid-nome" class="form-control" placeholder="Tipo do Vidro" required>
                    <input type="number" id="vid-esp" class="form-control" placeholder="Espessura (mm)" required>
                    <input type="text" id="vid-cor" class="form-control" placeholder="Cor" required>
                    <input type="number" id="vid-preco" class="form-control" placeholder="Preço m² (R$)" step="0.01" required>
                    <button type="submit" class="btn-primary">Adicionar Vidro</button>
                </form>
                <div id="lista-vidros-catalogo" class="mt-4"></div>
            </div>
            <div id="tab-unidades" class="tab-content">
                <form onsubmit="handleSalvarUnidade(event)" class="form-grid">
                    <input type="text" id="uni-sigla" class="form-control" placeholder="Ex: BARRA" required>
                    <button type="submit" class="btn-primary">Add</button>
                </form>
                <div id="lista-unidades" class="mt-4"></div>
            </div>
            <div id="tab-categorias" class="tab-content">
                <form onsubmit="handleSalvarCategoria(event)" class="form-grid">
                    <input type="text" id="cat-nome" class="form-control" placeholder="Ex: Acessórios" required>
                    <button type="submit" class="btn-primary">Add</button>
                </form>
                <div id="lista-categorias" class="mt-4"></div>
            </div>
            <div id="tab-cores" class="tab-content">
                <form onsubmit="handleSalvarCor(event)" class="form-grid">
                    <input type="text" id="cor-nome" class="form-control" placeholder="Ex: Bronze" required>
                    <button type="submit" class="btn-primary">Add</button>
                </form>
                <div id="lista-cores" class="mt-4"></div>
            </div>
        </div>`;
    },

    backup: async () => `
        <div class="card">
            <h2 class="card-title"><i class="fas fa-database"></i> Backup e Restauração</h2>
            <div class="form-container">
                <h4 class="form-section-title">Backup do Sistema</h4>
                <p style="margin-bottom: 15px; color: #666;">
                    Faça backup de todos os dados do sistema para restaurar em outro dispositivo ou manter uma cópia de segurança.
                </p>
                
                <div class="backup-buttons">
                    <button onclick="exportarBackup()" class="btn-backup">
                        <i class="fas fa-file-export"></i> Exportar Backup
                    </button>
                    <button onclick="document.getElementById('restore-file').click()" class="btn-restore">
                        <i class="fas fa-file-import"></i> Importar Backup
                    </button>
                    <button onclick="salvarNaNuvem()" class="btn-cloud">
                        <i class="fas fa-cloud-upload-alt"></i> Salvar na Nuvem
                    </button>
                    <button onclick="restaurarDaNuvem()" class="btn-cloud" style="background: var(--info-color);">
                        <i class="fas fa-cloud-download-alt"></i> Restaurar da Nuvem
                    </button>
                </div>
                
                <input type="file" id="restore-file" accept=".json" style="display: none;" onchange="importarBackup(this.files[0])">
                
                <div style="margin-top: 25px; padding: 15px; background: #f8f9ff; border-radius: 10px; border: 1px solid #e0e0ff;">
                    <h5><i class="fas fa-info-circle"></i> Informações Importantes</h5>
                    <ul style="margin-top: 10px; padding-left: 20px; color: #666;">
                        <li>O backup inclui todos os dados: clientes, estoque, orçamentos, modelos, etc.</li>
                        <li>O arquivo de backup é em formato JSON e pode ser editado manualmente se necessário.</li>
                        <li>Para restaurar em outro dispositivo, exporte o backup aqui e importe no outro dispositivo.</li>
                        <li>A função "Salvar na Nuvem" armazena o backup no armazenamento local do navegador.</li>
                        <li><strong>Atenção:</strong> A restauração substituirá todos os dados atuais!</li>
                    </ul>
                </div>
                
                <div id="backup-info" style="margin-top: 20px; padding: 15px; background: #f0f8ff; border-radius: 8px; display: none;"></div>
            </div>
        </div>`
};

// --- NAVEGAÇÃO ---
async function loadPage(page, event) {
    if (event) event.preventDefault();
    const content = document.getElementById('page-content');
    content.innerHTML = typeof pages[page] === 'function' ? await pages[page]() : 'Página não encontrada';
    
    // Inicializar componentes específicos de cada página
    if (page === 'modelos') { 
        await renderModelos(); 
        await adicionarLinhaReceita(); 
    }
    if (page === 'clientes') await renderClientes();
    if (page === 'estoque') { 
        await renderEstoque(); 
        await adicionarLinhaCor(); 
    }
    if (page === 'configuracoes') { 
        await renderVidrosCatalogo(); 
        await renderUnidades(); 
        await renderCategorias(); 
        await renderCores(); 
    }
    if (page === 'orcamentos') { 
        await renderHistoricoOrcamentos(); 
    } 
    if (page === 'backup') {
        // Verificar se há backup na nuvem
        const hasCloudBackup = localStorage.getItem('oficina_cloud_backup');
        if (hasCloudBackup) {
            document.getElementById('backup-info').innerHTML = `
                <div style="color: var(--info-color);">
                    <i class="fas fa-cloud"></i> Backup na nuvem disponível
                    <br><small>Pronto para restauração em qualquer dispositivo com esta conta.</small>
                </div>`;
            document.getElementById('backup-info').style.display = 'block';
        }
    }
    
    // Atualizar menu ativo
    document.querySelectorAll('#main-menu li').forEach(li => {
        li.classList.remove('active');
        if (li.getAttribute('data-page') === page) li.classList.add('active');
    });
}

function sair() { 
    if(confirm("Deseja sair e recarregar?")) window.location.reload(); 
}

// --- PWA INSTALAÇÃO ---
let deferredPrompt;

function forceInstallPWA() {
    if (deferredPrompt) {
        showInstallPrompt();
        return;
    }
    
    const userAgent = navigator.userAgent.toLowerCase();
    let instructions = '';
    
    if (/iphone|ipad|ipod/.test(userAgent)) {
        instructions = 
            '📱 Para instalar no iPhone/iPad:\n\n' +
            '1. Toque no ícone de compartilhar (📤)\n' +
            '2. Role para baixo\n' +
            '3. Toque em "Adicionar à Tela de Início"\n' +
            '4. Toque em "Adicionar"';
    } 
    else if (/android/.test(userAgent)) {
        instructions = 
            '📱 Para instalar no Android:\n\n' +
            '1. Toque nos 3 pontos (⋮) no Chrome\n' +
            '2. Selecione "Instalar aplicativo"\n' +
            '3. Confirme "Instalar"';
    } 
    else if (/chrome|edge/.test(userAgent)) {
        instructions = 
            '💻 Para instalar no PC:\n\n' +
            '1. Procure o ícone de instalação (⎙) na barra de endereços\n' +
            'OU\n' +
            '2. Menu → Mais ferramentas → Criar atalho...';
    }
    else {
        instructions = 
            '🔧 Instalação manual:\n\n' +
            '1. No menu do navegador, procure "Instalar" ou "Criar atalho"\n' +
            '2. Siga as instruções do seu navegador';
    }
    
    showCustomModal('Instalar App', instructions);
}

function showCustomModal(title, message) {
    const oldModal = document.getElementById('custom-install-modal');
    if (oldModal) oldModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'custom-install-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        font-family: 'Segoe UI', sans-serif;
    `;
    
    modal.innerHTML = `
        <div style="
            background: white;
            padding: 30px;
            border-radius: 15px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            text-align: center;
        ">
            <h2 style="color: var(--primary-color); margin-bottom: 20px;">
                <i class="fas fa-download"></i> ${title}
            </h2>
            
            <div style="
                background: #f5f7fa;
                padding: 20px;
                border-radius: 10px;
                margin-bottom: 25px;
                text-align: left;
                white-space: pre-line;
                line-height: 1.6;
                font-size: 15px;
            ">
                ${message}
            </div>
            
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button onclick="this.closest('#custom-install-modal').remove()" 
                        style="
                            padding: 12px 25px;
                            background: #e0e0e0;
                            border: none;
                            border-radius: 8px;
                            font-weight: bold;
                            cursor: pointer;
                        ">
                    Fechar
                </button>
                <button onclick="window.location.reload()" 
                        style="
                            padding: 12px 25px;
                            background: var(--primary-color);
                            color: white;
                            border: none;
                            border-radius: 8px;
                            font-weight: bold;
                            cursor: pointer;
                        ">
                    <i class="fas fa-redo"></i> Recarregar
                </button>
            </div>
            
            <p style="margin-top: 20px; color: #666; font-size: 13px;">
                Dica: Às vezes recarregar a página ativa a instalação automática.
            </p>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function showInstallPrompt() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(choiceResult => {
            const installButton = document.getElementById('pwa-install-button');
            if (installButton) {
                installButton.style.display = 'none';
            }
            
            if (choiceResult.outcome === 'accepted') {
                console.log('Usuário aceitou a instalação');
                showNotification('App instalado com sucesso!', 'success');
            } else {
                console.log('Usuário recusou a instalação');
            }
            deferredPrompt = null;
        });
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? 'var(--success-color)' : 
                   type === 'error' ? 'var(--danger-color)' : 
                   'var(--info-color)';
    const icon = type === 'success' ? 'fa-check-circle' : 
                type === 'error' ? 'fa-exclamation-circle' : 
                'fa-info-circle';
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${bgColor};
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        font-weight: bold;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        ${message}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 500);
    }, 3000);
}

function isInStandaloneMode() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        window.navigator.standalone ||
                        document.referrer.includes('android-app://');
    
    if (isStandalone) {
        console.log('App rodando em modo PWA instalado');
        const installButton = document.getElementById('pwa-install-button');
        if (installButton) {
            installButton.style.display = 'none';
        }
    }
    
    return isStandalone;
}

function updateOnlineStatus() {
    if (!navigator.onLine) {
        showNotification('Você está offline. Algumas funcionalidades podem estar limitadas.', 'warning');
    }
}

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', async () => { 
    try { 
        await initDB(); 
        await loadPage('home'); 
        
        // Configurar PWA
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            const installButton = document.getElementById('pwa-install-button');
            if (installButton) {
                installButton.style.display = 'block';
                
                setTimeout(() => {
                    installButton.style.display = 'none';
                }, 30000);
            }
        });
        
        // Configurar botão de instalação
        const installBtn = document.querySelector('#pwa-install-button button');
        if (installBtn) {
            installBtn.onclick = forceInstallPWA;
        }
        
        // Verificar status online/offline
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        updateOnlineStatus();
        isInStandaloneMode();
        
    } catch (err) { 
        console.error("Erro ao inicializar:", err);
        showNotification("Erro ao carregar banco de dados.", "error");
    }
});

// Exportar funções para uso global
window.loadPage = loadPage;
window.sair = sair;
window.showNotification = showNotification;
window.forceInstallPWA = forceInstallPWA;
window.showCustomModal = showCustomModal;
window.showInstallPrompt = showInstallPrompt;