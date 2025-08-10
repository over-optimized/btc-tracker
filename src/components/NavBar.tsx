import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import BrandHeader from './BrandHeader';
import ThemeToggle from './ThemeToggle';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/upload', label: 'Upload' },
  { to: '/charts', label: 'Charts' },
  { to: '/tax', label: 'Tax Reports' },
];

const NavBar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div>
      <nav className="nav-base">
        <div className="max-w-6xl mx-auto px-4">
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-between py-4">
            {/* Brand/Logo */}
            <BrandHeader size="small" showSubtitle={false} />
            
            {/* Navigation Links */}
            <ul className="flex items-center gap-6">
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `text-sm font-medium px-3 py-2 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                          : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`
                    }
                    end={item.to === '/'}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>

            {/* Theme Toggle */}
            <ThemeToggle variant="icon" />
          </div>

          {/* Mobile Navigation Header */}
          <div className="md:hidden flex items-center justify-between py-4">
            <BrandHeader size="small" showSubtitle={false} />
            <div className="flex items-center gap-2">
              <ThemeToggle variant="icon" />
              <button
                onClick={toggleMenu}
                className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <ul className="py-2 space-y-1">
                {navItems.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={closeMenu}
                      className={({ isActive }) =>
                        `block px-4 py-3 mx-2 text-base font-medium rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-600 dark:border-blue-400'
                            : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`
                      }
                      end={item.to === '/'}
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </nav>
      {/* Subtle theme-consistent spacing */}
      <div className="h-4" style={{backgroundColor: 'var(--color-bg-page)'}}></div>
    </div>
  );
};

export default NavBar;
