
### [2026-02-05] - Atualização de Ícones (UX Admin)
**Objetivo**: Melhorar a semântica visual dos botões do painel administrativo.

#### Alterações Realizadas
1.  **Ícone "Visual"**:
    - Substituído o ícone genérico por um ícone de "Olho" (`VisualsIcon` atualizado), representando melhor a customização de aparência.

2.  **Ícone "Financeiro"**:
    - Criado novo componente `CurrencyIcon` (Cifrão).
    - Substituído o ícone de gráfico de barras (`ChartBarIcon`) pelo ícone de cifrão na aba Financeiro, tornando a função mais intuitiva.

#### Arquivos Afetados
- `src/components/common/Icons.tsx`: Adição de `CurrencyIcon` e atualização de `VisualsIcon`.
- `src/components/admin/AdminPanel.tsx`: Atualização da importação e uso do ícone na lista de abas.
