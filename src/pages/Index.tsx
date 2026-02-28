import { useState } from "react";
import Sidebar, { type Module } from "@/components/tempest/Sidebar";
import StatusBar from "@/components/tempest/StatusBar";
import OverviewPanel from "@/components/tempest/OverviewPanel";
import ModulePanel from "@/components/tempest/ModulePanel";
import ChatPanel from "@/components/tempest/ChatPanel";

const Index = () => {
  const [active, setActive] = useState<Module>("overview");

  const renderContent = () => {
    switch (active) {
      case "overview":
        return <OverviewPanel />;
      case "chat":
        return <ChatPanel />;
      default:
        return <ModulePanel module={active} />;
    }
  };

  return (
    <div className="flex h-screen bg-background gradient-mesh">
      <Sidebar active={active} onNavigate={setActive} />
      <div className="flex-1 flex flex-col min-w-0">
        <StatusBar />
        <main className="flex-1 overflow-y-auto data-grid-bg">{renderContent()}</main>
      </div>
    </div>
  );
};

export default Index;
