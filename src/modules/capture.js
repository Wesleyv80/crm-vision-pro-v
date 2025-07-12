// =====================================================
// Módulo de Captura de Dados do WhatsApp - VERSÃO CORRIGIDA
// =====================================================
// Este módulo é responsável por extrair dados do contato
// atual no WhatsApp Web de forma robusta e otimizada

(function() {
  'use strict';
  
  // =====================================================
  // CONFIGURAÇÕES E CONSTANTES
  // =====================================================
  const CONFIG = {
    DEBOUNCE_DELAY: 500,
    MAX_RETRY_ATTEMPTS: 3,
    CACHE_TTL: 60000, // 1 minuto
    MAX_MESSAGES_SCAN: 50,
    VALIDATION_TIMEOUT: 5000
  };
  
  // Cache do último contato capturado
  let ultimoContato = null;
  let cacheTimestamp = null;
  let observerAtivo = null;
  let debounceTimer = null;
  let retryCount = 0;
  
  // =====================================================
  // SELETORES CSS ROBUSTOS COM FALLBACKS
  // =====================================================
  const SELETORES = {
    header: [
      'header[data-testid="conversation-header"]',
      '#main header',
      'header div[role="button"]',
      'div[data-testid="chat-header"]',
      'header span[title]'
    ],
    
    painelPerfil: [
      'div[data-testid="contact-info-drawer"]',
      'div[data-testid="drawer-right"]',
      'span[data-testid="contact-info-header"]',
      'div[data-testid="contact-info"]'
    ],
    
    chatAtivo: [
      'div[aria-selected="true"]',
      'div[data-testid="cell-frame-container"][class*="selected"]',
      'div[data-testid="chat-list-item"][aria-selected="true"]',
      'div[tabindex="0"][aria-selected="true"]'
    ],
    
    mensagens: [
      'div[data-testid="msg-container"]',
      'div[data-testid="message"]',
      'div[class*="message"]',
      'div[data-pre-plain-text]'
    ]
  };
  
  // =====================================================
  // UTILITÁRIOS DE VALIDAÇÃO
  // =====================================================
  function validarTelefone(numero) {
    if (!numero || typeof numero !== 'string') return false;
    
    const apenasNumeros = numero.replace(/\D/g, '');
    
    // Valida tamanho (10-15 dígitos é padrão internacional)
    if (apenasNumeros.length < 10 || apenasNumeros.length > 15) {
      return false;
    }
    
    // Evita sequências repetitivas (111111111)
    const sequenciaRepetida = /^(\d)\1{8,}$/.test(apenasNumeros);
    if (sequenciaRepetida) return false;
    
    // Valida formato brasileiro se aplicável
    if (apenasNumeros.length === 11 && apenasNumeros.startsWith('55')) {
      const ddd = apenasNumeros.substring(2, 4);
      const numero = apenasNumeros.substring(4);
      
      // Valida DDD brasileiro
      const dddsValidos = ['11', '12', '13', '14', '15', '16', '17', '18', '19', '21', '22', '24', '27', '28', '31', '32', '33', '34', '35', '37', '38', '41', '42', '43', '44', '45', '46', '47', '48', '49', '51', '53', '54', '55', '61', '62', '63', '64', '65', '66', '67', '68', '69', '71', '73', '74', '75', '77', '79', '81', '82', '83', '84', '85', '86', '87', '88', '89', '91', '92', '93', '94', '95', '96', '97', '98', '99'];
      
      if (!dddsValidos.includes(ddd)) return false;
      
      // Valida formato do número (9 dígitos para celular)
      if (numero.length !== 9 || !numero.startsWith('9')) return false;
    }
    
    return true;
  }
  
  function validarNome(nome) {
    if (!nome || typeof nome !== 'string') return false;
    
    const nomeLimpo = nome.trim();
    
    // Verifica tamanho mínimo e máximo
    if (nomeLimpo.length < 1 || nomeLimpo.length > 100) return false;
    
    // Evita nomes que são apenas números ou símbolos
    if (/^[\d\s\-\+\(\)]+$/.test(nomeLimpo)) return false;
    
    // Evita nomes que são apenas emojis
    if (/^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+$/u.test(nomeLimpo)) return false;
    
    return true;
  }
  
  function validarDadosContato(dados) {
    if (!dados || typeof dados !== 'object') return false;
    
    // Valida nome obrigatório
    if (!validarNome(dados.nome)) return false;
    
    // Valida telefone se presente
    if (dados.telefone && !validarTelefone(dados.telefone)) {
      dados.telefone = null; // Remove telefone inválido
    }
    
    // Valida URL da imagem se presente
    if (dados.imagem && typeof dados.imagem === 'string') {
      try {
        new URL(dados.imagem);
      } catch {
        dados.imagem = null;
      }
    }
    
    return true;
  }
  
  // =====================================================
  // SELETOR INTELIGENTE COM FALLBACKS
  // =====================================================
  function buscarElementoComFallback(seletores, contexto = document) {
    for (const seletor of seletores) {
      try {
        const elemento = contexto.querySelector(seletor);
        if (elemento) return elemento;
      } catch (erro) {
        console.warn(`Seletor inválido: ${seletor}`, erro);
      }
    }
    return null;
  }
  
  function buscarElementosComFallback(seletores, contexto = document) {
    for (const seletor of seletores) {
      try {
        const elementos = contexto.querySelectorAll(seletor);
        if (elementos.length > 0) return elementos;
      } catch (erro) {
        console.warn(`Seletor inválido: ${seletor}`, erro);
      }
    }
    return [];
  }
  
  // =====================================================
  // FUNÇÃO PRINCIPAL - Captura dados do contato
  // =====================================================
  function capturarDadosContato(forcarCaptura = false) {
    // Verifica cache se não forçar captura
    if (!forcarCaptura && ultimoContato && cacheTimestamp) {
      const cacheValido = (Date.now() - cacheTimestamp) < CONFIG.CACHE_TTL;
      if (cacheValido) {
        console.log('📦 Retornando dados do cache');
        return ultimoContato;
      }
    }
    
    console.log('🔍 Iniciando captura de dados...');
    
    let dados = null;
    const estrategias = [
      { nome: 'header', funcao: capturarDoHeader },
      { nome: 'painel-lateral', funcao: capturarDoPainelLateral },
      { nome: 'mensagens', funcao: capturarDeMensagens },
      { nome: 'lista-chats', funcao: capturarDaListaChats }
    ];
    
    for (const estrategia of estrategias) {
      try {
        dados = estrategia.funcao();
        if (dados && validarDadosContato(dados)) {
          dados.fonte = estrategia.nome;
          break;
        }
      } catch (erro) {
        console.warn(`Erro na estratégia ${estrategia.nome}:`, erro);
      }
    }
    
    // Pós-processamento
    if (dados) {
      // Formata telefone se encontrou
      if (dados.telefone) {
        dados.telefone = formatarTelefone(dados.telefone);
      }
      
      // Adiciona metadata
      dados.timestamp = new Date().toISOString();
      dados.origem = 'WhatsApp Web';
      dados.versao = '2.0';
      
      // Atualiza cache
      ultimoContato = dados;
      cacheTimestamp = Date.now();
      retryCount = 0;
      
      console.log('✅ Dados capturados:', dados);
    } else {
      retryCount++;
      console.log(`⚠️ Nenhum dado encontrado (tentativa ${retryCount}/${CONFIG.MAX_RETRY_ATTEMPTS})`);
    }
    
    return dados;
  }
  
  // =====================================================
  // ESTRATÉGIA 1: Capturar do Header (CORRIGIDA)
  // =====================================================
  function capturarDoHeader() {
    const header = buscarElementoComFallback(SELETORES.header);
    if (!header) return null;
    
    let dados = {};
    
    // Busca nome com múltiplos seletores
    const seletoresNome = [
      'span[dir="auto"][title]',
      'div[role="button"] span[dir="auto"]',
      'span[title]',
      'div[data-testid="conversation-title"]',
      'h1 span'
    ];
    
    const nomeElement = buscarElementoComFallback(seletoresNome, header);
    if (nomeElement) {
      dados.nome = nomeElement.title || nomeElement.textContent?.trim();
    }
    
    // Busca imagem
    const seletoresImagem = [
      'img[src*="ppdownload"]',
      'div[role="button"] img',
      'img[src*="profile"]',
      'div[data-testid="avatar"] img'
    ];
    
    const imgElement = buscarElementoComFallback(seletoresImagem, header);
    if (imgElement) {
      dados.imagem = imgElement.src;
    }
    
    // Busca status/descrição
    const seletoresStatus = [
      'span[title*="último"]',
      'div[data-testid="chat-subtitle"]',
      'span[dir="auto"]:not([title])',
      'div[data-testid="status"]'
    ];
    
    const statusElement = buscarElementoComFallback(seletoresStatus, header);
    if (statusElement) {
      dados.status = statusElement.textContent?.trim();
    }
    
    // Tenta extrair telefone do DOM
    dados.telefone = extrairTelefoneDoDOM();
    
    return dados.nome ? dados : null;
  }
  
  // =====================================================
  // ESTRATÉGIA 2: Capturar do Painel Lateral (CORRIGIDA)
  // =====================================================
  function capturarDoPainelLateral() {
    const painelPerfil = buscarElementoComFallback(SELETORES.painelPerfil);
    if (!painelPerfil) return null;
    
    let dados = {};
    
    // Busca nome
    const seletoresNome = [
      'span[dir="auto"][role="textbox"]',
      'h2 span[dir="auto"]',
      'div[contenteditable="true"]',
      'input[type="text"]'
    ];
    
    const nomeElement = buscarElementoComFallback(seletoresNome, painelPerfil);
    if (nomeElement) {
      dados.nome = nomeElement.textContent?.trim() || nomeElement.value?.trim();
    }
    
    // Busca telefone
    const seletoresTelefone = [
      'span[dir="ltr"]',
      'div[role="button"] span[title*="+"]',
      'a[href*="tel:"]',
      'span[title*="+"]'
    ];
    
    const telefoneElement = buscarElementoComFallback(seletoresTelefone, painelPerfil);
    if (telefoneElement) {
      dados.telefone = telefoneElement.textContent?.trim() || telefoneElement.title?.trim();
    }
    
    // Busca imagem
    const imgElement = buscarElementoComFallback(['img[src*="ppdownload"]', 'img[src*="profile"]'], painelPerfil);
    if (imgElement) {
      dados.imagem = imgElement.src;
    }
    
    // Busca informações adicionais
    const infoElements = painelPerfil.querySelectorAll('div[role="button"] span[dir="auto"]');
    if (infoElements.length > 0) {
      dados.informacoesAdicionais = Array.from(infoElements)
        .map(el => el.textContent?.trim())
        .filter(Boolean)
        .slice(0, 5); // Limita a 5 informações
    }
    
    return dados.nome ? dados : null;
  }
  
  // =====================================================
  // ESTRATÉGIA 3: Capturar de Mensagens (CORRIGIDA)
  // =====================================================
  function capturarDeMensagens() {
    const mensagens = buscarElementosComFallback(SELETORES.mensagens);
    if (!mensagens.length) return null;
    
    let dados = {};
    let mensagensAnalisadas = 0;
    
    // Analisa apenas as últimas mensagens para performance
    const mensagensRecentes = Array.from(mensagens)
      .slice(-CONFIG.MAX_MESSAGES_SCAN)
      .reverse();
    
    for (const msg of mensagensRecentes) {
      if (mensagensAnalisadas >= CONFIG.MAX_MESSAGES_SCAN) break;
      
      // Busca nome em mensagens de grupo
      if (!dados.nome) {
        const seletoresAutor = [
          'span[data-testid="author"]',
          'div[data-testid="message-author"]',
          'span[dir="auto"][class*="author"]'
        ];
        
        const nomeElement = buscarElementoComFallback(seletoresAutor, msg);
        if (nomeElement) {
          const nomeCandidate = nomeElement.textContent?.trim();
          if (validarNome(nomeCandidate)) {
            dados.nome = nomeCandidate;
          }
        }
      }
      
      // Busca telefone no texto da mensagem
      if (!dados.telefone) {
        const texto = msg.textContent || '';
        const regexTelefone = /(?:\+55\s?)?(?:\(?[1-9]{2}\)?\s?)?(?:9\s?)?[0-9]{4}-?[0-9]{4}|\+\d{1,3}\s?\d{1,4}\s?\d{1,4}\s?\d{1,9}/g;
        const matches = texto.match(regexTelefone);
        
        if (matches) {
          for (const match of matches) {
            if (validarTelefone(match)) {
              dados.telefone = match;
              break;
            }
          }
        }
      }
      
      mensagensAnalisadas++;
      
      // Para se encontrou ambos
      if (dados.nome && dados.telefone) break;
    }
    
    return dados.nome ? dados : null;
  }
  
  // =====================================================
  // ESTRATÉGIA 4: Capturar da Lista de Chats (CORRIGIDA)
  // =====================================================
  function capturarDaListaChats() {
    const chatAtivo = buscarElementoComFallback(SELETORES.chatAtivo);
    if (!chatAtivo) return null;
    
    let dados = {};
    
    // Busca nome
    const seletoresNome = [
      'span[dir="auto"][title]',
      'div[data-testid="cell-frame-title"]',
      'span[title]',
      'div[role="gridcell"] span'
    ];
    
    const nomeElement = buscarElementoComFallback(seletoresNome, chatAtivo);
    if (nomeElement) {
      dados.nome = nomeElement.title || nomeElement.textContent?.trim();
    }
    
    // Busca última mensagem
    const seletoresMsg = [
      'span[data-testid="last-msg-status"] + span',
      'div[data-testid="last-msg"]',
      'span[dir="ltr"]'
    ];
    
    const ultimaMsg = buscarElementoComFallback(seletoresMsg, chatAtivo);
    if (ultimaMsg) {
      dados.ultimaMensagem = ultimaMsg.textContent?.trim();
    }
    
    // Busca imagem
    const imgElement = buscarElementoComFallback(['img', 'div[data-testid="avatar"] img'], chatAtivo);
    if (imgElement) {
      dados.imagem = imgElement.src;
    }
    
    return dados.nome ? dados : null;
  }
  
  // =====================================================
  // EXTRAÇÃO DE TELEFONE DO DOM
  // =====================================================
  function extrairTelefoneDoDOM() {
    // Busca em data-id
    const chatElement = document.querySelector('div[data-id*="@c.us"]');
    if (chatElement) {
      const dataId = chatElement.getAttribute('data-id');
      const match = dataId?.match(/(\d+)@/);
      if (match && validarTelefone(match[1])) {
        return match[1];
      }
    }
    
    // Busca em URLs
    const links = document.querySelectorAll('a[href*="tel:"], a[href*="whatsapp.com"]');
    for (const link of links) {
      const href = link.href;
      const match = href.match(/tel:(\+?[\d\s\-\(\)]+)/) || href.match(/whatsapp\.com\/send\?phone=(\d+)/);
      if (match && validarTelefone(match[1])) {
        return match[1];
      }
    }
    
    return null;
  }
  
  // =====================================================
  // DETECTAR MUDANÇA DE CONTATO (OTIMIZADA)
  // =====================================================
  function detectarMudancaContato() {
    const contatoAtual = capturarDadosContato();
    
    if (!contatoAtual) return null;
    
    // Verifica se mudou comparando com o cache
    const mudou = !ultimoContato || 
                  ultimoContato.nome !== contatoAtual.nome ||
                  ultimoContato.telefone !== contatoAtual.telefone;
    
    if (mudou) {
      console.log('📱 Mudança de contato detectada!');
      return contatoAtual;
    }
    
    return null;
  }
  
  // =====================================================
  // MONITORAMENTO COM DEBOUNCING (CORRIGIDO)
  // =====================================================
  function iniciarMonitoramento(callback) {
    if (observerAtivo) {
      pararMonitoramento();
    }
    
    const mainElement = document.querySelector('#main') || document.body;
    if (!mainElement) {
      console.error('Elemento principal não encontrado para monitoramento');
      return false;
    }
    
    // Função com debouncing
    const handleMutation = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        try {
          const novoContato = detectarMudancaContato();
          if (novoContato && callback) {
            callback(novoContato);
          }
        } catch (erro) {
          console.error('Erro no callback de monitoramento:', erro);
        }
      }, CONFIG.DEBOUNCE_DELAY);
    };
    
    observerAtivo = new MutationObserver(handleMutation);
    
    // Configuração otimizada do observer
    observerAtivo.observe(mainElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-id', 'aria-selected', 'class'],
      attributeOldValue: false
    });
    
    console.log('👁️ Monitoramento de contatos iniciado com debouncing');
    return true;
  }
  
  // =====================================================
  // PARAR MONITORAMENTO (MELHORADO)
  // =====================================================
  function pararMonitoramento() {
    if (observerAtivo) {
      observerAtivo.disconnect();
      observerAtivo = null;
    }
    
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    
    console.log('🛑 Monitoramento de contatos parado');
    return true;
  }
  
  // =====================================================
  // FORMATAÇÃO DE TELEFONE (MELHORADA)
  // =====================================================
  function formatarTelefone(numero) {
    if (!numero) return '';
    
    // Remove tudo exceto números
    const apenasNumeros = numero.replace(/\D/g, '');
    
    // Formato internacional completo (+55 11 98765-4321)
    if (apenasNumeros.length === 13 && apenasNumeros.startsWith('55')) {
      const pais = apenasNumeros.slice(0, 2);
      const ddd = apenasNumeros.slice(2, 4);
      const numero1 = apenasNumeros.slice(4, 9);
      const numero2 = apenasNumeros.slice(9);
      return `+${pais} ${ddd} ${numero1}-${numero2}`;
    }
    
    // Formato brasileiro com DDD (11 98765-4321)
    if (apenasNumeros.length === 11) {
      const ddd = apenasNumeros.slice(0, 2);
      const numero1 = apenasNumeros.slice(2, 7);
      const numero2 = apenasNumeros.slice(7);
      return `(${ddd}) ${numero1}-${numero2}`;
    }
    
    // Formato brasileiro sem DDD (98765-4321)
    if (apenasNumeros.length === 9) {
      const numero1 = apenasNumeros.slice(0, 5);
      const numero2 = apenasNumeros.slice(5);
      return `${numero1}-${numero2}`;
    }
    
    // Formato internacional genérico
    if (apenasNumeros.length >= 10 && apenasNumeros.length <= 15) {
      if (apenasNumeros.startsWith('55')) {
        return `+${apenasNumeros.slice(0, 2)} ${apenasNumeros.slice(2)}`;
      }
      return `+${apenasNumeros}`;
    }
    
    // Retorna o número original se não conseguir formatar
    return numero;
  }
  
  // =====================================================
  // ANÁLISE DE CONTEXTO COM IA (MELHORADA)
  // =====================================================
  function analisarContexto() {
    const dados = capturarDadosContato();
    if (!dados) return null;
    
    // Analisa o contexto da conversa
    const mensagens = buscarElementosComFallback(SELETORES.mensagens);
    const textoConversa = Array.from(mensagens)
      .slice(-20) // Últimas 20 mensagens
      .map(m => m.textContent)
      .join(' ')
      .toLowerCase();
    
    // Detecta intenções com regex mais precisas
    const intencoes = {
      interesseAlto: /\b(quero|preciso|gostaria|interesse|comprar|adquirir)\b/i.test(textoConversa),
      duvida: /\b(dúvida|pergunta|como|quando|onde|porque|qual|questão)\b/i.test(textoConversa),
      objecao: /\b(caro|custoso|não|depois|pensar|ver|talvez|difícil)\b/i.test(textoConversa),
      urgente: /\b(urgente|rápido|hoje|agora|imediato|pressa)\b/i.test(textoConversa),
      preco: /\b(quanto|valor|preço|custa|custo|orçamento)\b/i.test(textoConversa)
    };
    
    // Detecta produtos mencionados
    const produtosMencionados = [];
    const palavrasChave = {
      'seguro': /\b(seguro|proteção|cobertura|apólice)\b/i,
      'veicular': /\b(veicular|carro|auto|automóvel|veiculo)\b/i,
      'residencial': /\b(residencial|casa|imóvel|residência)\b/i,
      'vida': /\b(vida|familiar|pessoal)\b/i,
      'saude': /\b(saúde|médico|plano|clínica)\b/i
    };
    
    Object.entries(palavrasChave).forEach(([produto, regex]) => {
      if (regex.test(textoConversa)) {
        produtosMencionados.push(produto);
      }
    });
    
    // Calcula score de engajamento
    const scoreEngajamento = calcularEngajamento(textoConversa, intencoes);
    
    return {
      ...dados,
      analise: {
        intencoes,
        produtosMencionados,
        scoreEngajamento,
        temperatura: calcularTemperatura(intencoes),
        totalMensagens: mensagens.length,
        ultimaAtividade: new Date().toISOString(),
        contextoConversa: textoConversa.slice(0, 200) // Primeiros 200 chars
      }
    };
  }
  
  function calcularEngajamento(texto, intencoes) {
    let score = 0;
    
    // Pontuação baseada em palavras-chave
    const palavrasEngajamento = ['sim', 'ok', 'certo', 'perfeito', 'ótimo', 'excelente'];
    const palavrasDesengajamento = ['não', 'talvez', 'depois', 'vejo', 'penso'];
    
    palavrasEngajamento.forEach(palavra => {
      if (texto.includes(palavra)) score += 10;
    });
    
    palavrasDesengajamento.forEach(palavra => {
      if (texto.includes(palavra)) score -= 5;
    });
    
    // Bonificação por intenções
    if (intencoes.interesseAlto) score += 25;
    if (intencoes.urgente) score += 15;
    if (intencoes.preco) score += 10;
    if (intencoes.objecao) score -= 15;
    
    return Math.max(0, Math.min(100, score));
  }
  
  function calcularTemperatura(intencoes) {
    let score = 50; // Neutro
    
    if (intencoes.interesseAlto) score += 30;
    if (intencoes.urgente) score += 20;
    if (intencoes.preco) score += 15;
    if (intencoes.duvida) score += 10;
    if (intencoes.objecao) score -= 20;
    
    return Math.max(0, Math.min(100, score));
  }
  
  // =====================================================
  // RETRY COM BACKOFF EXPONENCIAL
  // =====================================================
  function capturarComRetry(maxTentativas = CONFIG.MAX_RETRY_ATTEMPTS) {
    return new Promise((resolve, reject) => {
      let tentativas = 0;
      
      function tentar() {
        tentativas++;
        const dados = capturarDadosContato(true);
        
        if (dados) {
          resolve(dados);
        } else if (tentativas < maxTentativas) {
          const delay = Math.pow(2, tentativas) * 1000; // Backoff exponencial
          setTimeout(tentar, delay);
        } else {
          reject(new Error('Falha ao capturar dados após múltiplas tentativas'));
        }
      }
      
      tentar();
    });
  }
  
  // =====================================================
  // HEALTH CHECK DO MÓDULO
  // =====================================================
  function healthCheck() {
    const status = {
      timestamp: new Date().toISOString(),
      whatsappDetected: window.location.hostname === 'web.whatsapp.com',
      cacheStatus: ultimoContato ? 'populated' : 'empty',
      observerActive: observerAtivo !== null,
      retryCount: retryCount,
      lastCacheUpdate: cacheTimestamp ? new Date(cacheTimestamp).toISOString() : null
    };
    
    // Testa seletores principais
    status.selectorsTest = {
      header: !!buscarElementoComFallback(SELETORES.header),
      chatList: !!buscarElementoComFallback(SELETORES.chatAtivo),
      messages: buscarElementosComFallback(SELETORES.mensagens).length > 0
    };
    
    return status;
  }
  
  // =====================================================
  // API PÚBLICA DO MÓDULO
  // =====================================================
  window.CRMCapture = {
    // Funções principais
    capturarDadosContato,
    detectarMudancaContato,
    iniciarMonitoramento,
    pararMonitoramento,
    analisarContexto,
    formatarTelefone,
    
    // Funções utilitárias
    validarTelefone,
    validarNome,
    capturarComRetry,
    healthCheck,
    
    // Getters
    get ultimoContato() {
      return ultimoContato;
    },
    
    get configuracao() {
      return { ...CONFIG };
    },
    
    get estatisticas() {
      return {
        cacheTimestamp,
        retryCount,
        observerAtivo: observerAtivo !== null,
        versao: '2.0'
      };
    },
    
    // Funções de controle
    limparCache() {
      ultimoContato = null;
      cacheTimestamp = null;
      retryCount = 0;
      console.log('🧹 Cache de contato limpo');
      return true;
    },
    
    configurar(novasConfigs) {
      if (typeof novasConfigs === 'object') {
        Object.assign(CONFIG, novasConfigs);
        console.log('⚙️ Configurações atualizadas:', CONFIG);
        return true;
      }
      return false;
    },
    
    // Funções de debug
    debug: {
      testarSeletores() {
        const resultados = {};
        
        Object.entries(SELETORES).forEach(([nome, seletores]) => {
          resultados[nome] = {
            total: seletores.length,
            funcionando: seletores.filter(s => {
              try {
                return document.querySelector(s) !== null;
              } catch {
                return false;
              }
            }).length
          };
        });
        
        return resultados;
      },
      
      simularCaptura() {
        console.log('🧪 Simulando captura passo a passo...');
        
        const estrategias = [
          { nome: 'header', funcao: capturarDoHeader },
          { nome: 'painel-lateral', funcao: capturarDoPainelLateral },
          { nome: 'mensagens', funcao: capturarDeMensagens },
          { nome: 'lista-chats', funcao: capturarDaListaChats }
        ];
        
        const resultados = {};
        
        estrategias.forEach(estrategia => {
          try {
            const resultado = estrategia.funcao();
            resultados[estrategia.nome] = {
              sucesso: !!resultado,
              dados: resultado,
              valido: resultado ? validarDadosContato(resultado) : false
            };
          } catch (erro) {
            resultados[estrategia.nome] = {
              sucesso: false,
              erro: erro.message
            };
          }
        });
        
        return resultados;
      },
      
      analisarDOM() {
        return {
          whatsappElements: {
            main: !!document.querySelector('#main'),
            header: !!document.querySelector('header'),
            chatList: !!document.querySelector('div[data-testid="chat-list"]'),
            messages: document.querySelectorAll('div[data-testid="msg-container"]').length
          },
          
          currentURL: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        };
      }
    }
  };
  
  // =====================================================
  // INICIALIZAÇÃO AUTOMÁTICA
  // =====================================================
  function inicializar() {
    // Verifica se está no WhatsApp Web
    if (window.location.hostname !== 'web.whatsapp.com') {
      console.warn('⚠️ Módulo CRMCapture carregado fora do WhatsApp Web');
      return;
    }
    
    // Aguarda o carregamento completo da página
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', inicializar);
      return;
    }
    
    // Tenta capturar dados iniciais
    setTimeout(() => {
      capturarDadosContato();
    }, 2000);
    
    console.log('✅ Módulo CRMCapture v2.0 carregado com sucesso!');
    console.log('📌 Funções disponíveis:', Object.keys(window.CRMCapture));
    console.log('🔧 Para debug, use: CRMCapture.debug.testarSeletores()');
  }
  
  // =====================================================
  // TRATAMENTO DE ERROS GLOBAIS
  // =====================================================
  window.addEventListener('error', (event) => {
    if (event.filename && event.filename.includes('capture')) {
      console.error('🚨 Erro no módulo CRMCapture:', event.error);
    }
  });
  
  // =====================================================
  // MONITORAMENTO DE PERFORMANCE
  // =====================================================
  let metricas = {
    capturas: 0,
    sucessos: 0,
    falhas: 0,
    tempoMedio: 0,
    ultimaCaptura: null
  };
  
  // Wrapper para medir performance
  const capturarDadosContatoOriginal = capturarDadosContato;
  
  function capturarDadosContatoComMetricas(forcarCaptura = false) {
    const inicio = performance.now();
    metricas.capturas++;
    
    try {
      const resultado = capturarDadosContatoOriginal(forcarCaptura);
      
      if (resultado) {
        metricas.sucessos++;
      } else {
        metricas.falhas++;
      }
      
      const tempo = performance.now() - inicio;
      metricas.tempoMedio = (metricas.tempoMedio + tempo) / 2;
      metricas.ultimaCaptura = new Date().toISOString();
      
      return resultado;
    } catch (erro) {
      metricas.falhas++;
      throw erro;
    }
  }
  
  // Substitui a função original
  capturarDadosContato = capturarDadosContatoComMetricas;
  
  // Adiciona métricas à API
  window.CRMCapture.metricas = () => ({ ...metricas });
  
  // =====================================================
  // LIMPEZA NA SAÍDA
  // =====================================================
  window.addEventListener('beforeunload', () => {
    pararMonitoramento();
    console.log('🧹 Módulo CRMCapture finalizado');
  });
  
  // =====================================================
  // DETECÇÃO DE MUDANÇAS NO WHATSAPP
  // =====================================================
  let versaoWhatsApp = null;
  
  function detectarVersaoWhatsApp() {
    // Tenta detectar a versão do WhatsApp Web
    const scripts = document.querySelectorAll('script[src*="app"]');
    for (const script of scripts) {
      const match = script.src.match(/app\.([a-f0-9]+)\.js/);
      if (match) {
        versaoWhatsApp = match[1];
        break;
      }
    }
    
    return versaoWhatsApp;
  }
  
  // =====================================================
  // MODO DE COMPATIBILIDADE
  // =====================================================
  function ativarModoCompatibilidade() {
    console.log('🔄 Ativando modo de compatibilidade...');
    
    // Seletores mais genéricos como fallback
    SELETORES.header.push('header', 'div[role="banner"]');
    SELETORES.mensagens.push('div[class*="message"]', 'div[class*="msg"]');
    SELETORES.chatAtivo.push('div[class*="active"]', 'div[class*="selected"]');
    
    // Aumenta timeouts
    CONFIG.DEBOUNCE_DELAY = 1000;
    CONFIG.MAX_RETRY_ATTEMPTS = 5;
    
    console.log('✅ Modo de compatibilidade ativado');
  }
  
  // Ativa modo de compatibilidade se necessário
  setTimeout(() => {
    if (retryCount > 2) {
      ativarModoCompatibilidade();
    }
  }, 10000);
  
  // Inicia a inicialização
  inicializar();
  
})();