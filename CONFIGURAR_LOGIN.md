# 🔐 Como Configurar Login do Barbeiro

## **Passo 1: Criar Usuário no Firebase Auth**

1. Acesse: https://console.firebase.google.com
2. Selecione o projeto: `barbershop-agendamentos`
3. Vá em **Authentication** > **Users**
4. Clique **"Add user"**
5. Crie um usuário com:
   - **Email:** `barbeiro@exemplo.com`
   - **Senha:** `123456`
   - **Anote o UID** que será gerado

## **Passo 2: Associar Usuário ao Barbeiro**

1. Vá em **Firestore Database**
2. Navegue para: `barbers` > `RnCu9uIUU2a6d7ZGa35XHs1ubfn2`
3. Adicione um novo campo:
   - **Campo:** `userId`
   - **Tipo:** String
   - **Valor:** [UID do usuário criado]

## **Passo 3: Testar Login**

1. Na aplicação, clique **"Área do Barbeiro"**
2. Use as credenciais:
   - **Email:** `barbeiro@exemplo.com`
   - **Senha:** `123456`
3. Deve abrir o painel administrativo com dados reais

## **Alternativa: Usar Dados de Teste**

Se não quiser configurar Firebase Auth:

1. Use o painel de debug (canto superior esquerdo)
2. Clique **"👤 Criar Barbeiro Teste"**
3. Acesse: `http://localhost:3000/barbearia-teste`
4. Clique **"Testar Painel Admin"** (botão amarelo)

## **Verificar se Funcionou**

No painel administrativo você deve ver:
- ✅ Lista de agendamentos
- ✅ Dados da barbearia
- ✅ Opção de logout
- ✅ Dados reais do Firebase (não mock)
