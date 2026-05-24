import React from 'react';
import { motion } from 'framer-motion';
import { Reveal } from '../components/animations/Reveal';

export function HeroSection() {
  return (
    <section className="text-center mb-20">
      <Reveal>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="inline-block mb-6 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-sm font-medium text-accent-blue"
        >
          ✨ Next-Generation Code Mapping
        </motion.div>
      </Reveal>
      
      <Reveal delay={0.1}>
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-8">
          Map your codebase with{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue via-accent-purple to-accent-pink animate-glow">
            Intelligence
          </span>
        </h1>
      </Reveal>
      
      <Reveal delay={0.2}>
        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-secondary leading-relaxed">
          Instantly transform any GitHub repository into a structured, easily navigable JSON code index powered by Gemini's advanced multimodal AI models.
        </p>
      </Reveal>
    </section>
  );
}
