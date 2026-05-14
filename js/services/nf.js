/* ═══════════════════════════════════════════════════
   js/services/nf.js — Processamento de Nota Fiscal com IA
   Integração com API da Anthropic para extrair
   produtos e preços de notas fiscais.
════════════════════════════════════════════════════ */

App.nf = (() => {

  const API_URL   = 'https://api.anthropic.com/v1/messages';
  const API_MODEL = 'claude-sonnet-4-20250514';

  /**
   * Monta o prompt de extração para a IA.
   * Inclui a lista de produtos cadastrados para melhorar o match.
   * @returns {string}
   */
  function buildPrompt() {
    const productList = App.catalog.products
      .map(p => `${p.id}:"${p.name}" (${p.unit})`)
      .join(', ');

    return `Você é um especialista em análise de notas fiscais brasileiras (NF-e, NFC-e, cupom fiscal).

Sua tarefa: extrair todos os itens e seus preços UNITÁRIOS da nota fornecida.
Depois, tente associar cada item encontrado com um produto da lista abaixo.

LISTA DE PRODUTOS CADASTRADOS:
[${productList}]

REGRAS:
1. Extraia o preço UNITÁRIO (por kg, por unidade, etc.) — não o total do item.
2. Se o preço está por peso (ex: 1,5kg × R$3,50), retorne R$3,50 como price.
3. Use correspondência aproximada para o nome (ex: "ARROZ TIPO 1" → id "arroz").
4. Se não encontrar correspondência, retorne itemId: null e matched: false.
5. Ignore itens que não são alimentos ou produtos domésticos (ex: sacos plásticos, cupons).
6. Valores devem ser números (não strings). Use ponto como separador decimal.

RETORNE APENAS JSON VÁLIDO, sem texto extra, sem markdown, sem explicações:
{
  "storeNameFound": "nome do estabelecimento se encontrado na nota, ou null",
  "dateFound": "data da compra se encontrada, formato DD/MM/AAAA, ou null",
  "items": [
    {
      "itemId": "id_do_produto_ou_null",
      "foundName": "nome exato como aparece na nota",
      "unitPrice": 0.00,
      "matched": true,
      "confidence": "high|medium|low"
    }
  ]
}`;
  }

  /**
   * Chama a API da Anthropic com texto ou imagem.
   * @param {string|null} text     - Texto da nota (se disponível)
   * @param {string|null} imageB64 - Imagem em base64 (se disponível)
   * @param {string|null} mimeType - MIME type da imagem
   * @returns {Promise<object>} - Resposta parseada
   */
  async function callAPI(text, imageB64, mimeType) {
    const systemPrompt = buildPrompt();

    let userContent;
    if (imageB64) {
      userContent = [
        { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageB64 } },
        { type: 'text',  text: 'Analise esta nota fiscal e extraia os produtos e preços conforme as instruções.' },
      ];
    } else {
      userContent = `Analise o texto desta nota fiscal:\n\n${text}`;
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: API_MODEL,
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const rawText = (data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');

    // Remove possíveis blocos de código antes de parsear
    const clean = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(clean);
  }

  /**
   * Lê um arquivo e converte para base64 (para imagens).
   * @param {File} file
   * @returns {Promise<{b64, mimeType}>}
   */
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve({
        b64: e.target.result.split(',')[1],
        mimeType: file.type,
      });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Lê um arquivo de texto.
   * @param {File} file
   * @returns {Promise<string>}
   */
  function fileToText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file, 'UTF-8');
    });
  }

  /**
   * Aplica os preços extraídos ao estado da aplicação.
   * @param {string} storeId
   * @param {object[]} items - itens retornados pela IA
   * @returns {{ updated, skipped, newItems }}
   */
  function applyPrices(storeId, items) {
    let updated = 0;
    let skipped = 0;
    const newItems = [];

    items.forEach(item => {
      if (!item.matched || !item.itemId || !item.unitPrice || item.unitPrice <= 0) {
        skipped++;
        return;
      }
      // Valida que o produto existe no catálogo
      const product = App.catalog.getById(item.itemId);
      if (!product) { skipped++; return; }

      App.state.setPrice(storeId, item.itemId, item.unitPrice);
      updated++;
      newItems.push({ product, unitPrice: item.unitPrice, foundName: item.foundName });
    });

    return { updated, skipped, newItems };
  }

  // ─────────────────────────────────────────────────
  // API PÚBLICA
  // ─────────────────────────────────────────────────
  return {

    /**
     * Processa um arquivo de nota fiscal.
     * Suporta imagens (JPG, PNG, WEBP) e arquivos de texto.
     *
     * @param {File} file
     * @param {string} storeId
     * @param {function} onProgress - callback({ pct, message })
     * @returns {Promise<object>} resultado
     */
    async processFile(file, storeId, onProgress = () => {}) {
      onProgress({ pct: 10, message: 'Lendo arquivo...' });

      let text = null;
      let imageB64 = null;
      let mimeType = null;

      const isImage = file.type.startsWith('image/');
      const isText  = file.type === 'text/plain' || file.name.endsWith('.txt');

      if (isImage) {
        const result = await fileToBase64(file);
        imageB64 = result.b64;
        mimeType = result.mimeType;
        onProgress({ pct: 30, message: 'Enviando imagem para a IA...' });
      } else if (isText) {
        text = await fileToText(file);
        onProgress({ pct: 30, message: 'Analisando texto...' });
      } else {
        throw new Error(`Formato não suportado: ${file.type}. Use JPG, PNG ou TXT.`);
      }

      return this.processContent(text, imageB64, mimeType, storeId, onProgress);
    },

    /**
     * Processa texto de nota fiscal digitado/colado.
     *
     * @param {string} text
     * @param {string} storeId
     * @param {function} onProgress
     * @returns {Promise<object>}
     */
    async processText(text, storeId, onProgress = () => {}) {
      if (!text.trim()) throw new Error('Nenhum texto fornecido');
      onProgress({ pct: 20, message: 'Enviando para a IA...' });
      return this.processContent(text, null, null, storeId, onProgress);
    },

    /**
     * Fluxo principal de processamento.
     * @private
     */
    async processContent(text, imageB64, mimeType, storeId, onProgress) {
      onProgress({ pct: 50, message: 'Identificando produtos e preços...' });

      const parsed = await callAPI(text, imageB64, mimeType);

      onProgress({ pct: 80, message: 'Aplicando preços...' });

      const { updated, skipped, newItems } = applyPrices(storeId, parsed.items || []);

      onProgress({ pct: 100, message: 'Concluído!' });

      return {
        success: true,
        storeNameFound: parsed.storeNameFound,
        dateFound: parsed.dateFound,
        totalFound: (parsed.items || []).length,
        updated,
        skipped,
        newItems,
        rawItems: parsed.items || [],
      };
    },
  };

})();
