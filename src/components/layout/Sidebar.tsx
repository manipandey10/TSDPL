import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Lightbulb,
  Grid3X3,
  BarChart3,
  Activity,
  GitBranch,
  CheckCircle2,
  Calculator,
  Workflow,
  Mail,
  Settings,
  ChevronDown,
  ChevronRight,
  Building2,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Lightbulb, label: 'Idea Workspace', path: '/dashboard/ideas' },
  { icon: Grid3X3, label: 'Project Grid', path: '/dashboard/projects' },
  { icon: BarChart3, label: 'Analytics', path: '/dashboard/analytics' },
  { icon: Activity, label: 'Activity Logs', path: '/dashboard/activity' },
  { icon: Workflow, label: 'Workflow Tracker', path: '/dashboard/workflow' },
];

const workflowItems: NavItem[] = [
  { icon: CheckCircle2, label: 'D0 Validation', path: '/dashboard/d0-validation' },
  { icon: Calculator, label: 'D1 Score Matrix', path: '/dashboard/d1-score' },
  { icon: GitBranch, label: 'D2-D4 Workflow', path: '/dashboard/d2-d4' },
];

const teamItems: NavItem[] = [
  { icon: Mail, label: 'Email Notifications', path: '/dashboard/notifications' },
  { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
];

function NavSection({ title, items, collapsedItems, location }: {
  title: string;
  items?: NavItem[];
  collapsedItems?: NavItem[];
  location: ReturnType<typeof useLocation>;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const allItems = [...(items || []), ...(collapsedItems || [])];

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-200 transition-colors"
      >
        <span>{title}</span>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>
      {isExpanded && (
        <nav className="space-y-1">
          {allItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`
              }
            >
              <item.icon className={`w-5 h-5 ${
                location.pathname === item.path ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
              }`} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 backdrop-blur-xl border-r z-50 transform transition-transform duration-300 ease-out lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${'bg-slate-900/95 border-slate-700/50'}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-sm">TSDPL BI</h1>
                <p className="text-slate-500 text-xs">Corporate Workflow</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto px-3 py-4">
            {/* Workplace Section */}
            <NavSection
              title="Workplace"
              items={navItems}
              location={location}
            />

            {/* Workflow Tools Section */}
            <NavSection
              title="Workflow Tools"
              collapsedItems={workflowItems}
              location={location}
            />

            {/* Team Section */}
            <NavSection
              title="Team & Admin"
              collapsedItems={teamItems}
              location={location}
            />
          </div>

          {/* Footer */}
          <div className="px-4 py-4 border-t border-slate-700/50">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/50">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-slate-400">System Online</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
