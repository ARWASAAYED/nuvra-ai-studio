'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Sparkles, LayoutDashboard, Zap, Bot, BarChart3,
  Settings, LogOut, ChevronRight, TrendingUp, ArrowUpRight,
  Clock, Plus, Loader2, Bell, Search, User, X, Check,
  ShieldCheck, ShieldAlert, Mail, Key
} from 'lucide-react';
import { insforge } from '@/lib/insforge';

const stats = [
  { id: 'total-requests', label: 'API Requests', value: '124,832', change: '+12.4%', trend: 'up', icon: Zap },
  { id: 'active-models', label: 'Active Models', value: '7', change: '+2', trend: 'up', icon: Bot },
  { id: 'avg-latency', label: 'Avg. Latency', value: '124ms', change: '-8ms', trend: 'up', icon: Clock },
  { id: 'success-rate', label: 'Success Rate', value: '99.8%', change: '+0.1%', trend: 'up', icon: TrendingUp },
];

const recentActivity = [
  { id: 1, title: 'GPT-4o model deployed', time: '2 minutes ago', status: 'success' },
  { id: 2, title: 'New API key generated', time: '1 hour ago', status: 'info' },
  { id: 3, title: 'Webhook endpoint updated', time: '3 hours ago', status: 'warning' },
  { id: 4, title: 'Rate limit threshold hit', time: '5 hours ago', status: 'error' },
  { id: 5, title: 'Billing cycle renewed', time: '1 day ago', status: 'success' },
];

const quickActions = [
  { id: 'new-model', label: 'New Model', description: 'Deploy an AI model', icon: Bot, href: '#' },
  { id: 'api-keys', label: 'API Keys', description: 'Manage access keys', icon: Zap, href: '#' },
  { id: 'analytics', label: 'Analytics', description: 'View usage insights', icon: BarChart3, href: '#' },
  { id: 'settings', label: 'Settings', description: 'Configure project', icon: Settings, href: '#' },
];

const navItems = [
  { id: 'nav-dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', active: true },
  { id: 'nav-models', label: 'Models', icon: Bot, href: '#' },
  { id: 'nav-analytics', label: 'Analytics', icon: BarChart3, href: '#' },
  { id: 'nav-settings', label: 'Settings', icon: Settings, href: '#' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut, updateProfile } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'profile' | 'account'>('profile');

  // Edit profile state
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Resend verification email state
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendResult, setResendResult] = useState<string | null>(null);

  // Sync profile form when user or modal opens
  useEffect(() => {
    if (user?.profile) {
      setName(user.profile.name || '');
      setBio((user.profile.bio as string) || '');
    }
  }, [user, isSettingsOpen]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/sign-in');
    }
  }, [user, authLoading, router]);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    router.replace('/sign-in');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setSaveError('');
    setSaveSuccess(false);

    const { error: err } = await updateProfile({
      name: name.trim(),
      bio: bio.trim(),
    });

    if (err) {
      setSaveError(err.message || 'Failed to update profile.');
    } else {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
    setSavingProfile(false);
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;
    setResendingEmail(true);
    setResendResult(null);

    const { error: err } = await insforge.auth.resendVerificationEmail({
      email: user.email,
      redirectTo: `${window.location.origin}/sign-in`,
    });

    if (err) {
      setResendResult(err.message || 'Failed to send email');
    } else {
      setResendResult('Verification email sent to ' + user.email);
    }
    setResendingEmail(false);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const displayName = user.profile?.name || user.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-dvh bg-background flex">
      {/* Sidebar */}
      <aside
        id="sidebar"
        className="w-64 flex-shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col"
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center shadow-sm">
              <Sparkles size={15} className="text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight text-sidebar-foreground">Nuvra AI Studio</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => {
            const isSettings = item.id === 'nav-settings';
            return isSettings ? (
              <button
                key={item.id}
                id={item.id}
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground text-left"
              >
                <item.icon size={16} className="flex-shrink-0" />
                {item.label}
              </button>
            ) : (
              <Link
                key={item.id}
                id={item.id}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  item.active
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
                }`}
              >
                <item.icon size={16} className="flex-shrink-0" />
                {item.label}
                {item.active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary" />}
              </Link>
            );
          })}
        </nav>

        {/* User block */}
        <div className="p-3 border-t border-sidebar-border">
          <div
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-sidebar-accent/60 transition-colors group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{displayName}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">{user.email}</p>
            </div>
            <button
              id="sign-out-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleSignOut();
              }}
              disabled={signingOut}
              aria-label="Sign out"
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-sidebar-border/80 text-sidebar-foreground/60 hover:text-destructive transition-all"
            >
              {signingOut ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-border bg-card/60 backdrop-blur-sm flex items-center gap-4 px-6 sticky top-0 z-10">
          <div className="flex-1">
            <div className="relative w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                id="dashboard-search"
                type="search"
                placeholder="Search…"
                className="w-full h-9 pl-9 pr-4 text-sm rounded-lg border border-border bg-background/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>
          </div>
          <button id="notifications-btn" className="btn-ghost h-9 w-9 p-0 relative">
            <Bell size={16} className="text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
          </button>
          <ThemeToggle />
          <div className="w-px h-6 bg-border" />
          <button
            id="user-menu-btn"
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 btn-ghost h-9 px-2"
          >
            <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
            <span className="text-sm font-medium text-foreground hidden sm:block">{displayName}</span>
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Page header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">
                Good morning, {displayName.split(' ')[0]} 👋
              </h1>
              <p className="text-sm text-muted-foreground">
                Here&apos;s what&apos;s happening with your AI projects today.
              </p>
            </div>
            <button id="new-project-btn" className="btn-primary gap-2">
              <Plus size={16} />
              New Project
            </button>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, i) => (
              <div
                key={stat.id}
                id={stat.id}
                className="card-premium p-5"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <stat.icon size={15} className="text-primary" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground mb-2">{stat.value}</p>
                <div className="flex items-center gap-1.5">
                  <span className="flex items-center gap-0.5 text-xs font-medium text-success">
                    <ArrowUpRight size={12} />
                    {stat.change}
                  </span>
                  <span className="text-xs text-muted-foreground">vs. last month</span>
                </div>
              </div>
            ))}
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <div id="recent-activity" className="card-premium p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-foreground">Recent Activity</h2>
                <button className="text-xs text-primary hover:underline font-medium">View all</button>
              </div>
              <div className="space-y-3">
                {recentActivity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        item.status === 'success' ? 'bg-success' :
                        item.status === 'warning' ? 'bg-warning' :
                        item.status === 'error' ? 'bg-destructive' :
                        'bg-primary'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{item.title}</p>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{item.time}</span>
                    <ChevronRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div id="quick-actions" className="card-premium p-6">
              <h2 className="text-base font-semibold text-foreground mb-5">Quick Actions</h2>
              <div className="space-y-2.5">
                {quickActions.map((action) => {
                  const isSettings = action.id === 'settings';
                  return isSettings ? (
                    <button
                      key={action.id}
                      id={action.id}
                      type="button"
                      onClick={() => setIsSettingsOpen(true)}
                      className="w-full flex items-center gap-3.5 p-3.5 rounded-xl border border-border hover:bg-accent/60 hover:border-primary/20 transition-all group text-left"
                    >
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                        <action.icon size={16} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{action.label}</p>
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                      </div>
                      <ChevronRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </button>
                  ) : (
                    <Link
                      key={action.id}
                      id={action.id}
                      href={action.href}
                      className="flex items-center gap-3.5 p-3.5 rounded-xl border border-border hover:bg-accent/60 hover:border-primary/20 transition-all group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                        <action.icon size={16} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{action.label}</p>
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                      </div>
                      <ChevronRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Banner */}
          <div className="mt-6 rounded-2xl gradient-brand p-6 flex items-center justify-between overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,oklch(1_0_0/8%),transparent_60%)]" />
            <div className="relative z-10">
              <h3 className="text-white font-bold text-lg mb-1">Upgrade to Pro</h3>
              <p className="text-white/80 text-sm max-w-sm">
                Unlock unlimited API calls, advanced models, priority support, and custom domains.
              </p>
            </div>
            <button
              id="upgrade-btn"
              className="relative z-10 flex-shrink-0 ml-6 px-5 py-2.5 bg-white text-primary rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors shadow-sm"
            >
              Upgrade now →
            </button>
          </div>
        </main>
      </div>

      {/* Settings & Profile Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg card-premium p-6 shadow-2xl relative animate-slide-up border border-border">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Settings size={16} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Account & Profile Settings</h2>
                  <p className="text-xs text-muted-foreground">Manage your InsForge user profile & credentials</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="btn-ghost p-1.5 h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border mb-5 gap-2">
              <button
                type="button"
                onClick={() => setActiveSettingsTab('profile')}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
                  activeSettingsTab === 'profile'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Profile Details
              </button>
              <button
                type="button"
                onClick={() => setActiveSettingsTab('account')}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
                  activeSettingsTab === 'account'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                InsForge Auth & Account
              </button>
            </div>

            {/* Profile Tab */}
            {activeSettingsTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="input-base"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Bio
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself or your AI project…"
                    className="input-base resize-none py-2"
                  />
                </div>

                {saveError && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                    {saveError}
                  </div>
                )}

                {saveSuccess && (
                  <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-success text-xs flex items-center gap-2">
                    <Check size={14} />
                    Profile updated successfully!
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(false)}
                    className="btn-ghost text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="btn-primary text-xs h-9 px-4"
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        Saving…
                      </>
                    ) : (
                      'Save Profile'
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Account Tab */}
            {activeSettingsTab === 'account' && (
              <div className="space-y-4 text-sm">
                <div className="p-3.5 rounded-xl border border-border bg-muted/30 space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">InsForge User ID</p>
                    <p className="font-mono text-xs text-foreground mt-0.5 select-all">{user.id}</p>
                  </div>
                  <div className="border-t border-border pt-2 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-xs font-medium text-foreground mt-0.5">{user.email}</p>
                    </div>
                    <div>
                      {user.emailVerified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-success/15 text-success">
                          <ShieldCheck size={12} />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-warning/15 text-warning">
                          <ShieldAlert size={12} />
                          Unverified
                        </span>
                      )}
                    </div>
                  </div>
                  {!user.emailVerified && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        disabled={resendingEmail}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        {resendingEmail ? 'Sending…' : resendResult || 'Send verification email'}
                      </button>
                    </div>
                  )}
                  {user.providers && user.providers.length > 0 && (
                    <div className="border-t border-border pt-2">
                      <p className="text-xs text-muted-foreground">Connected Providers</p>
                      <div className="flex gap-1.5 mt-1">
                        {user.providers.map((p) => (
                          <span key={p} className="px-2 py-0.5 rounded-md bg-secondary text-xs uppercase font-mono">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-border pt-2 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Postgres Database</p>
                      <p className="text-xs font-mono text-foreground mt-0.5">public.users table</p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      Synced
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="text-xs text-destructive hover:underline font-medium flex items-center gap-1.5"
                  >
                    <LogOut size={13} />
                    Sign out of account
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(false)}
                    className="btn-primary text-xs h-9 px-4"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
