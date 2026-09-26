import React from 'react';
import { motion, type Variants } from 'framer-motion';
import { Card } from '@/components/common/Card';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Network, Target, GitBranch, ShieldCheck } from 'lucide-react';

export const PrerequisiteMasterySection: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 24 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: shouldReduceMotion ? 0 : i * 0.1,
        duration: 0.5,
        ease: 'easeOut',
      },
    }),
  };

  const features = [
    {
      icon: Network,
      code: 'SPEC_01',
      title: 'Knowledge Dependency Graphs',
      description:
        'Learning material is structured as a connected directed acyclic graph (DAG) of explicit prerequisite dependencies rather than arbitrary linear textbook chapters.',
    },
    {
      icon: Target,
      code: 'SPEC_02',
      title: 'Item Response Theory (IRT)',
      description:
        'Questions and exercises dynamically evaluate skill mastery using item difficulty parameters, discriminating genuine understanding from guessing.',
    },
    {
      icon: GitBranch,
      code: 'SPEC_03',
      title: 'Automated Gap Remediation',
      description:
        'When a diagnostic item reveals a missing prerequisite concept, the engine branches backward instantly to rebuild the missing foundation.',
    },
    {
      icon: ShieldCheck,
      code: 'SPEC_04',
      title: 'Strict Mastery Criteria',
      description:
        'Students progress only when verified prerequisite competency is reached, ensuring subsequent advanced concepts rest on solid comprehension.',
    },
  ];

  return (
    <section id="prerequisites" className="py-20 bg-ivory border-b border-deep-green/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
          <span className="text-xs font-mono tracking-widest text-dark-green uppercase bg-warm-ivory border border-deep-green/30 px-3 py-1 rounded-full inline-block">
            Mastery Mechanics
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-dark-text tracking-tight">
            Prerequisite Dependency Intelligence
          </h2>
          <p className="text-muted text-base leading-relaxed">
            Most learning breakdown occurs when advanced topics are introduced before prerequisite concepts are mastered. Our graph model fixes root causes before moving forward.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <motion.div
                key={item.code}
                custom={index}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
              >
                <Card className="h-full bg-warm-ivory border-deep-green/20 hover:border-deep-green/40 transition-colors p-6 sm:p-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-dark-green border border-deep-green flex items-center justify-center text-yellow">
                      <IconComponent size={20} />
                    </div>
                    <span className="font-mono text-[10px] text-dark-text/80 bg-ivory px-2 py-0.5 rounded border border-deep-green/30">
                      {item.code}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-dark-text">{item.title}</h3>
                  <p className="text-muted text-sm leading-relaxed">{item.description}</p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
