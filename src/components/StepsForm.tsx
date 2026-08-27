import { useMemo, useState } from 'react'
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
  const [stepsDone, setStepsDone] = useState(0)
  const [goal, setGoal] = useState(defaultGoal)

  const stepsRemaining = Math.max(goal - stepsDone, 0)
  const distanceRemaining = useMemo(
    () => stepsToMeters(stepsRemaining, heightCm),
    [stepsRemaining, heightCm],
  )
  const progress = goal > 0 ? stepsDone / goal : 0
  const goalReached = stepsRemaining === 0 && goal > 0

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
            value={stepsDone}
            onChange={(e) => setStepsDone(Math.max(Number(e.target.value), 0))}
          />
        </label>
        <label className="stat-input">
          <span>Objectif</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={goal}
            onChange={(e) => setGoal(Math.max(Number(e.target.value), 0))}
          />
        </label>
      </div>

      {!goalReached && (
        <button
          type="button"
          className="btn btn--primary btn--pill"
          disabled={disabled || isGenerating}
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
