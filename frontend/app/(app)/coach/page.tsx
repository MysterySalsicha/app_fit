'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'

// ─── Question definitions ──────────────────────────────────────────────────

type QuestionType = 'single' | 'multi' | 'input' | 'number'

interface Question {
  id: string
  label: string
  systemText: string
  type: QuestionType
  options?: { value: string; label: string }[]
  placeholder?: string
  optional?: boolean
  condition?: (answers: Record<string, string>) => boolean
}

const QUESTIONS: Question[] = [
  {
    id: 'goal',
    label: 'Objetivo Principal',
    systemText: '🎯  QUAL É O SEU OBJETIVO PRINCIPAL?',
    type: 'single',
    options: [
      { value: 'fat_loss',      label: 'Perder gordura / emagrecer' },
      { value: 'muscle_gain',   label: 'Ganhar massa muscular / hipertrofia' },
      { value: 'strength',      label: 'Ganhar força (levantar mais peso)' },
      { value: 'maintenance',   label: 'Manter o que tenho' },
      { value: 'recomposition', label: 'Recomposição corporal' },
      { value: 'return',        label: 'Voltar a treinar após pausa' },
    ],
  },
  {
    id: 'experience',
    label: 'Experiência de Treino',
    systemText: '⚔️  QUAL É SUA EXPERIÊNCIA COM TREINO DE FORÇA?',
    type: 'single',
    options: [
      { value: 'absolute_beginner', label: 'Nunca treinei consistentemente' },
      { value: 'beginner',         label: 'Iniciante (3–12 meses)' },
      { value: 'intermediate', label: 'Intermediário (1–3 anos)' },
      { value: 'advanced',     label: 'Avançado (3+ anos)' },
      { value: 'athlete',      label: 'Atleta / Competidor' },
    ],
  },
  {
    id: 'daysPerWeek',
    label: 'Frequência',
    systemText: '📅  QUANTOS DIAS POR SEMANA VOCÊ CONSEGUE TREINAR?',
    type: 'single',
    options: [
      { value: '2', label: '2 dias' },
      { value: '3', label: '3 dias' },
      { value: '4', label: '4 dias' },
      { value: '5', label: '5 dias' },
      { value: '6', label: '6 dias' },
    ],
  },
  {
    id: 'location',
    label: 'Local de Treino',
    systemText: '🏋️  ONDE VOCÊ TREINA E COM O QUÊ?',
    type: 'single',
    options: [
      { value: 'full_gym',        label: 'Academia completa' },
      { value: 'basic_gym',       label: 'Academia básica' },
      { value: 'home_equipment',  label: 'Em casa com equipamentos' },
      { value: 'home_bodyweight', label: 'Em casa sem equipamentos' },
      { value: 'outdoor',         label: 'Ao ar livre / Calistenia' },
    ],
  },
  {
    id: 'sex',
    label: 'Sexo Biológico',
    systemText: '📋  SEXO BIOLÓGICO (PARA CÁLCULO DE TDEE)',
    type: 'single',
    options: [
      { value: 'M', label: 'Masculino' },
      { value: 'F', label: 'Feminino' },
      { value: 'X', label: 'Prefiro não dizer' },
    ],
  },
  {
    id: 'birthdate',
    label: 'Data de Nascimento',
    systemText: '📅  QUANDO VOCÊ NASCEU? (opcional)',
    type: 'input',
    placeholder: 'AAAA-MM-DD',
    optional: true,
  },
  {
    id: 'nutrition',
    label: 'Nutrição',
    systemText: '🥩  VOCÊ ACOMPANHA SUA ALIMENTAÇÃO?',
    type: 'single',
    condition: (a) => ['fat_loss', 'muscle_gain', 'recomposition'].includes(a.goal ?? ''),
    options: [
      { value: 'tracking',  label: 'Sim, conheço meus macros' },
      { value: 'informal',  label: 'Sim, de forma informal' },
      { value: 'starting',  label: 'Não, mas gostaria de começar' },
      { value: 'none',      label: 'Não me importo agora' },
    ],
  },
  {
    id: 'injuries',
    label: 'Lesões / Restrições',
    systemText: '🩹  VOCÊ TEM ALGUMA LESÃO OU RESTRIÇÃO? (opcional)',
    type: 'input',
    placeholder: 'Ex: joelho esquerdo, ombro, lombar…',
    optional: true,
  },
  {
    id: 'notificationTone',
    label: 'Tom das Notificações',
    systemText: '🔔  COMO PREFERE RECEBER AS MENSAGENS DO SISTEMA?',
    type: 'single',
    options: [
      { value: 'solo_leveling',  label: '⚡ Solo Leveling — dramático e épico' },
      { value: 'motivational',   label: '💪 Motivacional — direto e positivo' },
      { value: 'minimal',        label: '🤐 Minimal — só o essencial' },
      { value: 'balanced',       label: '⚖️ Equilibrado — mistura dos estilos' },
    ],
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function CoachOnboardingPage() {
  const router = useRouter()
  const { user } = useAuthStore()

  // Check if onboarding already completed
  const { data: profile, isLoading: checkingProfile } = useQuery({
    queryKey: ['hunter', 'profile'],
    queryFn: () => api.get<{ onboardingCompleted?: boolean }>('api/hunter/profile'),
  })

  const [step, setStep]           = useState<'intro' | 'questions' | 'done'>('intro')
  const [questionIndex, setIndex] = useState(0)
  const [answers, setAnswers]     = useState<Record<string, string>>({})

  const visibleQuestions = QUESTIONS.filter(q =>
    !q.condition || q.condition(answers)
  )
  const current = visibleQuestions[questionIndex]
  const progress = Math.round((questionIndex / visibleQuestions.length) * 100)

  const onboardingMutation = useMutation({
    mutationFn: () => api.post('api/ai-coach/onboarding', { answers }),
    onSuccess: () => setStep('done'),
  })

  // ── Already done? redirect to dashboard ─────────────────────────────────
  if (!checkingProfile && profile?.onboardingCompleted) {
    router.replace('/dashboard')
    return null
  }

  // ── Intro screen ─────────────────────────────────────────────────────────
  if (step === 'intro') {
    return (
      <div className="dungeon-overlay">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 max-w-sm mx-auto text-center space-y-6"
        >
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-7xl"
          >
            ⚡
          </motion.div>

          <div className="system-notification">
            <p className="text-xs text-blue-400 mb-1 font-mono uppercase tracking-widest">Sistema</p>
            <p className="text-xl font-bold text-white">NOVO CAÇADOR DETECTADO</p>
            <p className="text-sm text-blue-200 mt-3">
              Antes de atribuir sua Classe, o Sistema precisa te conhecer.
            </p>
            <p className="text-sm text-blue-200 mt-1">
              Isso leva cerca de <span className="text-blue-400 font-bold">3 minutos</span>.
            </p>
            <p className="text-xs text-blue-300/60 mt-3 italic">
              "Suas respostas moldam tudo — plano, metas, dificuldade, notificações."
            </p>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setStep('questions')}
            className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg"
          >
            COMEÇAR ANÁLISE ⚔️
          </motion.button>
        </motion.div>
      </div>
    )
  }

  // ── Done screen ──────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="dungeon-overlay">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="px-6 max-w-sm mx-auto text-center space-y-6"
        >
          <motion.div
            animate={{ rotate: [0, -15, 15, -15, 0] }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-7xl"
          >
            🆙
          </motion.div>

          <div className="system-notification">
            <p className="text-xs text-blue-400 mb-1 font-mono uppercase tracking-widest">Sistema</p>
            <p className="text-xl font-bold text-white">ANÁLISE CONCLUÍDA</p>
            <p className="text-sm text-blue-200 mt-2">
              Sua Classe foi atribuída.
            </p>
            <p className="text-sm text-blue-200 mt-1">
              ✅ Seu plano de treino foi <span className="text-green-400 font-bold">gerado automaticamente</span> com base no seu perfil.
            </p>
            <p className="text-xs text-blue-300/70 mt-3">
              Acesse <span className="text-blue-300 font-bold">Treinos</span> para ver e personalizar.
            </p>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/workout')}
            className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg"
          >
            ⚔️ Ver meu plano de treino
          </motion.button>

          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-blue-300/60 underline underline-offset-2"
          >
            Ir para o Dashboard →
          </button>
        </motion.div>
      </div>
    )
  }

  // ── Questions flow ───────────────────────────────────────────────────────
  const handleAnswer = (value: string) => {
    const updated = { ...answers, [current.id]: value }
    setAnswers(updated)

    const nextVisible = QUESTIONS.filter(q => !q.condition || q.condition(updated))
    const nextIndex   = questionIndex + 1

    if (nextIndex >= nextVisible.length) {
      // All questions answered → submit
      setAnswers(updated)
      onboardingMutation.mutate()
      setStep('done')
    } else {
      setIndex(nextIndex)
    }
  }

  const handleTextSubmit = () => {
    const value = answers[current.id] ?? ''
    if (!current.optional && !value) return
    handleAnswer(value || '__skipped__')
  }

  return (
    <div className="dungeon-overlay">
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-muted/40">
        <motion.div
          className="h-full bg-primary"
          animate={{ width: `${progress}%` }}
          transition={{ ease: 'easeInOut' }}
        />
      </div>

      {/* Step counter */}
      <div className="absolute top-4 right-4 text-xs text-muted-foreground font-mono">
        {questionIndex + 1}/{visibleQuestions.length}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
          className="px-6 max-w-sm mx-auto w-full space-y-5"
        >
          {/* System box */}
          <div className="system-notification">
            <p className="text-xs text-blue-400 mb-1 font-mono uppercase tracking-widest">Sistema</p>
            <p className="text-base font-bold text-white">{current.systemText}</p>
          </div>

          {/* Options */}
          {current.type === 'single' && current.options && (
            <div className="space-y-2">
              {current.options.map((opt) => (
                <motion.button
                  key={opt.value + opt.label}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleAnswer(opt.value)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
                    answers[current.id] === opt.value
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-muted/20 border-border text-foreground hover:border-primary/50'
                  }`}
                >
                  {opt.label}
                </motion.button>
              ))}
            </div>
          )}

          {/* Text input */}
          {current.type === 'input' && (
            <div className="space-y-3">
              <input
                type="text"
                value={answers[current.id] ?? ''}
                onChange={(e) => setAnswers({ ...answers, [current.id]: e.target.value })}
                placeholder={current.placeholder}
                className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
              />
              <div className="flex gap-2">
                {current.optional && (
                  <button
                    onClick={() => handleAnswer('__skipped__')}
                    className="flex-1 py-3 border border-border rounded-xl text-muted-foreground text-sm"
                  >
                    Pular
                  </button>
                )}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleTextSubmit}
                  className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm"
                >
                  Continuar →
                </motion.button>
              </div>
            </div>
          )}

          {/* Back button */}
          {questionIndex > 0 && (
            <button
              onClick={() => setIndex(questionIndex - 1)}
              className="text-xs text-muted-foreground underline underline-offset-2 mx-auto block"
            >
              ← Voltar
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
