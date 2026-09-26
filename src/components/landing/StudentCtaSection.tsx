import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/common/Button';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export const StudentCtaSection: React.FC = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="py-20 bg-ivory">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="bg-dark-green border border-deep-green rounded-3xl p-8 sm:p-14 text-center max-w-4xl mx-auto shadow-2xl relative overflow-hidden text-ivory"
        >
          <div className="space-y-6 relative z-10">
            <span className="text-xs font-mono tracking-widest text-yellow uppercase bg-deep-green border border-deep-green/80 px-3.5 py-1.5 rounded-full inline-block font-semibold">
              Student Registration
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-ivory tracking-tight">
              Ready to Experience Prerequisite-Driven Mastery?
            </h2>

            <p className="text-ivory/85 text-base max-w-2xl mx-auto leading-relaxed">
              Create your student account to access diagnostic evaluations, track knowledge node mastery, and connect with real backend API services as they launch.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button variant="primary" size="lg" className="w-full sm:w-auto" onClick={() => navigate('/signup')}>
                Create Student Account
              </Button>
              <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={() => navigate('/login')}>
                Sign In to Portal
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
