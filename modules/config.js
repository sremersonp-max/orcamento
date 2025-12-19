// modules/config.js

// Funções para configurações do sistema
async function switchTab(tabId, event) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    if(event) event.target.classList.add('active');
    const target = document.getElementById(tabId);
    if(target) target.classList.add('active');
}

// NOVA FUNÇÃO PARA SALVAR DADOS COMPLETOS DA EMPRESA
async function handleSalvarEmpresa(e) {
    e.preventDefault();
    
    const empresaData = {
        // Dados principais
        razao_social: document.getElementById('emp-razao-social').value,
        nome_fantasia: document.getElementById('emp-nome-fantasia').value,
        cnpj: document.getElementById('emp-cnpj').value,
        inscricao_estadual: document.getElementById('emp-inscricao-estadual').value,
        
        // Endereço
        endereco: document.getElementById('emp-endereco').value,
        cidade: document.getElementById('emp-cidade').value,
        estado: document.getElementById('emp-estado').value,
        cep: document.getElementById('emp-cep').value,
        
        // Contato
        telefone: document.getElementById('emp-telefone').value,
        telefone2: document.getElementById('emp-telefone2').value,
        email: document.getElementById('emp-email').value,
        site: document.getElementById('emp-site').value,
        
        // Configurações do sistema
        margem_padrao: Number(document.getElementById('emp-margem-padrao').value) || 30,
        prazo_validade: Number(document.getElementById('emp-prazo-validade').value) || 10,
        obs_padrao: document.getElementById('emp-obs-padrao').value
    };
    
    try {
        await LocalDB.setSingleton('empresa', empresaData);
        showNotification('Dados da empresa salvos com sucesso!', 'success');
        
        // Atualizar margem padrão no formulário de orçamentos se estiver na página
        if (document.getElementById('orc-margem')) {
            document.getElementById('orc-margem').value = empresaData.margem_padrao;
        }
    } catch (error) {
        console.error('Erro ao salvar dados da empresa:', error);
        showNotification('Erro ao salvar dados da empresa.', 'error');
    }
}

async function handleSalvarVidroCatalogo(e) {
    e.preventDefault();
    
    await LocalDB.save('vidros_catalogo', {
        nome: document.getElementById('vid-nome').value, 
        espessura: document.getElementById('vid-esp').value,
        cor: document.getElementById('vid-cor').value, 
        preco_m2: document.getElementById('vid-preco').value
    });
    
    e.target.reset(); 
    await renderVidrosCatalogo();
    showNotification('Vidro adicionado ao catálogo!', 'success');
}

async function renderVidrosCatalogo() {
    const list = await LocalDB.getAll('vidros_catalogo');
    const container = document.getElementById('lista-vidros-catalogo');
    if(!container) return;
    
    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Vidro</th>
                    <th>Esp.</th>
                    <th>Cor</th>
                    <th>Preço/m²</th>
                    <th class="text-right">Ação</th>
                </tr>
            </thead>
            <tbody>
                ${list.map(v => `
                    <tr>
                        <td>${v.nome}</td>
                        <td>${v.espessura}mm</td>
                        <td>${v.cor}</td>
                        <td>R$ ${Number(v.preco_m2).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td class="text-right">
                            <button onclick="removerVidroCatalogo(${v.id})" class="action-btn delete-btn">
                                <i class="fas fa-times"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
}

async function removerVidroCatalogo(id) { 
    await LocalDB.delete('vidros_catalogo', id); 
    renderVidrosCatalogo();
    showNotification('Vidro removido do catálogo!', 'success');
}

async function handleSalvarUnidade(e) { 
    e.preventDefault(); 
    await LocalDB.save('unidades', { sigla: document.getElementById('uni-sigla').value }); 
    e.target.reset(); 
    renderUnidades();
    showNotification('Unidade adicionada!', 'success');
}

async function renderUnidades() { 
    const list = await LocalDB.getAll('unidades'); 
    const c = document.getElementById('lista-unidades'); 
    if(c) c.innerHTML = list.map(i => `
        <span class="badge badge-outline" style="margin:2px;">
            ${i.sigla} 
            <i class="fas fa-times cursor-pointer" onclick="LocalDB.delete('unidades', ${i.id}).then(renderUnidades)"></i>
        </span>
    `).join(''); 
}

async function handleSalvarCategoria(e) { 
    e.preventDefault(); 
    await LocalDB.save('categorias', { nome: document.getElementById('cat-nome').value }); 
    e.target.reset(); 
    renderCategorias();
    showNotification('Categoria adicionada!', 'success');
}

async function renderCategorias() { 
    const list = await LocalDB.getAll('categorias'); 
    const c = document.getElementById('lista-categorias'); 
    if(c) c.innerHTML = list.map(i => `
        <div style="padding:5px; border-bottom:1px solid #eee;">
            ${i.nome} 
            <i class="fas fa-trash float-right cursor-pointer" onclick="LocalDB.delete('categorias', ${i.id}).then(renderCategorias)"></i>
        </div>
    `).join(''); 
}

async function handleSalvarCor(e) { 
    e.preventDefault(); 
    await LocalDB.save('cores', { nome: document.getElementById('cor-nome').value }); 
    e.target.reset(); 
    renderCores();
    showNotification('Cor adicionada!', 'success');
}

async function renderCores() { 
    const list = await LocalDB.getAll('cores'); 
    const c = document.getElementById('lista-cores'); 
    if(c) c.innerHTML = list.map(i => `
        <span class="badge badge-outline" style="margin:5px; background: #f0f0f0;">
            ${i.nome} 
            <i class="fas fa-times cursor-pointer" onclick="LocalDB.delete('cores', ${i.id}).then(renderCores)"></i>
        </span>
    `).join(''); 
}

// Exportar funções para uso global
window.switchTab = switchTab;
window.handleSalvarEmpresa = handleSalvarEmpresa;
window.handleSalvarVidroCatalogo = handleSalvarVidroCatalogo;
window.renderVidrosCatalogo = renderVidrosCatalogo;
window.removerVidroCatalogo = removerVidroCatalogo;
window.handleSalvarUnidade = handleSalvarUnidade;
window.renderUnidades = renderUnidades;
window.handleSalvarCategoria = handleSalvarCategoria;
window.renderCategorias = renderCategorias;
window.handleSalvarCor = handleSalvarCor;
window.renderCores = renderCores;