// modules/financeiro.js

// Funções para gerenciamento financeiro
async function handleSalvarLancamento(e) {
    e.preventDefault();
    
    const lancamento = {
        data: new Date().toISOString(),
        descricao: document.getElementById('fin-desc').value,
        tipo: document.getElementById('fin-tipo').value,
        valor: Number(document.getElementById('fin-valor').value)
    };
    
    await LocalDB.save('financeiro', lancamento);
    showNotification("Lançamento realizado com sucesso!", "success");
    loadPage('financeiro');
}

async function removerLancamento(id) {
    if(confirm("Excluir este lançamento permanentemente? Isso alterará o saldo.")) {
        await LocalDB.delete('financeiro', id);
        showNotification("Lançamento removido!", "success");
        loadPage('financeiro');
    }
}

// Função para imprimir PDF profissional
async function imprimirPDFProfissional(orc) {
    const empresaData = await LocalDB.getAll('empresa');
    const emp = empresaData[0] || { 
        nome_fantasia: 'Oficina da Família', 
        razao_social: 'Oficina da Família LTDA',
        telefone: '-',
        endereco: '',
        cidade: '',
        estado: '',
        cnpj: '',
        email: ''
    };
    
    const margemMult = 1 + ((orc.margem || 0) / 100);
    
    // Obter observação padrão da empresa
    const obsPadrao = emp.obs_padrao || `* Prazo de validade: ${emp.prazo_validade || 10} dias.<br>* Pagamento a combinar.<br>* Serviço com garantia.`;
    
    const content = `
        <div style="padding:50px; color:#333; font-family: sans-serif; line-height: 1.5;">
            <table style="width:100%; border-bottom: 4px solid var(--primary-color); padding-bottom: 20px; margin-bottom: 30px;">
                <tr>
                    <td style="width:70%;">
                        <h1 style="margin:0; color:var(--primary-color); text-transform:uppercase;">
                            ${emp.nome_fantasia || emp.nome || 'Oficina da Família'}
                        </h1>
                        <p style="margin:5px 0; font-weight:bold;">Serralheria e Vidraçaria</p>
                        <p style="margin:0; color:#666;">${emp.razao_social || ''} ${emp.cnpj ? '<br>CNPJ: ' + emp.cnpj : ''}</p>
                        <p style="margin:0; color:#666;">${emp.endereco || ''} ${emp.cidade ? ' - ' + emp.cidade + '/' + emp.estado : ''} ${emp.cep ? ' - CEP: ' + emp.cep : ''}</p>
                        <p style="margin:0; color:#666;">Telefone: ${emp.telefone || '-'} ${emp.email ? ' | E-mail: ' + emp.email : ''}</p>
                    </td>
                    <td style="width:30%; text-align:right;">
                        <h2 style="margin:0; color:#444;">ORÇAMENTO</h2>
                        <p style="margin:0; font-weight:bold;">DATA: ${new Date(orc.data).toLocaleDateString()}</p>
                    </td>
                </tr>
            </table>

            <div style="background:#f5f7fa; padding:20px; border-radius:10px; border:1px solid #ddd; margin-bottom: 30px;">
                <span style="color:#666; font-size:12px; font-weight:bold; text-transform:uppercase;">Cliente</span>
                <div style="font-size:18px; font-weight:bold; margin-top:5px;">${orc.cliente}</div>
            </div>

            <table style="width:100%; border-collapse:collapse; margin-bottom:40px;">
                <thead style="background:var(--primary-color); color:white;">
                    <tr>
                        <th style="padding:15px; text-align:left;">PROJETO</th>
                        <th style="padding:15px; text-align:left;">ESPECIFICAÇÕES</th>
                        <th style="padding:15px; text-align:center;">QTD</th>
                        <th style="padding:15px; text-align:right;">CUSTO</th>
                        <th style="padding:15px; text-align:right;">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    ${orc.itens.map(i => {
                        // Aplicar margem no PDF
                        let vUnit = (i.custo_unitario || 0) * margemMult;
                        return `
                        <tr style="border-bottom:1px solid #eee;">
                            <td style="padding:15px; vertical-align:top;"><strong>${i.nome}</strong></td>
                            <td style="padding:15px; font-size:13px; color:#555;">
                                ${i.medida}<br>Cor: ${i.cor} | Vidro: ${i.vidro || 'N/A'}
                            </td>
                            <td style="padding:15px; text-align:center;">${i.qtd}</td>
                            <td style="padding:15px; text-align:right; color:#666;">
                                R$ ${(i.custo_unitario || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td style="padding:15px; text-align:right; font-weight:bold;">
                                R$ ${(vUnit * i.qtd).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                        </tr>`;
                    }).join('')}
                </tbody>
                <tfoot style="background:#f1f1f1;">
                    <tr>
                        <td colspan="3" style="padding:20px; text-align:right; font-size:18px;">
                            <strong>VALOR TOTAL:</strong>
                        </td>
                        <td style="padding:20px; text-align:right; font-size:18px; color:#666;">
                            <strong>R$ ${(orc.total_custo || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                        </td>
                        <td style="padding:20px; text-align:right; font-size:22px; color:var(--primary-color);">
                            <strong>R$ ${(orc.total_venda || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                        </td>
                    </tr>
                </tfoot>
            </table>

            <div style="margin-top:50px; font-size:12px; color:#777; border-top: 1px dashed #ccc; padding-top:20px;">
                <p>${obsPadrao.replace(/\n/g, '<br>')}</p>
                
                <div style="display:flex; justify-content:space-between; margin-top:80px;">
                    <div style="width:45%; text-align:center; border-top:1px solid #333; padding-top:10px;">
                        ${emp.nome_fantasia || emp.nome || 'Oficina da Família'}<br>
                        CNPJ: ${emp.cnpj || 'Não informado'}
                    </div>
                    <div style="width:45%; text-align:center; border-top:1px solid #333; padding-top:10px;">
                        Assinatura do Cliente
                    </div>
                </div>
            </div>
        </div>`;
    
    document.getElementById('printable-area').innerHTML = content;
    window.print();
}

// Exportar funções para uso global
window.handleSalvarLancamento = handleSalvarLancamento;
window.removerLancamento = removerLancamento;
window.imprimirPDFProfissional = imprimirPDFProfissional;