import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/common/Card';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Cpu, Zap, Activity, Layers } from 'lucide-react';

export const PersonalizationFlowSection: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  const mlServices = [
    {
      icon: Cpu,
      title: 'Real-Time Skill-Gap Inference',
      description:
        'Analyzes diagnostic item responses against domain node weights to isolate specific missing prerequisites before stagnation occurs.',
      tag: 'Skill Gap Model',
    },
    {
      icon: Zap,
      title: 'Adaptive Difficulty Regulation',
      description:
        'Adjusts question parameter difficulty based on student response latency and accuracy to maintain optimal cognitive challenge.',
      tag: 'Difficulty System',
    },
    {
      icon: Activity,
      title: 'Learning Risk & Stagnation Detection',
      description:
        'Monitors engagement patterns to flag concept friction early and automatically restructure learning tasks.',
      tag: 'Risk Prediction',
    },
    {
      icon: Layers,
      title: 'Format-Matched Resource Routing',
      description:
        'Matches student preferences (interactive practice, concise text summaries, step-by-step breakdowns) to optimal learning objects.',
      tag: 'Resource Allocator',
    },
  ];

  return (
    <section id="personalization" className="py-20 bg-dark-green border-b border-deep-green/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text */}
          <div className="lg:col-span-5 space-y-6">
            <span className="text-xs font-mono tracking-widest text-yellow uppercase bg-deep-green border border-deep-green/80 px-3 py-1 rounded-full inline-block">
              Machine Intelligence Contracts
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-ivory tracking-tight leading-tight">
              Personalization Infrastructure
            </h2>
            <p className="text-ivory/85 text-base leading-relaxed">
              Every student learns at a different velocity and through different modality preferences. Adaptive Learning is architected from the ground up to integrate high-performance machine learning microservices.
            </p>
            <div className="p-4 rounded-xl bg-deep-green/40 border border-deep-green space-y-2">
              <div className="text-xs font-mono text-yellow flex items-center gap-2 font-semibold">
                <span className="w-2 h-2 rounded-full bg-yellow" /> API Contract Ready
              </div>
              <p className="text-xs text-ivory/70 leading-relaxed">
                Frontend services consume standardized JSON endpoints (`/predict-skill-gaps`, `/recommend-resources`, `/adaptive-difficulty`, `/predict-risk`).
              </p>
            </div>
          </div>

          {/* Right Microservice Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mlServices.map((service, idx) => {
              const IconComp = service.icon;
              return (
                <motion.div
                  key={service.tag}
                  initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: shouldReduceMotion ? 0 : idx * 0.08, duration: 0.4 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full bg-deep-green/50 border-deep-green hover:border-yellow/50 p-5 flex flex-col justify-between space-y-3 text-ivory">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded bg-dark-green border border-deep-green flex items-center justify-center text-yellow">
                        <IconComp size={16} />
                      </div>
                      <span className="text-[10px] font-mono text-yellow bg-dark-green border border-deep-green px-2 py-0.5 rounded">
                        {service.tag}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-ivory mb-1">{service.title}</h3>
                      <p className="text-xs text-ivory/80 leading-relaxed">{service.description}</p>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
