# HunterFit — Especificação Master Completa
### *Fusão: FitnessTrack Pro + Solo Leveling + GymLevels + Hevy*

> **Versão:** 5.0 — Master  
> **Status:** Especificação Definitiva  
> **Data:** Março 2025  
> *"Arise. Level Up. IRL."*

---

## Índice

**PARTE I — BASE TÉCNICA**
1. [Visão Geral e Público](#1-visão-geral-e-público)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Banco de Dados Completo](#3-banco-de-dados-completo)
4. [Arquitetura de Pastas](#4-arquitetura-de-pastas)
5. [Módulo A — Parser TXT](#5-módulo-a--parser-txt)
6. [Módulo B — Modo Foco Offline-First](#6-módulo-b--modo-foco-offline-first)
7. [Módulo C — IA Vision (Bioimpedância + Nutrição)](#7-módulo-c--ia-vision)
8. [Módulo D — Gamificação e Strava](#8-módulo-d--gamificação-e-strava)
9. [Módulo E — Notificações](#9-módulo-e--notificações)
10. [Módulo F — Gráficos e Alertas](#10-módulo-f--gráficos-e-alertas)
11. [Adendo: Volume Load, Cronômetro, Histórico, Alternativas, Export](#11-adendo-melhorias)

**PARTE II — SISTEMA RPG (HunterFit)**
12. [Identidade e Diferencial](#12-identidade-e-diferencial)
13. [Classes de Hunter (GymLevels)](#13-classes-de-hunter)
14. [Rank Global do Hunter](#14-rank-global-do-hunter)
15. [Rank Individual por Músculo — 17 Grupos (GymLevels)](#15-rank-por-músculo)
16. [Atributos STR / VIT / AGI / INT / PER](#16-atributos)
17. [Sistema de XP — Fórmula Completa](#17-sistema-de-xp)
18. [Dungeons — Sessões de Treino](#18-dungeons)
19. [Quests — Daily, Main, Emergency, Sazonais](#19-quests)
20. [Sistema de Penalidade e Zona de Resgate](#20-penalidade)
21. [Skills — Passivas e Reais](#21-skills)
22. [Eventos e Multiplicadores de XP](#22-eventos-e-multiplicadores)
23. [Shadow Army — Streaks Reimaginadas](#23-shadow-army)
24. [Títulos](#24-títulos)
25. [Relatório Semanal do Sistema (GymLevels)](#25-relatório-semanal)
26. [Notificações — Voz do Sistema](#26-notificações--voz-do-sistema)

**PARTE III — IMPLEMENTAÇÃO**
27. [API REST — Todos os Endpoints](#27-api-rest)
28. [Testes e QA](#28-testes-e-qa)
29. [Cronograma de 7 Dias](#29-cronograma)
30. [Checklist de Pré-Lançamento](#30-checklist)

**PARTE IV — ANÁLISE E ABSORÇÃO DO HEVY**
31. [Análise Completa do Hevy](#31-análise-completa-do-hevy)
32. [Features do Hevy Absorvidas](#32-features-absorvidas)
33. [Features do Hevy Descartadas](#33-features-descartadas)
34. [Novas Tabelas de Banco — Hevy](#34-banco-de-dados-hevy)
35. [Novos Endpoints — Hevy](#35-novos-endpoints)
36. [Comparativo Final — HunterFit vs Todos](#36-comparativo-final)

**PARTE V — APP PERMANENTE + IA COACH**
37. [De 20 Dias para Sempre — Mudança de Paradigma](#37-app-permanente)
38. [Públicos-Alvo — Todos os Perfis](#38-públicos-alvo)
39. [IA Coach — Onboarding Inteligente](#39-ia-coach--onboarding)
40. [IA Coach — Análise Contínua de Resultados](#40-ia-coach--análise-contínua)
41. [IA Coach — Sistema de Perguntas e Adaptação](#41-ia-coach--perguntas-e-adaptação)
42. [Planos e Metas Dinâmicos](#42-planos-e-metas-dinâmicos)
43. [Banco de Dados — App Permanente + IA Coach](#43-banco-de-dados--ia-coach)
44. [Endpoints — IA Coach](#44-endpoints--ia-coach)

---

# PARTE I — BASE TÉCNICA

---

## 1. Visão Geral e Público

**HunterFit** é um Progressive Web App (PWA) mobile-first permanente, para todos os perfis de atleta, que combina:
- Tracker de treino de classe mundial (Hevy-inspired) com registro preciso e offline-first
- Sistema de progressão RPG inspirado em Solo Leveling — do iniciante ao atleta elite
- Ranking individual por grupo muscular inspirado no GymLevels
- IA Coach que aprende com cada usuário, faz perguntas inteligentes e adapta metas

### O que mudou — De 20 Dias para Sempre

> O HunterFit não é um app de desafio temporário.  
> É o app que você usa para o resto da sua vida de treino.  
> Cada sessão conta. Cada mês conta. Cada ano conta.  
> O Sistema acompanha sua jornada — sem prazo de validade.

O conceito de **20 dias** é preservado como uma **Saga** — um arco de objetivos de 20 dias que o usuário pode ativar quando quiser (detalhado na Seção 42). Após terminar uma Saga, o usuário cria outra com novas metas. Mas o app funciona perfeitamente **sem nenhuma Saga ativa**.

### Por que "Para Todos os Públicos"

O HunterFit funciona para qualquer pessoa que frequenta academia ou se exercita — não existe perfil fixo. A IA Coach faz o onboarding personalizado e adapta toda a experiência.

| Perfil | Experiência no HunterFit |
|--------|------------------------|
| **Iniciante** (nunca foi à academia) | IA Coach guia cada passo; plano adaptado ao nível E; sem jargão técnico |
| **Intermediário** (1–3 anos) | Tracker completo + rank muscular + quests desafiadoras |
| **Avançado** (3+ anos) | RPE, 1RM, plate calculator, leaderboard, Red Gates |
| **Atleta de recomposição** | Macros, bioimpedância, Strava, Saga de 20 dias |
| **Calisthenics** | Exercícios de peso corporal com XP calibrado + skill de barra fixa |
| **Cardio-focused** | AGI stat, cardio streaks, Fang shadow, integração Strava |
| **Fisiculturismo** | Volume Load, heatmap de fadiga, sets por músculo/semana |
| **Quem voltou após pausa** | IA detecta queda de performance, ajusta metas sem punição excessiva |

### Perfil Base (usuário-fundador — dados usados como seed)

> Este perfil é o ponto de partida do desenvolvimento. O app funciona igualmente para qualquer outro perfil via onboarding de IA.

| Atributo | Valor |
|----------|-------|
| Sexo / Idade | Masculino, adulto |
| Medidas | 1,93m · 117,75kg |
| Composição | 31% gordura · 70kg massa muscular |
| Condição | Em uso de TRT |
| Treino | PPL + Upper/Lower 5x/semana + Cardio 45–60min diário |
| Metas macro | 2.400–2.500 kcal · 240–250g proteína · 5–6L água |
| Restrição crítica | Usa celular dentro da academia sem Wi-Fi confiável |

---

## 2. Stack Tecnológica

### Frontend — Next.js 14 (PWA)

| Tecnologia | Versão | Função |
|-----------|--------|--------|
| Next.js | 14.x | Framework React — App Router, SSR, PWA |
| Tailwind CSS | 3.x | Utilitários CSS mobile-first |
| shadcn/ui | Latest | Componentes sobre Radix UI |
| Zustand | 4.x | Estado global (offline store, timer store, hunter store) |
| Dexie.js | 3.x | Wrapper IndexedDB — armazenamento offline |
| React Query (TanStack) | v5 | Cache, retry, background refetch |
| Recharts | 2.x | Gráficos declarativos e responsivos |
| React Hook Form + Zod | Latest | Formulários type-safe |
| Framer Motion | 10.x | Animações de level up, streaks, XP |
| next-pwa | 5.x | Service Worker, manifest, cache strategies |
| Vitest + Testing Library | Latest | Testes unitários e de componentes |

### Backend — C# .NET 6+

| Tecnologia | Versão | Função |
|-----------|--------|--------|
| ASP.NET Core Web API | .NET 6+ | Framework REST |
| Entity Framework Core | 7.x | ORM Code-First + migrations |
| Dapper | 2.x | Queries analíticas de alta performance (dashboard, XP) |
| FluentValidation | 11.x | Validação de regras de negócio |
| AutoMapper | 12.x | Mapeamento DTO ↔ Entity |
| Hangfire | 1.8.x | Background jobs: Strava, streak, push, XP calculation |
| Serilog | 3.x | Structured logging |
| Swashbuckle | 6.x | Swagger UI |
| xUnit + Moq + FluentAssertions | Latest | Testes |

### Banco de Dados e Infra

| Serviço | Plataforma | Tier |
|---------|-----------|------|
| Banco de Dados | Supabase PostgreSQL 15 | Free (500MB) |
| Frontend | Vercel | Free (Hobby) |
| Backend | Railway.app ou Render.com | ~$5/mês ou free limitado |
| Storage (GIFs, prints) | Cloudflare R2 | Free (10GB) |
| CI/CD | GitHub Actions | Free |
| Monitoramento | Sentry | Free (5K erros/mês) |

---

## 3. Banco de Dados Completo

> Todas as tabelas usam `UUID` como PK com `DEFAULT uuid_generate_v4()`.  
> Extensões: `uuid-ossp`, `pg_trgm`. Banco: PostgreSQL 15.

### 3.1 Domínio: Usuário

**Tabela: `users`**

| Coluna | Tipo | Constraint | Descrição |
|--------|------|-----------|-----------|
| id | UUID | PK | |
| email | VARCHAR(255) | UNIQUE NOT NULL | Login |
| password_hash | VARCHAR(512) | NOT NULL | bcrypt hash |
| name | VARCHAR(100) | NOT NULL | |
| height_cm | DECIMAL(5,2) | NOT NULL | 193.00 |
| strava_access_token | TEXT | NULLABLE | OAuth Strava |
| strava_refresh_token | TEXT | NULLABLE | |
| strava_token_expires_at | TIMESTAMPTZ | NULLABLE | |
| notification_preferences | JSONB | DEFAULT '{}' | |
| challenge_start_date | DATE | NULLABLE | Início dos 20 dias |
| tdee_current_estimate | INT | DEFAULT 2900 | Para v1.1 TDEE adaptativo |
| tdee_calculation_method | VARCHAR(20) | DEFAULT 'formula' | formula \| adaptive |
| caloric_deficit_target | INT | DEFAULT 400 | Déficit diário alvo |
| tdee_confidence | DECIMAL(3,2) | DEFAULT 0 | 0.0–1.0 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

### 3.2 Domínio: Treino

**Tabela: `workout_plans`**

| Coluna | Tipo | Constraint |
|--------|------|-----------|
| id | UUID | PK |
| user_id | UUID | FK → users.id |
| name | VARCHAR(100) | NOT NULL |
| raw_txt | TEXT | NULLABLE — texto original do parser |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

**Tabela: `workout_days`**

| Coluna | Tipo | Constraint | Descrição |
|--------|------|-----------|-----------|
| id | UUID | PK | |
| plan_id | UUID | FK → workout_plans.id | |
| day_number | INT | NOT NULL | 1–7 |
| day_label | VARCHAR(50) | NOT NULL | Push, Pull, Legs, Upper |
| muscle_groups | VARCHAR(200) | NOT NULL | ex: Peito, Ombro, Tríceps |
| primary_muscle_group | VARCHAR(50) | NULLABLE | Para heatmap de fadiga e rank |
| is_rest_day | BOOLEAN | DEFAULT FALSE | |
| cardio_required | BOOLEAN | DEFAULT TRUE | |
| cardio_min_minutes | INT | DEFAULT 45 | |

**Tabela: `exercises`**

| Coluna | Tipo | Constraint | Descrição |
|--------|------|-----------|-----------|
| id | UUID | PK | |
| day_id | UUID | FK → workout_days.id | |
| name | VARCHAR(150) | NOT NULL | ex: Supino Reto com Barra |
| sets | INT | NOT NULL | |
| reps | VARCHAR(30) | NOT NULL | ex: "8-12" ou "15" |
| rest_seconds | INT | DEFAULT 60 | |
| gif_url | TEXT | NULLABLE | |
| notes | TEXT | NULLABLE | |
| order_index | INT | NOT NULL | |
| primary_muscle_group | VARCHAR(50) | NULLABLE | Para rank muscular e XP |
| last_session_data | JSONB | NULLABLE | Cache do histórico (offline) |

**Tabela: `exercise_alternatives`**

| Coluna | Tipo | Constraint | Descrição |
|--------|------|-----------|-----------|
| id | UUID | PK | |
| exercise_id | UUID | FK → exercises.id | Exercício original |
| alternative_name | VARCHAR(150) | NOT NULL | |
| muscle_groups | VARCHAR(200) | | |
| equipment_required | VARCHAR(100) | | ex: Halteres, Polia |
| similarity_score | INT | DEFAULT 80 | 0–100 |
| is_global | BOOLEAN | DEFAULT TRUE | |

**Tabela: `workout_sessions`**

| Coluna | Tipo | Constraint | Descrição |
|--------|------|-----------|-----------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id | |
| day_id | UUID | FK → workout_days.id | |
| session_date | DATE | NOT NULL | |
| started_at | TIMESTAMPTZ | NULLABLE | |
| finished_at | TIMESTAMPTZ | NULLABLE | |
| total_duration_seconds | INT | NULLABLE | |
| total_volume_load_kg | DECIMAL(10,2) | NULLABLE | Volume Load total da sessão |
| prev_session_volume_kg | DECIMAL(10,2) | NULLABLE | Para comparação |
| sync_status | VARCHAR(20) | DEFAULT 'synced' | synced \| pending_sync \| offline |
| offline_payload | JSONB | NULLABLE | |
| strava_activity_id | BIGINT | NULLABLE | |
| dungeon_type | VARCHAR(30) | DEFAULT 'normal' | normal \| crisis \| red_gate \| hidden \| boss |
| xp_earned | INT | DEFAULT 0 | XP total da sessão |
| pr_beaten | BOOLEAN | DEFAULT FALSE | Se bateu algum PR |
| pr_exercises | TEXT[] | NULLABLE | Nomes dos exercícios com PR |
| xp_multiplier | DECIMAL(4,2) | DEFAULT 1.0 | Multiplicador aplicado |
| dungeon_cleared | BOOLEAN | DEFAULT FALSE | Completou todos os exercícios |

**Tabela: `exercise_sets`**

| Coluna | Tipo | Constraint | Descrição |
|--------|------|-----------|-----------|
| id | UUID | PK | |
| session_id | UUID | FK → workout_sessions.id | |
| exercise_id | UUID | FK → exercises.id | |
| set_number | INT | NOT NULL | 1, 2, 3... |
| weight_kg | DECIMAL(6,2) | NULLABLE | |
| reps_done | INT | NULLABLE | |
| volume_load_kg | DECIMAL(8,2) | **GENERATED ALWAYS AS (weight_kg * reps_done) STORED** | Campo calculado |
| completed | BOOLEAN | DEFAULT FALSE | |
| completed_at | TIMESTAMPTZ | NULLABLE | |
| rest_started_at | TIMESTAMPTZ | NULLABLE | Início do timer |

### 3.3 Domínio: Nutrição

**Tabela: `diet_plans`**

| Coluna | Tipo | Constraint | Descrição |
|--------|------|-----------|-----------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id | |
| name | VARCHAR(100) | NOT NULL | |
| target_kcal | INT | NOT NULL | 2.450 |
| target_protein_g | INT | NOT NULL | 245 |
| target_carbs_g | INT | NOT NULL | 170 |
| target_fat_g | INT | NOT NULL | 75 |
| target_water_ml | INT | DEFAULT 5000 | |
| raw_txt | TEXT | NULLABLE | Texto original da dieta |

**Tabela: `daily_nutrition_logs`**

| Coluna | Tipo | Constraint | Descrição |
|--------|------|-----------|-----------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id | |
| log_date | DATE | NOT NULL | |
| kcal_consumed | INT | NULLABLE | |
| protein_g | DECIMAL(6,1) | NULLABLE | |
| carbs_g | DECIMAL(6,1) | NULLABLE | |
| fat_g | DECIMAL(6,1) | NULLABLE | |
| water_ml | INT | DEFAULT 0 | |
| source | VARCHAR(20) | NOT NULL | manual \| ai_vision \| strava |
| screenshot_url | TEXT | NULLABLE | |
| ai_raw_json | JSONB | NULLABLE | JSON bruto da IA (auditoria) |
| validated_by_user | BOOLEAN | DEFAULT FALSE | |
| diet_streak_valid | BOOLEAN | DEFAULT FALSE | Dia conta para ofensiva? |

**Tabela: `water_intake_events`**

| Coluna | Tipo | Constraint |
|--------|------|-----------|
| id | UUID | PK |
| user_id | UUID | FK → users.id |
| logged_at | TIMESTAMPTZ | DEFAULT NOW() |
| amount_ml | INT | NOT NULL |

### 3.4 Domínio: Monitoramento

**Tabela: `body_measurements`**

| Coluna | Tipo | Constraint | Descrição |
|--------|------|-----------|-----------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id | |
| measured_at | TIMESTAMPTZ | NOT NULL | |
| weight_kg | DECIMAL(5,2) | NOT NULL | |
| body_fat_pct | DECIMAL(4,1) | NOT NULL | |
| muscle_mass_kg | DECIMAL(5,2) | NOT NULL | |
| water_pct | DECIMAL(4,1) | NULLABLE | |
| bmi | DECIMAL(4,1) | NULLABLE | |
| screenshot_url | TEXT | NULLABLE | |
| ai_raw_json | JSONB | NULLABLE | |
| validated_by_user | BOOLEAN | DEFAULT FALSE | |
| alert_triggered | VARCHAR(50) | NULLABLE | null \| muscle_loss \| water_retention |

**Tabela: `streaks`**

| Coluna | Tipo | Constraint | Descrição |
|--------|------|-----------|-----------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id | |
| streak_type | VARCHAR(20) | NOT NULL | workout \| diet \| cardio \| water |
| current_count | INT | DEFAULT 0 | |
| max_count | INT | DEFAULT 0 | Recorde histórico |
| last_valid_date | DATE | NULLABLE | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Tabela: `reminders`**

| Coluna | Tipo | Constraint | Descrição |
|--------|------|-----------|-----------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id | |
| reminder_type | VARCHAR(30) | NOT NULL | trt \| supplement \| water \| meal \| workout \| cardio |
| title | VARCHAR(100) | NOT NULL | |
| body | VARCHAR(255) | NULLABLE | |
| time_of_day | TIME | NOT NULL | |
| days_of_week | INT[] | NOT NULL | [1..7] |
| is_active | BOOLEAN | DEFAULT TRUE | |

### 3.5 Domínio: Sistema RPG (HunterFit)

**Tabela: `hunter_profiles`**

| Coluna | Tipo | Constraint | Descrição |
|--------|------|-----------|-----------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id, UNIQUE | |
| hunter_rank | VARCHAR(20) | DEFAULT 'E' | E, D, C, B, A, S, National |
| hunter_sub_rank | INT | DEFAULT 3 | 3=fraco, 1=forte dentro do rank |
| hunter_level | INT | DEFAULT 1 | |
| current_xp | BIGINT | DEFAULT 0 | |
| total_xp_ever | BIGINT | DEFAULT 0 | |
| hunter_class | VARCHAR(30) | DEFAULT 'Balance Warrior' | Ver seção 13 |
| class_assigned_at | TIMESTAMPTZ | DEFAULT NOW() | |
| class_changes_this_month | INT | DEFAULT 0 | Máximo 1/mês |
| stat_str | INT | DEFAULT 0 | Força |
| stat_vit | INT | DEFAULT 0 | Vitalidade |
| stat_agi | INT | DEFAULT 0 | Agilidade |
| stat_int | INT | DEFAULT 0 | Inteligência |
| stat_per | INT | DEFAULT 0 | Percepção |
| stat_points_available | INT | DEFAULT 0 | |
| shadow_igris_level | INT | DEFAULT 0 | Streak de treino |
| shadow_tank_level | INT | DEFAULT 0 | Streak de volume |
| shadow_iron_level | INT | DEFAULT 0 | Streak de nutrição |
| shadow_fang_level | INT | DEFAULT 0 | Streak de cardio |
| mana_crystals | INT | DEFAULT 0 | Moeda especial |
| immunity_tokens | INT | DEFAULT 0 | Proteção contra penalidade |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Tabela: `muscle_ranks`**

| Coluna | Tipo | Constraint | Descrição |
|--------|------|-----------|-----------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id | |
| muscle_group | VARCHAR(50) | NOT NULL | ex: chest, back_lat, quads |
| muscle_name_pt | VARCHAR(100) | NOT NULL | ex: Peito, Costas (Lat) |
| muscle_rank | VARCHAR(30) | DEFAULT 'Untrained' | Untrained → Legend |
| muscle_rank_numeric | INT | DEFAULT 0 | 0–15 |
| total_volume_30d | DECIMAL(12,2) | DEFAULT 0 | Volume acumulado 30 dias |
| sessions_30d | INT | DEFAULT 0 | |
| best_exercise_pr_kg | DECIMAL(6,2) | | |
| best_exercise_name | VARCHAR(150) | | |
| rank_up_count | INT | DEFAULT 0 | Quantas vezes evoluiu |
| last_rank_up | TIMESTAMPTZ | | |
| UNIQUE | | (user_id, muscle_group) | |

**Tabela: `exercise_personal_records`**

| Coluna | Tipo | Constraint | Descrição |
|--------|------|-----------|-----------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id | |
| exercise_name | VARCHAR(150) | NOT NULL | |
| exercise_category | VARCHAR(50) | | compound_heavy \| compound_medium \| bodyweight \| isolation |
| primary_muscle_group | VARCHAR(50) | | |
| max_weight_kg | DECIMAL(6,2) | | |
| max_reps_at_max_weight | INT | | |
| max_volume_single_set | DECIMAL(8,2) | | weight × reps em 1 série |
| max_reps_bodyweight | INT | | Para exercícios de peso corporal |
| times_beaten | INT | DEFAULT 0 | |
| last_beaten_at | TIMESTAMPTZ | | |
| first_logged_at | TIMESTAMPTZ | DEFAULT NOW() | |
| UNIQUE | | (user_id, exercise_name) | |

**Tabela: `hunter_skills`**

| Coluna | Tipo | Constraint | Descrição |
|--------|------|-----------|-----------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id | |
| skill_id | VARCHAR(50) | NOT NULL | ex: pull_up_mastery |
| skill_type | VARCHAR(20) | NOT NULL | passive \| real |
| skill_name | VARCHAR(100) | NOT NULL | |
| skill_rank | VARCHAR(10) | DEFAULT 'Common' | Common, Rare, Epic, Legendary |
| effect_type | VARCHAR(50) | | xp_multiplier, stat_permanent, immunity |
| effect_value | DECIMAL(8,2) | | |
| effect_target | VARCHAR(50) | | Qual stat ou categoria |
| unlocked_at | TIMESTAMPTZ | DEFAULT NOW() | |
| is_active | BOOLEAN | DEFAULT TRUE | |

**Tabela: `hunter_titles`**

| Coluna | Tipo | Constraint | Descrição |
|--------|------|-----------|-----------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id | |
| title_id | VARCHAR(50) | NOT NULL | |
| title_name | VARCHAR(100) | NOT NULL | |
| title_type | VARCHAR(20) | DEFAULT 'permanent' | permanent \| temporary |
| expires_at | TIMESTAMPTZ | NULLABLE | Null se permanente |
| equipped | BOOLEAN | DEFAULT FALSE | Apenas 1 ativo por vez |
| earned_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Tabela: `xp_events`**

| Coluna | Tipo | Constraint | Descrição |
|--------|------|-----------|-----------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id | |
| event_type | VARCHAR(50) | NOT NULL | series, dungeon_bonus, pr_bonus, daily_quest, skill_unlock, penalty_rescue |
| xp_gained | INT | NOT NULL | |
| multiplier | DECIMAL(4,2) | DEFAULT 1.0 | |
| description | TEXT | | |
| source_id | UUID | NULLABLE | FK para workout_session, etc. |
| exercise_name | VARCHAR(150) | NULLABLE | |
| muscle_group | VARCHAR(50) | NULLABLE | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Tabela: `hunter_quests`**

| Coluna | Tipo | Constraint | Descrição |
|--------|------|-----------|-----------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id | |
| quest_type | VARCHAR(30) | NOT NULL | daily \| main \| emergency \| penalty_rescue \| rank_test |
| quest_key | VARCHAR(50) | | Referência ao template |
| title | VARCHAR(200) | NOT NULL | |
| description | TEXT | | |
| narrative | TEXT | | Copy no estilo do Sistema |
| status | VARCHAR(20) | DEFAULT 'active' | active \| completed \| failed \| rescued |
| modules_json | JSONB | DEFAULT '{}' | Progresso dos módulos |
| xp_reward | INT | DEFAULT 0 | |
| stat_points_reward | INT | DEFAULT 0 | |
| crystal_reward | INT | DEFAULT 0 | |
| skill_reward | VARCHAR(50) | NULLABLE | |
| title_reward | VARCHAR(50) | NULLABLE | |
| starts_at | TIMESTAMPTZ | DEFAULT NOW() | |
| expires_at | TIMESTAMPTZ | NULLABLE | |
| completed_at | TIMESTAMPTZ | NULLABLE | |

**Tabela: `muscle_rank_history`**

| Coluna | Tipo | Constraint |
|--------|------|-----------|
| id | UUID | PK |
| user_id | UUID | FK → users.id |
| muscle_group | VARCHAR(50) | NOT NULL |
| previous_rank | VARCHAR(30) | |
| new_rank | VARCHAR(30) | |
| changed_at | TIMESTAMPTZ | DEFAULT NOW() |

**Tabela: `muscle_volume_cache`** *(pós-MVP v1.1)*

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| user_id | UUID | FK → users.id |
| muscle_group | VARCHAR(50) | |
| period_days | INT | 3 ou 7 |
| total_volume_kg | DECIMAL(10,2) | |
| fatigue_score | DECIMAL(4,2) | 0.0–2.0 |
| calculated_at | TIMESTAMPTZ | Cache inválido se > 12h |

---

## 4. Arquitetura de Pastas

### 4.1 Frontend — Next.js 14

```
frontend/
  app/
    (auth)/login/page.tsx
    (auth)/register/page.tsx
    (app)/layout.tsx                    # Layout principal + RestTimerPortal
    (app)/dashboard/page.tsx            # Home: Hunter profile, streaks, água, resumo
    (app)/hunter/page.tsx               # Perfil RPG: rank, stats, shadow army
    (app)/hunter/skills/page.tsx        # Skills desbloqueadas
    (app)/hunter/muscles/page.tsx       # Rank dos 17 músculos
    (app)/workout/page.tsx              # Lista de treinos
    (app)/workout/[dayId]/page.tsx      # Modo Foco — Dungeon
    (app)/workout/history/page.tsx
    (app)/nutrition/page.tsx
    (app)/nutrition/import/page.tsx     # Upload Samsung Health
    (app)/body/page.tsx                 # Gráficos de evolução
    (app)/body/import/page.tsx          # Upload bioimpedância
    (app)/import/page.tsx               # Parser TXT
    (app)/settings/page.tsx             # Lembretes, Strava OAuth, classe
  components/
    hunter/
      HunterProfile.tsx                 # Card rank + level + XP bar
      StatPanel.tsx                     # STR/VIT/AGI/INT/PER
      ShadowArmy.tsx                    # Igris, Tank, Iron, Fang
      MuscleRankMap.tsx                 # 17 músculos com ranking visual
      XpEventFeed.tsx                   # Feed de XP ganho
    workout/
      ExerciseCard.tsx                  # Card com histórico inline
      SetLogger.tsx                     # Input de kg/reps por série
      RestTimerPortal.tsx               # Cronômetro flutuante (React Portal)
      WorkoutTimer.tsx                  # Cronômetro total
      DungeonEntryScreen.tsx            # Tela de entrada na dungeon
      DungeonCompleteScreen.tsx         # Resumo épico ao finalizar
      VolumeLoadCounter.tsx             # Contador em tempo real
    nutrition/
      MacroRing.tsx
      WaterTracker.tsx                  # Barra circular 0–5000ml
      AiValidationForm.tsx              # Formulário pós-IA
    charts/
      BodyEvolutionChart.tsx
      MacroTrendChart.tsx
      VolumeLoadChart.tsx
    quests/
      DailyQuestCard.tsx
      EmergencyQuestBanner.tsx
      PenaltyZoneBanner.tsx
    shared/
      OfflineBanner.tsx
      AlertBanner.tsx
      SystemNotification.tsx            # Notificação no estilo Solo Leveling
  lib/
    db/schema.ts                        # Dexie.js schema
    db/sync.ts                          # Sincronização offline
    stores/
      workoutStore.ts
      restTimerStore.ts                 # Timer global (Zustand)
      hunterStore.ts                    # Dados do personagem
      questStore.ts                     # Quests ativas
    utils/
      macroCalc.ts
      xpCalc.ts                         # Fórmulas de XP
      notifications.ts
```

### 4.2 Backend — .NET 6

```
backend/
  FitnessTrack.API/
    Controllers/
      AuthController.cs
      WorkoutController.cs
      NutritionController.cs
      BodyController.cs
      StreakController.cs
      ImportController.cs
      ExportController.cs
      HunterController.cs               # Rank, XP, skills, quests
      MuscleRankController.cs           # 17 músculos
    Program.cs
  FitnessTrack.Core/
    Entities/
      User.cs, WorkoutPlan.cs, WorkoutDay.cs, Exercise.cs
      WorkoutSession.cs, ExerciseSet.cs
      DietPlan.cs, DailyNutritionLog.cs, WaterIntakeEvent.cs
      BodyMeasurement.cs, Streak.cs, Reminder.cs
      HunterProfile.cs, MuscleRank.cs, ExercisePR.cs
      HunterSkill.cs, HunterTitle.cs, XpEvent.cs, HunterQuest.cs
    Interfaces/
    Exceptions/
  FitnessTrack.Application/
    Services/
      WorkoutParserService.cs           # Regex parser TXT
      DietParserService.cs
      AiVisionService.cs                # Gemini / GPT-4o Vision
      StreakService.cs
      StravaService.cs
      MacroCalculatorService.cs
      BodyAlertService.cs
      ExerciseSubstitutionService.cs
      ExportService.cs                  # CSV + ZIP
      XpCalculatorService.cs            # Fórmulas de XP por série
      MuscleRankService.cs              # Atualização dos 17 ranks musculares
      QuestService.cs                   # Daily, Main, Emergency quests
      PenaltyService.cs                 # Zona de penalidade + resgate
      HunterProgressService.cs          # Level up, rank up, stats
      SkillDetectionService.cs          # Detecta skills reais automaticamente
    Validators/
  FitnessTrack.Infrastructure/
    Data/
      AppDbContext.cs
      Migrations/
      Repositories/
    ExternalServices/
      GeminiApiClient.cs
      StravaApiClient.cs
    BackgroundJobs/
      StravaSyncJob.cs
      StreakUpdateJob.cs
      DailyQuestGeneratorJob.cs         # Gera Daily Quest às 00:00
      MuscleRankRecalcJob.cs            # Recalcula ranks musculares
      XpProcessorJob.cs                 # Processa XP pendente
  FitnessTrack.Tests/
    Unit/
    Integration/
```

---

## 5. Módulo A — Parser TXT

O usuário cola um texto livre em um `<textarea>`. O backend usa Regex para parsear e popular o banco.

### Padrões de Entrada Aceitos

```
DIA 1 - PUSH (Peito/Ombro/Tríceps)
Supino Reto com Barra | 4x8-12
Desenvolvimento com Halteres | 3x10 | Descanso: 90s
Extensão de Tríceps Polia | 3x12-15

DIA 2 - PULL [Costas/Bíceps]
Remada Curvada com Barra | 4x8-10
Puxada na Polia Alta | 3x10-12
```

### Regex — WorkoutParserService.cs

```csharp
// Cabeçalho do dia
Regex DayHeader = new(@"^DIA\s*(\d+)\s*[-–]\s*(.+?)\s*[\(\[]?([^\)\]]*)?[\)\]]?\s*$",
    RegexOptions.IgnoreCase | RegexOptions.Multiline);

// Exercício: Nome | SériesxReps [| Descanso: Xs]
Regex Exercise = new(@"^(.+?)\s*\|\s*(\d+)x([\d\-]+)\s*(?:\|\s*[Dd]escanso:\s*(\d+)s?)?\s*$",
    RegexOptions.Multiline);
```

### Critérios de Aceite — Parser TXT

| ID | Cenário | Resultado |
|----|---------|-----------|
| PA-01 | DIA com parênteses | `day_label='PUSH'`, `muscle_groups='Peito/Ombro'` |
| PA-02 | Rep range | `reps='8-12'` como string |
| PA-03 | Sem campo descanso | `rest_seconds=60` (default) |
| PA-04 | Linhas em branco | Parser ignora sem erro |
| PA-05 | 7 dias completos | 7 WorkoutDay + exercícios aninhados |
| PA-06 | Linha inválida | Adicionada a `ignoredLines`, parse continua |
| PA-07 | Texto vazio | Lista vazia, sem exception (200 OK) |

### Critérios de Aceite — Parser Dieta

| ID | Critério | Resultado |
|----|---------|-----------|
| PD-01 | Refeições numeradas | Registros com horário sugerido |
| PD-02 | Macros (P/C/G + kcal) | Popula `target_protein_g`, etc. |
| PD-03 | Total diário | Valida soma dos macros ±10kcal |

---

## 6. Módulo B — Modo Foco Offline-First

### Fluxo Completo

| Etapa | Ambiente | Ação | Tecnologia |
|-------|----------|------|-----------|
| 1. Download | Online (Wi-Fi) | Clica "Baixar Treino de Hoje" | React Query + Axios |
| 2. Cache | Browser | Treino + histórico de cargas salvos | Dexie.js |
| 3. Execução | Offline | App lê do IndexedDB, exibe exercícios e GIFs | Dexie.js + Zustand |
| 4. Registro | Offline | Usuário insere kg e reps por série | Dexie.js |
| 5. Fila | Offline | Série concluída entra em `pendingSets` | Dexie.js |
| 6. Sync | Online (reconexão) | Background sync envia fila para API | Service Worker |
| 7. Confirmação | Online | API persiste dados, fila local é limpa | C# API |

### Schema Dexie.js

```typescript
// lib/db/schema.ts
export const db = new Dexie('HunterFitDB');
db.version(1).stores({
  workoutDays:    '++id, planId, dayNumber, downloadedAt',
  exercises:      '++id, dayId, orderIndex',
  pendingSets:    '++id, sessionId, exerciseId, syncStatus, createdAt',
  activeSessions: '++id, dayId, startedAt, syncStatus',
  cachedGifs:     '&exerciseId, url, cachedAt',
  // lastSession por exercício incluído no payload de download
  // exercises[n].lastSession = { date, sets: [{weight_kg, reps_done}] } | null
});
```

### Cronômetro Flutuante — RestTimerPortal.tsx

```typescript
// Montado no document.body via React Portal — sobrevive à navegação
export function RestTimerPortal() {
  const { isRunning, seconds, totalSeconds, exerciseName } = useRestTimerStore();
  if (!isRunning) return null;
  return createPortal(
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t-4 border-blue-500 px-4 py-3 flex items-center gap-4">
      <CircularProgress value={seconds} max={totalSeconds} />
      <span className="text-white font-mono text-2xl">{formatTime(seconds)}</span>
      <span className="text-slate-400 text-sm">{exerciseName}</span>
      <Button onClick={skipRest}>Pular</Button>
    </div>,
    document.body
  );
}
```

### Histórico Inline — ExerciseCard

```
Supino Reto com Barra
  Último: 4×10 · 80kg · há 7 dias   ← discreto, cinza
-----------------------------------------
  Série 1: [ ___ ]kg  [ ___ ]reps  [✓]
  Série 2: [ ___ ]kg  [ ___ ]reps  [✓]
```

Endpoint: `GET /api/exercises/:id/last-session`  
Retorna: `{ last_date, avg_weight_kg, max_weight_kg, reps_summary }`

### Critérios de Aceite — Offline

| ID | Cenário | Resultado |
|----|---------|-----------|
| SO-01 | App sem internet após download | Exercícios e GIFs carregam do IndexedDB |
| SO-02 | 10 séries offline, reconecta | Exatamente 10 registros, sem duplicatas (idempotência) |
| SO-03 | Rede cai no meio do sync | Items na fila reenviam ao reconectar |
| SO-04 | Conflict: série já no servidor | API 409; client marca synced sem duplicar |
| SO-05 | Timer após série concluída | Banner flutuante aparece e sobrevive à troca de tela |
| SO-06 | Volume Load ao longo do treino | 4×10×80kg = 3.200kg calculado corretamente |

---

## 7. Módulo C — IA Vision

### Prompts Otimizados

```
// Bioimpedância (Gemini 1.5 Flash)
"Você é um extrator de dados de laudos de bioimpedância.
Analise a imagem e retorne APENAS JSON puro, sem markdown:
{ weight_kg: number|null, body_fat_pct: number|null,
  muscle_mass_kg: number|null, water_pct: number|null,
  bmi: number|null, confidence: 'high'|'medium'|'low' }
Se campo não visível, use null."

// Log Nutricional (Samsung Health)
"Extraia os totais de macronutrientes do dia do print do Samsung Health.
Retorne SOMENTE JSON puro:
{ kcal_consumed: number|null, protein_g: number|null,
  carbs_g: number|null, fat_g: number|null,
  log_date: 'YYYY-MM-DD'|null, confidence: 'high'|'medium'|'low' }"
```

### ⚠️ Regra de Ouro — IA nunca grava diretamente no banco

1. API retorna JSON com campo `confidence` — sem persistir nada
2. Frontend **sempre** renderiza `AiValidationForm` com dados pré-preenchidos
3. Campos `confidence='low'` recebem borda amarela de alerta
4. Ação "Confirmar e Salvar" é explícita — **não existe auto-save**
5. Backend valida ranges fisiológicos antes de persistir (segunda barreira):
   - Peso: 40–200kg | % Gordura: 3–60% | Massa Muscular: 20–120kg | % Água: 30–75%

### Fluxo Bioimpedância

| Passo | Ator | Ação |
|-------|------|------|
| 1 | Usuário | Upload do print em `/body/import` |
| 2 | C# API | Chama Gemini com prompt; retorna JSON |
| 3 | Frontend | `AiValidationForm` com dados pré-preenchidos |
| 4 | Usuário | Revisa, edita, confirma |
| 5 | C# API | Valida ranges; persiste em `body_measurements` |
| 6 | C# API | `BodyAlertService` verifica queda muscular |
| 7 | Frontend | Alerta se triggered; navega para gráficos |
| 8 | **RPG** | `XpCalculatorService` concede +50 XP + potencial Emergency Quest |

---

## 8. Módulo D — Gamificação e Strava

### Ofensivas (Streaks) → Vinculadas à Shadow Army (Seção 23)

| Tipo | Validação | Quebra | Recuperação |
|------|-----------|--------|-------------|
| `workout` | Sessão de treino no dia | Dia sem sessão | Não |
| `cardio` | Strava ≥45min OU check manual | Sem atividade | Não |
| `diet` | kcal ≤2.600 E proteína ≥240g | Sem log validado | **Sim** — D+1 via print |
| `water` | ≥4.500ml no dia | Abaixo de 4.500ml | Não |

### Integração Strava — Fluxo Completo

1. Usuário acessa `/settings` → clica "Conectar Strava"
2. Backend gera URL OAuth 2.0 → redireciona
3. Callback retorna `code` → C# troca por `access_token`
4. Tokens salvos em `users.strava_access_token/refresh_token`
5. `StravaSyncJob` (Hangfire) roda a cada 30 minutos
6. Busca atividades das últimas 24h via `GET /v3/athlete/activities`
7. Filtra: `type in ['Walk','Run','Ride'] AND elapsed_time >= 2700` (45min)
8. Se válido: preenche `strava_activity_id` + valida cardio streak + Fang sobe nível

### WaterTracker

- Barra circular animada 0–5.000ml
- Botões: +200ml, +350ml, +500ml, +750ml
- Cores: 0–2.500ml vermelho → 2.500–4.000ml âmbar → 4.000+ verde
- Ao atingir 5.000ml: animação de celebração + Fang (sombra de cardio) sobe
- Cada evento registrado individualmente em `water_intake_events`

---

## 9. Módulo E — Notificações

**Implementação:** Web Push API (VAPID) + Hangfire jobs.

| Tipo | Horário | Mensagem | Recorrência |
|------|---------|----------|-------------|
| TRT | 08:00 (config.) | *"O Sistema. Hora do TRT."* | Dia específico |
| Suplemento | 07:00 e 20:00 | *"Tome seus suplementos."* | Diário |
| Água | A cada 90min | *"Beba água! X/5.000ml. O Sistema está assistindo."* | Diário |
| Refeição | Horários do plano | *"Hora da Refeição N."* | Diário |
| Treino | 60min antes | *"Dungeon se abre em 1 hora. Prepare-se."* | Dias de treino |
| Cardio | 06:30 | *"Cardio hoje. 45 minutos. Sem desculpas."* | Diário |
| Daily Quest | 00:01 | *"DAILY QUEST DISPONÍVEL. 23h59 restantes."* | Diário |
| Penalidade | Se falhou | *"VOCÊ FALHOU. Quest de Resgate: 24h."* | Quando triggered |

---

## 10. Módulo F — Gráficos e Alertas

### Gráficos (Recharts)

| Gráfico | Tipo | Alerta |
|---------|------|--------|
| Peso vs Massa Muscular | Linha dupla | Queda músculo ≥ 0,5kg |
| % Gordura corporal | Área | Aumento ≥ 0,5% em 2 dias |
| Calorias diárias | Barras | Acima de 2.600 kcal |
| Proteína diária | Barras | Abaixo de 230g |
| Volume Load semanal | Barras | Queda > 20% vs semana anterior |
| Hidratação | Linha | Abaixo de 4.000ml |
| Streak Timeline | Calendário heat-map | Quebra de ofensiva |
| Volume por músculo | Barras empilhadas | Desequilíbrio muscular |

### Regras BodyAlertService.cs

- **CRÍTICO (vermelho):** `muscle_mass_kg nova < anterior - 0.5kg` → `alert_triggered = 'muscle_loss'` + Emergency Quest ativada
- **ATENÇÃO (amarelo):** `water_pct` aumentou > 1% → `alert_triggered = 'water_retention'`
- **DIETA (laranja):** kcal > 2.600 por 2 dias consecutivos
- **SUCESSO (verde):** Perda de gordura sem perda muscular

---

## 11. Adendo — Melhorias

### Volume Load

```sql
-- Campo GENERATED no banco (automático):
volume_load_kg DECIMAL(8,2) GENERATED ALWAYS AS (weight_kg * reps_done) STORED

-- Por exercício: Supino 4×10 a 80kg = 3.200kg
-- Por sessão: SUM(exercise_sets.volume_load_kg) → total_volume_load_kg
```

- Contador em tempo real na tela de execução
- Card de celebração ao finalizar: *"Você levantou X.XXXkg hoje!"*
- Comparação: *"+12% vs treino anterior"*

### Exercícios Alternativos

| Exercício Original | Alternativas Sugeridas |
|-------------------|----------------------|
| Supino Reto c/ Barra | Supino c/ Halteres, Crossover, Flexão Lastrada |
| Leg Press 45° | Agachamento Livre, Hack Squat, Afundo |
| Remada Curvada | Remada Unilateral, Puxada Pronada |
| Desenvolvimento Barra | Desenvolvimento Halteres, Arnold Press |

- `GET /api/exercises/:id/alternatives` retorna lista + carga histórica do usuário
- Substituição válida apenas para a sessão corrente (não altera plano permanente)

### Exportação CSV

`GET /api/export/all-data` → ZIP com:

```
hunterfit-export-2025-03-20.zip
  body_measurements.csv
  workout_sessions.csv
  exercise_sets.csv
  daily_nutrition_logs.csv
  water_intake_events.csv
  streaks_history.csv
  xp_events.csv
  muscle_ranks_history.csv
```

Implementado com `System.IO.Compression` nativo do .NET.

### TDEE Adaptativo (v1.1 — Pós-MVP)

```
// Requisito: 5 pesagens + 5 logs nos últimos 7 dias
Kcal_media  = AVG(daily_logs.kcal_consumed) últimos 7 dias
Delta_peso  = peso_dia7 - peso_dia1
Delta_kcal  = Delta_peso * 7.700
TDEE_real   = Kcal_media - (Delta_kcal / 7)
Nova_meta   = TDEE_real - caloric_deficit_target
```

### Heatmap de Fadiga Muscular (v1.1 — Pós-MVP)

```
fatigue_score = VL_3dias / VL_baseline
0.0–0.5 → verde (descansado)
0.5–0.8 → amarelo (moderado)
0.8–1.2 → laranja (cansado)
1.2+    → vermelho (risco overtraining)
```

Biblioteca frontend: `body-highlighter` (npm)

---

# PARTE II — SISTEMA RPG (HunterFit)

---

## 12. Identidade e Diferencial

> **Você não está usando um app de fitness com elementos de jogo.  
> Você está sendo o personagem de um jogo que acontece no mundo real.**

### O que nenhum concorrente faz junto

| Feature | GymLevels | Liftoff | Level Up | **HunterFit** |
|---------|-----------|---------|---------|-------------|
| Rank por músculo (17) | ✅ | parcial | ❌ | ✅ + narrativa |
| XP calibrado por esforço real | ✅ básico | ✅ básico | ❌ | ✅ histórico pessoal |
| Nutrição + água integrados | ❌ | ❌ | ❌ | ✅ |
| Bioimpedância IA | ❌ | ❌ | ❌ | ✅ Gemini |
| Offline-First | ❌ | ❌ | ❌ | ✅ Dexie.js |
| Strava integration | ❌ | ❌ | ❌ | ✅ |
| Penalidade com Resgate | ❌ | ❌ | básico | ✅ narrativa |
| Emergency Quests por dados reais | ❌ | ❌ | ❌ | ✅ |
| Skills Reais verificáveis | ❌ | ❌ | ❌ | ✅ 10 skills |
| Shadow Army (streaks narrativas) | ❌ | básico | ❌ | ✅ 4 soldados |
| Relatório semanal compartilhável | ✅ | ✅ | ❌ | ✅ voz do Sistema |
| Copy Solo Leveling fiel | ❌ | ❌ | ❌ | ✅ |
| Free tier funcional | ❌ paywall | parcial | parcial | ✅ |
| Export de dados | ❌ | ❌ | ❌ | ✅ CSV/ZIP |

---

## 13. Classes de Hunter

No onboarding, quiz de 8 perguntas → atribuição de classe. Classe pode ser trocada 1x por mês.

| Classe | Foco | Bônus |
|--------|------|-------|
| **Strength Seeker** | Compostos pesados (terra, agachamento, supino) | +20% XP em exercícios compostos |
| **Mass Builder** | Volume alto, hipertrofia | +20% XP quando VL > 110% da sessão anterior |
| **Endurance Hunter** | Cardio, resistência, reps altas | +20% XP em cardio e séries com reps > 15 |
| **Balance Warrior** | Treino equilibrado + nutrição | +10% XP em todos os módulos se completar Daily Quest inteira |
| **Recovery Specialist** | Sono, água, descanso ativo | PER cresce 2x mais rápido; immunity tokens dobram |
| **Athlete Elite** | Todos os módulos com excelência | +15% XP em tudo; exigências da Daily Quest são maiores |

---

## 14. Rank Global do Hunter

| Rank | Nível | Condição de Acesso | UI |
|------|-------|-------------------|-----|
| **E — Iniciante** | 1–9 | Início | Cinza |
| **D — Registrado** | 10–24 | 10 dungeons | Azul |
| **C — Profissional** | 25–44 | 1 skill real desbloqueada | Verde |
| **B — Elite** | 45–69 | 3 skills reais | Roxo |
| **A — Mestre** | 70–99 | PR batido 10x em compostos | Dourado |
| **S — Nacional** | 100–149 | 5 skills reais + 200 dungeons | Vermelho |
| **National Level** | 150+ | 20 dias sem falha + evento especial | Preto animado |

### Teste de Rank (Promoção Obrigatória)

```
╔══════════════════════════════════════════════════════╗
║  ⚔️  TESTE DE RANK: D → C                          ║
║  "O Sistema avaliou seu progresso.                   ║
║   Prove que você merece."                            ║
╠══════════════════════════════════════════════════════╣
║  • Complete a Dungeon em menos de 65 minutos         ║
║  • Atinja 90% do seu maior Volume Load histórico     ║
║  • Sem skip de exercício                             ║
╠══════════════════════════════════════════════════════╣
║  SUCESSO: Rank C + 3.000 XP + Título especial        ║
║  FALHA: Sem punição. Tente novamente em 7 dias.      ║
╚══════════════════════════════════════════════════════╝
```

---

## 15. Rank por Músculo

**17 grupos musculares**, cada um com **16 estágios de rank independente**.

### Os 17 Grupos

| # | Músculo | Exercícios Principais |
|---|---------|----------------------|
| 1 | Peito (Peitoral Maior) | Supino, crossover, flexão |
| 2 | Costas (Latíssimo) | Barra fixa, puxada, remada |
| 3 | Costas Alta (Trapézio) | Remada curvada, face pull, shrug |
| 4 | Ombro Frontal | Desenvolvimento, elevação frontal |
| 5 | Ombro Lateral | Elevação lateral, arnold press |
| 6 | Ombro Posterior | Crucifixo invertido, face pull |
| 7 | Bíceps | Rosca direta, alternada, martelo |
| 8 | Tríceps | Extensão, pulley, dip |
| 9 | Quadríceps | Agachamento, leg press, cadeira extensora |
| 10 | Posterior (Isquiotibiais) | Terra, mesa flexora, stiff |
| 11 | Glúteo | Hip thrust, afundo, agachamento sumô |
| 12 | Panturrilha | Elevação de calcanhar |
| 13 | Abdômen | Abdominal, prancha, crunch |
| 14 | Lombar | Hiperextensão, terra |
| 15 | Antebraço | Rosca de punho, fat grip |
| 16 | Peito Médio/Inferior | Supino declinado, dip com peso |
| 17 | Core (Oblíquo) | Rotação russa, prancha lateral |

### Os 16 Ranks de Músculo

| Rank | Cor |
|------|-----|
| Untrained | Cinza escuro |
| Awakening | Cinza |
| Novice I / II | Azul fraco |
| Beginner I / II | Verde fraco |
| Intermediate I / II | Verde |
| Advanced I / II | Azul forte |
| Expert I / II | Roxo |
| Elite I / II | Dourado |
| Master | Vermelho |
| **Legend** | Preto/prata animado |

### Painel dos 17 Músculos

```
🗺️  MAPA DE PODER

  Peito         ████████████░░░░  Expert II
  Costas        ██████████████░░  Advanced II
  Ombro Lat.    ████████░░░░░░░░  Intermediate II
  Quadríceps    ██████░░░░░░░░░░  Beginner II    ← atenção
  Posterior     ████░░░░░░░░░░░░  Novice II
  Glúteo        ████░░░░░░░░░░░░  Novice I       ← atenção
  Panturrilha   ██░░░░░░░░░░░░░░  Awakening      ← skip detectado

  ⚠️  Desequilíbrio muscular detectado.
  Quest disponível: Treine Pernas por 3 dias seguidos.
```

---

## 16. Atributos

| Stat | O que representa | Bônus por ponto |
|------|-----------------|----------------|
| **STR** | Volume Load total acumulado | +0.5% XP em força |
| **VIT** | Consistência — dias sem falhar | +0.5% resistência a penalidade |
| **AGI** | Cardio — minutos aeróbicos | +0.5% XP em cardio |
| **INT** | Nutrição — precisão dos macros | +0.5% XP em log nutricional |
| **PER** | Hidratação + recuperação | +0.5% XP em água e descanso |

### Fontes de Stat Points

| Fonte | Pontos |
|-------|--------|
| Subir de nível | +3 |
| Completar Main Quest | +1 |
| Bater PR em exercício composto | +2 |
| 7 dias consecutivos de Daily Quest | +1 |
| Desbloquear skill real | +3 |
| Completar Teste de Rank | +5 |

---

## 17. Sistema de XP — Fórmula Completa

### Princípio: XP proporcional ao esforço real relativo ao histórico

```python
XP_série = Volume_Load × mult_esforço × mult_exercício × mult_classe × mult_evento

Volume_Load   = weight_kg × reps_done
mult_esforço  = min(2.0, weight_kg / PR_histórico_exercício)
  → PR sendo batido: multiplicador próximo de 1.0 (chegando em 2.0 ao superar)
  → Muito abaixo do PR: multiplicador < 1.0
mult_exercício = ver tabela abaixo
mult_classe    = bônus da classe (ex: Strength Seeker +1.2 em compostos)
mult_evento    = 1.0 padrão; 2.0 se PR da sessão; 2.5 se Red Gate
```

### Multiplicadores por Tipo

| Categoria | Exemplos | Mult. |
|-----------|---------|-------|
| Composto Pesado | Terra, Agachamento livre, Supino barra, Desenvolvimento barra | **1.5x** |
| Composto Médio | Remada barra, Leg press, Hack squat | **1.3x** |
| Peso Corporal | Flexão, Barra fixa, Dip, Afundo | **1.2x** |
| Isolado | Rosca, Elevação lateral, Extensão | **1.0x** |
| Cardio Moderado | Caminhada, bicicleta leve | **15 XP/min** |
| Cardio Intenso | Corrida, HIIT | **25 XP/min** |

### XP de Outras Fontes

| Ação | XP |
|------|-----|
| Daily Quest — treino completo | +200 |
| Daily Quest — nutrição (macros no alvo) | +100 |
| Daily Quest — água (≥4.500ml) | +80 |
| Daily Quest — cardio (≥45min) | +150 |
| PR batido (qualquer exercício) | +500 bônus |
| Conclusão de dungeon | +300 |
| Dungeon Red Gate | +800 |
| Dungeon Boss (Teste de Rank) | +3.000 |
| Bioimpedância validada | +50 |
| 7 dias de Daily Quest | +1.000 |
| Rank muscular subiu | +400 |
| Skill Real desbloqueada | +1.500 |
| Penalidade cumprida com sucesso | +250 |
| Relatório semanal gerado | +100 |

### Curva de XP por Nível

```
XP_para_nivel(n) = 1000 × n^1.4

Nível  1→ 2:     1.000 XP
Nível 10→11:     8.000 XP
Nível 25→26:    27.500 XP
Nível 50→51:    72.000 XP
Nível100→101:  200.000 XP
```

### Exemplo Real

```
Push Day — Strength Seeker — Supino Reto 4×10 a 102.5kg (PR: 100kg)

mult_esforço = min(2.0, 102.5/100) = 1.025
mult_exercício = 1.5 (composto pesado)
mult_classe = 1.2 (Strength Seeker)
mult_evento = 2.0 (PR da sessão ativado!)

Série 1: (102.5×10) × 1.025 × 1.5 × 1.2 × 2.0 = 3.772 XP
Série 2: (102.5×8)  × 1.025 × 1.5 × 1.2 × 2.0 = 3.018 XP
Série 3: (102.5×7)  × 1.025 × 1.5 × 1.2 × 2.0 = 2.640 XP
Série 4: (102.5×6)  × 1.025 × 1.5 × 1.2 × 2.0 = 2.263 XP

Subtotal Supino: 11.693 XP
+ Bônus PR: +500 XP
+ Bônus dungeon: +300 XP
TOTAL SESSÃO ESTIMADA: ~15.000 XP
```

---

## 18. Dungeons

Cada sessão de treino é uma **Dungeon**. Ao iniciar, o app entra em Modo Dungeon.

### Tipos

| Tipo | Gatilho | XP Bônus | Mecânica |
|------|---------|---------|---------|
| Normal | Todo treino planejado | +300 | Completar todos os exercícios |
| De Crise | Pós-penalidade ou streak quebrada | +500 | Treino reduzido, intensidade maior |
| Red Gate | Evento semanal surpresa | +800 | Sem descanso > 90s entre séries |
| Oculta | Aleatória 1x/semana | +1.200 | Desafio gerado dinamicamente |
| Boss | Teste de Rank | +3.000 + Rank up | Superar VL máximo histórico |
| Rush | 3 dungeons em 3 dias | 2x XP na 3ª | Cumulativo |

### Tela de Entrada

```
╔══════════════════════════════════════╗
║  ⚔️  DUNGEON DETECTADA              ║
║  Tipo: PUSH — Risco: ★★★☆☆         ║
║  Monstros: 6 exercícios              ║
║  Boss: Supino Reto com Barra         ║
╠══════════════════════════════════════╣
║  Boss anterior: 100kg × 10 reps      ║
║  "O Sistema espera que você supere." ║
║  XP Potencial: ~15.000 XP           ║
╠══════════════════════════════════════╣
║  [ENTRAR NA DUNGEON]                 ║
╚══════════════════════════════════════╝
```

### Tela de Conclusão

```
✅  DUNGEON CONQUISTADA

  Volume Total:  9.120kg
  Anterior:      8.432kg (+8.2%) ← NOVO RECORDE!

  XP DOS EXERCÍCIOS:   +11.200 XP (2x PR)
  BÔNUS DE CONCLUSÃO:     +300 XP
  BÔNUS DE PR:            +500 XP
  BÔNUS DE RECORDE:       +600 XP
  ─────────────────────────────────
  TOTAL:              +12.600 XP

  RANKS MUSCULARES:
  • Peito: Expert II → MASTER ⬆️
  • Tríceps: Advanced II

  "Você provou ao Sistema que ainda tem mais."
```

---

## 19. Quests

### 19.1 Daily Quest — Gerada às 00:00

```
╔═══════════════════════════════════════════════╗
║  ⚔️  DAILY QUEST — DIA 14                    ║
║  "O Sistema não descansa. Você também não."   ║
╠═══════════════════════════════════════════════╣
║  [ ] 🏋️  Dungeon: Treino PUSH                 ║
║  [ ] 🥩  Macros: ≥240g prot · ≤2.500kcal     ║
║  [ ] 💧  Hidratação: ≥4.500ml                 ║
║  [ ] 🏃  Cardio: ≥45 minutos                  ║
╠═══════════════════════════════════════════════╣
║  Recompensa: +530 XP + 3 Cristais de Mana    ║
║  ⏰ Tempo restante: 18h 34min                 ║
║  ⚠️  Falhar = Zona de Penalidade              ║
╚═══════════════════════════════════════════════╝
```

**Regra de XP parcial:** 3 de 4 módulos = 3/4 do XP. 0 módulos = Penalidade Completa.

### 19.2 Main Quests dos 20 Dias

| ID | Quest | Condição | Recompensa |
|----|-------|---------|-----------|
| MQ-01 | **"O Despertar"** | 7 dias seguidos de Daily Quest | +2.000 XP + Título + 3 Stat Points |
| MQ-02 | **"Treino do Inferno"** | PR em 5 exercícios diferentes | +3.000 XP + Skill: "Vontade de Ferro" |
| MQ-03 | **"A Balança Não Mente"** | 5 bioimpedâncias ao longo dos 20 dias | +1.500 XP + Heatmap de Fadiga |
| MQ-04 | **"Guerreiro da Nutrição"** | 14 dias com macros no alvo | +4.000 XP + 10 Stat Points |
| MQ-05 | **"Resistência de Monarca"** | 20 dias sem falha | +10.000 XP + Rank up + Título "Monarca" |
| MQ-06 | **"Barra do Rei"** | 10 barras fixas seguidas | Skill Real: "Pull-up Mastery" + STR +2 |
| MQ-07 | **"O Peso do Mundo"** | VL acumulado ≥ 100.000kg | +5.000 XP + Título "Atlas" |
| MQ-08 | **"Hidratação Lendária"** | 10 dias com ≥5.000ml | +2.000 XP + PER +3 |
| MQ-09 | **"Cardio Infernal"** | 10 sessões ≥45min | +2.500 XP + Skill: "Ritmo do Cardio" |
| MQ-10 | **"Corpo Forjado"** | STR ≥ 50 | +1.000 XP + Skill Passiva ativa |

### 19.3 Emergency Quests — Ativadas por Dados Reais

| Gatilho | Quest | Recompensa / Falha |
|---------|-------|-------------------|
| Queda ≥0,5kg massa muscular (bio) | Aumentar VL costas+posterior em 3 dias | +800 XP / -500 XP |
| PR de composto sem bater há 30 dias | Tentar PR esta semana | +600 XP / sem punição |
| 3 dias sem cardio (Strava) | 60min de caminhada hoje | +400 XP / VIT -1 temp |
| Hidratação < 3.000ml por 2 dias | 7.000ml hoje | +300 XP / sem punição |
| Músculo com rank "Awakening" há >14 dias | Treinar esse músculo 3x esta semana | +700 XP + rank push |
| 2 dias consecutivos acima de 2.600kcal | 2 dias com macros perfeitos | +500 XP / streak diet quebra |

```
🔴  QUEST DE EMERGÊNCIA

"Anomalia detectada.
 Sua massa muscular caiu 0.6kg.

 O Sistema não aceita retrocesso.

 MISSÃO: Nos próximos 3 dias, atinja 110% do
 seu volume médio de treino de Costas e Posterior.

 SUCESSO: +800 XP.
 FALHA:   -500 XP."
```

---

## 20. Penalidade e Zona de Resgate

### Níveis de Penalidade

| Situação | Tipo |
|----------|------|
| 0 módulos | Penalidade Máxima |
| 1 módulo | Penalidade Alta |
| 2 módulos | Penalidade Moderada |
| 3 módulos (só faltou treino) | Penalidade Leve |
| Emergency Quest ignorada 3 dias | Penalidade Severa (-500 XP + VIT -1 por 3 dias) |

### Quest de Resgate Dinâmica

| O que falhou | Quest gerada |
|-------------|-----------------|
| Treino | 200 repetições de peso corporal ao longo do dia |
| Proteína | Log 3 refeições com print amanhã |
| Cardio | 60min de caminhada hoje |
| Água | 6.500ml hoje |
| Tudo | Combinação de todos acima |

### Imunidade — Stat VIT

- Cada **10 pontos de VIT** = 1 token de imunidade por semana
- Token cancela penalidade automaticamente
- *"Sua Vitalidade protegeu você desta vez. Use com sabedoria."*

---

## 21. Skills

### 21.1 Skills Passivas (desbloqueadas por marcos)

| Skill | Como desbloquear | Efeito |
|-------|-----------------|--------|
| **Vontade de Ferro** | 10 Daily Quests seguidas | Penalidade dura 12h em vez de 24h |
| **Corpo Forjado** | STR ≥ 50 | +10% XP em força |
| **Ritmo do Cardio** | 30 sessões de cardio | AGI cresce 1.5x mais rápido |
| **Código da Nutrição** | 21 dias com macros no alvo | INT +1 a cada semana perfeita |
| **Guerreiro das Sombras** | 20 dias sem falha | XP de dungeon +25% permanente |
| **Resistência de Monarca** | Rank S | 2x imunidade por mês |
| **Olhos do Caçador** | 5 PRs num mesmo mês | Sistema detecta platôs e sugere ajuste |
| **Devorador de Dungeons** | 50 dungeons | Dungeon Normal vira Red Gate automaticamente |
| **Atributo Lendário** | Qualquer stat ≥ 100 | Stat em questão cresce 2x mais rápido |

### 21.2 Skills Reais (conquistas físicas verificáveis)

| Skill | Condição Física | Verificação | Recompensa |
|-------|----------------|-------------|-----------|
| **Pull-up Mastery** | 10 barras fixas consecutivas | Log reps ≥ 10 em Barra Fixa | +50 XP/barra fixamente + STR +2 |
| **Deadlift 1.5x** | Terra com 1.5× peso corporal | weight_kg ≥ 1.5 × peso_usuario | Título "Levantador de Mortos" + STR +5 |
| **Iron Chest** | Supino com o próprio peso | weight_kg ≥ peso_usuario no Supino | Título "Peito de Ferro" + STR +3 |
| **Shadow Step** | 5km em ≤30 minutos | Strava pace ≤ 6:00/km | AGI +5 + Skill animada |
| **Hydration God** | 7 dias com ≥5.000ml | Water tracker 7 dias | PER +3 + Título |
| **Dip Master** | 20 paralelas consecutivas | Log reps ≥ 20 em Paralelas | +40 XP/paralela permanente |
| **Cardio Warrior** | 60min de cardio numa sessão | Strava ou manual ≥60min | AGI +5 + 2x XP próximo cardio |
| **Macro Precision** | 30 dias com proteína ±5g do alvo | Log nutricional 30 dias | INT +8 permanente |
| **Volume Monster** | VL acumulado ≥ 200.000kg | Soma de exercise_sets.volume_load_kg | STR +10 + Título |
| **Shadow Monarch Body** | Body fat ≤ 20% na bioimpedância | body_fat_pct ≤ 20 | Avatar especial + Rank boost |

```
🔮  NOVA SKILL REAL DESBLOQUEADA!

  PULL-UP MASTERY — Rank: ★★★ RARO
  "10 repetições perfeitas na barra fixa.
   Seu corpo provou ao Sistema que pode mais."

  EFEITO PERMANENTE:
  +50 XP por barra fixa — para sempre
  STR +2 | STAT POINTS BÔNUS: +3

  "O Sistema atualizou seu arquivo.
   Você não é mais o mesmo de ontem."
```

---

## 22. Eventos e Multiplicadores

### Eventos Automáticos

| Evento | Gatilho | Mult. | Duração |
|--------|---------|-------|---------|
| Modo PR | PR batido em qualquer série | 2x XP na sessão | Sessão |
| Semana Dupla | 7 dias perfeitos na semana anterior | 1.5x XP | 7 dias |
| Red Gate | Evento semanal surpresa | 2.5x XP | 1 sessão |
| Despertar | Promoção de rank | 3x XP | 24h |
| Rush | 3 dungeons em 3 dias | 2x XP na 3ª | Instantâneo |

### Micro-eventos na Sessão

| Desafio | Condição | Bônus |
|---------|---------|-------|
| Last Rep Killer | Última série com mais reps que a primeira | +200 XP |
| No Rest | Descanso < 60s (timer confirma) | +50 XP/série |
| Weight Jump | Carga maior que semana passada | +150 XP/série |
| Full Clear | 100% dos exercícios concluídos | +400 XP |
| PR Attempt | Série iguala ou supera PR | 2x XP nessa série |
| Beast Mode | VL > 120% do histórico | +600 XP + Título temp |
| Triple Threat | 3 PRs na mesma sessão | 3x XP na sessão toda |

---

## 23. Shadow Army — Streaks Reimaginadas

As streaks viram um **exército de sombras**. Cada tipo de streak é um soldado.

| Soldado | Streak | Cresce com | Bônus no máximo (Lv50) |
|---------|--------|-----------|----------------------|
| ⚔️ **Igris** (Knight) | Treino — dias consecutivos | +1 por dungeon completada | +15% XP em treinos |
| 🪓 **Tank** (Berserker) | Volume — sessões acima da média | +1 por sessão > média | +15% XP em força |
| 🛡️ **Iron** (Soldier) | Nutrição — dias com macros no alvo | +1 por dia validado | +15% XP em nutrição |
| 🐺 **Fang** (Beast) | Cardio — dias com ≥45min | +1 por dia com cardio | +15% XP em cardio |

```
🖤  SUA SHADOW ARMY

  ⚔️  IGRIS    Lv.14  ██████████████░░  [14/50]
  🪓  TANK     Lv.8   ████████░░░░░░░░  [8/50]
  🛡️  IRON     Lv.21  █████████████████░  [21/50]
  🐺  FANG     Lv.5   █████░░░░░░░░░░░░  [5/50]

  Poder Total: 48/200
  Bônus ativo (Iron Lv.21): +10.5% XP em logs nutricionais

  "ARISE."
```

### Quando a Streak Quebra

```
💔  IGRIS CAIU EM BATALHA

Streak de treino quebrada no Dia 14.
Igris voltou às sombras. Nível resetado.

...mas sombras podem ser ressurgidas.
Complete a Quest de Resgate para
ressuscitar Igris no Lv.7 (50% do nível anterior).

[ACEITAR QUEST DE RESGATE]
```

---

## 24. Títulos

Exibidos no perfil. Apenas 1 equipado por vez.

### Permanentes

| Título | Como obter |
|--------|-----------|
| **"O Mais Fraco"** | Título inicial — some ao chegar em Rank D |
| **"Aquele que Despertou"** | 7 dias seguidos |
| **"Sobrevivente da Penalidade"** | 3 Quests de Resgate cumpridas |
| **"Atlas"** | 100.000kg VL acumulado |
| **"Monstro do Volume"** | 200.000kg VL acumulado |
| **"Levantador de Mortos"** | Terra com 1.5× peso corporal |
| **"Peito de Ferro"** | Supino com o próprio peso |
| **"Aquele que Não Para"** | 30 dias sem falhar Daily Quest |
| **"Monarca"** | 20 dias do desafio sem falha |
| **"Shadow Monarch"** | Level 150 (National Level) |
| **"Equilibrado"** | Todos os 17 músculos acima de Intermediate II |
| **"Sem Ponto Fraco"** | Nenhum músculo abaixo de Beginner II |

### Temporários (7 dias)

| Título | Como obter |
|--------|-----------|
| **"Em Chamas"** | 3 PRs em uma semana |
| **"Beast Mode"** | VL > 120% do histórico |
| **"Red Gate Survivor"** | Completar um Red Gate |

---

## 25. Relatório Semanal (Estilo GymLevels + Sistema)

Gerado toda segunda-feira às 08:00. Compartilhável como card.

```
╔════════════════════════════════════════════════════╗
║  📊  RELATÓRIO DO SISTEMA — SEMANA 2              ║
║  Hunter: [Nome] | Rank C | Level 27               ║
╠════════════════════════════════════════════════════╣
║  🏆  XP: 18.240 XP  (+12% vs semana 1) ↑         ║
║                                                    ║
║  ⚔️  DUNGEONS: 5/5 ✅  Tempo médio: 54min         ║
║                                                    ║
║  🔥  PERSONAL RECORDS                              ║
║  Supino: 102.5kg · Barra Fixa: 12 reps            ║
║                                                    ║
║  🏋️  VOLUME LOAD                                   ║
║  Total: 48.320kg (+8.2% vs semana 1) ↑            ║
║                                                    ║
║  🌟  RANK MUSCULAR                                 ║
║  Peito: Expert II → MASTER ⬆️                     ║
║  Panturrilha: Awakening ⚠️                        ║
║                                                    ║
║  💧  HIDRATAÇÃO: 6/7 dias ≥4.500ml ✅             ║
║                                                    ║
║  🖤  SHADOW ARMY                                   ║
║  Igris: Lv.14 | Iron: Lv.21 | Fang: Lv.5         ║
║                                                    ║
╠════════════════════════════════════════════════════╣
║  AVALIAÇÃO DO SISTEMA:                             ║
║  "Peito evoluiu para Master. Panturrilha           ║
║   negligenciada. Emergency Quest em breve."        ║
╚════════════════════════════════════════════════════╝

[COMPARTILHAR]   [VER DETALHES]
```

---

## 26. Notificações — Voz do Sistema

```
// Subida de nível
"NÍVEL 15 ATINGIDO.
 3 Stat Points disponíveis.
 O que você escolher define quem você se tornará."

// PR detectado
"NOVO REGISTRO DETECTADO.
 Supino: 102.5kg. XP desta sessão: DOBRADO.
 O Sistema registrou sua superação."

// Rank muscular
"EVOLUÇÃO DETECTADA.
 Peito: Expert II → MASTER.
 Dois ranks te separam da Lenda."

// Skill real
"NOVA SKILL: PULL-UP MASTERY.
 Seu corpo provou ao Sistema."

// Daily Quest — manhã
"DAILY QUEST DISPONÍVEL.
 Você acordou. O Sistema também.
 18h restantes."

// 4h restantes
"4 HORAS.
 O Caçador que para de crescer regride.
 A Zona de Penalidade aguarda."

// Penalidade
"VOCÊ FALHOU.
 Quest de Resgate ativa. 24h.
 O Sistema oferece uma chance. Apenas uma."

// Emergency Quest
"ANOMALIA DETECTADA.
 Queda muscular: 0.6kg.
 O corpo fraqueja. O Sistema não aceita isso."

// Semana Dupla
"7 DIAS. SEM FALHA.
 1.5x XP nos próximos 7 dias.
 O Sistema reconhece disciplina real."

// Shadow Army
"🖤 IGRIS SUBIU PARA LV.20.
 20 dias de treino consecutivos.
 +10% XP em treinos."

// Red Gate disponível
"🔴 RED GATE DETECTADO.
 2.5x XP esta sessão.
 Sem descanso > 90s. O Sistema testará seus limites."
```

---

# PARTE III — IMPLEMENTAÇÃO

---

## 27. API REST — Todos os Endpoints

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/auth/register` | Registro + criação de hunter_profile | Público |
| POST | `/api/auth/login` | Login + JWT + refresh token | Público |
| POST | `/api/auth/refresh` | Renovar JWT | Público |
| GET | `/api/workout/today` | Treino do dia + histórico de cargas | Bearer |
| GET | `/api/workout/days/:id` | Detalhes de um dia | Bearer |
| POST | `/api/sessions` | Iniciar sessão (dungeon) | Bearer |
| PUT | `/api/sessions/:id/sets` | Atualizar séries (sync offline) | Bearer |
| POST | `/api/sessions/sync` | Sync idempotente em lote | Bearer |
| GET | `/api/exercises/:id/last-session` | Histórico da última sessão | Bearer |
| GET | `/api/exercises/:id/alternatives` | Alternativas com carga histórica | Bearer |
| POST | `/api/import/workout-txt` | Parser de treino | Bearer |
| POST | `/api/import/diet-txt` | Parser de dieta | Bearer |
| POST | `/api/body/analyze-image` | IA extrai dados (sem salvar) | Bearer |
| POST | `/api/body/measurements` | Salvar medição validada | Bearer |
| GET | `/api/body/measurements` | Histórico de medições | Bearer |
| POST | `/api/nutrition/analyze-image` | IA extrai macros do print | Bearer |
| POST | `/api/nutrition/daily-log` | Salvar log diário validado | Bearer |
| GET | `/api/nutrition/daily-log/:date` | Log de um dia específico | Bearer |
| POST | `/api/nutrition/water` | Adicionar evento de hidratação | Bearer |
| GET | `/api/streaks` | Estado atual das 4 ofensivas | Bearer |
| GET | `/api/dashboard` | Dados agregados: streaks + água + treino + XP | Bearer |
| GET | `/api/strava/auth-url` | Gerar URL OAuth | Bearer |
| GET | `/api/strava/callback` | Processar retorno OAuth | Público |
| POST | `/api/strava/sync` | Forçar sync manual | Bearer |
| GET | `/api/export/all-data` | Download ZIP com todos os CSVs | Bearer |
| GET/POST/PUT/DELETE | `/api/reminders` | CRUD de lembretes | Bearer |
| POST | `/api/notifications/subscribe` | Registrar push subscription (VAPID) | Bearer |
| GET | `/api/hunter/profile` | Perfil completo do Hunter (rank, stats, shadow army) | Bearer |
| GET | `/api/hunter/xp-events` | Feed de XP ganho | Bearer |
| POST | `/api/hunter/distribute-stats` | Distribuir Stat Points | Bearer |
| GET | `/api/hunter/skills` | Skills desbloqueadas | Bearer |
| GET | `/api/hunter/titles` | Títulos conquistados | Bearer |
| POST | `/api/hunter/titles/:id/equip` | Equipar título | Bearer |
| GET | `/api/hunter/quests` | Quests ativas e histórico | Bearer |
| POST | `/api/hunter/quests/:id/complete` | Marcar quest como cumprida | Bearer |
| GET | `/api/hunter/muscles` | Rank dos 17 grupos musculares | Bearer |
| GET | `/api/hunter/weekly-report` | Relatório semanal | Bearer |
| GET | `/api/hunter/prs` | Personal records de todos os exercícios | Bearer |
| POST | `/api/hunter/class` | Trocar classe (1x/mês) | Bearer |

---

## 28. Testes e QA

### Testes Unitários Críticos — C#

| Classe | Método | Cenário |
|--------|--------|---------|
| WorkoutParserService | ParseTxt() | Cabeçalho com parênteses → extração correta |
| WorkoutParserService | ParseTxt() | Texto vazio → lista vazia sem exception |
| MacroCalculatorService | ValidateDailyMacros() | 2.500kcal + 245g prot → streak válida |
| MacroCalculatorService | ValidateDailyMacros() | 2.600kcal → streak inválida |
| StreakService | UpdateStreak() | Dias consecutivos → `current_count` incrementa |
| StreakService | RecoverDietStreak() | Log D+1 antes de 23:59 → streak recuperada |
| BodyAlertService | CheckForAlerts() | Queda 0,5kg músculo → `'muscle_loss'` |
| BodyAlertService | CheckForAlerts() | Aumento 1% água → `'water_retention'` |
| AiVisionService | ValidateRanges() | Peso 250kg → ValidationException |
| StravaService | IsCardioActivity() | Walk 50min → true; Walk 30min → false |
| XpCalculatorService | CalculateSetXp() | Supino 100kg (PR 95kg) → mult_esforço correto |
| XpCalculatorService | CalculateSetXp() | PR batido → sessão toda recebe 2x |
| MuscleRankService | RecalculateRank() | VL crescente → rank sobe corretamente |
| QuestService | GenerateDailyQuest() | Gera 4 módulos às 00:00 |
| QuestService | GenerateRescueQuest() | Falha em treino → 200 reps de peso corporal |
| SkillDetectionService | CheckRealSkills() | 10 reps em Barra Fixa → Pull-up Mastery detectada |
| ExportService | BuildZipExport() | ZIP contém todos os 8 arquivos CSV |
| ExerciseSubstitutionService | GetAlternatives() | Ordenadas por similarity_score DESC |

### Testes de Componentes — Frontend

| Componente | Cenário | Resultado |
|-----------|---------|-----------|
| RestTimerPortal | Timer ativo, navega para outra tela | Banner permanece visível |
| WaterTracker | +500ml 10 vezes | Total = 5.000ml + animação |
| AiValidationForm | `confidence='low'` | Campo com borda amarela |
| DungeonCompleteScreen | PR batido | Exibe 2x XP e bônus |
| XpEventFeed | PR detectado | Notificação visual em tempo real |
| HunterProfile | Level up | Animação de level up disparada |
| ShadowArmy | Streak quebrada | Sombra cai em batalha |

---

## 29. Cronograma de 7 Dias

| Dia | Tema | Entregas |
|-----|------|---------|
| **Dia 1** | Setup + Infra + RPG Base | Repo Git, Next.js + Tailwind, .NET API, PostgreSQL com todas as migrations (incluindo hunter_profiles, muscle_ranks, xp_events, hunter_quests), JWT auth, CI/CD, hunter_profile criado no register |
| **Dia 2** | Parser + Dados + PRs | WorkoutParserService (Regex), DietParserService, seed de exercise_alternatives, testes unitários dos parsers, ExercisePR table, seed de 17 muscle_groups |
| **Dia 3** | Modo Foco Offline + XP | Dexie.js schema completo, download com lastSession, ExerciseCard com histórico inline, SetLogger, RestTimerPortal flutuante, XpCalculatorService (XP por série, PR detection), Volume Load em tempo real, DungeonEntryScreen + DungeonCompleteScreen |
| **Dia 4** | Nutrição + Água + IA | AiVisionService (Gemini), AiValidationForm, WaterTracker, endpoints nutrição, validação fisiológica, XP de log nutricional integrado, Fang shadow update |
| **Dia 5** | Gamificação + Strava + Quests | StreakService → Shadow Army, BodyAlertService → Emergency Quests, Strava OAuth + StravaSyncJob, DailyQuestGeneratorJob (Hangfire às 00:00), QuestService completo, PenaltyService |
| **Dia 6** | Gráficos + Notificações + PWA + Ranks | Recharts todos os gráficos, Push API + VAPID, CRUD lembretes, manifest.json, 17 músculo ranks com recalculo, MuscleRankService, relatório semanal, SkillDetectionService (skills reais) |
| **Dia 7** | QA + Export + Polish + Deploy | ExportService (8 CSVs + ZIP), testes E2E em celular real sem Wi-Fi, animações de level up / rank up / skill, deploy Vercel + Railway, smoke tests produção |

---

## 30. Checklist de Pré-Lançamento

> Verificar no **Dia 7** antes de iniciar o desafio.

| # | Item | Módulo | Status |
|---|------|--------|--------|
| 01 | Parser TXT funciona com texto real da nutricionista | MOD-A | ☐ |
| 02 | Modo offline testado no celular real sem Wi-Fi por 30min | MOD-B | ☐ |
| 03 | Sync reconecta sem duplicatas | MOD-B | ☐ |
| 04 | Cronômetro flutuante visível ao navegar entre telas | MOD-B | ☐ |
| 05 | Histórico do exercício exibido online e offline | MOD-B | ☐ |
| 06 | Volume Load: 4×10 × 80kg = 3.200kg correto | MOD-B | ☐ |
| 07 | Upload de bioimpedância extrai os 5 campos | MOD-C | ☐ |
| 08 | Formulário de validação da IA exibido antes de salvar | MOD-C | ☐ |
| 09 | Campo `confidence=low` destacado visualmente | MOD-C | ☐ |
| 10 | Alerta de perda muscular aparece no dashboard | MOD-C/F | ☐ |
| 11 | Strava OAuth completo em produção | MOD-D | ☐ |
| 12 | Atividade 45min no Strava valida cardio streak | MOD-D | ☐ |
| 13 | WaterTracker acumula e persiste entre sessões | MOD-D | ☐ |
| 14 | Push notifications chegam com app fechado | MOD-E | ☐ |
| 15 | Gráficos renderizam com dados de seed | MOD-F | ☐ |
| 16 | Exportação CSV gera ZIP com os 8 arquivos | MOD-F | ☐ |
| 17 | App instalável como PWA no home screen | Infra | ☐ |
| 18 | JWT refresh token funciona após 1h | Infra | ☐ |
| 19 | XP é calculado corretamente ao finalizar série | RPG | ☐ |
| 20 | PR batido → sessão recebe 2x XP + notificação | RPG | ☐ |
| 21 | Daily Quest gerada às 00:00 com os 4 módulos | RPG | ☐ |
| 22 | Penalidade ativa ao falhar Daily Quest | RPG | ☐ |
| 23 | Quest de Resgate gerada corretamente | RPG | ☐ |
| 24 | 17 ranks musculares exibidos no painel | RPG | ☐ |
| 25 | Shadow Army cresce com streaks | RPG | ☐ |
| 26 | Relatório semanal gerado na segunda-feira | RPG | ☐ |
| 27 | Substituição de exercício não altera plano | Adendo | ☐ |
| 28 | Todos os testes unitários passando no CI | QA | ☐ |
| 29 | Dados de seed para os 20 dias carregados | QA | ☐ |
| 30 | Sentry configurado com evento de teste | Infra | ☐ |

---

*HunterFit — Especificação Master v3.0*  
*"O Sistema não aceita mediocridade voluntária."*  
*"Arise. Level Up. IRL."*

---

# PARTE IV — ANÁLISE E ABSORÇÃO DO HEVY

> **Hevy** é o app de log de treino mais usado do mundo — mais de 12 milhões de atletas.  
> Ele domina em **usabilidade de registro, ferramentas de log e social**.  
> Não tem RPG, não tem nutrição, não tem offline confiável.  
> Nós absorvemos o que ele faz de melhor e descartamos o que ele faz de forma mediana.

---

## 31. Análise Completa do Hevy

### O que o Hevy realmente é

O app de treino mais usado do mundo — mais de 12 milhões de atletas, com três pilares: **log de treino, tracking de progresso e socialização**. Não oferece assistência na seleção de exercícios, design de programa ou seleção de peso — é um logger poderoso, não um treinador.

### Feature Map Completo do Hevy

#### 🏋️ Registro de Séries — O Núcleo

Log de sets, reps e peso com suporte a warm-up sets, drop sets, failure sets e supersets. Permite ver performance anterior para manter consistência e buscar novos PRs.

| Feature | O que faz |
|---------|-----------|
| **Tipos de Série** | Warm-up, Normal, Drop Set, Failure — 4 tipos, qualquer combinação na mesma série |
| **Supersets** | Agrupa 2+ exercícios; após completar uma série, o app rola automaticamente para o próximo exercício do superset |
| **Keep Awake** | Opção para manter a tela acesa durante o treino — logging mais fluido sem precisar desbloquear o celular |
| **Notas por exercício** | Dica ou lembrete custom — "pause 2s no fundo" — aparece toda vez que o exercício é aberto |
| **Histórico inline** | Carga e reps da última sessão pré-preenchidos automaticamente no início do treino |

#### 🔢 Calculadoras

A calculadora de anilhas informa exatamente quais anilhas colocar na barra para atingir o peso alvo, com base nas placas disponíveis na academia.

| Calculadora | Funcionamento |
|------------|---------------|
| **Plate Calculator** | Informa exatamente quais anilhas colocar na barra; personalizável com as placas disponíveis. Só para barras (não halteres). |
| **Warm-up Calculator** | Gera automaticamente séries de aquecimento baseadas em percentual do peso de trabalho — fórmula padrão editável |
| **1RM (estimado e real)** | Rastreia o 1RM projetado (via fórmula) e o verdadeiro (carga real de 1 rep) para cada exercício |
| **Strength Level** | No Deadlift, Squat e Bench compara seu PR com outros atletas por peso corporal, sexo e idade — posicionando como Beginner, Intermediate, Advanced ou Elite |

#### 📊 RPE Tracking

RPE (Rate of Perceived Exertion) de 6 a 10 pode ser registrado por série — cria um campo adicional enquanto o log está ativo. Não é obrigatório; pode ser deixado em branco em séries de aquecimento.

#### 📈 Gráficos e Estatísticas

Na aba de estatísticas, o app exibe atividade nos últimos 7 dias e um diagrama corporal com os músculos treinados destacados em azul.

| Gráfico | Dados |
|---------|-------|
| **Muscle Distribution Chart** | Diagrama corporal destacado + volume por músculo. Mostra volume de treino por grupo muscular, número de treinos, duração, volume load e número de séries completadas |
| **Sets per Muscle/Week** | Breakdown completo do volume de treino por grupo muscular — filtrável por semana, mês ou ano |
| **Performance por Exercício** | Rastreia peso máximo, 1RM projetado ou real, melhor set e volume de sessão, mais reps realizadas |
| **Calendário de Treinos** | Visualização de consistência — ver histórico de dias treinados num calendário |
| **Monthly Report** | Resumo do mês anterior — compartilhável para Instagram Stories |

#### 🌐 Social — O Diferencial do Hevy

O Hevy não é um app de redes sociais para fitness, mas um logger sofisticado com aspecto social integrado.

| Feature Social | Funcionamento |
|---------------|---------------|
| **Feed de Amigos** | Ver treinos de quem você segue com título, volume, duração, PRs e mídias |
| **Discovery Feed** | Feed de treinos recentes de pessoas que você não segue — cada workout com detalhes completos, mídia e botão de follow direto |
| **Leaderboard** | Ranqueia seu melhor lift em 38 exercícios contra seus amigos. Acessível na aba de perfil > Estatísticas > Leaderboard Exercises |
| **Comparação Side-by-Side** | Abre o perfil de outro usuário, vai em Comparison > Exercises in Common — dados lado a lado de 1RM, peso máximo, melhor set e volume |
| **Copiar Treino** | Selecionando 'Copy Workout' inicia uma nova sessão com os mesmos detalhes, que podem ser ajustados livremente |
| **Perfil Público/Privado** | Controle de privacidade por perfil e por treino individual |
| **Compartilhar Rotina** | Gera link externo para compartilhar plano de treino fora do app |

#### 🃏 Shareables

Cards visuais gerados automaticamente ao completar um treino — PR, volume de treino, distribuição muscular, comparações criativas como "você levantou 13.264kg — é como levantar um caminhão". Compartilháveis para Instagram Stories, Facebook e outros.

---

## 32. Features do Hevy Absorvidas — Com Adaptação HunterFit

Cada feature do Hevy foi analisada e adaptada para o universo HunterFit. Algumas são iguais, outras ganham uma camada RPG por cima.

---

### HEVY-01 — Tipos de Série (Warm-up / Normal / Drop Set / Failure)

**O que o Hevy faz:** 4 tipos marcáveis por série com qualquer combinação.

**HunterFit absorve e expande:**

| Tipo | Comportamento no HunterFit | Efeito RPG |
|------|--------------------------|-----------|
| **Warm-up** | Não conta para XP nem Volume Load | Não interfere nos stats |
| **Normal** | XP e VL calculados normalmente | Fórmula padrão |
| **Drop Set** | XP com mult_esforço baseado no peso do drop (relativo ao PR) | +10% XP bônus (intensidade alta) |
| **Failure** | XP máximo da série — RPE implícito = 10 | +25% XP bônus + contabiliza para PR attempt |

**DB change:** Coluna `set_type` na tabela `exercise_sets`:
```sql
set_type VARCHAR(20) DEFAULT 'normal'
-- valores: 'warmup' | 'normal' | 'drop_set' | 'failure'
-- warmup = excluído de volume_load_kg e XP
```

**UI:** Ao segurar/long-press o número da série, popup com os 4 tipos — igual ao Hevy, mas com ícone e cor de cada tipo no universo visual do HunterFit.

---

### HEVY-02 — Supersets com Smart Scroll

**O que o Hevy faz:** Agrupa exercícios em superset; ao completar uma série, rola automaticamente para o próximo do agrupamento.

**HunterFit absorve:**
- Superset agrupável na tela de exercícios do treino
- Smart scroll automático entre os exercícios do par
- Timer de descanso configurável por exercício dentro do superset

**Efeito RPG:** Superset completado sem descanso entre exercícios → micro-evento **No Rest** ativo automaticamente (+50 XP/série).

**DB change:**
```sql
-- Na tabela exercises:
superset_group_id UUID NULLABLE  -- exercises com mesmo UUID formam um superset
superset_order   INT  DEFAULT 0  -- ordem dentro do superset
```

---

### HEVY-03 — Keep Awake During Workout

**O que o Hevy faz:** Tela não apaga durante o treino.

**HunterFit absorve:** `WakeLock API` do browser — ativado automaticamente ao entrar em modo Dungeon, desligado ao concluir ou pausar.

```typescript
// lib/utils/wakeLock.ts
export async function requestWakeLock() {
  if ('wakeLock' in navigator) {
    wakeLockRef = await navigator.wakeLock.request('screen');
  }
}
```

Sem precisar de toggle manual. *"A Dungeon não deixa você dormir."*

---

### HEVY-04 — Plate Calculator

**O que o Hevy faz:** Informa quais anilhas colocar na barra para atingir o peso alvo.

**HunterFit absorve com narrativa:**

```
⚙️  CALCULADORA DE ANILHAS — Sistema de Carga

  Meta: 102.5 kg  |  Barra: 20 kg

  Por lado:
  ■ 1× 25.0 kg
  ■ 1× 15.0 kg
  ■ 1× 2.5 kg

  "Monte o equipamento, Caçador.
   O Sistema calculou a carga ideal."
```

- Acessível pelo botão de carga durante o treino (ícone de anilha ao lado do campo de peso)
- Configurável com as anilhas disponíveis na academia do usuário
- Persiste a configuração do usuário offline (Dexie.js)

**DB change:**
```sql
-- Na tabela users / hunter_profiles:
available_plates_kg JSONB DEFAULT '[20,10,5,2.5,1.25,1,0.5]'
barbell_weight_kg   DECIMAL(4,1) DEFAULT 20
```

---

### HEVY-05 — Warm-up Calculator

**O que o Hevy faz:** Gera séries de aquecimento percentuais do peso de trabalho.

**HunterFit absorve:**

Ao adicionar um exercício composto pesado (bench, squat, terra, desenvolvimento), o app oferece automaticamente séries de aquecimento pré-calculadas:

```
🔥  AQUECIMENTO SUGERIDO — Supino 102.5kg

  Série A (warm-up):  40kg  × 10  (40%)
  Série B (warm-up):  60kg  × 6   (60%)
  Série C (warm-up):  80kg  × 3   (80%)

  [ADICIONAR AQUECIMENTO]   [PULAR]

  "Prepare o corpo. Caçadores que pulam
   aquecimento são os primeiros a se machucar."
```

- Fórmula padrão: 40% × 10, 60% × 6, 80% × 3 — editável pelo usuário
- Séries de warm-up **não contam para XP, Volume Load ou PRs** (igual ao Hevy)
- Ativado apenas para exercícios `compound_heavy` e `compound_medium`

---

### HEVY-06 — RPE Tracking (6–10)

**O que o Hevy faz:** Campo opcional de RPE por série.

**HunterFit absorve e integra ao XP:**

RPE vira um **modificador de XP** quando registrado:

| RPE | Interpretação | Modificador XP |
|-----|--------------|---------------|
| 6 | Muito fácil | 0.8× |
| 7 | Fácil, mais reps disponíveis | 0.9× |
| 8 | Boa intensidade | 1.0× (padrão) |
| 9 | Uma rep restante | 1.15× |
| 10 | Failure | 1.25× (= Failure set) |

- Campo opcional por série — ativável nas configurações
- Se o RPE não for preenchido, o sistema usa o `mult_esforço` baseado no PR histórico
- Quando ambos estão disponíveis (RPE + PR), usa a média ponderada

**DB change:**
```sql
-- Na tabela exercise_sets:
rpe DECIMAL(3,1) NULLABLE  -- 6.0 a 10.0
```

---

### HEVY-07 — 1RM Projetado e Real

**O que o Hevy faz:** Calcula e exibe 1RM estimado via fórmula + 1RM real (carga × 1 rep).

**HunterFit absorve com impacto no sistema RPG:**

**Fórmula (Epley):**
```
1RM_projetado = weight_kg × (1 + reps / 30)
```

- Exibido no card do exercício durante e após a sessão
- Atualizado em tempo real conforme o usuário registra reps
- 1RM real: registrado quando `reps_done = 1` (detectado automaticamente)
- **Novo PR de 1RM** → evento especial: *"NOVO 1RM DETECTADO"* + 3× XP nessa série

**DB change:**
```sql
-- Na tabela exercise_personal_records:
one_rm_projected DECIMAL(6,2)  -- fórmula Epley
one_rm_true      DECIMAL(6,2)  -- rep maxima real (reps_done = 1)
one_rm_updated_at TIMESTAMPTZ
```

---

### HEVY-08 — Strength Level (Beginner / Intermediate / Advanced / Elite)

**O que o Hevy faz:** Compara seu PR de Bench, Squat e Deadlift com a população geral por peso/sexo/idade.

**HunterFit absorve e integra ao Rank Muscular:**

Expande para **todos os exercícios com PRs históricos suficientes**, usando tabelas de referência por peso corporal (fonte: strengthlevel.com normalizado):

```
⚡  NÍVEL DE FORÇA — Supino Reto com Barra

  Seu PR:   102.5 kg
  Peso:     117.75 kg

  ░░░░██████████████████░░░░
  Beginner  Intermediate  Advanced  Elite

  Você está em: ADVANCED (top 22%)

  "O Sistema reconhece sua força.
   Ainda há terreno a conquistar."
```

- Os 4 exercícios compostos principais têm tabelas embutidas
- Outros exercícios: comparação relativa ao histórico do próprio usuário
- **Integração com Rank Muscular:** Atingir "Advanced" num exercício composto contribui para o rank do músculo primário subir mais rápido
- **Integração com Skills Reais:** "Deadlift 1.5x" e "Iron Chest" verificados contra weight/bodyweight

**DB change:**
```sql
-- Na tabela exercise_personal_records:
strength_level VARCHAR(20)  -- 'beginner' | 'intermediate' | 'advanced' | 'elite'
strength_level_pct INT       -- percentil vs população (0-100)
```

---

### HEVY-09 — Feed Social de Hunters (adaptado do Social Feed + Discovery)

**O que o Hevy faz:** Feed de treinos de amigos + Discovery de desconhecidos.

**HunterFit adapta com narrativa RPG:**

O feed social vira o **"Mural de Caçadores"** — treinos de amigos exibidos como dungeons completadas, com rank, XP ganho, PRs e sombras.

```
⚔️  MURAL DE CAÇADORES

  ─────────────────────────────────────────
  [Avatar] João Silva  |  Rank B  |  Lv.52
  Push Day — há 2 horas
  Volume: 11.240kg · XP: +14.500 · PRs: 2
  Igris: Lv.18 ↑  |  "Red Gate Survivor"
  ❤️ 12  💬 3  [COPIAR DUNGEON]
  ─────────────────────────────────────────
  [Avatar] Carlos M.  |  Rank C  |  Lv.33
  Leg Day — há 5 horas
  Volume: 8.900kg · XP: +9.200 · PRs: 1
  ❤️ 7  💬 1  [COPIAR DUNGEON]
  ─────────────────────────────────────────
  [DISCOVER] Ver treinos de outros hunters
```

**Features do social HunterFit:**
- Ver rank, nível, shadow army e título do hunter amigo
- Like e comentário no treino
- **"Copiar Dungeon"** — importa o treino como rota alternativa para hoje
- **Discovery** — ver treinos de hunters desconhecidos com rank similar ao seu
- Compartilhar card de conclusão de dungeon (com XP, PRs, rank muscular)
- Perfil público ou privado

**Novas tabelas:**
```sql
CREATE TABLE hunter_follows (
    follower_id UUID REFERENCES users(id),
    following_id UUID REFERENCES users(id),
    followed_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE workout_likes (
    session_id UUID REFERENCES workout_sessions(id),
    user_id UUID REFERENCES users(id),
    liked_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (session_id, user_id)
);

CREATE TABLE workout_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES workout_sessions(id),
    user_id UUID REFERENCES users(id),
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### HEVY-10 — Leaderboard de Exercícios entre Amigos

**O que o Hevy faz:** Ranking dos melhores lifts em 38 exercícios entre seus amigos.

**HunterFit adapta com estilo RPG:**

Leaderboard vira o **"Ranking de Caçadores"** — comparação por exercício com contexto de rank e nível:

```
🏆  RANKING DE CAÇADORES — Supino Reto

  #1  João Silva      Rank B  |  Lv.52  →  125.0 kg
  #2  Carlos M.       Rank C  |  Lv.33  →  110.0 kg
  #3  [VOCÊ]         Rank C  |  Lv.27  →  102.5 kg  ← sua posição
  #4  Pedro A.        Rank D  |  Lv.18  →  85.0 kg

  Diferença para o líder: 22.5kg
  "O Sistema registra sua posição.
   Você sabe o que precisa fazer."

[VER TODOS OS EXERCÍCIOS]
```

- 38+ exercícios ranqueáveis (todos os compostos principais + isolados populares)
- Quest especial desbloqueável: **"Superar o Líder"** — bater o PR do #1 do leaderboard amigo → +1.000 XP bônus
- Filtrável por: exercício, rank similar, classe similar

**Nova tabela:**
```sql
-- A tabela exercise_personal_records já tem max_weight_kg
-- Leaderboard é uma query ao vivo sem tabela extra:
-- SELECT u.name, hp.hunter_rank, hp.hunter_level, epr.max_weight_kg
-- FROM exercise_personal_records epr
-- JOIN hunter_follows hf ON epr.user_id = hf.following_id
-- WHERE hf.follower_id = :userId AND epr.exercise_name = :exerciseName
-- ORDER BY epr.max_weight_kg DESC
```

---

### HEVY-11 — Comparação Side-by-Side entre Hunters

**O que o Hevy faz:** Dados de 1RM, volume e PR de dois usuários lado a lado.

**HunterFit adapta:**

```
⚔️  CONFRONTO DE HUNTERS

  [João Silva]              [VOCÊ]
  Rank B  |  Lv.52         Rank C  |  Lv.27

  SUPINO (1RM projetado)
  125.0 kg   ████████████  102.5 kg

  VOLUME SEMANAL
  52.400 kg  ████████████  38.200 kg

  DUNGEONS CONCLUÍDAS
  247        ████████████  89

  MÚSCULO MAIS FORTE
  Costas (Master)           Peito (Expert II)

  CLASSE
  Strength Seeker           Balance Warrior

  "Ele está à sua frente.
   O Sistema registra a diferença.
   O que você vai fazer com isso?"
```

Acessível pelo perfil de qualquer hunter que você segue.

---

### HEVY-12 — Muscle Distribution Chart (Diagrama Corporal)

**O que o Hevy faz:** Diagrama corporal com músculos treinados destacados.

**HunterFit já tem o heatmap de fadiga** (Módulo 11 do documento), mas absorve do Hevy o **diagrama semanal de músculos treinados** como uma view diferente:

```
📊  MÚSCULOS DA SEMANA  (Seg–Dom)

  [Diagrama corporal interativo]
  Verde = treinado ✅
  Azul  = treinado + PR 🔵
  Cinza = não treinado esta semana
  Vermelho = fadiga alta (v1.1)

  TREINOS:
  Peito: 18 séries  ✅  Advanced → Expert I ↑
  Costas: 16 séries ✅
  Pernas: 0 séries  ❌ ← skip detectado!
  Ombros: 9 séries  ✅

  ⚠️  Leg Day não foi feito esta semana.
  Emergency Quest: Treine Pernas nos próximos 2 dias.
```

Biblioteca: `body-highlighter` (npm) — já mencionada no Adendo do master spec.

---

### HEVY-13 — Sets per Muscle Group per Week (Gráfico de Volume)

**O que o Hevy faz:** Gráfico de sets por grupo muscular por semana.

**HunterFit adapta:** Integrado ao painel de 17 músculos com contexto de rank:

```
📈  VOLUME SEMANAL POR MÚSCULO

  Peito       ████████████  18 séries  (recomendado: 10–20 ✅)
  Costas      ██████████    16 séries  ✅
  Ombro Lat.  ████          6 séries   (recomendado: 8–16 ⚠️)
  Quadríceps  ░░░░          0 séries   ❌ ZERO — penalidade iminente
  Posterior   ░░░░          0 séries   ❌

  "O Sistema detecta pontos cegos.
   Caçadores desequilibrados não sobrevivem."
```

Recomendações de volume baseadas em literatura científica:
- Compostos grandes (peito, costas, pernas): 10–20 séries/semana
- Compostos médios (ombros, bíceps, tríceps): 8–16 séries/semana
- Isolados (panturrilha, antebraço): 6–12 séries/semana

---

### HEVY-14 — Monthly Report (Relatório Mensal)

**O que o Hevy faz:** Resumo do mês anterior compartilhável.

**HunterFit já tem relatório semanal**. Absorve o mensal como complemento:

```
📅  RELATÓRIO DO SISTEMA — MARÇO 2025
Hunter: [Nome]  |  Rank C → B ⬆️  |  Level 27 → 45

  20 DIAS DE DESAFIO — CONCLUÍDOS ✅

  🏆  TOTAL XP:       284.500 XP
  ⚔️  DUNGEONS:       20/20 ✅
  🔥  PRs BATIDOS:    18 recordes
  🏋️  VOLUME:         312.440 kg totais
  💧  HIDRATAÇÃO:     17/20 dias acima de 4.5L
  🖤  SHADOW ARMY:    Igris Lv.21 | Iron Lv.20

  RANK MUSCULAR — MAIOR EVOLUÇÃO:
  Peito:       Intermediate → Expert II ⬆️ 4 ranks!
  Quadríceps:  Untrained → Novice II    ⬆️ 2 ranks!

  CONQUISTAS DO MÊS:
  ✅ Pull-up Mastery desbloqueada
  ✅ "Aquele que Não Para" — 20 dias consecutivos
  ✅ Rank B atingido

  "20 dias. Você escolheu não ser mais o mesmo."

[COMPARTILHAR CARD]  [BAIXAR PDF]
```

Gerado automaticamente no dia 21 (após o desafio) e no primeiro dia de cada mês seguinte.

---

### HEVY-15 — Shareables (Cards Visuais Compartilháveis)

**O que o Hevy faz:** Cards automáticos de PR, volume, distribuição muscular para Instagram Stories.

**HunterFit adapta com visual Solo Leveling:**

5 tipos de card compartilhável gerados automaticamente:

| Card | Gatilho | Conteúdo |
|------|---------|---------|
| **PR Card** | PR batido | Exercício, peso, rank, XP ganho + bordão do Sistema |
| **Dungeon Cleared** | Sessão finalizada | Volume, PRs, XP total, sombras que subiram |
| **Rank Up** | Promoção de rank ou músculo | Rank anterior → novo + animação estática |
| **Skill Desbloqueada** | Skill real ativa | Arte da skill + stats ganhos |
| **Relatório Semanal** | Segunda-feira | Resumo visual da semana |

Visual: fundo preto com partículas azuis/roxas no estilo do manhwa, fonte bold branca — identidade Solo Leveling.

Implementado no frontend como componente `ShareableCard.tsx` usando `html2canvas` para gerar a imagem.

---

### HEVY-16 — Copiar Treino de Outro Hunter

**O que o Hevy faz:** Copia o treino de outro usuário como template para uma nova sessão.

**HunterFit adapta:**

**"Copiar Dungeon"** — ao ver o treino de um amigo no feed:

```
⚔️  COPIAR DUNGEON

  Push Day — João Silva (Rank B)
  6 exercícios · 58 min · 11.240kg VL

  "Deseja usar esta dungeon como sua sessão de hoje?
   O Sistema adaptará as cargas ao seu histórico."

  [USAR COMO HOJE]   [USAR COMO TEMPLATE]   [CANCELAR]
```

- "Usar como hoje" → sessão imediata com as cargas preenchidas do SEU histórico (não do João)
- "Usar como template" → salva como nova rotina editável
- Crédito automático: *"Dungeon baseada no treino de [usuário]"*

---

### HEVY-17 — Notas por Exercício

**O que o Hevy faz:** Campo de nota livre por exercício — aparece toda vez que o exercício é aberto.

**HunterFit absorve:**

```
💬  NOTA DO SISTEMA — Supino Reto com Barra

  "Coxa apoiada no banco, escápulas retraídas.
   Barra desce até tocar o peito levemente.
   Respira fundo antes da descida."

  [EDITAR NOTA]
```

- Aparece discretamente abaixo do nome do exercício
- Notas globais (da biblioteca) e notas pessoais do usuário
- Útil para lembretes de forma, dicas de setup, histórico de lesões

**DB change:**
```sql
-- Na tabela exercises (plano do usuário):
personal_note TEXT NULLABLE
```

---

### HEVY-18 — Exercícios Customizados com Músculos Primários/Secundários

**O que o Hevy faz:** Criar exercícios novos definindo músculos principais e secundários.

**HunterFit já tem** a tabela `exercises`. Absorve do Hevy a UI de criação com seleção de músculos:

```
➕  NOVO EXERCÍCIO CUSTOMIZADO

  Nome: ___________________________________
  Tipo: Peso×Reps  |  Cardio  |  Isométrico

  Músculos Primários: [Peito] [Ombro Front.]
  Músculos Secundários: [Tríceps]

  Categoria: Composto Médio ▼

  "O Sistema registrará este exercício
   e o adicionará ao seu banco de dados."
```

- Músculos primários/secundários afetam qual grupo muscular recebe XP e rank update
- Categoria (composto pesado/médio/isolado) afeta multiplicador de XP

**DB change:**
```sql
CREATE TABLE custom_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,         -- compound_heavy | compound_medium | bodyweight | isolation
    exercise_type VARCHAR(20) DEFAULT 'weight_reps',  -- weight_reps | cardio | isometric | bodyweight
    primary_muscles VARCHAR(200) NOT NULL,  -- JSON array de muscle_groups
    secondary_muscles VARCHAR(200),
    gif_url TEXT,
    personal_note TEXT,
    is_public BOOLEAN DEFAULT FALSE,        -- compartilhar com comunidade
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### HEVY-19 — Calendário de Treinos

**O que o Hevy faz:** Visualização de consistência num calendário — ver dias treinados.

**HunterFit adapta com visual de dungeon:**

```
📅  CALENDÁRIO DE CAÇADOR — Março 2025

  Seg  Ter  Qua  Qui  Sex  Sab  Dom
  ─────────────────────────────────
   🗡️   🗡️   ⚔️   🗡️   🔴   ─    🗡️
   🗡️   ⚔️   🗡️   🗡️   🗡️   ─    🗡️
   🗡️   🗡️   🔴   🗡️   ⚔️   ─    🗡️

  🗡️ = Dungeon Normal completada
  ⚔️ = PR batido nesta sessão
  🔴 = Red Gate
  ─  = Descanso planejado
  ░  = Falha/Penalidade
```

- Serve como prova visual dos 20 dias do desafio
- Clicável: toca num dia → abre resumo da dungeon daquele dia
- Integrado com o relatório semanal e mensal

---

## 33. Features do Hevy que Não Vamos Absorver

Nem tudo que o Hevy faz é relevante para o HunterFit. Análise honesta do que descartamos e por quê:

| Feature Hevy | Decisão | Motivo |
|-------------|---------|--------|
| **Social media genérico** (like, follow de desconhecidos, discovery sem contexto) | ⚠️ Adaptado | Mantemos social mas com contexto RPG — rank, XP, sombras visíveis. Feed de desconhecidos não é prioridade no MVP |
| **Apple Watch / Wear OS integration** | ❌ Fora do escopo | PWA não acessa Watch APIs nativas. Pós-MVP se o app virar nativo |
| **Planos de treino pré-prontos da biblioteca** | ❌ Desnecessário | Nosso usuário importa seu treino via TXT de nutricionista. Biblioteca de planos seria ruído |
| **Cardio tracking (distância, tempo de corrida)** | ✅ Já temos | Strava faz melhor — integramos via API |
| **Programa de coach para clientes** | ❌ Fora do escopo | Feature B2B que requer arquitetura diferente. Não é nosso público |
| **Heart rate durante treino** | ❌ Requer hardware | Depende de Apple Watch / Wear OS. Fora do escopo PWA |
| **Drag-and-drop de exercícios** | ✅ Útil, mas básico | Parser TXT define a ordem. Reordenação manual é v1.1 |
| **Multiple routines folders** | ❌ Over-engineering | 20 dias de treino = 1 plano ativo. Sem necessidade |

---

## 34. Banco de Dados — Novas Tabelas das Features Hevy

Tabelas e colunas adicionais ao schema original do Master Spec:

```sql
-- HEVY-09: Social
CREATE TABLE hunter_follows (
    follower_id UUID REFERENCES users(id),
    following_id UUID REFERENCES users(id),
    followed_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE workout_likes (
    session_id UUID REFERENCES workout_sessions(id),
    user_id UUID REFERENCES users(id),
    liked_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (session_id, user_id)
);

CREATE TABLE workout_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES workout_sessions(id),
    user_id UUID REFERENCES users(id),
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HEVY-18: Exercícios customizados
CREATE TABLE custom_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    exercise_type VARCHAR(20) DEFAULT 'weight_reps',
    primary_muscles VARCHAR(200) NOT NULL,
    secondary_muscles VARCHAR(200),
    gif_url TEXT,
    personal_note TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Novos campos em exercise_sets (HEVY-01 + HEVY-06 + HEVY-07):
ALTER TABLE exercise_sets ADD COLUMN set_type VARCHAR(20) DEFAULT 'normal';
  -- 'warmup' | 'normal' | 'drop_set' | 'failure'
ALTER TABLE exercise_sets ADD COLUMN rpe DECIMAL(3,1);  -- 6.0–10.0

-- Novos campos em exercise_personal_records (HEVY-07 + HEVY-08):
ALTER TABLE exercise_personal_records ADD COLUMN one_rm_projected DECIMAL(6,2);
ALTER TABLE exercise_personal_records ADD COLUMN one_rm_true DECIMAL(6,2);
ALTER TABLE exercise_personal_records ADD COLUMN one_rm_updated_at TIMESTAMPTZ;
ALTER TABLE exercise_personal_records ADD COLUMN strength_level VARCHAR(20);
ALTER TABLE exercise_personal_records ADD COLUMN strength_level_pct INT;

-- Novos campos em users (HEVY-04):
ALTER TABLE users ADD COLUMN available_plates_kg JSONB DEFAULT '[20,10,5,2.5,1.25,1,0.5]';
ALTER TABLE users ADD COLUMN barbell_weight_kg DECIMAL(4,1) DEFAULT 20;

-- Novo campo em workout_sessions (HEVY-16: copiar dungeon):
ALTER TABLE workout_sessions ADD COLUMN copied_from_session_id UUID REFERENCES workout_sessions(id);
ALTER TABLE workout_sessions ADD COLUMN copied_from_user_id UUID REFERENCES users(id);

-- Novo campo em exercises (HEVY-17: notas pessoais):
ALTER TABLE exercises ADD COLUMN personal_note TEXT;

-- Novos campos em workout_days (superset, HEVY-02):
ALTER TABLE exercises ADD COLUMN superset_group_id UUID;
ALTER TABLE exercises ADD COLUMN superset_order INT DEFAULT 0;
```

---

## 35. Novos Endpoints — Features Hevy

Endpoints adicionais ao contrato de API do Master Spec (Seção 27):

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/sets/:id/type` | Marcar série como warmup/normal/drop/failure |
| GET | `/api/exercises/:id/warmup-sets` | Séries de aquecimento calculadas para um exercício |
| GET | `/api/exercises/:id/one-rm` | 1RM projetado e real do exercício |
| GET | `/api/exercises/:id/strength-level` | Nível vs população (beginner→elite) |
| GET | `/api/hunter/:id/profile-public` | Perfil público de outro hunter |
| POST | `/api/hunter/follow/:id` | Seguir hunter |
| DELETE | `/api/hunter/follow/:id` | Deixar de seguir |
| GET | `/api/feed/friends` | Feed de treinos de amigos (paginado) |
| GET | `/api/feed/discover` | Feed de treinos de hunters desconhecidos |
| POST | `/api/sessions/:id/like` | Curtir dungeon de outro hunter |
| POST | `/api/sessions/:id/comments` | Comentar numa dungeon |
| GET | `/api/leaderboard/:exercise` | Ranking de um exercício entre amigos |
| GET | `/api/hunter/:id/compare` | Dados side-by-side para comparação |
| POST | `/api/sessions/:id/copy` | Copiar dungeon como rota de treino |
| GET | `/api/stats/muscle-distribution` | Músculos treinados + volume por grupo |
| GET | `/api/stats/sets-per-muscle` | Sets por músculo por semana |
| GET | `/api/stats/monthly-report` | Relatório mensal |
| GET | `/api/stats/calendar` | Calendário de dungeons completadas |
| POST | `/api/exercises/custom` | Criar exercício customizado |
| GET | `/api/exercises/custom` | Listar exercícios customizados do usuário |
| GET | `/api/user/plate-config` | Configuração de anilhas disponíveis |
| PUT | `/api/user/plate-config` | Atualizar configuração de anilhas |
| GET | `/api/sessions/:id/shareable` | Gerar card compartilhável de uma dungeon |

---

## 36. Comparativo Final — HunterFit vs Todos

| Feature | GymLevels | Liftoff | Level Up | **Hevy** | **HunterFit ✅** |
|---------|-----------|---------|---------|---------|------------|
| Rank por músculo (17) | ✅ | parcial | ❌ | ❌ | ✅ + narrativa |
| Rank global RPG | ✅ | ✅ | ✅ | ❌ | ✅ E→National |
| XP por esforço real vs histórico | básico | básico | ❌ | ❌ | ✅ completo |
| 6 Classes de Hunter | ✅ | ❌ | ❌ | ❌ | ✅ com bônus reais |
| Tipos de série (warmup/drop/failure) | ❌ | ❌ | ❌ | ✅ | ✅ + efeito no XP |
| Supersets com smart scroll | ❌ | ❌ | ❌ | ✅ | ✅ |
| Plate Calculator | ❌ | ❌ | ❌ | ✅ | ✅ + narrativa |
| Warm-up Calculator | ❌ | ❌ | ❌ | ✅ | ✅ |
| RPE Tracking | ❌ | ❌ | ❌ | ✅ | ✅ + afeta XP |
| 1RM projetado e real | ❌ | ❌ | ❌ | ✅ | ✅ + evento especial |
| Strength Level vs população | ❌ | ❌ | ❌ | ✅ (3 exercícios) | ✅ todos compostos |
| Feed social de amigos | ❌ | ✅ | ❌ | ✅ | ✅ + contexto RPG |
| Leaderboard entre amigos | ❌ | ✅ | ❌ | ✅ (38 exercícios) | ✅ + quest de superação |
| Comparação side-by-side | ❌ | ❌ | ❌ | ✅ | ✅ + visual duelo |
| Copiar treino de amigo | ❌ | ❌ | ❌ | ✅ | ✅ "Copiar Dungeon" |
| Muscle distribution chart | ❌ | ✅ (bodygraph) | ❌ | ✅ | ✅ + rank integrado |
| Sets per muscle/week | ❌ | ❌ | ❌ | ✅ | ✅ + recomendação |
| Calendário de treinos | ❌ | ❌ | ❌ | ✅ | ✅ visual dungeon |
| Shareables (cards visuais) | ✅ semanal | ❌ | ❌ | ✅ múltiplos | ✅ estilo Solo Leveling |
| Relatório mensal | ❌ | ❌ | ❌ | ✅ | ✅ voz do Sistema |
| Keep Awake durante treino | ❌ | ❌ | ❌ | ✅ | ✅ WakeLock API |
| Exercícios customizados | ❌ | ✅ | ❌ | ✅ | ✅ + músculos primários |
| Notas por exercício | ❌ | ❌ | ❌ | ✅ | ✅ |
| Nutrição integrada (macros) | ❌ | parcial | ❌ | ❌ | ✅ completo |
| IA Vision (bioimpedância) | ❌ | ❌ | ❌ | ❌ | ✅ Gemini |
| WaterTracker | ❌ | ❌ | ❌ | ❌ | ✅ |
| Offline-First | ❌ | ❌ | ❌ | básico | ✅ Dexie.js |
| Strava integration | ❌ | ❌ | ❌ | ❌ | ✅ |
| Shadow Army (streaks narrativas) | ❌ | básico | ❌ | streak simples | ✅ |
| Penalidade + Quest de Resgate | ❌ | ❌ | básico | ❌ | ✅ |
| Emergency Quests por dados reais | ❌ | ❌ | ❌ | ❌ | ✅ |
| Skills Reais verificáveis | ❌ | ❌ | ❌ | ❌ | ✅ 10 skills |
| Dungeons temáticas (Red Gate, etc.) | ❌ | ❌ | básico | ❌ | ✅ |
| Export CSV/ZIP | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Free tier funcional** | ❌ paywall total | parcial | parcial | ✅ | ✅ |

---

*HunterFit — Especificação Master v4.0*  
*"O Sistema não aceita mediocridade voluntária."*  
*"Arise. Level Up. IRL."*

---

# PARTE V — APP PERMANENTE + IA COACH

---

## 37. App Permanente — Mudança de Paradigma

### Antes: 20 Dias

O conceito original era um app de desafio temporário com prazo fixo. Isso limita:
- Retenção de usuários (o app "termina")
- Público (só quem quer um desafio intenso)
- Monetização (uso temporário = receita temporária)
- Progressão do RPG (nível máximo acessível em 20 dias é muito baixo)

### Agora: Para Sempre

O HunterFit é um **companheiro permanente de fitness**, como o Hevy e o Strava — mas com RPG completo e IA integrada.

### O Conceito de Sagas (substituindo "20 dias fixos")

O espírito dos 20 dias é preservado como **Sagas** — arcos de objetivos com prazo e recompensas especiais:

```
╔══════════════════════════════════════════════════════╗
║  🗡️  SAGA DISPONÍVEL                               ║
║  "Operação: Corte de Verão"                          ║
║  20 dias · Meta: -3% gordura · sem perda muscular    ║
╠══════════════════════════════════════════════════════╣
║  RECOMPENSAS AO COMPLETAR:                           ║
║  • +15.000 XP bônus                                  ║
║  • Título exclusivo "Sobrevivente do Verão"          ║
║  • Rank boost em 2 músculos                          ║
║  • Badge compartilhável                              ║
╠══════════════════════════════════════════════════════╣
║  Não é obrigatório. O app funciona sem Saga.         ║
║  [INICIAR SAGA]   [VER OUTRAS SAGAS]   [DEPOIS]      ║
╚══════════════════════════════════════════════════════╝
```

**Tipos de Saga disponíveis:**

| Saga | Duração | Objetivo | Para quem |
|------|---------|---------|-----------|
| **Operação: Corte** | 20 dias | Perda de gordura sem perda muscular | Intermediário/Avançado |
| **Operação: Massa** | 30 dias | Ganho de massa + força nos compostos | Intermediário/Avançado |
| **Despertar do Iniciante** | 14 dias | Criar hábito + primeiros PRs | Iniciante |
| **Maratona de Força** | 42 dias | 1RM crescente nos 3 compostos principais | Avançado |
| **Guerreiro Cardio** | 21 dias | Consistência aeróbica + AGI stat | Qualquer nível |
| **Rehab Warrior** | 14 dias | Retorno seguro após pausa longa | Quem voltou |
| **Saga Livre** | Personalizado | Metas definidas pela IA Coach | Qualquer nível |

Ao terminar uma Saga, a próxima pode ser iniciada imediatamente — ou o usuário continua treinando sem Saga ativa, acumulando XP, rank e stats normalmente.

### Progressão Permanente — Sem Teto Artificial

Com o app permanente, o sistema de progressão precisa escalar indefinidamente:

| Aspecto | 20 dias (antes) | Permanente (agora) |
|---------|----------------|-------------------|
| Nível máximo acessível | ~Level 30 | Sem limite (curva assintótica) |
| Rank máximo | Difícil de chegar em S | National Level acessível em 1–2 anos |
| Ranks musculares | Poucos chegariam a Master | Legend é conquista de longo prazo real |
| Skills Reais | Poucas desbloqueadas em 20 dias | Portfolio completo ao longo de meses |
| Shadow Army | Nível 10–15 máximo | Lv 50 é conquista de 6+ meses |

---

## 38. Públicos-Alvo — Todos os Perfis

O HunterFit serve qualquer pessoa que se exercita. A IA Coach faz o trabalho de personalização.

### Persona 1 — Iniciante Absoluto

```
Nome: Lucas, 22 anos
Nunca foi à academia de forma consistente
Quer "ficar em forma" mas não sabe por onde começar
Joga jogos RPG no PC — se identifica com a progressão de personagem
```

**Experiência no HunterFit:**
- Onboarding completo pela IA Coach (Seção 39)
- Rank inicial: E3 — "O Mais Fraco" (título temporário, soma motivação)
- A IA sugere um plano de treino Full Body 3x/semana para iniciante
- Daily Quests adaptadas: cardio pode ser 20min (não 45min); macros mais flexíveis
- Penalidade nunca ativa nos primeiros 14 dias — fase de adaptação
- Cada PR é celebrado com animação exagerada — *"PRIMEIRO RECORDE DETECTADO"*
- Push notifications em tom mais encorajador, menos sério

### Persona 2 — Intermediário Buscando Resultados

```
Nome: Amanda, 28 anos
Academia há 1 ano, mas sem progressão clara
Quer ganhar massa muscular e saber se está fazendo certo
Nunca usou app sério de tracking
```

**Experiência no HunterFit:**
- IA detecta nível intermediário pelo onboarding
- Rank inicial calibrado pelos PRs informados
- Plano PPL sugerido com volumes específicos
- Rank muscular mostra imediatamente: *"seus glúteos estão em Novice I — o Sistema vê o desequilíbrio"*
- Módulo de nutrição opcional mas sugerido
- Sem cobrança de bioimpedância — opcional

### Persona 3 — Avançado Querendo Otimização

```
Nome: Rafael, 34 anos
5 anos de academia, usa Hevy, conhece RPE
Quer um app mais motivante que também tenha RPG
```

**Experiência no HunterFit:**
- Onboarding rápido — IA detecta nível avançado
- Opção de importar histórico (CSV do Hevy aceito)
- RPE tracking ativo por padrão
- Red Gates semanais são desafio real
- Leaderboard entre amigos ativo imediatamente
- Plate Calculator já configurado
- Rank inicial honesto: Advanced em compostos principais

### Persona 4 — Foco em Emagrecimento

```
Nome: Carla, 35 anos
Academia para perder peso, não gosta de termos técnicos
Quer algo motivador que não seja intimidador
```

**Experiência no HunterFit:**
- Onboarding focado em objetivo: "perder gordura"
- IA Coach configura metas calóricas e de cardio
- Sistema RPG em modo "suave" — sem jargão de hunter/dungeon em excesso
- Dashboard simplificado: peso, calorias, cardio, streak de dias ativos
- Penalidade = "recomeçar" (sem nome dramático)
- Notificações encorajadoras, não pressão

> **Nota de implementação:** O tom narrativo do Sistema pode ser configurado em 3 modos:
> - **Solo Leveling** (padrão): frio, narrativo, sério
> - **Motivacional**: encorajador, positivo, celebrativo
> - **Minimalista**: sem narrativa, apenas dados

---

## 39. IA Coach — Onboarding Inteligente

### Conceito

O onboarding não é um formulário — é uma **conversa com a IA Coach**. O Sistema faz perguntas inteligentes, interpreta as respostas em linguagem natural e monta o perfil completo do usuário automaticamente.

### Fluxo do Onboarding

```
┌─────────────────────────────────────────────────────┐
│  ⚡  O SISTEMA DETECTOU UM NOVO CAÇADOR            │
│                                                     │
│  Antes de atribuir sua Classe, o Sistema            │
│  precisa conhecer você.                             │
│                                                     │
│  Isso leva cerca de 3 minutos.                      │
│  Suas respostas moldam tudo — plano, metas,         │
│  dificuldade, notificações.                         │
│                                                     │
│  [COMEÇAR ANÁLISE]                                  │
└─────────────────────────────────────────────────────┘
```

### As 12 Perguntas do Onboarding

O onboarding é conversacional — a IA adapta a próxima pergunta com base na resposta anterior. A sequência abaixo é o fluxo padrão.

---

**PERGUNTA 1 — Objetivo Principal**

```
🎯  QUAL É O SEU OBJETIVO PRINCIPAL?

Pode ser mais de um. Escolha os que mais fazem sentido.

  A) Perder gordura / emagrecer
  B) Ganhar massa muscular / hipertrofia
  C) Ganhar força (levantar mais peso)
  D) Melhorar resistência / cardio
  E) Manter o que tenho (health maintenance)
  F) Recomposição corporal (perder gordura e ganhar músculo ao mesmo tempo)
  G) Voltar a treinar após pausa

"O Sistema registra seus objetivos.
 Eles definem suas Quests, seu plano e suas metas."
```

*Branch: se A ou F → módulo de nutrição e bioimpedância sugeridos ativamente. Se G → modo Rehab Warrior.*

---

**PERGUNTA 2 — Experiência de Treino**

```
⚔️  QUAL É SUA EXPERIÊNCIA COM TREINO DE FORÇA?

  A) Nunca treinei consistentemente (menos de 3 meses total)
  B) Iniciante (3–12 meses)
  C) Intermediário (1–3 anos)
  D) Avançado (3+ anos)
  E) Atleta / Competidor

"Sua resposta calibra seu Rank inicial
 e o nível de dificuldade do Sistema."
```

*Branch: A → Full Body 3x/semana. B → Full Body ou Upper/Lower. C/D → PPL ou Upper/Lower. E → plano customizado.*

---

**PERGUNTA 3 — Frequência Disponível**

```
📅  QUANTOS DIAS POR SEMANA VOCÊ CONSEGUE TREINAR?

  A) 2 dias
  B) 3 dias
  C) 4 dias
  D) 5 dias
  E) 6 dias
  F) Varia muito — prefiro flexibilidade

"O Sistema adaptará seu plano à sua realidade,
 não a um ideal impossível."
```

---

**PERGUNTA 4 — Equipamento Disponível**

```
🏋️  ONDE VOCÊ TREINA E COM O QUE?

  A) Academia completa (barras, máquinas, halteres)
  B) Academia básica (halteres e algumas máquinas)
  C) Em casa com equipamentos (halteres, barra)
  D) Em casa sem equipamentos (peso corporal)
  E) Ao ar livre / calisthenics
  F) Varia (academia às vezes, casa às vezes)
```

---

**PERGUNTA 5 — Medidas Físicas** *(opcional mas recomendado)*

```
📏  PARA CALIBRAR SUAS METAS, O SISTEMA PRECISA
    DE ALGUMAS INFORMAÇÕES BÁSICAS.

    Altura: _______ cm
    Peso atual: _______ kg
    Sexo biológico: Masculino / Feminino / Prefiro não dizer

    (Opcionais — mas melhoram muito a precisão)
    % Gordura estimada: _______ %
    Massa muscular: _______ kg

    Você tem acesso a balança de bioimpedância?
    [ ] Sim   [ ] Não   [ ] Às vezes

"Esses dados permitem ao Sistema calcular
 suas metas nutricionais com precisão científica."
```

---

**PERGUNTA 6 — Nutrição** *(condicional — aparece se objetivo for A, B ou F)*

```
🥩  VOCÊ ACOMPANHA SUA ALIMENTAÇÃO?

  A) Sim, conheço meus macros e calorias
  B) Sim, mas de forma informal / "comer limpo"
  C) Não acompanho, mas gostaria de começar
  D) Não me importo com nutrição agora

"O Sistema pode calcular suas metas nutricionais
 automaticamente com base no seu objetivo e corpo."
```

*Branch: A ou B → módulo nutricional completo ativo. C → IA calcula e explica de forma simples. D → módulo nutricional opcional, não cobrado nas Daily Quests.*

---

**PERGUNTA 7 — Cardio**

```
🏃  VOCÊ FAZ CARDIO? COM QUE FREQUÊNCIA?

  A) Cardio é minha atividade principal
  B) Faço cardio como complemento ao treino (3–5x/semana)
  C) Faço cardio eventualmente (1–2x/semana)
  D) Não faço cardio

  Você usa aplicativo de cardio? (Strava, Nike Run, etc.)
  [ ] Sim — Strava   [ ] Sim — outro   [ ] Não
```

---

**PERGUNTA 8 — Lesões ou Limitações**

```
🩺  VOCÊ TEM ALGUMA LESÃO OU LIMITAÇÃO FÍSICA?

  A) Não tenho nenhuma
  B) Problemas no joelho / quadril
  C) Problemas no ombro / rotator cuff
  D) Problemas nas costas (lombar / hérnia)
  E) Outra lesão — descreva brevemente: ___________
  F) Recuperando de cirurgia

"O Sistema evitará movimentos de risco para você
 e adaptará os exercícios alternativos."
```

---

**PERGUNTA 9 — Comprometimento com o Horário**

```
⏰  QUANDO VOCÊ PREFERE TREINAR?

  A) De manhã (antes do trabalho/escola)
  B) Na hora do almoço
  C) À tarde / depois do trabalho
  D) À noite
  E) Varia — sem horário fixo

  Duração típica do seu treino:
  A) Menos de 45 minutos
  B) 45–60 minutos
  C) 60–90 minutos
  D) Mais de 90 minutos

"O Sistema ajusta os lembretes ao seu ritmo."
```

---

**PERGUNTA 10 — Motivação (para tom das notificações)**

```
💬  COMO VOCÊ PREFERE SER MOTIVADO?

  A) Me pressione — quero ser cobrado, sem desculpas
  B) Me encoraje — prefiro positividade e celebrações
  C) Me informe — só dados, sem narrativa
  D) Equilibrado — pressão quando necessário, incentivo no resto

"Isso define o tom de todas as mensagens
 do Sistema para você."
```

---

**PERGUNTA 11 — Sono e Estresse** *(para calibrar Volume e Recovery Quests)*

```
😴  COMO ESTÁ SEU SONO E NÍVEL DE ESTRESSE GERAL?

  Sono médio por noite:
  A) Menos de 6h   B) 6–7h   C) 7–8h   D) Mais de 8h

  Estresse geral:
  A) Baixo   B) Moderado   C) Alto   D) Muito alto

"Treino pesado com pouco sono e alto estresse
 aumenta risco de overtraining.
 O Sistema leva isso em conta."
```

---

**PERGUNTA 12 — Comprometimento Financeiro** *(define sugestão de plano premium)*

```
💎  UMA ÚLTIMA COISA.

  O HunterFit é gratuito com todas as features principais.
  O plano Hunter Pro desbloqueia:
  • IA Coach ilimitada (análises profundas, sem limite de perguntas)
  • Relatórios avançados (90 dias, 1 ano, all-time)
  • Sagas customizadas
  • Themes exclusivos do perfil

  Por enquanto, como quer começar?
  A) Versão gratuita — testar primeiro
  B) Hunter Pro — quero o máximo desde o início
  C) Me lembre depois de algumas semanas usando o app

"O Sistema não força nada.
 Sua jornada começa agora de qualquer forma."
```

---

### Processamento do Onboarding pela IA

Após as 12 perguntas, o backend chama a IA (Gemini 1.5 Flash) com todas as respostas e gera automaticamente:

```json
// POST /api/ai-coach/process-onboarding
// Request body: { answers: { q1: "B,F", q2: "C", ... } }

// IA retorna:
{
  "hunter_class": "Mass Builder",
  "initial_rank": "E1",
  "recommended_split": "PPL",
  "training_days_per_week": 5,
  "daily_quest_config": {
    "workout_required": true,
    "nutrition_required": true,
    "water_required": true,
    "cardio_required": false,
    "water_goal_ml": 3000,
    "cardio_goal_min": 0
  },
  "macro_targets": {
    "kcal": 2650,
    "protein_g": 180,
    "carbs_g": 250,
    "fat_g": 70,
    "method": "mifflin_stjeor + activity_multiplier"
  },
  "notification_tone": "balanced",
  "onboarding_summary": "Hunter intermediário focado em hipertrofia. 5 dias disponíveis. Academia completa. Lesão no joelho — evitar agachamentos profundos. Sono moderado. Módulo nutricional ativo.",
  "suggested_saga": "Operação: Massa",
  "exercises_to_avoid": ["Deep Squat", "Bulgarian Split Squat"],
  "alternative_suggestions": {
    "Agachamento Livre": ["Leg Press 45°", "Hack Squat"],
    "Agachamento Búlgaro": ["Cadeira Extensora", "Leg Press"]
  },
  "first_goals": [
    "Completar 7 Daily Quests consecutivas",
    "Bater PR no Supino dentro de 2 semanas",
    "Atingir Rank D em 30 dias"
  ]
}
```

### Tela de Resultado do Onboarding

```
╔══════════════════════════════════════════════════════╗
║  ⚡  ANÁLISE COMPLETA                              ║
║                                                      ║
║  O Sistema processou seu perfil.                     ║
║                                                      ║
║  CLASSE ATRIBUÍDA:  Mass Builder                     ║
║  RANK INICIAL:      E1                               ║
║  PLANO SUGERIDO:    PPL — 5 dias/semana              ║
║                                                      ║
║  METAS CALCULADAS:                                   ║
║  • 2.650 kcal/dia · 180g proteína                    ║
║  • Água: 3.000ml/dia                                 ║
║  • Cardio: opcional (não cobrado)                    ║
║                                                      ║
║  ATENÇÃO DO SISTEMA:                                 ║
║  Joelho delicado detectado. Exercícios              ║
║  alternativos para Agachamento ativados.             ║
║                                                      ║
║  PRIMEIRA MISSÃO:                                    ║
║  Complete 7 Daily Quests consecutivas               ║
║  para ganhar o título "Aquele que Despertou".        ║
╠══════════════════════════════════════════════════════╣
║  [INICIAR JORNADA]   [AJUSTAR ALGO]                  ║
╚══════════════════════════════════════════════════════╝
```

---

## 40. IA Coach — Análise Contínua de Resultados

A IA Coach não para no onboarding. Ela analisa dados continuamente e gera insights proativos.

### Fontes de Dados Analisados

| Fonte | O que a IA analisa |
|-------|-------------------|
| `exercise_sets` | Progressão de carga semana a semana por exercício |
| `body_measurements` | Tendência de peso, gordura e massa muscular |
| `daily_nutrition_logs` | Adesão às metas de macro e calorias |
| `workout_sessions` | Volume Load, consistência, duração |
| `muscle_ranks` | Desequilíbrios musculares, músculos negligenciados |
| `exercise_personal_records` | Platôs de PR (sem bater por X semanas) |
| `streaks` | Quebras recorrentes de streak |
| `xp_events` | Padrões de motivação — em que módulos o usuário é mais consistente |
| `hunter_quests` | Taxa de falha por tipo de quest |
| `water_intake_events` | Padrão horário de hidratação |

### Análises Geradas Automaticamente

**1. Análise Semanal Profunda** *(toda segunda-feira)*

```
📊  ANÁLISE DO SISTEMA — SEMANA 8

  "Caçador, o Sistema analisou seus últimos 7 dias.

  PROGRESSO DE FORÇA:
  Supino: +2.5kg vs semana 7 ✅ (progredindo bem)
  Terra: sem mudança por 3 semanas ⚠️
  Agachamento: -5kg vs semana 6 ❌ (regressão detectada)

  O Sistema identifica: o agachamento caiu quando
  você reduziu o descanso para 60s.
  Compostos pesados precisam de 2–3 minutos de descanso.

  SUGESTÃO: Aumente o descanso no agachamento para 120s
  e mantenha a carga da semana passada na próxima sessão.

  NUTRIÇÃO:
  Proteína média: 156g/dia (meta: 180g) ⚠️
  Você está 24g abaixo. Isso limita sua recuperação.

  SUGESTÃO: Adicione uma refeição proteica pós-treino
  (frango, atum ou shake) — isso fecha o gap.

  HIDRATAÇÃO: 4/7 dias acima da meta ✅ (melhorando)

  RANK MUSCULAR:
  Costas em Intermediate II — próximo de Advanced I.
  Aumente o volume de remada em 2 séries na próxima semana."
```

**2. Alerta de Platô** *(quando PR não é batido por 3+ semanas)*

```
⚠️  PLATÔ DETECTADO — Supino Reto

  "Você não bate seu PR de 100kg há 21 dias.

  Possíveis causas identificadas:
  • Volume semanal de peito: 9 séries (recomendado: 12–16)
  • Proteína média neste período: 158g (abaixo da meta)
  • Última semana com 5h de sono 3 dias consecutivos

  O Sistema sugere:
  1. Adicione 2 séries de supino na próxima sessão Push
  2. Aumente proteína em 20g/dia por 2 semanas
  3. Tente o PR na segunda sessão Push (mais descansado)

  Emergency Quest gerada: Superar o Platô do Supino."
```

**3. Detecção de Overtraining** *(análise de sinais)*

```
🔴  ALERTA: SINAIS DE SOBRECARGA DETECTADOS

  "O Sistema analisou os últimos 14 dias:
  • Volume Load caiu 18% vs 2 semanas atrás
  • Duração média de treino subiu de 65min para 89min
  • PRs batidos: 0 (nenhum nas últimas 2 semanas)
  • Sono informado: 5.5h média

  Padrão consistente com overtraining ou fadiga acumulada.

  O Sistema recomenda:
  1. Semana de deload — reduza 40% do volume
  2. Priorize 7–8h de sono esta semana
  3. Mantenha proteína e hidratação altas

  Deload Quest gerada: 5 dias de treino leve sem novas PRs."
```

**4. Relatório de Progresso Mensal** *(todo dia 1)*

```
📅  RELATÓRIO DO SISTEMA — MÊS 3

  EVOLUÇÃO MUSCULAR:
  3 meses de dados. O Sistema traça sua trajetória.

  Peito:    Beginner I → Expert I     ⬆️ +5 ranks
  Costas:   Untrained → Advanced I   ⬆️ +6 ranks
  Pernas:   Beginner I → Beginner II ⬆️ +1 rank (pouco!)

  "Pernas ficaram para trás. O Sistema ajustará suas
  quests para priorizar o treino de perna nas próximas semanas."

  EVOLUÇÃO FÍSICA (bioimpedância):
  Peso: 85kg → 82kg (-3kg)
  Gordura: 25% → 22% (-3%)
  Músculo: 63kg → 65kg (+2kg)

  "Recomposição corporal confirmada.
   O Sistema registra: você está no caminho certo."

  FORÇA:
  Supino 1RM: 80kg → 97.5kg (+17.5kg em 3 meses)
  Terra 1RM: 120kg → 145kg (+25kg)
  Agachamento: 100kg → 115kg (+15kg)

  PRÓXIMO MÊS — FOCO SUGERIDO:
  "Priorizar perna (meta: Intermediate I em Quadríceps)
   Manter proteína acima de 180g/dia
   Tentar Deadlift 1.5x bodyweight pela primeira vez"
```

---

## 41. IA Coach — Sistema de Perguntas e Adaptação

A IA Coach pode ser consultada a qualquer momento via chat — ela tem contexto completo do usuário.

### Chat com a IA Coach

```
Chat disponível na tela inicial → botão "Falar com o Sistema"

[USUÁRIO]: "Meu supino não está evoluindo, o que eu faço?"

[IA COACH]: "O Sistema analisou seu histórico de supino.

  Nos últimos 30 dias:
  • Você tentou 102.5kg em 4 sessões, sem conseguir 8 reps
  • Seu peito tem 13 séries/semana (você pode aguentar 16)
  • Tríceps: apenas 7 séries/semana (fraqueza identificada)

  O tríceps é o limitante em cargas >100kg no supino.
  O Sistema recomenda:
  1. Adicione 2 séries de extensão ou dip na sessão Push
  2. Tente 100kg × 10 antes de tentar 102.5 × 8
  3. Aguarde 72h entre sessões de peito

  Quest gerada: Reforço de Tríceps (7 dias)."

[USUÁRIO]: "Quanto eu preciso comer para ganhar massa?"

[IA COACH]: "Com base no seu perfil:
  Peso: 75kg · Atividade: alta (5x treino/semana)

  TDEE estimado: ~2.900 kcal/dia
  Para ganho de massa: 2.900 + 250–350 kcal = 3.150–3.250 kcal

  Distribuição sugerida:
  • Proteína: 165–180g (2.2g/kg)
  • Carboidratos: 350–380g (energia para treinos pesados)
  • Gordura: 80–90g

  Quer que o Sistema atualize suas metas nutricionais?"

[USUÁRIO]: "Sim"

[IA COACH]: "Metas atualizadas.
  Sua Daily Quest de nutrição agora reflete 3.200 kcal
  e 175g de proteína como alvo.
  O Sistema monitora e avisa se você estiver longe."
```

### Perguntas Periódicas Automáticas da IA

A IA não espera o usuário perguntar — ela faz check-ins regulares:

**Check-in semanal (toda sexta):**

```
"⚡  CHECK-IN SEMANAL

  O Sistema tem 3 perguntas rápidas.
  Suas respostas melhoram a precisão das análises.

  1. Como foi a qualidade do seu sono esta semana?
     😴 Péssimo   😐 Regular   😊 Bom   🌟 Ótimo

  2. Você sentiu dor ou desconforto em algum exercício?
     Não   Sim — [onde?]: ___________

  3. Seu nível de motivação geral esta semana foi:
     📉 Baixo   📊 Normal   📈 Alto

  [RESPONDER]"
```

**Check-in após 30 dias de uso:**

```
"🎯  1 MÊS DE HUNTERFIT

  O Sistema avalia suas metas iniciais.

  Você disse que queria: Ganhar massa muscular
  Em 30 dias, você:
  • Completou 22/24 dias de treino ✅
  • Ganhou 1.2kg de massa muscular ✅
  • Perdeu 0.8% de gordura ✅

  Seus objetivos mudaram ou continuam os mesmos?
  A) Continua: ganhar massa
  B) Mudei: agora quero [...]
  C) Quero adicionar outro objetivo

  'O Sistema recalibra. Sua jornada evolui.'"
```

**Check-in de retorno após inatividade:**

```
"👁️  O SISTEMA VÊ QUE VOCÊ VOLTOU.

  Você ficou 12 dias sem registrar treino.

  Isso acontece. O Sistema não julga.
  Mas precisa entender para ajudar.

  O que aconteceu?
  A) Tive uma lesão ou dor
  B) Viagem / compromisso imprevisto
  C) Perdi a motivação
  D) Doença / saúde
  E) Prefiro não dizer

  Com base na sua resposta, o Sistema ajusta
  suas metas e plano de retorno."
```

### Adaptações Automáticas da IA

Sem precisar de interação — a IA ajusta silenciosamente:

| Gatilho | Adaptação Automática |
|---------|---------------------|
| 3 semanas sem PR em exercício composto | Sugere deload ou variação de exercício |
| Lesão reportada no check-in | Remove exercícios contraindicados; ativa alternativas |
| Meta de peso não progredindo | Ajusta calorias + 150kcal ou -150kcal conforme objetivo |
| Consistência cai abaixo de 50% por 2 semanas | Reduz dias de treino sugeridos; simplifica Daily Quest |
| Proteína sistematicamente abaixo da meta | Notificação com sugestão de alimentos + meta revisada |
| Sono < 6h por 3+ dias consecutivos | Reduce volume de treino naquela semana automaticamente |
| Usuário sempre falha o módulo de cardio | Remove cardio da Daily Quest e cria Quest separada opcional |
| VL crescendo 3 semanas seguidas | Sugere Saga de hipertrofia com metas mais ambiciosas |

---

## 42. Planos e Metas Dinâmicos

### Como o App Lida com Metas Sem Prazo Fixo

Sem o conceito de "20 dias", as metas são **contínuas e em camadas**:

**Camada 1: Metas Semanais** (geradas automaticamente toda segunda-feira pela IA)

```
📋  METAS DA SEMANA — Semana 34

  O Sistema definiu 3 metas para esta semana:

  1. Treinar peito e costas 2x cada (desequilíbrio detectado)
  2. Atingir 175g proteína em 5 dos 7 dias
  3. Bater PR no Levantamento Terra (última tentativa: há 18 dias)

  [ACEITAR]   [AJUSTAR]
```

**Camada 2: Sagas** (arcos de 14–42 dias opcionais)

O sistema de Saga foi detalhado na Seção 37. Sagas são opcionais e coexistem com o uso diário.

**Camada 3: Metas de Longo Prazo** (definidas no onboarding + revisadas mensalmente)

```
🏆  METAS DE LONGO PRAZO DO HUNTER

  [Definidas no onboarding — editáveis a qualquer momento]

  • Deadlift 1.5× peso corporal (progresso: 92%)
  • Rank A no ranking global (progresso: 31%)
  • Todos os 17 músculos acima de Intermediate II (progresso: 58%)
  • 100 dungeons completadas (progresso: 67/100)
  • Pull-up Mastery — 10 repetições seguidas (progresso: 7/10)

  [EDITAR METAS]   [ADICIONAR META]
```

**Camada 4: Marcos Históricos** (conquistas permanentes)

```
📜  MARCOS DA JORNADA

  Dia 1:    Primeira dungeon completada
  Dia 8:    Primeira skill real — Hydration God
  Dia 30:   Rank D atingido
  Dia 45:   PR: Supino 100kg — Strength Level ADVANCED
  Dia 67:   Rank C atingido — primeira Rank Up animada
  Dia 103:  Shadow Army: Igris Lv.20
  ...
```

### Calibração de Dificuldade Dinâmica

A IA ajusta a dificuldade das Daily Quests com base no comportamento:

| Situação | Ajuste |
|----------|--------|
| Taxa de sucesso das quests < 40% por 2 semanas | Reduz 1 módulo da Daily Quest ou reduz metas |
| Taxa de sucesso das quests > 90% por 3 semanas | Sugere aumentar metas (*"O Sistema detecta que você está além das suas metas"*) |
| Módulo específico sempre falhado (ex: cardio) | Torna módulo opcional; cria quest separada |
| Usuário ativo nos fins de semana mas não dias úteis | Daily Quest gerada com foco maior em fins de semana |

---

## 43. Banco de Dados — App Permanente + IA Coach

### Tabelas Novas

```sql
-- PERFIL EXPANDIDO: substituir perfil fixo de 20 dias
-- (alterações na tabela users já existente)
ALTER TABLE users ADD COLUMN birthdate DATE;
ALTER TABLE users ADD COLUMN sex CHAR(1);         -- M / F / X
ALTER TABLE users ADD COLUMN fitness_goal VARCHAR(50);
  -- 'fat_loss' | 'muscle_gain' | 'strength' | 'maintenance' | 'recomposition' | 'return'
ALTER TABLE users ADD COLUMN experience_level VARCHAR(20);
  -- 'beginner' | 'intermediate' | 'advanced' | 'athlete'
ALTER TABLE users ADD COLUMN preferred_days_per_week INT DEFAULT 4;
ALTER TABLE users ADD COLUMN training_location VARCHAR(30);
  -- 'full_gym' | 'basic_gym' | 'home_equipment' | 'home_bodyweight' | 'outdoor'
ALTER TABLE users ADD COLUMN notification_tone VARCHAR(20) DEFAULT 'balanced';
  -- 'solo_leveling' | 'motivational' | 'minimal' | 'balanced'
ALTER TABLE users ADD COLUMN injuries TEXT[];      -- músculos/exercícios a evitar
ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN onboarding_completed_at TIMESTAMPTZ;

-- SAGAS (substitui o conceito fixo de 20 dias)
CREATE TABLE sagas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    saga_type VARCHAR(50) NOT NULL,
      -- 'cut', 'bulk', 'beginner_awakening', 'strength_marathon',
      -- 'cardio_warrior', 'rehab_warrior', 'custom'
    saga_name VARCHAR(200) NOT NULL,
    description TEXT,
    duration_days INT NOT NULL,
    started_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'pending',
      -- 'pending' | 'active' | 'completed' | 'abandoned'
    goals_json JSONB NOT NULL,          -- metas específicas desta Saga
    rewards_json JSONB NOT NULL,        -- XP, título, badge ao completar
    completed_at TIMESTAMPTZ,
    progress_pct DECIMAL(5,2) DEFAULT 0
);

-- METAS DINÂMICAS DO USUÁRIO
CREATE TABLE user_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    goal_type VARCHAR(50) NOT NULL,
      -- 'deadlift_1_5x' | 'pullup_mastery' | 'muscle_rank_target'
      --  | 'global_rank' | 'dungeons_count' | 'custom'
    goal_description VARCHAR(500) NOT NULL,
    target_value DECIMAL(10,2),
    current_value DECIMAL(10,2) DEFAULT 0,
    unit VARCHAR(30),
    progress_pct DECIMAL(5,2) GENERATED ALWAYS AS
        (LEAST(100, (current_value / NULLIF(target_value, 0)) * 100)) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    achieved_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
);

-- METAS SEMANAIS (geradas automaticamente pela IA)
CREATE TABLE weekly_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    week_start DATE NOT NULL,
    goals_json JSONB NOT NULL,          -- array de metas geradas pela IA
    generated_by_ai BOOLEAN DEFAULT TRUE,
    accepted_by_user BOOLEAN DEFAULT FALSE,
    completion_pct DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONVERSAS COM A IA COACH
CREATE TABLE ai_coach_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    role VARCHAR(10) NOT NULL,          -- 'user' | 'assistant'
    message TEXT NOT NULL,
    context_snapshot JSONB,             -- snapshot dos dados do usuário no momento
    tokens_used INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CHECK-INS PERIÓDICOS
CREATE TABLE ai_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    checkin_type VARCHAR(30) NOT NULL,
      -- 'weekly' | '30_days' | 'return_after_absence' | 'manual'
    questions_json JSONB NOT NULL,      -- perguntas feitas
    answers_json JSONB,                 -- respostas do usuário
    ai_analysis TEXT,                   -- análise gerada
    adaptations_made JSONB,             -- quais adaptações foram feitas
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ANÁLISES AUTOMÁTICAS DA IA
CREATE TABLE ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    insight_type VARCHAR(50) NOT NULL,
      -- 'plateau' | 'overtraining' | 'imbalance' | 'nutrition_gap'
      -- | 'progress' | 'weekly_analysis' | 'monthly_report'
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'info',  -- 'info' | 'warning' | 'critical' | 'positive'
    data_snapshot JSONB,                  -- dados que embasaram o insight
    actions_json JSONB,                   -- ações sugeridas
    dismissed_at TIMESTAMPTZ,
    acted_upon BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONFIGURAÇÃO DE DIETA (substituindo metas fixas)
ALTER TABLE diet_plans ADD COLUMN calculated_by_ai BOOLEAN DEFAULT FALSE;
ALTER TABLE diet_plans ADD COLUMN tdee_estimate INT;
ALTER TABLE diet_plans ADD COLUMN surplus_deficit_kcal INT DEFAULT -400;
  -- negativo = déficit, positivo = superávit
ALTER TABLE diet_plans ADD COLUMN goal_type VARCHAR(30);
  -- 'cut' | 'bulk' | 'maintenance' | 'recomp'
ALTER TABLE diet_plans ADD COLUMN last_adjusted_at TIMESTAMPTZ;
ALTER TABLE diet_plans ADD COLUMN adjustment_reason TEXT;

-- ONBOARDING RESPONSES
CREATE TABLE onboarding_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) UNIQUE,
    responses_json JSONB NOT NULL,     -- respostas das 12 perguntas
    ai_analysis JSONB NOT NULL,        -- resultado processado pela IA
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 44. Endpoints — IA Coach

Endpoints adicionais ao contrato de API:

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/ai-coach/onboarding` | Processar respostas do onboarding → retorna perfil completo gerado pela IA |
| GET | `/api/ai-coach/chat` | Histórico de conversas com a IA Coach |
| POST | `/api/ai-coach/chat` | Enviar mensagem para a IA Coach (chat livre) |
| GET | `/api/ai-coach/insights` | Listar insights e análises gerados pela IA |
| POST | `/api/ai-coach/insights/:id/dismiss` | Dispensar um insight |
| GET | `/api/ai-coach/weekly-analysis` | Análise semanal automática |
| GET | `/api/ai-coach/monthly-report` | Relatório mensal completo com análise |
| POST | `/api/ai-coach/checkin` | Responder check-in periódico |
| GET | `/api/ai-coach/checkin/pending` | Ver se há check-in pendente para o usuário |
| GET | `/api/sagas` | Listar Sagas disponíveis + Saga ativa |
| POST | `/api/sagas/:type/start` | Iniciar uma Saga |
| POST | `/api/sagas/:id/abandon` | Abandonar Saga ativa |
| GET | `/api/goals` | Listar metas de longo prazo do usuário |
| POST | `/api/goals` | Adicionar meta de longo prazo |
| PUT | `/api/goals/:id` | Atualizar progresso de meta |
| GET | `/api/weekly-goals` | Ver metas semanais da semana atual |
| POST | `/api/weekly-goals/accept` | Aceitar metas geradas pela IA |
| POST | `/api/weekly-goals/adjust` | Ajustar metas semanais antes de aceitar |
| GET | `/api/ai-coach/difficulty-suggestion` | Sugestão de ajuste de dificuldade das Daily Quests |
| POST | `/api/ai-coach/apply-adaptation` | Aplicar adaptação sugerida pela IA (metas, plano, quests) |

---

*HunterFit — Especificação Master v5.0*  
*"Para todos os públicos. Para sempre. Para o próximo nível."*  
*"Arise. Level Up. IRL."*
