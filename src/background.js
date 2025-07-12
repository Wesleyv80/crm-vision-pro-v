// =====================================================
// Background Script - CRM Vision Pro
// =====================================================
// Gerencia autenticação, armazenamento e comunicação entre scripts
// VERSÃO 2.0.2 - CORRIGIDA: Tratamento de resposta assíncrona para chrome.runtime.onMessage
// =====================================================

console.log('🚀 CRM Vision Pro - Background Script iniciado');

// =====================================================
// LISTENER DE MENSAGENS PRINCIPAL
// =====================================================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Mensagem recebida:', request.action);

  // Retorna true para indicar que a resposta será enviada assincronamente
  let handled = true;

  switch (request.action) {
    // ===== AUTENTICAÇÃO GOOGLE =====
    case 'authenticate':
      handleAuthentication(sendResponse);
      break;

    case 'removeToken':
      handleRemoveToken(request.token, sendResponse);
      break;

    case 'getAuthToken':
      handleGetAuthToken(sendResponse);
      break;

    case 'checkAuth':
      handleCheckAuth(sendResponse);
      break;

    // ===== GERENCIAMENTO DE DADOS =====
    case 'salvarDados':
      salvarDados(request.uid, request.data)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      break;

    case 'carregarDados':
      carregarDados(request.uid)
        .then(data => sendResponse(data))
        .catch(error => sendResponse(null));
      break;

    case 'removerDados':
      removerDados(request.uid)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      break;

    case 'listarChaves':
      listarChaves()
        .then(keys => sendResponse({ keys }))
        .catch(error => sendResponse({ keys: [] }));
      break;

    case 'limparTudo':
      limparTudo()
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      break;

    // ===== AÇÕES DO WHATSAPP =====
    case 'capturar':
      console.log('📸 Capturando dados:', request.selecao);
      sendResponse({ success: true });
      break;

    case 'abrirCRM':
      console.log('🚀 Abrindo CRM');
      sendResponse({ success: true });
      break;

    case 'syncData':
      console.log('🔄 Sincronizando dados');
      sendResponse({ success: true });
      break;

    default:
      console.warn('⚠️ Ação desconhecida:', request.action);
      sendResponse({ success: false, error: 'Ação desconhecida' });
      handled = false; // Não foi uma ação assíncrona tratada
  }

  // Retorna true apenas se a mensagem foi tratada de forma assíncrona
  return handled;
});

// =====================================================
// FUNÇÕES DE AUTENTICAÇÃO GOOGLE
// =====================================================
function handleAuthentication(sendResponse) {
  console.log('🔐 Iniciando autenticação Google...');

  if (!chrome.identity) {
    console.error('❌ Chrome Identity API não disponível');
    sendResponse({
      success: false,
      error: 'API de autenticação não disponível'
    });
    return;
  }

  chrome.identity.getAuthToken({ interactive: true }, (token) => {
    if (chrome.runtime.lastError) {
      console.error('❌ Erro na autenticação:', chrome.runtime.lastError);
      sendResponse({
        success: false,
        error: chrome.runtime.lastError.message
      });
      return;
    }

    if (token) {
      console.log('✅ Token obtido com sucesso');
      sendResponse({
        success: true,
        token: token
      });
    } else {
      console.error('❌ Token não recebido');
      sendResponse({
        success: false,
        error: 'Token não recebido'
      });
    }
  });
}

function handleRemoveToken(token, sendResponse) {
  if (!token) {
    sendResponse({
      success: false,
      error: 'Token não fornecido'
    });
    return;
  }

  if (!chrome.identity) {
    sendResponse({
      success: false,
      error: 'API de autenticação não disponível'
    });
    return;
  }

  chrome.identity.removeCachedAuthToken({ token: token }, () => {
    if (chrome.runtime.lastError) {
      console.error('❌ Erro ao remover token:', chrome.runtime.lastError);
      sendResponse({
        success: false,
        error: chrome.runtime.lastError.message
      });
    } else {
      console.log('✅ Token removido com sucesso');
      sendResponse({
        success: true
      });
    }
  });
}

function handleGetAuthToken(sendResponse) {
  if (!chrome.identity) {
    sendResponse({
      success: false,
      error: 'API de autenticação não disponível'
    });
    return;
  }

  chrome.identity.getAuthToken({ interactive: false }, (token) => {
    if (chrome.runtime.lastError) {
      sendResponse({
        success: false,
        error: chrome.runtime.lastError.message
      });
      return;
    }

    sendResponse({
      success: true,
      token: token || null
    });
  });
}

function handleCheckAuth(sendResponse) {
  if (!chrome.identity) {
    sendResponse({
      success: false,
      authenticated: false,
      error: 'API de autenticação não disponível'
    });
    return;
  }

  chrome.identity.getAuthToken({ interactive: false }, (token) => {
    sendResponse({
      success: true,
      authenticated: !!token && !chrome.runtime.lastError,
      token: token || null
    });
  });
}

// =====================================================
// FUNÇÕES DE ARMAZENAMENTO
// =====================================================
async function salvarDados(uid, data) {
  try {
    const key = `crm_${uid}`;
    const dataToStore = { [key]: data };

    await chrome.storage.local.set(dataToStore);
    console.log(`✅ Dados salvos: ${key}`);

    // Atualiza badge se for dados do kanban
    if (uid === 'kanban_data') {
      const stats = calcularEstatisticas(data);
      await atualizarBadge(stats.totalClients);
    }

    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar:', error);
    throw error;
  }
}

async function carregarDados(uid) {
  try {
    const key = `crm_${uid}`;
    const result = await chrome.storage.local.get(key);

    console.log(`📦 Dados carregados: ${key}`);
    return result[key] || null;
  } catch (error) {
    console.error('❌ Erro ao carregar:', error);
    throw error;
  }
}

async function removerDados(uid) {
  try {
    const key = `crm_${uid}`;
    await chrome.storage.local.remove(key);

    console.log(`🗑️ Dados removidos: ${key}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao remover:', error);
    throw error;
  }
}

async function listarChaves() {
  try {
    const allData = await chrome.storage.local.get();
    const keys = Object.keys(allData);

    console.log(`📋 Total de chaves: ${keys.length}`);
    return keys;
  } catch (error) {
    console.error('❌ Erro ao listar chaves:', error);
    throw error;
  }
}

async function limparTudo() {
  try {
    // Lista todas as chaves CRM
    const allData = await chrome.storage.local.get();
    const crmKeys = Object.keys(allData).filter(k => k.startsWith('crm_'));

    // Remove apenas as chaves do CRM
    await chrome.storage.local.remove(crmKeys);

    console.log(`🧹 ${crmKeys.length} chaves removidas`);

    // Limpa o badge
    if (chrome.action) {
      await chrome.action.setBadgeText({ text: '' });
    }

    return true;
  } catch (error) {
    console.error('❌ Erro ao limpar tudo:', error);
    throw error;
  }
}

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================
function calcularEstatisticas(data) {
  if (!data) return { totalClients: 0, totalDeals: 0 };

  const totalClients = Object.keys(data.clients || {}).length;
  const totalDeals = Object.values(data.clients || {})
    .reduce((sum, client) => sum + (client.deals?.length || 0), 0);

  return { totalClients, totalDeals };
}

async function atualizarBadge(numero) {
  try {
    if (!chrome.action) {
      console.warn('⚠️ Chrome Action API não disponível');
      return;
    }

    if (numero > 0) {
      await chrome.action.setBadgeText({ text: numero.toString() });
      await chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
    } else {
      await chrome.action.setBadgeText({ text: '' });
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar badge:', error);
  }
}

// =====================================================
// GERENCIAMENTO DE ABAS
// =====================================================
// Monitora quando uma aba do WhatsApp Web é ativada
if (chrome.tabs && chrome.tabs.onActivated) {
  chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
      if (tab && tab.url && tab.url.includes('web.whatsapp.com')) {
        console.log('📱 WhatsApp Web ativado');
      }
    });
  });
}

// =====================================================
// INSTALAÇÃO E ATUALIZAÇÃO
// =====================================================
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('🚀 Extensão instalada/atualizada:', details.reason);

  if (details.reason === 'install') {
    console.log('🎉 Bem-vindo ao CRM Vision Pro!');

    // Cria estrutura inicial
    const estruturaInicial = {
      clients: {},
      columns: [
        { id: 'leads', title: '🎯 Leads', clients: [], color: '#6366f1' },
        { id: 'negotiation', title: '💬 Em Negociação', clients: [], color: '#8b5cf6' },
        { id: 'proposal', title: '📝 Proposta Enviada', clients: [], color: '#ec4899' },
        { id: 'closing', title: '🤝 Fechamento', clients: [], color: '#f59e0b' },
        { id: 'success', title: '✅ Sucesso', clients: [], color: '#10b981' }
      ],
      tasks: [],
      settings: {
        theme: 'light',
        notifications: true,
        autoCapture: true
      }
    };

    await salvarDados('kanban_data', estruturaInicial);
    await salvarDados('settings', estruturaInicial.settings);

    // Abre aba de boas-vindas
    if (chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({
        url: 'https://web.whatsapp.com',
        active: true
      });
    }

  } else if (details.reason === 'update') {
    console.log('🔄 CRM Vision Pro atualizado para a versão', chrome.runtime.getManifest().version);

    // Migração de dados se necessário
    await migrarDados();
  }

  // ===== CRIAÇÃO DOS CONTEXT MENUS =====
  // Só cria os menus se a API estiver disponível
  if (chrome.contextMenus && chrome.contextMenus.create) {
    try {
      // Remove menus existentes para evitar duplicação
      await chrome.contextMenus.removeAll();

      // Cria menu para capturar dados
      chrome.contextMenus.create({
        id: 'crm-capturar',
        title: '📸 Capturar para CRM',
        contexts: ['selection', 'page'],
        documentUrlPatterns: ['*://web.whatsapp.com/*']
      });

      // Cria menu para abrir CRM
      chrome.contextMenus.create({
        id: 'crm-abrir',
        title: '🚀 Abrir CRM Vision Pro',
        contexts: ['page'],
        documentUrlPatterns: ['*://web.whatsapp.com/*']
      });

      // Cria menu para capturar número
      chrome.contextMenus.create({
        id: 'capturarNumero',
        title: '📱 Capturar número para CRM',
        contexts: ['selection'],
        documentUrlPatterns: ['*://web.whatsapp.com/*']
      });

      // Cria menu para salvar imagem
      chrome.contextMenus.create({
        id: 'salvarImagem',
        title: '🖼️ Usar como foto do contato',
        contexts: ['image'],
        documentUrlPatterns: ['*://web.whatsapp.com/*']
      });

      console.log('✅ Context menus criados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao criar context menus:', error);
    }
  }
});

// =====================================================
// GERENCIAMENTO DE CONTEXT MENUS
// =====================================================
if (chrome.contextMenus && chrome.contextMenus.onClicked) {
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    console.log('🖱️ Context menu clicado:', info.menuItemId);

    switch (info.menuItemId) {
      case 'crm-capturar':
        // Envia mensagem para content script capturar dados
        chrome.tabs.sendMessage(tab.id, {
          action: 'capturar',
          selecao: info.selectionText
        });
        break;

      case 'crm-abrir':
        // Envia mensagem para abrir o CRM
        chrome.tabs.sendMessage(tab.id, {
          action: 'abrirCRM'
        });
        break;

      case 'capturarNumero':
        // Envia número selecionado para o content script
        chrome.tabs.sendMessage(tab.id, {
          action: 'numeroCapturado',
          numero: info.selectionText
        });
        break;

      case 'salvarImagem':
        // Envia URL da imagem para o content script
        chrome.tabs.sendMessage(tab.id, {
          action: 'imagemCapturada',
          url: info.srcUrl
        });
        break;
    }
  });
}

// =====================================================
// MIGRAÇÃO DE DADOS
// =====================================================
async function migrarDados() {
  try {
    const data = await carregarDados('kanban_data');
    if (!data) return;

    let precisaMigrar = false;

    // Verifica se precisa migrar estrutura antiga
    if (data.columns && !data.clients) {
      console.log('🔄 Migrando estrutura antiga...');

      // Cria objeto clients
      data.clients = {};

      // Extrai clients das colunas
      data.columns.forEach(col => {
        if (col.clients && Array.isArray(col.clients)) {
          col.clients.forEach(client => {
            if (typeof client === 'object' && client.id) {
              data.clients[client.id] = client;
            }
          });
          // Converte para array de IDs
          col.clients = col.clients
            .filter(c => c.id)
            .map(c => c.id);
        }
      });

      precisaMigrar = true;
    }

    // Adiciona campos novos se não existirem
    if (!data.settings) {
      data.settings = {
        theme: 'light',
        notifications: true,
        autoCapture: true
      };
      precisaMigrar = true;
    }

    if (precisaMigrar) {
      await salvarDados('kanban_data', data);
      console.log('✅ Migração concluída com sucesso');
    }
  } catch (error) {
    console.error('❌ Erro na migração:', error);
  }
}

// =====================================================
// GERENCIAMENTO DE STORAGE
// =====================================================
// Escuta mudanças no storage
if (chrome.storage && chrome.storage.local && chrome.storage.local.onChanged) {
  chrome.storage.local.onChanged.addListener((changes, areaName) => {
    for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
      console.log(`📦 Storage [${key}]:`, { oldValue, newValue });
    }
  });
}

// =====================================================
// ALARMES E TAREFAS AGENDADAS
// =====================================================
// Verifica se a API está disponível antes de usar
if (chrome.alarms && chrome.alarms.create) {
  chrome.alarms.create('sync-data', {
    periodInMinutes: 30 // Sincroniza a cada 30 minutos
  });

  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'sync-data') {
      console.log('⏰ Executando sincronização automática...');

      try {
        // Envia mensagem para todas as abas do WhatsApp Web
        const tabs = await chrome.tabs.query({ url: '*://web.whatsapp.com/*' });

        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {
            action: 'syncData'
          }).catch(error => {
            console.log('⚠️ Erro ao sincronizar com aba:', error);
          });
        });

        // Atualiza badge com dados atuais
        const data = await carregarDados('kanban_data');
        if (data) {
          const stats = calcularEstatisticas(data);
          await atualizarBadge(stats.totalClients);
        }
      } catch (error) {
        console.error('❌ Erro na sincronização automática:', error);
      }
    }
  });
}

// =====================================================
// NOTIFICAÇÕES
// =====================================================
async function enviarNotificacao(titulo, mensagem, tipo = 'basic') {
  try {
    if (!chrome.notifications) {
      console.warn('⚠️ Chrome Notifications API não disponível');
      return;
    }

    await chrome.notifications.create({
      type: tipo,
      iconUrl: '/assets/icons/icon-128.png',
      title: titulo,
      message: mensagem,
      priority: 2
    });
  } catch (error) {
    console.error('❌ Erro ao enviar notificação:', error);
  }
}

// =====================================================
// UTILITÁRIOS
// =====================================================
// Função para verificar se o WhatsApp Web está aberto
async function isWhatsAppOpen() {
  return new Promise((resolve) => {
    if (!chrome.tabs || !chrome.tabs.query) {
      resolve(false);
      return;
    }

    chrome.tabs.query({ url: '*://web.whatsapp.com/*' }, (tabs) => {
      resolve(tabs.length > 0);
    });
  });
}

// Função para obter dados do storage
async function getStorageData(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      resolve(result[key]);
    });
  });
}

// Função para salvar dados no storage
async function setStorageData(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, () => {
      resolve();
    });
  });
}

// =====================================================
// EXPORTAÇÃO DE FUNÇÕES (para debug)
// =====================================================
if (typeof globalThis !== 'undefined') {
  globalThis.CRMBackground = {
    salvarDados,
    carregarDados,
    removerDados,
    listarChaves,
    limparTudo,
    enviarNotificacao,
    isWhatsAppOpen,
    getStorageData,
    setStorageData
  };
}

console.log('✅ CRM Vision Pro - Background script carregado completamente');
