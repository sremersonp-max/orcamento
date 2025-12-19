// modules/modelos.js

// Funções para gerenciamento de modelos
async function handleSalvarModelo(e) {
    e.preventDefault();
    const rows = document.querySelectorAll('.recipe-row');
    const itens = Array.from(rows).map(row => ({
        tipo: row.querySelector('.rec-tipo').value,
        item: row.querySelector('.rec-tipo').value === 'material' ? 
               row.querySelector('.rec-item').value : 
               row.querySelector('.rec-vid-id').value,
        formula: row.querySelector('.rec-formula').value.toUpperCase().replace(/\s/g, '')
    }));
    
    const modelo = { 
        nome: document.getElementById('mod-nome').value, 
        receita: itens 
    };
    
    if (window.currentEditingId) modelo.id = window.currentEditingId;
    await LocalDB.save('modelos', modelo);
    resetModeloForm(); 
    await renderModelos();
    showNotification("Modelo salvo com sucesso!", "success");
}

async function adicionarLinhaReceita(dados = null) {
    const container = document.getElementById('recipe-container');
    if(!container) return;
    
    const estoque = await LocalDB.getAll('estoque');
    const div = document.createElement('div');
    div.className = 'recipe-row';
    div.innerHTML = `
        <select class="form-control rec-tipo" onchange="updateRecipeItemSelect(this)">
            <option value="material" ${dados?.tipo === 'material' ? 'selected' : ''}>Material Stock</option>
            <option value="vidro" ${dados?.tipo === 'vidro' ? 'selected' : ''}>Vidro (Encomenda)</option>
        </select>
        <div class="rec-select-material" style="${dados?.tipo === 'vidro' ? 'display:none' : ''}">
            <select class="form-control rec-item">
                <option value="">Escolha o item...</option>
                ${estoque.map(i => `<option value="${i.nome}" ${dados?.item === i.nome ? 'selected' : ''}>${i.nome}</option>`).join('')}
            </select>
        </div>
        <div class="rec-label-vidro" style="${dados?.tipo === 'vidro' ? '' : 'display:none'}">
            <input type="text" class="form-control rec-vid-id" value="${dados?.item || 'Vidro 1'}" placeholder="ID do Vidro">
        </div>
        <input type="text" class="form-control rec-formula" value="${dados?.formula || ''}" placeholder="Fórmula (L, H) ou quantidade fixa">
        <button type="button" class="action-btn delete-btn" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>`;
    
    container.appendChild(div);
}

function updateRecipeItemSelect(el) {
    const row = el.parentElement;
    const materialDiv = row.querySelector('.rec-select-material');
    const vidroDiv = row.querySelector('.rec-label-vidro');
    
    if (el.value === 'material') {
        materialDiv.style.display = 'block';
        vidroDiv.style.display = 'none';
    } else {
        materialDiv.style.display = 'none';
        vidroDiv.style.display = 'block';
    }
}

async function renderModelos() {
    const list = await LocalDB.getAll('modelos');
    const container = document.getElementById('lista-modelos');
    if(!container) return;
    
    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Modelo / Projeto</th>
                    <th class="text-right">Ações</th>
                </tr>
            </thead>
            <tbody>
                ${list.map(m => `
                    <tr>
                        <td><strong>${m.nome}</strong></td>
                        <td class="text-right">
                            <button onclick="editarModelo(${m.id})" class="action-btn edit-btn">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="removerModelo(${m.id})" class="action-btn delete-btn">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
}

async function editarModelo(id) {
    const m = await LocalDB.getById('modelos', id);
    document.getElementById('mod-nome').value = m.nome;
    document.getElementById('recipe-container').innerHTML = '';
    
    for (let item of m.receita) {
        await adicionarLinhaReceita(item);
    }
    
    window.currentEditingId = id;
    document.getElementById('btn-cancel-mod').style.display = 'block';
    window.scrollTo(0, 0);
}

function resetModeloForm() {
    document.getElementById('form-modelo').reset();
    document.getElementById('recipe-container').innerHTML = '';
    window.currentEditingId = null;
    document.getElementById('btn-cancel-mod').style.display = 'none';
    adicionarLinhaReceita();
}

async function removerModelo(id) {
    if(confirm('Excluir este modelo permanentemente?')) {
        await LocalDB.delete('modelos', id);
        renderModelos();
        showNotification('Modelo removido com sucesso!', 'success');
    }
}

// Exportar funções para uso global
window.handleSalvarModelo = handleSalvarModelo;
window.adicionarLinhaReceita = adicionarLinhaReceita;
window.updateRecipeItemSelect = updateRecipeItemSelect;
window.renderModelos = renderModelos;
window.editarModelo = editarModelo;
window.resetModeloForm = resetModeloForm;
window.removerModelo = removerModelo;