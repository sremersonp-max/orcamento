// modules/orcamentos.js

// Funções para gerenciamento de orçamentos
function switchBudgetTab(tabId, event) {
    document.querySelectorAll('#tab-novo-orc, #tab-historico-orc').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    if(event) event.target.classList.add('active');
    const target = document.getElementById(tabId);
    if(target) target.classList.add('active');
}

async function toggleGlassSelector(modId) {
    const container = document.getElementById('glass-selector-container');
    if(!modId) {
        container.style.display = 'none';
        return;
    }
    
    const modelo = await LocalDB.getById('modelos', modId);
    container.style.display = modelo.receita.some(r => r.tipo === 'vidro') ? 'block' : 'none';
}

// NOVA FUNÇÃO: ATUALIZAR VISUALIZAÇÃO DOS COMPONENTES DO PRODUTO
async function atualizarComponentesPreview(modId) {
    const componentsPreview = document.getElementById('components-preview');
    const componentsList = document.getElementById('components-list');
    const componentsTotal = document.getElementById('components-total-valor');
    
    if (!modId) {
        componentsPreview.classList.remove('active');
        return;
    }
    
    try {
        const modelo = await LocalDB.getById('modelos', modId);
        const estoque = await LocalDB.getAll('estoque');
        const catalogoVidros = await LocalDB.getAll('vidros_catalogo');
        const L = Number(document.getElementById('orc-largura').value) || 1000;
        const H = Number(document.getElementById('orc-altura').value) || 1000;
        const corAlu = (document.getElementById('orc-cor-alu').value || "").trim().toLowerCase();
        const vidroId = document.getElementById('orc-vidro-tipo').value;
        
        let html = '';
        let subtotalCusto = 0;
        
        if (modelo.receita && modelo.receita.length > 0) {
            for (let rec of modelo.receita) {
                let formula = rec.formula.replace(/L/g, L).replace(/H/g, H);
                let calculoQuant = 0;
                try { 
                    // Se a fórmula não contém L nem H, é uma quantidade fixa
                    if (!rec.formula.includes('L') && !rec.formula.includes('H')) {
                        calculoQuant = Number(rec.formula);
                    } else {
                        calculoQuant = eval(formula); 
                    }
                } catch(e) { calculoQuant = 0; }
                
                // Normalização da busca do item
                const itemEstoque = estoque.find(e => e.nome.trim().toLowerCase() === rec.item.trim().toLowerCase());
                const temCores = itemEstoque && itemEstoque.grade && itemEstoque.grade.length > 0;
                const temCorEspecifica = temCores && itemEstoque.grade.some(g => g.cor && g.cor.trim() !== '');
                
                if (rec.tipo === 'material' && itemEstoque) {
                    if (temCorEspecifica) {
                        // Item com cor específica - será usado conforme cor selecionada (normalizado)
                        const variacaoPreco = itemEstoque.grade.find(v => (v.cor || "").trim().toLowerCase() === corAlu)?.valor || itemEstoque.grade[0]?.valor || 0;
                        let custoItem = 0;
                        if (!rec.formula.includes('L') && !rec.formula.includes('H')) {
                            custoItem = Number(calculoQuant) * Number(variacaoPreco);
                        } else {
                            custoItem = (Number(calculoQuant) / 1000) * Number(variacaoPreco);
                        }
                        subtotalCusto += custoItem;
                        
                        html += `
                            <div class="component-item">
                                <div class="component-name">${rec.item}</div>
                                <div class="component-details">
                                    ${calculoQuant.toFixed(3)} uni • 
                                    R$ ${Number(variacaoPreco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/uni<br>
                                    <span style="color: var(--success-color);">Custo: R$ ${custoItem.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>`;
                    } else {
                        // Item sem cor específica
                        const variacaoPreco = itemEstoque?.grade?.[0]?.valor || 0;
                        let custoItem = 0;
                        if (!rec.formula.includes('L') && !rec.formula.includes('H')) {
                            custoItem = Number(calculoQuant) * Number(variacaoPreco);
                        } else {
                            custoItem = (Number(calculoQuant) / 1000) * Number(variacaoPreco);
                        }
                        subtotalCusto += custoItem;
                        
                        html += `
                            <div class="component-item no-cor-item">
                                <div class="component-name">${rec.item}</div>
                                <div class="component-details">
                                    ${calculoQuant.toFixed(3)} uni • 
                                    R$ ${Number(variacaoPreco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/uni<br>
                                    <span style="color: var(--info-color);">Custo: R$ ${custoItem.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>`;
                    }
                } else if (rec.tipo === 'vidro') {
                    const vidroEscolhido = catalogoVidros.find(v => v.id == vidroId);
                    if(vidroEscolhido) {
                        const areaM2 = Number(calculoQuant) / 1000000;
                        const custoVidro = areaM2 * Number(vidroEscolhido.preco_m2);
                        subtotalCusto += custoVidro;
                        
                        html += `
                            <div class="component-item">
                                <div class="component-name">${rec.item}</div>
                                <div class="component-details">
                                    ${areaM2.toFixed(4)} m² • 
                                    R$ ${Number(vidroEscolhido.preco_m2).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/m²<br>
                                    <span style="color: var(--warning-color);">Custo: R$ ${custoVidro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>`;
                    }
                }
            }
            
            componentsList.innerHTML = html;
            componentsTotal.textContent = `R$ ${subtotalCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
            componentsPreview.classList.add('active');
        } else {
            componentsPreview.classList.remove('active');
        }
    } catch (error) {
        console.error('Erro ao carregar componentes:', error);
        componentsPreview.classList.remove('active');
    }
}

async function adicionarItemOrcamento() {
    const modId = document.getElementById('orc-modelo').value;
    const L = Number(document.getElementById('orc-largura').value);
    const H = Number(document.getElementById('orc-altura').value);
    const Q = Number(document.getElementById('orc-qtd').value);
    const corAluOrig = document.getElementById('orc-cor-alu').value;
    const corAluNorm = (corAluOrig || "").trim().toLowerCase();
    const vidroId = document.getElementById('orc-vidro-tipo').value;

    if(!modId || !corAluOrig) {
        showNotification("Selecione o Projeto e a Cor do Alumínio.", "error");
        return;
    }

    const modelo = await LocalDB.getById('modelos', modId);
    const estoque = await LocalDB.getAll('estoque');
    const catalogoVidros = await LocalDB.getAll('vidros_catalogo');

    let custoTotalPeca = 0;
    let infoVidro = "N/A";

    modelo.receita.forEach(rec => {
        let formula = rec.formula.replace(/L/g, L).replace(/H/g, H);
        let calculoQuant = 0; 
        try { 
            if (!rec.formula.includes('L') && !rec.formula.includes('H')) {
                calculoQuant = Number(rec.formula);
            } else {
                calculoQuant = eval(formula); 
            }
        } catch(e) { calculoQuant = 0; }
        
        if (rec.tipo === 'material') {
            // Normalização na busca para evitar falhas por texto
            const material = estoque.find(e => e.nome.trim().toLowerCase() === rec.item.trim().toLowerCase());
            if (material && material.grade) {
                const temCorEspecifica = material.grade.some(g => g.cor && g.cor.trim() !== '');
                
                if (temCorEspecifica) {
                    const variacaoPreco = material.grade.find(v => (v.cor || "").trim().toLowerCase() === corAluNorm)?.valor || material.grade[0]?.valor || 0;
                    if (!rec.formula.includes('L') && !rec.formula.includes('H')) {
                        custoTotalPeca += Number(calculoQuant) * Number(variacaoPreco);
                    } else {
                        custoTotalPeca += (Number(calculoQuant) / 1000) * Number(variacaoPreco);
                    }
                } else {
                    const variacaoPreco = material.grade[0]?.valor || 0;
                    if (!rec.formula.includes('L') && !rec.formula.includes('H')) {
                        custoTotalPeca += Number(calculoQuant) * Number(variacaoPreco);
                    } else {
                        custoTotalPeca += (Number(calculoQuant) / 1000) * Number(variacaoPreco);
                    }
                }
            }
        } else {
            const vidroEscolhido = catalogoVidros.find(v => v.id == vidroId);
            if(vidroEscolhido) {
                custoTotalPeca += (Number(calculoQuant) / 1000000) * Number(vidroEscolhido.preco_m2);
                infoVidro = `${vidroEscolhido.nome} ${vidroEscolhido.espessura}mm (${vidroEscolhido.cor})`;
            }
        }
    });

    window.currentBudgetItems.push({
        modelo_id: modId,
        nome: modelo.nome, 
        medida_L: L, 
        medida_H: H, 
        medida: `${L}x${H}mm`, 
        cor: corAluOrig, 
        vidro: infoVidro, 
        qtd: Q, 
        custo_unitario: custoTotalPeca, 
        total_custo: custoTotalPeca * Q
    });
    
    renderResumoOrcamento();
    showNotification('Item adicionado ao orçamento!', 'success');
}

function renderResumoOrcamento() {
    const container = document.getElementById('resumo-orcamento-lista');
    const margem = Number(document.getElementById('orc-margem').value) || 0;
    if(!container) return;
    document.getElementById('botoes-finalizacao').style.display = 'block';
    
    let totalCusto = window.currentBudgetItems.reduce((acc, i) => acc + (i.total_custo || 0), 0);
    let totalVenda = totalCusto * (1 + (margem / 100));

    container.innerHTML = `
    <div style="margin-top:20px; padding:15px; background:#fff; border-radius:10px; border:1px solid #ddd;">
        <table class="data-table">
            <thead>
                <tr>
                    <th>Descrição</th>
                    <th>Configuração</th>
                    <th>Qtd</th>
                    <th class="text-right">Custo Total</th>
                    <th class="text-right">Venda Total</th>
                    <th class="text-right">Ação</th>
                </tr>
            </thead>
            <tbody>
                ${window.currentBudgetItems.map((i, idx) => {
                    let vendaUnit = (i.custo_unitario || 0) * (1 + (margem/100));
                    return `<tr>
                        <td><strong>${i.nome}</strong></td>
                        <td><small>${i.medida}<br>Alu: ${i.cor}<br>Vid: ${i.vidro || 'N/A'}</small></td>
                        <td>${i.qtd}</td>
                        <td class="text-right" style="color:#666; font-weight:bold;">
                            R$ ${(i.total_custo || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td class="text-right" style="color:var(--primary-color); font-weight:bold;">
                            R$ ${(vendaUnit * i.qtd).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td class="text-right">
                            <button onclick="removerItemOrcamento(${idx})" class="delete-btn action-btn">
                                <i class="fas fa-times"></i>
                            </button>
                        </td>
                    </tr>`;
                }).join('')}
            </tbody>
            <tfoot>
                <tr style="background:#f1f1f1;">
                    <td colspan="3" class="text-right"><strong>TOTAIS:</strong></td>
                    <td class="text-right" style="color:#333; font-size:1.2rem;">
                        <strong>R$ ${totalCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                    </td>
                    <td class="text-right" style="color:var(--success-color); font-size:1.2rem;">
                        <strong>R$ ${totalVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                    </td>
                    <td></td>
                </tr>
            </tfoot>
        </table>
    </div>`;
}

function removerItemOrcamento(index) { 
    if (confirm("Remover este item do orçamento?")) {
        window.currentBudgetItems.splice(index, 1); 
        renderResumoOrcamento();
        showNotification('Item removido do orçamento!', 'info');
    }
}

async function salvarOrcamentoNoBanco() {
    const cliente = document.getElementById('orc-cliente').value;
    const margem = Number(document.getElementById('orc-margem').value) || 0;
    
    if(!cliente) {
        showNotification("Selecione um cliente.", "error");
        return;
    }
    
    if(window.currentBudgetItems.length === 0) {
        showNotification("Adicione itens ao orçamento.", "error");
        return;
    }

    const totalCusto = window.currentBudgetItems.reduce((acc, i) => acc + (i.total_custo || 0), 0);
    const totalVenda = totalCusto * (1 + (margem / 100));

    const orcamentoData = {
        cliente: cliente,
        data: new Date().toISOString(),
        itens: JSON.parse(JSON.stringify(window.currentBudgetItems)),
        margem: margem,
        total_custo: totalCusto,
        total_venda: totalVenda,
        status: 'Pendente'
    };

    try {
        await LocalDB.save('orcamentos', orcamentoData);
        showNotification("Orçamento salvo com sucesso!", "success");
        await renderHistoricoOrcamentos();
        switchBudgetTab('tab-historico-orc', { target: document.getElementById('btn-tab-hist') });
    } catch (err) {
        console.error('Erro ao salvar orçamento:', err);
        showNotification("Erro ao salvar orçamento.", "error");
    }
}

// Exportar funções para uso global
window.switchBudgetTab = switchBudgetTab;
window.toggleGlassSelector = toggleGlassSelector;
window.atualizarComponentesPreview = atualizarComponentesPreview;
window.adicionarItemOrcamento = adicionarItemOrcamento;
window.renderResumoOrcamento = renderResumoOrcamento;
window.removerItemOrcamento = removerItemOrcamento;
window.salvarOrcamentoNoBanco = salvarOrcamentoNoBanco;