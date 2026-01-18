// ===== SISTEMA DE GERENCIAMENTO DE ÓTICAS - SUPABASE =====

// Utilitários
const Utils = {
    formatDate: (date) => {
        if (!date) return '-';
        const d = new Date(date + 'T00:00:00');
        return d.toLocaleDateString('pt-BR');
    },
    formatCurrency: (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    },
    getServiceName: (type) => {
        const types = { exame_vista: 'Exame de Vista', consulta_oculos: 'Consulta de Óculos', ajuste_receita: 'Ajuste de Receita', retorno: 'Retorno' };
        return types[type] || type;
    },
    getPayerName: (type) => {
        const types = { pago_otica: 'Ótica', pago_cliente: 'Cliente', pendente: 'Pendente' };
        return types[type] || type;
    }
};

// Toast Notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    toast.className = 'toast active ' + type;
    toastMessage.textContent = message;
    setTimeout(() => toast.classList.remove('active'), 3000);
}

// Loading State
function showLoading(show = true) {
    document.body.style.cursor = show ? 'wait' : 'default';
}

// Modal Functions
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

// Navegação
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        item.classList.add('active');
        document.getElementById('page-' + item.dataset.page).classList.add('active');
        document.getElementById('pageTitle').textContent = item.querySelector('span:last-child').textContent;
        document.getElementById('sidebar').classList.remove('active');
    });
});

document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('active');
});

document.querySelectorAll('[data-modal]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.modal));
});

document.getElementById('dateDisplay').textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

// ===== ÓTICAS =====
async function loadOticas() {
    showLoading();
    const { data, error } = await supabaseClient.from('oticas').select('*').order('nome');
    showLoading(false);
    if (error) { showToast('Erro ao carregar óticas: ' + error.message, 'error'); return []; }
    return data || [];
}

async function renderOticas() {
    const oticas = await loadOticas();
    const container = document.getElementById('oticasList');
    const search = document.getElementById('searchOtica').value.toLowerCase();
    const filtered = oticas.filter(o => o.nome.toLowerCase().includes(search));

    if (filtered.length === 0) {
        container.innerHTML = '<p class="empty-state">Nenhuma ótica encontrada.</p>';
        return;
    }

    container.innerHTML = filtered.map(o => `
        <div class="otica-card">
            <h4>🏪 ${o.nome}</h4>
            <p>📞 ${o.telefone || 'Não informado'}</p>
            <p>📍 ${o.endereco || 'Não informado'}</p>
            <p>👤 ${o.responsavel || 'Não informado'}</p>
            <div class="card-actions">
                <button class="btn-secondary btn-sm" onclick="editOtica('${o.id}')">✏️ Editar</button>
                <button class="btn-secondary btn-sm" onclick="viewOticaClientes('${o.id}')">👥 Clientes</button>
                <button class="btn-secondary btn-sm btn-danger" onclick="deleteOtica('${o.id}')">🗑️</button>
            </div>
        </div>
    `).join('');

    updateFilters();
}

document.getElementById('btnNovaOtica').addEventListener('click', () => {
    document.getElementById('formOtica').reset();
    document.getElementById('oticaId').value = '';
    document.getElementById('modalOticaTitle').textContent = 'Nova Ótica';
    openModal('modalOtica');
});

document.getElementById('formOtica').addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoading();

    const id = document.getElementById('oticaId').value;
    const data = {
        nome: document.getElementById('oticaNome').value,
        telefone: document.getElementById('oticaTelefone').value,
        email: document.getElementById('oticaEmail').value,
        endereco: document.getElementById('oticaEndereco').value,
        responsavel: document.getElementById('oticaResponsavel').value,
        observacoes: document.getElementById('oticaObservacoes').value
    };

    let error;
    if (id) {
        ({ error } = await supabaseClient.from('oticas').update(data).eq('id', id));
    } else {
        ({ error } = await supabaseClient.from('oticas').insert(data));
    }

    showLoading(false);
    if (error) { showToast('Erro: ' + error.message, 'error'); return; }

    showToast(id ? 'Ótica atualizada!' : 'Ótica cadastrada!');
    closeModal('modalOtica');
    renderOticas();
    updateDashboard();
});

window.editOtica = async function (id) {
    const { data: otica } = await supabaseClient.from('oticas').select('*').eq('id', id).single();
    if (!otica) return;

    document.getElementById('oticaId').value = otica.id;
    document.getElementById('oticaNome').value = otica.nome;
    document.getElementById('oticaTelefone').value = otica.telefone || '';
    document.getElementById('oticaEmail').value = otica.email || '';
    document.getElementById('oticaEndereco').value = otica.endereco || '';
    document.getElementById('oticaResponsavel').value = otica.responsavel || '';
    document.getElementById('oticaObservacoes').value = otica.observacoes || '';
    document.getElementById('modalOticaTitle').textContent = 'Editar Ótica';
    openModal('modalOtica');
};

window.deleteOtica = async function (id) {
    if (!confirm('Deseja realmente excluir esta ótica e todos os dados relacionados?')) return;
    showLoading();
    const { error } = await supabaseClient.from('oticas').delete().eq('id', id);
    showLoading(false);
    if (error) { showToast('Erro: ' + error.message, 'error'); return; }
    showToast('Ótica excluída!', 'error');
    renderOticas();
    updateDashboard();
};

window.viewOticaClientes = async function (id) {
    showLoading();

    // Navega para a aba Clientes
    document.querySelector('[data-page="clientes"]').click();

    // Aguarda um pouco para garantir que a aba foi carregada
    await new Promise(resolve => setTimeout(resolve, 100));

    // Garante que o select esteja populado com todas as óticas
    await updateFilters();

    // Define o valor do filtro para a ótica específica
    const select = document.getElementById('filterOticaCliente');
    select.value = id;

    // Força a renderização com o novo filtro
    await renderClientes();
    showLoading(false);
};

document.getElementById('searchOtica').addEventListener('input', renderOticas);

// ===== CLIENTES =====
async function loadClientes(oticaId = null) {
    let clientes = [];

    // 1. Clientes cadastrados na ótica (ou todos se oticaId for null)
    let query = supabaseClient.from('clientes').select('*, oticas(nome)').order('nome');

    if (oticaId === 'particular') {
        query = query.is('otica_id', null);
    } else if (oticaId) {
        query = query.eq('otica_id', oticaId);
    }

    const { data: clientesCadastrados, error } = await query;
    if (error) { showToast('Erro: ' + error.message, 'error'); return []; }
    clientes = clientesCadastrados || [];

    // 2. Se tiver filtro de ótica (e não for particular), buscar clientes de outras lojas que têm receita nesta ótica
    if (oticaId && oticaId !== 'particular') {
        // Busca receitas desta ótica onde o cliente NÃO é desta ótica
        const { data: receitasOutros } = await supabaseClient
            .from('receitas')
            .select('cliente_id, clientes(*, oticas(nome))')
            .eq('otica_id', oticaId);

        if (receitasOutros && receitasOutros.length > 0) {
            // Extrai os clientes das receitas
            const outrosClientes = receitasOutros
                .map(r => r.clientes)
                .filter(c => c && c.otica_id !== oticaId); // Filtra para não duplicar se já veio na 1ª query

            // Adiciona à lista principal evitando duplicatas (por ID)
            const idsAtuais = new Set(clientes.map(c => c.id));
            outrosClientes.forEach(c => {
                if (!idsAtuais.has(c.id)) {
                    // Marcamos visualmente que é um cliente "Visitante" (opcional)
                    // c.nome += ' (Visitante)'; 
                    clientes.push(c);
                    idsAtuais.add(c.id);
                }
            });
        }
    }

    // Reordena por nome
    return clientes.sort((a, b) => a.nome.localeCompare(b.nome));
}

async function renderClientes() {
    showLoading();
    const filterOtica = document.getElementById('filterOticaCliente').value;
    const search = document.getElementById('searchCliente').value.toLowerCase();

    let clientes = await loadClientes(filterOtica || null);
    if (search) clientes = clientes.filter(c => c.nome.toLowerCase().includes(search));

    // Get last receita for each client
    const { data: receitas } = await supabaseClient.from('receitas').select('cliente_id, data').order('data', { ascending: false });

    const container = document.getElementById('clientesList');
    showLoading(false);

    if (clientes.length === 0) {
        container.innerHTML = '<tr><td colspan="5" class="empty-state">Nenhum cliente encontrado.</td></tr>';
        return;
    }

    container.innerHTML = clientes.map(c => {
        const ultimaReceita = receitas?.find(r => r.cliente_id === c.id);
        const oticaNome = c.oticas?.nome || (c.otica_id ? '-' : '👤 Particular');
        return `
            <tr>
                <td><strong>${c.nome}</strong></td>
                <td>${c.telefone || '-'}</td>
                <td>${oticaNome}</td>
                <td>${ultimaReceita ? Utils.formatDate(ultimaReceita.data) : '-'}</td>
                <td class="actions">
                    <button class="btn-secondary btn-sm" onclick="editCliente('${c.id}')">✏️</button>
                    <button class="btn-secondary btn-sm" onclick="viewHistoricoCliente('${c.id}')">📋</button>
                    <button class="btn-secondary btn-sm btn-danger" onclick="deleteCliente('${c.id}')">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');
}

document.getElementById('btnNovoCliente').addEventListener('click', async () => {
    document.getElementById('formCliente').reset();
    document.getElementById('clienteId').value = '';
    document.getElementById('modalClienteTitle').textContent = 'Novo Cliente';
    await populateOticaSelect('clienteOtica', '👤 Paciente Particular (Sem vínculo)');
    openModal('modalCliente');
});

document.getElementById('formCliente').addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoading();

    const id = document.getElementById('clienteId').value;
    const oticaValue = document.getElementById('clienteOtica').value;
    const data = {
        nome: document.getElementById('clienteNome').value,
        otica_id: oticaValue || null, // null se for paciente particular
        cpf: document.getElementById('clienteCPF').value,
        data_nasc: document.getElementById('clienteDataNasc').value || null,
        telefone: document.getElementById('clienteTelefone').value,
        email: document.getElementById('clienteEmail').value,
        whatsapp: document.getElementById('clienteWhatsapp').value,
        endereco: document.getElementById('clienteEndereco').value,
        observacoes: document.getElementById('clienteObservacoes').value
    };

    let error;
    if (id) {
        ({ error } = await supabaseClient.from('clientes').update(data).eq('id', id));
    } else {
        ({ error } = await supabaseClient.from('clientes').insert(data));
    }

    showLoading(false);
    if (error) { showToast('Erro: ' + error.message, 'error'); return; }

    showToast(id ? 'Cliente atualizado!' : 'Cliente cadastrado!');
    closeModal('modalCliente');
    renderClientes();
    updateDashboard();
});

window.editCliente = async function (id) {
    await populateOticaSelect('clienteOtica', '👤 Paciente Particular (Sem vínculo)');
    const { data: cliente } = await supabaseClient.from('clientes').select('*').eq('id', id).single();
    if (!cliente) return;

    document.getElementById('clienteId').value = cliente.id;
    document.getElementById('clienteNome').value = cliente.nome;
    document.getElementById('clienteOtica').value = cliente.otica_id;
    document.getElementById('clienteCPF').value = cliente.cpf || '';
    document.getElementById('clienteDataNasc').value = cliente.data_nasc || '';
    document.getElementById('clienteTelefone').value = cliente.telefone || '';
    document.getElementById('clienteEmail').value = cliente.email || '';
    document.getElementById('clienteWhatsapp').value = cliente.whatsapp || '';
    document.getElementById('clienteEndereco').value = cliente.endereco || '';
    document.getElementById('clienteObservacoes').value = cliente.observacoes || '';
    document.getElementById('modalClienteTitle').textContent = 'Editar Cliente';
    openModal('modalCliente');
};

window.deleteCliente = async function (id) {
    if (!confirm('Deseja realmente excluir este cliente?')) return;
    showLoading();
    const { error } = await supabaseClient.from('clientes').delete().eq('id', id);
    showLoading(false);
    if (error) { showToast('Erro: ' + error.message, 'error'); return; }
    showToast('Cliente excluído!', 'error');
    renderClientes();
    updateDashboard();
};

// Variável para armazenar cliente selecionado no histórico
let clienteHistoricoAtual = null;
let isDirectReceitaInsertion = false; // Flag para controlar inserção direta

// Função para ver histórico (Substitui viewClienteReceitas antiga)
window.viewHistoricoCliente = async function (id) {
    showLoading();
    clienteHistoricoAtual = id; // Salva ID para uso no botão "Nova Receita"

    // Configura o botão de Nova Receita Direta
    const btnNova = document.getElementById('btnNovaReceitaDireta');
    if (btnNova) {
        btnNova.onclick = () => {
            closeModal('modalHistoricoCliente');
            abrirNovaReceitaDireta(id);
        };
    }

    // Buscar receitas do cliente com nome da ótica
    const { data: receitas, error } = await supabaseClient
        .from('receitas')
        .select('*, oticas(nome)') // <--- Adicionado join com oticas
        .eq('cliente_id', id)
        .order('data', { ascending: false });

    showLoading(false);

    if (error) {
        showToast('Erro ao carregar histórico: ' + error.message, 'error');
        return;
    }

    const content = document.getElementById('historicoClienteContent');
    const empty = document.getElementById('historicoEmptyState');

    if (!receitas || receitas.length === 0) {
        content.innerHTML = '';
        empty.style.display = 'block';
    } else {
        empty.style.display = 'none';
        content.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                ${receitas.map(r => `
                    <button onclick="closeModal('modalHistoricoCliente'); viewReceita('${r.id}')"
                            style="
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                width: 100%;
                                background: var(--bg-dark);
                                border: 1px solid var(--border);
                                padding: 1rem;
                                border-radius: 0.5rem;
                                color: var(--text);
                                cursor: pointer;
                                transition: all 0.2s;
                            "
                            onmouseover="this.style.borderColor='var(--primary)'; this.style.background='var(--bg-card-hover)'"
                            onmouseout="this.style.borderColor='var(--border)'; this.style.background='var(--bg-dark)'"
                    >
                        <div style="text-align: left;">
                            <strong style="display: block; font-size: 1rem;">📅 ${Utils.formatDate(r.data)}</strong>
                            <span style="font-size: 0.85rem; color: var(--text-muted);">
                                ${Utils.getServiceName(r.tipo_servico)} • 🏪 ${r.oticas?.nome || 'Loja desconhecida'}
                            </span>
                        </div>
                        <span style="font-size: 1.25rem;">👉</span>
                    </button>
                `).join('')}
            </div>
        `;
    }

    openModal('modalHistoricoCliente');
};

// Nova Função: Abrir receita pré-selecionada
async function abrirNovaReceitaDireta(clienteId) {
    document.getElementById('formReceita').reset();
    document.getElementById('receitaId').value = '';
    document.getElementById('receitaData').value = new Date().toISOString().split('T')[0];
    document.getElementById('modalReceitaTitle').textContent = 'Nova Receita';

    // Busca dados do cliente para preencher o select (mesmo se não estiver na lista padrão)
    const { data: cliente } = await supabaseClient.from('clientes').select('*').eq('id', clienteId).single();

    if (cliente) {
        isDirectReceitaInsertion = true; // Ativa a flag para evitar limpeza do cliente
        // Popula ótica com TODAS as óticas
        await populateOticaSelect('receitaOtica');

        // Define a ótica do cliente como padrão inicial
        document.getElementById('receitaOtica').value = cliente.otica_id;

        // Popula o select de clientes FORÇANDO o cliente atual
        const selectCliente = document.getElementById('receitaCliente');
        selectCliente.innerHTML = `<option value="${cliente.id}" selected>${cliente.nome}</option>`;
    }

    openModal('modalReceita');
}

document.getElementById('filterOticaCliente').addEventListener('change', renderClientes);
document.getElementById('searchCliente').addEventListener('input', renderClientes);

// ===== LOGIN =====
async function checkLogin() {
    const isLogged = localStorage.getItem('oticas_logged_in');
    if (!isLogged) {
        document.getElementById('loginOverlay').style.display = 'flex';
        showLoading(false);
    } else {
        document.getElementById('loginOverlay').style.display = 'none';
        await loadSystem();
    }
}

async function doLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;
    const btn = document.getElementById('btnLogin');

    btn.disabled = true;
    btn.textContent = 'Verificando...';

    try {
        const { data, error } = await supabaseClient
            .from('usuarios_admin')
            .select('*')
            .eq('email', email)
            .eq('senha', pass)
            .single();

        if (error || !data) throw new Error('Dados inválidos');

        localStorage.setItem('oticas_logged_in', 'true');
        document.getElementById('loginOverlay').style.display = 'none';
        showToast('Bem-vindo(a), ' + email.split('@')[0]);
        await loadSystem();

    } catch (err) {
        showToast('Email ou senha incorretos!', 'error');
        btn.disabled = false;
        btn.textContent = 'Entrar no Sistema';
    }
}

document.getElementById('formLogin')?.addEventListener('submit', doLogin);
document.getElementById('btnLogout').addEventListener('click', () => {
    localStorage.removeItem('oticas_logged_in');
    window.location.reload();
});

// ===== RECEITAS =====
async function renderReceitas() {
    showLoading();
    const filterOtica = document.getElementById('filterOticaReceita').value;
    const filterCliente = document.getElementById('filterClienteReceita').value;
    const filterData = document.getElementById('filterDataReceita').value;

    let query = supabaseClient.from('receitas').select('*, clientes(nome), oticas(nome)').order('data', { ascending: false });

    if (filterOtica === 'particular') {
        query = query.is('otica_id', null);
    } else if (filterOtica) {
        query = query.eq('otica_id', filterOtica);
    }

    if (filterCliente) query = query.eq('cliente_id', filterCliente);
    if (filterData) query = query.eq('data', filterData);

    const { data: receitas, error } = await query;
    showLoading(false);

    if (error) { showToast('Erro: ' + error.message, 'error'); return; }

    const container = document.getElementById('receitasList');
    if (!receitas || receitas.length === 0) {
        container.innerHTML = '<p class="empty-state">Nenhuma receita encontrada.</p>';
        return;
    }

    container.innerHTML = receitas.map(r => `
        <div class="receita-card">
            <div class="receita-card-header">
                <h4>${r.clientes?.nome || 'Cliente'}</h4>
                <span>📅 ${Utils.formatDate(r.data)} - ${Utils.getServiceName(r.tipo_servico)}</span>
            </div>
            <div class="receita-card-body">
                ${getReceitaGridHTML(r)}
                <p style="color: var(--text-muted); font-size: 0.875rem; margin-top: 0.5rem;">🏪 ${r.oticas?.nome || '-'}</p>
            </div>
            <div class="receita-card-footer">
                <span class="status-badge ${r.pagador}">${Utils.getPayerName(r.pagador)}</span>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn-secondary btn-sm" onclick="viewReceita('${r.id}')">👁️</button>
                    <button class="btn-secondary btn-sm" onclick="editReceita('${r.id}')">✏️</button>
                    <button class="btn-secondary btn-sm btn-danger" onclick="deleteReceita('${r.id}')">🗑️</button>
                </div>
            </div>
        </div>
    `).join('');
}

document.getElementById('btnNovaReceita').addEventListener('click', async () => {
    isDirectReceitaInsertion = false;
    document.getElementById('formReceita').reset();
    document.getElementById('receitaId').value = '';
    document.getElementById('receitaData').value = new Date().toISOString().split('T')[0];
    document.getElementById('modalReceitaTitle').textContent = 'Nova Receita';

    // Adiciona opção de Particular no select de Ótica
    await populateOticaSelect('receitaOtica', 'Selecione ou Particular...');
    const select = document.getElementById('receitaOtica');
    const opt = document.createElement('option');
    opt.value = 'particular';
    opt.text = '👤 Atendimento Particular';
    select.insertBefore(opt, select.options[1]); // Insere logo após o placeholder

    document.getElementById('receitaCliente').innerHTML = '<option value="">Selecione a ótica primeiro...</option>';
    openModal('modalReceita');
});

// Event listener para mudança de ótica no modal de receita
function setupReceitaOticaListener() {
    const receitaOticaSelect = document.getElementById('receitaOtica');
    if (receitaOticaSelect) {
        console.log('✅ Event listener adicionado ao select de ótica');
        receitaOticaSelect.addEventListener('change', async (e) => {
            console.log('🔄 Ótica selecionada:', e.target.value);
            if (isDirectReceitaInsertion) {
                // Se for inserção direta, NÃO limpa o cliente, apenas permite mudar a loja de atendimento
                // Mas a flag deve ser resetada na próxima vez que abrir o modal normalmente
                return;
            }
            const oticaId = e.target.value;
            if (!oticaId) {
                document.getElementById('receitaCliente').innerHTML = '<option value="">Selecione a ótica primeiro...</option>';
                return;
            }
            showLoading();

            let query = supabaseClient.from('clientes').select('id, nome').order('nome');

            if (oticaId === 'particular') {
                query = query.is('otica_id', null);
            } else {
                query = query.eq('otica_id', oticaId);
            }

            const { data: clientes } = await query;
            const select = document.getElementById('receitaCliente');
            select.innerHTML = '<option value="">Selecione...</option>' + (clientes || []).map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
            console.log(`📋 ${clientes?.length || 0} clientes carregados`);
            showLoading(false);
        });
    } else {
        console.error('❌ Elemento receitaOtica não encontrado no DOM');
    }
}



document.getElementById('formReceita').addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoading();

    const id = document.getElementById('receitaId').value;
    const oticaValue = document.getElementById('receitaOtica').value;
    const data = {
        otica_id: oticaValue === 'particular' || !oticaValue ? null : oticaValue,
        cliente_id: document.getElementById('receitaCliente').value,
        data: document.getElementById('receitaData').value,
        tipo_servico: document.getElementById('receitaTipoServico').value,
        valor: parseFloat(document.getElementById('receitaValor').value) || 0,
        pagador: document.getElementById('receitaPagador').value,
        observacoes: document.getElementById('receitaObservacoes').value,
        od_esferico: document.getElementById('odEsferico').value,
        od_cilindrico: document.getElementById('odCilindrico').value,
        od_eixo: document.getElementById('odEixo').value,
        od_dnp: document.getElementById('odDNP').value,
        od_adicao: document.getElementById('receitaAdicao').value,
        oe_esferico: document.getElementById('oeEsferico').value,
        oe_cilindrico: document.getElementById('oeCilindrico').value,
        oe_eixo: document.getElementById('oeEixo').value,
        oe_dnp: document.getElementById('oeDNP').value,
        oe_adicao: document.getElementById('receitaAdicao').value
    };

    let error;
    if (id) {
        ({ error } = await supabaseClient.from('receitas').update(data).eq('id', id));
    } else {
        ({ error } = await supabaseClient.from('receitas').insert(data));
    }

    showLoading(false);
    if (error) { showToast('Erro: ' + error.message, 'error'); return; }

    showToast(id ? 'Receita atualizada!' : 'Receita cadastrada!');
    closeModal('modalReceita');
    renderReceitas();
    renderPagamentos();
    updateDashboard();
});

window.editReceita = async function (id) {
    // Adiciona opção de Particular
    await populateOticaSelect('receitaOtica', 'Selecione ou Particular...');
    const select = document.getElementById('receitaOtica');
    const opt = document.createElement('option');
    opt.value = 'particular';
    opt.text = '👤 Atendimento Particular';
    select.insertBefore(opt, select.options[1]);

    const { data: receita } = await supabaseClient.from('receitas').select('*, clientes(id, nome, otica_id)').eq('id', id).single();
    if (!receita) return;

    // Se otica_id for null, setar como 'particular'
    document.getElementById('receitaOtica').value = receita.otica_id || 'particular';

    let clientesList = [];

    // Lógica para carregar clientes
    if (!receita.otica_id) {
        // Se for particular, carrega clientes particulares
        const { data } = await supabaseClient.from('clientes').select('id, nome').is('otica_id', null).order('nome');
        clientesList = data || [];
    } else {
        // Se tiver ótica, carrega clientes da ótica + visitantes
        const { data: clientesCadastrados } = await supabaseClient
            .from('clientes')
            .select('id, nome, otica_id')
            .eq('otica_id', receita.otica_id)
            .order('nome');

        const { data: receitasOutros } = await supabaseClient
            .from('receitas')
            .select('cliente_id, clientes(id, nome, otica_id)')
            .eq('otica_id', receita.otica_id);

        clientesList = clientesCadastrados || [];
        const idsJaAdicionados = new Set(clientesList.map(c => c.id));

        if (receitasOutros) {
            receitasOutros.forEach(r => {
                if (r.clientes && !idsJaAdicionados.has(r.clientes.id)) {
                    clientesList.push(r.clientes);
                    idsJaAdicionados.add(r.clientes.id);
                }
            });
        }
    }

    // Ordenar por nome
    clientesList.sort((a, b) => a.nome.localeCompare(b.nome));

    // Renderizar select com indicação visual
    document.getElementById('receitaCliente').innerHTML = '<option value="">Selecione...</option>' +
        clientesList.map(c => {
            // Se receita tem ótica e cliente é de outra ótica, marca com loja
            // Se receita é particular, não precisa marcar
            const label = (receita.otica_id && c.otica_id && c.otica_id !== receita.otica_id) ? ` 🏪` : '';
            return `<option value="${c.id}">${c.nome}${label}</option>`;
        }).join('');

    document.getElementById('receitaId').value = receita.id;
    document.getElementById('receitaCliente').value = receita.cliente_id;
    document.getElementById('receitaData').value = receita.data;
    document.getElementById('receitaTipoServico').value = receita.tipo_servico;
    document.getElementById('receitaValor').value = receita.valor;
    document.getElementById('receitaPagador').value = receita.pagador;
    document.getElementById('receitaObservacoes').value = receita.observacoes || '';
    document.getElementById('odEsferico').value = receita.od_esferico || '';
    document.getElementById('odCilindrico').value = receita.od_cilindrico || '';
    document.getElementById('odEixo').value = receita.od_eixo || '';
    document.getElementById('odDNP').value = receita.od_dnp || '';

    document.getElementById('oeEsferico').value = receita.oe_esferico || '';
    document.getElementById('oeCilindrico').value = receita.oe_cilindrico || '';
    document.getElementById('oeEixo').value = receita.oe_eixo || '';
    document.getElementById('oeDNP').value = receita.oe_dnp || '';

    // Campo unificado de adição
    document.getElementById('receitaAdicao').value = receita.od_adicao || receita.oe_adicao || '';
    document.getElementById('modalReceitaTitle').textContent = 'Editar Receita';
    openModal('modalReceita');
};

// Helper para gerar o grid de receita (caixinhas)
function getReceitaGridHTML(r) {
    return `
    <div class="receita-display-container">
        <!-- OLHO DIREITO -->
        <div class="receita-row">
            <div class="receita-label">OD</div>
            <div class="receita-values">
                <div class="receita-box"><small>Esférico</small><span>${r.od_esferico || '-'}</span></div>
                <div class="receita-box"><small>Cilíndrico</small><span>${r.od_cilindrico || '-'}</span></div>
                <div class="receita-box"><small>Eixo</small><span>${r.od_eixo || '-'}°</span></div>
                <div class="receita-box"><small>AV</small><span>${r.od_dnp || '-'}</span></div>
            </div>
        </div>
        <!-- OLHO ESQUERDO -->
        <div class="receita-row">
            <div class="receita-label" style="background:var(--bg-card-hover)">OE</div>
            <div class="receita-values">
                <div class="receita-box"><small>Esférico</small><span>${r.oe_esferico || '-'}</span></div>
                <div class="receita-box"><small>Cilíndrico</small><span>${r.oe_cilindrico || '-'}</span></div>
                <div class="receita-box"><small>Eixo</small><span>${r.oe_eixo || '-'}°</span></div>
                <div class="receita-box"><small>AV</small><span>${r.oe_dnp || '-'}</span></div>
            </div>
        </div>
        <!-- ADIÇÃO -->
        <div style="display:flex; justify-content:center; margin-top:0.5rem; gap:1rem;">
            <div class="receita-box" style="padding:0.25rem 1rem; width:auto;">
                <small>Adição</small><span>${r.adicao || r.od_adicao || '-'}</span>
            </div>
        </div>
    </div>
    `;
}

window.viewReceita = async function (id) {
    showLoading();
    const { data: receita, error } = await supabaseClient
        .from('receitas')
        // Selecionando campos extras para exibição completa
        .select('*, clientes(nome, telefone), oticas(nome, endereco, telefone, responsavel)')
        .eq('id', id)
        .single();

    showLoading(false);
    if (!receita) return;

    const container = document.getElementById('receitaViewContent');
    container.innerHTML = `
        <div class="receita-view-header">
            <h2>${receita.clientes?.nome || 'Cliente'}</h2>
            <p>${Utils.formatDate(receita.data)} • ${Utils.getServiceName(receita.tipo_servico)}</p>
        </div>

        <div class="receita-view-info">
             <div>
                <strong style="display:block; color:var(--primary-light); margin-bottom:0.25rem;">🏠 Ótica</strong>
                <span style="font-size:0.9rem;">${receita.oticas?.nome || '-'}</span><br>
                <small style="color:var(--text-muted);">${receita.oticas?.telefone || ''}</small>
            </div>
             <div style="text-align:right;">
                <strong style="display:block; color:var(--primary-light); margin-bottom:0.25rem;">📞 Contato Cliente</strong>
                <span style="font-size:0.9rem;">${receita.clientes?.telefone || '-'}</span>
            </div>
        </div>
        
        ${getReceitaGridHTML(receita)}

        <div class="receita-view-section" style="margin-top: 1rem;">
            <h4>💰 Pagamento</h4>
            <p><strong>Valor:</strong> ${Utils.formatCurrency(receita.valor)}</p>
            <p><strong>Status:</strong> ${Utils.getPayerName(receita.pagador)}</p>
        </div>

        <div class="receita-view-section" style="margin-top: 1rem;">
            <h4>📝 Observações</h4>
            <p style="white-space: pre-wrap;">${receita.observacoes || 'Nenhuma'}</p>
        </div>
    `;

    openModal('modalViewReceita');
};


window.deleteReceita = async function (id) {
    if (!confirm('Deseja realmente excluir esta receita?')) return;
    showLoading();
    const { error } = await supabaseClient.from('receitas').delete().eq('id', id);
    showLoading(false);
    if (error) { showToast('Erro: ' + error.message, 'error'); return; }
    showToast('Receita excluída!', 'error');
    renderReceitas();
    renderPagamentos();
    updateDashboard();
};

document.getElementById('filterOticaReceita').addEventListener('change', async () => {
    const oticaId = document.getElementById('filterOticaReceita').value;
    await populateClienteSelect('filterClienteReceita', oticaId);
    renderReceitas();
});
document.getElementById('filterClienteReceita').addEventListener('change', renderReceitas);
document.getElementById('filterDataReceita').addEventListener('change', renderReceitas);

document.getElementById('btnPrintReceita')?.addEventListener('click', () => window.print());

// ===== PAGAMENTOS =====
async function renderPagamentos() {
    showLoading();
    const filterOtica = document.getElementById('filterOticaPagamento').value;
    const filterStatus = document.getElementById('filterStatusPagamento').value;

    let query = supabaseClient.from('receitas').select('*, clientes(nome), oticas(nome)').order('data', { ascending: false });

    if (filterOtica === 'particular') {
        query = query.is('otica_id', null);
    } else if (filterOtica) {
        query = query.eq('otica_id', filterOtica);
    }

    if (filterStatus) query = query.eq('pagador', filterStatus);

    const { data: receitas } = await query;
    showLoading(false);

    const container = document.getElementById('pagamentosList');
    if (!receitas || receitas.length === 0) {
        container.innerHTML = '<tr><td colspan="7" class="empty-state">Nenhum pagamento encontrado.</td></tr>';
        return;
    }

    container.innerHTML = receitas.map(r => `
        <tr>
            <td>${Utils.formatDate(r.data)}</td>
            <td>${r.clientes?.nome || '-'}</td>
            <td>${r.oticas?.nome || '-'}</td>
            <td>${Utils.getServiceName(r.tipo_servico)}</td>
            <td><strong>${Utils.formatCurrency(r.valor)}</strong></td>
            <td><span class="status-badge ${r.pagador}">${Utils.getPayerName(r.pagador)}</span></td>
            <td class="actions"><button class="btn-secondary btn-sm" onclick="editReceita('${r.id}')">✏️</button></td>
        </tr>
    `).join('');
}

document.getElementById('filterOticaPagamento').addEventListener('change', renderPagamentos);
document.getElementById('filterStatusPagamento').addEventListener('change', renderPagamentos);

// ===== EXPORTAÇÃO =====
document.getElementById('btnExportExcel').addEventListener('click', async () => {
    showLoading();
    const { data: oticas } = await supabaseClient.from('oticas').select('*');
    const { data: clientes } = await supabaseClient.from('clientes').select('*, oticas(nome)');
    const { data: receitas } = await supabaseClient.from('receitas').select('*, clientes(nome), oticas(nome)');
    showLoading(false);

    const wb = XLSX.utils.book_new();

    const oticasData = (oticas || []).map(o => ({ 'Nome': o.nome, 'Telefone': o.telefone, 'Email': o.email, 'Endereço': o.endereco, 'Responsável': o.responsavel }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(oticasData), 'Óticas');

    const clientesData = (clientes || []).map(c => ({ 'Nome': c.nome, 'CPF': c.cpf, 'Telefone': c.telefone, 'Email': c.email, 'Ótica': c.oticas?.nome || '' }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(clientesData), 'Clientes');

    const receitasData = (receitas || []).map(r => ({
        'Data': r.data, 'Cliente': r.clientes?.nome || '', 'Ótica': r.oticas?.nome || '',
        'Serviço': Utils.getServiceName(r.tipo_servico), 'Valor': r.valor, 'Pagador': Utils.getPayerName(r.pagador),
        'OD Esf': r.od_esferico, 'OD Cil': r.od_cilindrico, 'OD Eixo': r.od_eixo,
        'OE Esf': r.oe_esferico, 'OE Cil': r.oe_cilindrico, 'OE Eixo': r.oe_eixo
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(receitasData), 'Receitas');

    XLSX.writeFile(wb, `oticas_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('Excel exportado!');
});

document.getElementById('btnExportSheets').addEventListener('click', async () => {
    showLoading();
    const { data: oticas } = await supabaseClient.from('oticas').select('*');
    const { data: clientes } = await supabaseClient.from('clientes').select('*, oticas(nome)');
    const { data: receitas } = await supabaseClient.from('receitas').select('*, clientes(nome), oticas(nome)');
    showLoading(false);

    let text = 'ÓTICAS\nNome\tTelefone\tEndereço\n';
    (oticas || []).forEach(o => { text += `${o.nome} \t${o.telefone || ''} \t${o.endereco || ''} \n`; });
    text += '\nCLIENTES\nNome\tTelefone\tÓtica\n';
    (clientes || []).forEach(c => { text += `${c.nome} \t${c.telefone || ''} \t${c.oticas?.nome || ''} \n`; });
    text += '\nRECEITAS\nData\tCliente\tÓtica\tServiço\tValor\tPagador\n';
    (receitas || []).forEach(r => { text += `${r.data} \t${r.clientes?.nome || ''} \t${r.oticas?.nome || ''} \t${Utils.getServiceName(r.tipo_servico)} \t${r.valor} \t${Utils.getPayerName(r.pagador)} \n`; });

    navigator.clipboard.writeText(text).then(() => showToast('Dados copiados! Cole no Google Sheets.'));
});

document.getElementById('btnBackup').addEventListener('click', async () => {
    showLoading();
    const { data: oticas } = await supabaseClient.from('oticas').select('*');
    const { data: clientes } = await supabaseClient.from('clientes').select('*');
    const { data: receitas } = await supabaseClient.from('receitas').select('*');
    showLoading(false);

    const backup = { oticas, clientes, receitas, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_oticas_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast('Backup realizado!');
});

document.getElementById('btnRestore').addEventListener('click', () => document.getElementById('fileRestore').click());

document.getElementById('fileRestore').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
        try {
            const data = JSON.parse(ev.target.result);
            if (!confirm('Isso vai SUBSTITUIR todos os dados atuais. Continuar?')) return;

            showLoading();
            // Delete all existing data
            await supabaseClient.from('receitas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabaseClient.from('clientes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabaseClient.from('oticas').delete().neq('id', '00000000-0000-0000-0000-000000000000');

            // Insert backup data
            if (data.oticas?.length) await supabaseClient.from('oticas').insert(data.oticas);
            if (data.clientes?.length) await supabaseClient.from('clientes').insert(data.clientes);
            if (data.receitas?.length) await supabaseClient.from('receitas').insert(data.receitas);

            showLoading(false);
            showToast('Backup restaurado!');
            init();
        } catch (err) {
            showLoading(false);
            showToast('Erro ao restaurar: ' + err.message, 'error');
        }
    };
    reader.readAsText(file);
});

// ===== HELPERS =====
async function populateOticaSelect(selectId, placeholder = 'Selecione...') {
    const { data: oticas } = await supabaseClient.from('oticas').select('id, nome').order('nome');
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = `<option value="">${placeholder}</option>` + (oticas || []).map(o => `<option value="${o.id}">${o.nome}</option>`).join('');
}

async function populateClienteSelect(selectId, oticaId = null) {
    let query = supabaseClient.from('clientes').select('id, nome').order('nome');

    if (oticaId === 'particular') {
        query = query.is('otica_id', null);
    } else if (oticaId) {
        query = query.eq('otica_id', oticaId);
    }

    const { data: clientes } = await query;
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = '<option value="">Todos</option>' + (clientes || []).map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
}

async function updateFilters() {
    const { data: oticas } = await supabaseClient.from('oticas').select('id, nome').order('nome');

    // Opções base para todos os filtros - AGORA INCLUI PARTICULAR
    const allOptions = '<option value="">Todas</option>' +
        '<option value="particular">👤 Pacientes Particulares / Sem Ótica</option>' +
        (oticas || []).map(o => `<option value="${o.id}">${o.nome}</option>`).join('');

    // Atualiza todos os filtros com a mesma lista completa
    ['filterOticaCliente', 'filterOticaReceita', 'filterOticaPagamento'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const current = el.value;
            el.innerHTML = allOptions;
            if (current) el.value = current;
        }
    });
}

async function updateDashboard() {
    const { data: oticas } = await supabaseClient.from('oticas').select('id');
    const { data: clientes } = await supabaseClient.from('clientes').select('id');
    const { data: receitas } = await supabaseClient.from('receitas').select('id, valor, pagador, data, cliente_id');

    document.getElementById('totalOticas').textContent = oticas?.length || 0;
    document.getElementById('totalClientes').textContent = clientes?.length || 0;
    document.getElementById('totalReceitas').textContent = receitas?.length || 0;

    let totalPago = 0, totalOtica = 0, totalCliente = 0;
    (receitas || []).forEach(r => {
        if (r.pagador !== 'pendente') totalPago += parseFloat(r.valor) || 0;
        if (r.pagador === 'pago_otica') totalOtica += parseFloat(r.valor) || 0;
        if (r.pagador === 'pago_cliente') totalCliente += parseFloat(r.valor) || 0;
    });

    document.getElementById('totalPagamentos').textContent = Utils.formatCurrency(totalPago);
    document.getElementById('valorOtica').textContent = Utils.formatCurrency(totalOtica);
    document.getElementById('valorCliente').textContent = Utils.formatCurrency(totalCliente);

    const max = Math.max(totalOtica, totalCliente, 1);
    document.getElementById('barOtica').style.height = (totalOtica / max * 150) + 'px';
    document.getElementById('barCliente').style.height = (totalCliente / max * 150) + 'px';

    // Recent Activity
    const { data: clientesList } = await supabaseClient.from('clientes').select('id, nome, otica_id'); // Selecionando otica_id para identificar particulares
    const recent = (receitas || []).sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 5);
    const container = document.getElementById('recentActivity');
    if (recent.length === 0) {
        container.innerHTML = '<p class="empty-state">Nenhum atendimento registrado.</p>';
    } else {
        container.innerHTML = recent.map(r => {
            const cliente = clientesList?.find(c => c.id === r.cliente_id);
            // Identifica se é particular
            const isParticular = cliente && !cliente.otica_id;
            const nomeCliente = cliente ? (isParticular ? `${cliente.nome} (Particular)` : cliente.nome) : 'Cliente Removido';

            return `
            <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid var(--border);">
                <span style="font-weight: 500;">${nomeCliente}</span>
                <span style="color: var(--text-muted); font-size: 0.9rem;">${Utils.formatDate(r.data)}</span>
            </div>`;
        }).join('');
    }
}

// ===== GERAÇÃO DE PDF =====

// Botão para gerar PDF
document.getElementById('btnGeneratePDF').addEventListener('click', async () => {
    await openReceitaSelectorModal();
});

// Abre modal para selecionar receita
async function openReceitaSelectorModal() {
    showLoading();

    // Busca todas as receitas com dados de cliente e ótica
    const { data: receitas, error } = await supabaseClient
        .from('receitas')
        .select('*, clientes(nome), oticas(nome)')
        .order('data', { ascending: false });

    showLoading(false);

    if (error || !receitas || receitas.length === 0) {
        showToast('Nenhuma receita encontrada!', 'error');
        return;
    }

    // Cria modal dinamicamente
    const modalHTML = `
        <div class="modal active" id="modalSelectReceita" style="z-index: 10000;">
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>Selecione a Receita para Gerar o PDF</h3>
                    <button class="modal-close" onclick="closeModal('modalSelectReceita')">&times;</button>
                </div>
                <div class="modal-body" style="max-height: 500px; overflow-y: auto;">
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        ${receitas.map(r => `
                            <button 
                                onclick="openObservacaoModal('${r.id}')"
                                style="
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: center;
                                    width: 100%;
                                    background: var(--bg-dark);
                                    border: 1px solid var(--border);
                                    padding: 1rem;
                                    border-radius: 0.5rem;
                                    color: var(--text);
                                    cursor: pointer;
                                    transition: all 0.2s;
                                "
                                onmouseover="this.style.borderColor='var(--primary)'; this.style.background='var(--bg-card-hover)'"
                                onmouseout="this.style.borderColor='var(--border)'; this.style.background='var(--bg-dark)'"
                            >
                                <div style="text-align: left;">
                                    <strong style="display: block; font-size: 1rem;">${r.clientes?.nome || 'Cliente'}</strong>
                                    <span style="font-size: 0.85rem; color: var(--text-muted);">
                                        📅 ${Utils.formatDate(r.data)} • ${Utils.getServiceName(r.tipo_servico)} • 🏪 ${r.oticas?.nome || 'Particular'}
                                    </span>
                                </div>
                                <span style="font-size: 1.25rem;">📝</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove modal anterior se existir
    const oldModal = document.getElementById('modalSelectReceita');
    if (oldModal) oldModal.remove();

    // Adiciona novo modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Abre modal para adicionar observação antes de gerar o PDF
window.openObservacaoModal = function (receitaId) {
    closeModal('modalSelectReceita');

    const modalHTML = `
        <div class="modal active" id="modalObservacaoPDF" style="z-index: 10001;">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>📝 Observação para o PDF</h3>
                    <button class="modal-close" onclick="closeModal('modalObservacaoPDF')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="observacaoPDF">Observação (opcional):</label>
                        <textarea 
                            id="observacaoPDF" 
                            rows="4" 
                            placeholder="Digite uma observação para incluir no PDF..."
                            style="
                                width: 100%;
                                padding: 0.75rem;
                                border: 1px solid var(--border);
                                border-radius: 0.5rem;
                                background: var(--bg-dark);
                                color: var(--text);
                                resize: vertical;
                                font-family: inherit;
                            "
                        ></textarea>
                    </div>
                </div>
                <div class="modal-footer" style="display: flex; gap: 1rem; justify-content: flex-end; padding: 1rem;">
                    <button class="btn-secondary" onclick="closeModal('modalObservacaoPDF')">Cancelar</button>
                    <button class="btn-primary" onclick="generatePDFFromReceita('${receitaId}', document.getElementById('observacaoPDF').value)">
                        📄 Gerar PDF
                    </button>
                </div>
            </div>
        </div>
    `;

    // Remove modal anterior se existir
    const oldModal = document.getElementById('modalObservacaoPDF');
    if (oldModal) oldModal.remove();

    // Adiciona novo modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Foca no textarea
    setTimeout(() => {
        document.getElementById('observacaoPDF')?.focus();
    }, 100);
};

// Gera PDF do zero com dados da receita
window.generatePDFFromReceita = async function (receitaId, observacaoCustom = '') {
    closeModal('modalObservacaoPDF');
    showLoading();

    try {
        // Busca dados completos da receita
        const { data: receita, error } = await supabaseClient
            .from('receitas')
            .select('*, clientes(nome, telefone), oticas(nome, telefone, responsavel)')
            .eq('id', receitaId)
            .single();

        if (error || !receita) {
            throw new Error('Receita não encontrada');
        }

        // Cria o PDF com pdf-lib
        const { PDFDocument, rgb, StandardFonts, degrees } = PDFLib;
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595.28, 841.89]); // A4 size

        // Fontes
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        // Usando Bold para simular o estilo manuscrito/destacado do nome
        const fontHeader = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);

        const { width, height } = page.getSize();

        // Utilitário para centralizar texto
        const drawCenteredText = (text, y, size, fontToUse, color = rgb(0, 0, 0)) => {
            const textWidth = fontToUse.widthOfTextAtSize(text, size);
            page.drawText(text, {
                x: (width / 2) - (textWidth / 2),
                y: y,
                size: size,
                font: fontToUse,
                color: color,
            });
        };

        // --- 1. LOGO E CABEÇALHO ---
        let currentY = height - 50;

        // Carrega o logo (PNG Direto)
        let logoImage = null;
        let logoDims = null;
        try {
            const logoBase64 = "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";
            const logoImageBytes = Uint8Array.from(atob(logoBase64), c => c.charCodeAt(0));
            logoImage = await pdfDoc.embedPng(logoImageBytes);
        } catch (e) {
            console.warn("Logo não carregado:", e);
        }

        // Carrega imagem do olho (rodapé) via Base64 para evitar CORS
        let eyeImage = null;
        try {
            // Imagem do olho convertida para Base64
            const eyeBase64 = "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";

            const eyeImageBytes = Uint8Array.from(atob(eyeBase64), c => c.charCodeAt(0));
            eyeImage = await pdfDoc.embedPng(eyeImageBytes);
        } catch (e) {
            console.warn("Imagem do olho não carregada:", e);
        }

        // Se conseguiu carregar o logo
        if (logoImage) {
            // Ajusta posição inicial com padding top
            currentY = height - 60;

            // Calcula a altura total do bloco de texto (soma dos espaçamentos)
            // 18 (nome) + 24 + 13 (optometrista) + 18 + 11 (croo) + 22 + 11 (afiliação1) + 16 + 9 (afiliação2)
            const textBlockHeight = 15 + 24 + 18 + 22 + 16 + 9; // ~104px de altura total

            // Calcula a escala baseada na altura desejada
            const originalLogoHeight = logoImage.height;
            const targetHeight = textBlockHeight;
            const logoScale = targetHeight / originalLogoHeight;
            logoDims = logoImage.scale(logoScale);

            // Posiciona o logo à esquerda, alinhado ao topo do texto
            const logoX = 50;
            const textStartY = currentY - 15; // Onde o texto começa
            const logoY = textStartY - logoDims.height + 18; // +18 para alinhar com a primeira linha

            page.drawImage(logoImage, {
                x: logoX,
                y: logoY,
                width: logoDims.width,
                height: logoDims.height,
            });

            // Área do texto: começa após o logo e vai até a margem direita
            const textAreaStartX = logoX + logoDims.width + 20;
            const textAreaEndX = width - 50;
            const textAreaWidth = textAreaEndX - textAreaStartX;
            const textAreaCenterX = textAreaStartX + (textAreaWidth / 2);

            // Função auxiliar para centralizar texto na área do texto
            const drawCenteredTextInArea = (text, y, size, fontToUse, color = rgb(0, 0, 0)) => {
                const textWidth = fontToUse.widthOfTextAtSize(text, size);
                page.drawText(text, {
                    x: textAreaCenterX - (textWidth / 2),
                    y: y,
                    size: size,
                    font: fontToUse,
                    color: color,
                });
            };

            // Posiciona o texto verticalmente
            let textCursorY = textStartY;

            // Nome da Optometrista (Maior) - CENTRALIZADO NA ÁREA
            drawCenteredTextInArea('Marta Tette Lopes Afonso', textCursorY, 18, fontHeader);
            textCursorY -= 24;

            // Título Profissional - CENTRALIZADO NA ÁREA
            drawCenteredTextInArea('OPTOMETRISTA', textCursorY, 13, fontBold);
            textCursorY -= 18;

            // CROO - CENTRALIZADO NA ÁREA
            drawCenteredTextInArea('CROO/SP 58.4521', textCursorY, 11, font);
            textCursorY -= 22;

            // Afiliação 1 - CENTRALIZADO NA ÁREA
            drawCenteredTextInArea('Óptica e Optometrista', textCursorY, 11, font);
            textCursorY -= 16;

            // Afiliação 2 - CENTRALIZADO NA ÁREA
            drawCenteredTextInArea('Filiada ao Conselho Brasileiro de Óptica e Optometria', textCursorY, 9, font, rgb(0.2, 0.2, 0.2));

            // Define o Y para a próxima seção
            currentY = textCursorY - 40;

        } else {
            // Fallback Ajustado (também centralizado)
            currentY = height - 100;
            drawCenteredText('Marta Tette Lopes Afonso', currentY, 18, fontHeader);
            currentY -= 30;
            drawCenteredText('OPTOMETRISTA', currentY, 14, fontBold);
            currentY -= 25;
            drawCenteredText('CROO/SP 58.4521', currentY, 12, font);
            currentY -= 25;
            drawCenteredText('Óptica e Optometrista', currentY, 12, font);
            currentY -= 20;
            drawCenteredText('Filiada ao Conselho Brasileiro de Óptica e Optometria', currentY, 10, font, rgb(0.4, 0.4, 0.4));
            currentY -= 50;
        }

        // --- 2. DADOS DO PACIENTE ---
        // "Para:"
        page.drawText('Para:', { x: 50, y: currentY, size: 12, font: fontBold });

        // Nome do Paciente (sobre uma linha)
        page.drawText(receita.clientes?.nome || '', {
            x: 90,
            y: currentY,
            size: 12,
            font: font
        });

        page.drawLine({
            start: { x: 85, y: currentY - 2 },
            end: { x: width - 50, y: currentY - 2 },
            thickness: 0.5,
            color: rgb(0, 0, 0),
        });
        currentY -= 40;

        // Título da Receita
        drawCenteredText('Prescrição de Óculos', currentY, 16, fontBold);
        currentY -= 30;

        // --- 3. TABELA DE GRAUS ---
        const tableTop = currentY;
        const marginLeft = 50;
        const marginRight = 50;
        const totalWidth = width - marginLeft - marginRight; // Largura total disponível

        const verticalColWidth = 25; // Coluna estreita para Longe/Perto vertical
        const labelColWidth = 35; // Coluna para OD/OE
        const colStart = marginLeft + verticalColWidth + labelColWidth; // Onde começam os dados

        // Calcula a largura das 4 colunas de dados para ocupar o espaço restante
        const dataColumnsWidth = totalWidth - verticalColWidth - labelColWidth;
        const colWidth = dataColumnsWidth / 4; // Divide igualmente entre as 4 colunas

        const rowHeight = 35;

        // Cabeçalhos das Colunas
        const headers = ['ESFÉRICO', 'CILINDRICO', 'EIXO', 'DP'];
        headers.forEach((h, i) => {
            const xPos = colStart + (i * colWidth);
            const textWidth = fontBold.widthOfTextAtSize(h, 9);
            page.drawText(h, {
                x: xPos + (colWidth / 2) - (textWidth / 2),
                y: tableTop,
                size: 9,
                font: fontBold
            });
        });

        const gridTop = tableTop - 10;
        const gridBottom = gridTop - (rowHeight * 4);
        const tableEnd = marginLeft + totalWidth;

        // Desenha a Grade (Grid)
        // Linhas Horizontais - apenas nas divisões entre Longe/Perto, não dentro delas
        // Linha superior
        page.drawLine({
            start: { x: 50, y: gridTop },
            end: { x: tableEnd, y: gridTop },
            thickness: 1,
            color: rgb(0, 0, 0),
        });

        // Linha após primeira linha OD (mas só até antes da coluna DP)
        page.drawLine({
            start: { x: 50 + verticalColWidth, y: gridTop - rowHeight },
            end: { x: colStart + (colWidth * 3), y: gridTop - rowHeight }, // Para antes do DP
            thickness: 1,
            color: rgb(0, 0, 0),
        });

        // Linha divisória entre Longe e Perto (linha completa)
        page.drawLine({
            start: { x: 50, y: gridTop - (rowHeight * 2) },
            end: { x: tableEnd, y: gridTop - (rowHeight * 2) },
            thickness: 1,
            color: rgb(0, 0, 0),
        });

        // Linha após terceira linha OD (mas só até antes da coluna DP)
        page.drawLine({
            start: { x: 50 + verticalColWidth, y: gridTop - (rowHeight * 3) },
            end: { x: colStart + (colWidth * 3), y: gridTop - (rowHeight * 3) }, // Para antes do DP
            thickness: 1,
            color: rgb(0, 0, 0),
        });

        // Linha inferior
        page.drawLine({
            start: { x: 50, y: gridBottom },
            end: { x: tableEnd, y: gridBottom },
            thickness: 1,
            color: rgb(0, 0, 0),
        });

        // Linhas Verticais
        // Linha após coluna vertical Longe/Perto
        page.drawLine({
            start: { x: 50 + verticalColWidth, y: gridTop },
            end: { x: 50 + verticalColWidth, y: gridBottom },
            thickness: 1
        });

        // Linha após coluna OD/OE
        page.drawLine({
            start: { x: colStart, y: gridTop },
            end: { x: colStart, y: gridBottom },
            thickness: 1
        });

        // Linhas entre as colunas de dados
        for (let i = 1; i <= 4; i++) {
            const x = colStart + (i * colWidth);
            page.drawLine({
                start: { x: x, y: gridTop },
                end: { x: x, y: gridBottom },
                thickness: 1
            });
        }

        // Linha Vertical Esquerda (fechando a tabela)
        page.drawLine({
            start: { x: 50, y: gridTop },
            end: { x: 50, y: gridBottom },
            thickness: 1
        });

        // Texto VERTICAL para Longe e Perto (letras de baixo para cima) - centralizado
        // Longe - ocupa as 2 primeiras linhas
        const longeY = gridTop - rowHeight; // Centro vertical das 2 primeiras linhas
        const verticalTextX = 50 + (verticalColWidth / 2) + 1; // Mais centralizado

        page.drawText('e', {
            x: verticalTextX,
            y: longeY + 20,
            size: 10,
            font: fontBold,
            rotate: degrees(90)
        });
        page.drawText('g', {
            x: verticalTextX,
            y: longeY + 10,
            size: 10,
            font: fontBold,
            rotate: degrees(90)
        });
        page.drawText('n', {
            x: verticalTextX,
            y: longeY,
            size: 10,
            font: fontBold,
            rotate: degrees(90)
        });
        page.drawText('o', {
            x: verticalTextX,
            y: longeY - 10,
            size: 10,
            font: fontBold,
            rotate: degrees(90)
        });
        page.drawText('L', {
            x: verticalTextX,
            y: longeY - 20,
            size: 10,
            font: fontBold,
            rotate: degrees(90)
        });

        // Perto - ocupa as 2 últimas linhas
        const pertoY = gridTop - (rowHeight * 3); // Centro vertical das 2 últimas linhas
        page.drawText('o', {
            x: verticalTextX,
            y: pertoY + 20,
            size: 10,
            font: fontBold,
            rotate: degrees(90)
        });
        page.drawText('t', {
            x: verticalTextX,
            y: pertoY + 10,
            size: 10,
            font: fontBold,
            rotate: degrees(90)
        });
        page.drawText('r', {
            x: verticalTextX,
            y: pertoY,
            size: 10,
            font: fontBold,
            rotate: degrees(90)
        });
        page.drawText('e', {
            x: verticalTextX,
            y: pertoY - 10,
            size: 10,
            font: fontBold,
            rotate: degrees(90)
        });
        page.drawText('P', {
            x: verticalTextX,
            y: pertoY - 20,
            size: 10,
            font: fontBold,
            rotate: degrees(90)
        });

        // Labels OD/OE na segunda coluna
        const labelX = 50 + verticalColWidth + (labelColWidth / 2) - 8;

        // Longe OD
        page.drawText('OD', { x: labelX, y: gridTop - 18, size: 10, font: fontBold });
        // Longe OE
        page.drawText('OE', { x: labelX, y: gridTop - 53, size: 10, font: fontBold });
        // Perto OD
        page.drawText('OD', { x: labelX, y: gridTop - 88, size: 10, font: fontBold });
        // Perto OE
        page.drawText('OE', { x: labelX, y: gridTop - 123, size: 10, font: fontBold });

        // Unidade m.m dentro da coluna DP
        const dpColX = colStart + (colWidth * 3); // Início da coluna DP
        const mmX = dpColX + (colWidth / 2) - 10; // Centralizado na coluna DP

        page.drawText('m.m', { x: mmX, y: gridTop - 35, size: 9, font });
        page.drawText('m.m', { x: mmX, y: gridTop - 105, size: 9, font });

        // --- PREENCHIMENTO DOS DADOS ---
        const drawCellData = (text, colIndex, rowIndex) => {
            if (!text) return;
            const xBase = colStart + (colIndex * colWidth);
            const yBase = gridTop - (rowIndex * rowHeight) - 22; // Ajuste vertical para centralizar na célula
            const textWidth = font.widthOfTextAtSize(String(text), 12);

            page.drawText(String(text), {
                x: xBase + (colWidth / 2) - (textWidth / 2),
                y: yBase,
                size: 12,
                font: font,
                color: rgb(0, 0, 0)
            });
        };

        // Linha 1: Longe OD
        drawCellData(receita.od_esferico, 0, 0);
        drawCellData(receita.od_cilindrico, 1, 0);
        drawCellData(receita.od_eixo, 2, 0);
        // Coluna DP fica vazia no PDF (pois o valor salvo é AV)
        drawCellData('', 3, 0);

        // Linha 2: Longe OE
        drawCellData(receita.oe_esferico, 0, 1);
        drawCellData(receita.oe_cilindrico, 1, 1);
        drawCellData(receita.oe_eixo, 2, 1);
        drawCellData('', 3, 1);

        // Linha 3: Perto OD (só preenche se tiver grau de perto específico)
        drawCellData(receita.od_perto_esferico, 0, 2);
        drawCellData(receita.od_perto_cilindrico, 1, 2);
        drawCellData(receita.od_perto_eixo, 2, 2);
        drawCellData('', 3, 2);

        // Linha 4: Perto OE (só preenche se tiver grau de perto específico)
        drawCellData(receita.oe_perto_esferico, 0, 3);
        drawCellData(receita.oe_perto_cilindrico, 1, 3);
        drawCellData(receita.oe_perto_eixo, 2, 3);
        drawCellData('', 3, 3);

        currentY = gridBottom - 30;

        // --- CAMPO ADIÇÃO (se houver) ---
        const adicaoValor = receita.od_adicao || receita.oe_adicao;
        if (adicaoValor) {
            page.drawText('Adição:', { x: 50, y: currentY, size: 11, font: fontBold });
            page.drawText(String(adicaoValor), { x: 105, y: currentY, size: 11, font: font });

            // Linha abaixo do valor
            page.drawLine({
                start: { x: 100, y: currentY - 2 },
                end: { x: 180, y: currentY - 2 },
                thickness: 0.5,
                color: rgb(0, 0, 0),
            });

            currentY -= 30;
        }

        // --- 4. OBSERVAÇÕES E DATA ---
        // Obs.:
        page.drawText('Obs.:', { x: 50, y: currentY, size: 10, font: fontBold });

        // Linhas de observação
        for (let i = 0; i < 3; i++) {
            page.drawLine({
                start: { x: (i === 0 ? 85 : 50), y: currentY - 2 },
                end: { x: width - 50, y: currentY - 2 },
                thickness: 0.5,
                color: rgb(0.6, 0.6, 0.6), // Cinza claro para linhas vazias
            });

            // Plota o texto da observação na primeira linha se houver
            const obsTexto = observacaoCustom || receita.observacoes || '';
            if (i === 0 && obsTexto) {
                page.drawText(obsTexto.substring(0, 90), {
                    x: 90, y: currentY, size: 10, font: font
                });
            }
            currentY -= 25;
        }

        currentY -= 20;

        // Data e Assinatura
        const dateY = currentY;

        // Campo Data
        page.drawText('Data:', { x: 50, y: dateY, size: 10, font: fontBold });
        const dataFormatada = Utils.formatDate(receita.data) || new Date().toLocaleDateString('pt-BR');
        page.drawText(dataFormatada, { x: 85, y: dateY, size: 10, font: font });
        // Linha da data
        page.drawLine({ start: { x: 80, y: dateY - 2 }, end: { x: 180, y: dateY - 2 }, thickness: 0.5 });

        // Campo Assinatura
        page.drawLine({ start: { x: 300, y: dateY - 2 }, end: { x: width - 50, y: dateY - 2 }, thickness: 0.5, color: rgb(0, 0, 0) });
        // Texto abaixo da linha de assinatura
        page.drawText('Assinatura e Carimbo', { x: 380, y: dateY - 15, size: 8, font: font, color: rgb(0.4, 0.4, 0.4) });


        // --- 5. RODAPÉ / AVISOS ---
        const footerStart = 150; // Posição fixa próxima ao fundo da página
        const footerSize = 8;
        const footerLineHeight = 12;

        const avisos = [
            '01 - Adultos devem ser consultados anualmente.',
            '02 - Crianças devem ser consultadas a cada 6 meses.',
            '03 - Usuários de lentes de contato devem ser consultados a cada 6 meses.',
            '04 - Se possível, sempre traga sua última prescrição ao se consultar.',
            '05 - As lentes bifocais e multifocais exigem de 10 a 15 dias para adaptação.'
        ];

        avisos.forEach((aviso, index) => {
            page.drawText(aviso, {
                x: 50,
                y: footerStart - (index * footerLineHeight),
                size: footerSize,
                font: font,
                color: rgb(0, 0, 0),
            });
        });



        // Salva o PDF
        const pdfBytes = await pdfDoc.save();

        // Download
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receita_${receita.clientes?.nome || 'cliente'}.pdf`;
        a.click();

        showToast('PDF gerado com sucesso!');

    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        showToast('Erro ao gerar PDF: ' + error.message, 'error');
    }

    showLoading(false);
};


// ===== INIT =====
async function loadSystem() {
    showLoading();

    // Configura event listeners dos modais
    setupReceitaOticaListener();

    await updateFilters();
    await updateDashboard();
    await renderOticas();
    await renderClientes();
    await renderReceitas();
    await renderPagamentos();
    showLoading(false);
    console.log('✅ Sistema carregado!');
}

function init() {
    checkLogin();
}

init();
