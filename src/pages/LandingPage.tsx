import { Link } from 'react-router-dom';
import { ArrowRight, Users, Target, MessageCircle, TrendingUp, Star } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-montserrat">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-nav">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src="/logo.jpg" alt="Propel" className="h-8" />
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#mentors" className="text-slate-600 hover:text-brand-blue-600 transition-colors font-medium text-sm">Mentors</a>
            <a href="#process" className="text-slate-600 hover:text-brand-blue-600 transition-colors font-medium text-sm">Process</a>
            <a href="#features" className="text-slate-600 hover:text-brand-blue-600 transition-colors font-medium text-sm">Features</a>
            <a href="#showcase" className="text-slate-600 hover:text-brand-blue-600 transition-colors font-medium text-sm">Showcase</a>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/signup?role=mentor" className="btn-secondary text-sm py-2.5 px-5 hidden sm:inline-flex">
              Become a Mentor
            </Link>
            <Link to="/signup?role=mentee" className="btn-primary text-sm py-2.5 px-5">
              Join as Mentee
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-20 px-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-green-50/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-green-50 border border-brand-green-200 rounded-full mb-6">
                <div className="w-2 h-2 bg-brand-green-500 rounded-full animate-pulse-soft" />
                <span className="text-brand-green-700 text-sm font-semibold tracking-wider uppercase">Fueling Careers</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 leading-[1.1] mb-6 text-balance">
                Reach Your{' '}
                <span className="gradient-text">Full Potential</span>{' '}
                with Expert Mentorship
              </h1>
              
              <p className="text-lg text-slate-500 mb-8 max-w-lg leading-relaxed">
                Navigate your career trajectory with guidance from industry leaders. 
                Propel matches you with mentors who have walked the path you're on.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <Link to="/signup?role=mentee" className="btn-primary text-base px-8 py-4 flex items-center gap-2">
                  Join as Mentee
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/signup?role=mentor" className="btn-secondary text-base px-8 py-4">
                  Become a Mentor
                </Link>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {['bg-brand-blue-500', 'bg-brand-green-500', 'bg-purple-500'].map((bg, i) => (
                    <div key={i} className={`w-8 h-8 rounded-full ${bg} border-2 border-white flex items-center justify-center text-white text-xs font-bold`}>
                      {['JL', 'MR', 'AK'][i]}
                    </div>
                  ))}
                </div>
                <span className="text-sm text-slate-500">Joined by <span className="font-semibold text-slate-700">2,200+</span> ambitious professionals</span>
              </div>
            </div>

            {/* Hero Card */}
            <div className="relative animate-slide-up hidden lg:block">
              <div className="absolute -top-4 -right-4 w-full h-full bg-brand-gradient rounded-3xl opacity-10" />
              <div className="relative card p-0 overflow-hidden">
                {/* Session Badge */}
                <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
                  <div className="w-2 h-2 bg-brand-green-500 rounded-full animate-pulse-soft" />
                  <span className="text-xs font-semibold text-slate-700">Session in progress</span>
                </div>
                
                {/* Card Image Area */}
                <div className="h-64 bg-brand-gradient flex items-center justify-center">
                  <div className="text-center">
                    <Users className="w-16 h-16 text-white/80 mx-auto mb-3" />
                    <p className="text-white/90 font-semibold text-lg">Mentorship in Action</p>
                    <p className="text-white/70 text-sm">Growth • Leadership • Success</p>
                  </div>
                </div>

                {/* Card Info */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider">Goal</p>
                      <p className="font-bold text-slate-900 text-lg">Senior Lead UI/UX</p>
                    </div>
                    <div className="w-14 h-14 rounded-full border-4 border-brand-green-500 flex items-center justify-center">
                      <span className="text-brand-green-600 font-bold text-sm">70%</span>
                    </div>
                  </div>
                  <p className="text-brand-green-600 text-sm font-semibold mb-3">70% through program</p>
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg">
                    <div className="w-2 h-2 bg-brand-green-500 rounded-full" />
                    <span className="text-sm text-slate-600">Next session in 2 days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="section-heading mb-4">Everything You Need to <span className="gradient-text">Grow</span></h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">Propel provides the tools and structure for meaningful mentorship that drives real results.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users, title: 'Smart Matching', desc: 'Our algorithm pairs you with mentors whose expertise aligns with your career goals.', color: 'blue' },
              { icon: Target, title: 'Goal Tracking', desc: 'Define milestones, track progress, and celebrate achievements together.', color: 'green' },
              { icon: MessageCircle, title: 'Group Learning', desc: 'Join mentor-led group discussions and learn from peers on similar paths.', color: 'blue' },
              { icon: TrendingUp, title: 'Career Growth', desc: 'Structured curriculum designed to accelerate your professional development.', color: 'green' },
            ].map((feature, i) => (
              <div key={i} className="card p-6 group hover:-translate-y-1 transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl ${feature.color === 'blue' ? 'bg-brand-blue-100' : 'bg-brand-green-100'} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-6 h-6 ${feature.color === 'blue' ? 'text-brand-blue-600' : 'text-brand-green-600'}`} />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="process" className="py-20 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="section-heading mb-4">How <span className="gradient-text">Propel</span> Works</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">Three simple steps to transform your career trajectory.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Create Your Profile', desc: 'Sign up and tell us about your career goals, skills, and what you\'re looking to achieve.', icon: Users },
              { step: '02', title: 'Connect with Mentors', desc: 'Browse expert mentors, send personalized requests, and get matched with the perfect guide.', icon: MessageCircle },
              { step: '03', title: 'Grow & Achieve', desc: 'Work through structured goals, attend sessions, and track your progress to success.', icon: TrendingUp },
            ].map((step, i) => (
              <div key={i} className="relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-brand-blue-300 to-brand-green-300 opacity-30" />
                )}
                <div className="card p-8 text-center relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-brand-gradient mx-auto mb-6 flex items-center justify-center shadow-lg">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-xs font-bold text-brand-blue-600 uppercase tracking-widest mb-2">Step {step.step}</div>
                  <h3 className="font-bold text-slate-900 text-xl mb-3">{step.title}</h3>
                  <p className="text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Showcase */}
      <section id="showcase" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="section-heading mb-4">Trusted by <span className="gradient-text">Professionals</span></h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">See what our community says about the Propel experience.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Sarah Chen', role: 'Product Designer', text: 'Propel connected me with a senior design lead who helped me land my dream role at a top tech company.', rating: 5 },
              { name: 'James Okafor', role: 'Software Engineer', text: 'The structured goal tracking kept me accountable. I went from junior to senior in 18 months.', rating: 5 },
              { name: 'Maria Rodriguez', role: 'Data Scientist', text: 'Group sessions with other mentees gave me perspectives I never would have gained alone.', rating: 5 },
            ].map((testimonial, i) => (
              <div key={i} className="card p-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-600 mb-6 leading-relaxed italic">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold text-sm">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{testimonial.name}</p>
                    <p className="text-xs text-slate-400">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="mentors" className="py-20 px-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-green-50/20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="card p-12">
            <h2 className="section-heading mb-4">Ready to <span className="gradient-text">Propel</span> Your Career?</h2>
            <p className="text-slate-500 text-lg mb-8">Join our next cohort of mentees and find your launchpad today.</p>
            <Link to="/signup" className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-2">
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-brand-green-600 text-sm mt-4 font-medium">Get Ready to Propel Your Future</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            <div>
              <img src="/logo.jpg" alt="Propel" className="h-7 mb-4" />
              <p className="font-semibold text-slate-900 mb-2">Professional Mentorship for Emergent Leaders</p>
              <p className="text-slate-400 text-sm leading-relaxed">
                Empowering the next generation of professionals through structured mentorship and actionable private paths.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Company</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-slate-500 hover:text-brand-blue-600 transition-colors text-sm">About Us</a></li>
                <li><a href="#" className="text-slate-500 hover:text-brand-blue-600 transition-colors text-sm">Careers</a></li>
                <li><a href="#" className="text-slate-500 hover:text-brand-blue-600 transition-colors text-sm">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Legal</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-slate-500 hover:text-brand-blue-600 transition-colors text-sm">Privacy Policy</a></li>
                <li><a href="#" className="text-slate-500 hover:text-brand-blue-600 transition-colors text-sm">Terms of Service</a></li>
                <li><a href="#" className="text-slate-500 hover:text-brand-blue-600 transition-colors text-sm">Community Guidelines</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-400">© 2026 Professional Mentorship Platform for Emerging Leaders. All rights reserved.</p>
            <div className="flex items-center gap-3">
              <a href="#" className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-brand-blue-600 hover:border-brand-blue-600 transition-colors">
                <span className="text-sm font-bold">𝕏</span>
              </a>
              <a href="#" className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-brand-blue-600 hover:border-brand-blue-600 transition-colors">
                <span className="text-sm font-bold">in</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
