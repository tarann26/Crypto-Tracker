
import { Link, useLocation } from "react-router-dom";
import { Home, TrendingUp, BarChart3, PieChart } from "lucide-react";

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    {
      path: "/",
      label: "Dashboard",
      icon: Home,
    },
    {
      path: "/recommendations",
      label: "Crypto",
      icon: TrendingUp,
    },
    {
      path: "/stocks",
      label: "Stocks",
      icon: BarChart3,
    },
    {
      path: "/portfolio",
      label: "Portfolio",
      icon: PieChart,
    },
  ];

  return (
    <nav className="glass-card p-4 rounded-lg mb-8 animate-fade-in border border-white border-opacity-10">
      <div className="flex flex-wrap gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 font-medium ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "hover:bg-secondary hover:bg-opacity-50 hover:text-foreground text-muted-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;
