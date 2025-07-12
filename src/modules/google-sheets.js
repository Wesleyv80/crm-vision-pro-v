// =====================================================
// Módulo Google Sheets - Integração Completa CORRIGIDO
// =====================================================
// Sincroniza dados do CRM com Google Sheets automaticamente
// VERSÃO 1.4 - CORRIGIDO: Erro 400 ao sincronizar métricas (formato de porcentagem)
// =====================================================

window.CRMGoogleSheets = (() => {

  // =====================================================
  // ESTADO DO MÓDULO
  // =====================================================

  const state = {
    authenticated: false,
    accessToken: null,
    spreadsheetId: '1J12aQTQMLVK2xa40Rz7CJo6iXHDsPyQXu3JrbrkiInc',
    sheetsConfig: {
      clientes: 'Clientes',
      vendas: 'Vendas',
      metricas: 'Métricas',
      ciclo: 'Ciclo Comercial'
    },
    syncEnabled: true,
    lastSync: null,
    errors: []
  };

  // =====================================================
  // AUTENTICAÇÃO VIA BACKGROUND SCRIPT
  // =====================================================

  /**
   * Autentica com Google usando OAuth2 via background script.
   * Envia uma mensagem para o background script para iniciar o fluxo de autenticação.
   * @returns {Promise<boolean>} Sucesso da autenticação
   */
  async function authenticate() {
    try {
      console.log('🔐 Iniciando autenticação Google Sheets (via background script)...');

      return new Promise((resolve) => {
        // Verifica se chrome.runtime está disponível para comunicação com o background script
        if (typeof chrome === 'undefined' || !chrome.runtime) {
          console.error('❌ Chrome runtime não disponível. A comunicação com o background script não é possível.');
          state.errors.push('Extensão não está em contexto Chrome ou background script não acessível.');
          resolve(false);
          return;
        }

        // Envia mensagem para o background script para iniciar a autenticação
        chrome.runtime.sendMessage(
          { action: 'authenticate' },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error('❌ Erro ao comunicar com background para autenticação:', chrome.runtime.lastError);
              state.errors.push('Erro de comunicação: ' + chrome.runtime.lastError.message);
              resolve(false);
              return;
            }

            if (response && response.success && response.token) {
              state.accessToken = response.token;
              state.authenticated = true;
              console.log('✅ Autenticação Google bem-sucedida (via background script)');

              if (window.CRMUI) {
                CRMUI.mostrarNotificacao('🔗 Google Sheets conectado!', 'success');
              }
              resolve(true);
            } else {
              console.error('❌ Falha na autenticação (via background script):', response?.error);
              state.errors.push('Falha na autenticação: ' + (response?.error || 'Erro desconhecido'));
              resolve(false);
            }
          }
        );
      });
    } catch (error) {
      console.error('❌ Erro na autenticação:', error);
      state.errors.push('Erro na autenticação: ' + error.message);
      return false;
    }
  }

  /**
   * Verifica se está autenticado
   * @returns {boolean} Status da autenticação
   */
  function isAuthenticated() {
    return state.authenticated && state.accessToken;
  }

  /**
   * Remove autenticação.
   * Envia uma mensagem para o background script para remover o token em cache.
   */
  async function logout() {
    if (state.accessToken) {
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime) {
          await new Promise((resolve) => {
            chrome.runtime.sendMessage(
              { action: 'removeToken', token: state.accessToken },
              (response) => {
                console.log('🔓 Logout response from background:', response);
                resolve();
              }
            );
          });
        }
      } catch (error) {
        console.error('❌ Erro no logout:', error);
      }

      state.authenticated = false;
      state.accessToken = null;
      console.log('🔓 Logout do Google Sheets realizado');
    }
  }

  // =====================================================
  // OPERAÇÕES COM SHEETS
  // =====================================================

  /**
   * Faz requisição para API do Google Sheets
   * @param {string} endpoint - Endpoint da API
   * @param {string} method - Método HTTP
   * @param {Object} body - Dados para envio
   * @returns {Promise<Object>} Resposta da API
   */
  async function makeAPIRequest(endpoint, method = 'GET', body = null) {
    if (!isAuthenticated()) {
      const authSuccess = await authenticate();
      if (!authSuccess) {
        throw new Error('Não foi possível autenticar com Google');
      }
    }

    const headers = {
      'Authorization': `Bearer ${state.accessToken}`,
      'Content-Type': 'application/json'
    };

    const options = {
      method,
      headers
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(endpoint, options);

      if (!response.ok) {
        if (response.status === 401) {
          // Token expirado, tenta renovar
          await logout();
          const authSuccess = await authenticate();
          if (authSuccess) {
            headers['Authorization'] = `Bearer ${state.accessToken}`;
            const retryResponse = await fetch(endpoint, { ...options, headers });
            return await retryResponse.json();
          }
        }
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erro na requisição:', error);
      state.errors.push(`Erro API: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verifica se planilha existe e cria se necessário
   * @returns {Promise<boolean>} Sucesso da verificação/criação
   */
  async function ensureSpreadsheetExists() {
    try {
      // Tenta acessar a planilha
      const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${state.spreadsheetId}`;
      await makeAPIRequest(endpoint);

      console.log('✅ Planilha encontrada');
      return true;
    } catch (error) {
      console.log('📝 Planilha não encontrada, verificando permissões...');

      // Se não conseguir acessar, tenta criar as abas necessárias
      return await setupSpreadsheetStructure();
    }
  }

  /**
   * Configura estrutura da planilha
   * @returns {Promise<boolean>} Sucesso da configuração
   */
  async function setupSpreadsheetStructure() {
    try {
      // Verifica se as abas existem
      const sheetsToCreate = [];

      for (const [key, sheetName] of Object.entries(state.sheetsConfig)) {
        try {
          await getSheetData(sheetName, 'A1');
        } catch (error) {
          sheetsToCreate.push(sheetName);
        }
      }

      // Cria abas que não existem
      for (const sheetName of sheetsToCreate) {
        await createSheet(sheetName);
      }

      // Configura headers das abas
      await setupHeaders();

      console.log('✅ Estrutura da planilha configurada');
      return true;
    } catch (error) {
      console.error('❌ Erro ao configurar planilha:', error);
      return false;
    }
  }

  /**
   * Cria nova aba na planilha
   * @param {string} title - Título da aba
   * @returns {Promise<Object>} Resposta da criação
   */
  async function createSheet(title) {
    const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${state.spreadsheetId}:batchUpdate`;

    const body = {
      requests: [{
        addSheet: {
          properties: {
            title: title
          }
        }
      }]
    };

    return await makeAPIRequest(endpoint, 'POST', body);
  }

  /**
   * Configura cabeçalhos das abas
   */
  async function setupHeaders() {
    const headers = {
      [state.sheetsConfig.clientes]: [
        'Data Cadastro', 'Nome', 'Telefone', 'Email', 'Origem',
        'Tags', 'Status', 'Valor Total', 'Observações'
      ],
      [state.sheetsConfig.vendas]: [
        'Data Venda', 'Cliente', 'Telefone', 'Valor Adesão',
        'Valor Gordurinha', 'Valor Total', 'Origem', 'Ciclo', 'Observações'
      ],
      [state.sheetsConfig.metricas]: [
        'Data', 'Total Clientes', 'Vendas Fechadas', 'Faturamento',
        'Taxa Conversão', 'Ticket Médio', 'Meta', 'Meta %'
      ],
      [state.sheetsConfig.ciclo]: [
        'Mês Referência', 'Período Início', 'Período Fim', 'Vendas Fechadas',
        'Meta Mensal', 'Meta Atingida', 'Faturamento', 'Taxa Conversão'
      ]
    };

    for (const [sheetName, headerRow] of Object.entries(headers)) {
      try {
        await updateSheetData(sheetName, 'A1', [headerRow]);
        console.log(`✅ Headers configurados para ${sheetName}`);
      } catch (error) {
        console.error(`❌ Erro ao configurar headers de ${sheetName}:`, error);
      }
    }
  }

  /**
   * Obtém dados de uma aba
   * @param {string} sheetName - Nome da aba
   * @param {string} range - Range dos dados (A1, A1:Z100, etc)
   * @returns {Promise<Array>} Dados da planilha
   */
  async function getSheetData(sheetName, range) {
    const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${state.spreadsheetId}/values/${sheetName}!${range}`;
    const response = await makeAPIRequest(endpoint);
    return response.values || [];
  }

  /**
   * Atualiza dados em uma aba
   * @param {string} sheetName - Nome da aba
   * @param {string} range - Range para atualizar
   * @param {Array} values - Valores para inserir
   * @returns {Promise<Object>} Resposta da atualização
   */
  async function updateSheetData(sheetName, range, values) {
    const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${state.spreadsheetId}/values/${sheetName}!${range}?valueInputOption=RAW`;

    const body = {
      values: values
    };

    return await makeAPIRequest(endpoint, 'PUT', body);
  }

  /**
   * Adiciona dados ao final de uma aba
   * @param {string} sheetName - Nome da aba
   * @param {Array} values - Valores para adicionar
   * @returns {Promise<Object>} Resposta da inserção
   */
  async function appendSheetData(sheetName, values) {
    const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${state.spreadsheetId}/values/${sheetName}!A:Z:append?valueInputOption=RAW`;

    const body = {
      values: [values]
    };

    return await makeAPIRequest(endpoint, 'POST', body);
  }

  // =====================================================
  // SINCRONIZAÇÃO DE DADOS
  // =====================================================

  /**
   * Sincroniza todos os dados do CRM
   * @returns {Promise<boolean>} Sucesso da sincronização
   */
  async function syncAllData() {
    if (!state.syncEnabled) {
      console.log('⏸️ Sincronização desabilitada');
      return false;
    }

    try {
      console.log('🔄 Iniciando sincronização completa...');

      // Verifica autenticação
      if (!isAuthenticated()) {
        const authSuccess = await authenticate();
        if (!authSuccess) return false;
      }

      // Verifica/configura planilha
      const sheetReady = await ensureSpreadsheetExists();
      if (!sheetReady) return false;

      // Sincroniza cada tipo de dado
      await syncClientes();
      await syncVendas();
      await syncMetricas();
      await syncCicloComercial();

      state.lastSync = new Date().toISOString();

      console.log('✅ Sincronização completa realizada');

      if (window.CRMUI) {
        CRMUI.mostrarNotificacao('🔄 Dados sincronizados com Google Sheets!', 'success');
      }

      return true;
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      state.errors.push(`Erro sincronização: ${error.message}`);

      if (window.CRMUI) {
        CRMUI.mostrarNotificacao('❌ Erro na sincronização com Google Sheets', 'error');
      }

      return false;
    }
  }

  /**
   * Sincroniza dados de clientes
   */
  async function syncClientes() {
    const clientes = window.crmState?.kanbanData?.clients || {};
    const dados = [];

    Object.values(clientes).forEach(cliente => {
      const valorTotal = (cliente.deals || []).reduce((sum, deal) =>
        sum + (deal.valor_adesao || 0) + (deal.valor_gordurinha || 0), 0
      );

      dados.push([
        new Date(cliente.dataCadastro).toLocaleDateString('pt-BR'),
        cliente.nome,
        cliente.telefone,
        cliente.email || '',
        cliente.origem || '',
        (cliente.tags || []).join(', '),
        cliente.status || 'lead',
        valorTotal,
        cliente.observacoes || ''
      ]);
    });

    if (dados.length > 0) {
      // Limpa dados antigos (mantém header)
      await updateSheetData(state.sheetsConfig.clientes, 'A2:Z1000', []);
      // Adiciona novos dados
      await updateSheetData(state.sheetsConfig.clientes, 'A2', dados);
      console.log(`✅ ${dados.length} clientes sincronizados`);
    }
  }

  /**
   * Sincroniza dados de vendas
   */
  async function syncVendas() {
    if (!window.CRMCicloComercial) return;

    const vendas = window.CRMCicloComercial.getHistoricoVendas();
    const dados = [];

    vendas.forEach(venda => {
      dados.push([
        new Date(venda.dataVenda).toLocaleDateString('pt-BR'),
        venda.nomeCliente,
        venda.telefone,
        venda.valorAdesao,
        venda.valorGordurinha,
        venda.valorTotal,
        venda.origem,
        venda.cicloId,
        venda.observacoes || ''
      ]);
    });

    if (dados.length > 0) {
      await updateSheetData(state.sheetsConfig.vendas, 'A2:Z1000', []);
      await updateSheetData(state.sheetsConfig.vendas, 'A2', dados);
      console.log(`✅ ${dados.length} vendas sincronizadas`);
    }
  }

  /**
   * Sincroniza métricas do ciclo atual
   */
  async function syncMetricas() {
    if (!window.CRMCicloComercial || !window.CRMCicloComercial.calcularMetricasCiclo) return;

    const metricas = window.CRMCicloComercial.calcularMetricasCiclo();
    const ciclo = window.CRMCicloComercial.getCicloAtual();
    const meta = window.CRMCicloComercial.getMeta();

    const dados = [[
      new Date().toLocaleDateString('pt-BR'),
      metricas.totalLeads,
      metricas.vendasFechadas,
      metricas.faturamentoTotal,
      metricas.taxaConversao, // Alterado: Removido o '%' para enviar como número
      metricas.ticketMedio,
      meta,
      metricas.metaProgress // Alterado: Removido o '%' para enviar como número
    ]];

    await appendSheetData(state.sheetsConfig.metricas, dados[0]);
    console.log('✅ Métricas sincronizadas');
  }

  /**
   * Sincroniza dados do ciclo comercial
   */
  async function syncCicloComercial() {
    if (!window.CRMCicloComercial) return;

    const historico = window.CRMCicloComercial.getHistoricoMensal();
    const dados = [];

    historico.forEach(mes => {
      dados.push([
        mes.mesReferencia,
        new Date(mes.periodoInicio).toLocaleDateString('pt-BR'),
        new Date(mes.periodoFim).toLocaleDateString('pt-BR'),
        mes.vendasFechadas,
        mes.metaMensal,
        mes.metaAtingida ? 'Sim' : 'Não',
        mes.faturamentoTotal,
        mes.taxaConversao + '%' // Mantido aqui, pois é uma string descritiva
      ]);
    });

    if (dados.length > 0) {
      await updateSheetData(state.sheetsConfig.ciclo, 'A2:Z1000', []);
      await updateSheetData(state.sheetsConfig.ciclo, 'A2', dados);
      console.log(`✅ ${dados.length} ciclos sincronizados`);
    }
  }

  // =====================================================
  // INTERFACE DE CONFIGURAÇÃO
  // =====================================================

  /**
   * Mostra painel de configuração do Google Sheets
   */
  function mostrarPainelConfiguracao() {
    const conteudo = `
      <div class="google-sheets-config" style="padding: 24px;">
        <div class="config-header" style="text-align: center; margin-bottom: 32px;">
          <h2 style="margin: 0 0 8px 0; color: #1f2937;">📊 Configuração Google Sheets</h2>
          <p style="margin: 0; color: #6b7280;">Sincronize automaticamente seus dados do CRM</p>
        </div>

        <!-- STATUS DA CONEXÃO -->
        <div class="connection-status" style="
          background: ${state.authenticated ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)'};
          color: white;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 24px;
          text-align: center;
        ">
          <div style="font-size: 48px; margin-bottom: 12px;">
            ${state.authenticated ? '🔗' : '🔌'}
          </div>
          <h3 style="margin: 0 0 8px 0;">
            ${state.authenticated ? 'Conectado' : 'Desconectado'}
          </h3>
          <p style="margin: 0; opacity: 0.9; font-size: 14px;">
            ${state.authenticated
              ? `Última sincronização: ${state.lastSync ? new Date(state.lastSync).toLocaleString('pt-BR') : 'Nunca'}`
              : 'Clique em "Conectar" para autorizar acesso ao Google Sheets'
            }
          </p>
        </div>

        <!-- CONFIGURAÇÕES -->
        <div class="config-form" style="margin-bottom: 24px;">
          <div class="form-field" style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 500;">ID da Planilha</label>
            <input type="text" id="spreadsheet-id" value="${state.spreadsheetId}"
                   style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-family: monospace;">
            <small style="color: #6b7280; margin-top: 4px; display: block;">
              Extraído da URL: docs.google.com/spreadsheets/d/<strong>ID_AQUI</strong>/edit
            </small>
          </div>

          <div class="form-field" style="margin-bottom: 16px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="checkbox" ${state.syncEnabled ? 'checked' : ''} id="sync-enabled">
              <span>Sincronização automática ativada</span>
            </label>
            <small style="color: #6b7280; margin-top: 4px; display: block;">
              Sincroniza dados automaticamente quando houver alterações
            </small>
          </div>
        </div>

        <!-- CONFIGURAÇÃO DAS ABAS -->
        <div class="sheets-config" style="
          background: #f9fafb;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 24px;
        ">
          <h3 style="margin: 0 0 16px 0; color: #1f2937;">Configuração das Abas</h3>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
            <div>
              <label style="display: block; margin-bottom: 4px; font-weight: 500;">Aba Clientes</label>
              <input type="text" value="${state.sheetsConfig.clientes}" data-sheet="clientes"
                     style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
            </div>

            <div>
              <label style="display: block; margin-bottom: 4px; font-weight: 500;">Aba Vendas</label>
              <input type="text" value="${state.sheetsConfig.vendas}" data-sheet="vendas"
                     style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
            </div>

            <div>
              <label style="display: block; margin-bottom: 4px; font-weight: 500;">Aba Métricas</label>
              <input type="text" value="${state.sheetsConfig.metricas}" data-sheet="metricas"
                     style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
            </div>

            <div>
              <label style="display: block; margin-bottom: 4px; font-weight: 500;">Aba Ciclo</label>
              <input type="text" value="${state.sheetsConfig.ciclo}" data-sheet="ciclo"
                     style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
            </div>
          </div>
        </div>

        <!-- ESTATÍSTICAS -->
        <div class="sync-stats" style="
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        ">
          <div style="text-align: center; padding: 16px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${Object.keys(window.crmState?.kanbanData?.clients || {}).length}</div>
            <div style="font-size: 12px; color: #6b7280;">Clientes</div>
          </div>

          <div style="text-align: center; padding: 16px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="font-size: 24px; font-weight: bold; color: #10b981;">${window.CRMCicloComercial?.getHistoricoVendas ? window.CRMCicloComercial.getHistoricoVendas().length : 0}</div>
            <div style="font-size: 12px; color: #6b7280;">Vendas</div>
          </div>

          <div style="text-align: center; padding: 16px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">${state.errors.length}</div>
            <div style="font-size: 12px; color: #6b7280;">Erros</div>
          </div>

          <div style="text-align: center; padding: 16px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="font-size: 24px; font-weight: bold; color: #8b5cf6;">${state.authenticated ? 'ON' : 'OFF'}</div>
            <div style="font-size: 12px; color: #6b7280;">Status</div>
          </div>
        </div>

        <!-- LOG DE ERROS -->
        ${state.errors.length > 0 ? `
          <div class="error-log" style="
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 24px;
          ">
            <h4 style="margin: 0 0 12px 0; color: #dc2626;">⚠️ Erros Recentes</h4>
            <div style="max-height: 120px; overflow-y: auto;">
              ${state.errors.slice(-5).map(error => `
                <div style="font-size: 12px; color: #7f1d1d; margin-bottom: 4px; padding: 4px 8px; background: white; border-radius: 4px;">
                  ${error}
                </div>
              `).join('')}
            </div>
            <button onclick="window.CRMGoogleSheets.clearErrors()" style="
              margin-top: 8px;
              padding: 4px 12px;
              background: #dc2626;
              color: white;
              border: none;
              border-radius: 4px;
              font-size: 12px;
              cursor: pointer;
            ">Limpar Erros</button>
          </div>
        ` : ''}
      </div>
    `;

    const modal = window.CRMUI.criarModal({
      titulo: '📊 Google Sheets Integration',
      conteudo: conteudo,
      tamanho: 'large',
      acoes: [
        {
          id: 'test-connection',
          texto: '🧪 Testar Conexão',
          tipo: 'secondary',
          onClick: () => testarConexao()
        },
        {
          id: 'sync-now',
          texto: '🔄 Sincronizar Agora',
          tipo: state.authenticated ? 'primary' : 'disabled',
          onClick: () => {
            if (state.authenticated) {
              syncAllData();
            }
          }
        },
        {
          id: 'connect',
          texto: state.authenticated ? '🔓 Desconectar' : '🔗 Conectar',
          tipo: state.authenticated ? 'danger' : 'success',
          onClick: () => {
            if (state.authenticated) {
              logout();
              modal.fechar();
              setTimeout(() => mostrarPainelConfiguracao(), 300);
            } else {
              authenticate().then((success) => {
                if (success) {
                  modal.fechar();
                  setTimeout(() => mostrarPainelConfiguracao(), 300);
                }
              });
            }
          }
        },
        {
          id: 'salvar',
          texto: '💾 Salvar Configurações',
          tipo: 'primary',
          onClick: () => salvarConfiguracoes()
        }
      ]
    });
  }

  /**
   * Salva configurações
   */
  function salvarConfiguracoes() {
    try {
      // Atualiza ID da planilha
      const spreadsheetIdInput = document.getElementById('spreadsheet-id');
      if (spreadsheetIdInput) {
        state.spreadsheetId = spreadsheetIdInput.value.trim();
      }

      // Atualiza sync enabled
      const syncEnabledInput = document.getElementById('sync-enabled');
      if (syncEnabledInput) {
        state.syncEnabled = syncEnabledInput.checked;
      }

      // Atualiza nomes das abas
      const sheetInputs = document.querySelectorAll('[data-sheet]');
      sheetInputs.forEach(input => {
        const sheetKey = input.dataset.sheet;
        state.sheetsConfig[sheetKey] = input.value.trim();
      });

      // Salva no localStorage
      localStorage.setItem('crm_google_sheets_config', JSON.stringify({
        spreadsheetId: state.spreadsheetId,
        sheetsConfig: state.sheetsConfig,
        syncEnabled: state.syncEnabled
      }));

      window.CRMUI.mostrarNotificacao('✅ Configurações salvas!', 'success');

    } catch (error) {
      console.error('❌ Erro ao salvar configurações:', error);
      window.CRMUI.mostrarNotificacao('❌ Erro ao salvar configurações', 'error');
    }
  }

  /**
   * Testa conexão com Google Sheets
   */
  async function testarConexao() {
    try {
      window.CRMUI.mostrarNotificacao('🧪 Testando conexão...', 'info');

      if (!isAuthenticated()) {
        const authSuccess = await authenticate();
        if (!authSuccess) {
          window.CRMUI.mostrarNotificacao('❌ Falha na autenticação', 'error');
          return;
        }
      }

      // Tenta acessar a planilha
      const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${state.spreadsheetId}`;
      const response = await makeAPIRequest(endpoint);

      if (response && response.properties) {
        window.CRMUI.mostrarNotificacao(`✅ Conexão OK! Planilha: "${response.properties.title}"`, 'success');
      } else {
        window.CRMUI.mostrarNotificacao('⚠️ Planilha acessível mas sem dados', 'warning');
      }

    } catch (error) {
      console.error('❌ Erro no teste de conexão:', error);
      state.errors.push(`Erro conexão: ${error.message}`); // Adicionado para capturar erros no log
      window.CRMUI.mostrarNotificacao('❌ Erro na conexão: ' + error.message, 'error');
    }
  }

  /**
   * Limpa erros do log
   */
  function clearErrors() {
    state.errors = [];
    // Força atualização do modal
    const modal = document.querySelector('.crm-modal-container');
    if (modal) {
      modal.remove();
    }
    setTimeout(() => mostrarPainelConfiguracao(), 100);
  }

  // =====================================================
  // INICIALIZAÇÃO E UTILITÁRIOS
  // =====================================================

  /**
   * Inicializa o módulo
   */
  async function inicializar() {
    console.log('📊 Inicializando módulo Google Sheets...');

    // Carrega configurações salvas
    try {
      const savedConfig = localStorage.getItem('crm_google_sheets_config');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        state.spreadsheetId = config.spreadsheetId || state.spreadsheetId;
        state.sheetsConfig = { ...state.sheetsConfig, ...config.sheetsConfig };
        state.syncEnabled = config.syncEnabled !== undefined ? config.syncEnabled : true;
      }
    } catch (error) {
      console.error('❌ Erro ao carregar configurações:', error);
    }

    // Verifica autenticação existente
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      try {
        chrome.runtime.sendMessage(
          { action: 'checkAuth' },
          (response) => {
            if (!chrome.runtime.lastError && response && response.authenticated) {
              state.accessToken = response.token;
              state.authenticated = true;
              console.log('✅ Token Google existente encontrado via background script');
            }
          }
        );
      } catch (error) {
        console.warn('⚠️ Não foi possível verificar autenticação existente via background script:', error);
      }
    }

    console.log('✅ Módulo Google Sheets inicializado');
  }

  /**
   * Registra venda no Google Sheets automaticamente
   * @param {Object} dadosVenda - Dados da venda
   */
  async function registrarVendaSheet(dadosVenda) {
    if (!state.syncEnabled || !state.authenticated) return;

    try {
      const dados = [
        new Date(dadosVenda.dataVenda).toLocaleDateString('pt-BR'),
        dadosVenda.nomeCliente,
        dadosVenda.telefone,
        dadosVenda.valorAdesao,
        dadosVenda.valorGordurinha,
        dadosVenda.valorTotal,
        dadosVenda.origem,
        dadosVenda.cicloId,
        dadosVenda.observacoes || ''
      ];

      await appendSheetData(state.sheetsConfig.vendas, dados);
      console.log('✅ Venda registrada no Google Sheets');

    } catch (error) {
      console.error('❌ Erro ao registrar venda no Sheets:', error);
      state.errors.push(`Erro ao registrar venda: ${error.message}`); // Adicionado para capturar erros no log
    }
  }

  // =====================================================
  // API PÚBLICA
  // =====================================================

  return {
    // Inicialização
    inicializar,

    // Autenticação
    authenticate,
    isAuthenticated,
    logout,

    // Configuração
    mostrarPainelConfiguracao,
    salvarConfiguracoes,
    testarConexao,
    clearErrors,

    // Sincronização
    syncAllData,
    syncClientes,
    syncVendas,
    syncMetricas,
    syncCicloComercial,
    registrarVendaSheet,

    // Operações diretas
    getSheetData,
    updateSheetData,
    appendSheetData,

    // Estado
    getEstado: () => ({ ...state }),
    isEnabled: () => state.syncEnabled,

    // Configurações
    setSpreadsheetId: (id) => {
      state.spreadsheetId = id;
      salvarConfiguracoes();
    },
    setSyncEnabled: (enabled) => {
      state.syncEnabled = enabled;
      salvarConfiguracoes();
    }
  };

})();

// Auto-inicialização quando DOM estiver pronto
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (window.CRMGoogleSheets) {
        window.CRMGoogleSheets.inicializar();
      }
    }, 1500);
  });
}

console.log('✅ Módulo CRMGoogleSheets CORRIGIDO carregado!');
