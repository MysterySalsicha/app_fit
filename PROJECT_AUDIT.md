# Project Audit — HunterFit
### Versão 3.0 — Análise Completa: Spec, Qualidade, Segurança e Usabilidade
*Atualizada com todos os bugs corrigidos até o momento + análise de três dimensões*

---

## Status dos Bugs Corrigidos (v2.0 → v3.0)

Os seguintes bugs foram corrigidos nas sessões anteriores:

**Críticos:**
- ✅ Conflito de migração `sagas` (migration 009 criada)
- ✅ Perda de dados offline (sets agora persistidos no Dexie)
- ✅ Loop de autenticação (cookie `hf_auth` agora definido junto com localStorage)
- ✅ Sync queue não drenava ao iniciar online (`drainOnStartup` adicionado)
- ✅ NullReferenceException em `FinishSession` quando `StartedAt` é nulo
- ✅ Endpoint `GET /api/workout/days/{dayId}` inexistente (criado)
- ✅ Campo `ExerciseCategory` ausente na entidade `Exercise`

**Altos:**
- ✅ Importação `useQueryClient as useQC` duplicada no workout/[dayId]
- ✅ Workout page sempre carregava "today" ignorando o `dayId` da URL
- ✅ Input de horário de lembrete não controlado (uncontrolled → controlled)
- ✅ Campo `stravaStatus.expiresAt` → `stravaStatus.tokenExpires` corrigido
- ✅ Unsubscribe de push quebrado (usando `apiRaw.deleteWithBody`)
- ✅ Schema Dexie sem `retries` no índice de `pendingSync`
- ✅ `MuscleRankMap.tsx` usando `m.muscleRankValue` ao invés de `m.muscleRank`
- ✅ 17 chaves de grupo muscular erradas em `hunter/muscles/page.tsx`
- ✅ `HunterController.GetSkills` retornava sem wrapper `{ skills }`
- ✅ `QuestsController` retornava `modulesJson` como string bruta ao invés de objeto

**Médios (corrigidos nesta sessão):**
- ✅ XP multipliers de skill e evento não implementados → agora aplicados
- ✅ Escopo de transação ausente em `FinishSession` → transação adicionada
- ✅ Parser TXT não aceitava separador `|` (formato do template frontend) → corrigido
- ✅ `CardioRequired = true` hardcoded em dias de descanso → corrigido
- ✅ Lembretes na tela de Settings sempre carregavam valores padrão → agora busca do backend
- ✅ API client sem timeout nas requisições → timeout de 30s adicionado

**Pendentes (não corrigidos ainda):**
- ⚠️ DayOfWeek usa UTC ao invés de fuso do usuário
- ⚠️ Quest generation sem validação real (apenas templates)
- ⚠️ Onboarding não gera plano de treino após conclusão
- ⚠️ Hangfire jobs — implementação não confirmada
- ⚠️ Error Boundary React ausente
- ⚠️ Nutrição: parser TXT de dieta retorna "em implementação"

---

## Dimensão 1 — Aderência à Especificação (O que o cliente pediu)

### Módulo A — Parser TXT

Status atual: **Funcional para o formato `|`** (corrigido)

Ainda falta:
- Parser TXT de dieta — o endpoint `POST /api/import/diet` existe mas retorna 501 "em implementação"
- Formatos adicionais da spec (peso corporal via TXT, suplementos) não cobertos
- Nenhuma validação de tamanho do payload — um arquivo enorme travaria o parser

### Módulo B — Offline-First

Status atual: **Funcional para o fluxo básico** (corrigido)

Ainda falta:
- Indicador visual de quantos itens estão na fila de sync (o usuário não sabe se há pendências)
- Se o sync falha permanentemente (máx. retries), o item fica na fila para sempre sem notificação
- A tela de treino não avisa o usuário quando está trabalhando offline

### Módulo C — IA Vision

Status atual: **Parcial**

Existe e funciona:
- Scan corporal com confirmação manual
- Scan nutricional com confirmação manual

Falta:
- Links de acesso às páginas `/nutrition/import` e `/body/import` não aparecem nas páginas pai — o usuário não consegue chegar lá pela interface normal
- Validação fisiológica mais robusta (spec define alertas para valores impossíveis)

### Módulo D — Gamificação e Sistema RPG

Status atual: **Parcial — base implementada**

Existe:
- XP com multiplicadores de dungeon + skill (corrigido)
- Ranks do hunter (E→S→Nacional)
- 17 ranks musculares
- Quests (geração e conclusão)
- Skills passivas com efeito de multiplicação de XP
- Shadow Army

Falta:
- `SkillDetectionService` é stub — skills nunca são desbloqueadas automaticamente
- `PenaltyService` — referenciado mas sem implementação confirmada
- Rank Tests — geração e validação de rank tests não implementada
- Zona de penalidade e resgate não tem lógica completa
- `SagaService` — sagas existem no banco mas sem lógica de progressão
- Títulos (`HunterTitle`) criados no banco mas sem tela de exibição ou equipamento

### Módulo E — Notificações e Lembretes

Status atual: **Parcial**

Existe:
- Web Push (VAPID) com subscribe/unsubscribe funcionando
- Preferências de lembrete agora persistidas e carregadas do backend

Falta:
- Geofence de academia (spec seção 10) — não existe implementação
- Dupla verificação de cardio via Strava — não implementada
- Lembretes escalonados (se usuário ignora, aumenta intensidade) — não implementado
- Horário de TRT e suplementos é salvo mas backend não agenda push real (Hangfire não confirmado)

### Módulo F — Gráficos e Análises

Status atual: **Parcial**

Existe:
- Gráficos corporais (peso, % gordura)
- Histórico corporal

Falta:
- Heatmap de fadiga muscular (spec seção 12)
- Volume Load Chart por exercício
- Macro Trend Chart (evolução calórica)
- Comparativo de força vs população (strength level categories)
- Gráfico de evolução de XP ao longo do tempo

### Features da Spec Completamente Ausentes

Estas funcionalidades foram pedidas na spec e não existem em nenhum arquivo do projeto:

- **Plate Calculator** — calculadora de anilhas para montar o peso no aparelho (spec seção 6). Tabela `user_plate_config` criada na migration 009 mas sem controller, serviço ou tela.
- **Warm-up Calculator** — calculadora de aquecimento progressivo com base no 1RM. Nenhum arquivo no projeto.
- **Social feed** — follows, curtidas de treino (`hunter_follows`, `workout_likes` criados na migration 009 mas sem implementação).
- **Leaderboard** — tabela `leaderboard_snapshots` criada mas sem controller, sem cálculo, sem tela.
- **Shareables** — geração de imagem de resultado de treino para compartilhar. Nenhum arquivo.
- **Calendário de treinos** — visão calendário semanal/mensal. Apenas lista linear existe.
- **Copy Dungeon** — copiar treino de outro usuário ou da sua própria sessão anterior. Colunas criadas, sem lógica.
- **Workout Plan builder manual** — no app, a única forma de criar plano é via import TXT. Não há builder guiado.

---

## Dimensão 2 — Qualidade de Software e Segurança

### Segurança — Problemas Críticos

**[SEC-1] JWT armazenado em localStorage — vulnerável a XSS**

O token JWT é guardado em `localStorage` (`hf_token`). Qualquer script injetado na página consegue lê-lo. A melhor prática para PWAs é usar `HttpOnly` cookies que o JavaScript não pode acessar.

Arquivo: `frontend/lib/api/client.ts`
Solução: Mover para cookie HttpOnly via endpoint de login que sete `Set-Cookie`. O middleware Next.js já usa o cookie `hf_auth` — pode ser expandido para carregar o token real.

**[SEC-2] Sem rate limiting nos endpoints de autenticação**

`POST /api/auth/login` e `POST /api/auth/register` não têm nenhum rate limiting. Um atacante pode tentar 10.000 combinações de senha em segundos.

Arquivo: `backend/FitnessTrack.API/Program.cs` (precisa adicionar `AspNetCoreRateLimit` ou similar)
Solução: Adicionar rate limiting de 5 tentativas por IP por minuto nos endpoints de auth.

**[SEC-3] Token JWT sem revogação**

O token expira em 30 dias mas não há mecanismo de revogação. Se um usuário faz logout ou muda a senha, tokens antigos ainda são válidos por até 30 dias.

Arquivo: `backend/FitnessTrack.API/Controllers/AuthController.cs`
Solução: Manter uma blacklist de tokens revogados (Redis ou tabela DB) ou usar refresh tokens de curta duração (1h) + refresh token de longa duração.

**[SEC-4] Sem validação de tamanho nos endpoints de import**

`POST /api/import/workout` aceita `rawTxt` sem limite de tamanho. Um payload de 50MB pode derrubar o servidor.

Arquivo: `backend/FitnessTrack.API/Controllers/ImportController.cs` (presumido)
Solução: Adicionar `[MaxLength(50000)]` no DTO e configurar `MaxRequestBodySize` no Program.cs.

**[SEC-5] Sem CORS configurado explicitamente**

Não foi encontrada configuração de CORS em nenhum arquivo do backend. Em produção, isso pode permitir que qualquer origem faça requisições.

Arquivo: `backend/FitnessTrack.API/Program.cs`
Solução: Adicionar política CORS restritiva ao domínio do frontend.

**[SEC-6] DeleteAccount sem soft delete ou confirmação de cascata**

`DELETE /api/auth/account` remove o usuário com `_db.Users.Remove(user)`. Dependendo das configurações do banco, pode falhar com FK violations ou deletar silenciosamente dados sem nenhuma janela de recuperação.

Arquivo: `backend/FitnessTrack.API/Controllers/AuthController.cs`
Solução: Implementar soft delete (`IsDeleted`, `DeletedAt`) + período de carência de 30 dias antes da exclusão permanente.

### Qualidade de Software — Problemas

**[QUA-1] Zero testes automatizados**

O projeto não tem nenhum arquivo de teste (xUnit, NUnit, ou Jest/Vitest). Mudanças em serviços críticos como `XpCalculatorService` ou `MuscleRankService` não têm como ser verificadas automaticamente.

Impacto: Alto. Qualquer refactoring pode quebrar silenciosamente.

**[QUA-2] Duplicação de valor "beginner" no onboarding**

Em `coach/page.tsx`, a pergunta de experiência tem duas opções com o mesmo value `'beginner'`:
```
{ value: 'beginner', label: 'Nunca treinei consistentemente' }
{ value: 'beginner', label: 'Iniciante (3–12 meses)' }
```
O backend recebe o mesmo valor para dois perfis distintos, perdendo granularidade. O segundo deveria ser `'beginner_3_12m'`.

Arquivo: `frontend/app/(app)/coach/page.tsx` linha 47–49

**[QUA-3] XpEvent nunca é persistido no banco**

O `XpCalculatorService` calcula XP e retorna o resultado, mas nenhum lugar cria um registro na tabela `xp_events`. O feed de XP na dashboard (`XpEventFeed`) provavelmente está vazio.

Arquivo: `backend/FitnessTrack.API/Controllers/WorkoutController.cs` — FinishSession deveria criar um `XpEvent` antes de commitar.

**[QUA-4] SyncSets usa loop com queries individuais**

O endpoint `POST /api/workout/sessions/sync` itera sobre cada set e faz uma query separada para verificar existência. Para um treino com 30 sets, isso são 60 queries. Deveria usar uma query única com `WHERE (session_id, exercise_id, set_number) IN (...)`.

Arquivo: `backend/FitnessTrack.API/Controllers/WorkoutController.cs`

**[QUA-5] Múltiplos `any` em TypeScript**

Em `workout/[dayId]/page.tsx`:
```ts
const [finishResult, setFinishResult] = useState<any>(null)
const finishMutation = useMutation({ mutationFn: () => api.post<any>(...) })
```
A resposta de `FinishSession` tem uma estrutura definida no backend. Criar um tipo `FinishSessionResult` em vez de `any` preveniria erros em runtime.

**[QUA-6] DayOfWeek calculado em UTC**

`GetToday` usa `DateTime.UtcNow.DayOfWeek`. Um usuário no Brasil (UTC-3) após 21h local (00h UTC) verá o treino do dia seguinte. A spec não menciona como tratar isso mas o comportamento correto é usar o fuso horário do usuário.

Arquivo: `backend/FitnessTrack.API/Controllers/WorkoutController.cs` linha 227

**[QUA-7] Onboarding conclui mas não gera plano de treino**

A tela de conclusão do onboarding (`coach/page.tsx`) exibe "Seu plano foi configurado" mas o backend em `POST /api/ai-coach/onboarding` salva as respostas e não chama `WorkoutParserService` nem gera nenhum plano. O usuário chega no dashboard com a página de treinos vazia.

Arquivo: `backend/FitnessTrack.API/Controllers/AiCoachController.cs` — deve chamar `WorkoutParserService` ou gerar um plano padrão baseado nas respostas do onboarding.

**[QUA-8] Links para /nutrition/import e /body/import não existem na UI**

As páginas existem e têm código funcional para IA Vision, mas não há link para elas em nenhuma parte da navegação. O usuário não tem como acessá-las.

Arquivo: `frontend/app/(app)/nutrition/page.tsx` e `frontend/app/(app)/body/page.tsx` — devem incluir um botão ou card de acesso.

---

## Dimensão 3 — Usabilidade para o Usuário

Esta seção avalia como o usuário sem experiência com aplicativos de academia ou gamificação vai se sentir ao usar o HunterFit. O objetivo não é simplificar o sistema, mas tornar os caminhos mais claros e reduzir a fricção.

### UX-1 — Não há "começo de jornada" claro para um novo usuário

**Problema:** Um usuário novo termina o onboarding e cai no dashboard. O dashboard mostra XP (0), Shadow Army (vazia), Quests (nenhuma gerada?), Água (sem meta personalizada) e um feed de XP vazio. A primeira sensação é de um app vazio.

**Causa técnica:** O onboarding não gera plano de treino, não cria quests iniciais e não define metas de nutrição baseadas nas respostas.

**Solução proposta:** Após o onboarding, criar um fluxo de "primeiro acesso" no dashboard que guia o usuário para:
1. Importar ou criar seu primeiro plano de treino
2. Configurar as metas de nutrição com base no perfil
3. Ativar os lembretes

---

### UX-2 — Para iniciar um treino são necessários 3 toques a partir do dashboard

**Problema:** Dashboard → toca em "Treino" (aba) → toca no dia de hoje → toca "Entrar na Dungeon". Para um usuário que abre o app toda manhã para treinar, esse caminho é longo.

**Solução proposta:** Adicionar no dashboard um card proeminente "🔥 Iniciar treino de hoje" que leva diretamente para o workout do dia atual (`/workout/today`). Esse card deve mostrar o nome do dia ("Push - Peito/Ombro") e o número de exercícios.

---

### UX-3 — "Dungeon" é terminologia confusa para não-gamers

**Problema:** O botão de entrar no treino chama-se "Entrar na Dungeon". A tela de conclusão do treino é "DungeonCompleteScreen". Para um usuário que nunca jogou, esse vocabulário não comunica "treinar".

**Solução proposta:** Manter a estética Solo Leveling mas usar terminologia bilíngue que conecta o tema com o significado real:
- "Entrar na Dungeon" → "⚔️ Começar Treino" (com subtítulo menor: "entrar na dungeon")
- "Dungeon completa!" → "✅ Treino concluído!"

---

### UX-4 — Dias de descanso são silenciosos e não respondem ao toque

**Problema:** Na lista de treinos, os dias de descanso têm `opacity-40`, `cursor-default` e `href="#"`. Quando o usuário toca neles, nada acontece. Não há feedback, não há explicação.

**Solução proposta:** Dias de descanso devem abrir uma sheet/modal de confirmação:
```
🌙 Dia de Descanso
"O corpo cresce enquanto descansa."
[Ver dicas de recuperação]  [Fazer cardio leve →]
```

---

### UX-5 — Quests não estão na navegação principal

**Problema:** As Quests são um dos elementos centrais da gamificação (a razão pela qual o usuário vai querer abrir o app diariamente), mas não aparecem na barra de navegação inferior. O único acesso é via o card de "Quest Diária" no dashboard, que leva para `/hunter` (não para `/quests`).

**Solução proposta:** Substituir "Corpo" da barra inferior (página menos acessada diariamente) por "Quests", ou adicionar um dot de notificação no ícone "Hunter" quando há quests disponíveis.

Alternativa: adicionar link direto do `DailyQuestCard` para `/quests`.

---

### UX-6 — A importação de plano por TXT é inacessível para iniciantes

**Problema:** A única forma de criar um plano de treino é colar um TXT em formato específico. Um usuário comum não sabe o formato e o exemplo mostra código que parece técnico. A página de import tem um botão "Ver exemplo" que preenche o textarea com texto sem explicar como adaptá-lo.

**Solução proposta (curto prazo):** Adicionar templates pré-definidos selecionáveis antes do textarea:
- "Iniciante 3x por semana (Full Body)"
- "Intermediário 4x por semana (Upper/Lower)"
- "Avançado 5x (Push/Pull/Legs)"

O usuário seleciona um template, o textarea é preenchido automaticamente e ele importa sem precisar entender o formato.

**Solução de longo prazo:** Um workout builder visual drag-and-drop (spec menciona isso mas não está implementado).

---

### UX-7 — Campo de data de nascimento usa formato AAAA-MM-DD em input de texto

**Problema:** No onboarding, a pergunta de data de nascimento usa `<input type="text" placeholder="AAAA-MM-DD">`. A maioria dos usuários não sabe esse formato ISO. Em mobile, não abre teclado numérico nem calendário.

**Solução proposta:** Mudar para `<input type="date">` — em mobile isso abre o date picker nativo do sistema operacional, muito mais amigável.

Arquivo: `frontend/app/(app)/coach/page.tsx` linha 326–333

---

### UX-8 — Settings não é acessível pela navegação

**Problema:** A página de Configurações (`/settings`) não tem link em nenhum lugar da interface exceto possivelmente um caminho não documentado. O usuário não sabe como acessar suas configurações.

**Solução proposta:** Adicionar um ícone de engrenagem (⚙️) no canto superior direito do Dashboard ou do perfil do Hunter. Ou adicionar "Configurações" como item do menu ao long-press/tap no avatar do Hunter.

---

### UX-9 — Estado de erro sem botão de retry

**Problema:** A página de workout mostra "Não foi possível carregar os treinos. Verifique sua conexão e tente novamente." mas não há botão de "Tentar novamente". O usuário precisa sair e voltar para a página.

**Solução proposta:** Adicionar um botão "🔄 Tentar novamente" que chame `refetch()` do React Query.

Arquivo: `frontend/app/(app)/workout/page.tsx` linha 86–95

---

### UX-10 — Tela de onboarding "done" mente ao usuário

**Problema:** A conclusão do onboarding exibe "Seu plano foi configurado. O Sistema está pronto para monitorar sua evolução." mas nenhum plano foi criado. O usuário chega no dashboard e a tela de treinos está vazia.

**Solução proposta (curto prazo):** Mudar o texto para "Análise concluída. Agora importe seu plano de treino para começar." com um botão que leva direto para `/import`.

**Solução de longo prazo:** Implementar a geração automática de plano de treino baseada nas respostas do onboarding (spec seção 5).

---

### UX-11 — Acesso a IA Vision (scan nutricional e corporal) é invisível

**Problema:** As páginas `/nutrition/import` e `/body/import` têm funcionalidade de IA Vision implementada, mas não há link para elas na interface. O usuário não descobre esse recurso.

**Solução proposta:** Na página de Nutrição, adicionar um botão "📸 Escanear refeição com IA" que leva para `/nutrition/import`. Na página de Corpo, adicionar "📷 Análise corporal com IA" que leva para `/body/import`.

---

### UX-12 — Hunter page não explica o que os ranks musculares significam

**Problema:** A página Hunter mostra 17 grupos musculares com ranks como "Untrained", "Beginner" etc. Para um usuário novo, não está claro o que significa ter um rank "Initiate" em peitoral ou o que fazer para melhorar.

**Solução proposta:** Adicionar tooltips ou uma seção expandível que explica: "Rank muscular sobe conforme você treina esse grupo muscular regularmente. Cada sessão com séries progressivas aumenta seu volume acumulado."

---

## Mapa de Prioridades Atualizado

### P1 — Bloqueia uso real do app (máxima urgência)

1. Onboarding não gera plano de treino → tela de treinos fica vazia para usuários novos
2. Quests não aparecem na navegação principal
3. Links para IA Vision ausentes (nutrition/import, body/import)
4. Sem rate limiting na auth → risco de segurança em produção
5. JWT em localStorage → vulnerável a XSS
6. XpEvent não é persistido → feed de XP sempre vazio

### P2 — Degrada experiência significativamente

7. Onboarding com opção "beginner" duplicada
8. Campo de data de nascimento sem date picker nativo
9. Dias de descanso não respondem ao toque
10. Erro sem botão de retry na tela de treinos
11. Settings sem link de acesso visível
12. "Dungeon" sem tradução clara para não-gamers

### P3 — Melhoria importante mas não crítica

13. Botão "Iniciar treino de hoje" no dashboard
14. Templates de plano no import (para iniciantes)
15. CORS configurado explicitamente
16. DeleteAccount com soft delete
17. DayOfWeek usando UTC ao invés do fuso do usuário
18. Tooltip explicativo nos ranks musculares
19. SyncSets com queries em bulk ao invés de loop

### P4 — Funcionalidades da spec ainda ausentes

20. Plate Calculator
21. Warm-up Calculator
22. Social feed (follows, likes)
23. Leaderboard
24. Shareables (geração de imagem)
25. Calendário de treinos
26. SkillDetectionService real
27. PenaltyService real
28. Sagas progressão
29. Hangfire jobs confirmados funcionando
30. Rank Tests geração e validação

---

## Checklist Pré-Lançamento Atualizado

### Essenciais (sem eles o app não pode lançar)
- [ ] Onboarding gera plano de treino básico ao concluir
- [ ] XpEvent persistido após cada sessão
- [ ] Quests acessíveis pela navegação
- [ ] IA Vision acessível pela navegação (nutrition/import, body/import)
- [ ] Novo usuário consegue completar o primeiro treino do início ao fim sem ajuda
- [ ] Rate limiting nos endpoints de autenticação
- [ ] CORS configurado corretamente
- [ ] Timeout + error boundary no frontend

### Recomendados para v1.0
- [ ] Templates de plano para iniciantes no import
- [ ] Date picker nativo no onboarding
- [ ] Botão "Iniciar treino de hoje" no dashboard
- [ ] Dias de descanso com feedback ao toque
- [ ] Retry button nos estados de erro
- [ ] Settings acessível da navegação
- [ ] Soft delete de conta
- [ ] Explicação dos ranks musculares

### Pode ser v1.1+
- [ ] Plate Calculator
- [ ] Social features
- [ ] Leaderboard
- [ ] Shareables
- [ ] Calendário de treinos
- [ ] Skill detection real
- [ ] Heatmap de fadiga
