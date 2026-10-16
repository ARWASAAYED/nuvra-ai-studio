import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { Sparkles, Zap, Bot, BarChart3, ArrowRight, CheckCircle2 } from 'lucide-react';

const features = [
  {
    icon: Bot,
    title: 'AI Model Gateway',
    description: 'Deploy and manage dozens of AI models with unified API access and smart routing.',
  },
  {
    icon: Zap,
    title: 'Edge Functions',
    description: 'Run serverless functions at the edge, milliseconds from your users worldwide.',
  },
  {
    icon: BarChart3,
    title: 'Real-time Analytics',
    description: 'Monitor usage, costs, and performance with beautiful real-time dashboards.',
  },
];

const perks = [
  'No credit card required',
  'Free tier forever',
  'GDPR compliant',
  'SOC 2 Type II',
];

export default function HomePage() {
  return (
    <div className="min-h-dvh flex flex-col auth-bg">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center shadow-sm">
              <Sparkles size={15} className="text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight text-foreground">Nuvra AI Studio</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/sign-in" id="header-sign-in" className="btn-ghost text-sm px-4 py-2 h-9">
              Sign in
            </Link>
            <Link href="/sign-up" id="header-get-started" className="btn-primary text-sm h-9">
              Get started free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold mb-8 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Now in public beta
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold text-foreground tracking-tight mb-6 animate-slide-up">
            Build smarter AI apps{' '}
            <span className="gradient-text">at warp speed</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '80ms' }}>
            Nuvra AI Studio gives you the database, auth, storage, and AI model gateway
            you need to ship production-ready AI applications in days, not months.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10 animate-slide-up" style={{ animationDelay: '160ms' }}>
            <Link href="/sign-up" id="hero-cta-primary" className="btn-primary h-12 px-7 text-base">
              Start building for free
              <ArrowRight size={16} />
            </Link>
            <Link href="/sign-in" id="hero-cta-secondary" className="btn-outline h-12 px-7 text-base">
              Sign in to your account
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 animate-fade-in" style={{ animationDelay: '240ms' }}>
            {perks.map((p) => (
              <div key={p} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 size={13} className="text-success" />
                {p}
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="max-w-5xl mx-auto px-6 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {features.map((feat, i) => (
              <div
                key={feat.title}
                className="card-premium p-7 animate-slide-up"
                style={{ animationDelay: `${(i + 1) * 100}ms` }}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                  <feat.icon size={20} className="text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">{feat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feat.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded gradient-brand flex items-center justify-center">
              <Sparkles size={10} className="text-white" />
            </div>
            <span className="text-xs text-muted-foreground">© 2025 Nuvra AI Studio</span>
          </div>
          <div className="flex items-center gap-5">
            {['Privacy', 'Terms', 'Status', 'Docs'].map((link) => (
              <Link key={link} href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                {link}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
