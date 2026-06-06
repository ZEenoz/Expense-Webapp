"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import MobileBottomNav from "./MobileBottomNav";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  // เริ่มต้น false เสมอเพื่อป้องกัน SSR hydration flash
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile); // desktop = open, mobile = closed
    };

    checkMobile();
    setMounted(true);
    window.addEventListener("resize", checkMobile);

    // Listen for global toggle event from Navbar (mobile hamburger)
    const handleToggle = () => setIsSidebarOpen((prev) => !prev);
    window.addEventListener("toggleSidebar", handleToggle as EventListener);

    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("toggleSidebar", handleToggle as EventListener);
    };
  }, []);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => { if (isMobile) setIsSidebarOpen(false); };

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} onLinkClick={closeSidebar} />

      {/* Main Content — margin เปลี่ยนตาม sidebar state บน desktop เท่านั้น */}
      <div
        className={`
          flex-1 flex flex-col min-w-0
          transition-all duration-300
          ${mounted && !isMobile
            ? isSidebarOpen ? "lg:ml-64" : "lg:ml-20"
            : ""}
          } ${mounted && isMobile ? "pb-20" : ""}
        `}
      >
        {children}
      </div>

      <MobileBottomNav />
    </div>
  );
}
