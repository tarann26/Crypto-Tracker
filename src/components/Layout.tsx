
import { ReactNode } from "react";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-16 lg:ml-64 transition-all duration-300">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
