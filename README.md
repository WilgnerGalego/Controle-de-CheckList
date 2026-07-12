# Controle de Checklist

Sistema web para gestão de checklists de equipamentos agrícolas com fluxo de inspeção, não conformidades, histórico e relatórios.

## Funcionalidades

- Cadastro de equipamentos
- Criação de checklists por exceção
- Registro de itens conforme e não conforme
- Gestão de não conformidades com O.S. GATEC
- Dashboard com indicadores e gráficos
- Relatórios filtrados e exportação em CSV
- Configurações de categorias, itens e prioridades
- Histórico consolidado de checklists e defeitos

## Requisitos

- Node.js 20+
- npm 10+

## Instalação local

```bash
npm install
cp .env.example .env
npm run dev
```

## Configuração do Firebase

Preencha as variáveis no arquivo .env com os dados do seu projeto Firebase:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

Se as variáveis não forem informadas, o sistema usa um modo de demonstração com valores padrão.

## Build de produção

```bash
npm run build
```

## Docker

### Rodar com Docker Compose

```bash
docker compose up --build
```

A aplicação ficará disponível em http://localhost:4173

## Estrutura principal

- src/pages: telas do sistema
- src/services: integração com Firestore e configurações locais
- src/types: modelos de dados
- src/components: componentes reutilizáveis

## Fluxo recomendado de uso

1. Cadastrar equipamento
2. Criar checklist
3. Marcar itens como conforme ou não conforme
4. Salvar defeitos e informar O.S. GATEC
5. Acompanhar no dashboard e nos relatórios
