/* ═══════════════════════════════════════════════════
   js/data/stores.js — Dados dos estabelecimentos
   Para adicionar uma nova loja: inclua um objeto no array
   com os campos descritos abaixo.
════════════════════════════════════════════════════ */

App.storesData = {

  /**
   * Estabelecimentos cadastrados.
   * coords: { lat, lng } — coordenadas reais para cálculo de distância
   * type: 'mercado' | 'atacado' | 'feira' | 'hipermercado' | 'quitanda'
   */
  list: [
    {
      id: 's1',
      name: 'Atacadão Santa Rita',
      emoji: '🏬',
      type: 'atacado',
      typeLabel: 'Atacado',
      address: 'Av. Presidente Médici, 1500 — Santa Rita, PB',
      phone: '(83) 3228-0000',
      rating: 4.2,
      coords: { lat: -7.1128, lng: -34.9778 },
      openingHours: 'Seg–Sáb 7h–22h · Dom 8h–20h',
      acceptNF: true,
    },
    {
      id: 's2',
      name: 'Mercadinho Central',
      emoji: '🛒',
      type: 'mercado',
      typeLabel: 'Mercado',
      address: 'Rua João Pessoa, 220 — Centro, Santa Rita, PB',
      phone: '(83) 3228-1111',
      rating: 4.5,
      coords: { lat: -7.1092, lng: -34.9820 },
      openingHours: 'Seg–Sáb 6h30–21h · Dom 7h–14h',
      acceptNF: true,
    },
    {
      id: 's3',
      name: 'Feira Livre Municipal',
      emoji: '🥬',
      type: 'feira',
      typeLabel: 'Feira',
      address: 'Praça da Feirinha s/n — Centro, Santa Rita, PB',
      phone: null,
      rating: 4.8,
      coords: { lat: -7.1105, lng: -34.9795 },
      openingHours: 'Sáb 5h–12h · Qua 5h–11h',
      acceptNF: false,
    },
    {
      id: 's4',
      name: 'Supermercado Bom Preço',
      emoji: '🏪',
      type: 'mercado',
      typeLabel: 'Supermercado',
      address: 'Av. Liberdade, 890 — Tibiri, Santa Rita, PB',
      phone: '(83) 3228-2222',
      rating: 3.9,
      coords: { lat: -7.1150, lng: -34.9850 },
      openingHours: 'Diário 7h–22h',
      acceptNF: true,
    },
    {
      id: 's5',
      name: 'Quitanda do Seu Zé',
      emoji: '🍅',
      type: 'quitanda',
      typeLabel: 'Quitanda',
      address: 'Rua das Flores, 45 — Várzea Nova, Santa Rita, PB',
      phone: '(83) 98765-4321',
      rating: 4.7,
      coords: { lat: -7.1078, lng: -34.9760 },
      openingHours: 'Seg–Sáb 6h–18h',
      acceptNF: false,
    },
  ],

  /**
   * Preços iniciais por loja e produto.
   * Formato: { storeId: { productId: priceNumber } }
   * null = produto não disponível nesta loja
   * undefined = sem preço registrado ainda
   */
  initialPrices: {
    's1': {
      'tomate': 4.49, 'cebola': 3.29, 'alho': 3.99,   'batata': 3.79,
      'cenoura': 2.89,'banana': 4.29, 'maca': 6.99,    'laranja': 3.49,
      'arroz': 18.90, 'feijao-car': 7.49,'feijao-pre': 8.29,'macarrao': 4.29,
      'frango-int': 9.99,'peito-frango':12.99,'carne-moida':22.50,'ovo': 14.90,
      'leite': 5.49,  'acucar': 4.99, 'oleo': 7.29,    'sal': 2.49,
      'cafe': 12.90,  'detergente': 2.99,'sabao-po': 8.99,'agua-san': 3.49,
      'papel-hig': 18.90,'sabonete': 1.99,'pasta-dente': 3.99,
    },
    's2': {
      'tomate': 3.99, 'cebola': 3.49, 'alho': 4.49,   'batata': 3.49,
      'cenoura': 2.99,'banana': 3.99, 'maca': 7.49,    'laranja': 3.29,
      'mamao': 5.99,  'alface': 2.49, 'pimentao': 2.99,
      'arroz': 19.90, 'feijao-car': 6.99,'feijao-pre': 7.90,'macarrao': 3.99,
      'frango-int':10.49,'peito-frango':13.49,'carne-moida':23.00,'ovo': 15.50,
      'linguica': 12.90,'bacon': 9.99,
      'leite': 5.29,  'queijo-muss':49.90,'manteiga': 9.90,'iogurte': 4.99,
      'acucar': 5.29, 'oleo': 7.49,   'sal': 2.29,     'molho-tom': 3.49,
      'cafe': 13.50,  'detergente': 2.79,'sabao-po': 9.49,'agua-san': 3.29,
      'esponja': 2.99,'papel-hig': 19.90,'sabonete': 2.29,'pasta-dente': 4.29,
      'pao-forma': 7.99,'biscoito': 3.49,'agua': 4.99,
    },
    's3': {
      'tomate': 3.50, 'cebola': 2.99, 'alho': 3.49,   'batata': 2.99,
      'cenoura': 2.49,'banana': 3.49, 'maca': null,    'laranja': 2.99,
      'mamao': 4.99,  'abacaxi': 4.50,'alface': 1.99,  'couve': 2.50,
      'beterraba': 3.99,'abobrinha':3.49,'pimentao': 2.49,'limao': 4.99,
      'coco': 3.50,   'melancia': 14.90,
      'frango-int': 8.99,'ovo': 13.50,'peixe': 15.00,  'sardinha': 8.99,
    },
    's4': {
      'tomate': 4.29, 'cebola': 3.19, 'alho': 4.19,   'batata': 3.59,
      'cenoura': 2.79,'banana': 4.09, 'maca': 7.29,    'laranja': 3.39,
      'arroz': 18.49, 'feijao-car': 7.29,'feijao-pre': 8.09,'macarrao': 4.09,
      'frango-int': 9.79,'peito-frango':12.79,'carne-moida':21.90,'ovo': 14.50,
      'linguica': 12.49,'bacon': 9.49,
      'leite': 5.19,  'queijo-muss':47.90,'manteiga': 9.49,'requeijao': 8.90,
      'acucar': 4.79, 'oleo': 6.99,   'sal': 2.19,     'molho-tom': 3.29,
      'cafe': 12.49,  'detergente': 2.59,'sabao-po': 8.49,'agua-san': 2.99,
      'papel-hig': 17.90,'sabonete': 1.89,'pasta-dente': 3.79,
      'shampoo': 14.90,'desodor': 12.90,
    },
    's5': {
      'tomate': 3.80, 'cebola': 3.10, 'alho': 3.70,   'batata': 3.20,
      'cenoura': 2.60,'banana': 3.60, 'laranja': 3.10, 'mamao': 5.50,
      'abacaxi': 4.99,'alface': 2.20, 'couve': 2.80,   'limao': 4.50,
      'pimentao': 2.70,'abobrinha': 3.80,'melancia': 13.90,
    },
  },

  /**
   * Retorna loja pelo ID.
   * @param {string} id
   * @returns {object|undefined}
   */
  getById(id) {
    return this.list.find(s => s.id === id);
  },
};
