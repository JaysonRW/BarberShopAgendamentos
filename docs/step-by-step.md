# Registro de Alterações (Step-by-Step)

## [2026-02-02] - Funcionalidades de PDV e Gestão de Clientes
**Autor:** Trae AI (Assistente)

### Descrição
Implementação de agendamento direto pela aba de Clientes (funcionalidade PDV) e verificação das funções de edição e exclusão de clientes.

### Arquivos Alterados
- **`src/components/admin/modals/AdminBookingModal.tsx`**: Novo componente. Modal simplificado para criação rápida de agendamentos pelo administrador, sem redirecionamento para WhatsApp.
- **`src/components/admin/tabs/ClientsTab.tsx`**: 
  - Adicionado botão "Agendar" (ícone de calendário) na lista de clientes.
  - Integração com `AdminBookingModal`.
  - Recebe agora `services` e `availability` para alimentar o formulário de agendamento.
- **`src/components/admin/AdminPanel.tsx`**: Atualizado para passar as props necessárias (`services`, `availability`) para o componente `ClientsTab`.

### Impacto
- **PDV Ágil**: O administrador pode selecionar um cliente da lista e lançar um serviço imediatamente.
- **Gestão**: As funções de Editar e Excluir clientes já estavam presentes e continuam funcionais, agora complementadas pela opção de agendar.

## [2026-02-02] - Integração Cadastro de Clientes e Fidelidade
**Autor:** Trae AI (Assistente)

### Descrição
Ajuste na lógica de criação de clientes para garantir que todo novo cliente cadastrado manualmente já possua um registro no programa de fidelidade. Também foram corrigidos métodos do serviço de fidelidade para garantir a correta identificação dos documentos no Firestore.

### Arquivos Alterados
- **`src/firestoreService.ts`**:
  - `ClientService.create`: Agora utiliza `runTransaction` para criar atomicamente o cliente na coleção `clients` E o registro inicial na coleção `loyaltyClients` (com 0 estrelas).
  - `LoyaltyService`: Métodos `addStar`, `redeemStars` e `updateGoal` atualizados para receber `clientWhatsapp` e construir o ID do documento internamente (`${barberId}_${normalizedWhatsapp}`), corrigindo um potencial erro de referência.

### Impacto
- Clientes cadastrados manualmente agora aparecem imediatamente na aba "Fidelidade".
- Operações de adicionar estrela e resgatar prêmios estão mais robustas.

## [2026-02-02] - Correção Crítica em Transação de Clientes
**Autor:** Trae AI (Assistente)

### Descrição
Correção de um erro de execução no Firestore (`FirebaseError: Firestore transactions require all reads to be executed before all writes`) que impedia o cadastro de novos clientes.

### Arquivos Alterados
- **`src/firestoreService.ts`**:
  - `ClientService.create`: Reordenada a lógica da transação. Agora todas as operações de leitura (`transaction.get`) são executadas antes de qualquer operação de escrita (`transaction.set`), conforme exigido pelo SDK do Firestore.

### Impacto
- Cadastro de clientes volta a funcionar corretamente, mantendo a consistência entre a coleção de clientes e a fidelidade.

## [2026-02-02] - Melhoria UX no Modal de Agendamento Admin
**Autor:** Trae AI (Assistente)

### Descrição
Refinamento da interface do modal de agendamento (PDV) na área administrativa para facilitar a seleção de datas e horários, seguindo o padrão visual do formulário de agendamento público.

### Arquivos Alterados
- **`src/components/admin/modals/AdminBookingModal.tsx`**:
  - Implementada lógica de **Fallback de Disponibilidade**: Se a data selecionada não tiver registros no banco de dados (ex: datas futuras distantes), o sistema agora assume horários padrão (09:00 - 19:00) em vez de mostrar "Nenhum horário disponível".
  - **Sugestões de Data**: Atualizado para gerar datas futuras automaticamente (14 dias), ignorando domingos, mesmo que não haja disponibilidade explícita no banco.
- **`src/firestoreService.ts`**:
  - **`AppointmentService.create`**: Atualizada validação de horário para aceitar datas sem registro explícito de disponibilidade, usando o mesmo fallback de horários padrão. Isso evita erros ao tentar agendar em datas futuras válidas.
  - **`AppointmentService.updateStatus`**: Corrigido erro de transação (`Firestore transactions require all reads to be executed before all writes`). Agora todas as leituras (agendamento, barbeiro, cliente, fidelidade) são executadas antes de qualquer operação de escrita, garantindo conformidade com as regras do Firestore. Adicionado campo `points: 0` na criação do registro de fidelidade.
- **`src/components/features/BookingForm.tsx`**:
  - Aplicada a mesma correção de fallback para o formulário público de agendamento, garantindo que clientes consigam agendar para datas futuras.
- **`src/components/admin/modals/AdminBookingModal.tsx`**:
  - Ajustado para chamar explicitamente `AppointmentService.updateStatus` quando um agendamento é criado já com status 'Confirmado'. Isso garante que a lógica de fidelidade, financeiro e atualização de disponibilidade seja executada, corrigindo o problema onde clientes confirmados não apareciam na aba de Fidelidade.
- **`src/components/admin/tabs/LoyaltyTab.tsx`**:
  - Adicionado botão "Novo Cartão" e modal para criação manual de clientes fidelidade (Nome + WhatsApp). Isso permite gerenciar a fidelidade de clientes que não agendaram pelo sistema ou para iniciar o programa com clientes antigos sem precisar criar agendamentos fictícios.
  
  ### Impacto
  
  - **Fidelidade**: Agora é possível criar cartões fidelidade automaticamente (ao confirmar agendamento) E manualmente (via botão na aba Fidelidade), atendendo à necessidade de flexibilidade e gestão manual.
  - **Seleção Inteligente**: Ao criar um cartão manualmente, o sistema permite buscar e selecionar clientes já cadastrados na base geral. Se o cliente já tiver cartão, avisa. Se não tiver, cria apenas o cartão vinculado. Se o cliente não existir, cria o cadastro completo.
  - **Correção de Fluxo**: Agendamentos confirmados na criação agora disparam corretamente todos os efeitos colaterais (Fidelidade, Financeiro, Bloqueio de Horário).
  - **Correção de Props**: Corrigido erro onde a lista de clientes fidelidade não era passada corretamente para o componente (`loyaltyClients` vs `clients`), o que impedia a visualização dos dados.
  - **Duração de Serviços**: Implementado campo de duração (minutos) na gestão de serviços. Agora o barbeiro pode definir quanto tempo cada serviço leva, e essa informação é exibida tanto no painel administrativo quanto no formulário de agendamento do cliente.
  - **Visualização**: Adicionados ícones de relógio e formatação de tempo nos cards de serviço e opções de agendamento.
- **Correção Crítica**: Resolvido problema onde o sistema impedia agendamentos em datas futuras que ainda não tinham disponibilidade pré-gerada no banco de dados.
- Melhoria na UX: Usuário administrativo e clientes agora veem horários disponíveis para qualquer data futura válida (exceto domingos).

## [2026-02-02] - Melhoria no Módulo de Promoções
**Autor:** Trae AI (Assistente)

### Descrição
Implementação de campos explícitos de data de início (`startDate`) e fim (`endDate`) para promoções, permitindo maior controle sobre a validade das ofertas.

### Arquivos Alterados
- **`src/types.ts`**:
  - Adicionados campos opcionais `startDate` e `endDate` à interface `Promotion`.
  - O campo `validUntil` foi removido da interface (mas mantido compatibilidade no código).
- **`src/components/admin/tabs/PromotionsTab.tsx`**:
  - Formulário de criação/edição atualizado para incluir inputs de "Data Inicial" e "Data Final".
  - Card de promoção atualizado para exibir o período completo (ex: "De: 01/02/2026 - Até: 08/02/2026").
  - Adicionada lógica de compatibilidade para exibir corretamente promoções antigas que usavam apenas `validUntil`.

### Nota sobre Banco de Dados
- Não é necessária migração manual.
- Novas promoções terão os campos `startDate` e `endDate`.
- Promoções antigas continuarão funcionando (o código usa `validUntil` como fallback para `endDate`), mas recomenda-se editá-las para definir o período correto.

## [2026-02-02] - Correção dos Filtros Financeiros e Visibilidade de Transações Futuras
**Autor:** Trae AI (Assistente)

### Descrição
Correção na lógica de filtros de data na aba Financeiro (`FinancialsTab.tsx`) para resolver o problema de transações futuras não aparecerem e filtros (Mês, Ano) não abrangerem todo o período.

### Arquivos Alterados
- **`src/components/admin/tabs/FinancialsTab.tsx`**:
  - Ajustada a lógica de cálculo de `startDate` e `endDate` no `useMemo`.
  - **Correção Mês/Ano/Trimestre**: Agora os filtros cobrem do dia 1º até o **último dia** do período (ex: 31/12), em vez de parar no dia atual ("hoje").
  - **Correção Transações Futuras**: Como o `endDate` agora vai até o fim do período, lançamentos futuros (ex: despesa agendada para dia 10 quando hoje é dia 02) aparecem corretamente na lista.

## [2026-02-02] - Correção das Regras de Segurança (Firestore Rules)
**Autor:** Trae AI (Assistente)

### Descrição
Atualização crítica no arquivo `firestore.rules` para resolver erros de permissão (`FirebaseError: Missing or insufficient permissions`) relatados em produção (Vercel).

### Alterações Realizadas
- **`firestore.rules`**:
  - Definidas permissões explícitas de **leitura pública** para:
    - Perfil da barbearia (`barbers/{barberId}`).
    - Serviços (`services`).
    - Galeria (`gallery`).
    - Promoções (`promotions`).
  - Mantida restrição de escrita apenas para o dono (barbeiro autenticado).
  - Permitida criação pública de agendamentos (`appointments`), mas leitura restrita ao dono.
  - Regra de `loyaltyClients` ajustada para permitir acesso a barbeiros autenticados.

### Ação Necessária (Manual)
As regras definidas neste arquivo **devem ser copiadas e coladas no Console do Firebase** (Firestore Database > Aba "Regras") para terem efeito em produção, pois o deploy automático pode não estar configurado.

## [2026-02-02] - Correção da API do Firebase Storage
**Autor:** Trae AI (Assistente)

### Descrição
Atualização dos métodos de manipulação de arquivos no `firestoreService.ts` para utilizar a API Modular do Firebase Storage, corrigindo erros de compatibilidade com a versão 9+.

### Arquivos Alterados
- `src/firestoreService.ts`:
  - Importados métodos modulares: `ref`, `deleteObject`, `uploadBytes`, `getDownloadURL` do `firebase/storage`.
  - Método `GalleryService.delete`: Substituído `storage.refFromURL(url).delete()` por `deleteObject(ref(storage, url))`.
  - Método `GalleryService.uploadImage`: Substituído `storage.ref(path).put(file)` por `uploadBytes(ref(storage, path), file)` e `getDownloadURL`.

### Detalhes Técnicos
A implementação anterior tentava acessar métodos da instância `compat` (ex: `refFromURL`) que não existem na instância `FirebaseStorage` da API Modular. A correção alinha o serviço com as práticas recomendadas da versão 9 do Firebase SDK.

## [2026-02-02] - Correção de TypeScript em BarberService
**Autor:** Trae AI (Assistente)

### Descrição
Adicionado o método `create` à classe `BarberService` em `firestoreService.ts` para resolver um erro de TypeScript em `App.tsx`. O método estava sendo chamado no frontend mas não existia na definição da classe.

### Arquivos Alterados
- `src/firestoreService.ts`:
  - Implementado método estático `create` que recebe os dados completos da barbearia e salva o documento raiz na coleção `barbers`.
  - Este método garante que o perfil inicial e a disponibilidade sejam persistidos corretamente ao criar uma nova conta.

## [2026-02-02] - Correção de Autenticação em App.tsx
**Autor:** Trae AI (Assistente)

### Descrição
Correção de um erro crítico onde as funções de manipulação de autenticação (`handleLogin`, `handleSignUp`) e o estado de erro (`authError`) estavam faltando no componente principal `App.tsx`, impedindo o funcionamento do modal de login.

### Arquivos Alterados
- `src/App.tsx`:
  - Adicionadas importações: `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, `signOut`, `SignUpData`.
  - Implementada função `handleLogin`: Autentica usuário via Firebase Auth.
  - Implementada função `handleSignUp`: Cria usuário no Firebase Auth e documento inicial na coleção `barbers` via `BarberService`.
  - Adicionado estado `authError` para feedback visual no modal.

### Detalhes Técnicos
O erro ocorria porque o componente `LoginModal` recebia referências para funções indefinidas. A implementação agora conecta corretamente o frontend à lógica de autenticação do Firebase e criação de perfil no Firestore.

## [2026-02-02] - Finalização da Migração, Correções e Documentação
**Autor:** Trae AI (Assistente)

### Descrição
Conclusão da migração para subcoleções, refatoração de componentes, correções de bugs críticos (tela branca), ajustes de segurança e documentação completa.

### Arquivos Alterados/Criados

#### 1. Migração e Banco de Dados
- **`src/firestoreService.ts`**: Implementação final das classes de serviço (`AppointmentService`, `FinancialService`, etc.) utilizando subcoleções. Adicionada lógica de sincronização automática financeira e validações.
- **`firestore.rules`**: Criado arquivo de regras de segurança do Firestore para garantir acesso público a dados de leitura (serviços, galeria) e proteção de dados sensíveis (clientes, financeiro).
- **`src/firebaseConfig.ts`**: Atualizado para sintaxe Modular V9, corrigindo problemas de autenticação.

#### 2. Refatoração de UI e Componentes
- **`src/App.tsx`**: Completamente modularizado. Lógica de autenticação e roteamento separada. Modal de Login integrado corretamente.
- **`src/components/admin/AdminPanel.tsx`**: Corrigido problemas de importação e "tela branca". Integrado com as novas classes de serviço.
- **`src/components/admin/tabs/index.ts`**: Corrigido para exportar corretamente componentes default e named, resolvendo erros de módulo não encontrado.
- **`src/components/admin/tabs/*.tsx`**: Todos os componentes de aba (Dashboard, Appointments, Financials, etc.) foram atualizados para usar os novos serviços e corrigir erros de tipagem e lógica (ex: `GalleryImage` type, argumentos do `LoyaltyService`).

#### 3. Documentação
- **`docs/PROJECT_DETAILS.md`**: Documentação técnica abrangente criada, detalhando:
  - Visão Geral e Arquitetura.
  - Stack Tecnológica (React 19, Firebase, Tailwind).
  - Estrutura do Banco de Dados (Schema de Subcoleções).
  - Regras de Negócio e Fluxos.
  - Guia de Configuração e Segurança.

### Status Atual
- **Sistema**: Operacional e migrado para subcoleções.
- **Painel Admin**: Funcional, sem erros de "tela branca".
- **Segurança**: Regras do Firestore aplicadas e Autenticação corrigida.
- **Documentação**: Completa e atualizada.

### Próximos Passos Sugeridos
- Monitorar logs de produção para garantir que as regras de segurança não bloqueiem fluxos legítimos não previstos.
- Adicionar testes automatizados para as novas classes de serviço.

## [2026-02-03] - Correção de Botões e Funcionalidade de Duração em Serviços
**Autor:** Trae AI (Assistente)

### Descrição
Correção de problema onde os botões "Adicionar Serviço" e "Editar" não estavam respondendo na aba de Serviços. Implementação completa do campo "Duração" (minutos) em todo o ecossistema (Gestão, Agendamento Admin, Agendamento Cliente).

### Arquivos Alterados
- **`src/components/admin/tabs/ServicesTab.tsx`**:
  - Adicionado `type="button"` aos botões de ação para evitar submissões de formulário acidentais ou comportamento padrão inesperado.
  - Adicionados logs de console para facilitar a depuração.
  - Refinada a UI do formulário de edição, garantindo tratamento correto para o novo campo `duration` (number).
  - Melhorado feedback visual (hover, shadow).
- **`src/components/admin/modals/AdminBookingModal.tsx`**:
  - Integrada a exibição da duração no dropdown de seleção de serviços (ex: "Corte - R$ 30,00 (30 min)").
- **`src/components/features/BookingForm.tsx`**:
  - Atualizado para exibir a duração do serviço selecionado no card de seleção para o cliente final.

### Impacto
- **Correção de Bug**: Botões da gestão de serviços agora funcionam de forma confiável.
- **Nova Funcionalidade**: Barbeiros podem definir a duração estimada de cada serviço, e essa informação é visível para o cliente e no momento do agendamento manual, melhorando o planejamento.
