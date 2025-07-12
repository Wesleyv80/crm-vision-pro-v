// =====================================================
// Módulo Ciclo Comercial Inteligente - CORRIGIDO
// =====================================================
// Gerencia o ciclo comercial personalizado (27 a 26)
// VERSÃO 1.1 - CORRIGIDO: Sem return statements soltos

window.CRMCicloComercial = (() => {
  
  // =====================================================
  // ESTADO DO MÓDULO
  // =====================================================
  
  const state = {
    configuracao: {
      metaMensal: 12,
      alertasAtivos: true,
      alertasDiasAntecedencia: 7,
      notificacoesAtivas: true,
      autoSalvarMes: true
    },
    cicloAtual: null,
    metricas: {
      vendasRegistradas: 0,
      faturamentoTotal: 0,
      totalAdesao: 0,
      totalGordurinha: 0,
      negociosAtivos: 0,
      conversionRate: 0
    },
    registrosVendas: [],
    historicoMensal: [],
    alertasDispparados: new Set(),
    ultimaAtualizacao: null
  };
  
  // =====================================================
  // CÁLCULO DO CICLO COMERCIAL
  // =====================================================
  
  /**
   * Calcula o ciclo comercial atual (27 do mês anterior ao 26 do mês atual)
   */
  function calcularCicloComercial() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();
    const dia = hoje.getDate();
    
    let inicioCiclo, fimCiclo, mesReferencia;
    
    if (dia >= 27) {
      // Estamos no início do novo ciclo (a partir do dia 27)
      inicioCiclo = new Date(ano, mes, 27);
      fimCiclo = new Date(ano, mes + 1, 26);
      mesReferencia = new Date(ano, mes + 1, 1); // Próximo mês
    } else {
      // Estamos no fim do ciclo anterior (até o dia 26)
      inicioCiclo = new Date(ano, mes - 1, 27);
      fimCiclo = new Date(ano, mes, 26);
      mesReferencia = new Date(ano, mes, 1); // Mês atual
    }
    
    // Define horários precisos
    inicioCiclo.setHours(0, 0, 0, 0);
    fimCiclo.setHours(23, 59, 59, 999);
    
    // Cálculos de tempo
    const agora = new Date();
    const totalMilliseconds = fimCiclo.getTime() - inicioCiclo.getTime();
    const passadoMilliseconds = Math.max(0, agora.getTime() - inicioCiclo.getTime());
    const restanteMilliseconds = Math.max(0, fimCiclo.getTime() - agora.getTime());
    
    const totalDias = Math.ceil(totalMilliseconds / (1000 * 60 * 60 * 24));
    const diasPassados = Math.floor(passadoMilliseconds / (1000 * 60 * 60 * 24));
    const diasRestantes = Math.ceil(restanteMilliseconds / (1000 * 60 * 60 * 24));
    
    const progresso = Math.min(100, Math.max(0, Math.round((diasPassados / totalDias) * 100)));
    
    // Informações do período
    const nomeCompleto = mesReferencia.toLocaleDateString('pt-BR', { 
      month: 'long', 
      year: 'numeric' 
    });
    
    const nomeAbreviado = mesReferencia.toLocaleDateString('pt-BR', { 
      month: 'short', 
      year: 'numeric' 
    }).toUpperCase();
    
    // Status do ciclo
    let status = 'ativo';
    if (diasRestantes === 0) {
      status = 'finalizando';
    } else if (diasRestantes <= state.configuracao.alertasDiasAntecedencia) {
      status = 'critico';
    } else if (progresso >= 75) {
      status = 'avancado';
    } else if (progresso >= 50) {
      status = 'meio';
    } else if (progresso >= 25) {
      status = 'inicio';
    }
    
    const ciclo = {
      inicio: inicioCiclo,
      fim: fimCiclo,
      hoje: agora,
      mesReferencia: mesReferencia,
      
      // Contadores de tempo
      totalDias: totalDias,
      diasPassados: diasPassados,
      diasRestantes: diasRestantes,
      progresso: progresso,
      
      // Informações do período
      nomeCompleto: nomeCompleto,
      nomeAbreviado: nomeAbreviado,
      status: status,
      
      // Flags úteis
      isInicio: diasPassados <= 3,
      isMeio: progresso >= 45 && progresso <= 55,
      isFinal: diasRestantes <= 7,
      isUltimoDia: diasRestantes === 0,
      
      // Identificadores únicos
      id: `${mesReferencia.getFullYear()}-${String(mesReferencia.getMonth() + 1).padStart(2, '0')}`,
      timestamp: agora.getTime()
    };
    
    // Atualiza estado
    state.cicloAtual = ciclo;
    state.ultimaAtualizacao = agora.toISOString();
    
    return ciclo;
  }
  
  /**
   * Verifica se uma data está dentro do ciclo comercial atual
   */
  function isDataNoCicloAtual(data) {
    const ciclo = state.cicloAtual || calcularCicloComercial();
    const dataObj = new Date(data);
    
    return dataObj >= ciclo.inicio && dataObj <= ciclo.fim;
  }
  
  /**
   * Obtém ciclo comercial para uma data específica
   */
  function getCicloPorData(data) {
    const dataRef = new Date(data);
    const ano = dataRef.getFullYear();
    const mes = dataRef.getMonth();
    const dia = dataRef.getDate();
    
    let inicioCiclo, fimCiclo;
    
    if (dia >= 27) {
      inicioCiclo = new Date(ano, mes, 27);
      fimCiclo = new Date(ano, mes + 1, 26);
    } else {
      inicioCiclo = new Date(ano, mes - 1, 27);
      fimCiclo = new Date(ano, mes, 26);
    }
    
    inicioCiclo.setHours(0, 0, 0, 0);
    fimCiclo.setHours(23, 59, 59, 999);
    
    return {
      inicio: inicioCiclo,
      fim: fimCiclo,
      id: `${inicioCiclo.getFullYear()}-${String(inicioCiclo.getMonth() + 1).padStart(2, '0')}`
    };
  }
  
  // =====================================================
  // MÉTRICAS E ESTATÍSTICAS
  // =====================================================
  
  /**
   * Calcula todas as métricas do ciclo comercial atual
   */
  function calcularMetricasCiclo() {
    const ciclo = state.cicloAtual || calcularCicloComercial();
    const clientes = window.crmState?.kanbanData?.clients || {};
    const colunas = window.crmState?.kanbanData?.columns || [];
    
    // Inicializa contadores
    let stats = {
      // Vendas e negócios
      vendasFechadas: 0,
      vendasPerdidas: 0,
      negociosAtivos: 0,
      negociosTotal: 0,
      
      // Valores financeiros
      faturamentoTotal: 0,
      faturamentoPerdido: 0,
      totalAdesao: 0,
      totalGordurinha: 0,
      ticketMedio: 0,
      
      // Funil de vendas
      totalLeads: 0,
      leadsQualificados: 0,
      propostas: 0,
      
      // Performance
      taxaConversao: 0,
      taxaFechamento: 0,
      metaProgress: 0,
      diasProdutivos: 0,
      
      // Origens
      origens: {},
      
      // Por coluna
      porColuna: {},
      
      // Timeline
      vendasPorDia: {},
      tendencia: 'estavel'
    };
    
    // Analisa todos os clientes
    Object.values(clientes).forEach(cliente => {
      const dataCadastro = new Date(cliente.dataCadastro);
      const isNoCiclo = isDataNoCicloAtual(dataCadastro);
      
      if (isNoCiclo) {
        stats.totalLeads++;
        
        // Contabiliza origem
        const origem = cliente.origem || 'indefinido';
        stats.origens[origem] = (stats.origens[origem] || 0) + 1;
        
        // Analisa tags para qualificação
        if (cliente.tags?.includes('potencial-alto') || cliente.tags?.includes('quente')) {
          stats.leadsQualificados++;
        }
      }
      
      // Analisa negócios (deals) do cliente
      (cliente.deals || []).forEach(deal => {
        const dataDeal = new Date(deal.dataCriacao || cliente.dataCadastro);
        
        if (isDataNoCicloAtual(dataDeal)) {
          stats.negociosTotal++;
          
          const valor = deal.valor || (deal.valor_adesao || 0) + (deal.valor_gordurinha || 0);
          
          switch (deal.status) {
            case 'fechado':
              stats.vendasFechadas++;
              stats.faturamentoTotal += valor;
              stats.totalAdesao += deal.valor_adesao || 0;
              stats.totalGordurinha += deal.valor_gordurinha || 0;
              
              // Registra venda por dia
              const diaVenda = dataDeal.toISOString().split('T')[0];
              stats.vendasPorDia[diaVenda] = (stats.vendasPorDia[diaVenda] || 0) + 1;
              break;
              
            case 'perdido':
              stats.vendasPerdidas++;
              stats.faturamentoPerdido += valor;
              break;
              
            case 'proposta_enviada':
              stats.propostas++;
              stats.negociosAtivos++;
              break;
              
            default:
              stats.negociosAtivos++;
          }
        }
      });
    });
    
    // Análise por coluna do Kanban
    colunas.forEach(coluna => {
      const clientesColuna = coluna.clients || [];
      let valorColuna = 0;
      let negociosColuna = 0;
      
      clientesColuna.forEach(clienteId => {
        const cliente = clientes[clienteId];
        if (cliente) {
          (cliente.deals || []).forEach(deal => {
            const dataDeal = new Date(deal.dataCriacao || cliente.dataCadastro);
            if (isDataNoCicloAtual(dataDeal)) {
              valorColuna += deal.valor || 0;
              negociosColuna++;
            }
          });
        }
      });
      
      stats.porColuna[coluna.id] = {
        nome: coluna.title,
        clientes: clientesColuna.length,
        valor: valorColuna,
        negocios: negociosColuna
      };
    });
    
    // Cálculos derivados
    stats.ticketMedio = stats.vendasFechadas > 0 ? stats.faturamentoTotal / stats.vendasFechadas : 0;
    stats.taxaConversao = stats.totalLeads > 0 ? Math.round((stats.vendasFechadas / stats.totalLeads) * 100) : 0;
    stats.taxaFechamento = stats.negociosTotal > 0 ? Math.round((stats.vendasFechadas / stats.negociosTotal) * 100) : 0;
    stats.metaProgress = Math.round((stats.vendasFechadas / state.configuracao.metaMensal) * 100);
    
    // Dias produtivos (dias com pelo menos 1 venda)
    stats.diasProdutivos = Object.keys(stats.vendasPorDia).length;
    
    // Análise de tendência (simples)
    const vendasUltimos3Dias = Object.entries(stats.vendasPorDia)
      .slice(-3)
      .reduce((sum, [_, vendas]) => sum + vendas, 0);
    
    if (vendasUltimos3Dias >= 3) {
      stats.tendencia = 'crescente';
    } else if (vendasUltimos3Dias <= 1) {
      stats.tendencia = 'decrescente';
    }
    
    // Atualiza estado
    state.metricas = stats;
    
    return stats;
  }
  
  /**
   * Obtém resumo rápido das métricas principais
   */
  function getResumoMetricas() {
    const stats = calcularMetricasCiclo();
    const ciclo = state.cicloAtual || calcularCicloComercial();
    
    return {
      vendasFechadas: stats.vendasFechadas,
      metaMensal: state.configuracao.metaMensal,
      metaProgress: stats.metaProgress,
      faturamentoTotal: stats.faturamentoTotal,
      diasRestantes: ciclo.diasRestantes,
      status: ciclo.status,
      tendencia: stats.tendencia
    };
  }
  
  // =====================================================
  // SISTEMA DE METAS
  // =====================================================
  
  /**
   * Define nova meta mensal
   */
  function definirMeta(novaMeta) {
    if (!novaMeta || novaMeta < 1) {
      console.error('Meta deve ser um número maior que 0');
      return false;
    }
    
    const metaAnterior = state.configuracao.metaMensal;
    state.configuracao.metaMensal = parseInt(novaMeta);
    
    // Salva configuração
    salvarConfiguracao();
    
    // Log da mudança
    console.log(`Meta alterada: ${metaAnterior} → ${novaMeta}`);
    
    // Notifica sobre a mudança
    if (window.CRMUI) {
      CRMUI.mostrarNotificacao(`🎯 Meta mensal definida: ${novaMeta} vendas`, 'success');
    }
    
    return true;
  }
  
  /**
   * Calcula checkpoint semanal da meta
   */
  function calcularCheckpointSemanal() {
    const ciclo = state.cicloAtual || calcularCicloComercial();
    const stats = calcularMetricasCiclo();
    const metaMensal = state.configuracao.metaMensal;
    
    // Calcula semana atual (0-3)
    const semanaAtual = Math.floor(ciclo.diasPassados / 7);
    const metaSemanal = Math.ceil(metaMensal / 4);
    const metaAcumuladaAteAgora = metaSemanal * (semanaAtual + 1);
    
    // Performance semanal
    const performance = {
      semanaAtual: semanaAtual + 1,
      totalSemanas: 4,
      metaSemanal: metaSemanal,
      vendasSemanaAtual: 0, // Calculado depois
      metaAcumulada: metaAcumuladaAteAgora,
      vendasAcumuladas: stats.vendasFechadas,
      statusSemana: 'no_prazo'
    };
    
    // Determina status
    if (performance.vendasAcumuladas >= performance.metaAcumulada) {
      performance.statusSemana = 'adiantado';
    } else if (performance.vendasAcumuladas < performance.metaAcumulada * 0.8) {
      performance.statusSemana = 'atrasado';
    }
    
    return performance;
  }
  
  /**
   * Verifica se a meta foi atingida
   */
  function verificarStatusMeta() {
    const stats = calcularMetricasCiclo();
    const meta = state.configuracao.metaMensal;
    const progresso = stats.metaProgress;
    
    const status = {
      atingida: stats.vendasFechadas >= meta,
      progresso: progresso,
      faltam: Math.max(0, meta - stats.vendasFechadas),
      nivel: 'bronze' // bronze, prata, ouro
    };
    
    // Define nível baseado no progresso
    if (progresso >= 100) {
      status.nivel = 'ouro';
    } else if (progresso >= 80) {
      status.nivel = 'prata';
    }
    
    return status;
  }
  
  // =====================================================
  // SISTEMA DE ALERTAS
  // =====================================================
  
  /**
   * Verifica e dispara alertas necessários
   */
  function verificarAlertas() {
    if (!state.configuracao.alertasAtivos) {
      return [];
    }
    
    const ciclo = state.cicloAtual || calcularCicloComercial();
    const stats = calcularMetricasCiclo();
    const alertas = [];
    
    // Alerta de fim de ciclo
    if (ciclo.isFinal && !state.alertasDispparados.has('fim_ciclo')) {
      alertas.push({
        id: 'fim_ciclo',
        tipo: 'warning',
        titulo: 'Fim do Ciclo Comercial',
        mensagem: `Restam apenas ${ciclo.diasRestantes} dias para o fim do mês comercial!`,
        icone: '⏰',
        prioridade: 'alta'
      });
      state.alertasDispparados.add('fim_ciclo');
    }
    
    // Alerta de último dia
    if (ciclo.isUltimoDia && !state.alertasDispparados.has('ultimo_dia')) {
      alertas.push({
        id: 'ultimo_dia',
        tipo: 'error',
        titulo: 'Último Dia do Ciclo',
        mensagem: 'Hoje é o último dia do mês comercial! Finalize seus negócios.',
        icone: '🚨',
        prioridade: 'critica',
        acoes: [
          {
            texto: 'Salvar Mês',
            callback: () => salvarMesComercial()
          }
        ]
      });
      state.alertasDispparados.add('ultimo_dia');
    }
    
    // Alerta de meta atingida
    const statusMeta = verificarStatusMeta();
    if (statusMeta.atingida && !state.alertasDispparados.has('meta_atingida')) {
      alertas.push({
        id: 'meta_atingida',
        tipo: 'success',
        titulo: 'Meta Atingida! 🎉',
        mensagem: `Parabéns! Você atingiu ${stats.vendasFechadas} vendas da meta de ${state.configuracao.metaMensal}!`,
        icone: '🏆',
        prioridade: 'alta'
      });
      state.alertasDispparados.add('meta_atingida');
    }
    
    // Alerta de baixo desempenho
    if (ciclo.progresso >= 75 && stats.metaProgress < 50 && !state.alertasDispparados.has('baixo_desempenho')) {
      alertas.push({
        id: 'baixo_desempenho',
        tipo: 'warning',
        titulo: 'Acelere o Ritmo!',
        mensagem: `Você está em ${stats.metaProgress}% da meta com ${100 - ciclo.progresso}% do tempo restante.`,
        icone: '🚀',
        prioridade: 'media'
      });
      state.alertasDispparados.add('baixo_desempenho');
    }
    
    return alertas;
  }
  
  /**
   * Dispara alertas na interface
   */
  function mostrarAlertas(alertas) {
    if (!window.CRMUI || alertas.length === 0) return;
    
    alertas.forEach(alerta => {
      CRMUI.mostrarNotificacao(
        `${alerta.icone} ${alerta.titulo}: ${alerta.mensagem}`,
        alerta.tipo
      );
    });
  }
  
  /**
   * Reseta alertas para novo ciclo
   */
  function resetarAlertas() {
    state.alertasDispparados.clear();
    console.log('Alertas resetados para novo ciclo');
  }
  
  // =====================================================
  // REGISTRO DE VENDAS
  // =====================================================
  
  /**
   * Registra uma nova venda no sistema
   */
  function registrarVenda(dadosVenda) {
    const registro = {
      id: 'venda_' + Date.now(),
      numero: state.registrosVendas.length + 1,
      clienteId: dadosVenda.clienteId,
      nomeCliente: dadosVenda.nomeCliente,
      telefone: dadosVenda.telefone,
      email: dadosVenda.email || '',
      valorAdesao: dadosVenda.valorAdesao || 0,
      valorGordurinha: dadosVenda.valorGordurinha || 0,
      valorTotal: (dadosVenda.valorAdesao || 0) + (dadosVenda.valorGordurinha || 0),
      origem: dadosVenda.origem || 'indefinido',
      observacoes: dadosVenda.observacoes || '',
      dataVenda: new Date().toISOString(),
      cicloId: (state.cicloAtual || calcularCicloComercial()).id,
      timestamp: Date.now()
    };
    
    // Adiciona ao estado
    state.registrosVendas.push(registro);
    
    // Salva no localStorage
    salvarRegistrosVendas();
    
    // Log da venda
    console.log('Venda registrada:', registro);
    
    // Verifica alertas após nova venda
    setTimeout(() => {
      const alertas = verificarAlertas();
      mostrarAlertas(alertas);
    }, 1000);
    
    return registro;
  }
  
  /**
   * Lista vendas do ciclo atual
   */
  function getVendasCicloAtual() {
    const cicloId = (state.cicloAtual || calcularCicloComercial()).id;
    return state.registrosVendas.filter(venda => venda.cicloId === cicloId);
  }
  
  /**
   * Obtém histórico de vendas
   */
  function getHistoricoVendas(cicloId = null) {
    if (cicloId) {
      return state.registrosVendas.filter(venda => venda.cicloId === cicloId);
    }
    return [...state.registrosVendas];
  }
  
  // =====================================================
  // HISTÓRICO MENSAL
  // =====================================================
  
  /**
   * Salva dados do mês comercial atual no histórico
   */
  function salvarMesComercial() {
    const ciclo = state.cicloAtual || calcularCicloComercial();
    const stats = calcularMetricasCiclo();
    const vendas = getVendasCicloAtual();
    
    const registroMes = {
      id: ciclo.id,
      cicloId: ciclo.id,
      mesReferencia: ciclo.nomeCompleto,
      periodoInicio: ciclo.inicio.toISOString(),
      periodoFim: ciclo.fim.toISOString(),
      
      // Métricas principais
      vendasFechadas: stats.vendasFechadas,
      metaMensal: state.configuracao.metaMensal,
      metaAtingida: stats.vendasFechadas >= state.configuracao.metaMensal,
      percentualMeta: stats.metaProgress,
      
      // Financeiro
      faturamentoTotal: stats.faturamentoTotal,
      totalAdesao: stats.totalAdesao,
      totalGordurinha: stats.totalGordurinha,
      ticketMedio: stats.ticketMedio,
      
      // Performance
      totalLeads: stats.totalLeads,
      taxaConversao: stats.taxaConversao,
      taxaFechamento: stats.taxaFechamento,
      diasProdutivos: stats.diasProdutivos,
      
      // Outros dados
      negociosAtivos: stats.negociosAtivos,
      totalRegistros: vendas.length,
      origens: stats.origens,
      
      // Metadata
      dataRegistro: new Date().toISOString(),
      observacoes: '',
      tags: []
    };
    
    // Adiciona ao histórico
    state.historicoMensal.push(registroMes);
    
    // Salva no localStorage
    salvarHistoricoMensal();
    
    // Log
    console.log('Mês comercial salvo:', registroMes);
    
    // Notifica usuário
    if (window.CRMUI) {
      CRMUI.mostrarNotificacao(
        `📊 Mês comercial ${ciclo.nomeAbreviado} salvo com ${stats.vendasFechadas} vendas!`,
        'success'
      );
    }
    
    return registroMes;
  }
  
  /**
   * Obtém histórico mensal completo
   */
  function getHistoricoMensal() {
    return [...state.historicoMensal].sort((a, b) => 
      new Date(b.periodoInicio) - new Date(a.periodoInicio)
    );
  }
  
  /**
   * Compara desempenho com mês anterior
   */
  function compararComMesAnterior() {
    const historico = getHistoricoMensal();
    const mesAtual = calcularMetricasCiclo();
    
    if (historico.length === 0) {
      return {
        temComparacao: false,
        mensagem: 'Primeiro mês de uso do sistema'
      };
    }
    
    const mesAnterior = historico[0];
    
    return {
      temComparacao: true,
      atual: {
        vendas: mesAtual.vendasFechadas,
        faturamento: mesAtual.faturamentoTotal,
        conversao: mesAtual.taxaConversao
      },
      anterior: {
        vendas: mesAnterior.vendasFechadas,
        faturamento: mesAnterior.faturamentoTotal,
        conversao: mesAnterior.taxaConversao
      },
      variacao: {
        vendas: mesAtual.vendasFechadas - mesAnterior.vendasFechadas,
        vendasPerc: calcularVariacaoPercentual(mesAnterior.vendasFechadas, mesAtual.vendasFechadas),
        faturamento: mesAtual.faturamentoTotal - mesAnterior.faturamentoTotal,
        faturamentoPerc: calcularVariacaoPercentual(mesAnterior.faturamentoTotal, mesAtual.faturamentoTotal),
        conversao: mesAtual.taxaConversao - mesAnterior.taxaConversao
      }
    };
  }
  
  /**
   * Calcula variação percentual
   */
  function calcularVariacaoPercentual(anterior, atual) {
    if (anterior === 0) return atual > 0 ? 100 : 0;
    return Math.round(((atual - anterior) / anterior) * 100);
  }
  
  // =====================================================
  // PERSISTÊNCIA DE DADOS
  // =====================================================
  
  function salvarConfiguracao() {
    try {
      localStorage.setItem('crm_ciclo_config', JSON.stringify(state.configuracao));
    } catch (e) {
      console.error('Erro ao salvar configuração:', e);
    }
  }
  
  function carregarConfiguracao() {
    try {
      const config = localStorage.getItem('crm_ciclo_config');
      if (config) {
        state.configuracao = { ...state.configuracao, ...JSON.parse(config) };
      }
    } catch (e) {
      console.error('Erro ao carregar configuração:', e);
    }
  }
  
  function salvarRegistrosVendas() {
    try {
      localStorage.setItem('crm_registros_vendas', JSON.stringify(state.registrosVendas));
    } catch (e) {
      console.error('Erro ao salvar registros de vendas:', e);
    }
  }
  
  function carregarRegistrosVendas() {
    try {
      const registros = localStorage.getItem('crm_registros_vendas');
      if (registros) {
        state.registrosVendas = JSON.parse(registros);
      }
    } catch (e) {
      console.error('Erro ao carregar registros de vendas:', e);
    }
  }
  
  function salvarHistoricoMensal() {
    try {
      localStorage.setItem('crm_historico_mensal', JSON.stringify(state.historicoMensal));
    } catch (e) {
      console.error('Erro ao salvar histórico mensal:', e);
    }
  }
  
  function carregarHistoricoMensal() {
    try {
      const historico = localStorage.getItem('crm_historico_mensal');
      if (historico) {
        state.historicoMensal = JSON.parse(historico);
      }
    } catch (e) {
      console.error('Erro ao carregar histórico mensal:', e);
    }
  }
  
  /**
   * Inicializa o módulo carregando dados salvos
   */
  function inicializar() {
    console.log('🔄 Inicializando Módulo Ciclo Comercial...');
    
    // Carrega dados salvos
    carregarConfiguracao();
    carregarRegistrosVendas();
    carregarHistoricoMensal();
    
    // Calcula ciclo atual
    calcularCicloComercial();
    
    // Calcula métricas iniciais
    calcularMetricasCiclo();
    
    // Verifica alertas iniciais
    const alertas = verificarAlertas();
    setTimeout(() => mostrarAlertas(alertas), 2000);
    
    console.log('✅ Módulo Ciclo Comercial inicializado');
    console.log('📊 Estado atual:', {
      ciclo: state.cicloAtual?.nomeAbreviado,
      vendas: state.metricas.vendasFechadas,
      meta: state.configuracao.metaMensal
    });
  }
  
  // =====================================================
  // API PÚBLICA
  // =====================================================
  
  return {
    // Inicialização
    inicializar,
    
    // Ciclo comercial
    calcularCicloComercial,
    getCicloAtual: () => state.cicloAtual,
    isDataNoCicloAtual,
    getCicloPorData,
    
    // Métricas
    calcularMetricasCiclo,
    getResumoMetricas,
    getMetricas: () => state.metricas,
    
    // Metas
    definirMeta,
    calcularCheckpointSemanal,
    verificarStatusMeta,
    getMeta: () => state.configuracao.metaMensal,
    
    // Alertas
    verificarAlertas,
    mostrarAlertas,
    resetarAlertas,
    configurarAlertas: (config) => {
      state.configuracao = { ...state.configuracao, ...config };
      salvarConfiguracao();
    },
    
    // Vendas
    registrarVenda,
    getVendasCicloAtual,
    getHistoricoVendas,
    
    // Histórico
    salvarMesComercial,
    getHistoricoMensal,
    compararComMesAnterior,
    
    // Configuração
    getConfiguracao: () => ({ ...state.configuracao }),
    setConfiguracao: (novaConfig) => {
      state.configuracao = { ...state.configuracao, ...novaConfig };
      salvarConfiguracao();
    },
    
    // Estado completo (para debug)
    getEstado: () => ({ ...state }),
    
    // Utilities
    formatarData: (data) => new Date(data).toLocaleDateString('pt-BR'),
    formatarValor: (valor) => valor.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    })
  };

})();

// Inicializa automaticamente quando carregado
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (window.CRMCicloComercial) {
        window.CRMCicloComercial.inicializar();
      }
    }, 1000);
  });
}

console.log('✅ Módulo CRMCicloComercial CORRIGIDO carregado!');