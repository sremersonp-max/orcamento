// Módulo de Gestão de Clientes
const clientes = (function() {
    let dados = [];
    let idParaExcluir = null;
    
    // Inicializar módulo
    function init() {
        console.log('Inicializando módulo de clientes...');
        carregarDados();
        configurarEventos();
        configurarMascaras();
    }
    
    // Carregar clientes do banco de dados - ASYNC
    async function carregarDados() {
        try {
            if (!window.db) {
                throw new Error('Banco de dados não inicializado');
            }
            
            // Usar await para queries assíncronas
            const resultado = await window.db.exec(`
                SELECT * FROM clientes 
                ORDER BY nome COLLATE NOCASE ASC
            `);
            
            if (resultado && resultado.length > 0) {
                dados = resultado[0].values.map(row => {
                    const cliente = {};
                    resultado[0].columns.forEach((col, index) => {
                        cliente[col] = row[index];
                    });
                    return cliente;
                });
            } else {
                dados = [];
            }
            
            atualizarEstatisticas();
            renderizarLista();
            
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
            mostrarMensagem('Erro ao carregar clientes: ' + error.message, 'error');
            dados = [];
            renderizarLista();
        }
    }
    
    // Atualizar cards de estatísticas
    function atualizarEstatisticas() {
        document.getElementById('clientes-total').textContent = dados.length;
        
        const clientesEmpresa = dados.filter(c => c.empresa && c.empresa.trim() !== '').length;
        document.getElementById('clientes-empresa').textContent = clientesEmpresa;
        
        const clientesPessoa = dados.length - clientesEmpresa;
        document.getElementById('clientes-pessoa').textContent = clientesPessoa;
    }
    
    // Renderizar lista na tabela
    function renderizarLista(lista = dados) {
        const tbody = document.getElementById('clientes-lista');
        
        if (lista.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center tabela-vazia">
                        <i class="fas fa-user-clock"></i>
                        <p>Nenhum cliente encontrado</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        
        lista.forEach(cliente => {
            const primeiraLetra = cliente.nome.charAt(0).toUpperCase();
            const telefoneFormatado = formatarTelefone(cliente.telefone);
            const documento = formatarDocumento(cliente.cpf_cnpj);
            const enderecoResumo = cliente.endereco ? 
                cliente.endereco.substring(0, 40) + (cliente.endereco.length > 40 ? '...' : '') : 
                'Não informado';
            
            html += `
                <tr data-id="${cliente.id}">
                    <td>
                        <div class="cliente-info">
                            <div class="cliente-avatar">${primeiraLetra}</div>
                            <div>
                                <div class="cliente-nome">${cliente.nome}</div>
                                <div class="cliente-empresa">${cliente.empresa || 'Cliente avulso'}</div>
                            </div>
                        </div>
                    </td>
                    <td>${documento || 'Não informado'}</td>
                    <td>
                        <div class="cliente-contato">
                            <div>${telefoneFormatado || 'Não informado'}</div>
                            ${cliente.email ? `<small>${cliente.email}</small>` : ''}
                        </div>
                    </td>
                    <td>${enderecoResumo}</td>
                    <td class="text-center">
                        <div class="acoes-tabela">
                            <button class="btn-icone" onclick="clientes.editar(${cliente.id})" 
                                    title="Editar cliente">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icone btn-icone-info" onclick="clientes.verOrcamentos(${cliente.id})" 
                                    title="Ver orçamentos">
                                <i class="fas fa-file-invoice-dollar"></i>
                            </button>
                            <button class="btn-icone btn-icone-danger" onclick="clientes.excluir(${cliente.id})" 
                                    title="Excluir cliente">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    }
    
    // Filtrar e ordenar clientes
    function filtrar() {
        const busca = document.getElementById('clientes-busca').value.toLowerCase();
        const ordenacao = document.getElementById('clientes-ordenar').value;
        
        let filtrados = [...dados];
        
        // Aplicar busca
        if (busca) {
            filtrados = filtrados.filter(cliente => 
                cliente.nome.toLowerCase().includes(busca) ||
                (cliente.empresa && cliente.empresa.toLowerCase().includes(busca)) ||
                (cliente.cpf_cnpj && cliente.cpf_cnpj.includes(busca)) ||
                (cliente.email && cliente.email.toLowerCase().includes(busca))
            );
        }
        
        // Aplicar ordenação
        switch(ordenacao) {
            case 'nome':
                filtrados.sort((a, b) => a.nome.localeCompare(b.nome));
                break;
            case 'data_desc':
                filtrados.sort((a, b) => new Date(b.data_cadastro) - new Date(a.data_cadastro));
                break;
            case 'data_asc':
                filtrados.sort((a, b) => new Date(a.data_cadastro) - new Date(b.data_cadastro));
                break;
            case 'empresa':
                filtrados.sort((a, b) => {
                    const empresaA = a.empresa || '';
                    const empresaB = b.empresa || '';
                    return empresaA.localeCompare(empresaB);
                });
                break;
        }
        
        renderizarLista(filtrados);
    }
    
    // Alternar visibilidade dos filtros
    function toggleFiltros() {
        const filtros = document.getElementById('clientes-filtros');
        filtros.style.display = filtros.style.display === 'none' ? 'block' : 'none';
    }
    
    // Abrir modal para novo cliente
    function abrirModalNovo() {
        document.getElementById('cliente-modal-titulo').textContent = 'Novo Cliente';
        document.getElementById('cliente-form').reset();
        document.getElementById('cliente-id').value = '';
        alterarTipo(); // Resetar tipo para padrão
        document.getElementById('cliente-modal').style.display = 'flex';
        document.getElementById('cliente-nome').focus();
    }
    
    // Editar cliente existente
    function editar(id) {
        const cliente = dados.find(c => c.id === id);
        if (!cliente) return;
        
        document.getElementById('cliente-modal-titulo').textContent = 'Editar Cliente';
        document.getElementById('cliente-id').value = cliente.id;
        document.getElementById('cliente-nome').value = cliente.nome || '';
        document.getElementById('cliente-empresa').value = cliente.empresa || '';
        document.getElementById('cliente-telefone').value = cliente.telefone || '';
        document.getElementById('cliente-email').value = cliente.email || '';
        document.getElementById('cliente-endereco').value = cliente.endereco || '';
        document.getElementById('cliente-observacoes').value = cliente.observacoes || '';
        
        // Determinar tipo pelo documento
        const documento = cliente.cpf_cnpj || '';
        if (documento.length === 14) {
            document.getElementById('cliente-tipo').value = 'empresa';
            alterarTipo();
            document.getElementById('cliente-cnpj').value = formatarCNPJ(documento);
        } else {
            document.getElementById('cliente-tipo').value = 'pessoa';
            alterarTipo();
            document.getElementById('cliente-cpf').value = formatarCPF(documento);
        }
        
        document.getElementById('cliente-modal').style.display = 'flex';
    }
    
    // Alterar tipo de cliente (Pessoa/Empresa)
    function alterarTipo() {
        const tipo = document.getElementById('cliente-tipo').value;
        const cpfGroup = document.getElementById('cliente-cpf-group');
        const cnpjGroup = document.getElementById('cliente-cnpj-group');
        
        if (tipo === 'empresa') {
            cpfGroup.style.display = 'none';
            cnpjGroup.style.display = 'block';
            cnpjGroup.querySelector('input').required = false;
            cpfGroup.querySelector('input').required = false;
        } else {
            cpfGroup.style.display = 'block';
            cnpjGroup.style.display = 'none';
            cpfGroup.querySelector('input').required = false;
            cnpjGroup.querySelector('input').required = false;
        }
    }
    
    // Salvar cliente (create/update) - ASYNC
    async function salvar(event) {
        event.preventDefault();
        
        const id = document.getElementById('cliente-id').value;
        const tipo = document.getElementById('cliente-tipo').value;
        
        // Obter CPF/CNPJ sem formatação
        let documento = '';
        if (tipo === 'empresa') {
            documento = document.getElementById('cliente-cnpj').value.replace(/\D/g, '');
        } else {
            documento = document.getElementById('cliente-cpf').value.replace(/\D/g, '');
        }
        
        const cliente = {
            nome: document.getElementById('cliente-nome').value.trim(),
            empresa: document.getElementById('cliente-empresa').value.trim(),
            cpf_cnpj: documento,
            telefone: document.getElementById('cliente-telefone').value,
            email: document.getElementById('cliente-email').value.trim(),
            endereco: document.getElementById('cliente-endereco').value.trim(),
            observacoes: document.getElementById('cliente-observacoes').value.trim()
        };
        
        // Validações - APENAS NOME OBRIGATÓRIO
        if (!cliente.nome || cliente.nome.trim() === '') {
            mostrarMensagem('O nome do cliente é obrigatório', 'error');
            document.getElementById('cliente-nome').focus();
            return false;
        }
        
        try {
            if (id) {
                // Atualizar
                await window.db.run(
                    `UPDATE clientes SET 
                        nome = ?, empresa = ?, cpf_cnpj = ?, telefone = ?, 
                        email = ?, endereco = ?, observacoes = ? 
                     WHERE id = ?`,
                    [cliente.nome, cliente.empresa, cliente.cpf_cnpj, cliente.telefone,
                     cliente.email, cliente.endereco, cliente.observacoes, id]
                );
                mostrarMensagem('Cliente atualizado com sucesso!', 'success');
            } else {
                // Inserir
                await window.db.run(
                    `INSERT INTO clientes (nome, empresa, cpf_cnpj, telefone, email, endereco, observacoes)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [cliente.nome, cliente.empresa, cliente.cpf_cnpj, cliente.telefone,
                     cliente.email, cliente.endereco, cliente.observacoes]
                );
                mostrarMensagem('Cliente cadastrado com sucesso!', 'success');
            }
            
            // Salvar backup e recarregar
            if (typeof salvarBackup === 'function') salvarBackup();
            await carregarDados();
            fecharModal();
            
        } catch (error) {
            console.error('Erro ao salvar cliente:', error);
            mostrarMensagem('Erro ao salvar cliente: ' + error.message, 'error');
        }
        
        return false;
    }
    
    // Excluir cliente (abrir confirmação)
    function excluir(id) {
        const cliente = dados.find(c => c.id === id);
        if (!cliente) return;
        
        idParaExcluir = id;
        document.getElementById('cliente-confirm-msg').textContent = 
            `Tem certeza que deseja excluir o cliente "${cliente.nome}"?`;
        document.getElementById('cliente-confirm-modal').style.display = 'flex';
    }
    
    // Confirmar exclusão - ASYNC
    async function confirmarExclusao() {
        if (!idParaExcluir) return;
        
        try {
            // Verificar se tem orçamentos
            const orcamentos = await window.db.exec(
                'SELECT COUNT(*) as total FROM orcamentos WHERE cliente_id = ?',
                [idParaExcluir]
            );
            
            const temOrcamentos = orcamentos.length > 0 && orcamentos[0].values[0][0] > 0;
            
            if (temOrcamentos) {
                if (!confirm('Este cliente possui orçamentos. Deseja excluir mesmo assim?')) {
                    fecharConfirmModal();
                    return;
                }
            }
            
            await window.db.run('DELETE FROM clientes WHERE id = ?', [idParaExcluir]);
            
            if (typeof salvarBackup === 'function') salvarBackup();
            mostrarMensagem('Cliente excluído com sucesso!', 'success');
            await carregarDados();
            
        } catch (error) {
            console.error('Erro ao excluir cliente:', error);
            mostrarMensagem('Erro ao excluir cliente: ' + error.message, 'error');
        }
        
        fecharConfirmModal();
    }
    
    // Ver orçamentos do cliente
    function verOrcamentos(clienteId) {
        mostrarMensagem('Módulo de orçamentos em desenvolvimento', 'info');
    }
    
    // Fechar modais
    function fecharModal() {
        document.getElementById('cliente-modal').style.display = 'none';
    }
    
    function fecharConfirmModal() {
        document.getElementById('cliente-confirm-modal').style.display = 'none';
        idParaExcluir = null;
    }
    
    // Configurar eventos
    function configurarEventos() {
        // Fechar modal ao clicar fora
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    if (this.id === 'cliente-modal') fecharModal();
                    if (this.id === 'cliente-confirm-modal') fecharConfirmModal();
                }
            });
        });
    }
    
    // Configurar máscaras de entrada
    function configurarMascaras() {
        document.querySelectorAll('[data-mask]').forEach(input => {
            input.addEventListener('input', function(e) {
                const mask = this.getAttribute('data-mask');
                let value = this.value.replace(/\D/g, '');
                let maskedValue = '';
                let maskIndex = 0;
                
                for (let i = 0; i < mask.length && value.length > 0; i++) {
                    if (mask[i] === '9') {
                        maskedValue += value[0];
                        value = value.substring(1);
                    } else {
                        maskedValue += mask[i];
                    }
                }
                
                this.value = maskedValue;
            });
        });
    }
    
    // Funções auxiliares de formatação
    function formatarDocumento(documento) {
        if (!documento) return '';
        
        documento = documento.replace(/\D/g, '');
        if (documento.length === 11) {
            return formatarCPF(documento);
        } else if (documento.length === 14) {
            return formatarCNPJ(documento);
        }
        return documento;
    }
    
    function formatarCPF(cpf) {
        cpf = cpf.replace(/\D/g, '');
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    
    function formatarCNPJ(cnpj) {
        cnpj = cnpj.replace(/\D/g, '');
        return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    
    function formatarTelefone(telefone) {
        if (!telefone) return '';
        telefone = telefone.replace(/\D/g, '');
        if (telefone.length === 11) {
            return telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (telefone.length === 10) {
            return telefone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        return telefone;
    }
    
    // Retornar API pública do módulo
    return {
        init,
        carregarDados,
        filtrar,
        toggleFiltros,
        abrirModalNovo,
        editar,
        alterarTipo,
        salvar,
        excluir,
        confirmarExclusao,
        verOrcamentos,
        fecharModal,
        fecharConfirmModal
    };
})();

// Expor módulo globalmente
window.clientes = clientes;
