// Modals HTML - Injetado dinamicamente
document.getElementById('modals').innerHTML = `
    <!-- Modal Ótica -->
    <div class="modal" id="modalOtica">
        <div class="modal-content">
            <div class="modal-header"><h3 id="modalOticaTitle">Nova Ótica</h3><button class="modal-close" data-modal="modalOtica">&times;</button></div>
            <form id="formOtica">
                <input type="hidden" id="oticaId">
                <div class="form-group"><label>Nome da Ótica *</label><input type="text" id="oticaNome" required></div>
                <div class="form-row">
                    <div class="form-group"><label>Telefone</label><input type="tel" id="oticaTelefone"></div>
                    <div class="form-group"><label>E-mail</label><input type="email" id="oticaEmail"></div>
                </div>
                <div class="form-group"><label>Endereço</label><input type="text" id="oticaEndereco"></div>
                <div class="form-group"><label>Responsável</label><input type="text" id="oticaResponsavel"></div>
                <div class="form-group"><label>Observações</label><textarea id="oticaObservacoes" rows="2"></textarea></div>
                <div class="form-actions"><button type="button" class="btn-secondary" data-modal="modalOtica">Cancelar</button><button type="submit" class="btn-primary">Salvar</button></div>
            </form>
        </div>
    </div>

    <!-- Modal Cliente -->
    <div class="modal" id="modalCliente">
        <div class="modal-content modal-large">
            <div class="modal-header"><h3 id="modalClienteTitle">Novo Cliente</h3><button class="modal-close" data-modal="modalCliente">&times;</button></div>
            <form id="formCliente">
                <input type="hidden" id="clienteId">
                <div class="form-row">
                    <div class="form-group flex-2"><label>Nome Completo *</label><input type="text" id="clienteNome" required></div>
                    <div class="form-group"><label>Ótica *</label><select id="clienteOtica" required><option value="">Selecione...</option></select></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>CPF</label><input type="text" id="clienteCPF" placeholder="000.000.000-00"></div>
                    <div class="form-group"><label>Data Nascimento</label><input type="date" id="clienteDataNasc"></div>
                    <div class="form-group"><label>Telefone</label><input type="tel" id="clienteTelefone"></div>
                </div>
                <div class="form-row">
                    <div class="form-group flex-2"><label>E-mail</label><input type="email" id="clienteEmail"></div>
                    <div class="form-group"><label>WhatsApp</label><input type="tel" id="clienteWhatsapp"></div>
                </div>
                <div class="form-group"><label>Endereço</label><input type="text" id="clienteEndereco"></div>
                <div class="form-group"><label>Observações</label><textarea id="clienteObservacoes" rows="2"></textarea></div>
                <div class="form-actions"><button type="button" class="btn-secondary" data-modal="modalCliente">Cancelar</button><button type="submit" class="btn-primary">Salvar</button></div>
            </form>
        </div>
    </div>

    <!-- Modal Receita -->
    <div class="modal" id="modalReceita">
        <div class="modal-content modal-xlarge">
            <div class="modal-header"><h3 id="modalReceitaTitle">Nova Receita</h3><button class="modal-close" data-modal="modalReceita">&times;</button></div>
            <form id="formReceita">
                <input type="hidden" id="receitaId">
                <div class="form-row">
                    <div class="form-group"><label>Ótica *</label><select id="receitaOtica" required><option value="">Selecione...</option></select></div>
                    <div class="form-group"><label>Cliente *</label><select id="receitaCliente" required><option value="">Selecione a ótica primeiro...</option></select></div>
                    <div class="form-group"><label>Data da Consulta *</label><input type="date" id="receitaData" required></div>
                </div>
                <div class="prescricao-card">
                    <h4>📋 Prescrição de Óculos</h4>
                    <div class="prescricao-grid">
                        <div class="prescricao-section">
                            <h5>👁️ Olho Direito (OD)</h5>
                            <div class="prescricao-row">
                                <div class="prescricao-field"><label>Esférico</label><input type="text" id="odEsferico" placeholder="+0.00"></div>
                                <div class="prescricao-field"><label>Cilíndrico</label><input type="text" id="odCilindrico" placeholder="-0.00"></div>
                                <div class="prescricao-field"><label>Eixo</label><input type="number" id="odEixo" min="0" max="180" placeholder="0°"></div>
                                <div class="prescricao-field"><label>DNP</label><input type="text" id="odDNP" placeholder="32"></div>
                                <div class="prescricao-field"><label>Adição</label><input type="text" id="odAdicao" placeholder="+0.00"></div>
                            </div>
                        </div>
                        <div class="prescricao-section">
                            <h5>👁️ Olho Esquerdo (OE)</h5>
                            <div class="prescricao-row">
                                <div class="prescricao-field"><label>Esférico</label><input type="text" id="oeEsferico" placeholder="+0.00"></div>
                                <div class="prescricao-field"><label>Cilíndrico</label><input type="text" id="oeCilindrico" placeholder="-0.00"></div>
                                <div class="prescricao-field"><label>Eixo</label><input type="number" id="oeEixo" min="0" max="180" placeholder="0°"></div>
                                <div class="prescricao-field"><label>DNP</label><input type="text" id="oeDNP" placeholder="32"></div>
                                <div class="prescricao-field"><label>Adição</label><input type="text" id="oeAdicao" placeholder="+0.00"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>Tipo de Serviço *</label><select id="receitaTipoServico" required><option value="">Selecione...</option><option value="exame_vista">Exame de Vista</option><option value="consulta_oculos">Consulta de Óculos</option><option value="ajuste_receita">Ajuste de Receita</option><option value="retorno">Retorno</option></select></div>
                    <div class="form-group"><label>Valor (R$)</label><input type="number" id="receitaValor" step="0.01" min="0" placeholder="0,00"></div>
                    <div class="form-group"><label>Quem Pagou? *</label><select id="receitaPagador" required><option value="">Selecione...</option><option value="pago_otica">Ótica</option><option value="pago_cliente">Cliente</option><option value="pendente">Pendente</option></select></div>
                </div>
                <div class="form-group"><label>Observações</label><textarea id="receitaObservacoes" rows="2"></textarea></div>
                <div class="form-actions"><button type="button" class="btn-secondary" data-modal="modalReceita">Cancelar</button><button type="submit" class="btn-primary">Salvar Receita</button></div>
            </form>
        </div>
    </div>

    <!-- Modal Ver Receita -->
    <div class="modal" id="modalViewReceita">
        <div class="modal-content modal-large">
            <div class="modal-header"><h3>Detalhes da Receita</h3><button class="modal-close" data-modal="modalViewReceita">&times;</button></div>
            <div class="receita-view" id="receitaViewContent"></div>
            <div class="form-actions" style="padding: 1.5rem; border-top: 1px solid var(--border);"><button type="button" class="btn-secondary" data-modal="modalViewReceita">Fechar</button><button type="button" class="btn-primary" id="btnPrintReceita">🖨️ Imprimir</button></div>
        </div>
    </div>

    <div class="modal" id="modalHistoricoCliente">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Histórico de Exames</h3>
                <div style="display:flex; gap:1rem; align-items:center;">
                    <button class="btn-primary btn-sm" id="btnNovaReceitaDireta">➕ Nova Receita</button>
                    <button class="modal-close" data-modal="modalHistoricoCliente">&times;</button>
                </div>
            </div>
            <div class="modal-body" style="padding: 1.5rem;">
                <div id="historicoClienteContent">
                    <!-- Lista de datas será injetada aqui -->
                </div>
                <div id="historicoEmptyState" class="empty-state" style="display:none; padding: 1rem 0;">
                    Nenhum exame encontrado para este cliente.
                </div>
            </div>
            <div class="form-actions" style="padding:1.5rem;border-top:1px solid var(--border);">
                <button type="button" class="btn-secondary" data-modal="modalHistoricoCliente">Fechar</button>
            </div>
        </div>
    </div>
`;
