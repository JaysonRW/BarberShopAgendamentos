# Registro de Alterações (Step-by-Step)

## [2026-02-02] - Migração do Firestore para Subcoleções
**Autor:** Trae AI (Assistente)

### Descrição
Refatoração completa da camada de persistência de dados para migrar de um modelo baseado em arrays únicos dentro de documentos de barbeiro para um modelo escalável usando Subcoleções do Firestore.

### Arquivos Alterados
- `src/firebaseConfig_new.ts`: Analisado como base para a nova arquitetura.
- `src/firestoreService.ts`: Reescrevido completamente. A antiga classe monolítica `FirestoreService` foi substituída por classes especializadas:
  - `BarberService`: Gerenciamento do perfil e disponibilidade.
  - `ServiceService`: Gerenciamento de serviços (cortes, barba, etc.).
  - `PromotionService`: Gerenciamento de promoções.
  - `GalleryService`: Gerenciamento da galeria de fotos.
  - `AppointmentService`: Gerenciamento de agendamentos.
  - `ClientService`: Gerenciamento de clientes.
  - `FinancialService`: Gerenciamento financeiro.
  - `LoyaltyService`: Gerenciamento do programa de fidelidade.
  - `SecurityService`: Camada de segurança para validação de operações.
- `src/populateTestData.ts`: Refatorado para utilizar as novas classes de serviço ao popular dados de teste.
- `src/migrate-firestore.ts`: Script criado e executado para migrar dados existentes (embora o banco estivesse vazio, o script validou a estrutura).
- `src/App.tsx`: Refatoração em andamento para substituir chamadas do serviço antigo pelas novas classes.

### Detalhes Técnicos
- **Mudança de Schema**: 
  - Antes: `barbers/{barberId}` continha arrays gigantes de `appointments`, `services`, etc.
  - Depois: `barbers/{barberId}` contém apenas dados do perfil. Dados relacionados ficam em subcoleções: `barbers/{barberId}/appointments`, `barbers/{barberId}/services`, etc.
- **Benefícios**: Melhor escalabilidade, consultas mais rápidas, menor custo de leitura/escrita e suporte a transações complexas.

## [2026-02-02] - Criação da Documentação
**Autor:** Trae AI (Assistente)

### Descrição
Criação inicial da documentação técnica do projeto para facilitar o entendimento da arquitetura e funcionamento.

### Arquivos Criados
- `docs/PROJECT_DETAILS.md`: Documento contendo visão geral, stack tecnológica, schema do banco de dados e fluxos principais.
- `docs/step-by-step.md`: Este arquivo, para rastreamento de progresso futuro.

### Próximos Passos
- Concluir a refatoração do `App.tsx`.
- Validar a aplicação rodando testes de inserção de dados.
