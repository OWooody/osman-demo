import { useMemo, useRef } from "react";
import { ChatKit, useChatKit } from "@openai/chatkit-react";
import type { ChatKitOptions } from "@openai/chatkit-react";
import { createClientSecretFetcher, workflowId } from "../lib/chatkitSession";

export function ChatKitPanel() {
  const getClientSecret = useMemo(
    () => createClientSecretFetcher(workflowId),
    []
  );

  const chatkitRef = useRef<ReturnType<typeof useChatKit> | null>(null);

  const options: ChatKitOptions = useMemo(
    () => ({
      api: {
        getClientSecret,
      },
      theme: {
        colorScheme: "light",
        radius: "pill",
        density: "normal",
        color: {
          accent: {
            primary: "#8000ff",
            level: 1,
          },
        },
        typography: {
          baseSize: 16,
          fontFamily:
            '"OpenAI Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
          fontFamilyMono:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "DejaVu Sans Mono", "Courier New", monospace',
          fontSources: [
            {
              family: "OpenAI Sans",
              src: "https://cdn.openai.com/common/fonts/openai-sans/v2/OpenAISans-Regular.woff2",
              weight: 400,
              style: "normal",
              display: "swap",
            },
            // ...and 7 more font sources
          ],
        },
      },
      composer: {
        attachments: {
          enabled: true,
          maxCount: 5,
          maxSize: 10485760,
        },
        tools: [
          {
            id: "search_docs",
            label: "Search docs",
            shortLabel: "Docs",
            placeholderOverride: "Search documentation",
            icon: "book-open",
            pinned: false,
          },
          {
            id: "generate_report",
            label: "Generate report",
            shortLabel: "Report",
            placeholderOverride: "Generate profit and loss report",
            icon: "chart",
            pinned: false,
          },
        ],
      },
      startScreen: {
        greeting: "",
        prompts: [
          {
            icon: "document",
            label: "Create an invoice for a client",
            prompt: "Create an invoice for a client",
          },
          {
            icon: "check-circle",
            label: "Reconcile my bank account",
            prompt: "Reconcile my bank account",
          },
          {
            icon: "notebook",
            label: "Categorize my business expenses",
            prompt: "Categorize my business expenses",
          },
          {
            icon: "calendar",
            label: "Track my bills and due dates",
            prompt: "Track my bills and due dates",
          },
          {
            icon: "chart",
            label: "Generate a profit and loss report",
            prompt: "Generate a profit and loss report",
          },
        ],
      },
      onClientTool: async (toolCall) => {
        console.log("🔧 Tool called from workflow:", toolCall);
        console.log("Tool name:", toolCall.name);
        console.log("Tool arguments:", toolCall.arguments);
        
        if (toolCall.name === "generate_report") {
          console.log("📊 generate_report tool called with:", toolCall);
        }
        
        // Return a result for the tool call
        // You can return any data structure here
        return {
          success: true,
          message: `Tool ${toolCall.name} executed successfully`,
        };
      },
      widgets: {
        async onAction(action, widgetItem) {
          console.log("Widget action triggered:", action.type, action.payload);
          console.log("Widget item:", widgetItem);

          // Forward the action back to the workflow so it can respond
          const chatkit = chatkitRef.current;
          if (chatkit && "sendCustomAction" in chatkit && typeof chatkit.sendCustomAction === "function") {
            try {
              await chatkit.sendCustomAction(
                {
                  type: action.type,
                  payload: action.payload,
                },
                widgetItem?.id
              );
              console.log(`Action ${action.type} forwarded to workflow`);

              // Show success confirmation in the chat
              if (chatkit && "sendUserMessage" in chatkit && typeof chatkit.sendUserMessage === "function") {
                try {
                  // Determine success message based on action type
                  let successMessage = "✓ Action completed successfully";
                  if (action.type === "request.submit") {
                    successMessage = "✓ Thanks";
                  } else if (action.type === "request.discard") {
                    successMessage = "✓ Discard";
                  }

                  await chatkit.sendUserMessage({ text: successMessage });
                } catch (error) {
                  console.error("Error sending success message:", error);
                }
              }
            } catch (error) {
              console.error("Error forwarding action to workflow:", error);
              
              // Show error message in chat if action failed
              if (chatkit && "sendUserMessage" in chatkit && typeof chatkit.sendUserMessage === "function") {
                try {
                  await chatkit.sendUserMessage({ 
                    text: "❌ Action failed. Please try again." 
                  });
                } catch (msgError) {
                  console.error("Error sending error message:", msgError);
                }
              }
            }
          }

          // Handle specific action types if needed
          if (action.type === "request.submit") {
            console.log("User confirmed/submitted:", action.payload);
            // Add your custom client-side logic here if needed
          } else if (action.type === "request.discard") {
            console.log("User discarded/cancelled:", action.payload);
            // Add your custom client-side logic here if needed
          }
        },
      },
    }),
    [getClientSecret]
  );

  const chatkit = useChatKit(options);
  chatkitRef.current = chatkit;


  return (
    <div className="flex h-[95vh] w-full gap-4">
      {/* Left Panel - ChatKit */}
      <div className="flex-1 rounded-2xl bg-white shadow-sm transition-colors dark:bg-slate-900">
        <ChatKit control={chatkit.control} className="h-full w-full" />
      </div>
      
      {/* Right Panel - White Panel */}
      <div className="flex-1 rounded-2xl bg-white shadow-sm transition-colors">
        {/* Add your content here */}
      </div>
    </div>
  );
}
