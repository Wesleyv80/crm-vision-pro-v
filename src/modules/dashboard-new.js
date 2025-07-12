// =====================================================
// SISTEMA COMPLETO DE DASHBOARD - VERSÃO CORRIGIDA
// =====================================================
window.CRMDashboard = {
  
  // Estado da sidebar para controle
  sidebarState: {
    originalDisplay: null,
    originalMarginRight: null,
    originalWidth: null
  },
  
  // =====================================================
  // MOSTRAR DASHBOARD COMPLETO EM TELA CHEIA
  // =====================================================
  mostrarDashboardCompleto: async function() {
    const stats = this.calcularEstatisticas();
    const insights = this.gerarInsights(stats);
    const metrics = this.calcularMetricasReais(stats);
    const dadosGraficos = await this.prepararDadosGraficos(stats);
    
    const conteudo = `
      <div class="dashboard-completo" style="padding: 24px; max-height: 100vh; overflow-y: auto; background: #f9fafb;">
        <!-- HEADER COM BOTÃO ATUALIZAR -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;">
          <div>
            <h1 style="font-size: 32px; font-weight: 700; margin: 0; background: linear-gradient(to right, #1e293b, #475569); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
              Dashboard Inteligente
            </h1>
            <p style="color: #6b7280; margin-top: 8px;">Visão completa do seu negócio em tempo real</p>
          </div>
          <div style="display: flex; gap: 12px;">
            <button onclick="CRMDashboard.atualizarDados()" style="
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 10px 20px;
              background: white;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
              color: #374151;
              transition: all 0.2s;
              box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            " onmouseover="this.style.boxShadow='0 4px 6px rgba(0,0,0,0.1)'" onmouseout="this.style.boxShadow='0 1px 2px rgba(0,0,0,0.05)'">
              <span style="font-size: 18px;">🔄</span>
              Atualizar Dados
            </button>
            <button onclick="CRMDashboard.fecharDashboard()" style="
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 10px 20px;
              background: #ef4444;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
              color: white;
              transition: all 0.2s;
              box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            " onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#ef4444'">
              <span style="font-size: 18px;">✕</span>
              Fechar
            </button>
          </div>
        </div>
        
        <!-- SEÇÃO 1: CARDS PRINCIPAIS -->
        <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 32px;">
          <div class="stat-card" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 24px; border-radius: 16px; box-shadow: 0 10px 25px rgba(139, 92, 246, 0.3);">
            <div style="display: flex; justify-content: space-between; align-items: start;">
              <div>
                <div style="font-size: 40px; margin-bottom: 8px;">👥</div>
                <h3 style="margin: 0; font-size: 32px; font-weight: 700;">${stats.totalClients}</h3>
                <p style="margin: 4px 0; opacity: 0.9;">Total de Clientes</p>
              </div>
              <span style="background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 14px;">
                +${Math.round((stats.totalClients / Math.max(stats.totalClients - 5, 1) - 1) * 100)}%
              </span>
            </div>
          </div>
          
          <div class="stat-card" style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 24px; border-radius: 16px; box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);">
            <div style="display: flex; justify-content: space-between; align-items: start;">
              <div>
                <div style="font-size: 40px; margin-bottom: 8px;">💼</div>
                <h3 style="margin: 0; font-size: 32px; font-weight: 700;">${stats.totalDeals}</h3>
                <p style="margin: 4px 0; opacity: 0.9;">Negócios Fechados</p>
              </div>
              <span style="background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 14px;">
                ${stats.conversionRate}% conversão
              </span>
            </div>
          </div>
          
          <div class="stat-card" style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 24px; border-radius: 16px; box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);">
            <div style="display: flex; justify-content: space-between; align-items: start;">
              <div>
                <div style="font-size: 40px; margin-bottom: 8px;">💎</div>
                <h3 style="margin: 0; font-size: 28px; font-weight: 700;">R$ ${stats.totalAdesao.toLocaleString('pt-BR')}</h3>
                <p style="margin: 4px 0; opacity: 0.9;">Total Adesão</p>
              </div>
            </div>
          </div>
          
          <div class="stat-card" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 24px; border-radius: 16px; box-shadow: 0 10px 25px rgba(245, 158, 11, 0.3);">
            <div style="display: flex; justify-content: space-between; align-items: start;">
              <div>
                <div style="font-size: 40px; margin-bottom: 8px;">🎯</div>
                <h3 style="margin: 0; font-size: 28px; font-weight: 700;">R$ ${stats.totalGordurinha.toLocaleString('pt-BR')}</h3>
                <p style="margin: 4px 0; opacity: 0.9;">Total Gordurinha</p>
              </div>
            </div>
          </div>
        </div>

        <!-- SEÇÃO 2: GRÁFICOS REAIS -->
        <div class="section-graficos" style="margin-bottom: 32px;">
          <h2 style="font-size: 24px; font-weight: 600; margin-bottom: 24px; color: #1f2937;">📊 Análise Visual</h2>
          <div class="charts-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 24px;">
            <!-- Gráfico de Pipeline Real -->
            <div class="chart-card" style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h3 style="margin: 0 0 20px 0; color: #374151;">Pipeline de Vendas</h3>
              <div id="pipeline-chart" style="height: 300px;">
                ${this.renderPipelineChartReal(dadosGraficos.pipeline)}
              </div>
            </div>
            
            <!-- Gráfico de Origem dos Leads -->
            <div class="chart-card" style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h3 style="margin: 0 0 20px 0; color: #374151;">Origem dos Leads</h3>
              <div id="origem-chart" style="height: 300px;">
                ${this.renderOrigemChartPizza(dadosGraficos.origens)}
              </div>
            </div>
            
            <!-- Gráfico de Evolução Temporal -->
            <div class="chart-card" style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); grid-column: span 2;">
              <h3 style="margin: 0 0 20px 0; color: #374151;">Evolução de Vendas (Últimos 30 dias)</h3>
              <div id="evolucao-chart" style="height: 300px;">
                ${this.renderEvolucaoChart(dadosGraficos.evolucao)}
              </div>
            </div>
          </div>
        </div>

        <!-- SEÇÃO 3: ANÁLISES INTELIGENTES -->
        <div class="section-analytics" style="margin-bottom: 32px;">
          <h2 style="font-size: 24px; font-weight: 600; margin-bottom: 24px; color: #1f2937;">🧠 Análises Inteligentes</h2>
          <div class="analytics-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
            ${insights.map(insight => `
              <div class="insight-card" style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid ${insight.color || '#6366f1'};">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                  <div style="width: 48px; height: 48px; background: ${insight.bgColor}; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px;">
                    ${insight.icon}
                  </div>
                  <div>
                    <h3 style="margin: 0; font-size: 16px; color: #1f2937;">${insight.title}</h3>
                    <span style="
                      background: ${insight.status === 'positive' ? '#d1fae5' : '#fed7aa'}; 
                      color: ${insight.status === 'positive' ? '#047857' : '#d97706'};
                      padding: 2px 8px;
                      border-radius: 12px;
                      font-size: 12px;
                      font-weight: 500;
                    ">
                      ${insight.status === 'positive' ? '✓ Positivo' : '! Atenção'}
                    </span>
                  </div>
                </div>
                <div style="font-size: 28px; font-weight: 700; color: #1f2937; margin-bottom: 8px;">${insight.value}</div>
                <p style="margin: 0; color: #6b7280; font-size: 14px;">${insight.description}</p>
                ${insight.action ? `
                  <button onclick="${insight.action}" style="
                    margin-top: 12px;
                    padding: 8px 16px;
                    background: #f3f4f6;
                    border: none;
                    border-radius: 6px;
                    color: #4b5563;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.2s;
                  " onmouseover="this.style.background='#e5e7eb'" onmouseout="this.style.background='#f3f4f6'">
                    ${insight.actionText || 'Ver detalhes'} →
                  </button>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>

        <!-- SEÇÃO 4: MÉTRICAS REAIS -->
        <div class="section-metricas" style="margin-bottom: 32px;">
          <h2 style="font-size: 24px; font-weight: 600; margin-bottom: 24px; color: #1f2937;">📈 Métricas de Performance</h2>
          
          <!-- Métricas com dados reais -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
            ${metrics.map((metric) => `
              <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                  <h4 style="margin: 0; color: #374151; display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 20px;">${metric.icon}</span>
                    ${metric.name}
                  </h4>
                  <span style="font-size: 24px; font-weight: 700; color: ${metric.color};">
                    ${metric.value}
                  </span>
                </div>
                <div style="background: #f3f4f6; height: 8px; border-radius: 4px; overflow: hidden;">
                  <div style="
                    height: 100%;
                    width: ${metric.progress}%;
                    background: ${metric.color};
                    transition: width 0.5s ease;
                  "></div>
                </div>
                <p style="margin: 8px 0 0 0; font-size: 12px; color: #6b7280;">
                  ${metric.description}
                </p>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- SEÇÃO 5: AÇÕES RÁPIDAS -->
        <div class="section-acoes" style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h3 style="margin: 0 0 20px 0; color: #1f2937;">🚀 Ações Rápidas</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 12px;">
            <button onclick="CRMDashboard.exportarRelatorio('completo')" style="
              padding: 12px 24px;
              background: #6366f1;
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 500;
              display: flex;
              align-items: center;
              gap: 8px;
              transition: all 0.2s;
            " onmouseover="this.style.background='#4f46e5'" onmouseout="this.style.background='#6366f1'">
              <span>📥</span> Exportar Relatório
            </button>
            
            <button onclick="CRMDashboard.compartilharDashboard()" style="
              padding: 12px 24px;
              background: #10b981;
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 500;
              display: flex;
              align-items: center;
              gap: 8px;
              transition: all 0.2s;
            " onmouseover="this.style.background='#059669'" onmouseout="this.style.background='#10b981'">
              <span>📤</span> Compartilhar
            </button>
            
            <button onclick="CRMDashboard.fecharEAbrirPipeline()" style="
              padding: 12px 24px;
              background: #8b5cf6;
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 500;
              display: flex;
              align-items: center;
              gap: 8px;
              transition: all 0.2s;
            " onmouseover="this.style.background='#7c3aed'" onmouseout="this.style.background='#8b5cf6'">
              <span>📋</span> Ver Pipeline
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Salva o estado atual da sidebar antes de escondê-la
    this.salvarEstadoSidebar();
    
    // Esconde sidebars
    this.esconderSidebars();
    
    // Cria modal em tela cheia SEM BARRA INFERIOR
    const modal = window.CRMUI.criarModal({
      titulo: '🚀 CRM Vision Pro - Dashboard',
      conteudo: conteudo,
      tamanho: 'fullscreen',
      acoes: [], // SEM BOTÕES NA BARRA INFERIOR
      onClose: () => {
        // Garantir que a sidebar seja restaurada ao fechar o modal
        this.restaurarSidebars();
      }
    });
    
    // Adiciona listeners adicionais para garantir que a sidebar seja restaurada
    this.adicionarListenersModal();
  },
  
  // =====================================================
  // FECHAR DASHBOARD DE FORMA SEGURA
  // =====================================================
  fecharDashboard: function() {
    // Fecha o modal atual
    const modalAtual = document.querySelector('.modal-container');
    if (modalAtual) {
      modalAtual.remove();
    }
    
    // Restaura a sidebar
    this.restaurarSidebars();
    
    // Mostra notificação
    window.CRMUI.mostrarNotificacao('✅ Dashboard fechado com sucesso!', 'success');
  },
  
  // =====================================================
  // FECHAR E ABRIR PIPELINE
  // =====================================================
  fecharEAbrirPipeline: function() {
    // Fecha o dashboard
    this.fecharDashboard();
    
    // Abre o pipeline após um pequeno delay
    setTimeout(() => {
      if (window.CRMKanbanUI && window.CRMKanbanUI.mostrarKanbanFullscreen) {
        window.CRMKanbanUI.mostrarKanbanFullscreen();
      }
    }, 300);
  },
  
  // =====================================================
  // SALVAR ESTADO DA SIDEBAR
  // =====================================================
  salvarEstadoSidebar: function() {
    const miniSidebar = document.querySelector('.mini-sidebar');
    const appElement = document.querySelector('#app');
    
    // Salva o estado atual
    if (miniSidebar) {
      this.sidebarState.originalDisplay = window.getComputedStyle(miniSidebar).display;
    }
    
    if (appElement) {
      this.sidebarState.originalMarginRight = window.getComputedStyle(appElement).marginRight;
      this.sidebarState.originalWidth = window.getComputedStyle(appElement).width;
    }
  },
  
  // =====================================================
  // FUNÇÕES PARA GERENCIAR SIDEBARS
  // =====================================================
  esconderSidebars: function() {
    const miniSidebar = document.querySelector('.mini-sidebar');
    const appElement = document.querySelector('#app');
    
    if (miniSidebar) {
      miniSidebar.style.display = 'none';
    }
    
    if (appElement) {
      appElement.style.marginRight = '0';
      appElement.style.width = '100%';
    }
  },
  
  restaurarSidebars: function() {
    const miniSidebar = document.querySelector('.mini-sidebar');
    const appElement = document.querySelector('#app');
    
    if (miniSidebar) {
      // Restaura o display original ou usa o padrão
      miniSidebar.style.display = this.sidebarState.originalDisplay || 'flex';
    }
    
    if (appElement) {
      // Restaura os valores originais ou usa os padrões
      appElement.style.marginRight = this.sidebarState.originalMarginRight || '70px';
      appElement.style.width = this.sidebarState.originalWidth || 'calc(100% - 70px)';
    }
    
    // Força uma repintura para garantir que as mudanças sejam aplicadas
    setTimeout(() => {
      if (miniSidebar) {
        miniSidebar.style.display = this.sidebarState.originalDisplay || 'flex';
      }
    }, 100);
  },
  
  // =====================================================
  // ADICIONAR LISTENERS PARA MODAL
  // =====================================================
  adicionarListenersModal: function() {
    // Listener para ESC
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        const modal = document.querySelector('.modal-container');
        if (modal) {
          modal.remove();
          this.restaurarSidebars();
          document.removeEventListener('keydown', handleEsc);
        }
      }
    };
    
    document.addEventListener('keydown', handleEsc);
    
    // Listener para clique no overlay (se existir)
    setTimeout(() => {
      const modalOverlay = document.querySelector('.modal-overlay');
      if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
          if (e.target === modalOverlay) {
            const modal = document.querySelector('.modal-container');
            if (modal) {
              modal.remove();
              this.restaurarSidebars();
            }
          }
        });
      }
    }, 100);
    
    // Listener de mutação para detectar quando o modal é removido
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.removedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE && 
                (node.classList.contains('modal-container') || 
                 node.querySelector && node.querySelector('.modal-container'))) {
              this.restaurarSidebars();
              observer.disconnect();
            }
          });
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  },
  
  // =====================================================
  // ATUALIZAR DADOS
  // =====================================================
  atualizarDados: function() {
    window.CRMUI.mostrarNotificacao('🔄 Atualizando dados...', 'info');
    
    // Fecha o modal atual
    const modalAtual = document.querySelector('.modal-container');
    if (modalAtual) {
      modalAtual.remove();
    }
    
    // Restaura sidebar
    this.restaurarSidebars();
    
    // Reabre com dados atualizados
    setTimeout(() => {
      this.mostrarDashboardCompleto();
      window.CRMUI.mostrarNotificacao('✅ Dados atualizados!', 'success');
    }, 500);
  },
  
  // =====================================================
  // CALCULAR MÉTRICAS REAIS
  // =====================================================
  calcularMetricasReais: function(stats) {
    const clientes = Object.values(window.crmState.kanbanData?.clients || {});
    
    // Calcula taxa de resposta real
    const clientesComInteracao = clientes.filter(c => c.ultimaInteracao).length;
    const taxaResposta = clientes.length > 0 ? Math.round((clientesComInteracao / clientes.length) * 100) : 0;
    
    // Calcula tempo médio no funil
    const temposNoFunil = clientes
      .filter(c => c.dataCadastro)
      .map(c => {
        const inicio = new Date(c.dataCadastro);
        const fim = c.vendaFinalizada ? new Date(c.dataVenda || c.ultimaInteracao) : new Date();
        return Math.floor((fim - inicio) / (1000 * 60 * 60 * 24)); // dias
      });
    const tempoMedio = temposNoFunil.length > 0 
      ? Math.round(temposNoFunil.reduce((a, b) => a + b, 0) / temposNoFunil.length)
      : 0;
    
    // Calcula leads parados
    const leadsParados = clientes.filter(c => {
      if (!c.ultimaInteracao) return true;
      const diasSemInteracao = Math.floor((new Date() - new Date(c.ultimaInteracao)) / (1000 * 60 * 60 * 24));
      return diasSemInteracao > 7 && c.status !== 'success';
    }).length;
    
    // Calcula ticket médio real
    const ticketMedio = stats.totalDeals > 0 
      ? Math.round(stats.totalRevenue / stats.totalDeals)
      : 0;
    
    return [
      {
        name: 'Taxa de Resposta',
        icon: '💬',
        value: `${taxaResposta}%`,
        progress: taxaResposta,
        color: '#3b82f6',
        description: `${clientesComInteracao} de ${clientes.length} clientes responderam`
      },
      {
        name: 'Tempo Médio no Funil',
        icon: '⏱️',
        value: `${tempoMedio} dias`,
        progress: Math.min((30 - tempoMedio) / 30 * 100, 100),
        color: '#10b981',
        description: 'Tempo médio até conversão'
      },
      {
        name: 'Leads Parados',
        icon: '⚠️',
        value: leadsParados.toString(),
        progress: Math.max(100 - (leadsParados / Math.max(clientes.length, 1)) * 100, 0),
        color: leadsParados > 5 ? '#ef4444' : '#f59e0b',
        description: `${leadsParados > 0 ? 'Sem interação há mais de 7 dias' : 'Todos os leads estão ativos'}`
      },
      {
        name: 'Ticket Médio',
        icon: '💰',
        value: `R$ ${ticketMedio.toLocaleString('pt-BR')}`,
        progress: Math.min((ticketMedio / 5000) * 100, 100),
        color: '#8b5cf6',
        description: 'Valor médio por venda'
      }
    ];
  },
  
  // =====================================================
  // PREPARAR DADOS PARA GRÁFICOS
  // =====================================================
  prepararDadosGraficos: async function(stats) {
    const clientes = Object.values(window.crmState.kanbanData?.clients || {});
    const colunas = window.crmState.kanbanData?.columns || [];
    
    // Dados do pipeline
    const pipeline = colunas.map(col => ({
      stage: col.title,
      count: col.clients.length,
      color: col.color
    }));
    
    // Dados de origem
    const origens = Object.entries(stats.origens).map(([origem, count]) => ({
      name: origem.charAt(0).toUpperCase() + origem.slice(1),
      value: count,
      percentage: Math.round((count / stats.totalClients) * 100)
    }));
    
    // Dados de evolucao por ciclo comercial
    const vendas = await (window.carregarTodasVendas?.() || (window.CRMCicloComercial?.getHistoricoVendas?.() || []));
    const agrupadas = {};
    vendas.forEach(venda => {
      const ciclo = venda.cicloComercial ?? venda.cicloId ?? "Sem Ciclo";
      agrupadas[ciclo] = (agrupadas[ciclo] || 0) + 1;
    });
    const evolucao = Object.keys(agrupadas).sort().map(ciclo => ({
      ciclo,
      total: agrupadas[ciclo]
    }));

    return { pipeline, origens, evolucao };
  },
  
  // =====================================================
  // CALCULAR EVOLUÇÃO 30 DIAS
  // =====================================================
  calcularEvolucao30Dias: function(clientes) {
    const hoje = new Date();
    const dias = [];
    
    for (let i = 29; i >= 0; i--) {
      const data = new Date(hoje);
      data.setDate(data.getDate() - i);
      
      const clientesAteDia = clientes.filter(c => {
        const dataCadastro = new Date(c.dataCadastro);
        return dataCadastro <= data;
      }).length;
      
      const vendasAteDia = clientes.filter(c => {
        if (!c.vendaFinalizada) return false;
        const dataVenda = new Date(c.dataVenda || c.ultimaInteracao);
        return dataVenda <= data;
      }).length;
      
      dias.push({
        dia: data.getDate(),
        mes: data.getMonth() + 1,
        clientes: clientesAteDia,
        vendas: vendasAteDia
      });
    }
    
    return dias;
  },
  
  // =====================================================
  // RENDER PIPELINE CHART REAL
  // =====================================================
  renderPipelineChartReal: function(pipelineData) {
    const maxValue = Math.max(...pipelineData.map(d => d.count), 1);
    
    return `
      <div style="display: flex; justify-content: space-around; align-items: flex-end; height: 100%; padding: 20px;">
        ${pipelineData.map((stage, index) => {
          const height = Math.max((stage.count / maxValue) * 200, 20);
          const previousCount = index > 0 ? pipelineData[index - 1].count : 0;
          const conversionRate = previousCount > 0 ? Math.round((stage.count / previousCount) * 100) : 100;
          
          return `
            <div style="display: flex; flex-direction: column; align-items: center; flex: 1; position: relative;">
              ${index > 0 ? `
                <div style="
                  position: absolute;
                  top: -40px;
                  font-size: 14px;
                  color: ${conversionRate > 50 ? '#10b981' : '#ef4444'};
                  font-weight: 600;
                ">
                  ${conversionRate}% →
                </div>
              ` : ''}
              <div style="
                width: 60px;
                height: ${height}px;
                background: ${stage.color};
                border-radius: 8px 8px 0 0;
                transition: height 0.5s ease;
                position: relative;
                cursor: pointer;
              " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                <div style="
                  position: absolute;
                  top: -30px;
                  left: 50%;
                  transform: translateX(-50%);
                  font-size: 20px;
                  font-weight: 700;
                  color: ${stage.color};
                ">
                  ${stage.count}
                </div>
              </div>
              <div style="text-align: center; margin-top: 12px;">
                <div style="font-size: 14px; color: #374151; font-weight: 500;">
                  ${stage.stage.replace(/[^a-zA-ZÀ-ÿ\s]/g, '').trim()}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },
  
  // =====================================================
  // RENDER GRÁFICO DE PIZZA PARA ORIGENS
  // =====================================================
  renderOrigemChartPizza: function(origensData) {
    const total = origensData.reduce((sum, o) => sum + o.value, 0) || 1;
    const cores = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];
    
    // Calcula ângulos para o gráfico de pizza
    let startAngle = 0;
    const slices = origensData.map((origem, index) => {
      const percentage = (origem.value / total) * 100;
      const angle = (percentage / 100) * 360;
      const slice = {
        ...origem,
        startAngle,
        endAngle: startAngle + angle,
        color: cores[index % cores.length],
        percentage: Math.round(percentage)
      };
      startAngle += angle;
      return slice;
    });
    
    return `
      <div style="display: flex; align-items: center; justify-content: space-around; height: 100%;">
        <!-- Gráfico de Pizza SVG -->
        <svg width="200" height="200" viewBox="0 0 200 200">
          ${slices.map(slice => {
            const startAngleRad = (slice.startAngle * Math.PI) / 180;
            const endAngleRad = (slice.endAngle * Math.PI) / 180;
            
            const x1 = 100 + 80 * Math.cos(startAngleRad);
            const y1 = 100 + 80 * Math.sin(startAngleRad);
            const x2 = 100 + 80 * Math.cos(endAngleRad);
            const y2 = 100 + 80 * Math.sin(endAngleRad);
            
            const largeArcFlag = slice.endAngle - slice.startAngle > 180 ? 1 : 0;
            
            return `
              <path d="M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z"
                    fill="${slice.color}"
                    stroke="white"
                    stroke-width="2"
                    style="cursor: pointer; transition: all 0.2s;"
                    onmouseover="this.style.transform='scale(1.05)'; this.style.transformOrigin='100px 100px'"
                    onmouseout="this.style.transform='scale(1)'">
                <title>${slice.name}: ${slice.value} (${slice.percentage}%)</title>
              </path>
            `;
          }).join('')}
          
          <!-- Centro branco -->
          <circle cx="100" cy="100" r="40" fill="white" />
          <text x="100" y="100" text-anchor="middle" dominant-baseline="middle" 
                style="font-size: 24px; font-weight: 700; fill: #1f2937;">
            ${total}
          </text>
          <text x="100" y="115" text-anchor="middle" dominant-baseline="middle" 
                style="font-size: 12px; fill: #6b7280;">
            Total
          </text>
        </svg>
        
        <!-- Legenda -->
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${slices.map(slice => `
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 16px; height: 16px; background: ${slice.color}; border-radius: 4px;"></div>
              <div>
                <div style="font-weight: 500; color: #374151;">${slice.name}</div>
                <div style="font-size: 14px; color: #6b7280;">${slice.value} (${slice.percentage}%)</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },
  
  // =====================================================
  // RENDER GRÁFICO DE EVOLUÇÃO
  // =====================================================
  renderEvolucaoChart: function(evolucaoData) {
    if (!Array.isArray(evolucaoData)) {
      console.error("Dados inválidos para o gráfico de evolução:", evolucaoData);
      return;
    }
    const maxClientes = Math.max(...evolucaoData.map(d => d.clientes), 10);
    const maxVendas = Math.max(...evolucaoData.map(d => d.vendas), 5);
    
    return `
      <div style="position: relative; height: 100%; padding: 20px;">
        <!-- Grid de fundo -->
        <div style="position: absolute; inset: 20px; display: flex; flex-direction: column; justify-content: space-between;">
          ${[0, 1, 2, 3, 4].map(i => `
            <div style="border-bottom: 1px solid #f3f4f6; position: relative;">
              <span style="position: absolute; left: -40px; top: -8px; font-size: 12px; color: #9ca3af;">
                ${Math.round(maxClientes - (maxClientes / 4) * i)}
              </span>
            </div>
          `).join('')}
        </div>
        
        <!-- Gráfico de linha -->
        <svg width="100%" height="100%" style="position: relative; z-index: 1;">
          <!-- Linha de Clientes -->
          <polyline
            fill="none"
            stroke="#3b82f6"
            stroke-width="3"
            points="${evolucaoData.map((d, i) => {
              const x = (i / (evolucaoData.length - 1)) * 100;
              const y = 100 - (d.clientes / maxClientes) * 90;
              return `${x}%,${y}%`;
            }).join(' ')}"
          />
          
          <!-- Pontos de Clientes -->
          ${evolucaoData.map((d, i) => {
            const x = (i / (evolucaoData.length - 1)) * 100;
            const y = 100 - (d.clientes / maxClientes) * 90;
            return `
              <circle cx="${x}%" cy="${y}%" r="4" fill="#3b82f6" stroke="white" stroke-width="2">
                <title>Dia ${d.dia}/${d.mes}: ${d.clientes} clientes</title>
              </circle>
            `;
          }).join('')}
          
          <!-- Linha de Vendas -->
          <polyline
            fill="none"
            stroke="#10b981"
            stroke-width="3"
            stroke-dasharray="5,5"
            points="${evolucaoData.map((d, i) => {
              const x = (i / (evolucaoData.length - 1)) * 100;
              const y = 100 - (d.vendas / maxClientes) * 90;
              return `${x}%,${y}%`;
            }).join(' ')}"
          />
          
          <!-- Pontos de Vendas -->
          ${evolucaoData.map((d, i) => {
            const x = (i / (evolucaoData.length - 1)) * 100;
            const y = 100 - (d.vendas / maxClientes) * 90;
            return `
              <circle cx="${x}%" cy="${y}%" r="4" fill="#10b981" stroke="white" stroke-width="2">
                <title>Dia ${d.dia}/${d.mes}: ${d.vendas} vendas</title>
              </circle>
            `;
          }).join('')}
        </svg>
        
        <!-- Legenda -->
        <div style="position: absolute; top: 20px; right: 20px; display: flex; gap: 20px; background: white; padding: 8px 16px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 20px; height: 3px; background: #3b82f6;"></div>
            <span style="font-size: 14px; color: #374151;">Clientes</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 20px; height: 3px; background: #10b981; border-style: dashed; border-width: 2px 0;"></div>
            <span style="font-size: 14px; color: #374151;">Vendas</span>
          </div>
        </div>
        
        <!-- Labels do eixo X -->
        <div style="position: absolute; bottom: 0; left: 20px; right: 20px; display: flex; justify-content: space-between;">
          ${evolucaoData.filter((d, i) => i % 5 === 0 || i === evolucaoData.length - 1).map(d => `
            <span style="font-size: 12px; color: #9ca3af;">${d.dia}/${d.mes}</span>
          `).join('')}
        </div>
      </div>
    `;
  },
  
  // =====================================================
  // GERAR INSIGHTS INTELIGENTES
  // =====================================================
  gerarInsights: function(stats) {
    const insights = [];
    const clientes = Object.values(window.crmState.kanbanData?.clients || {});
    
    // Insight de Tendência
    const vendasUltimos7Dias = clientes.filter(c => {
      if (!c.vendaFinalizada) return false;
      const dataVenda = new Date(c.dataVenda || c.ultimaInteracao);
      const diasAtras = Math.floor((new Date() - dataVenda) / (1000 * 60 * 60 * 24));
      return diasAtras <= 7;
    }).length;
    
    insights.push({
      title: 'Tendência Semanal',
      value: `${vendasUltimos7Dias} vendas`,
      description: 'Fechadas nos últimos 7 dias',
      status: vendasUltimos7Dias > 5 ? 'positive' : 'warning',
      icon: '📈',
      bgColor: '#dbeafe',
      color: '#3b82f6',
      action: 'CRMDashboard.fecharEAbrirPipeline()',
      actionText: 'Ver pipeline'
    });
    
    // Insight de Oportunidades
    const leadsQuentes = clientes.filter(c => 
      c.tags && c.tags.includes('potencial-alto') && !c.vendaFinalizada
    ).length;
    
    if (leadsQuentes > 0) {
      insights.push({
        title: 'Oportunidades Quentes',
        value: leadsQuentes.toString(),
        description: 'Leads com alto potencial aguardando',
        status: 'positive',
        icon: '🔥',
        bgColor: '#fee2e2',
        color: '#ef4444',
        action: 'CRMDashboard.filtrarLeadsQuentes()',
        actionText: 'Ver leads'
      });
    }
    
    // Insight de Performance
    const taxaConversaoMeta = 20;
    insights.push({
      title: 'Taxa de Conversão',
      value: `${stats.conversionRate}%`,
      description: `Meta: ${taxaConversaoMeta}% | ${stats.conversionRate >= taxaConversaoMeta ? 'Acima da meta!' : 'Abaixo da meta'}`,
      status: stats.conversionRate >= taxaConversaoMeta ? 'positive' : 'warning',
      icon: '🎯',
      bgColor: '#d1fae5',
      color: '#10b981'
    });
    
    // Insight de Ticket Médio
    const ticketMedio = stats.totalDeals > 0 ? Math.round(stats.totalRevenue / stats.totalDeals) : 0;
    const ticketMedioMeta = 3000;
    
    insights.push({
      title: 'Ticket Médio',
      value: `R$ ${ticketMedio.toLocaleString('pt-BR')}`,
      description: `${ticketMedio >= ticketMedioMeta ? 'Excelente valor médio!' : 'Oportunidade de upsell'}`,
      status: ticketMedio >= ticketMedioMeta ? 'positive' : 'warning',
      icon: '💰',
      bgColor: '#e9d5ff',
      color: '#8b5cf6'
    });
    
    return insights;
  },
  
  // =====================================================
  // FUNÇÕES AUXILIARES
  // =====================================================
  calcularEstatisticas: function() {
    const data = window.crmState.kanbanData;
    const clients = Object.values(data?.clients || {});
    
    let totalAdesao = 0;
    let totalGordurinha = 0;
    let totalRevenue = 0;
    let totalDeals = 0;
    
    // Calcular origens
    const origens = {};
    
    clients.forEach(client => {
      // Contar origens
      const origem = client.origem || 'whatsapp';
      origens[origem] = (origens[origem] || 0) + 1;
      
      // Somar valores dos negócios
      (client.deals || []).forEach(deal => {
        if (deal.status === 'fechado' || client.vendaFinalizada) {
          totalDeals++;
          totalAdesao += deal.valor_adesao || 0;
          totalGordurinha += deal.valor_gordurinha || 0;
          totalRevenue += deal.valor || 0;
        }
      });
    });
    
    return {
      totalClients: clients.length,
      totalDeals,
      totalRevenue,
      totalAdesao,
      totalGordurinha,
      conversionRate: clients.length > 0 ? Math.round((totalDeals / clients.length) * 100) : 0,
      origens
    };
  },
  
  // Exportar relatório
  exportarRelatorio: function(tipo) {
    const stats = this.calcularEstatisticas();
    const hoje = new Date().toLocaleDateString('pt-BR');
    
    let conteudo = `RELATÓRIO DASHBOARD CRM - ${hoje}\n`;
    conteudo += `========================================\n\n`;
    conteudo += `RESUMO EXECUTIVO\n`;
    conteudo += `Total de Clientes: ${stats.totalClients}\n`;
    conteudo += `Negócios Fechados: ${stats.totalDeals}\n`;
    conteudo += `Faturamento Total: R$ ${stats.totalRevenue.toLocaleString('pt-BR')}\n`;
    conteudo += `Taxa de Conversão: ${stats.conversionRate}%\n\n`;
    
    conteudo += `DETALHAMENTO POR ORIGEM\n`;
    Object.entries(stats.origens).forEach(([origem, count]) => {
      conteudo += `${origem}: ${count} clientes\n`;
    });
    
    const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-dashboard-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    
    window.CRMUI.mostrarNotificacao('📥 Relatório exportado com sucesso!', 'success');
  },
  
  // Compartilhar dashboard
  compartilharDashboard: function() {
    const stats = this.calcularEstatisticas();
    const resumo = `📊 *Dashboard CRM - Resumo*\n\n` +
                  `👥 Clientes: ${stats.totalClients}\n` +
                  `💼 Vendas: ${stats.totalDeals}\n` +
                  `💰 Faturamento: R$ ${stats.totalRevenue.toLocaleString('pt-BR')}\n` +
                  `🎯 Conversão: ${stats.conversionRate}%`;
    
    const whatsappUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(resumo)}`;
    window.open(whatsappUrl, '_blank');
  },
  
  // Filtrar leads quentes
  filtrarLeadsQuentes: function() {
    // Fecha o dashboard antes de abrir o pipeline
    this.fecharDashboard();
    
    // Abre o Kanban com filtro após um delay
    setTimeout(() => {
      if (window.CRMKanbanUI && window.CRMKanbanUI.mostrarKanbanFullscreen) {
        window.CRMKanbanUI.mostrarKanbanFullscreen();
        
        // Aplica filtro de leads quentes após o kanban carregar
        setTimeout(() => {
          const searchInput = document.querySelector('.kanban-search');
          if (searchInput) {
            searchInput.value = 'potencial-alto';
            searchInput.dispatchEvent(new Event('input'));
          }
        }, 500);
      }
    }, 300);
  }
};