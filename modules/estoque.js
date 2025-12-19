// modules/estoque.js

// Funções para gerenciamento de estoque
async function handleSalvarItem(e) {
    e.preventDefault();
    const grade = Array.from(document.querySelectorAll('.color-row')).map(r => ({
        cor: r.querySelector('.est-row-cor').value,
        quantidade: r.querySelector('.est-row-qtd').value,
        valor: r.querySelector('.est-row-valor').value,
        minimo: r.querySelector('.est-row-min').value
    }));
    
    const item = { 
        nome: document.getElementById('est-nome').value, 
        codigo_pai: document.getElementById('est-codigo-pai').value,
        cat: document.getElementById('est-cat').value, 
        uni_ent: document.getElementById('est-uni-entrada').value,
        uni_saida: document.getElementById('est-uni-saida').value, 
        fator_conversao: document.getElementById('est-fator').value, 
        grade 
    };
    
    if (window.currentEditingId) item.id = window.currentEditingId;
    await LocalDB.save('estoque', item);
    resetEstoqueForm(); 
    await renderEstoque();
    showNotification("Estoque atualizado com sucesso!", "success");
}

async function renderEstoque() {
    const list = await LocalDB.getAll('estoque');
    const container = document.getElementById('lista-estoque');
    if(!container) return;
    
    let valorTotal = 0;
    
    const rows = list.map(i => {
        let totalItem = 0;
        let totalValor = 0;
        let detalhes = '';
        
        if (i.grade && i.grade.length > 0) {
            detalhes = i.grade.map(g => {
                const quantidade = Number(g.quantidade) || 0;
                const valor = Number(g.valor) || 0;
                const valorItem = quantidade * valor;
                totalItem += quantidade;
                totalValor += valorItem;
                
                // Mostrar em vermelho se quantidade for negativa
                const quantidadeStyle = quantidade < 0 ? 'color: var(--danger-color); font-weight: bold;' : '';
                return `
                    <div style="margin-bottom: 5px; padding: 5px; background: #f8f9fa; border-radius: 5px;">
                        <strong>${g.cor || 'Sem cor'}:</strong> 
                        <span style="${quantidadeStyle}">${quantidade.toFixed(2)} ${i.uni_saida}</span> • 
                        R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/uni • 
                        <strong>Total:</strong> R$ ${valorItem.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>`;
            }).join('');
        }
        
        valorTotal += totalValor;
        
        return `<tr>
            <td>
                <strong>${i.nome}</strong><br>
                <small>${i.cat}</small>
                ${detalhes ? `<div style="margin-top: 10px;">${detalhes}</div>` : ''}
            </td>
            <td style="font-weight: bold; color: ${totalItem < 0 ? 'var(--danger-color)' : 'inherit'}">
                ${totalItem.toFixed(2)} ${i.uni_saida}
            </td>
            <td style="font-weight: bold; color: var(--primary-color);">
                R$ ${totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </td>
            <td class="text-right">
                <button onclick="editarEstoque(${i.id})" class="action-btn edit-btn">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="removerEstoque(${i.id})" class="action-btn delete-btn">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>`;
    }).join('');
    
    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Produto</th>
                    <th>Saldo Total</th>
                    <th>Valor Total</th>
                    <th class="text-right">Ações</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>`;
}

async function editarEstoque(id) {
    const i = await LocalDB.getById('estoque', id);
    document.getElementById('est-nome').value = i.nome;
    document.getElementById('est-codigo-pai').value = i.codigo_pai || '';
    document.getElementById('est-cat').value = i.cat || '';
    document.getElementById('est-fator').value = i.fator_conversao || 1;
    document.getElementById('color-rows-container').innerHTML = '';
    
    if (i.grade && i.grade.length > 0) {
        for (let g of i.grade) await adicionarLinhaCor(g);
    } else {
        await adicionarLinhaCor();
    }
    
    window.currentEditingId = id;
    document.getElementById('btn-cancel-est').style.display = 'block';
    window.scrollTo(0, 0);
}

function resetEstoqueForm() {
    document.getElementById('form-estoque').reset();
    document.getElementById('color-rows-container').innerHTML = '';
    window.currentEditingId = null;
    document.getElementById('btn-cancel-est').style.display = 'none';
    adicionarLinhaCor();
}

async function removerEstoque(id) {
    if(confirm('Remover item permanentemente?')) {
        await LocalDB.delete('estoque', id);
        renderEstoque();
        showNotification('Item removido do estoque!', 'success');
    }
}

async function adicionarLinhaCor(dados = null) {
    const container = document.getElementById('color-rows-container');
    if(!container) return;
    
    const cores = await LocalDB.getAll('cores');
    const div = document.createElement('div');
    div.className = 'color-row';
    
    div.innerHTML = `
        <div class="form-group">
            <label>Cor</label>
            <select class="form-control est-row-cor">
                ${cores.map(c => `<option value="${c.nome}" ${dados?.cor === c.nome ? 'selected' : ''}>${c.nome}</option>`).join('')}
            </select>
        </div>
        <div class="form-group">
            <label>Quant.</label>
            <input type="number" class="form-control est-row-qtd" value="${dados?.quantidade || 0}" step="0.01">
        </div>
        <div class="form-group">
            <label>Preço Un.</label>
            <input type="number" class="form-control est-row-valor" value="${dados?.valor || 0}" step="0.01">
        </div>
        <div class="form-group">
            <label>Mínimo</label>
            <input type="number" class="form-control est-row-min" value="${dados?.minimo || 0}" step="0.01">
        </div>
        <button type="button" class="action-btn delete-btn" onclick="this.parentElement.remove()" style="margin-bottom:8px">
            <i class="fas fa-trash"></i>
        </button>`;
    
    container.appendChild(div);
}

// Exportar funções para uso global
window.handleSalvarItem = handleSalvarItem;
window.renderEstoque = renderEstoque;
window.editarEstoque = editarEstoque;
window.resetEstoqueForm = resetEstoqueForm;
window.removerEstoque = removerEstoque;
window.adicionarLinhaCor = adicionarLinhaCor;