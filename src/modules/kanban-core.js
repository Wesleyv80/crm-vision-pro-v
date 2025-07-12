// =====================================================
// Kanban Core - Lógica e Estrutura de Dados
// =====================================================
// Gerencia dados, estado e operações do Kanban
// VERSÃO 2.0 - OTIMIZADO COM SINCRONIZAÇÃO INTELIGENTE

window.CRMKanbanCore = (() => {
  
  // =====================================================
  // ESTADO DO KANBAN
  // =====================================================
  
  const state = {
    colunas: [],
    cards: [],
    filtros: {
      busca: '',
      tags: [],
      origem: ''
    },
    cicloComercial: {
      metaMensal: 12,
      vendasRegistradas: 0,
      alertasAtivos: true,
      ultimaAtualizacao: null
    },
    intervalos: {
      atualizacaoCiclo: null,
      verificacaoAlertas: null
    },
    isInitialized: false
  };
  
  // =====================================================
  // INICIALIZAÇÃO E CONFIGURAÇÃO
  // =====================================================
  
  async function inicializarKanban() {
    console.log('🔄 Inicializando Kanban Core...');
    
    try {
      // Carrega dados salvos
      await carregarDados();
      
      // Inicializa ciclo comercial se disponível
      if (window.CRMCicloComercial) {
        inicializarCicloComercial();
      }
      
      state.isInitialized = true;
      console.log('✅ Kanban Core inicializado');
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao inicializar Kanban Core:', error);
      return false;
    }
  }
  
  async function carregarDados() {
    try {
      // Primeiro tenta carregar do localStorage
      const savedData = localStorage.getItem('crm_kanban_data');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        window.crmState.kanbanData = parsedData;
        console.log('📊 Dados carregados do localStorage');
      }
      
      const kanbanData = window.crmState?.kanbanData;
      
      if (kanbanData && kanbanData.columns) {
        state.colunas = kanbanData.columns;
        console.log('📊 Dados carregados do estado global');
      } else {
        // Cria estrutura padrão
        state.colunas = criarEstruturaPadrao();
        await salvarDados();
        console.log('🏗️ Estrutura padrão criada');
      }
      
      return state.colunas;
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      state.colunas = criarEstruturaPadrao();
      return state.colunas;
    }
  }
  
  function criarEstruturaPadrao() {
    return [
      { id: 'leads', title: '🎯 Leads', clients: [], color: '#6366f1' },
      { id: 'negotiation', title: '💬 Em Negociação', clients: [], color: '#8b5cf6' },
      { id: 'proposal', title: '📝 Proposta Enviada', clients: [], color: '#ec4899' },
      { id: 'closing', title: '🤝 Fechamento', clients: [], color: '#f59e0b' },
      { id: 'success', title: '✅ Sucesso', clients: [], color: '#10b981' }
    ];
  }
  
  async function salvarDados(sincronizarSheets = false) {
    try {
      if (window.crmState && window.crmState.kanbanData) {
        window.crmState.kanbanData.columns = state.colunas;
        
        // Salva usando CRMStorage se disponível
        if (window.CRMStorage && typeof CRMStorage.salvar === 'function') {
          await CRMStorage.salvar('kanban_data', window.crmState.kanbanData);
        } else {
          // Fallback para localStorage
          localStorage.setItem('crm_kanban_data', JSON.stringify(window.crmState.kanbanData));
        }
        
        // REMOVIDO: Sincronização automática completa
        // Agora a sincronização é feita apenas quando necessário
        
        console.log('💾 Dados salvos com sucesso');
        return true;
      }
    } catch (error) {
      console.error('❌ Erro ao salvar dados:', error);
      return false;
    }
  }
  
  // =====================================================
  // OPERAÇÕES COM CARDS
  // =====================================================
  
  function moverCard(clientId, oldColumnId, newColumnId) {
    try {
      // Remove da coluna antiga
      const oldColumn = state.colunas.find(col => col.id === oldColumnId);
      if (oldColumn) {
        oldColumn.clients = oldColumn.clients.filter(id => id !== clientId);
      }
      
      // Adiciona na nova coluna
      const newColumn = state.colunas.find(col => col.id === newColumnId);
      if (newColumn) {
        newColumn.clients.push(clientId);
      }
      
      // Atualiza status do cliente se movido para sucesso
      if (newColumnId === 'success') {
        const cliente = obterClientePorId(clientId);
        if (cliente) {
          cliente.status = 'fechado';
          cliente.ultimaAtualizacao = new Date().toISOString();
          
          // Sincroniza cliente atualizado com Google Sheets
          if (window.CRMGoogleSheets?.isEnabled() && window.CRMGoogleSheets.isAuthenticated()) {
            setTimeout(() => {
              window.CRMGoogleSheets.syncCliente(clientId);
            }, 500);
          }
        }
      }
      
      // Salva alterações
      salvarDados();
      
      console.log(`📋 Card ${clientId} movido: ${oldColumnId} → ${newColumnId}`);
      
      // Notifica a UI se disponível
      if (window.CRMUI) {
        window.CRMUI.mostrarNotificacao(`Card movido para ${newColumn?.title || 'nova coluna'}`, 'success');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao mover card:', error);
      return false;
    }
  }
  
  function adicionarCliente(clienteData, colunaId = null) {
    try {
      // Gera ID único se não fornecido
      if (!clienteData.id) {
        clienteData.id = 'client_' + Date.now();
      }
      
      // Adiciona timestamps
      clienteData.dataCadastro = clienteData.dataCadastro || new Date().toISOString();
      clienteData.ultimaAtualizacao = new Date().toISOString();
      
      // Adiciona ao estado global
      if (!window.crmState.kanbanData) {
        window.crmState.kanbanData = {
          clients: {},
          columns: []
        };
      }
      
      if (!window.crmState.kanbanData.clients) {
        window.crmState.kanbanData.clients = {};
      }
      
      // Adiciona o cliente
      window.crmState.kanbanData.clients[clienteData.id] = clienteData;
      
      // Adiciona à coluna especificada ou primeira coluna
      const targetColumnId = colunaId || state.colunas[0]?.id;
      const targetColumn = state.colunas.find(col => col.id === targetColumnId);
      
      if (targetColumn) {
        targetColumn.clients.push(clienteData.id);
      }
      
      // Salva dados
      salvarDados();
      
      // NOVO: Sincroniza apenas este cliente com Google Sheets
      if (window.CRMGoogleSheets?.isEnabled() && window.CRMGoogleSheets.isAuthenticated()) {
        setTimeout(() => {
          window.CRMGoogleSheets.syncCliente(clienteData.id);
        }, 1000);
      }
      
      console.log('👤 Cliente adicionado:', clienteData.nome);
      return clienteData;
    } catch (error) {
      console.error('❌ Erro ao adicionar cliente:', error);
      return null;
    }
  }
  
  function atualizarCliente(clientId, dadosAtualizados) {
    try {
      const cliente = obterClientePorId(clientId);
      if (!cliente) {
        throw new Error('Cliente não encontrado');
      }
      
      // Atualiza dados
      Object.assign(cliente, dadosAtualizados);
      cliente.ultimaAtualizacao = new Date().toISOString();
      
      // Salva dados
      salvarDados();
      
      // NOVO: Sincroniza apenas este cliente com Google Sheets
      if (window.CRMGoogleSheets?.isEnabled() && window.CRMGoogleSheets.isAuthenticated()) {
        setTimeout(() => {
          window.CRMGoogleSheets.syncCliente(clientId);
        }, 500);
      }
      
      console.log('✏️ Cliente atualizado:', clientId);
      return cliente;
    } catch (error) {
      console.error('❌ Erro ao atualizar cliente:', error);
      return null;
    }
  }
  
  function removerCliente(clientId) {
    try {
      // Remove das colunas
      state.colunas.forEach(col => {
        col.clients = col.clients.filter(id => id !== clientId);
      });
      
      // Remove do estado global
      if (window.crmState.kanbanData.clients) {
        delete window.crmState.kanbanData.clients[clientId];
      }
      
      // Salva dados
      salvarDados();
      
      // NOTA: Não removemos do Google Sheets, apenas marcamos como removido localmente
      
      console.log('🗑️ Cliente removido:', clientId);
      return true;
    } catch (error) {
      console.error('❌ Erro ao remover cliente:', error);
      return false;
    }
  }
  
  function obterClientePorId(clientId) {
    return window.crmState?.kanbanData?.clients?.[clientId] || null;
  }
  
  function obterTodosClientes() {
    return window.crmState?.kanbanData?.clients || {};
  }
  
  // =====================================================
  // OPERAÇÕES COM COLUNAS
  // =====================================================
  
  function adicionarColuna(dadosColuna) {
    try {
      const novaColuna = {
        id: dadosColuna.id || 'col_' + Date.now(),
        title: dadosColuna.title || 'Nova Coluna',
        color: dadosColuna.color || '#6366f1',
        clients: []
      };
      
      state.colunas.push(novaColuna);
      salvarDados();
      
      console.log('➕ Nova coluna adicionada:', novaColuna.title);
      return novaColuna;
    } catch (error) {
      console.error('❌ Erro ao adicionar coluna:', error);
      return null;
    }
  }
  
  function removerColuna(colunaId) {
    try {
      const colunaIndex = state.colunas.findIndex(col => col.id === colunaId);
      if (colunaIndex === -1) {
        throw new Error('Coluna não encontrada');
      }
      
      // Move clientes para primeira coluna se necessário
      const coluna = state.colunas[colunaIndex];
      if (coluna.clients.length > 0 && state.colunas.length > 1) {
        const primeiraColuna = state.colunas[0].id === colunaId ? state.colunas[1] : state.colunas[0];
        primeiraColuna.clients.push(...coluna.clients);
      }
      
      // Remove coluna
      state.colunas.splice(colunaIndex, 1);
      salvarDados();
      
      console.log('🗑️ Coluna removida:', colunaId);
      return true;
    } catch (error) {
      console.error('❌ Erro ao remover coluna:', error);
      return false;
    }
  }
  
  function atualizarColuna(colunaId, dadosAtualizados) {
    try {
      const coluna = state.colunas.find(col => col.id === colunaId);
      if (!coluna) {
        throw new Error('Coluna não encontrada');
      }
      
      Object.assign(coluna, dadosAtualizados);
      salvarDados();
      
      console.log('✏️ Coluna atualizada:', colunaId);
      return coluna;
    } catch (error) {
      console.error('❌ Erro ao atualizar coluna:', error);
      return null;
    }
  }
  
  // =====================================================
  // SISTEMA DE FILTROS
  // =====================================================
  
  function aplicarFiltros(filtros = null) {
    const filtrosAtivos = filtros || state.filtros;
    const todosClientes = obterTodosClientes();
    
    let clientesFiltrados = Object.values(todosClientes);
    
    // Filtro por busca
    if (filtrosAtivos.busca) {
      const termo = filtrosAtivos.busca.toLowerCase();
      clientesFiltrados = clientesFiltrados.filter(cliente => {
        const nome = (cliente.nome || '').toLowerCase();
        const telefone = (cliente.telefone || '').toLowerCase();
        const observacoes = (cliente.observacoes || '').toLowerCase();
        
        return nome.includes(termo) || telefone.includes(termo) || observacoes.includes(termo);
      });
    }
    
    // Filtro por tags
    if (filtrosAtivos.tags && filtrosAtivos.tags.length > 0) {
      clientesFiltrados = clientesFiltrados.filter(cliente => 
        filtrosAtivos.tags.some(tag => cliente.tags?.includes(tag))
      );
    }
    
    // Filtro por origem
    if (filtrosAtivos.origem) {
      clientesFiltrados = clientesFiltrados.filter(cliente => 
        cliente.origem === filtrosAtivos.origem
      );
    }
    
    return clientesFiltrados;
  }
  
  function definirFiltros(novosFiltros) {
    state.filtros = { ...state.filtros, ...novosFiltros };
    console.log('🔍 Filtros aplicados:', state.filtros);
    return state.filtros;
  }
  
  function limparFiltros() {
    state.filtros = { busca: '', tags: [], origem: '' };
    console.log('🧹 Filtros limpos');
    return state.filtros;
  }
  
  // =====================================================
  // INTEGRAÇÃO CICLO COMERCIAL
  // =====================================================
  
  function inicializarCicloComercial() {
    if (!window.CRMCicloComercial) {
      console.warn('⚠️ Módulo CRMCicloComercial não encontrado');
      return;
    }
    
    console.log('🔄 Inicializando integração com Ciclo Comercial...');
    
    // Configura atualização automática
    state.intervalos.atualizacaoCiclo = setInterval(() => {
      calcularMetricasKanban();
    }, 30000);
    
    // Verifica alertas
    state.intervalos.verificacaoAlertas = setInterval(() => {
      verificarAlertas();
    }, 120000);
    
    // Primeira verificação
    setTimeout(() => {
      verificarAlertas();
    }, 3000);
    
    console.log('✅ Ciclo Comercial integrado');
  }
  
  function calcularMetricasKanban() {
    const clientes = obterTodosClientes();
    
    let stats = {
      vendasFechadas: 0,
      faturamentoTotal: 0,
      totalAdesao: 0,
      totalGordurinha: 0,
      negociosAtivos: 0,
      totalLeads: Object.keys(clientes).length
    };
    
    Object.values(clientes).forEach(cliente => {
      if (window.CRMCicloComercial?.isDataNoCicloAtual) {
        const dataCadastro = new Date(cliente.dataCadastro);
        const isNoCiclo = window.CRMCicloComercial.isDataNoCicloAtual(dataCadastro);
        
        if (isNoCiclo) {
          (cliente.deals || []).forEach(deal => {
            const dataDeal = new Date(deal.dataCriacao || cliente.dataCadastro);
            
            if (window.CRMCicloComercial.isDataNoCicloAtual(dataDeal)) {
              const valor = (deal.valor_adesao || 0) + (deal.valor_gordurinha || 0);
              
              switch (deal.status) {
                case 'fechado':
                  stats.vendasFechadas++;
                  stats.faturamentoTotal += valor;
                  stats.totalAdesao += deal.valor_adesao || 0;
                  stats.totalGordurinha += deal.valor_gordurinha || 0;
                  break;
                  
                default:
                  stats.negociosAtivos++;
              }
            }
          });
        }
      }
    });
    
    return stats;
  }
  
  function verificarAlertas() {
    if (!window.CRMCicloComercial) return [];
    
    try {
      const alertas = window.CRMCicloComercial.verificarAlertas();
      
      // Envia alertas para UI se disponível
      if (window.CRMKanbanUI && typeof window.CRMKanbanUI.mostrarAlertas === 'function') {
        window.CRMKanbanUI.mostrarAlertas(alertas);
      }
      
      return alertas;
    } catch (error) {
      console.error('❌ Erro ao verificar alertas:', error);
      return [];
    }
  }
  
  // =====================================================
  // OPERAÇÕES COM NEGÓCIOS E TAREFAS
  // =====================================================
  
  function adicionarNegocio(clientId, dadosNegocio) {
    try {
      const cliente = obterClientePorId(clientId);
      if (!cliente) {
        throw new Error('Cliente não encontrado');
      }
      
      const novoNegocio = {
        id: dadosNegocio.id || 'deal_' + Date.now(),
        titulo: dadosNegocio.titulo,
        valor_adesao: dadosNegocio.valor_adesao || 0,
        valor_gordurinha: dadosNegocio.valor_gordurinha || 0,
        valor: (dadosNegocio.valor_adesao || 0) + (dadosNegocio.valor_gordurinha || 0),
        status: dadosNegocio.status || 'em_negociacao',
        probabilidade: dadosNegocio.probabilidade || 50,
        dataFechamentoPrevista: dadosNegocio.dataFechamentoPrevista || null,
        observacoes: dadosNegocio.observacoes || '',
        dataCriacao: new Date().toISOString(),
        clienteId: clientId
      };
      
      if (!cliente.deals) cliente.deals = [];
      cliente.deals.push(novoNegocio);
      
      salvarDados();
      
      // NOVO: Se o negócio foi fechado, sincroniza com Google Sheets
      if (novoNegocio.status === 'fechado' && window.CRMGoogleSheets?.isEnabled() && window.CRMGoogleSheets.isAuthenticated()) {
        setTimeout(() => {
          window.CRMGoogleSheets.syncVenda(cliente, novoNegocio);
          window.CRMGoogleSheets.syncMetricas();
        }, 1000);
      }
      
      console.log('💼 Negócio adicionado:', novoNegocio.titulo);
      return novoNegocio;
    } catch (error) {
      console.error('❌ Erro ao adicionar negócio:', error);
      return null;
    }
  }
  
  function atualizarNegocio(clientId, dealId, dadosAtualizados) {
    try {
      const cliente = obterClientePorId(clientId);
      if (!cliente || !cliente.deals) {
        throw new Error('Cliente ou negócios não encontrados');
      }
      
      const deal = cliente.deals.find(d => d.id === dealId);
      if (!deal) {
        throw new Error('Negócio não encontrado');
      }
      
      const statusAnterior = deal.status;
      Object.assign(deal, dadosAtualizados);
      deal.ultimaAtualizacao = new Date().toISOString();
      
      // Se foi marcado como fechado agora
      if (statusAnterior !== 'fechado' && deal.status === 'fechado') {
        deal.dataFechamento = new Date().toISOString();
        
        // Sincroniza venda com Google Sheets
        if (window.CRMGoogleSheets?.isEnabled() && window.CRMGoogleSheets.isAuthenticated()) {
          setTimeout(() => {
            window.CRMGoogleSheets.syncVenda(cliente, deal);
            window.CRMGoogleSheets.syncMetricas();
          }, 1000);
        }
      }
      
      salvarDados();
      
      // Atualiza cliente também
      atualizarCliente(clientId, { ultimaAtualizacao: new Date().toISOString() });
      
      console.log('💼 Negócio atualizado:', dealId);
      return deal;
    } catch (error) {
      console.error('❌ Erro ao atualizar negócio:', error);
      return null;
    }
  }
  
  function adicionarTarefa(clientId, dadosTarefa) {
    try {
      const cliente = obterClientePorId(clientId);
      if (!cliente) {
        throw new Error('Cliente não encontrado');
      }
      
      const novaTarefa = {
        id: dadosTarefa.id || 'task_' + Date.now(),
        titulo: dadosTarefa.titulo,
        tipo: dadosTarefa.tipo || 'outro',
        prioridade: dadosTarefa.prioridade || 'media',
        dataVencimento: dadosTarefa.dataVencimento || null,
        horario: dadosTarefa.horario || null,
        descricao: dadosTarefa.descricao || '',
        status: 'pendente',
        dataCriacao: new Date().toISOString(),
        clienteId: clientId
      };
      
      if (!cliente.tasks) cliente.tasks = [];
      cliente.tasks.push(novaTarefa);
      
      salvarDados();
      
      console.log('📋 Tarefa adicionada:', novaTarefa.titulo);
      return novaTarefa;
    } catch (error) {
      console.error('❌ Erro ao adicionar tarefa:', error);
      return null;
    }
  }
  
  // =====================================================
  // FUNÇÕES AUXILIARES
  // =====================================================
  
  function obterTodasTagsUnicas() {
    const tags = new Set();
    const clientes = obterTodosClientes();
    
    Object.values(clientes).forEach(cliente => {
      if (cliente.tags && Array.isArray(cliente.tags)) {
        cliente.tags.forEach(tag => tags.add(tag));
      }
    });
    
    return Array.from(tags);
  }
  
  function obterTodasOrigensUnicas() {
    const origens = new Set();
    const clientes = obterTodosClientes();
    
    Object.values(clientes).forEach(cliente => {
      if (cliente.origem) {
        origens.add(cliente.origem);
      }
    });
    
    return Array.from(origens);
  }
  
  // =====================================================
  // UTILITÁRIOS E ESTATÍSTICAS
  // =====================================================
  
  function obterEstatisticas() {
    const clientes = obterTodosClientes();
    const totalClientes = Object.keys(clientes).length;
    
    let stats = {
      totalClientes: totalClientes,
      totalNegocios: 0,
      totalTarefas: 0,
      faturamentoTotal: 0,
      negociosFechados: 0,
      tarefasPendentes: 0,
      clientesPorColuna: {},
      origensClientes: {},
      tagsClientes: {},
      totalClients: totalClientes, // Compatibilidade
      totalDeals: 0,
      totalRevenue: 0,
      conversionRate: 0,
      totalAdesao: 0,
      totalGordurinha: 0
    };
    
    // Estatísticas por coluna
    state.colunas.forEach(coluna => {
      stats.clientesPorColuna[coluna.id] = {
        nome: coluna.title,
        quantidade: coluna.clients.length
      };
    });
    
    // Estatísticas dos clientes
    Object.values(clientes).forEach(cliente => {
      // Negócios
      (cliente.deals || []).forEach(deal => {
        stats.totalNegocios++;
        stats.totalDeals++;
        if (deal.status === 'fechado') {
          stats.negociosFechados++;
          const valor = deal.valor || ((deal.valor_adesao || 0) + (deal.valor_gordurinha || 0));
          stats.faturamentoTotal += valor;
          stats.totalRevenue += valor;
          stats.totalAdesao += deal.valor_adesao || 0;
          stats.totalGordurinha += deal.valor_gordurinha || 0;
        }
      });
      
      // Tarefas
      (cliente.tasks || []).forEach(task => {
        stats.totalTarefas++;
        if (task.status === 'pendente') {
          stats.tarefasPendentes++;
        }
      });
      
      // Origens
      const origem = cliente.origem || 'indefinido';
      stats.origensClientes[origem] = (stats.origensClientes[origem] || 0) + 1;
      
      // Tags
      (cliente.tags || []).forEach(tag => {
        stats.tagsClientes[tag] = (stats.tagsClientes[tag] || 0) + 1;
      });
    });
    
    // Taxa de conversão
    if (totalClientes > 0) {
      stats.conversionRate = Math.round((stats.negociosFechados / totalClientes) * 100);
    }
    
    return stats;
  }
  
  function limparDados() {
    state.colunas = criarEstruturaPadrao();
    
    if (window.crmState && window.crmState.kanbanData) {
      window.crmState.kanbanData.clients = {};
      window.crmState.kanbanData.columns = state.colunas;
    }
    
    salvarDados();
    console.log('🧹 Dados do Kanban limpos');
    return true;
  }
  
  function exportarDados() {
    const dados = {
      colunas: state.colunas,
      clientes: obterTodosClientes(),
      filtros: state.filtros,
      estatisticas: obterEstatisticas(),
      dataExportacao: new Date().toISOString()
    };
    
    return dados;
  }
  
  function finalizarKanban() {
    // Limpa intervalos
    if (state.intervalos.atualizacaoCiclo) {
      clearInterval(state.intervalos.atualizacaoCiclo);
      state.intervalos.atualizacaoCiclo = null;
    }
    
    if (state.intervalos.verificacaoAlertas) {
      clearInterval(state.intervalos.verificacaoAlertas);
      state.intervalos.verificacaoAlertas = null;
    }
    
    state.isInitialized = false;
    console.log('🔄 Kanban Core finalizado');
  }
  
  // =====================================================
  // API PÚBLICA
  // =====================================================
  
  return {
    // Inicialização
    inicializarKanban,
    finalizarKanban,
    carregarDados,
    salvarDados,
    
    // Operações com clientes
    adicionarCliente,
    atualizarCliente,
    removerCliente,
    obterClientePorId,
    obterTodosClientes,
    
    // Operações com cards
    moverCard,
    
    // Operações com colunas
    adicionarColuna,
    removerColuna,
    atualizarColuna,
    
    // Sistema de filtros
    aplicarFiltros,
    definirFiltros,
    limparFiltros,
    
    // Negócios e tarefas
    adicionarNegocio,
    atualizarNegocio,
    adicionarTarefa,
    
    // Ciclo comercial
    calcularMetricasKanban,
    verificarAlertas,
    
    // Utilitários
    obterEstatisticas,
    exportarDados,
    limparDados,
    
    // Funções auxiliares
    obterTodasTagsUnicas,
    obterTodasOrigensUnicas,
    
    // Estado
    get estado() {
      return { ...state };
    },
    
    get colunas() {
      return state.colunas;
    },
    
    get filtros() {
      return state.filtros;
    },
    
    get isInitialized() {
      return state.isInitialized;
    }
  };

})();

console.log('✅ Módulo CRMKanbanCore v2.0 carregado!');