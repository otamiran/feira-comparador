/* ═══════════════════════════════════════════════════
   js/data/catalog.js — Catálogo de produtos
   Adicione, remova ou edite produtos aqui.
   Cada produto: { id, name, emoji, unit, defaultQty, category }
════════════════════════════════════════════════════ */

App.catalog = {

  categories: [
    { id: 'all',        label: 'Todos',        emoji: '🛒' },
    { id: 'hortifruti', label: 'Hortifruti',   emoji: '🥬' },
    { id: 'carnes',     label: 'Carnes',        emoji: '🥩' },
    { id: 'graos',      label: 'Grãos',         emoji: '🌾' },
    { id: 'laticinios', label: 'Laticínios',    emoji: '🥛' },
    { id: 'mercearia',  label: 'Mercearia',     emoji: '🧴' },
    { id: 'limpeza',    label: 'Limpeza',       emoji: '🧹' },
    { id: 'higiene',    label: 'Higiene',       emoji: '🪥' },
    { id: 'padaria',    label: 'Padaria',       emoji: '🍞' },
    { id: 'bebidas',    label: 'Bebidas',       emoji: '🧃' },
  ],

  products: [
    // ── HORTIFRUTI ──────────────────────────────────
    { id: 'tomate',       name: 'Tomate',            emoji: '🍅', unit: 'kg',  defaultQty: 1,   category: 'hortifruti' },
    { id: 'cebola',       name: 'Cebola',            emoji: '🧅', unit: 'kg',  defaultQty: 1,   category: 'hortifruti' },
    { id: 'alho',         name: 'Alho',              emoji: '🧄', unit: 'g',   defaultQty: 100, category: 'hortifruti' },
    { id: 'batata',       name: 'Batata',            emoji: '🥔', unit: 'kg',  defaultQty: 1,   category: 'hortifruti' },
    { id: 'cenoura',      name: 'Cenoura',           emoji: '🥕', unit: 'kg',  defaultQty: 0.5, category: 'hortifruti' },
    { id: 'banana',       name: 'Banana',            emoji: '🍌', unit: 'kg',  defaultQty: 1,   category: 'hortifruti' },
    { id: 'maca',         name: 'Maçã',              emoji: '🍎', unit: 'kg',  defaultQty: 1,   category: 'hortifruti' },
    { id: 'laranja',      name: 'Laranja',           emoji: '🍊', unit: 'kg',  defaultQty: 1,   category: 'hortifruti' },
    { id: 'mamao',        name: 'Mamão Papaia',      emoji: '🍈', unit: 'un',  defaultQty: 1,   category: 'hortifruti' },
    { id: 'abacaxi',      name: 'Abacaxi',           emoji: '🍍', unit: 'un',  defaultQty: 1,   category: 'hortifruti' },
    { id: 'alface',       name: 'Alface',            emoji: '🥬', unit: 'un',  defaultQty: 1,   category: 'hortifruti' },
    { id: 'couve',        name: 'Couve',             emoji: '🥦', unit: 'maço',defaultQty: 1,   category: 'hortifruti' },
    { id: 'beterraba',    name: 'Beterraba',         emoji: '🟤', unit: 'kg',  defaultQty: 0.5, category: 'hortifruti' },
    { id: 'abobrinha',    name: 'Abobrinha',         emoji: '🥒', unit: 'kg',  defaultQty: 0.5, category: 'hortifruti' },
    { id: 'pimentao',     name: 'Pimentão',          emoji: '🫑', unit: 'un',  defaultQty: 3,   category: 'hortifruti' },
    { id: 'limao',        name: 'Limão',             emoji: '🍋', unit: 'kg',  defaultQty: 0.5, category: 'hortifruti' },
    { id: 'coco',         name: 'Coco Verde',        emoji: '🥥', unit: 'un',  defaultQty: 1,   category: 'hortifruti' },
    { id: 'melancia',     name: 'Melancia',          emoji: '🍉', unit: 'un',  defaultQty: 1,   category: 'hortifruti' },

    // ── CARNES ──────────────────────────────────────
    { id: 'frango-int',   name: 'Frango Inteiro',    emoji: '🍗', unit: 'kg',  defaultQty: 1,   category: 'carnes' },
    { id: 'peito-frango', name: 'Peito de Frango',   emoji: '🍗', unit: 'kg',  defaultQty: 1,   category: 'carnes' },
    { id: 'carne-moida',  name: 'Carne Moída',       emoji: '🥩', unit: 'kg',  defaultQty: 0.5, category: 'carnes' },
    { id: 'patinho',      name: 'Patinho',           emoji: '🥩', unit: 'kg',  defaultQty: 0.5, category: 'carnes' },
    { id: 'alcatra',      name: 'Alcatra',           emoji: '🥩', unit: 'kg',  defaultQty: 0.5, category: 'carnes' },
    { id: 'costela',      name: 'Costela Suína',     emoji: '🥩', unit: 'kg',  defaultQty: 0.5, category: 'carnes' },
    { id: 'linguica',     name: 'Linguiça',          emoji: '🌭', unit: 'kg',  defaultQty: 0.5, category: 'carnes' },
    { id: 'bacon',        name: 'Bacon',             emoji: '🥓', unit: 'g',   defaultQty: 200, category: 'carnes' },
    { id: 'peixe',        name: 'Tilápia',           emoji: '🐟', unit: 'kg',  defaultQty: 1,   category: 'carnes' },
    { id: 'sardinha',     name: 'Sardinha',          emoji: '🐟', unit: 'kg',  defaultQty: 0.5, category: 'carnes' },
    { id: 'ovo',          name: 'Ovos',              emoji: '🥚', unit: 'dz',  defaultQty: 1,   category: 'carnes' },

    // ── GRÃOS ────────────────────────────────────────
    { id: 'arroz',        name: 'Arroz Branco',      emoji: '🍚', unit: 'kg',  defaultQty: 5,   category: 'graos' },
    { id: 'feijao-car',   name: 'Feijão Carioca',    emoji: '🫘', unit: 'kg',  defaultQty: 1,   category: 'graos' },
    { id: 'feijao-pre',   name: 'Feijão Preto',      emoji: '🫘', unit: 'kg',  defaultQty: 1,   category: 'graos' },
    { id: 'lentilha',     name: 'Lentilha',          emoji: '🫘', unit: 'g',   defaultQty: 500, category: 'graos' },
    { id: 'grao-bico',    name: 'Grão de Bico',      emoji: '🫘', unit: 'g',   defaultQty: 500, category: 'graos' },
    { id: 'far-trigo',    name: 'Farinha de Trigo',  emoji: '🌾', unit: 'kg',  defaultQty: 1,   category: 'graos' },
    { id: 'fuba',         name: 'Fubá',              emoji: '🌽', unit: 'kg',  defaultQty: 1,   category: 'graos' },
    { id: 'aveia',        name: 'Aveia em Flocos',   emoji: '🌾', unit: 'g',   defaultQty: 500, category: 'graos' },
    { id: 'macarrao',     name: 'Macarrão',          emoji: '🍝', unit: 'g',   defaultQty: 500, category: 'graos' },

    // ── LATICÍNIOS ──────────────────────────────────
    { id: 'leite',        name: 'Leite Integral',    emoji: '🥛', unit: 'L',   defaultQty: 1,   category: 'laticinios' },
    { id: 'queijo-muss',  name: 'Queijo Mussarela',  emoji: '🧀', unit: 'kg',  defaultQty: 0.3, category: 'laticinios' },
    { id: 'manteiga',     name: 'Manteiga',          emoji: '🧈', unit: 'g',   defaultQty: 200, category: 'laticinios' },
    { id: 'iogurte',      name: 'Iogurte Natural',   emoji: '🥛', unit: 'g',   defaultQty: 400, category: 'laticinios' },
    { id: 'requeijao',    name: 'Requeijão',         emoji: '🧀', unit: 'g',   defaultQty: 200, category: 'laticinios' },
    { id: 'creme-leite',  name: 'Creme de Leite',    emoji: '🥛', unit: 'g',   defaultQty: 200, category: 'laticinios' },

    // ── MERCEARIA ──────────────────────────────────
    { id: 'azeite',       name: 'Azeite de Oliva',   emoji: '🫒', unit: 'ml',  defaultQty: 500, category: 'mercearia' },
    { id: 'oleo',         name: 'Óleo de Soja',      emoji: '🛢️', unit: 'L',   defaultQty: 1,   category: 'mercearia' },
    { id: 'acucar',       name: 'Açúcar',            emoji: '🍬', unit: 'kg',  defaultQty: 1,   category: 'mercearia' },
    { id: 'sal',          name: 'Sal',               emoji: '🧂', unit: 'kg',  defaultQty: 1,   category: 'mercearia' },
    { id: 'molho-tom',    name: 'Molho de Tomate',   emoji: '🥫', unit: 'g',   defaultQty: 340, category: 'mercearia' },
    { id: 'cafe',         name: 'Café em Pó',        emoji: '☕', unit: 'g',   defaultQty: 250, category: 'mercearia' },
    { id: 'acucar-m',     name: 'Adoçante',          emoji: '🍬', unit: 'g',   defaultQty: 100, category: 'mercearia' },
    { id: 'vinagre',      name: 'Vinagre',           emoji: '🍶', unit: 'ml',  defaultQty: 750, category: 'mercearia' },

    // ── LIMPEZA ─────────────────────────────────────
    { id: 'detergente',   name: 'Detergente',        emoji: '🫧', unit: 'ml',  defaultQty: 500, category: 'limpeza' },
    { id: 'sabao-po',     name: 'Sabão em Pó',       emoji: '🧺', unit: 'kg',  defaultQty: 1,   category: 'limpeza' },
    { id: 'agua-san',     name: 'Água Sanitária',    emoji: '🧴', unit: 'L',   defaultQty: 1,   category: 'limpeza' },
    { id: 'esponja',      name: 'Esponja',           emoji: '🧽', unit: 'un',  defaultQty: 3,   category: 'limpeza' },
    { id: 'desengord',    name: 'Desengordurante',   emoji: '🧴', unit: 'ml',  defaultQty: 500, category: 'limpeza' },
    { id: 'papel-hig',    name: 'Papel Higiênico',   emoji: '🧻', unit: 'rolo',defaultQty: 12,  category: 'limpeza' },

    // ── HIGIENE ─────────────────────────────────────
    { id: 'sabonete',     name: 'Sabonete',          emoji: '🧼', unit: 'un',  defaultQty: 3,   category: 'higiene' },
    { id: 'shampoo',      name: 'Shampoo',           emoji: '🧴', unit: 'ml',  defaultQty: 350, category: 'higiene' },
    { id: 'pasta-dente',  name: 'Pasta de Dente',    emoji: '🪥', unit: 'g',   defaultQty: 90,  category: 'higiene' },
    { id: 'desodor',      name: 'Desodorante',       emoji: '🧴', unit: 'un',  defaultQty: 1,   category: 'higiene' },

    // ── PADARIA ─────────────────────────────────────
    { id: 'pao-forma',    name: 'Pão de Forma',      emoji: '🍞', unit: 'un',  defaultQty: 1,   category: 'padaria' },
    { id: 'biscoito',     name: 'Biscoito Cream',    emoji: '🍪', unit: 'g',   defaultQty: 200, category: 'padaria' },
    { id: 'tapioca',      name: 'Tapioca (Goma)',     emoji: '🫓', unit: 'kg',  defaultQty: 0.5, category: 'padaria' },

    // ── BEBIDAS ─────────────────────────────────────
    { id: 'agua',         name: 'Água Mineral',      emoji: '💧', unit: 'L',   defaultQty: 5,   category: 'bebidas' },
    { id: 'suco-caixa',   name: 'Suco de Caixinha',  emoji: '🧃', unit: 'L',   defaultQty: 1,   category: 'bebidas' },
    { id: 'refrigerante', name: 'Refrigerante',      emoji: '🥤', unit: 'L',   defaultQty: 2,   category: 'bebidas' },
  ],

  /**
   * Retorna produto pelo ID.
   * @param {string} id
   * @returns {object|undefined}
   */
  getById(id) {
    return this.products.find(p => p.id === id);
  },

  /**
   * Retorna todos os produtos de uma categoria.
   * @param {string} categoryId - 'all' para todos
   * @returns {object[]}
   */
  getByCategory(categoryId) {
    if (categoryId === 'all') return this.products;
    return this.products.filter(p => p.category === categoryId);
  },

  /**
   * Busca produtos pelo nome (case-insensitive).
   * @param {string} query
   * @returns {object[]}
   */
  search(query) {
    const q = query.toLowerCase().trim();
    if (!q) return this.products;
    return this.products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  },
};
