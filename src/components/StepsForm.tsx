import { useEffect, useMemo, useState } from 'react'
import { stepsToMeters } from '../lib/stepLength'
import LoadingDots from './LoadingDots'
import StepRing from './StepRing'
import { CheckIcon } from './icons'
import './StepsForm.css'

interface StepsFormProps {
  heightCm: number
  defaultGoal: number
  onGenerate: (distanceRemainingMeters: number) => void
  isGenerating: boolean
  disabled: boolean
  disabledReason?: string
}

export default function StepsForm({
  heightCm,
  defaultGoal,
  onGenerate,
  isGenerating,
  disabled,
  disabledReason,
}: StepsFormProps) {
  const [stepsDone, setStepsDone] = useState<number | ''>('')
  const [goal, setGoal] = useState<number | ''>(defaultGoal)

  useEffect(() => {
    setGoal(defaultGoal)
  }, [defaultGoal])

  const effectiveStepsDone = typeof stepsDone === 'number' ? stepsDone : 0
  const effectiveGoal = typeof goal === 'number' ? goal : 0

  const stepsRemaining = Math.max(effectiveGoal - effectiveStepsDone, 0)
  const distanceRemaining = useMemo(
    () => stepsToMeters(stepsRemaining, heightCm),
    [stepsRemaining, heightCm],
  )
  const progress = effectiveGoal > 0 ? effectiveStepsDone / effectiveGoal : 0
  const goalReached =
    stepsRemaining === 0 && effectiveGoal > 0 && effectiveStepsDone >= effectiveGoal

  const handleAddSteps = (increment: number) => {
    setStepsDone((prev) => {
      const current = typeof prev === 'number' ? prev : 0
      return current + increment
    })
  }

  const handleSetHalfGoal = () => {
    if (effectiveGoal > 0) {
      setStepsDone(Math.round(effectiveGoal / 2))
    }
  }

  const handleClearSteps = () => {
    setStepsDone('')
  }

  return (
    <section className="steps-card">
      <p className="steps-card__eyebrow">Distance restante</p>

      {goalReached ? (
        <StepRing progress={1} value={<CheckIcon />} label="objectif atteint" />
      ) : (
        <StepRing
          progress={progress}
          value={`${(distanceRemaining / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} km`}
          label={`${stepsRemaining.toLocaleString('fr-FR')} pas restants`}
        />
      )}

      <div className="steps-card__inputs">
        <label className="stat-input">
          <span>Pas faits</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="0"
            value={stepsDone === '' ? '' : stepsDone}
            onChange={(e) => {
              const val = e.target.value
              if (val === '') {
                setStepsDone('')
              } else {
                const n = parseInt(val, 10)
                if (!isNaN(n) && n >= 0) {
                  setStepsDone(n)
                }
              }
            }}
          />
        </label>
        <label className="stat-input">
          <span>Objectif</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={`${defaultGoal}`}
            value={goal === '' ? '' : goal}
            onChange={(e) => {
              const val = e.target.value
              if (val === '') {
                setGoal('')
              } else {
                const n = parseInt(val, 10)
                if (!isNaN(n) && n >= 0) {
                  setGoal(n)
                }
              }
            }}
          />
        </label>
      </div>

      {/* Quick steps increment pills */}
      <div className="steps-card__quick-row">
        <button
          type="button"
          className="quick-chip"
          onClick={() => handleAddSteps(1000)}
          title="Ajouter 1 000 pas"
        >
          +1 000
        </button>
        <button
          type="button"
          className="quick-chip"
          onClick={() => handleAddSteps(2500)}
          title="Ajouter 2 500 pas"
        >
          +2 500
        </button>
        <button
          type="button"
          className="quick-chip"
          onClick={() => handleAddSteps(5000)}
          title="Ajouter 5 000 pas"
        >
          +5 000
        </button>
        <button
          type="button"
          className="quick-chip"
          onClick={handleSetHalfGoal}
          title="Définir à 50% de l'objectif"
        >
          50%
        </button>
        {stepsDone !== '' && stepsDone !== 0 && (
          <button
            type="button"
            className="quick-chip quick-chip--clear"
            onClick={handleClearSteps}
            title="Effacer les pas faits"
          >
            Effacer
          </button>
        )}
      </div>

      {!goalReached && (
        <button
          type="button"
          className="btn btn--primary btn--pill"
          disabled={disabled || isGenerating || effectiveGoal <= 0 || distanceRemaining <= 0}
          onClick={() => onGenerate(distanceRemaining)}
        >
          Générer un trajet
        </button>
      )}
      {isGenerating && <LoadingDots label="Génération du trajet" />}
      {disabled && disabledReason && <p className="steps-card__hint">{disabledReason}</p>}
    </section>
  )
}
