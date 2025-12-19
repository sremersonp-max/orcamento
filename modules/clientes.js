// modules/clientes.js

// Funções para gerenciamento de clientes
async function handleSalvarCliente(e) {
    e.preventDefault();
    const cliente = { 
        nome: document.getElementById('cli-nome').value, 
        tipo: document.getElementById('cli-tipo').value, 
        telefone: document.getElementById('cli-tel').value, 
        saldo: document.getElementById('cli-saldo').value, 
        endereco: document.getElementById('cli-endereco').value, 
        doc: document.getElementById('cli-doc').value,
        email: document.getElementById('cli-email').value
    };
    
    if (window.currentEditingId) cliente.id = window.currentEditingId;
    await LocalDB.save('clientes', cliente);
    resetClienteForm(); 
    await renderClientes();
    showNotification("Contato salvo com sucesso!", "success");
}

// NOVA FUNÇÃO: SALVAR CLIENTE E IR PARA ORÇAMENTO
async function handleSalvarClienteRapido(event) {
    if (event) event.preventDefault();
    
    const cliente = { 
        nome: document.getElementById('cli-nome').value, 
        tipo: document.getElementById('cli-tipo').value, 
        telefone: document.getElementById('cli-tel').value, 
        saldo: document.getElementById('cli-saldo').value, 
        endereco: document.getElementById('cli-endereco').value, 
        doc: document.getElementById('cli-doc').value,
        email: document.getElementById('cli-email').value
    };
    
    if (!cliente.nome) {
        showNotification("Digite o nome do cliente!", "error");
        return;
    }
    
    if (window.currentEditingId) cliente.id = window.currentEditingId;
    await LocalDB.save('clientes', cliente);
    
    // Ir para página de orçamentos
    loadPage('orcamentos');
    
    // Selecionar o cliente recém-cadastrado
    setTimeout(() => {
        const selectCliente = document.getElementById('orc-cliente');
        if (selectCliente) {
            selectCliente.value = cliente.nome;
        }
    }, 500);
    
    showNotification('Cliente salvo e pronto para orçamento!', 'success');
}

async function salvarEIrParaOrcamento() {
    await handleSalvarClienteRapido();
}

async function renderClientes() {
    const list = await LocalDB.getAll('clientes');
    const container = document.getElementById('lista-clientes');
    if(!container) return;
    
    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Nome</th>
                    <th>Contato</th>
                    <th class="text-right">Ações</th>
                </tr>
            </thead>
            <tbody>
                ${list.map(c => `
                    <tr>
                        <td><strong>${c.nome}</strong></td>
                        <td>${c.telefone || '-'}</td>
                        <td class="text-right">
                            <button onclick="editarCliente(${c.id})" class="action-btn edit-btn">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="removerCliente(${c.id})" class="action-btn delete-btn">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
}

async function editarCliente(id) {
    const c = await LocalDB.getById('clientes', id);
    document.getElementById('cli-nome').value = c.nome;
    document.getElementById('cli-tel').value = c.telefone || '';
    document.getElementById('cli-saldo').value = c.saldo || 0;
    document.getElementById('cli-endereco').value = c.endereco || '';
    document.getElementById('cli-tipo').value = c.tipo;
    document.getElementById('cli-doc').value = c.doc || '';
    document.getElementById('cli-email').value = c.email || '';
    
    window.currentEditingId = id;
    document.getElementById('btn-cancel-cli').style.display = 'block';
    document.getElementById('btn-salvar-orcamento').style.display = 'none';
    window.scrollTo(0, 0);
}

function resetClienteForm() { 
    document.getElementById('form-cliente').reset(); 
    window.currentEditingId = null; 
    document.getElementById('btn-cancel-cli').style.display = 'none'; 
    document.getElementById('btn-salvar-orcamento').style.display = 'none';
}

async function removerCliente(id) { 
    if(confirm('Excluir contato permanentemente?')) { 
        await LocalDB.delete('clientes', id); 
        renderClientes(); 
        showNotification('Contato removido com sucesso!', 'success');
    } 
}

// NOVA FUNÇÃO: FILTRAR CLIENTES
function filtrarClientes(termo) {
    const select = document.getElementById('orc-cliente');
    const options = select.querySelectorAll('option');
    const termoLower = termo.toLowerCase();
    
    options.forEach(option => {
        if (option.value === '') return;
        if (option.text.toLowerCase().includes(termoLower)) {
            option.style.display = '';
        } else {
            option.style.display = 'none';
        }
    });
}

// NOVA FUNÇÃO: ABRIR CADASTRO RÁPIDO DE CLIENTE
function abrirCadastroClienteRapido() {
    loadPage('clientes');
    // Mostrar botão especial para salvar e ir para orçamento
    document.getElementById('btn-salvar-orcamento').style.display = 'inline-block';
    document.getElementById('btn-salvar-orcamento').onclick = async function() {
        await handleSalvarClienteRapido();
    };
}

// Exportar funções para uso global
window.handleSalvarCliente = handleSalvarCliente;
window.handleSalvarClienteRapido = handleSalvarClienteRapido;
window.salvarEIrParaOrcamento = salvarEIrParaOrcamento;
window.renderClientes = renderClientes;
window.editarCliente = editarCliente;
window.resetClienteForm = resetClienteForm;
window.removerCliente = removerCliente;
window.filtrarClientes = filtrarClientes;
window.abrirCadastroClienteRapido = abrirCadastroClienteRapido;