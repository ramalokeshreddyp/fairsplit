import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Plus, BarChart3, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';

interface MobileLayoutProps {
  children: React.ReactNode;
  onCreateGroup?: () => void;
}

const NAV_ITEMS = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/#insights', icon: Lightbulb, label: 'Insights' },
  { path: '/#stats', icon: BarChart3, label: 'Stats' },
];

export function MobileLayout({ children, onCreateGroup }: MobileLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {children}

      {/* Bottom Navigation - mobile only */}
      <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-card/95 backdrop-blur-xl border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {NAV_ITEMS.map(item => {
            const isActive = location.pathname === '/' && item.path.startsWith('/');
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path.split('#')[0])}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={onCreateGroup}
            className="flex flex-col items-center gap-1 px-3 py-1.5"
          >
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center -mt-5 shadow-lg glow-primary">
              <Plus className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-[10px] font-medium text-primary">New</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
