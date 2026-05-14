# 🛒 Comparador de Feira

Aplicação web para comparar preços de compras de mercado/feira entre estabelecimentos próximos da localização do usuário, com atualização de preços via Nota Fiscal (IA).

---

## 📁 Estrutura do Projeto

```
feira-comparador/
│
├── index.html                  # Entrada principal da aplicação
│
├── css/
│   ├── variables.css           # Tokens de design (cores, tipografia, espaçamento)
│   ├── base.css                # Reset CSS e estilos base
│   ├── components.css          # Componentes de UI reutilizáveis
│   └── app.css                 # Layout geral e estilos específicos da aplicação
│
└── js/
    ├── app.js                  # Inicialização e bootstrap
    ├── state.js                # Gerenciamento de estado (padrão Observer)
    │
    ├── data/
    │   ├── catalog.js          # Catálogo de produtos (~70 itens em 9 categorias)
    │   └── stores.js           # Dados dos estabelecimentos e preços iniciais
    │
    ├── services/
    │   ├── storage.js          # Persistência em localStorage
    │   ├── location.js         # Geolocalização + cálculo de distância (Haversine)
    │   ├── compare.js          # Lógica de comparação e cálculos de preço
    │   └── nf.js               # Integração com Claude AI para leitura de NF
    │
    └── ui/
        ├── toast.js            # Componente de notificações
        ├── tabs.js             # Controle de navegação
        ├── catalog.js          # UI do catálogo de produtos
        ├── list.js             # UI da lista de compras
        ├── compare.js          # UI da tabela de comparação
        ├── stores.js           # UI dos estabelecimentos
        └── nf.js               # UI de upload/processamento de Nota Fiscal
```

---

## 🚀 Como usar

### Opção 1 — Abrir diretamente (mais simples)
Abra o arquivo `index.html` no navegador. A geolocalização funcionará normalmente.

> ⚠️ A leitura de Nota Fiscal via IA requer um servidor local (ver abaixo) por restrições de CORS.

### Opção 2 — Servidor local (recomendado)

```bash
# Python 3
python -m http.server 3000

# Node.js (npx)
npx serve .

# PHP
php -S localhost:3000
```

Acesse `http://localhost:3000` no navegador.

---

## ✨ Funcionalidades

| Aba | Descrição |
|-----|-----------|
| **Catálogo** | ~70 produtos em 9 categorias. Busca por nome. Clique para adicionar/remover da lista. |
| **Minha Lista** | Itens selecionados com controle de quantidade (stepper). Agrupados por categoria. |
| **Comparar** | Tabela de preços por loja com destaque do melhor (verde) e pior (vermelho). Total estimado. Estratégia de compra mista. |
| **Lojas** | Estabelecimentos ordenados por distância. Histórico de atualizações de preço. |
| **Nota Fiscal** | Upload de imagem (JPG/PNG) ou texto. A IA extrai produtos e atualiza preços automaticamente. |

---

## 🏗️ Arquitetura

### Padrão de Módulos
Cada arquivo JavaScript adiciona funcionalidades ao namespace global `App`:

```
App.catalog    → dados estáticos dos produtos
App.storesData → dados estáticos das lojas
App.state      → estado da aplicação + Observer
App.storage    → localStorage
App.location   → geolocalização + distância
App.compare    → cálculos de comparação
App.nf         → integração com a IA
App.toast      → notificações
App.tabs       → navegação
App.ui.*       → componentes de interface
```

### Fluxo de dados
```
Catálogo (seleção) → state.selectedItems
       ↓
Nota Fiscal (upload) → nf.js → Claude API → state.setPrice()
       ↓
compare.buildCompareTable(selectedItems, activeStores)
       ↓
ui/compare.js → tabela + banner + estratégia mista
```

### Persistência
- **Preços**: salvos no `localStorage` após cada atualização via NF
- **Localização**: cache local para evitar múltiplos requests de GPS
- **Lista**: não é persistida automaticamente (comportamento intencional para sessão de compras)

---

## 🔧 Customização

### Adicionar um produto ao catálogo
Edite `js/data/catalog.js` e adicione um objeto no array `products`:

```js
{ id: 'meu-produto', name: 'Meu Produto', emoji: '🥝', unit: 'kg', defaultQty: 1, category: 'hortifruti' },
```

### Adicionar uma loja
Edite `js/data/stores.js` e adicione no array `list`:

```js
{
  id: 's6',
  name: 'Nova Loja',
  emoji: '🏬',
  type: 'mercado',
  typeLabel: 'Supermercado',
  address: 'Rua Exemplo, 100',
  rating: 4.0,
  coords: { lat: -7.1100, lng: -34.9800 },
  openingHours: 'Seg-Sáb 8h-20h',
  acceptNF: true,
},
```

### Alterar cores/tema
Edite as variáveis CSS em `css/variables.css`. Todas as cores são definidas como custom properties e propagadas automaticamente.

---

## 🤖 Integração com IA (Nota Fiscal)

A leitura de NF usa a API da Anthropic (Claude). O modelo extrai:
- Nome de cada produto
- Preço unitário (por kg, por unidade, etc.)
- Confiança da associação (high/medium/low)

A API é chamada pelo arquivo `js/services/nf.js`. Para uso em produção, recomenda-se criar um backend proxy para não expor a chave de API no frontend.

---

## 🌐 Requisitos

- Navegador moderno (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Conexão com internet (para fonte Outfit + API de geolocalização reversa + Claude API)
- Permissão de localização (opcional, melhora a ordenação de lojas)
