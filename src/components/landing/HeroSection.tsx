import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.12,
        delayChildren: shouldReduceMotion ? 0 : 0.05,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  return (
    <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-dark-green border-b border-deep-green/60">
      {/* Background subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#FAF7EF_1px,transparent_1px)] [background-size:24px_24px]" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="max-w-4xl mx-auto text-center space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="inline-block">
            <Badge variant="yellow" className="px-3 py-1 text-[11px]">
              Autonomous Adaptive Learning Platform
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-ivory leading-[1.15]"
          >
            Real-Time Mastery Through{' '}
            <span className="text-yellow">
              Prerequisite Graph Intelligence
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-lg sm:text-xl text-ivory/85 max-w-2xl mx-auto leading-relaxed font-normal"
          >
            Eliminate linear course constraints. Adaptive Learning continuously diagnoses your skill gaps, restructures prerequisite dependencies in real time, and optimizes learning pathways for every student.
          </motion.p>

          {/* Core Feature Pills */}
          <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <span className="px-3 py-1 rounded-md bg-deep-green border border-deep-green/80 text-xs font-mono text-ivory/90">
              Graph-Based Remediation
            </span>
            <span className="px-3 py-1 rounded-md bg-deep-green border border-deep-green/80 text-xs font-mono text-ivory/90">
              Item Response Theory Pacing
            </span>
            <span className="px-3 py-1 rounded-md bg-deep-green border border-deep-green/80 text-xs font-mono text-ivory/90">
              Continuous Placement Optimization
            </span>
          </motion.div>

          {/* CTAs */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Button variant="primary" size="lg" className="w-full sm:w-auto" onClick={() => navigate('/signup')}>
              Create Student Account
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => {
                const el = document.getElementById('adaptive-model');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Explore Architecture
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
