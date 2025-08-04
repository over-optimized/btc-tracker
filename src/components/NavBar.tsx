import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/upload', label: 'Upload' },
  { to: '/charts', label: 'Charts' },
];

const NavBar: React.FC = () => (
  <nav className="w-full bg-white shadow mb-8">
    <div className="max-w-6xl mx-auto px-4">
      <ul className="flex gap-6 py-4">
        {navItems.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `text-lg font-medium px-2 py-1 rounded transition-colors ${
                  isActive ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:text-blue-500'
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
  </nav>
);

export default NavBar;
