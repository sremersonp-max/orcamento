// modules/orcamentos2.js

// Funções para histórico e gestão de orçamentos
async function renderHistoricoOrcamentos() {
    const list = await LocalDB.getAll('orcamentos');
    const container = document.getElementById('lista-historico-orcamentos');
    if(!container) return;
    
    if (list.length === 0) {
        container.innerHTML = '<div class="empty-msg">Nenhum orçamento salvo no histórico.</div>';
        return;
    }

    const sortedList = [...list].reverse();

    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Data</th>
                    <th>Cliente</th>
                    <th>Custo Total</th>
                    <th>Venda Total</th>
                    <th>Status</th>
                    <th class="text-right">Ações</th>
                </tr>
            </thead>
            <tbody>
                ${sortedList.map(o => {
                    const custo = o.total_custo || 0;
                    const venda = o.total_venda || 0;
                    return `<tr>
                        <td>${new Date(o.data).toLocaleDateString()}</td>
                        <td><strong>${o.cliente}</strong></td>
                        <td>R$ ${custo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td>R$ ${venda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td>
                            <span class="badge ${o.status === 'Finalizado' ? 'badge-success' : o.status === 'Cancelado' ? 'badge-danger' : 'badge-warning'}">
                                ${o.status || 'Pendente'}
                            </span>
                        </td>
                        <td class="text-right" style="display:flex; gap:10px; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
                            <button onclick="editarOrcamento(${o.id})" class="edit-budget-btn" title="Editar Orçamento">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            ${o.status !== 'Finalizado' ? 
                                `<button onclick="finalizarObra(${o.id})" class="btn-primary" style="padding: 5px 10px; font-size: 0.8rem; background: var(--success-color);" title="Fechar Obra e dar baixa">
                                    <i class="fas fa-check-circle"></i> Fechar Obra
                                </button>` : 
                                `<button onclick="reverterObra(${o.id})" class="btn-outline" style="padding: 5px 10px; font-size: 0.8rem; border-color: var(--danger-color); color: var(--danger-color);" title="Cancelar Baixas e Financeiro">
                                    <i class="fas fa-undo"></i> Reverter Obra
                                </button>`
                            }
                            <button onclick="prepararPDFHistorico(${o.id})" class="action-btn edit-btn" title="Imprimir">
                                <i class="fas fa-print"></i>
                            </button>
                            <button onclick="excluirOrcamento(${o.id})" class="action-btn delete-btn" title="Excluir">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>`;
}

// EDIÇÃO DE ORÇAMENTO EXISTENTE
async function editarOrcamento(id) {
    try {
        const orcamento = await LocalDB.getById('orcamentos', id);
        if (!orcamento) {
            showNotification("Orçamento não encontrado!", "error");
            return;
        }

        // Se o orçamento já está finalizado, não permite editar sem reverter
        if (orcamento.status === 'Finalizado') {
            if (!confirm("Este orçamento já foi finalizado. Deseja reverter para editar?")) {
                return;
            }
            await reverterObra(id);
        }

        window.currentEditingBudgetId = id;
        window.originalBudgetItems = JSON.parse(JSON.stringify(orcamento.itens || []));
        window.currentBudgetItems = JSON.parse(JSON.stringify(orcamento.itens || []));

        // Preencher formulário com dados do orçamento
        document.getElementById('orc-cliente').value = orcamento.cliente || '';
        document.getElementById('orc-margem').value = orcamento.margem || 30;

        // Mudar para a aba de novo orçamento
        switchBudgetTab('tab-novo-orc', { target: document.getElementById('btn-tab-novo') });
        
        // Renderizar itens existentes
        renderResumoOrcamento();
        
        // Mostrar botão de salvar edição
        document.getElementById('botoes-finalizacao').style.display = 'block';
        document.getElementById('botoes-finalizacao').innerHTML = `
            <button class="btn-outline" onclick="cancelarEdicaoOrcamento()">Cancelar Edição</button>
            <button class="btn-primary" onclick="salvarEdicaoOrcamento(${id})" style="background: var(--warning-color);">
                <i class="fas fa-save"></i> Salvar Alterações
            </button>
            <button class="btn-primary" style="background: var(--info-color);" onclick="prepararPDFHistorico(${id})">
                <i class="fas fa-print"></i> Visualizar PDF
            </button>
        `;

        // Scroll para o topo
        window.scrollTo(0, 0);
        
        // Mostrar mensagem
        showNotification('Modo de edição ativado. Adicione ou remova itens do orçamento.', 'info');
    } catch (error) {
        console.error('Erro ao editar orçamento:', error);
        showNotification("Erro ao carregar orçamento para edição.", "error");
    }
}

async function salvarEdicaoOrcamento(id) {
    try {
        const orcamento = await LocalDB.getById('orcamentos', id);
        if (!orcamento) {
            showNotification("Orçamento não encontrado!", "error");
            return;
        }

        // Atualizar dados do orçamento
        orcamento.cliente = document.getElementById('orc-cliente').value;
        orcamento.margem = Number(document.getElementById('orc-margem').value) || 30;
        orcamento.itens = window.currentBudgetItems;
        
        // Recalcular totais
        const totalCusto = window.currentBudgetItems.reduce((acc, i) => acc + (i.total_custo || 0), 0);
        orcamento.total_custo = totalCusto;
        orcamento.total_venda = totalCusto * (1 + (orcamento.margem / 100));
        orcamento.data_atualizacao = new Date().toISOString();

        // Salvar no banco
        await LocalDB.save('orcamentos', orcamento);
        
        // Limpar estado de edição
        window.currentEditingBudgetId = null;
        window.originalBudgetItems = [];
        
        // Recarregar histórico
        await renderHistoricoOrcamentos();
        
        // Voltar para aba de histórico
        switchBudgetTab('tab-historico-orc', { target: document.getElementById('btn-tab-hist') });
        
        showNotification('Orçamento atualizado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao salvar edição do orçamento:', error);
        showNotification("Erro ao salvar alterações.", "error");
    }
}

function cancelarEdicaoOrcamento() {
    if (confirm("Deseja cancelar as alterações feitas no orçamento?")) {
        window.currentEditingBudgetId = null;
        window.originalBudgetItems = [];
        window.currentBudgetItems = [];
        
        // Limpar formulário
        loadPage('orcamentos');
        
        showNotification('Edição cancelada.', 'info');
    }
}

async function finalizarObra(id) {
    if(!confirm("Deseja fechar esta obra? Isso dará baixa no estoque e registrará o crédito no financeiro.")) return;
    
    try {
        const orc = await LocalDB.getById('orcamentos', id);
        if(orc.status === 'Finalizado') {
            showNotification("Obra já finalizada.", "warning");
            return;
        }

        const modelos = await LocalDB.getAll('modelos');
        const estoque = await LocalDB.getAll('estoque');
        let baixasNecessarias = [];

        for(let itemOrc of orc.itens) {
            const mod = modelos.find(m => m.id == itemOrc.modelo_id) || modelos.find(m => m.nome == itemOrc.nome);
            if(!mod) continue;
            
            for(let rec of mod.receita) {
                if(rec.tipo !== 'material') continue;
                
                let formula = rec.formula.replace(/L/g, itemOrc.medida_L).replace(/H/g, itemOrc.medida_H);
                let quantCalculada = 0;
                
                try {
                    if (!rec.formula.includes('L') && !rec.formula.includes('H')) {
                        quantCalculada = Number(rec.formula);
                    } else {
                        quantCalculada = eval(formula);
                    }
                } catch(e) { quantCalculada = 0; }
                
                let quantFinal = 0;
                if (!rec.formula.includes('L') && !rec.formula.includes('H')) {
                    quantFinal = quantCalculada * itemOrc.qtd;
                } else {
                    quantFinal = (quantCalculada / 1000) * itemOrc.qtd;
                }
                
                // Normalização da busca do item no estoque
                const itemEstoque = estoque.find(e => e.nome.trim().toLowerCase() === rec.item.trim().toLowerCase());
                
                if(itemEstoque) {
                    const targetCor = (itemOrc.cor || "").trim().toLowerCase();
                    // Tenta encontrar a cor específica; se não encontrar, pega a primeira disponível (caso de acessórios universais)
                    let corGrade = itemEstoque.grade.find(g => (g.cor || "").trim().toLowerCase() === targetCor) || itemEstoque.grade[0];
                    
                    if(corGrade) {
                        corGrade.quantidade = Number(corGrade.quantidade) - Number(quantFinal);
                        if(!baixasNecessarias.some(b => b.id === itemEstoque.id)) baixasNecessarias.push(itemEstoque);
                    }
                }
            }
        }
        
        for(let itemEst of baixasNecessarias) {
            await LocalDB.save('estoque', itemEst);
        }
        
        await LocalDB.save('financeiro', { 
            data: new Date().toISOString(), 
            descricao: `Venda Obra #${orc.id} - ${orc.cliente}`, 
            tipo: 'Crédito', 
            valor: orc.total_venda, 
            orc_id: orc.id 
        });
        
        orc.status = 'Finalizado';
        await LocalDB.save('orcamentos', orc);
        
        showNotification("Obra finalizada com sucesso! Estoque atualizado.", "success");
        renderHistoricoOrcamentos();
    } catch (err) { 
        console.error("Erro ao finalizar obra:", err);
        showNotification("Erro ao finalizar obra: " + err.message, "error"); 
    }
}

async function reverterObra(id) {
    if(!confirm("Deseja reverter esta obra? Isso devolverá os materiais ao estoque e lançará um estorno (saída) no seu financeiro.")) return;
    
    try {
        const orc = await LocalDB.getById('orcamentos', id);
        if(orc.status !== 'Finalizado') {
            showNotification("Somente obras finalizadas podem ser revertidas.", "warning");
            return;
        }

        const modelos = await LocalDB.getAll('modelos');
        const estoque = await LocalDB.getAll('estoque');
        let retornosNecessarios = [];

        for(let itemOrc of orc.itens) {
            const mod = modelos.find(m => m.id == itemOrc.modelo_id) || modelos.find(m => m.nome == itemOrc.nome);
            if(!mod) continue;
            
            for(let rec of mod.receita) {
                if(rec.tipo !== 'material') continue;
                
                let formula = rec.formula.replace(/L/g, itemOrc.medida_L).replace(/H/g, itemOrc.medida_H);
                let quantCalculada = 0;
                
                try {
                    if (!rec.formula.includes('L') && !rec.formula.includes('H')) {
                        quantCalculada = Number(rec.formula);
                    } else {
                        quantCalculada = eval(formula);
                    }
                } catch(e) { quantCalculada = 0; }
                
                let quantFinal = 0;
                if (!rec.formula.includes('L') && !rec.formula.includes('H')) {
                    quantFinal = quantCalculada * itemOrc.qtd;
                } else {
                    quantFinal = (quantCalculada / 1000) * itemOrc.qtd;
                }
                
                const itemEstoque = estoque.find(e => e.nome.trim().toLowerCase() === rec.item.trim().toLowerCase());
                
                if(itemEstoque) {
                    const targetCor = (itemOrc.cor || "").trim().toLowerCase();
                    // Tenta encontrar a cor específica; se não encontrar, pega a primeira disponível (caso de acessórios universais)
                    let corGrade = itemEstoque.grade.find(g => (g.cor || "").trim().toLowerCase() === targetCor) || itemEstoque.grade[0];
                    
                    if(corGrade) {
                        corGrade.quantidade = Number(corGrade.quantidade) + Number(quantFinal);
                        if(!retornosNecessarios.some(r => r.id === itemEstoque.id)) retornosNecessarios.push(itemEstoque);
                    }
                }
            }
        }
        
        for(let itemEst of retornosNecessarios) {
            await LocalDB.save('estoque', itemEst);
        }
        
        await LocalDB.save('financeiro', { 
            data: new Date().toISOString(), 
            descricao: `Estorno de Venda (Obra #${orc.id} Revertida)`, 
            tipo: 'Débito', 
            valor: orc.total_venda 
        });
        
        orc.status = 'Pendente';
        await LocalDB.save('orcamentos', orc);
        
        showNotification("Obra revertida! Estoque e financeiro ajustados.", "success");
        renderHistoricoOrcamentos();
    } catch (err) { 
        console.error("Erro ao reverter obra:", err);
        showNotification("Erro ao reverter obra.", "error"); 
    }
}

async function excluirOrcamento(id) { 
    if(confirm("Deseja remover este orçamento permanentemente?")) { 
        await LocalDB.delete('orcamentos', id); 
        renderHistoricoOrcamentos(); 
        showNotification('Orçamento removido com sucesso!', 'success');
    } 
}

async function prepararPDFNovoOrcamento() {
    const cliente = document.getElementById('orc-cliente').value;
    const margem = Number(document.getElementById('orc-margem').value) || 0;
    
    if(!cliente) {
        showNotification("Selecione o cliente.", "error");
        return;
    }
    
    const totalCusto = window.currentBudgetItems.reduce((acc, i) => acc + (i.total_custo || 0), 0);
    const totalVenda = totalCusto * (1 + (margem / 100));
    
    await imprimirPDFProfissional({ 
        cliente, 
        data: new Date().toISOString(), 
        itens: window.currentBudgetItems, 
        total_custo: totalCusto, 
        total_venda: totalVenda, 
        margem 
    });
}

async function prepararPDFHistorico(id) {
    const o = await LocalDB.getById('orcamentos', id);
    await imprimirPDFProfissional(o);
}

// Exportar funções para uso global
window.renderHistoricoOrcamentos = renderHistoricoOrcamentos;
window.editarOrcamento = editarOrcamento;
window.salvarEdicaoOrcamento = salvarEdicaoOrcamento;
window.cancelarEdicaoOrcamento = cancelarEdicaoOrcamento;
window.finalizarObra = finalizarObra;
window.reverterObra = reverterObra;
window.excluirOrcamento = excluirOrcamento;
window.prepararPDFNovoOrcamento = prepararPDFNovoOrcamento;
window.prepararPDFHistorico = prepararPDFHistorico;