// Módulo de Estoque - Oficina da Família

function initEstoque() {
    console.log('Inicializando módulo de estoque...');
    
    // Carregar materiais
    carregarMateriais();
    
    // Configurar eventos
    document.getElementById('btn-cadastrar-material')?.addEventListener('click', abrirCadastroMaterial);
    document.getElementById('btn-filtrar')?.addEventListener('click', abrirFiltros);
    document.getElementById('buscar-material')?.addEventListener('input', buscarMaterial);
}

function carregarMateriais() {
    if (!window.db) {
        mostrarMensagem('Banco de dados não carregado', 'error');
        return;
    }
    
    try {
        const resultados = db.exec(`
            SELECT * FROM materiais 
            ORDER BY descricao ASC
        `);
        
        if (!resultados || resultados.length === 0) {
            document.getElementById('lista-materiais').innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px; color: #888;">
                        <i class="fas fa-box-open fa-2x" style="margin-bottom: 15px;"></i><br>
                        Nenhum material cadastrado
                    </td>
                </tr>
            `;
            return;
        }
        
        const materiais = resultados[0].values;
        const colunas = resultados[0].columns;
        
        let html = '';
        materiais.forEach((linha, index) => {
            const material = {};
            colunas.forEach((col, i) => {
                material[col] = linha[i];
            });
            
            html += `
                <tr>
                    <td><strong>${material.codigo}</strong></td>
                    <td>${material.descricao}</td>
                    <td><span class="grupo-badge">${material.grupo}</span></td>
                    <td>${material.unidade_medida}</td>
                    <td class="text-right">${formatarMoeda(material.valor_unitario)}</td>
                    <td class="text-right">${formatarNumero(material.quantidade)}</td>
                    <td>
                        <button onclick="editarMaterial(${material.id})" class="btn-action" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="excluirMaterial(${material.id})" class="btn-action btn-danger" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        document.getElementById('lista-materiais').innerHTML = html;
        
    } catch (error) {
        console.error('Erro ao carregar materiais:', error);
        mostrarMensagem('Erro ao carregar estoque', 'error');
    }
}

function abrirCadastroMaterial() {
    const html = `
        <div class="modal-overlay">
            <div class="modal">
                <div class="modal-header">
                    <h3><i class="fas fa-box"></i> Cadastrar Material</h3>
                    <button onclick="fecharModal()" class="btn-close">&times;</button>
                </div>
                
                <div class="modal-body">
                    <form id="form-material">
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="codigo">Código *</label>
                                <input type="text" id="codigo" required placeholder="Ex: ESP3">
                            </div>
                            
                            <div class="form-group">
                                <label for="descricao">Descrição *</label>
                                <input type="text" id="descricao" required placeholder="Ex: Espelho 3 mm">
                            </div>
                            
                            <div class="form-group">
                                <label for="grupo">Grupo *</label>
                                <select id="grupo" required>
                                    <option value="">Selecione...</option>
                                    <option value="Vidro">Vidro</option>
                                    <option value="Alumínio">Alumínio</option>
                                    <option value="Ferragem">Ferragem</option>
                                    <option value="Acessórios">Acessórios</option>
                                    <option value="Puxador">Puxador</option>
                                    <option value="Kit">Kit</option>
                                    <option value="Serviços">Serviços</option>
                                    <option value="Esquadria">Esquadria</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="unidade">Unidade de Medida *</label>
                                <select id="unidade" required>
                                    <option value="">Selecione...</option>
                                    <option value="Und">Unidade</option>
                                    <option value="M/H">Metro Linear na Altura</option>
                                    <option value="M/L">Metro Linear na Largura</option>
                                    <option value="M/H2">2x Metro Linear na Altura</option>
                                    <option value="M/L2">2x Metro Linear na Largura</option>
                                    <option value="M²">Metro Quadrado</option>
                                    <option value="PE">Perímetro</option>
                                    <option value="Kg">Peso</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="valor">Valor por Unidade *</label>
                                <input type="number" id="valor" step="0.01" required placeholder="Ex: 155,18">
                            </div>
                            
                            <div class="form-group">
                                <label for="quantidade">Quantidade em Estoque</label>
                                <input type="number" id="quantidade" step="0.01" value="0">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="observacoes">Observações</label>
                            <textarea id="observacoes" rows="3" placeholder="Detalhes, marca, etc..."></textarea>
                        </div>
                    </form>
                </div>
                
                <div class="modal-footer">
                    <button onclick="fecharModal()" class="btn btn-acao">Cancelar</button>
                    <button onclick="salvarMaterial()" class="btn btn-primary">
                        <i class="fas fa-save"></i> Salvar Material
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
}

function salvarMaterial() {
    const material = {
        codigo: document.getElementById('codigo').value,
        descricao: document.getElementById('descricao').value,
        grupo: document.getElementById('grupo').value,
        unidade_medida: document.getElementById('unidade').value,
        valor_unitario: parseFloat(document.getElementById('valor').value),
        quantidade: parseFloat(document.getElementById('quantidade').value) || 0,
        observacoes: document.getElementById('observacoes').value
    };
    
    // Validação básica
    if (!material.codigo || !material.descricao || !material.grupo || !material.unidade_medida || isNaN(material.valor_unitario)) {
        mostrarMensagem('Preencha todos os campos obrigatórios', 'error');
        return;
    }
    
    try {
        db.run(
            `INSERT INTO materiais (codigo, descricao, grupo, unidade_medida, valor_unitario, quantidade, observacoes)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [material.codigo, material.descricao, material.grupo, material.unidade_medida, 
             material.valor_unitario, material.quantidade, material.observacoes]
        );
        
        salvarBackup();
        mostrarMensagem('Material cadastrado com sucesso!', 'success');
        fecharModal();
        carregarMateriais();
        
    } catch (error) {
        if (error.message.includes('UNIQUE')) {
            mostrarMensagem('Código já existe! Use outro código.', 'error');
        } else {
            mostrarMensagem('Erro ao salvar: ' + error.message, 'error');
        }
    }
}

function editarMaterial(id) {
    mostrarMensagem('Edição em desenvolvimento...', 'info');
}

function excluirMaterial(id) {
    if (!confirm('Tem certeza que deseja excluir este material?')) return;
    
    try {
        db.run('DELETE FROM materiais WHERE id = ?', [id]);
        salvarBackup();
        mostrarMensagem('Material excluído!', 'success');
        carregarMateriais();
    } catch (error) {
        mostrarMensagem('Erro ao excluir: ' + error.message, 'error');
    }
}

function buscarMaterial(event) {
    const termo = event.target.value.toLowerCase();
    // Implementar busca
    mostrarMensagem('Busca em desenvolvimento...', 'info');
}

function abrirFiltros() {
    mostrarMensagem('Filtros em desenvolvimento...', 'info');
}

function fecharModal() {
    document.querySelector('.modal-overlay')?.remove();
}

// Formatar números
function formatarNumero(num) {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(num);
}

// Estilos para o módulo
const estoqueStyles = `
    .grupo-badge {
        display: inline-block;
        padding: 4px 12px;
        background: #e8f5e9;
        color: #1a472a;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
    }
    
    .text-right {
        text-align: right;
    }
    
    .btn-action {
        padding: 8px 12px;
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 6px;
        cursor: pointer;
        margin: 0 3px;
        color: #495057;
    }
    
    .btn-action:hover {
        background: #e9ecef;
    }
    
    .btn-danger {
        background: #fee;
        border-color: #f5c6cb;
        color: #721c24;
    }
    
    .btn-danger:hover {
        background: #f5c6cb;
    }
    
    /* Modal */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }
    
    .modal {
        background: white;
        border-radius: 16px;
        width: 90%;
        max-width: 800px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    
    .modal-header {
        padding: 25px 30px;
        border-bottom: 2px solid #f0f0f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .modal-header h3 {
        margin: 0;
        color: #1a472a;
    }
    
    .btn-close {
        background: none;
        border: none;
        font-size: 2rem;
        cursor: pointer;
        color: #888;
    }
    
    .modal-body {
        padding: 30px;
    }
    
    .modal-footer {
        padding: 20px 30px;
        border-top: 2px solid #f0f0f0;
        display: flex;
        justify-content: flex-end;
        gap: 15px;
    }
    
    /* Form */
    .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin-bottom: 25px;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: #495057;
    }
    
    .form-group input,
    .form-group select,
    .form-group textarea {
        width: 100%;
        padding: 12px 15px;
        border: 2px solid #dee2e6;
        border-radius: 8px;
        font-size: 1rem;
        transition: border-color 0.3s;
    }
    
    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
        outline: none;
        border-color: #2ecc71;
    }
`;

// Adicionar estilos ao documento
const styleSheet = document.createElement('style');
styleSheet.textContent = estoqueStyles;
document.head.appendChild(styleSheet);

// Exportar funções
window.initEstoque = initEstoque;
window.carregarMateriais = carregarMateriais;
window.abrirCadastroMaterial = abrirCadastroMaterial;
window.salvarMaterial = salvarMaterial;
window.editarMaterial = editarMaterial;
window.excluirMaterial = excluirMaterial;
window.fecharModal = fecharModal;
