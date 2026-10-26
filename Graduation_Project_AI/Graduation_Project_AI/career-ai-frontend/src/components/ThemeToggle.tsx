import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  const themes = [
    { id: 'light', icon: Sun, label: 'Light' },
    { id: 'dark',  icon: Moon, label: 'Dark'  },
  ] as const;

  return (
    <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
      {themes.map((t) => {
        const Icon = t.icon;
        const isActive = theme === t.id;

        return (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            title={`Switch to ${t.label} mode`}
            className={`relative flex items-center justify-center p-2 rounded-lg text-sm font-medium transition-colors ${
              isActive ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="theme-toggle-bubble"
                className="absolute inset-0 bg-white/10 rounded-lg"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <div className="relative z-10">
              <Icon className="w-3.5 h-3.5" />
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ThemeToggle;
