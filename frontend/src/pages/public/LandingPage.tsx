import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '../../components/uia';
import { dashboardAPI } from '../../services/api/dashboardAPI';
import AnimatedCounter from '../../components/common/AnimatedCounter';

export default function LandingPage() {
  const [totalProjects, setTotalProjects] = useState(311);

  useEffect(() => {
    dashboardAPI.getKPIs({ showSubmissions: true }).then((kpis) => {
      setTotalProjects(kpis.totalProjects);
    }).catch(() => {});
  }, []);

  return (
    <div className="bg-white text-black font-sans selection:bg-uia-blue/10 selection:text-uia-blue">

      {/* Hero Section - UIA Design with Banner Background */}
      <section className="relative overflow-hidden min-h-[600px] lg:min-h-[700px]">
        {/* Background Banner Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/uia-banner.png"
            alt="UIA 2030 Award Projects Showcase"
            className="w-full h-full object-cover"
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70"></div>
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 pt-24 pb-32 lg:pt-32 lg:pb-40">
          <div className="max-w-5xl mx-auto px-6 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/95 border border-white rounded-none shadow-lg mb-8 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-uia-blue opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-uia-blue"></span>
              </span>
              <span className="text-uia-dark text-xs font-display font-bold tracking-uia-wide uppercase">
                Union of International Architects
              </span>
            </div>

            {/* Main Title - UIA Typography */}
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-display font-bold tracking-tight mb-6 leading-[0.9] drop-shadow-2xl">
              <span className="text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
                PANORAMA
              </span>
              {' '}
              <span className="text-uia-red drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
                SDG
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl sm:text-2xl font-sans font-light text-white max-w-3xl mx-auto leading-relaxed mb-4 drop-shadow-lg">
              The UIA Panorama of SDG Implementation Metrics — tracking how architecture drives the UN 2030 Agenda.
            </p>

            <p className="text-lg font-sans text-white/90 max-w-2xl mx-auto mb-12 drop-shadow-lg">
              Featuring projects from the UIA Guidebook for the 2030 Agenda — 2023 &amp; 2026 editions — across 5 global regions.
            </p>

            {/* CTA Buttons - UIA Style */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/dashboard">
                <Button variant="dark" size="lg" className="min-w-[200px]">
                  <span className="flex items-center justify-center gap-2">
                    See the Projects
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </Button>
              </Link>

              <Link to="/submit">
                <Button variant="dark-outline" size="lg" className="min-w-[200px] border-2 border-white text-white hover:bg-white hover:text-uia-dark-button">
                  <span className="flex items-center justify-center gap-2">
                    Submit Project
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Key Metrics Bar - UIA Style */}
      <section className="relative border-y border-uia-dark bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-uia-dark">
            <div className="py-10 px-8 text-center group cursor-pointer hover:bg-uia-gray-light transition-all duration-300">
              <div className="text-5xl font-display font-bold text-uia-red mb-2 group-hover:scale-110 transition-transform">
                <AnimatedCounter value={totalProjects} />
              </div>
              <div className="text-xs font-display font-bold text-uia-dark uppercase tracking-uia-wide">Projects</div>
            </div>
            <div className="py-10 px-8 text-center group cursor-pointer hover:bg-uia-gray-light transition-all duration-300">
              <div className="text-5xl font-display font-bold text-uia-blue mb-2 group-hover:scale-110 transition-transform">17</div>
              <div className="text-xs font-display font-bold text-uia-dark uppercase tracking-uia-wide">SDG Goals</div>
            </div>
            <div className="py-10 px-8 text-center group cursor-pointer hover:bg-uia-gray-light transition-all duration-300">
              <div className="text-5xl font-display font-bold text-uia-violet mb-2 group-hover:scale-110 transition-transform">5</div>
              <div className="text-xs font-display font-bold text-uia-dark uppercase tracking-uia-wide">Global Regions</div>
            </div>
            <div className="py-10 px-8 text-center group cursor-pointer hover:bg-uia-gray-light transition-all duration-300">
              <div className="text-5xl font-display font-bold text-uia-red mb-2 group-hover:scale-110 transition-transform">2030</div>
              <div className="text-xs font-display font-bold text-uia-dark uppercase tracking-uia-wide">Target Year</div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section - UIA Cards */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          {/* Section Header */}
          <div className="max-w-3xl mx-auto text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-display font-bold text-black mb-6 tracking-uia-normal">
              Architecture for a{' '}
              <span className="text-uia-blue">
                Better Future
              </span>
            </h2>
            <p className="text-xl font-sans font-light text-uia-dark leading-relaxed">
              Connecting the global architectural community to share knowledge, track progress, and inspire sustainable solutions.
            </p>
          </div>

          {/* Feature Cards - UIA Style */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 - Global Visibility */}
            <Card variant="featured" category="tools" className="group">
              <div className="w-14 h-14 bg-uia-blue rounded-none flex items-center justify-center text-white mb-6">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <h3 className="text-xl font-display font-bold text-black mb-3 group-hover:text-uia-blue transition-colors">Global Visibility</h3>
              <p className="text-base font-sans text-uia-dark leading-relaxed">
                Showcase your sustainable projects on a world-class platform, reaching peers and policymakers worldwide.
              </p>
            </Card>

            {/* Card 2 - Impact Tracking */}
            <Card variant="featured" category="resources" className="group">
              <div className="w-14 h-14 bg-uia-violet rounded-none flex items-center justify-center text-white mb-6">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>

              <h3 className="text-xl font-display font-bold text-black mb-3 group-hover:text-uia-violet transition-colors">Impact Tracking</h3>
              <p className="text-base font-sans text-uia-dark leading-relaxed">
                Quantify architectural contributions to the UN SDGs with real-time data visualization and analytics.
              </p>
            </Card>

            {/* Card 3 - Knowledge Exchange */}
            <Card variant="featured" category="priority" className="group">
              <div className="w-14 h-14 bg-uia-red rounded-none flex items-center justify-center text-white mb-6">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>

              <h3 className="text-xl font-display font-bold text-black mb-3 group-hover:text-uia-red transition-colors">Knowledge Exchange</h3>
              <p className="text-base font-sans text-uia-dark leading-relaxed">
                Access a library of proven solutions to accelerate the transition to a sustainable built environment.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action - UIA Style */}
      <section className="relative py-28 bg-uia-blue overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-white mb-6 tracking-uia-normal">
            Ready to Make an Impact?
          </h2>
          <p className="text-xl font-sans font-light text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join architects worldwide in building a sustainable future. Submit your project to Panorama SDG today.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <Link to="/submit">
              <Button variant="dark" size="lg" className="min-w-[200px]">
                <span className="flex items-center justify-center gap-2">
                  Submit Your Project
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Button>
            </Link>

            <Link to="/dashboard">
              <Button variant="dark-outline" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-uia-dark-button min-w-[200px]">
                See the Projects
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
