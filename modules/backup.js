// modules/backup.js

// Funções para backup e restauração
async function exportarBackup() {
    try {
        const stores = [
            'clientes', 'estoque', 'categorias', 'unidades', 
            'cores', 'empresa', 'modelos', 'orcamentos', 
            'vidros_catalogo', 'financeiro'
        ];
        const backupData = {};
        
        // Coletar dados de todas as tabelas
        for (const store of stores) {
            backupData[store] = await LocalDB.getAll(store);
        }
        
        // Adicionar metadados
        backupData.metadata = {
            exportDate: new Date().toISOString(),
            appVersion: '1.0',
            totalRecords: Object.values(backupData).reduce((acc, curr) => 
                acc + (Array.isArray(curr) ? curr.length : 0), 0)
        };
        
        // Criar arquivo JSON
        const jsonStr = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Criar link para download
        const a = document.createElement('a');
        a.href = url;
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        a.download = `backup_oficina_${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('Backup exportado com sucesso!', 'success');
        document.getElementById('backup-info').innerHTML = `
            <div style="color: var(--success-color);">
                <i class="fas fa-check-circle"></i> Backup exportado com sucesso!
                <br><small>Arquivo: backup_oficina_${dateStr}.json</small>
                <br><small>Total de registros: ${backupData.metadata.totalRecords}</small>
            </div>`;
        document.getElementById('backup-info').style.display = 'block';
        
    } catch (error) {
        console.error('Erro ao exportar backup:', error);
        showNotification('Erro ao exportar backup.', 'error');
    }
}

async function importarBackup(file) {
    if (!file) return;
    
    if (!confirm("ATENÇÃO: A restauração substituirá TODOS os dados atuais. Deseja continuar?")) {
        return;
    }
    
    try {
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            try {
                const backupData = JSON.parse(e.target.result);
                
                // Validar estrutura do backup
                if (!backupData.metadata || !backupData.clientes) {
                    throw new Error('Arquivo de backup inválido.');
                }
                
                // Limpar todas as tabelas existentes
                const stores = [
                    'clientes', 'estoque', 'categorias', 'unidades', 
                    'cores', 'empresa', 'modelos', 'orcamentos', 
                    'vidros_catalogo', 'financeiro'
                ];
                
                for (const store of stores) {
                    if (backupData[store]) {
                        // Limpar tabela existente
                        try {
                            await LocalDB.clearAll(store);
                        } catch (e) {
                            console.log(`Tabela ${store} vazia ou não existe`);
                        }
                        
                        // Restaurar dados
                        for (const item of backupData[store]) {
                            await LocalDB.save(store, item);
                        }
                    }
                }
                
                showNotification(
                    `Backup restaurado com sucesso! ${backupData.metadata.totalRecords || 0} registros importados.`, 
                    'success'
                );
                
                document.getElementById('backup-info').innerHTML = `
                    <div style="color: var(--success-color);">
                        <i class="fas fa-check-circle"></i> Backup restaurado com sucesso!
                        <br><small>Data do backup: ${new Date(backupData.metadata.exportDate).toLocaleString()}</small>
                        <br><small>Registros importados: ${backupData.metadata.totalRecords || 0}</small>
                    </div>`;
                document.getElementById('backup-info').style.display = 'block';
                
                // Recarregar a página atual para refletir os dados restaurados
                const currentPage = document.querySelector('#main-menu li.active').getAttribute('data-page');
                loadPage(currentPage);
                
            } catch (error) {
                console.error('Erro ao processar backup:', error);
                showNotification('Erro ao importar backup. Arquivo inválido.', 'error');
            }
        };
        
        reader.readAsText(file);
        
    } catch (error) {
        console.error('Erro ao ler arquivo:', error);
        showNotification('Erro ao ler arquivo.', 'error');
    }
}

// Salvar backup na "nuvem" (armazenamento local do navegador)
async function salvarNaNuvem() {
    try {
        const stores = [
            'clientes', 'estoque', 'categorias', 'unidades', 
            'cores', 'empresa', 'modelos', 'orcamentos', 
            'vidros_catalogo', 'financeiro'
        ];
        const backupData = {};
        
        // Coletar dados de todas as tabelas
        for (const store of stores) {
            backupData[store] = await LocalDB.getAll(store);
        }
        
        // Adicionar metadados
        backupData.metadata = {
            exportDate: new Date().toISOString(),
            appVersion: '1.0',
            totalRecords: Object.values(backupData).reduce((acc, curr) => 
                acc + (Array.isArray(curr) ? curr.length : 0), 0)
        };
        
        // Salvar no localStorage
        localStorage.setItem('oficina_cloud_backup', JSON.stringify(backupData));
        
        showNotification('Backup salvo na nuvem com sucesso!', 'success');
        document.getElementById('backup-info').innerHTML = `
            <div style="color: var(--success-color);">
                <i class="fas fa-cloud"></i> Backup salvo na nuvem!
                <br><small>Total de registros: ${backupData.metadata.totalRecords}</small>
                <br><small>Disponível para restauração em qualquer dispositivo com esta conta.</small>
            </div>`;
        document.getElementById('backup-info').style.display = 'block';
        
    } catch (error) {
        console.error('Erro ao salvar na nuvem:', error);
        showNotification('Erro ao salvar na nuvem.', 'error');
    }
}

async function restaurarDaNuvem() {
    try {
        const backupStr = localStorage.getItem('oficina_cloud_backup');
        
        if (!backupStr) {
            showNotification('Nenhum backup encontrado na nuvem.', 'warning');
            return;
        }
        
        if (!confirm("ATENÇÃO: A restauração substituirá TODOS os dados atuais. Deseja restaurar o backup da nuvem?")) {
            return;
        }
        
        const backupData = JSON.parse(backupStr);
        
        // Validar estrutura do backup
        if (!backupData.metadata || !backupData.clientes) {
            throw new Error('Backup da nuvem inválido.');
        }
        
        // Limpar todas as tabelas existentes
        const stores = [
            'clientes', 'estoque', 'categorias', 'unidades', 
            'cores', 'empresa', 'modelos', 'orcamentos', 
            'vidros_catalogo', 'financeiro'
        ];
        
        for (const store of stores) {
            if (backupData[store]) {
                // Limpar tabela existente
                try {
                    await LocalDB.clearAll(store);
                } catch (e) {
                    console.log(`Tabela ${store} vazia ou não existe`);
                }
                
                // Restaurar dados
                for (const item of backupData[store]) {
                    await LocalDB.save(store, item);
                }
            }
        }
        
        showNotification(
            `Backup da nuvem restaurado com sucesso! ${backupData.metadata.totalRecords || 0} registros importados.`, 
            'success'
        );
        
        document.getElementById('backup-info').innerHTML = `
            <div style="color: var(--success-color);">
                <i class="fas fa-cloud-download-alt"></i> Backup da nuvem restaurado!
                <br><small>Data do backup: ${new Date(backupData.metadata.exportDate).toLocaleString()}</small>
                <br><small>Registros importados: ${backupData.metadata.totalRecords || 0}</small>
            </div>`;
        document.getElementById('backup-info').style.display = 'block';
        
        // Recarregar a página atual para refletir os dados restaurados
        const currentPage = document.querySelector('#main-menu li.active').getAttribute('data-page');
        loadPage(currentPage);
        
    } catch (error) {
        console.error('Erro ao restaurar da nuvem:', error);
        showNotification('Erro ao restaurar da nuvem.', 'error');
    }
}

// Exportar funções para uso global
window.exportarBackup = exportarBackup;
window.importarBackup = importarBackup;
window.salvarNaNuvem = salvarNaNuvem;
window.restaurarDaNuvem = restaurarDaNuvem;