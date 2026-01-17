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

window.viewOticaClientes = function (id) {
    document.getElementById('filterOticaCliente').value = id;
    document.querySelector('[data-page="clientes"]').click();
    renderClientes();
};

document.getElementById('searchOtica').addEventListener('input', renderOticas);

// ===== CLIENTES =====
async function loadClientes(oticaId = null) {
    let clientes = [];

    // 1. Clientes cadastrados na ótica (ou todos se oticaId for null)
    let query = supabaseClient.from('clientes').select('*, oticas(nome)').order('nome');
    if (oticaId) query = query.eq('otica_id', oticaId);

    const { data: clientesCadastrados, error } = await query;
    if (error) { showToast('Erro: ' + error.message, 'error'); return []; }
    clientes = clientesCadastrados || [];

    // 2. Se tiver filtro de ótica, buscar clientes de outras lojas que têm receita nesta ótica
    if (oticaId) {
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
        return `
            <tr>
                <td><strong>${c.nome}</strong></td>
                <td>${c.telefone || '-'}</td>
                <td>${c.oticas?.nome || '-'}</td>
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
    await populateOticaSelect('clienteOtica');
    openModal('modalCliente');
});

document.getElementById('formCliente').addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoading();

    const id = document.getElementById('clienteId').value;
    const data = {
        nome: document.getElementById('clienteNome').value,
        otica_id: document.getElementById('clienteOtica').value,
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
    await populateOticaSelect('clienteOtica');
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
    if (filterOtica) query = query.eq('otica_id', filterOtica);
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
                <div class="prescricao-mini">
                    <div class="prescricao-mini-item">
                        <h5>👁️ Olho Direito (OD)</h5>
                        <p>Esf: ${r.od_esferico || '-'} | Cil: ${r.od_cilindrico || '-'} | Eixo: ${r.od_eixo || '-'}°</p>
                    </div>
                    <div class="prescricao-mini-item">
                        <h5>👁️ Olho Esquerdo (OE)</h5>
                        <p>Esf: ${r.oe_esferico || '-'} | Cil: ${r.oe_cilindrico || '-'} | Eixo: ${r.oe_eixo || '-'}°</p>
                    </div>
                </div>
                <p style="color: var(--text-muted); font-size: 0.875rem;">🏪 ${r.oticas?.nome || '-'}</p>
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
    await populateOticaSelect('receitaOtica');
    document.getElementById('receitaCliente').innerHTML = '<option value="">Selecione a ótica primeiro...</option>';
    openModal('modalReceita');
});

document.getElementById('receitaOtica').addEventListener('change', async (e) => {
    if (isDirectReceitaInsertion) {
        // Se for inserção direta, NÃO limpa o cliente, apenas permite mudar a loja de atendimento
        // Mas a flag deve ser resetada na próxima vez que abrir o modal normalmente
        return;
    }
    const oticaId = e.target.value;
    const { data: clientes } = await supabaseClient.from('clientes').select('id, nome').eq('otica_id', oticaId).order('nome');
    const select = document.getElementById('receitaCliente');
    select.innerHTML = '<option value="">Selecione...</option>' + (clientes || []).map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
});

document.getElementById('formReceita').addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoading();

    const id = document.getElementById('receitaId').value;
    const data = {
        otica_id: document.getElementById('receitaOtica').value,
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
        od_adicao: document.getElementById('odAdicao').value,
        oe_esferico: document.getElementById('oeEsferico').value,
        oe_cilindrico: document.getElementById('oeCilindrico').value,
        oe_eixo: document.getElementById('oeEixo').value,
        oe_dnp: document.getElementById('oeDNP').value,
        oe_adicao: document.getElementById('oeAdicao').value
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
    await populateOticaSelect('receitaOtica');
    const { data: receita } = await supabaseClient.from('receitas').select('*').eq('id', id).single();
    if (!receita) return;

    document.getElementById('receitaOtica').value = receita.otica_id;

    // Load clients for this otica
    const { data: clientes } = await supabaseClient.from('clientes').select('id, nome').eq('otica_id', receita.otica_id).order('nome');
    document.getElementById('receitaCliente').innerHTML = '<option value="">Selecione...</option>' + (clientes || []).map(c => `<option value="${c.id}">${c.nome}</option>`).join('');

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
    document.getElementById('odAdicao').value = receita.od_adicao || '';
    document.getElementById('oeEsferico').value = receita.oe_esferico || '';
    document.getElementById('oeCilindrico').value = receita.oe_cilindrico || '';
    document.getElementById('oeEixo').value = receita.oe_eixo || '';
    document.getElementById('oeDNP').value = receita.oe_dnp || '';
    document.getElementById('oeAdicao').value = receita.oe_adicao || '';
    document.getElementById('modalReceitaTitle').textContent = 'Editar Receita';
    openModal('modalReceita');
};

window.viewReceita = async function (id) {
    const { data: receita } = await supabaseClient.from('receitas').select('*, clientes(nome), oticas(nome)').eq('id', id).single();
    if (!receita) return;

    document.getElementById('receitaViewContent').innerHTML = `
        <div class="receita-view-header">
            <h2>👓 Receita de Óculos</h2>
            <p>${Utils.formatDate(receita.data)} - ${Utils.getServiceName(receita.tipo_servico)}</p>
        </div>
        <div style="margin-bottom: 1.5rem;">
            <p><strong>Cliente:</strong> ${receita.clientes?.nome || '-'}</p>
            <p><strong>Ótica:</strong> ${receita.oticas?.nome || '-'}</p>
        </div>
        <div class="receita-view-grid">
            <div class="receita-view-section">
                <h4>👁️ Olho Direito (OD)</h4>
                <div class="receita-view-row"><span>Esférico:</span><span>${receita.od_esferico || '-'}</span></div>
                <div class="receita-view-row"><span>Cilíndrico:</span><span>${receita.od_cilindrico || '-'}</span></div>
                <div class="receita-view-row"><span>Eixo:</span><span>${receita.od_eixo || '-'}°</span></div>
                <div class="receita-view-row"><span>DNP:</span><span>${receita.od_dnp || '-'}</span></div>
                <div class="receita-view-row"><span>Adição:</span><span>${receita.od_adicao || '-'}</span></div>
            </div>
            <div class="receita-view-section">
                <h4>👁️ Olho Esquerdo (OE)</h4>
                <div class="receita-view-row"><span>Esférico:</span><span>${receita.oe_esferico || '-'}</span></div>
                <div class="receita-view-row"><span>Cilíndrico:</span><span>${receita.oe_cilindrico || '-'}</span></div>
                <div class="receita-view-row"><span>Eixo:</span><span>${receita.oe_eixo || '-'}°</span></div>
                <div class="receita-view-row"><span>DNP:</span><span>${receita.oe_dnp || '-'}</span></div>
                <div class="receita-view-row"><span>Adição:</span><span>${receita.oe_adicao || '-'}</span></div>
            </div>
        </div>
        <div class="receita-view-section" style="margin-top: 1rem;">
            <h4>💰 Pagamento</h4>
            <div class="receita-view-row"><span>Valor:</span><span>${Utils.formatCurrency(receita.valor)}</span></div>
            <div class="receita-view-row"><span>Pago por:</span><span class="status-badge ${receita.pagador}">${Utils.getPayerName(receita.pagador)}</span></div>
        </div>
        ${receita.observacoes ? `<p style="margin-top: 1rem; color: var(--text-muted);"><strong>Obs:</strong> ${receita.observacoes}</p>` : ''}
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
    if (filterOtica) query = query.eq('otica_id', filterOtica);
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
    (oticas || []).forEach(o => { text += `${o.nome}\t${o.telefone || ''}\t${o.endereco || ''}\n`; });
    text += '\nCLIENTES\nNome\tTelefone\tÓtica\n';
    (clientes || []).forEach(c => { text += `${c.nome}\t${c.telefone || ''}\t${c.oticas?.nome || ''}\n`; });
    text += '\nRECEITAS\nData\tCliente\tÓtica\tServiço\tValor\tPagador\n';
    (receitas || []).forEach(r => { text += `${r.data}\t${r.clientes?.nome || ''}\t${r.oticas?.nome || ''}\t${Utils.getServiceName(r.tipo_servico)}\t${r.valor}\t${Utils.getPayerName(r.pagador)}\n`; });

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
async function populateOticaSelect(selectId) {
    const { data: oticas } = await supabaseClient.from('oticas').select('id, nome').order('nome');
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">Selecione...</option>' + (oticas || []).map(o => `<option value="${o.id}">${o.nome}</option>`).join('');
}

async function populateClienteSelect(selectId, oticaId = null) {
    let query = supabaseClient.from('clientes').select('id, nome').order('nome');
    if (oticaId) query = query.eq('otica_id', oticaId);
    const { data: clientes } = await query;
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">Todos</option>' + (clientes || []).map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
}

async function updateFilters() {
    const { data: oticas } = await supabaseClient.from('oticas').select('id, nome').order('nome');
    const options = '<option value="">Todas</option>' + (oticas || []).map(o => `<option value="${o.id}">${o.nome}</option>`).join('');
    ['filterOticaCliente', 'filterOticaReceita', 'filterOticaPagamento'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = options;
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
    const { data: clientesList } = await supabaseClient.from('clientes').select('id, nome');
    const recent = (receitas || []).sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 5);
    const container = document.getElementById('recentActivity');
    if (recent.length === 0) {
        container.innerHTML = '<p class="empty-state">Nenhum atendimento registrado.</p>';
    } else {
        container.innerHTML = recent.map(r => {
            const cliente = clientesList?.find(c => c.id === r.cliente_id);
            return `<div style="display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid var(--border);">
                <span>${cliente?.nome || 'Cliente'}</span>
                <span style="color: var(--text-muted);">${Utils.formatDate(r.data)}</span>
            </div>`;
        }).join('');
    }
}

// ===== INIT =====
async function loadSystem() {
    showLoading();
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
