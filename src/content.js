// =====================================================
// CRM Vision Pro - Script Principal com Design Original
// =====================================================
// VERSÃO 4.0 - OTIMIZADO E CORRIGIDO

console.log('🚀 CRM Vision Pro - Iniciando...');

// Estado global da aplicação
window.crmState = {
  isOpen: false,
  currentContact: null,
  kanbanData: null,
  rocketLaunched: false,
  analytics: {
    totalClients: 0,
    totalDeals: 0,
    totalRevenue: 0,
    conversionRate: 0,
    totalAdesao: 0,
    totalGordurinha: 0
  }
};

// =====================================================
// FUNÇÃO PRINCIPAL - Inicia toda a extensão
// =====================================================
async function iniciarExtensao() {
  console.log('📱 Verificando WhatsApp Web...');
  
  // Aguarda o WhatsApp carregar completamente
  if (!aguardarWhatsApp()) {
    setTimeout(iniciarExtensao, 1000);
    return;
  }
  
  console.log('✅ WhatsApp Web detectado!');
  
  // Aguarda os módulos carregarem
  await aguardarModulos();
  
  // 1. Carrega dados salvos
  await carregarDadosSalvos();
  
  // 2. Cria a interface com design original
  criarInterface();
  
  // 3. Configura captura automática
  configurarCapturaAutomatica();
  
  // 4. Inicia análise em tempo real
  iniciarAnalytics();
  
  // 5. Configura atalhos de teclado
  configurarAtalhos();
  
  // 6. Inicializa módulos extras
  inicializarModulosExtras();
  
  console.log('🎉 CRM Vision Pro carregado com sucesso!');
  
  // Usa CRMUI para mostrar notificação
  if (window.CRMUI) {
    CRMUI.mostrarNotificacao('🚀 CRM Vision Pro está ativo!', 'success');
  }
}

// =====================================================
// CRIAR INTERFACE - DESIGN ORIGINAL CORRIGIDO
// =====================================================
function criarInterface() {
  // Remove elementos antigos se existirem
  const elementosAntigos = document.querySelectorAll('#crm-sidebar-container, #crm-floating-button');
  elementosAntigos.forEach(el => el.remove());

  // 1. Cria container principal
  const container = document.createElement('div');
  container.id = 'crm-sidebar-container';
  
  container.innerHTML = `
    <!-- Barra Lateral com Design Original -->
    <div id="crm-mini-sidebar" class="mini-sidebar">
      <!-- Lua Animada no Topo -->
      <div class="sidebar-logo">
        <div class="moon-container" id="moon-container">
          <div class="moon-surface">
            <div class="moon-crater" style="width: 20%; height: 20%; top: 20%; left: 30%;"></div>
            <div class="moon-crater" style="width: 15%; height: 15%; top: 50%; left: 60%;"></div>
            <div class="moon-crater" style="width: 25%; height: 25%; top: 60%; left: 20%;"></div>
          </div>
          <img src="${chrome.runtime.getURL('assets/icons/moon.png')}" 
               class="moon-icon" 
               alt="Moon">
        </div>
        
        <!-- Estrelas ao redor da lua -->
        ${Array(6).fill('').map((_, i) => `
          <div class="stars" style="
            top: ${20 + Math.random() * 60}%;
            left: ${10 + Math.random() * 80}%;
            animation-delay: ${Math.random() * 3}s;
          "></div>
        `).join('')}
      </div>
      
      <div class="sidebar-menu">
        <!-- Dashboard -->
        <button type="button" class="sidebar-btn active" data-action="dashboard" title="Dashboard">
          <div class="btn-icon-wrapper">
            <img src="${chrome.runtime.getURL('assets/icons/dashboard.png')}" 
                 class="btn-icon" 
                 alt="Dashboard"
                 loading="eager">
          </div>
          <span class="btn-label">Dashboard</span>
          <div class="shine-effect"></div>
        </button>
        
        <!-- Captura de clientes -->
        <button type="button" class="sidebar-btn" data-action="capture" title="Captura de clientes">
          <div class="btn-icon-wrapper">
            <img src="${chrome.runtime.getURL('assets/icons/capture.png')}" 
                 class="btn-icon" 
                 alt="Captura"
                 loading="eager">
          </div>
          <span class="btn-label">Captura de clientes</span>
          <div class="shine-effect"></div>
        </button>
        
        <!-- CRM -->
        <button type="button" class="sidebar-btn" data-action="kanban" title="CRM">
          <div class="btn-icon-wrapper">
            <img src="${chrome.runtime.getURL('assets/icons/crm.png')}" 
                 class="btn-icon" 
                 alt="CRM"
                 loading="eager">
          </div>
          <span class="btn-label">CRM</span>
          <div class="shine-effect"></div>
        </button>
        
        <!-- Google Sheets -->
        <button type="button" class="sidebar-btn" data-action="sheets" title="Google Sheets">
          <div class="btn-icon-wrapper">
            <img src="${chrome.runtime.getURL('assets/icons/sheets.png')}" 
                 class="btn-icon" 
                 alt="Google Sheets"
                 loading="eager">
          </div>
          <span class="btn-label">Google Sheets</span>
          <div class="shine-effect"></div>
        </button>
      </div>
      
      <div class="sidebar-footer">
        <!-- Botão de Foguete Animado -->
        <button type="button" class="rocket-button" id="rocket-button" title="Boost">
          <img src="${chrome.runtime.getURL('assets/icons/rocket.png')}" 
               class="rocket-icon" 
               alt="Rocket"
               loading="eager">
        </button>
        
        <!-- Container do foguete animado -->
        <div class="rocket-container" id="rocket-animated">
          <img src="${chrome.runtime.getURL('assets/icons/rocket.png')}" 
               class="rocket-animated" 
               alt="Rocket">
        </div>
        
        <!-- Nuvens de fumaça -->
        ${Array(12).fill('').map((_, i) => `
          <div class="smoke-cloud" style="
            bottom: ${20 + Math.random() * 30}px;
            right: ${20 + Math.random() * 20}px;
            animation-delay: ${i * 0.1}s;
            width: ${20 + Math.random() * 20}px;
            height: ${20 + Math.random() * 20}px;
          "></div>
        `).join('')}
      </div>
    </div>
    
    <!-- Overlay para modais -->
    <div id="crm-overlay" class="overlay hidden"></div>
  `;
  
  document.body.appendChild(container);
  
  // 2. Força carregamento das imagens
  forcarCarregamentoImagens();
  
  // 3. Configura eventos e animações
  setTimeout(() => {
    configurarEventosSidebar();
    configurarAnimacaoFoguete();
    configurarHoverSidebar();
    verificarVisibilidadeIcones();
  }, 100);
  
  // 4. Ajusta layout do WhatsApp
  ajustarLayoutWhatsApp();
  
  // 5. Adiciona mensagem de boas-vindas
  mostrarBoasVindas();
}

// =====================================================
// FORÇAR CARREGAMENTO DAS IMAGENS
// =====================================================
function forcarCarregamentoImagens() {
  const imagens = document.querySelectorAll('.mini-sidebar img');
  imagens.forEach(img => {
    img.style.display = 'block';
    img.style.visibility = 'visible';
    img.style.opacity = '1';
    
    // Force load se ainda não carregou
    if (!img.complete) {
      img.onload = () => {
        img.style.display = 'block';
        img.style.visibility = 'visible';
        img.style.opacity = '1';
      };
      img.onerror = () => {
        console.warn('❌ Erro ao carregar imagem:', img.src);
        // Fallback com ícone unicode
        img.style.display = 'none';
        const parent = img.parentElement;
        if (parent) {
          parent.innerHTML = getIconFallback(img.alt);
          parent.style.fontSize = '24px';
          parent.style.display = 'flex';
          parent.style.alignItems = 'center';
          parent.style.justifyContent = 'center';
        }
      };
    }
  });
}

// =====================================================
// FALLBACK DE ÍCONES
// =====================================================
function getIconFallback(alt) {
  const icons = {
    'Dashboard': '📊',
    'Captura': '👥',
    'CRM': '📋',
    'Google Sheets': '📄',
    'Rocket': '🚀',
    'Moon': '🌙'
  };
  return icons[alt] || '⚙️';
}

// =====================================================
// VERIFICAR VISIBILIDADE DOS ÍCONES
// =====================================================
function verificarVisibilidadeIcones() {
  const botoes = document.querySelectorAll('.sidebar-btn');
  
  botoes.forEach(botao => {
    const icone = botao.querySelector('.btn-icon');
    const wrapper = botao.querySelector('.btn-icon-wrapper');
    
    if (icone && wrapper) {
      // Força estilos diretamente nos elementos
      icone.style.display = 'block';
      icone.style.visibility = 'visible';
      icone.style.opacity = '1';
      icone.style.pointerEvents = 'auto';
      
      wrapper.style.display = 'flex';
      wrapper.style.alignItems = 'center';
      wrapper.style.justifyContent = 'center';
      wrapper.style.visibility = 'visible';
      wrapper.style.opacity = '1';
      
      // Debug log
      console.log('✅ Ícone configurado:', icone.alt, {
        display: icone.style.display,
        visibility: icone.style.visibility,
        opacity: icone.style.opacity
      });
    }
  });
}

// =====================================================
// CONFIGURAR ANIMAÇÃO DO FOGUETE
// =====================================================
function configurarAnimacaoFoguete() {
  const rocketButton = document.getElementById('rocket-button');
  const moonContainer = document.getElementById('moon-container');
  
  if (!rocketButton || !moonContainer) return;
  
  // Evento de hover no botão
  rocketButton.addEventListener('mouseenter', () => {
    // Marca que o foguete foi lançado
    window.crmState.rocketLaunched = true;
    
    // Adiciona classe à lua para ela reagir
    moonContainer.classList.add('rocket-approaching');
    
    // Remove a classe após a animação terminar
    setTimeout(() => {
      moonContainer.classList.remove('rocket-approaching');
      window.crmState.rocketLaunched = false;
    }, 3000);
  });
  
  // Evento de clique no botão do foguete
  rocketButton.addEventListener('click', () => {
    if (window.CRMUI) {
      CRMUI.mostrarNotificacao('🚀 Boost ativado!', 'success');
    }
  });
}

// =====================================================
// CONFIGURAR HOVER DA SIDEBAR
// =====================================================
function configurarHoverSidebar() {
  const sidebar = document.querySelector('.mini-sidebar');
  const app = document.querySelector('#app');
  
  if (!sidebar || !app) return;
  
  // Adiciona classe inicial ao WhatsApp
  app.classList.add('whatsapp-adjusted');
  
  // Eventos de hover
  sidebar.addEventListener('mouseenter', () => {
    app.classList.add('whatsapp-adjusted-expanded');
    // Re-verifica visibilidade ao expandir
    setTimeout(verificarVisibilidadeIcones, 50);
  });
  
  sidebar.addEventListener('mouseleave', () => {
    app.classList.remove('whatsapp-adjusted-expanded');
    // Re-verifica visibilidade ao contrair
    setTimeout(verificarVisibilidadeIcones, 50);
  });
}

// =====================================================
// CONFIGURAR EVENTOS DA SIDEBAR - DESIGN ORIGINAL
// =====================================================
function configurarEventosSidebar() {
  console.log('🔧 Configurando eventos da sidebar...');
  
  const container = document.getElementById('crm-sidebar-container');
  if (!container) {
    console.error('❌ Container da sidebar não encontrado');
    return;
  }
  
  // Delegação de eventos para os botões
  container.addEventListener('click', function(e) {
    const botao = e.target.closest('.sidebar-btn');
    
    if (botao) {
      e.preventDefault();
      e.stopPropagation();
      
      const action = botao.dataset.action;
      console.log('🎯 Botão clicado:', action);
      
      if (action) {
        // Remove classe active de todos os botões
        container.querySelectorAll('.sidebar-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        
        // Adiciona classe active ao botão clicado
        botao.classList.add('active');
        
        // Executa ação
        executarAcao(action);
      }
    }
  });
  
  console.log('✅ Eventos da sidebar configurados');
}

// =====================================================
// AJUSTAR LAYOUT DO WHATSAPP
// =====================================================
function ajustarLayoutWhatsApp() {
  const app = document.querySelector('#app');
  if (!app) return;
  
  // Adiciona estilos inline como fallback
  app.style.transition = 'all 0.3s ease';
  app.style.marginRight = '64px';
  app.style.width = 'calc(100% - 64px)';
}

// =====================================================
// EXECUTAR AÇÕES
// =====================================================
async function executarAcao(action) {
  console.log(`🎯 Executando ação: ${action}`);
  
  await aguardarModulos();
  
  try {
    switch (action) {
      case 'dashboard':
        console.log('📈 Abrindo Dashboard...');
        if (window.CRMDashboard?.mostrarDashboardCompleto) {
          window.CRMDashboard.mostrarDashboardCompleto();
        } else {
          mostrarDashboardBasico();
        }
        break;
        
      case 'capture':
        console.log('👤 Capturando contato...');
        await capturarContatoAtual();
        break;
        
      case 'kanban':
        console.log('👥 Abrindo CRM...');
        if (window.CRMKanbanUI?.mostrarKanbanFullscreen) {
          if (!window.CRMKanbanCore?.isInitialized) {
            await window.CRMKanbanCore?.inicializarKanban();
          }
          window.CRMKanbanUI.mostrarKanbanFullscreen();
        } else {
          CRMUI.mostrarNotificacao('❌ Módulo CRM não encontrado', 'error');
        }
        break;
        
      case 'sheets':
        console.log('📊 Abrindo Google Sheets...');
        if (window.CRMGoogleSheets?.mostrarPainelConfiguracao) {
          window.CRMGoogleSheets.mostrarPainelConfiguracao();
        } else {
          CRMUI.mostrarNotificacao('❌ Módulo Google Sheets não encontrado', 'error');
        }
        break;
        
      default:
        console.warn('⚠️ Ação desconhecida:', action);
        CRMUI.mostrarNotificacao(`Ação "${action}" não reconhecida`, 'warning');
    }
  } catch (erro) {
    console.error('❌ Erro ao executar ação:', erro);
    CRMUI.mostrarNotificacao(`Erro ao executar ação: ${erro.message}`, 'error');
  }
}

// =====================================================
// MOSTRAR BOAS VINDAS
// =====================================================
function mostrarBoasVindas() {
  const hoje = new Date().toDateString();
  const ultimaVez = localStorage.getItem('crm_ultima_boas_vindas');
  
  if (ultimaVez !== hoje) {
    setTimeout(() => {
      if (window.CRMUI) {
        CRMUI.mostrarNotificacao('✨ CRM Vision Pro está ativo!', 'success');
      }
      localStorage.setItem('crm_ultima_boas_vindas', hoje);
    }, 2000);
  }
}

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

// Aguardar WhatsApp
function aguardarWhatsApp() {
  const app = document.querySelector('#app');
  const sidebar = document.querySelector('[data-testid="chat-list"]');
  const main = document.querySelector('#main');
  
  return app && (sidebar || main);
}

// Aguardar módulos
async function aguardarModulos() {
  return new Promise((resolve) => {
    const verificarModulos = () => {
      const modulosNecessarios = {
        CRMUI: !!window.CRMUI,
        CRMCicloComercial: !!window.CRMCicloComercial,
        CRMKanbanCore: !!window.CRMKanbanCore,
        CRMKanbanUI: !!window.CRMKanbanUI
      };
      
      const todosProntos = Object.values(modulosNecessarios).every(Boolean);
      
      if (todosProntos) {
        console.log('✅ Todos os módulos principais carregados');
        resolve();
      } else {
        console.log('⏳ Aguardando módulos...', modulosNecessarios);
        setTimeout(verificarModulos, 100);
      }
    };
    verificarModulos();
  });
}

// Carregar dados salvos
async function carregarDadosSalvos() {
  try {
    if (window.CRMKanbanCore) {
      await window.CRMKanbanCore.carregarDados();
      console.log('📊 Dados Kanban carregados via Core:', window.crmState.kanbanData);
    } else {
      console.warn('⚠️ CRMKanbanCore não disponível para carregar dados.');
      window.crmState.kanbanData = {
        clients: {},
        columns: [
          { id: 'leads', title: '🎯 Leads', clients: [], color: '#6366f1' },
          { id: 'negotiation', title: '💬 Em Negociação', clients: [], color: '#8b5cf6' },
          { id: 'proposal', title: '📝 Proposta Enviada', clients: [], color: '#ec4899' },
          { id: 'closing', title: '🤝 Fechamento', clients: [], color: '#f59e0b' },
          { id: 'success', title: '✅ Sucesso', clients: [], color: '#10b981' }
        ]
      };
    }
  } catch (erro) {
    console.error('❌ Erro ao carregar dados salvos:', erro);
  }
}

// Capturar contato atual
async function capturarContatoAtual() {
  CRMUI.mostrarNotificacao('📸 Capturando dados do contato...', 'info');
  
  let dadosContato = {
    nome: 'Contato Atual',
    telefone: '',
    imagem: ''
  };
  
  if (window.CRMCapture && typeof CRMCapture.capturarDadosContato === 'function') {
    try {
      const dadosReais = CRMCapture.capturarDadosContato();
      if (dadosReais && dadosReais.nome) {
        dadosContato = dadosReais;
      }
    } catch (error) {
      console.warn('⚠️ Erro na captura automática:', error);
    }
  }
  
  if (!dadosContato.nome || dadosContato.nome === 'Contato Atual') {
    const cadastrarManualmente = await CRMUI.confirmar({
      titulo: 'Captura de Contato',
      mensagem: 'Não foi possível detectar dados do contato automaticamente. Deseja cadastrar manualmente?',
      textoBotaoConfirmar: 'Sim, cadastrar',
      textoBotaoCancelar: 'Cancelar'
    });
    
    if (cadastrarManualmente) {
      mostrarFormularioCadastro({});
    }
    return;
  }
  
  mostrarFormularioCadastro(dadosContato);
}

// Mostrar formulário de cadastro - CORRIGIDO PARA ABRIR NEGÓCIO APÓS SALVAR
function mostrarFormularioCadastro(dadosIniciais = {}) {
  const conteudo = `
    <div class="cadastro-form">
      <div class="form-header" style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px;">
        <img src="${dadosIniciais.imagem || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMzAiIGZpbGw9IiNFNUU3RUIiLz4KPHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSIxNSIgeT0iMTUiPgo8cGF0aCBkPSJNMTUgMThDMTguMzEzNyAxOCAyMSAxNS4zMTM3IDIxIDEyQzIxIDguNjg2MyAxOC4zMTM3IDYgMTUgNkMxMS42ODYzIDYgOSA4LjY4NjMgOSAxMkM5IDE1LjMxMzcgMTEuNjg2MyAxOCAxNSAxOFoiIGZpbGw9IiM5Qjk5OUIiLz4KPHBhdGggZD0iTTMwIDI2QzMwIDIwIDIzLjI4NDMgMTUgMTUgMTVDNi43MTU3MyAxNSAwIDIwIDAgMjZIMzBaIiBmaWxsPSIjOUI5OTlCIi8+Cjwvc3ZnPgo8L3N2Zz4K'}" 
             class="contact-photo" 
             alt="Foto" 
             style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;">
        <div class="contact-info">
          <h3 style="margin: 0;">${dadosIniciais.nome || 'Novo Contato'}</h3>
          <p style="margin: 0; color: #6b7280;">${dadosIniciais.telefone || ''}</p>
        </div>
      </div>
      
      <form id="form-cadastro-contato" style="margin-top: 20px;">
        <div class="form-field" style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 4px; font-weight: 500;">Nome Completo <span class="required">*</span></label>
          <input type="text" name="nome" value="${dadosIniciais.nome || ''}" required class="field-input"
                 style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
        </div>
        
        <div class="form-field" style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 4px; font-weight: 500;">Telefone <span class="required">*</span></label>
          <input type="tel" name="telefone" value="${dadosIniciais.telefone || ''}" required class="field-input"
                 style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
        </div>
        
        <div class="form-field" style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 4px; font-weight: 500;">Email</label>
          <input type="email" name="email" placeholder="email@exemplo.com" class="field-input"
                 style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
        </div>
        
        <div class="form-field" style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 4px; font-weight: 500;">Origem</label>
          <select name="origem" id="origem-select" class="field-input"
                  style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
            <option value="whatsapp">WhatsApp</option>
            <option value="indicacao">Indicação</option>
            <option value="site">Site</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
          </select>
        </div>
        
        <div id="campos-indicacao" style="display: none;">
          <div class="form-field" style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 4px; font-weight: 500;">Nome do Indicador</label>
            <input type="text" name="indicador_nome" placeholder="Quem indicou?" class="field-input"
                   style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
          </div>
          <div class="form-field" style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 4px; font-weight: 500;">Telefone do Indicador</label>
            <input type="tel" name="indicador_telefone" placeholder="Telefone de quem indicou" class="field-input"
                   style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px;">
          </div>
        </div>
        
        <div class="form-field" style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 4px; font-weight: 500;">Tags</label>
          <div class="tags-container" style="display: flex; flex-direction: column; gap: 8px;">
            <label style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" name="tags" value="potencial-alto"> 
              <span>🔥 Potencial Alto</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" name="tags" value="urgente"> 
              <span>⚡ Urgente</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" name="tags" value="retorno"> 
              <span>🔄 Retorno</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" name="tags" value="vip"> 
              <span>⭐ VIP</span>
            </label>
          </div>
        </div>
        
        <div class="form-field">
          <label style="display: block; margin-bottom: 4px; font-weight: 500;">Observações</label>
          <textarea name="observacoes" rows="3" placeholder="Adicione notas sobre este contato..." class="field-input"
                    style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; resize: vertical;"></textarea>
        </div>
      </form>
    </div>
  `;
  
  const modal = CRMUI.criarModal({
    titulo: 'Cadastrar Contato',
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
        texto: '💾 Salvar e Continuar',
        tipo: 'primary',
        onClick: () => {
          const form = document.getElementById('form-cadastro-contato');
          const formData = new FormData(form);
          const dados = {};
          
          for (let [key, value] of formData.entries()) {
            if (key === 'tags') {
              if (!dados.tags) dados.tags = [];
              dados.tags.push(value);
            } else {
              dados[key] = value;
            }
          }
          
          dados.imagem = dadosIniciais.imagem || '';
          
          salvarContatoEContinuar(dados);
          modal.fechar();
        }
      }
    ]
  });
  
  setTimeout(() => {
    const origemSelect = document.getElementById('origem-select');
    const camposIndicacao = document.getElementById('campos-indicacao');
    
    if (origemSelect && camposIndicacao) {
      origemSelect.addEventListener('change', (e) => {
        if (e.target.value === 'indicacao') {
          camposIndicacao.style.display = 'block';
        } else {
          camposIndicacao.style.display = 'none';
        }
      });
    }
  }, 100);
}

// Salvar contato e continuar - CORRIGIDO PARA ABRIR NEGÓCIO AUTOMATICAMENTE
async function salvarContatoEContinuar(dados) {
  try {
    console.log('💾 Salvando novo contato:', dados);
    
    const novoCliente = {
      id: 'client_' + Date.now(),
      nome: dados.nome,
      telefone: dados.telefone,
      email: dados.email || '',
      origem: dados.origem || 'whatsapp',
      tags: dados.tags || [],
      observacoes: dados.observacoes || '',
      dataCadastro: new Date().toISOString(),
      ultimaInteracao: new Date().toISOString(),
      status: 'lead',
      deals: [],
      photo: dados.imagem || '',
      vendaFinalizada: false
    };
    
    if (dados.origem === 'indicacao' && dados.indicador_nome) {
      novoCliente.indicacao = {
        nome: dados.indicador_nome || '',
        telefone: dados.indicador_telefone || ''
      };
    }
    
    let clienteAdicionado = null;
    
    if (!window.CRMKanbanCore) {
      console.error('❌ CRMKanbanCore não está disponível');
      
      if (!window.crmState.kanbanData) {
        window.crmState.kanbanData = {
          clients: {},
          columns: []
        };
      }
      
      if (!window.crmState.kanbanData.clients) {
        window.crmState.kanbanData.clients = {};
      }
      
      window.crmState.kanbanData.clients[novoCliente.id] = novoCliente;
      
      if (window.crmState.kanbanData.columns && window.crmState.kanbanData.columns.length > 0) {
        const primeiraColuna = window.crmState.kanbanData.columns[0];
        if (!primeiraColuna.clients) {
          primeiraColuna.clients = [];
        }
        primeiraColuna.clients.push(novoCliente.id);
      }
      
      localStorage.setItem('crm_kanban_data', JSON.stringify(window.crmState.kanbanData));
      
      clienteAdicionado = novoCliente;
      
      CRMUI.mostrarNotificacao('✅ Contato salvo com sucesso! (modo fallback)', 'success');
    } else {
      clienteAdicionado = window.CRMKanbanCore.adicionarCliente(novoCliente);
      
      if (clienteAdicionado) {
        console.log('✅ Cliente adicionado via Core:', clienteAdicionado);
        
        CRMUI.mostrarNotificacao('✅ Contato salvo com sucesso!', 'success');
        
        atualizarAnalytics();
        
        if (window.CRMKanbanUI && window.CRMKanbanUI.isFullscreen) {
          const kanbanColumns = document.querySelector('.kanban-columns');
          if (kanbanColumns) {
            console.log('🔄 Atualizando visualização do Kanban...');
            window.CRMKanbanUI.renderizarColunas(kanbanColumns);
          }
        }
      } else {
        throw new Error('Falha ao adicionar cliente via Core');
      }
    }
    
    // AQUI ESTÁ A CORREÇÃO: Abre automaticamente o formulário de negócio após salvar
    if (clienteAdicionado && clienteAdicionado.id) {
      setTimeout(() => {
        console.log('💼 Abrindo formulário de negócio automaticamente...');
        if (window.CRMKanbanUI?.mostrarFormularioNovoNegocio) {
          window.CRMKanbanUI.mostrarFormularioNovoNegocio(clienteAdicionado.id);
        }
      }, 500);
    }
    
  } catch (erro) {
    console.error('❌ Erro ao salvar contato:', erro);
    CRMUI.mostrarNotificacao('❌ Erro ao salvar contato: ' + erro.message, 'error');
  }
}

// Mostrar dashboard básico
function mostrarDashboardBasico() {
  const stats = calcularEstatisticas();
  
  const conteudo = `
    <div style="padding: 24px;">
      <h2 style="margin: 0 0 24px 0; color: #1f2937;">📊 Dashboard CRM</h2>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 20px; border-radius: 12px;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; opacity: 0.9;">Total de Clientes</h3>
          <div style="font-size: 32px; font-weight: bold;">${stats.totalClients}</div>
        </div>
        
        <div style="background: linear-gradient(135deg, #10b981, #047857); color: white; padding: 20px; border-radius: 12px;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; opacity: 0.9;">Vendas Fechadas</h3>
          <div style="font-size: 32px; font-weight: bold;">${stats.totalDeals}</div>
        </div>
        
        <div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 20px; border-radius: 12px;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; opacity: 0.9;">Faturamento</h3>
          <div style="font-size: 28px; font-weight: bold;">R$ ${stats.totalRevenue.toLocaleString('pt-BR')}</div>
        </div>
        
        <div style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 20px; border-radius: 12px;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; opacity: 0.9;">Taxa de Conversão</h3>
          <div style="font-size: 32px; font-weight: bold;">${stats.conversionRate}%</div>
        </div>
      </div>
      
      <div style="text-align: center;">
        <button onclick="window.CRMKanbanUI.mostrarKanbanFullscreen()" style="
          background: #6366f1;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          margin-right: 12px;
        ">📋 Abrir Pipeline</button>
        
        ${window.CRMGoogleSheets ? `
          <button onclick="window.CRMGoogleSheets.mostrarPainelConfiguracao()" style="
            background: #10b981;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
          ">📊 Google Sheets</button>
        ` : ''}
      </div>
    </div>
  `;
  
  const modal = CRMUI.criarModal({
    titulo: '📊 Dashboard CRM',
    conteudo: conteudo,
    tamanho: 'large',
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

// Outras funções auxiliares mantidas do código original...
function calcularEstatisticas() {
  if (window.CRMKanbanCore) {
    return window.CRMKanbanCore.obterEstatisticas();
  } else {
    console.warn('⚠️ CRMKanbanCore não disponível para calcular estatísticas.');
    return {
      totalClients: 0,
      totalDeals: 0,
      totalRevenue: 0,
      conversionRate: 0,
      totalAdesao: 0,
      totalGordurinha: 0
    };
  }
}

function inicializarModulosExtras() {
  if (window.CRMGoogleSheets) {
    try {
      window.CRMGoogleSheets.inicializar();
      console.log('✅ Google Sheets inicializado');
    } catch (error) {
      console.error('❌ Erro ao inicializar Google Sheets:', error);
    }
  }
  
  if (window.CRMCicloComercial && typeof window.CRMCicloComercial.inicializar === 'function') {
    try {
      window.CRMCicloComercial.inicializar();
      console.log('✅ Ciclo Comercial inicializado');
    } catch (error) {
      console.error('❌ Erro ao inicializar Ciclo Comercial:', error);
    }
  }

  if (window.CRMKanbanCore && !window.CRMKanbanCore.isInitialized) {
    window.CRMKanbanCore.inicializarKanban();
  }
}

function configurarCapturaAutomatica() {
  if (!window.CRMCapture) {
    console.warn('⚠️ Módulo CRMCapture não encontrado');
    return;
  }
  
  const observer = new MutationObserver(() => {
    try {
      const novoContato = CRMCapture.detectarMudancaContato();
      if (novoContato) {
        window.crmState.currentContact = novoContato;
        console.log('📱 Novo contato detectado:', novoContato);
      }
    } catch (error) {
      console.warn('⚠️ Erro na captura automática:', error);
    }
  });
  
  const chatContainer = document.querySelector('#main');
  if (chatContainer) {
    observer.observe(chatContainer, {
      childList: true,
      subtree: true
    });
  }
}

function iniciarAnalytics() {
  setInterval(atualizarAnalytics, 30000);
  atualizarAnalytics();
}

function atualizarAnalytics() {
  const stats = calcularEstatisticas();
  window.crmState.analytics = stats;
  console.log('📊 Analytics atualizado:', stats);
}

function configurarAtalhos() {
  document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+C = Capturar contato
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      executarAcao('capture');
    }
    
    // Ctrl+Shift+K = Abrir Kanban
    if (e.ctrlKey && e.shiftKey && e.key === 'K') {
      e.preventDefault();
      executarAcao('kanban');
    }
    
    // Ctrl+Shift+D = Dashboard
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      executarAcao('dashboard');
    }
    
    // Ctrl+Shift+S = Google Sheets
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      executarAcao('sheets');
    }
  });
}

// Tratamento de mensagens
window.addEventListener('message', (event) => {
  if (event.data.type === 'CRM_ACTION') {
    switch (event.data.action) {
      case 'editarCliente':
        if (window.CRMKanbanUI) {
          window.CRMKanbanUI.mostrarFormularioEdicaoCliente(event.data.clientId);
        }
        break;
        
      case 'novoNegocio':
        if (event.data.clientId && window.CRMKanbanUI) {
          window.CRMKanbanUI.mostrarFormularioNovoNegocio(event.data.clientId);
        }
        break;
        
      case 'syncSheets':
        if (window.CRMGoogleSheets) {
          window.CRMGoogleSheets.syncAllData();
        }
        break;
    }
  }
});

// =====================================================
// INICIALIZAÇÃO
// =====================================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciarExtensao);
} else {
  iniciarExtensao();
}