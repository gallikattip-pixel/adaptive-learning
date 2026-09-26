import React from 'react';
import { HeroSection } from '@/components/landing/HeroSection';
import { AdaptiveConceptVisual } from '@/components/landing/AdaptiveConceptVisual';
import { PrerequisiteMasterySection } from '@/components/landing/PrerequisiteMasterySection';
import { PersonalizationFlowSection } from '@/components/landing/PersonalizationFlowSection';
import { ValuePropositionSection } from '@/components/landing/ValuePropositionSection';
import { StudentCtaSection } from '@/components/landing/StudentCtaSection';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-ivory text-dark-text selection:bg-yellow selection:text-dark-green">
      <main>
        {/* 1. Hero Section */}
        <HeroSection />

        {/* 2. Dynamic Prerequisite Graph Visual */}
        <AdaptiveConceptVisual />

        {/* 3. Prerequisite & Mastery Concept Explanation */}
        <PrerequisiteMasterySection />

        {/* 4. Personalization & ML Gateway Contracts */}
        <PersonalizationFlowSection />

        {/* 5. Value Proposition & Contrast */}
        <ValuePropositionSection />

        {/* 6. Student Call To Action */}
        <StudentCtaSection />
      </main>
    </div>
  );
};
