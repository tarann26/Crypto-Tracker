
import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Coins,
  Activity,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

const Sidebar = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    {
      path: "/",
      label: "Dashboard",
      icon: Home,
      description: "Overview & Analytics"
    },
    {
      path: "/recommendations",
      label: "Crypto Recommendations",
      icon: TrendingUp,
      description: "Solana Memecoins"
    },
    {
      path: "/stocks",
      label: "Stocks",
      icon: BarChart3,
      description: "Stock Market Data"
    },
    {
      path: "/portfolio",
      label: "Portfolio",
      icon: PieChart,
      description: "Track Holdings"
    },
  ];

  const quickLinks = [
    {
      path: "/recommendations?tab=volume",
      label: "High Volume Movers",
      icon: Activity,
      description: "Trending Volume"
    },
    {
      path: "/recommendations?tab=memes",
      label: "Memecoins",
      icon: Coins,
      description: "Solana Memes"
    },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-background border-r border-secondary z-50 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-secondary">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">CryptoTracker</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-secondary rounded-md transition-colors"
          >
            {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {/* Main Navigation */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Main
              </div>
            )}
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "hover:bg-secondary hover:bg-opacity-50 text-muted-foreground hover:text-foreground"
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.label}</div>
                      <div className="text-xs opacity-70 truncate">{item.description}</div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Quick Links */}
          <div className="space-y-1 pt-4">
            {!isCollapsed && (
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Quick Access
              </div>
            )}
            {quickLinks.map((item) => {
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group hover:bg-secondary hover:bg-opacity-50 text-muted-foreground hover:text-foreground"
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{item.label}</div>
                      <div className="text-xs opacity-70 truncate">{item.description}</div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-secondary">
            <div className="text-xs text-muted-foreground text-center">
              © 2024 CryptoTracker
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
