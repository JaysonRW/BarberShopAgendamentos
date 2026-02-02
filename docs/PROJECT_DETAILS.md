# Detalhes do Projeto: Barber Shop Agendamentos

## 1. Visão Geral
Sistema de agendamento online para barbearias, permitindo que múltiplos barbeiros tenham suas próprias páginas personalizadas (slugs) e gerenciem seus negócios através de um painel administrativo.

## 2. Tecnologias Utilizadas

### Frontend
- **React 19**: Biblioteca de UI moderna e performática.
- **TypeScript**: Tipagem estática para maior segurança e manutenibilidade.
- **Vite**: Build tool rápida e leve.
- **Tailwind CSS v4**: Framework de estilização utilitária (configurado via PostCSS/Vite).

### Backend & Infraestrutura (Firebase)
- **Firebase Authentication**: Gerenciamento de usuários (Barbeiros).
- **Cloud Firestore**: Banco de dados NoSQL em tempo real.
- **Firebase Storage**: Armazenamento de imagens (logos, galeria).
- **Firebase Hosting**: Hospedagem da aplicação.

## 3. Estrutura do Banco de Dados (Firestore)

O banco de dados foi migrado de uma estrutura baseada em arrays para **Subcoleções**, visando escalabilidade e performance.

### Coleção Raiz: `barbers`
Cada documento representa uma barbearia/barbeiro.
- **ID**: UID do usuário (Firebase Auth).
- **Campos**:
  - `profile`: Objeto com dados públicos (nome, slug, localização, tema).
  - `availability`: Objeto com horários de funcionamento.
  - `createdAt`, `updatedAt`: Timestamps.

### Subcoleções (dentro de `barbers/{barberId}`)

1.  **`services`**
    *   Serviços oferecidos (Corte, Barba, etc.).
    *   Campos: `name`, `price`, `duration`, `description`.
2.  **`appointments`**
    *   Agendamentos realizados.
    *   Campos: `clientName`, `date`, `time`, `serviceId`, `status`.
3.  **`promotions`**
    *   Promoções ativas.
    *   Campos: `title`, `discount`, `validUntil`.
4.  **`gallery`**
    *   Imagens da barbearia/trabalhos.
    *   Campos: `url`, `description`, `createdAt`.
5.  **`clients`** (Novo)
    *   Base de clientes para CRM e Fidelidade.
    *   Campos: `name`, `phone`, `totalVisits`, `loyaltyPoints`.
6.  **`transactions`** (Novo)
    *   Registro financeiro (Receitas e Despesas).
    *   Campos: `type` (receita/despesa), `amount`, `category`, `date`.

## 4. Funcionamento e Fluxos

### Modo Público (Cliente)
1.  Acessa via URL: `/{nome-da-barbearia}`.
2.  Sistema busca barbearia pelo `slug`.
3.  Carrega dados públicos (Perfil, Serviços, Galeria, Promoções) usando regras de segurança `allow read`.
4.  Cliente escolhe serviço, dia e horário.
5.  Cria documento em `appointments` (permissão `allow create`).

### Modo Administrativo (Barbeiro)
1.  Acessa botão "Área do Barbeiro".
2.  Login via Email/Senha.
3.  Sistema verifica se `auth.uid` corresponde ao ID da barbearia carregada.
4.  Painel Administrativo carrega todas as subcoleções (leitura restrita ao dono).
5.  Barbeiro pode:
    *   Gerenciar Agendamentos (Confirmar/Cancelar).
    *   Editar Serviços e Perfil.
    *   Ver Financeiro e Métricas.
    *   Gerenciar Programa de Fidelidade.

## 5. Segurança (Firestore Rules)
As regras foram configuradas para garantir:
- **Público**: Pode ler perfil, serviços, galeria e promoções de qualquer barbearia. Pode criar agendamentos.
- **Privado (Dono)**: Apenas o dono (verificado via Auth UID) pode ler/escrever em `appointments`, `clients`, `transactions` e editar seu próprio perfil/serviços.

## 6. Configuração de Desenvolvimento
- `src/firebaseConfig.ts`: Inicialização do Firebase (Modular V9).
- `src/firestoreService.ts`: Camada de abstração para operações de banco de dados.
- `src/components/admin/tabs/*`: Componentes modulares para cada aba do painel.
