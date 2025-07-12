// =====================================================
// Kanban UI - Interface Visual e Eventos
// =====================================================
// Gerencia a criação visual e eventos do Kanban
// VERSÃO 4.3 - CORRIGIDO CICLO COMERCIAL 27 a 26

window.CRMKanbanUI = (() => {

  // =====================================================
  // ESTADO DA UI
  // =====================================================

  const uiState = {
    container: null,
    fullscreenContainer: null,
    draggedCard: null,
    isRendering: false
  };

  // =====================================================
  // CRIAÇÃO DA INTERFACE PRINCIPAL
  // =====================================================

  function criarInterfaceKanban(container) {
    if (!container) {
      console.error('❌ Container não fornecido para o Kanban');
      return null;
    }

    // Verifica se o Core está inicializado
    if (!window.CRMKanbanCore?.isInitialized) {
      console.error('❌ CRMKanbanCore não está inicializado');
      window.CRMUI?.mostrarNotificacao('Erro: Módulo Kanban Core não inicializado.', 'error');
      return null;
    }

    console.log('🎨 Criando interface do Kanban...');

    // Limpa container
    container.innerHTML = '';
    container.className = 'crm-kanban-board';
    uiState.container = container;

    // Header do Kanban
    const header = criarHeaderKanban();
    container.appendChild(header);

    // Barra de indicadores
    const indicadores = criarBarraIndicadores();
    container.appendChild(indicadores);

    // Container das colunas
    const colunasContainer = document.createElement('div');
    colunasContainer.className = 'kanban-columns';
    container.appendChild(colunasContainer);

    // Renderiza colunas
    renderizarColunas(colunasContainer);

    // Configura eventos globais
    configurarEventosGlobais();

    // Atualiza display do ciclo
    atualizarDisplayCiclo();
    atualizarIndicadores();

    console.log('✅ Interface do Kanban criada');
    return container;
  }

  function criarHeaderKanban() {
    const header = document.createElement('div');
    header.className = 'kanban-header-novo';

    header.innerHTML = `
      <div class="header-brand">
        <div class="crm-logo">🚀</div>
        <h1 class="crm-title">CRM Vision Pro</h1>
      </div>

      <div class="header-left">
        <div class="search-premium">
          <span class="search-icon">🔍</span>
          <input type="text"
            id="kanban-search-input"
            placeholder="Buscar cliente..."
            autocomplete="off">
        </div>
      </div>

      <div class="header-right">
        <div class="menu-principal">
          <button id="menu-acoes-btn" type="button">
            <span>⚙️</span>
            <span>Menu</span>
            <span style="font-size: 10px;">▼</span>
          </button>

          <div id="menu-dropdown">
            <div class="menu-item" data-action="ciclo">
              <span>📊</span>
              <span>Ciclo Comercial</span>
            </div>
            <div class="menu-item" data-action="sheets">
              <span>📋</span>
              <span>Google Sheets</span>
            </div>
            <div class="menu-item" data-action="nova-coluna">
              <span>➕</span>
              <span>Nova Coluna</span>
            </div>
            <div class="menu-item" data-action="fechar" style="border-top: 1px solid #e5e7eb; margin-top: 4px; padding-top: 8px;">
              <span>✕</span>
              <span>Fechar</span>
            </div>
          </div>
        </div>

        <button class="close-crm-btn" type="button" id="btn-fechar-crm" style="
          background: #ef4444;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 4px;
        ">
          <span>❌</span>
          <span>Fechar</span>
        </button>
      </div>
    `;

    // Configura eventos do header
    configurarEventosHeader(header);

    return header;
  }

  // =====================================================
  // BARRA DE INDICADORES - CORRIGIDA
  // =====================================================

  function criarBarraIndicadores() {
    const barra = document.createElement('div');
    barra.className = 'indicadores-dashboard';
    barra.innerHTML = `
      <div class="indicadores-container">
        <div class="indicador-item">
          <div class="indicador-icon">💰</div>
          <div class="indicador-content">
            <div class="indicador-label">Adesão</div>
            <div class="indicador-value" id="indicador-mensalidades">R$ 0</div>
          </div>
        </div>

        <div class="indicador-separator"></div>

        <div class="indicador-item">
          <div class="indicador-icon">💸</div>
          <div class="indicador-content">
            <div class="indicador-label">Gordurinha</div>
            <div class="indicador-value" id="indicador-gordurinha">R$ 0</div>
          </div>
        </div>

        <div class="indicador-separator"></div>

        <div class="indicador-item">
          <div class="indicador-icon">🏷️</div>
          <div class="indicador-content">
            <div class="indicador-label">Vendas</div>
            <div class="indicador-value" id="vendas-meta-display">0/12</div>
          </div>
        </div>

        <div class="indicador-separator"></div>

        <div class="indicador-item">
          <div class="indicador-icon">📅</div>
          <div class="indicador-content">
            <div class="indicador-label">Dias Restantes</div>
            <div class="indicador-value" id="dias-restantes-display">--</div>
          </div>
        </div>

        <div class="indicador-separator"></div>

        <div class="indicador-item indicador-meta">
          <div class="indicador-icon">🎯</div>
          <div class="indicador-content">
            <div class="indicador-label">Meta</div>
            <div class="indicador-value" id="indicador-meta">0%</div>
            <div class="indicador-progress">
              <div class="indicador-progress-fill" id="progress-bar-meta"></div>
            </div>
          </div>
        </div>

        <div class="indicador-separator"></div>

        <div class="indicador-item">
          <div class="indicador-icon">📅</div>
          <div class="indicador-content">
            <div class="indicador-label">Ciclo</div>
            <div class="indicador-value" id="periodo-ciclo-compact">--/-- a --/--</div>
          </div>
        </div>
      </div>
    `;

    return barra;
  }

  // =====================================================
  // ATUALIZAR INDICADORES - CORRIGIDO PARA CICLO 27-26
  // =====================================================

  function atualizarIndicadores() {
    if (!window.CRMKanbanCore) return;

    const metricas = window.CRMKanbanCore.calcularMetricasKanban();
    
    // Atualiza adesão (era mensalidades)
    const mensalidadesEl = document.getElementById('indicador-mensalidades');
    if (mensalidadesEl) {
      mensalidadesEl.textContent = formatarMoeda(metricas.totalAdesao || 0);
    }

    // Atualiza gordurinha
    const gordurinhaEl = document.getElementById('indicador-gordurinha');
    if (gordurinhaEl) {
      gordurinhaEl.textContent = formatarMoeda(metricas.totalGordurinha || 0);
    }

    // Atualiza vendas/meta
    const meta = window.CRMCicloComercial?.getMeta() || 12;
    const vendasFechadas = metricas.vendasFechadas || 0;
    const progressoMeta = Math.min(Math.round((vendasFechadas / meta) * 100), 100);

    const vendasDisplay = document.getElementById('vendas-meta-display');
    if (vendasDisplay) {
      vendasDisplay.textContent = `${vendasFechadas}/${meta}`;
    }

    // Calcula e mostra dias restantes usando o módulo unificado de ciclo comercial
    const diasRestantesEl = document.getElementById('dias-restantes-display');
    if (diasRestantesEl) {
      const ciclo = window.CRMCicloComercial?.getCicloAtual?.() ||
                    window.CRMCicloComercial?.calcularCicloComercial?.();
      const diasRestantes = ciclo?.diasRestantes ?? 0;
      diasRestantesEl.textContent = `${diasRestantes} dias restantes`;

      // Adiciona cores de alerta baseado nos dias restantes
      if (diasRestantes <= 3) {
        diasRestantesEl.style.color = '#ef4444'; // vermelho
      } else if (diasRestantes <= 5) {
        diasRestantesEl.style.color = '#f59e0b'; // laranja
      } else {
        diasRestantesEl.style.color = ''; // cor padrão
      }
    }

    // Atualiza meta com porcentagem
    const metaEl = document.getElementById('indicador-meta');
    if (metaEl) {
      metaEl.textContent = `${progressoMeta}%`;
    }

    // Atualiza barra de progresso
    const progressBar = document.getElementById('progress-bar-meta');
    if (progressBar) {
      progressBar.style.width = `${progressoMeta}%`;
    }

    // Atualiza período do ciclo (27 a 26) usando o módulo de ciclo comercial
    if (window.CRMCicloComercial || true) { // Sempre mostra o período mesmo sem o módulo
      const periodoEl = document.getElementById('periodo-ciclo-compact');
      if (periodoEl) {
        const ciclo = window.CRMCicloComercial?.getCicloAtual?.() ||
                      window.CRMCicloComercial?.calcularCicloComercial?.();

        const inicio = ciclo?.inicio?.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        const fim = ciclo?.fim?.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        periodoEl.textContent = `${inicio} - ${fim}`;
      }
    }
  }

  // =====================================================
  // RENDERIZAÇÃO DE COLUNAS E CARDS
  // =====================================================

  function renderizarColunas(container) {
    if (uiState.isRendering) {
      console.warn('⚠️ Renderização já em andamento');
      return;
    }
    uiState.isRendering = true;

    try {
      console.log('🎨 Renderizando colunas...');

      const colunas = window.CRMKanbanCore.colunas;
      container.innerHTML = '';

      if (!colunas || colunas.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 50px; color: #9ca3af;">
            <p style="font-size: 2em;">😔</p>
            <p>Nenhuma coluna encontrada. Adicione uma nova coluna para começar!</p>
            <button class="add-column-btn" style="
              margin-top: 20px;
              background: #6366f1;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 16px;
            ">
              <span>➕ Adicionar Coluna</span>
            </button>
          </div>
        `;
        const btn = container.querySelector('.add-column-btn');
        if (btn) {
          btn.addEventListener('click', mostrarFormularioNovaColuna);
        }
        return;
      }

      // Renderiza cada coluna
      colunas.forEach((coluna) => {
        const colunaEl = criarElementoColuna(coluna);
        container.appendChild(colunaEl);
      });

      // Botão para adicionar nova coluna
      const addColBtn = document.createElement('div');
      addColBtn.className = 'kanban-add-column';
      addColBtn.innerHTML = `
        <button class="add-column-btn">
          <span style="font-size: 24px;">➕</span>
          <span>Adicionar Coluna</span>
        </button>
      `;

      const btnElement = addColBtn.querySelector('button');
      btnElement.addEventListener('click', mostrarFormularioNovaColuna);
      container.appendChild(addColBtn);

      // Atualiza contadores e indicadores
      atualizarContadores();
      atualizarIndicadores();

      console.log('✅ Colunas renderizadas');
    } catch (error) {
      console.error('❌ Erro ao renderizar colunas:', error);
      window.CRMUI?.mostrarNotificacao('Erro ao renderizar colunas', 'error');
    } finally {
      uiState.isRendering = false;
    }
  }

  function criarElementoColuna(colunaData) {
    const coluna = document.createElement('div');
    coluna.className = 'kanban-column';
    coluna.dataset.colunaId = colunaData.id;
    coluna.style.borderTopColor = colunaData.color || '#6366f1';

    // Header da coluna
    const columnHeader = document.createElement('div');
    columnHeader.className = 'column-header';
    columnHeader.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h3>${colunaData.title} <span class="card-count">${colunaData.clients.length}</span></h3>
        <div style="display: flex; gap: 4px;">
          <button class="column-btn" data-action="editar-coluna" title="Editar" style="background: none; border: none; font-size: 14px; cursor: pointer; color: #6b7280;">✏️</button>
          <button class="column-btn" data-action="cor-coluna" title="Cor" style="background: none; border: none; font-size: 14px; cursor: pointer; color: #6b7280;">🎨</button>
          <button class="column-btn delete-column" data-action="excluir-coluna" title="Excluir" style="background: none; border: none; font-size: 14px; cursor: pointer; color: #ef4444;">🗑️</button>
        </div>
      </div>
    `;

    coluna.appendChild(columnHeader);

    // Container dos cards
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'column-cards';
    cardsContainer.dataset.colunaId = colunaData.id;

    // Renderiza cards da coluna
    colunaData.clients.forEach(clientId => {
      const clientData = window.CRMKanbanCore.obterClientePorId(clientId);
      if (clientData) {
        const card = criarElementoCard(clientData);
        cardsContainer.appendChild(card);
      }
    });

    // Se a coluna estiver vazia
    if (colunaData.clients.length === 0) {
      cardsContainer.innerHTML = `
        <div class="column-empty" style="text-align: center; padding: 20px; color: #9ca3af;">
          <div style="font-size: 2em;">📋</div>
          <div style="margin-top: 8px; font-size: 0.875rem;">Arraste clientes aqui</div>
        </div>
      `;
    }

    coluna.appendChild(cardsContainer);

    // Configura drag and drop
    configurarDragDropColuna(cardsContainer);

    // Configura eventos da coluna
    configurarEventosColuna(coluna);

    return coluna;
  }

  function criarElementoCard(clientData) {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.dataset.clientId = clientData.id;
    card.draggable = true;

    // Verifica se tem vendas fechadas
    const temVendaFechada = (clientData.deals || []).some(deal => deal.status === 'fechado');
    if (temVendaFechada) {
      card.classList.add('venda-fechada');
      card.draggable = false;
    }

    const totalAdesao = (clientData.deals || []).reduce((sum, deal) => sum + (deal.valor_adesao || 0), 0);
    const totalGordurinha = (clientData.deals || []).reduce((sum, deal) => sum + (deal.valor_gordurinha || 0), 0);

    card.innerHTML = `
      <div class="card-header">
        <img src="${clientData.photo || clientData.imagem || getDefaultAvatar()}"
             class="card-avatar" alt="${clientData.nome}">
        <div class="card-info">
          <h4 class="card-name">${clientData.nome}</h4>
          <p class="card-phone">${clientData.telefone || 'Sem telefone'}</p>
        </div>
        <button class="card-menu-btn" style="background: none; border: none; font-size: 16px; cursor: pointer; color: #9ca3af;">⋮</button>
      </div>

      ${clientData.tags?.length ? `
        <div class="card-tags">
          ${clientData.tags.slice(0, 2).map(tag => `
            <span class="card-tag">${getTagEmoji(tag)} ${tag}</span>
          `).join('')}
          ${clientData.tags.length > 2 ? `<span class="card-tag">+${clientData.tags.length - 2}</span>` : ''}
        </div>
      ` : ''}

      <div class="card-metrics">
        <div class="metric">
          <div class="metric-label">Adesão</div>
          <div class="metric-value">R$ ${totalAdesao.toLocaleString('pt-BR')}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Gordurinha</div>
          <div class="metric-value">R$ ${totalGordurinha.toLocaleString('pt-BR')}</div>
        </div>
      </div>

      <div class="card-footer">
        <div class="card-actions">
          <button class="card-action" data-action="editar" title="Editar">✏️</button>
          <button class="card-action" data-action="negocio" title="Negócio">💼</button>
          ${temVendaFechada ? '' : `<button class="card-action" data-action="finalizar-venda" title="Finalizar Venda">✅</button>`}
          <button class="card-action" data-action="excluir" title="Excluir">🗑️</button>
        </div>
        <div class="card-priority" style="width: 8px; height: 8px; border-radius: 50%; background: ${getPriorityColor(clientData)}"></div>
      </div>
    `;

    // Configura eventos do card
    configurarEventosCard(card, clientData);

    return card;
  }

  // =====================================================
  // CONFIGURAÇÃO DE EVENTOS - CORRIGIDO
  // =====================================================

  function configurarEventosHeader(header) {
    // Busca - CORRIGIDO PARA BUSCAR APENAS POR NOME
    const searchInput = header.querySelector('#kanban-search-input');
    const menuBtn = header.querySelector('#menu-acoes-btn');
    const dropdown = header.querySelector('#menu-dropdown');
    const fecharBtn = header.querySelector('#btn-fechar-crm');

    // Configurar busca funcionando - APENAS POR NOME
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          const termo = e.target.value.trim();
          aplicarBuscaVisual(termo);
        }, 300);
      });

      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          aplicarBuscaVisual(searchInput.value);
        } else if (e.key === 'Escape') {
          searchInput.value = '';
          aplicarBuscaVisual('');
        }
      });
    }

    // Menu dropdown
    if (menuBtn && dropdown) {
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = dropdown.style.display === 'block';
        dropdown.style.display = isVisible ? 'none' : 'block';
      });

      // Fechar menu ao clicar fora
      document.addEventListener('click', () => {
        if (dropdown) dropdown.style.display = 'none';
      });

      // Eventos dos itens do menu
      dropdown.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = item.dataset.action;
          dropdown.style.display = 'none';
          executarAcaoMenu(action);
        });
      });
    }

    // Botão fechar CRM
    if (fecharBtn) {
      fecharBtn.addEventListener('click', () => {
        fecharKanban();
      });
    }
  }

  // FUNÇÃO DE BUSCA CORRIGIDA - APENAS POR NOME
  function aplicarBuscaVisual(termo) {
    const cards = document.querySelectorAll('.kanban-card');
    let encontrados = 0;

    cards.forEach(card => {
      const nome = card.querySelector('.card-name')?.textContent.toLowerCase() || '';
      
      // BUSCA APENAS POR NOME
      if (!termo || nome.includes(termo.toLowerCase())) {
        card.style.display = '';
        card.style.opacity = '1';
        if (termo) {
          card.style.boxShadow = '0 0 10px rgba(99, 102, 241, 0.5)';
        } else {
          card.style.boxShadow = '';
        }
        encontrados++;
      } else {
        card.style.display = 'none';
      }
    });

    // Atualiza contadores
    atualizarContadores();

    // Mostra notificação
    if (termo) {
      window.CRMUI?.mostrarNotificacao(`🔍 ${encontrados} cliente(s) encontrado(s)`, 'info');
    }
  }

  function configurarEventosCard(card, clientData) {
    // Drag events
    card.addEventListener('dragstart', (e) => {
      // Não permite arrastar cards com venda fechada
      const temVendaFechada = (clientData.deals || []).some(deal => deal.status === 'fechado');
      if (temVendaFechada) {
        e.preventDefault();
        window.CRMUI?.mostrarNotificacao('❌ Clientes com venda fechada não podem ser movidos', 'warning');
        return;
      }

      uiState.draggedCard = card;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      uiState.draggedCard = null;
    });

    // Eventos dos botões do card
    card.querySelectorAll('.card-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        executarAcaoCard(action, clientData.id);
      });
    });

    // Menu do card
    const menuBtn = card.querySelector('.card-menu-btn');
    if (menuBtn) {
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        mostrarMenuCard(clientData.id, menuBtn);
      });
    }
  }

  function configurarEventosColuna(coluna) {
    const botoes = coluna.querySelectorAll('.column-btn');

    botoes.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const colunaId = coluna.dataset.colunaId;
        executarAcaoColuna(action, colunaId);
      });
    });
  }

  function configurarDragDropColuna(container) {
    container.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      container.classList.add('drag-over');
    });

    container.addEventListener('dragleave', (e) => {
      if (!container.contains(e.relatedTarget)) {
        container.classList.remove('drag-over');
      }
    });

    container.addEventListener('drop', (e) => {
      e.preventDefault();
      container.classList.remove('drag-over');

      if (uiState.draggedCard) {
        const oldColumnId = uiState.draggedCard.closest('.column-cards').dataset.colunaId;
        const newColumnId = container.dataset.colunaId;
        const clientId = uiState.draggedCard.dataset.clientId;

        if (oldColumnId !== newColumnId) {
          // Move no Core
          const sucesso = window.CRMKanbanCore.moverCard(clientId, oldColumnId, newColumnId);

          if (sucesso) {
            // Move na UI
            container.appendChild(uiState.draggedCard);

            // Remove estado vazio se existir
            const emptyState = container.querySelector('.column-empty');
            if (emptyState) {
              emptyState.remove();
            }

            atualizarContadores();
            atualizarDisplayCiclo();
            atualizarIndicadores();

            const newColumn = window.CRMKanbanCore.colunas.find(c => c.id === newColumnId);
            window.CRMUI?.mostrarNotificacao(`✅ Card movido para ${newColumn?.title || 'nova coluna'}`, 'success');
          }
        }
      }
    });
  }

  function configurarEventosGlobais() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'f' && document.querySelector('.crm-kanban-board')) {
        e.preventDefault();
        document.querySelector('#kanban-search-input')?.focus();
      }

      if (e.key === 'Escape') {
        const searchInput = document.querySelector('#kanban-search-input');
        if (searchInput && searchInput.value) {
          searchInput.value = '';
          aplicarBuscaVisual('');
        }
      }
    });

    // Atualiza indicadores a cada 30 segundos
    setInterval(() => {
      atualizarIndicadores();
      atualizarDisplayCiclo();
    }, 30000);

    // Verifica alertas a cada 2 minutos
    setInterval(() => {
      verificarEExibirAlertas();
    }, 120000);
    
    // Verifica alertas inicialmente após 5 segundos
    setTimeout(() => {
      verificarEExibirAlertas();
    }, 5000);
  }

  // =====================================================
  // AÇÕES E EVENTOS - CORRIGIDO
  // =====================================================

  function executarAcaoMenu(action) {
    console.log(`🎯 Executando ação do menu: ${action}`);

    switch (action) {
      case 'ciclo':
        abrirPainelCicloComercial();
        break;
      case 'sheets':
        abrirGoogleSheets();
        break;
      case 'nova-coluna':
        mostrarFormularioNovaColuna();
        break;
      case 'fechar':
        fecharKanban();
        break;
    }
  }

  function executarAcaoCard(action, clientId) {
    console.log(`🎯 Executando ação do card: ${action} para cliente ${clientId}`);

    switch (action) {
      case 'editar':
        mostrarFormularioEdicaoCliente(clientId);
        break;
      case 'negocio':
        mostrarFormularioNovoNegocio(clientId);
        break;
      case 'finalizar-venda':
        finalizarVenda(clientId);
        break;
      case 'excluir':
        confirmarExclusaoCliente(clientId);
        break;
    }
  }

  // Função corrigida para executar ações da coluna
  async function executarAcaoColuna(action, colunaId) {
    console.log(`🎯 Executando ação da coluna: ${action} para coluna ${colunaId}`);

    switch (action) {
      case 'editar-coluna':
        const coluna = window.CRMKanbanCore.colunas.find(col => col.id === colunaId);
        if (coluna) {
          const novoTitulo = await window.CRMUI?.prompt({
            titulo: 'Editar Coluna',
            mensagem: 'Novo título para a coluna:',
            valorInicial: coluna.title
          });

          if (novoTitulo && novoTitulo.trim() !== '') {
            window.CRMKanbanCore.atualizarColuna(colunaId, { title: novoTitulo.trim() });
            
            // Atualiza apenas o título da coluna
            const colunaEl = document.querySelector(`[data-coluna-id="${colunaId}"]`);
            if (colunaEl) {
              const h3 = colunaEl.querySelector('h3');
              if (h3) {
                const count = h3.querySelector('.card-count')?.textContent || '0';
                h3.innerHTML = `${novoTitulo.trim()} <span class="card-count">${count}</span>`;
              }
            }
            
            window.CRMUI?.mostrarNotificacao('✅ Coluna atualizada!', 'success');
          }
        }
        break;

      case 'cor-coluna':
        mostrarSeletorCor(colunaId);
        break;

      case 'excluir-coluna':
        const confirmar = await window.CRMUI?.confirmar({
          titulo: 'Excluir Coluna',
          mensagem: 'Tem certeza que deseja excluir esta coluna? Os clientes serão movidos para a primeira coluna.',
          tipo: 'danger'
        });

        if (confirmar) {
          window.CRMKanbanCore.removerColuna(colunaId);
          renderizarColunas(document.querySelector('.kanban-columns'));
          window.CRMUI?.mostrarNotificacao('✅ Coluna excluída!', 'success');
        }
        break;
    }
  }

  // =====================================================
  // FUNÇÕES DE VENDA COM ANIMAÇÃO - CORRIGIDO
  // =====================================================

  async function finalizarVenda(clientId) {
    const cliente = window.CRMKanbanCore.obterClientePorId(clientId);
    if (!cliente) {
      window.CRMUI?.mostrarNotificacao('❌ Cliente não encontrado', 'error');
      return;
    }

    const confirmar = await window.CRMUI?.confirmar({
      titulo: '🎉 Finalizar Venda',
      mensagem: `Confirma a finalização da venda para ${cliente.nome}?`,
      textoBotaoConfirmar: 'Sim, Finalizar Venda',
      tipo: 'success'
    });

    if (confirmar) {
      // Marca todos os deals como fechados
      if (cliente.deals && cliente.deals.length > 0) {
        cliente.deals.forEach(deal => {
          deal.status = 'fechado';
          deal.dataFechamento = new Date().toISOString();
        });
      } else {
        // Se não tem deals, cria um automaticamente
        window.CRMKanbanCore.adicionarNegocio(clientId, {
          titulo: 'Venda Finalizada',
          valor_adesao: 0,
          valor_gordurinha: 0,
          status: 'fechado',
          probabilidade: 100,
          observacoes: 'Venda finalizada manualmente'
        });
      }

      // Move para coluna de sucesso
      const colunaAtual = window.CRMKanbanCore.colunas.find(col =>
        col.clients.includes(clientId)
      );
      const colunaSucesso = window.CRMKanbanCore.colunas.find(col =>
        col.id === 'success' || col.title.toLowerCase().includes('sucesso')
      );

      if (colunaAtual && colunaSucesso && colunaAtual.id !== colunaSucesso.id) {
        window.CRMKanbanCore.moverCard(clientId, colunaAtual.id, colunaSucesso.id);
      }

      // Atualiza cliente
      window.CRMKanbanCore.atualizarCliente(clientId, { vendaFinalizada: true });

      // CORREÇÃO: ADICIONA ANIMAÇÃO DE CONFETE AQUI
      criarAnimacaoConfete();

      // Popup de sucesso
      mostrarPopupSucesso();

      // Renderiza novamente
      setTimeout(() => {
        renderizarColunas(document.querySelector('.kanban-columns'));
        atualizarDisplayCiclo();
        atualizarIndicadores();
      }, 500);

      // Sincroniza com Google Sheets apenas este cliente
      if (window.CRMGoogleSheets?.isEnabled()) {
        setTimeout(() => {
          window.CRMGoogleSheets.syncCliente(clientId);
        }, 1000);
      }
    }
  }

  // =====================================================
  // ANIMAÇÕES
  // =====================================================

  function criarAnimacaoConfete() {
    const container = document.createElement('div');
    container.className = 'confetti-container';
    
    // Cria 50 confetes
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.animationDelay = Math.random() * 3 + 's';
      confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
      container.appendChild(confetti);
    }
    
    document.body.appendChild(container);
    
    // Remove após animação
    setTimeout(() => {
      container.remove();
    }, 3000);
  }

  function mostrarPopupSucesso() {
    const popup = document.createElement('div');
    popup.className = 'success-popup';
    popup.innerHTML = `
      <h3>🎉 Parabéns!</h3>
      <p>Venda registrada com sucesso.</p>
    `;
    
    document.body.appendChild(popup);
    
    // Remove após 3 segundos
    setTimeout(() => {
      popup.style.animation = 'popup-in 0.5s ease reverse';
      setTimeout(() => popup.remove(), 500);
    }, 3000);
  }

  // =====================================================
  // SISTEMA DE ALERTAS
  // =====================================================

  function verificarEExibirAlertas() {
    const alertas = [];
    
    // Verifica dias restantes no ciclo
    const hoje = new Date();
    const diaAtual = hoje.getDate();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    
    let diasRestantesQuinzena;
    if (diaAtual >= 27 || diaAtual <= 11) {
      // Primeira quinzena (27 a 11)
      if (diaAtual >= 27) {
        const dia11 = new Date(anoAtual, mesAtual + 1, 11, 23, 59, 59);
        diasRestantesQuinzena = Math.ceil((dia11 - hoje) / (1000 * 60 * 60 * 24));
      } else {
        const dia11 = new Date(anoAtual, mesAtual, 11, 23, 59, 59);
        diasRestantesQuinzena = Math.ceil((dia11 - hoje) / (1000 * 60 * 60 * 24));
      }
    } else {
      // Segunda quinzena (12 a 26)
      let fimCiclo;
      if (diaAtual < 27) {
        fimCiclo = new Date(anoAtual, mesAtual, 26, 23, 59, 59);
      } else {
        fimCiclo = new Date(anoAtual, mesAtual + 1, 26, 23, 59, 59);
      }
      diasRestantesQuinzena = Math.ceil((fimCiclo - hoje) / (1000 * 60 * 60 * 24));
    }
    
    // Alerta de poucos dias restantes
    if (diasRestantesQuinzena <= 3 && diasRestantesQuinzena > 0) {
      const metricas = window.CRMKanbanCore?.calcularMetricasKanban() || {};
      const meta = window.CRMCicloComercial?.getMeta() || 12;
      const vendasFechadas = metricas.vendasFechadas || 0;
      const metaQuinzenal = Math.ceil(meta / 2); // Meta por quinzena
      
      if (vendasFechadas < metaQuinzenal) {
        alertas.push({
          icone: '⚠️',
          titulo: 'Meta em Risco',
          mensagem: `Faltam apenas ${diasRestantesQuinzena} dias na quinzena. Meta: ${metaQuinzenal} vendas, atual: ${vendasFechadas}`,
          tipo: 'warning'
        });
      }
    }
    
    // Verifica clientes sem interação (exemplo básico)
    if (window.CRMKanbanCore?.clientes) {
      const clientesInativos = [];
      Object.values(window.CRMKanbanCore.clientes).forEach(cliente => {
        // Por enquanto, vamos considerar apenas clientes sem deals
        if (!cliente.deals || cliente.deals.length === 0) {
          clientesInativos.push(cliente.nome);
        }
      });
      
      if (clientesInativos.length > 3) {
        alertas.push({
          icone: '📋',
          titulo: 'Clientes sem Negociação',
          mensagem: `${clientesInativos.length} clientes ainda não têm negociações abertas`,
          tipo: 'info'
        });
      }
    }
    
    // Exibe alertas se houver
    if (alertas.length > 0) {
      mostrarAlertas(alertas);
    }
  }

  // =====================================================
  // FORMULÁRIOS E MODAIS
  // =====================================================

  function mostrarFormularioEdicaoCliente(clientId) {
    const cliente = window.CRMKanbanCore.obterClientePorId(clientId);
    if (!cliente) {
      window.CRMUI?.mostrarNotificacao('❌ Cliente não encontrado', 'error');
      return;
    }

    const conteudo = `
      <div style="padding: 20px;">
        <form id="form-editar-cliente">
          <div class="form-field" style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 4px; font-weight: 500;">Nome Completo *</label>
            <input type="text" name="nome" value="${cliente.nome || ''}" required
                   style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
          </div>

          <div class="form-field" style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 4px; font-weight: 500;">Telefone *</label>
            <input type="tel" name="telefone" value="${cliente.telefone || ''}" required
                   style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
          </div>

          <div class="form-field" style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 4px; font-weight: 500;">Email</label>
            <input type="email" name="email" value="${cliente.email || ''}"
                   style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
          </div>

          <div class="form-field" style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 4px; font-weight: 500;">Origem</label>
            <select name="origem" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
              <option value="whatsapp" ${cliente.origem === 'whatsapp' ? 'selected' : ''}>WhatsApp</option>
              <option value="indicacao" ${cliente.origem === 'indicacao' ? 'selected' : ''}>Indicação</option>
              <option value="site" ${cliente.origem === 'site' ? 'selected' : ''}>Site</option>
              <option value="instagram" ${cliente.origem === 'instagram' ? 'selected' : ''}>Instagram</option>
              <option value="facebook" ${cliente.origem === 'facebook' ? 'selected' : ''}>Facebook</option>
            </select>
          </div>

          <div class="form-field" style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 4px; font-weight: 500;">Tags</label>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <label style="display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" name="tags" value="potencial-alto" ${cliente.tags?.includes('potencial-alto') ? 'checked' : ''}>
                <span>🔥 Potencial Alto</span>
              </label>
              <label style="display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" name="tags" value="urgente" ${cliente.tags?.includes('urgente') ? 'checked' : ''}>
                <span>⚡ Urgente</span>
              </label>
              <label style="display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" name="tags" value="retorno" ${cliente.tags?.includes('retorno') ? 'checked' : ''}>
                <span>🔄 Retorno</span>
              </label>
              <label style="display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" name="tags" value="vip" ${cliente.tags?.includes('vip') ? 'checked' : ''}>
                <span>⭐ VIP</span>
              </label>
            </div>
          </div>

          <div class="form-field">
            <label style="display: block; margin-bottom: 4px; font-weight: 500;">Observações</label>
            <textarea name="observacoes" rows="3"
                      style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; resize: vertical;">${cliente.observacoes || ''}</textarea>
          </div>
        </form>
      </div>
    `;

    const modal = window.CRMUI?.criarModal({
      titulo: '✏️ Editar Cliente',
      conteudo: conteudo,
      tamanho: 'medium',
      acoes: [
        {
          id: 'cancelar',
          texto: 'Cancelar',
          tipo: 'secondary',
          onClick: () => modal.fechar()
        },
        {
          id: 'salvar',
          texto: '💾 Salvar Alterações',
          tipo: 'primary',
          onClick: () => {
            const form = document.getElementById('form-editar-cliente');
            const formData = new FormData(form);

            const dadosAtualizados = {
              nome: formData.get('nome'),
              telefone: formData.get('telefone'),
              email: formData.get('email') || '',
              origem: formData.get('origem'),
              observacoes: formData.get('observacoes') || '',
              tags: Array.from(formData.getAll('tags'))
            };

            window.CRMKanbanCore.atualizarCliente(clientId, dadosAtualizados);

            // Recarrega o card
            const cardElement = document.querySelector(`[data-client-id="${clientId}"]`);
            if (cardElement) {
              const clienteAtualizado = window.CRMKanbanCore.obterClientePorId(clientId);
              const newCard = criarElementoCard(clienteAtualizado);
              cardElement.parentNode.replaceChild(newCard, cardElement);
            }

            atualizarIndicadores();
            window.CRMUI?.mostrarNotificacao('✅ Cliente atualizado!', 'success');
            modal.fechar();
          }
        }
      ]
    });
  }

  function mostrarFormularioNovoNegocio(clientId) {
    const cliente = window.CRMKanbanCore.obterClientePorId(clientId);
    if (!cliente) {
      window.CRMUI?.mostrarNotificacao('❌ Cliente não encontrado', 'error');
      return;
    }

    const conteudo = `
      <div style="padding: 20px;">
        <div style="margin-bottom: 20px; padding: 16px; background: #f9fafb; border-radius: 8px;">
          <h4 style="margin: 0 0 8px 0;">👤 ${cliente.nome}</h4>
          <p style="margin: 0; color: #6b7280;">${cliente.telefone}</p>
        </div>

        <form id="form-novo-negocio">
          <div class="form-field" style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 4px; font-weight: 500;">Título do Negócio *</label>
            <input type="text" name="titulo" required placeholder="Ex: Proposta Academia Premium"
                   style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div>
              <label style="display: block; margin-bottom: 4px; font-weight: 500;">Valor Adesão *</label>
              <input type="number" name="valor_adesao" step="0.01" required placeholder="0,00"
                     style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
            </div>

            <div>
              <label style="display: block; margin-bottom: 4px; font-weight: 500;">Valor Gordurinha</label>
              <input type="number" name="valor_gordurinha" step="0.01" placeholder="0,00"
                     style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
            </div>
          </div>

          <div class="form-field">
            <label style="display: block; margin-bottom: 4px; font-weight: 500;">Observações</label>
            <textarea name="observacoes" rows="3" placeholder="Detalhes da negociação..."
                      style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; resize: vertical;"></textarea>
          </div>
        </form>
      </div>
    `;

    const modal = window.CRMUI?.criarModal({
      titulo: '💼 Novo Negócio',
      conteudo: conteudo,
      tamanho: 'medium',
      acoes: [
        {
          id: 'cancelar',
          texto: 'Cancelar',
          tipo: 'secondary',
          onClick: () => modal.fechar()
        },
        {
          id: 'criar',
          texto: '💼 Criar Negócio',
          tipo: 'primary',
          onClick: () => {
            const form = document.getElementById('form-novo-negocio');
            const formData = new FormData(form);

            const dadosNegocio = {
              titulo: formData.get('titulo'),
              valor_adesao: parseFloat(formData.get('valor_adesao')) || 0,
              valor_gordurinha: parseFloat(formData.get('valor_gordurinha')) || 0,
              status: 'em_negociacao',
              probabilidade: 50,
              observacoes: formData.get('observacoes') || ''
            };

            window.CRMKanbanCore.adicionarNegocio(clientId, dadosNegocio);

            // Recarrega o card
            const cardElement = document.querySelector(`[data-client-id="${clientId}"]`);
            if (cardElement) {
              const clienteAtualizado = window.CRMKanbanCore.obterClientePorId(clientId);
              const newCard = criarElementoCard(clienteAtualizado);
              cardElement.parentNode.replaceChild(newCard, cardElement);
            }

            atualizarDisplayCiclo();
            atualizarIndicadores();
            window.CRMUI?.mostrarNotificacao('💼 Negócio criado!', 'success');
            modal.fechar();

            // Sincroniza com Google Sheets apenas este cliente
            if (window.CRMGoogleSheets?.isEnabled()) {
              setTimeout(() => {
                window.CRMGoogleSheets.syncCliente(clientId);
              }, 500);
            }
          }
        }
      ]
    });
  }

  function mostrarFormularioNovaColuna() {
    const conteudo = `
      <form id="form-nova-coluna" style="padding: 20px;">
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 4px; font-weight: 500;">Nome da Coluna</label>
          <input type="text" name="titulo" required placeholder="Ex: Em Negociação"
                 style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
        </div>

        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 500;">Cor da Coluna</label>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
            ${['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'].map((cor, index) => `
              <label style="position: relative; cursor: pointer;">
                <input type="radio" name="cor" value="${cor}" ${index === 0 ? 'checked' : ''} style="position: absolute; opacity: 0;">
                <div style="width: 40px; height: 40px; background: ${cor}; border-radius: 6px; border: 2px solid ${index === 0 ? '#111827' : 'transparent'};" class="color-box" data-color="${cor}"></div>
              </label>
            `).join('')}
          </div>
        </div>
      </form>
    `;

    const modal = window.CRMUI?.criarModal({
      titulo: 'Nova Coluna',
      conteudo: conteudo,
      tamanho: 'small',
      acoes: [
        {
          id: 'cancelar',
          texto: 'Cancelar',
          tipo: 'secondary',
          onClick: () => modal.fechar()
        },
        {
          id: 'criar',
          texto: 'Criar',
          tipo: 'primary',
          onClick: () => {
            const form = document.getElementById('form-nova-coluna');
            const formData = new FormData(form);

            const dadosColuna = {
              title: formData.get('titulo'),
              color: formData.get('cor')
            };

            window.CRMKanbanCore.adicionarColuna(dadosColuna);
            renderizarColunas(document.querySelector('.kanban-columns'));
            window.CRMUI?.mostrarNotificacao('✅ Coluna criada!', 'success');
            modal.fechar();
          }
        }
      ]
    });

    // Eventos dos color boxes
    setTimeout(() => {
      document.querySelectorAll('.color-box').forEach(box => {
        box.addEventListener('click', () => {
          document.querySelectorAll('.color-box').forEach(b => b.style.borderColor = 'transparent');
          box.style.borderColor = '#111827';
        });
      });
    }, 100);
  }

  async function confirmarExclusaoCliente(clientId) {
    const cliente = window.CRMKanbanCore.obterClientePorId(clientId);
    if (!cliente) return;

    const confirmar = await window.CRMUI?.confirmar({
      titulo: 'Excluir Cliente',
      mensagem: `Tem certeza que deseja excluir "${cliente.nome}"? Esta ação não pode ser desfeita.`,
      tipo: 'danger'
    });

    if (confirmar) {
      window.CRMKanbanCore.removerCliente(clientId);

      // Remove da UI
      const card = document.querySelector(`[data-client-id="${clientId}"]`);
      if (card) {
        card.style.transition = 'all 0.3s ease';
        card.style.transform = 'scale(0)';
        card.style.opacity = '0';
        setTimeout(() => card.remove(), 300);
      }

      atualizarContadores();
      atualizarIndicadores();
      window.CRMUI?.mostrarNotificacao('✅ Cliente excluído!', 'success');
    }
  }

  // =====================================================
  // FUNÇÕES AUXILIARES
  // =====================================================

  function atualizarContadores() {
    document.querySelectorAll('.kanban-column').forEach(colunaEl => {
      const visibleCards = colunaEl.querySelectorAll('.kanban-card:not([style*="display: none"])');
      const countEl = colunaEl.querySelector('.card-count');
      if (countEl) {
        countEl.textContent = visibleCards.length;
      }

      // Adiciona estado vazio se necessário
      const cardsContainer = colunaEl.querySelector('.column-cards');
      const hasEmptyState = cardsContainer.querySelector('.column-empty');

      if (visibleCards.length === 0 && !hasEmptyState) {
        cardsContainer.innerHTML = `
          <div class="column-empty" style="text-align: center; padding: 20px; color: #9ca3af;">
            <div style="font-size: 2em;">📋</div>
            <div style="margin-top: 8px; font-size: 0.875rem;">Arraste clientes aqui</div>
          </div>
        `;
      } else if (visibleCards.length > 0 && hasEmptyState) {
        hasEmptyState.remove();
      }
    });
  }

  function atualizarDisplayCiclo() {
    if (!window.CRMKanbanCore) return;

    const metricas = window.CRMKanbanCore.calcularMetricasKanban();
    const meta = window.CRMCicloComercial?.getMeta() || 12;

    const vendasDisplay = document.getElementById('vendas-meta-display');
    if (vendasDisplay) {
      vendasDisplay.textContent = `${metricas.vendasFechadas}/${meta}`;
    }

    const progressoDisplay = document.getElementById('progresso-display');
    if (progressoDisplay) {
      const progresso = Math.round((metricas.vendasFechadas / meta) * 100);
      progressoDisplay.textContent = `${progresso}%`;
    }
    
    // Atualiza a barra de progresso também
    const progressBar = document.getElementById('progress-bar-meta');
    if (progressBar) {
      const progresso = Math.round((metricas.vendasFechadas / meta) * 100);
      progressBar.style.width = `${Math.min(progresso, 100)}%`;
    }
  }

  // =====================================================
  // FUNÇÕES AUXILIARES DE UI
  // =====================================================

  function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }

  // Função corrigida do seletor de cor
  function mostrarSeletorCor(colunaId) {
    const coluna = window.CRMKanbanCore.colunas.find(col => col.id === colunaId);
    if (!coluna) return;

    const cores = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];

    const conteudo = `
      <div style="padding: 20px;">
        <p style="margin-bottom: 16px;">Selecione uma cor para a coluna "${coluna.title}":</p>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
          ${cores.map(cor => `
            <button class="color-option" data-color="${cor}" style="
              width: 60px;
              height: 60px;
              background: ${cor};
              border: 3px solid ${cor === coluna.color ? '#1e293b' : 'transparent'};
              border-radius: 8px;
              cursor: pointer;
              transition: all 0.2s;
            "></button>
          `).join('')}
        </div>
      </div>
    `;

    const modal = window.CRMUI?.criarModal({
      titulo: '🎨 Escolher Cor',
      conteudo: conteudo,
      tamanho: 'small',
      acoes: [
        {
          id: 'fechar',
          texto: 'Fechar',
          tipo: 'primary',
          onClick: () => modal.fechar()
        }
      ]
    });

    // Eventos das cores
    setTimeout(() => {
      document.querySelectorAll('.color-option').forEach(btn => {
        btn.addEventListener('click', () => {
          const novaCor = btn.dataset.color;
          
          // Atualiza no Core
          window.CRMKanbanCore.atualizarColuna(colunaId, { color: novaCor });

          // Atualiza visualmente imediatamente
          const colunaEl = document.querySelector(`[data-coluna-id="${colunaId}"]`);
          if (colunaEl) {
            colunaEl.style.borderTopColor = novaCor;
          }

          window.CRMUI?.mostrarNotificacao('✅ Cor atualizada!', 'success');
          modal.fechar();
        });
      });
    }, 100);
  }

  function mostrarMenuCard(clientId, btnElement) {
    // Remove menu existente
    const menuExistente = document.querySelector('.card-menu-dropdown');
    if (menuExistente) menuExistente.remove();

    const menu = document.createElement('div');
    menu.className = 'card-menu-dropdown';
    menu.style.cssText = `
      position: absolute;
      top: ${btnElement.offsetTop + btnElement.offsetHeight}px;
      right: 10px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      min-width: 180px;
      z-index: 1000;
      overflow: hidden;
    `;

    menu.innerHTML = `
      <div class="menu-item" data-action="whatsapp" style="padding: 12px 16px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
        <span>💬 Abrir WhatsApp</span>
      </div>
    `;

    // Eventos do menu
    menu.querySelectorAll('.menu-item').forEach(item => {
      item.addEventListener('click', () => {
        const action = item.dataset.action;
        if (action === 'whatsapp') {
          const cliente = window.CRMKanbanCore.obterClientePorId(clientId);
          if (cliente?.telefone) {
            window.open(`https://wa.me/${cliente.telefone.replace(/\D/g, '')}`, '_blank');
          }
        }
        menu.remove();
      });
    });

    // Fecha ao clicar fora
    setTimeout(() => {
      document.addEventListener('click', () => menu.remove(), { once: true });
    }, 10);

    btnElement.closest('.kanban-card').appendChild(menu);
  }

  // =====================================================
  // INTEGRAÇÃO COM OUTROS MÓDULOS
  // =====================================================

  function abrirPainelCicloComercial() {
    if (!window.CRMCicloComercial) {
      window.CRMUI?.mostrarNotificacao('❌ Módulo Ciclo Comercial não encontrado', 'error');
      return;
    }

    // Obtém ciclo comercial pelo módulo unificado
    const ciclo = window.CRMCicloComercial?.getCicloAtual?.() ||
                  window.CRMCicloComercial?.calcularCicloComercial?.();
    const inicioCiclo = ciclo?.inicio;
    const fimCiclo = ciclo?.fim;
    const diasRestantesCiclo = ciclo?.diasRestantes ?? 0;
    
    const meta = window.CRMCicloComercial.getMeta();
    const metricas = window.CRMKanbanCore?.calcularMetricasKanban() || {};
    
    const conteudo = `
      <div style="padding: 24px;">
        <h3 style="margin: 0 0 24px 0;">📊 Ciclo Comercial</h3>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
          <div style="background: #f9fafb; padding: 16px; border-radius: 8px; text-align: center;">
            <div style="font-size: 2rem; font-weight: bold; color: #6366f1;">${meta}</div>
            <div style="color: #6b7280; margin-top: 4px;">Meta Mensal</div>
          </div>
          
          <div style="background: #f9fafb; padding: 16px; border-radius: 8px; text-align: center;">
            <div style="font-size: 2rem; font-weight: bold; color: #10b981;">${metricas.vendasFechadas || 0}</div>
            <div style="color: #6b7280; margin-top: 4px;">Vendas Fechadas</div>
          </div>
          
          <div style="background: #f9fafb; padding: 16px; border-radius: 8px; text-align: center;">
            <div style="font-size: 2rem; font-weight: bold; color: #f59e0b;">${diasRestantesCiclo}</div>
            <div style="color: #6b7280; margin-top: 4px;">Dias Restantes</div>
          </div>
        </div>
        
        <div style="margin-top: 24px;">
          <p style="color: #6b7280;">
            <strong>Início:</strong> ${inicioCiclo.toLocaleDateString('pt-BR')}<br>
            <strong>Fim:</strong> ${fimCiclo.toLocaleDateString('pt-BR')}<br>
            <strong>Período:</strong> Ciclo de 30 dias (27 a 26)
          </p>
        </div>
        
        <div style="margin-top: 16px; padding: 12px; background: #fef3c7; border-radius: 6px;">
          <p style="margin: 0; color: #92400e; font-size: 0.875rem;">
            <strong>📌 Quinzenas:</strong><br>
            • 1ª Quinzena: Dia 27 ao dia 11<br>
            • 2ª Quinzena: Dia 12 ao dia 26
          </p>
        </div>
      </div>
    `;
    
    const modal = window.CRMUI?.criarModal({
      titulo: '📊 Ciclo Comercial',
      conteudo: conteudo,
      tamanho: 'medium',
      acoes: [
        {
          id: 'fechar',
          texto: 'Fechar',
          tipo: 'primary',
          onClick: () => modal.fechar()
        }
      ]
    });
  }

  function abrirGoogleSheets() {
    if (window.CRMGoogleSheets?.mostrarPainelConfiguracao) {
      window.CRMGoogleSheets.mostrarPainelConfiguracao();
    } else {
      window.CRMUI?.mostrarNotificacao('❌ Módulo Google Sheets não encontrado', 'error');
    }
  }

  function mostrarAlertas(alertas) {
    if (!alertas || alertas.length === 0) return;

    alertas.forEach(alerta => {
      window.CRMUI?.mostrarNotificacao(
        `${alerta.icone} ${alerta.titulo}: ${alerta.mensagem}`,
        alerta.tipo
      );
    });
  }

  function fecharKanban() {
    if (uiState.fullscreenContainer) {
      uiState.fullscreenContainer.remove();
      uiState.fullscreenContainer = null;
    }

    // Finaliza o Core
    if (window.CRMKanbanCore) {
      window.CRMKanbanCore.finalizarKanban();
    }

    window.CRMUI?.mostrarNotificacao('👋 CRM fechado', 'info');
  }

  function mostrarKanbanFullscreen() {
    // Remove modal existente se houver
    const existingModal = document.querySelector('.crm-modal-container');
    if (existingModal) {
      existingModal.remove();
    }

    const fullscreenContainer = document.createElement('div');
    fullscreenContainer.id = 'kanban-fullscreen';
    fullscreenContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: white;
      z-index: 99999;
      display: flex;
      flex-direction: column;
    `;

    uiState.fullscreenContainer = fullscreenContainer;

    // Inicializa e cria interface
    if (window.CRMKanbanCore) {
      if (!window.CRMKanbanCore.isInitialized) {
        window.CRMKanbanCore.inicializarKanban().then(() => {
          criarInterfaceKanban(fullscreenContainer);
          document.body.appendChild(fullscreenContainer);
        });
      } else {
        criarInterfaceKanban(fullscreenContainer);
        document.body.appendChild(fullscreenContainer);
      }
    }

    return fullscreenContainer;
  }

  // =====================================================
  // UTILITÁRIOS
  // =====================================================

  function getDefaultAvatar() {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNFNUU3RUIiLz4KPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeGg9IjgiIHk9IjgiPgo8cGF0aCBkPSJNNCAwQzUuODg2NCAwIDcuNDA3NCAxLjMxNTcgNy40MDc0IDNDNS40MDc0IDQuNjg0MyA1Ljg4NjQgNiA0IDZDMi4xMTM2IDYgMC41OTI1OTUgNC42ODQzIDAuNTkyNTk1IDNDMC41OTI1OTUgMS4zMTU3IDIuMTEzNiAwIDQgMFoiIGZpbGw9IiM5QjlBOUQiLz4KPHBhdGggZD0iTTEyIDcuODczNUMxMiAxMC42Mzk2IDYuMDMyNTUgMTIgNC43MDM3IDguNTUzOTRDMy40OTU0IDcuNzU3OTcgMCA1LjU1MjY3IDAgNy42MzMzM0wwIDguMDgyNDhDMCAxMi41NTY2IDUuMDU0MjUgMTYuMDAwMSA5LjY5NDU2IDE1Ljk5OTlDMTEuMTU0NCAxNi4wMDAxIDE1LjIzNzkgMTUuMDM0NSAxNiAxMi43NzM2VjcuNjMzMzNDMTUuMzk3NiA1LjIyNDg2IDExLjkxNyA3LjAxMiAxMiA3Ljg3MzVaIiBmaWxsPSIjOUI5QjlCIi8+Cjwvc3ZnPgo8L3N2Zz4K';
  }

  function getTagEmoji(tag) {
    const emojis = {
      'potencial-alto': '🔥',
      'urgente': '⚡',
      'retorno': '🔄',
      'vip': '⭐',
      'frio': '❄️',
      'quente': '🌡️'
    };
    return emojis[tag] || '🏷️';
  }

  function getPriorityColor(client) {
    if (client.tags?.includes('urgente')) return '#ef4444';
    if (client.tags?.includes('potencial-alto')) return '#f59e0b';
    if (client.tags?.includes('vip')) return '#8b5cf6';
    return '#10b981';
  }

  // =====================================================
  // API PÚBLICA
  // =====================================================

  return {
    // Interface principal
    criarInterfaceKanban,
    mostrarKanbanFullscreen,
    fecharKanban,

    // Renderização
    renderizarColunas,
    atualizarContadores,
    atualizarDisplayCiclo,
    atualizarIndicadores,

    // Formulários
    mostrarFormularioEdicaoCliente,
    mostrarFormularioNovoNegocio,
    mostrarFormularioNovaColuna,

    // Alertas e notificações
    mostrarAlertas,

    // Integração
    abrirPainelCicloComercial,
    abrirGoogleSheets,

    // Estado da UI
    get container() {
      return uiState.container;
    },

    get isFullscreen() {
      return !!uiState.fullscreenContainer;
    }
  };

})();

console.log('✅ Módulo CRMKanbanUI v4.3 carregado! Ciclo comercial: 27 a 26 com quinzenas');