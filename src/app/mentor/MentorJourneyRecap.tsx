"use client"

import { motion, type Variants } from "motion/react"
import type { JourneyHighlight } from "@/lib/journeyRecap"

interface Props {
  mentorName: string
  highlights: JourneyHighlight[]
  onComplete: () => void
}

const recapContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.1 },
  },
}

const recapItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  },
}

export default function MentorJourneyRecap({ mentorName, highlights, onComplete }: Props) {
  return (
    <motion.div
      className="frame-block p-8 md:p-12"
      variants={recapContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={recapItem} className="mb-8">
        <div className="text-4xl mb-4">🧠</div>
        <h1 className="poster-heading text-2xl mb-3">{mentorName}</h1>
        <p className="text-[0.7rem] font-mono text-muted-ink/70 leading-relaxed max-w-lg">
          I've been catching up on everything you've logged. After reading through your study history, here's what stood out to me.
        </p>
      </motion.div>

      <div className="space-y-6 mb-8">
        {highlights.map((h, i) => (
          <motion.div
            key={i}
            variants={recapItem}
            className="flex items-start gap-4"
          >
            <span className="text-xl leading-none mt-0.5 shrink-0">{h.icon}</span>
            <div>
              <p className="text-[0.85rem] font-serif text-warm-brown leading-snug mb-1">
                {h.title}
              </p>
              <p className="text-[0.65rem] font-mono text-muted-ink/60 leading-relaxed">
                {h.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div variants={recapItem}>
        <p className="text-[0.7rem] font-serif text-muted-ink/70 italic mb-6">
          I'm excited to see what we build next.
        </p>

        <button
          onClick={onComplete}
          className="btn-base btn-coral btn-interact text-[0.55rem] cursor-pointer"
        >
          Let's build together →
        </button>
      </motion.div>
    </motion.div>
  )
}
