# Documentação do Projeto Barber Shop Agendamentos

## 1. Visão Geral
O **Barber Shop Agendamentos** é uma plataforma SaaS (Software as a Service) desenvolvida para barbearias, permitindo que cada barbeiro tenha sua própria página personalizada para agendamentos online, gestão de serviços, promoções e controle financeiro básico.

A aplicação funciona como uma SPA (Single Page Application) multi-tenant, onde o acesso é determinado pelo "slug" (identificador único) da barbearia na URL (ex: `meusite.com/nome-da-barbearia`).

## 2. Tecnologias Utilizadas

### Frontend
- **React 19**: Biblioteca principal para construção da interface.
- **TypeScript**: Superset do JavaScript para tipagem estática e segurança no desenvolvimento.
- **Vite**: Build tool e servidor de desenvolvimento rápido.
- **Tailwind CSS**: Framework CSS utilitário (carregado via CDN) para estilização rápida e responsiva.
- **Google Fonts**: Fontes 'Anton' e 'Montserrat' para tipografia.

### Backend & Infraestrutura (Serverless)
- **Firebase Authentication**: Gerenciamento de usuários e autenticação.
- **Firebase Firestore**: Banco de dados NoSQL em tempo real.
- **Firebase Storage**: Armazenamento de imagens (logos, fotos da galeria).
- **Vercel (Provável)**: Configuração presente (`vercel.json`) sugerindo deploy na Vercel.

## 3. Estrutura do Banco de Dados (Firestore)

O banco de dados é estruturado principalmente em torno da coleção `barbers`. Cada documento nesta coleção representa uma barbearia completa.

### Coleção: `barbers`
**ID do Documento:** `UID` do usuário (Autenticação Firebase).

**Campos Principais:**
- **`profile`** (Map): Dados cadastrais (shopName, slug, location, whatsappNumber, logoUrl, theme, isActive, userID).
- **`availability`** (Map): Configuração de horários disponíveis.

### Subcoleções (Escalabilidade)
Em vez de arrays gigantes dentro do documento do barbeiro, utilizamos subcoleções para dados que crescem indefinidamente:

1.  **`barbers/{barberId}/services`**
    - Documentos individuais para cada serviço.
    - Campos: `name`, `price`, `duration`, `description`, `isActive`.

2.  **`barbers/{barberId}/appointments`**
    - Documentos individuais para cada agendamento.
    - Campos: `clientName`, `clientPhone`, `date`, `time`, `serviceId`, `status`, `totalPrice`.

3.  **`barbers/{barberId}/promotions`**
    - Campanhas promocionais.

4.  **`barbers/{barberId}/gallery`**
    - Imagens do portfólio.

5.  **`barbers/{barberId}/clients`**
    - Cadastro de clientes recorrentes.
    - Campos: `name`, `phone`, `email`, `totalVisits`, `lastVisit`, `loyaltyPoints`.

6.  **`barbers/{barberId}/expenses`**
    - Controle financeiro de despesas.

## 4. Funcionamento e Fluxos

### Roteamento Customizado
O sistema utiliza um hook personalizado `useRouting` (ou lógica no `App.tsx`) para analisar a URL:
1.  **Rota Raiz (`/`)**: Redireciona para barbearia padrão.
2.  **Rota Barbeiro (`/:slug`)**: Carrega dados públicos via `BarberService.getBySlug` e subcoleções em paralelo.
3.  **Rota Admin (`/:slug/admin`)**: Exige autenticação. Carrega o `AdminPanel`.

### Arquitetura de Componentes
A aplicação foi refatorada para uma arquitetura modular:
- **`src/components/layout`**: Header, Hero, Footer.
- **`src/components/features`**: BookingForm, Promotions, Gallery.
- **`src/components/auth`**: LoginModal, UnauthorizedAccess.
- **`src/components/admin`**: Painel administrativo principal.
  - **`tabs/`**: Componentes para cada aba (Dashboard, Agendamentos, Serviços, etc.).
  - **`modals/`**: Modais de edição e criação.
- **`src/components/common`**: UI kits reutilizáveis (LoadingSpinner, Icons, etc.).

### Autenticação e Segurança
- **Frontend**: Validação `currentUser.uid === barberData.id`.
- **Backend**: Regras de segurança do Firestore (a implementar/validar) garantindo que usuários só escrevam em suas próprias coleções.

## 5. Estrutura de Arquivos Principal
```
src/
├── components/         # Componentes React modularizados
│   ├── admin/          # Painel Admin e suas sub-abas
│   ├── auth/           # Componentes de autenticação
│   ├── common/         # Componentes genéricos (UI Kit)
│   ├── features/       # Funcionalidades específicas (Booking, Gallery)
│   └── layout/         # Estrutura da página (Header, Footer)
├── scripts/            # Scripts de manutenção (migração, seed)
├── utils/              # Funções utilitárias (formatação, cálculos)
├── App.tsx             # Componente raiz
├── firestoreService.ts # Camada de serviço refatorada (Classes estáticas)
├── firebaseConfig.ts   # Configuração do Firebase
└── types.ts            # Tipagem global
```

## 6. Como Rodar Localmente
1.  Clone o repositório.
2.  Instale as dependências: `npm install`
3.  Configure as variáveis de ambiente (se necessário, embora a config do Firebase esteja hardcoded no código atual para dev).
4.  Execute: `npm run dev`
