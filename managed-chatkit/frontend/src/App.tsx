import { ChatKitPanel } from "./components/ChatKitPanel";

export default function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-end bg-amber-50">
      <div className="mx-auto w-full max-w-7xl">
        <ChatKitPanel />
      </div>
    </main>
  );
}
