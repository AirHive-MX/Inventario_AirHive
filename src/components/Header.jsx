'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeProvider';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-[#2A47F6] backdrop-blur-md border-b border-ah-gray/50 dark:border-[#2A47F6] shadow-sm dark:shadow-md dark:shadow-black/20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo + Title */}
          <div className="flex items-center gap-3 sm:gap-12">
            <Link href="/">
              <img
                src="/logo.png"
                alt="Air Hive Logo"
                className={`h-9 sm:h-12 w-auto ${theme === 'dark' ? 'brightness-0 invert' : ''}`}
              />
            </Link>
            <div>
              <Link href="/">
                <h1 className="text-lg sm:text-3xl font-bold text-ah-navy dark:text-white tracking-tight">
                  Inventario Air Hive
                </h1>
              </Link>
              <p className="text-sm text-ah-charcoal/50 dark:text-white/70 hidden sm:block">
                Gestión de inventario de componentes
              </p>
            </div>
          </div>

          {/* Right side: nav + theme toggle */}
          <div className="flex items-center gap-2 sm:gap-5">
            {/* Activity log link */}
            <Link
              href={pathname === '/actividad' ? '/' : '/actividad'}
              className={`flex items-center gap-2 px-3 sm:px-5 h-10 sm:h-12 rounded-full font-semibold text-sm sm:text-base transition-colors ${
                pathname === '/actividad'
                  ? 'bg-white/20 dark:bg-white/20 text-ah-navy dark:text-white border border-ah-gray/50 dark:border-white/30'
                  : 'bg-gray-100 dark:bg-white/15 text-ah-charcoal dark:text-white hover:bg-gray-200 dark:hover:bg-white/25 border border-transparent dark:border-white/20'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">
                {pathname === '/actividad' ? 'Inventario' : 'Actividad'}
              </span>
            </Link>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="theme-toggle w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gray-100 dark:bg-white/15 hover:bg-gray-200 dark:hover:bg-white/25 border border-transparent dark:border-white/20 cursor-pointer transition-colors"
              title={theme === 'light' ? 'Cambiar a modo noche' : 'Cambiar a modo día'}
            >
              <img
                src={theme === 'light' ? '/luna.png' : '/sol.png'}
                alt={theme === 'light' ? 'Modo noche' : 'Modo día'}
                className={`w-5 h-5 sm:w-7 sm:h-7 object-contain ${theme === 'dark' ? 'brightness-0 invert' : ''}`}
              />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
