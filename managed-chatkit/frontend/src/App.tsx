import { ChatKitPanel } from "./components/ChatKitPanel";

export default function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-end">
      <div className="mx-auto w-full max-w-[90%]">
        <ChatKitPanel />
      </div>
    </main>
  );
}
