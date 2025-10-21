// =============================================================================
// CONFIGURAÇÃO DO BANCO DE DADOS - SUAS CHAVES REAIS
// =============================================================================

const SUPABASE_URL = 'https://azpsgdaxkvotkostbusn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cHNnZGF4a3ZvdGtvc3RidXNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MjM5NTAsImV4cCI6MjA3NTE5OTk1MH0.wNYlTDj3PGh4q_0Mnv1lTNNYrS_ssoQR2Ovn7WrjyDA';

// Inicializar o cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// =============================================================================
// FUNÇÕES GLOBAIS PARA ESTOQUE (ATUALIZADAS PARA O NOVO MODELO DE DADOS)
// =============================================================================

// Carregar Categorias
async function carregarCategoriasEstoque() {
    try {
        const { data, error } = await supabase.from('categorias').select('*').order('nome');
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        return [];
    }
}

// Carregar Cores
async function carregarCores() {
    try {
        const { data, error } = await supabase.from('cores').select('*').order('nome');
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Erro ao carregar cores:', error);
        return [];
    }
}

// Carregar Linhas
async function carregarLinhas() {
    try {
        const { data, error } = await supabase.from('linhas').select('*').order('nome');
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Erro ao carregar linhas:', error);
        return [];
    }
}

// Carregar TODAS as variações (para orçamentos)
async function carregarItensEstoque(filtro = '') {
    try {
        let query = supabase
            .from('item_variacoes')
            .select(`
                id,
                quantidade_estoque,
                preco_venda,
                item_id,
                sku,
                cores ( id, nome ),
                itens (
                    id,
                    nome,
                    unidade_medida,
                    ativo,
                    linhas ( id, nome ),
                    categorias ( id, nome )
                )
            `)
            .eq('itens.ativo', true)
            .order('id');

        if (filtro) {
            query = query.or(`itens.nome.ilike.%${filtro}%,cores.nome.ilike.%${filtro}%,sku.ilike.%${filtro}%`);
        }

        const { data, error } = await query;
        if (error) throw error;

        if (!data) return [];

        const dadosFormatados = data.map(variacao => {
            const itemPai = variacao.itens || {};
            const categoria = itemPai.categorias || {};
            const linha = itemPai.linhas || {};
            const cor = variacao.cores || {};

            return {
                id: variacao.id,
                nome: `${itemPai.nome || 'Item s/ nome'} - ${cor.nome || 'S/ cor'}`,
                nome_base: itemPai.nome || 'Item s/ nome',
                item_pai_id: variacao.item_id,
                cor: cor.nome || 'S/ cor',
                cor_id: cor.id,
                sku: variacao.sku,
                quantidade_estoque: variacao.quantidade_estoque,
                preco_venda: variacao.preco_venda,
                unidade_medida: itemPai.unidade_medida,
                linha: linha.nome,
                linha_id: linha.id,
                categoria_id: categoria.id,
                categorias: { nome: categoria.nome || 'S/ categoria' }
            };
        });

        console.log('✅ Itens e variações carregados:', dadosFormatados);
        return dadosFormatados;
    } catch (error) {
        console.error('❌ Erro ao carregar variações de itens:', error);
        return [];
    }
}

// Carregar apenas ITENS PAI (modelos sem cor) - PARA PRODUTOS
async function carregarItensPai(filtro = '') {
     try {
        let query = supabase
            .from('itens')
            .select(`*, categorias(nome), linhas(nome)`)
            .eq('ativo', true)
            .order('nome');

        if(filtro){
            query = query.ilike('nome', `%${filtro}%`);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Erro ao carregar itens pai:', error);
        return [];
    }
}

// Carregar variações de um item pai específico
async function carregarVariacoesDeItem(itemPaiId) {
    try {
        const { data, error } = await supabase
            .from('item_variacoes')
            .select(`*, cores(nome)`)
            .eq('item_id', itemPaiId)
            .order('id');
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error(`Erro ao carregar variações para o item ID ${itemPaiId}:`, error);
        return [];
    }
}

// Salvar Item Pai (Modelo) - CORRIGIDO
async function salvarItemPai(item) {
    try {
        let response;
        const dadosItem = { 
            nome: item.nome,
            categoria_id: item.categoria_id,
            unidade_medida: item.unidade_medida,
            linha_id: item.linha_id || null,
            ativo: true
        };

        // Remove o ID se for null ou undefined (para criação)
        if (item.id) {
            // Modo edição - atualiza o item existente
            response = await supabase
                .from('itens')
                .update(dadosItem)
                .eq('id', item.id)
                .select();
        } else {
            // Modo criação - insere novo item (SEM passar ID)
            response = await supabase
                .from('itens')
                .insert([dadosItem])
                .select();
        }

        if (response.error) throw response.error;
        
        if (!response.data || response.data.length === 0) {
            throw new Error('Nenhum dado retornado após salvar');
        }
        
        return response.data[0];
    } catch (error) {
        console.error('❌ Erro ao salvar item pai:', error);
        throw error;
    }
}

// Salvar Variação - CORRIGIDO
async function salvarVariacao(variacao) {
    try {
        let response;
        const dadosVariacao = {
            item_id: variacao.item_id,
            cor_id: variacao.cor_id,
            preco_venda: variacao.preco_venda,
            quantidade_estoque: variacao.quantidade_estoque,
            sku: variacao.sku || null
        };

        if (variacao.id) {
            // Modo edição
            response = await supabase
                .from('item_variacoes')
                .update(dadosVariacao)
                .eq('id', variacao.id)
                .select();
        } else {
            // Modo criação (SEM passar ID)
            response = await supabase
                .from('item_variacoes')
                .insert([dadosVariacao])
                .select();
        }

        if (response.error) throw response.error;
        
        if (!response.data || response.data.length === 0) {
            throw new Error('Nenhum dado retornado após salvar variação');
        }
        
        return response.data[0];
    } catch (error) {
        console.error('❌ Erro ao salvar variação:', error);
        throw error;
    }
}

// Excluir Item Pai (agora apenas desativa)
async function excluirItemPai(id) {
    try {
        const { error } = await supabase.from('itens').update({ ativo: false }).eq('id', id);
        if (error) throw error;
    } catch (error) {
        console.error('Erro ao desativar item pai:', error);
        throw error;
    }
}

// Excluir Variação
async function excluirVariacao(id) {
    try {
        const { error } = await supabase.from('item_variacoes').delete().eq('id', id);
        if (error) throw error;
    } catch (error) {
        console.error('Erro ao excluir variação:', error);
        throw error;
    }
}


// =============================================================================
// EXPORTAR FUNÇÕES PARA USO GLOBAL
// =============================================================================

window.estoqueFunctions = {
    carregarCategorias: carregarCategoriasEstoque,
    carregarCores: carregarCores,
    carregarLinhas: carregarLinhas,
    carregarItens: carregarItensEstoque, // Para orçamentos (com variações)
    carregarItensPai: carregarItensPai,  // Para produtos (apenas modelos)
    carregarVariacoesDeItem: carregarVariacoesDeItem,
    salvarItemPai: salvarItemPai,
    salvarVariacao: salvarVariacao,
    excluirItemPai: excluirItemPai,
    excluirVariacao: excluirVariacao,
};