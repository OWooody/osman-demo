import { useMemo, useRef, useState, useEffect } from "react";
import { ChatKit, useChatKit } from "@openai/chatkit-react";
import type { ChatKitOptions } from "@openai/chatkit-react";
import { createClientSecretFetcher, workflowId } from "../lib/chatkitSession";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

export function ChatKitPanel() {
  const [showReport, setShowReport] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);

  const getClientSecret = useMemo(
    () => createClientSecretFetcher(workflowId),
    []
  );

  const chatkitRef = useRef<ReturnType<typeof useChatKit> | null>(null);

  // Profit and Loss data - matching the design
  const profitLossData = [
    { month: "Jan", profit: 18000 },
    { month: "Feb", profit: 21000 },
    { month: "Mar", profit: 19500 },
    { month: "Apr", profit: 23000 },
    { month: "May", profit: 25000 },
    { month: "Jun", profit: 24000 },
    { month: "Jul", profit: 26000 },
    { month: "Aug", profit: 24500 },
    { month: "Sep", profit: 27000 },
    { month: "Oct", profit: 26100 },
    { month: "Nov", profit: 27500 },
    { month: "Dec", profit: 28300 },
  ];

  // Current month data
  const currentMonth = profitLossData[profitLossData.length - 1];
  const previousMonth = profitLossData[profitLossData.length - 2];
  const currentProfit = currentMonth.profit;
  const previousProfit = previousMonth.profit;
  const profitChange = ((currentProfit - previousProfit) / previousProfit) * 100;
  
  // Revenue and Expenses for footer
  const currentRevenue = 124500;
  const currentExpenses = 96200;

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
        console.log("Tool params:", toolCall.params);
        
        if (toolCall.name === "generate_report") {
          console.log("📊 generate_report tool called with:", toolCall);
          setShowReport(true);
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
          console.log("=== WIDGET ACTION TRIGGERED ===");
          console.log("Action type:", action.type);
          console.log("Action payload:", action.payload);
          console.log("Action payload type:", typeof action.payload);
          console.log("Action payload keys:", action.payload && typeof action.payload === 'object' ? Object.keys(action.payload) : 'N/A');
          console.log("Full action object:", JSON.stringify(action, null, 2));
          console.log("Widget item:", widgetItem);
          console.log("Widget item keys:", widgetItem ? Object.keys(widgetItem) : 'N/A');
          console.log("Widget item widget:", widgetItem?.widget);
          console.log("Widget item widget keys:", widgetItem?.widget && typeof widgetItem.widget === 'object' ? Object.keys(widgetItem.widget) : 'N/A');

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
                    
                    // Show invoice in right panel when sending "Thanks" message
                    console.log("=== SHOWING INVOICE (Thanks message sent) ===");
                    console.log("Action payload:", action.payload);
                    console.log("Widget item:", widgetItem);
                    
                    // Extract invoice data from payload
                    let invoice: any = {};
                    if (action.payload && typeof action.payload === 'object') {
                      invoice = action.payload;
                    } else if (action.payload) {
                      invoice = { data: action.payload, confirmed: true };
                    } else {
                      // Create a basic invoice structure from widget if available
                      const widget = widgetItem?.widget;
                      if (widget && typeof widget === 'object') {
                        invoice = { 
                          confirmed: true, 
                          timestamp: new Date().toISOString(),
                          widgetData: widget
                        };
                      } else {
                        invoice = { confirmed: true, timestamp: new Date().toISOString() };
                      }
                    }
                    
                    console.log("Setting invoice data:", invoice);
                    setInvoiceData(invoice);
                    setShowReport(false); // Hide report if showing
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

          // Additional logging for debugging
          if (action.type === "request.submit") {
            console.log("=== REQUEST.SUBMIT - Additional Info ===");
            console.log("Payload (stringified):", JSON.stringify(action.payload, null, 2));
            console.log("Widget (stringified):", JSON.stringify(widgetItem?.widget, null, 2));
          } else if (action.type === "request.discard") {
            console.log("=== REQUEST.DISCARD DETECTED ===");
            console.log("User discarded/cancelled:", action.payload);
            // Clear invoice if discarded
            setInvoiceData(null);
            console.log("Invoice data cleared");
          }
        },
      },
    }),
    [getClientSecret]
  );

  const chatkit = useChatKit(options);
  chatkitRef.current = chatkit;

  // Debug: Log invoiceData state changes
  useEffect(() => {
    console.log("=== INVOICE DATA STATE CHANGED ===");
    console.log("invoiceData:", invoiceData);
    console.log("invoiceData type:", typeof invoiceData);
    console.log("invoiceData keys:", invoiceData && typeof invoiceData === 'object' ? Object.keys(invoiceData) : 'N/A');
    console.log("showReport:", showReport);
  }, [invoiceData, showReport]);


  return (
    <div className="flex h-[95vh] w-full gap-4">
      {/* Left Panel - ChatKit */}
      <div className="flex-1 rounded-2xl bg-white shadow-sm transition-colors dark:bg-slate-900">
        <ChatKit control={chatkit.control} className="h-full w-full" />
      </div>
      
      {/* Right Panel - White Panel */}
      <div className="flex-1 rounded-2xl bg-white shadow-sm transition-colors p-6 overflow-visible" style={{ fontFamily: '"OpenAI Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
        {(() => {
          console.log("=== RENDERING RIGHT PANEL ===");
          console.log("invoiceData:", invoiceData);
          console.log("showReport:", showReport);
          console.log("Will show invoice:", !!invoiceData);
          console.log("Will show report:", showReport && !invoiceData);
          return null;
        })()}
        {invoiceData ? (
          <div className="h-full flex flex-col overflow-y-auto">
            {/* Invoice Header */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Invoice Created</h2>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600">Invoice has been successfully created</span>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="flex-1 border border-gray-200 rounded-lg p-6 bg-gray-50">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h3>
                
                {/* Invoice Number */}
                <div className="mb-4">
                  <span className="text-sm text-gray-600">Invoice Number:</span>
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    {invoiceData.invoiceNumber || 'INV-2025-001'}
                  </span>
                </div>

                {/* Client Information */}
                <div className="mb-4">
                  <span className="text-sm text-gray-600">Client:</span>
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    {invoiceData.client || invoiceData.clientName || 'Acme Corporation'}
                  </span>
                </div>

                {/* Date */}
                <div className="mb-4">
                  <span className="text-sm text-gray-600">Date:</span>
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    {invoiceData.date || invoiceData.invoiceDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>

                {/* Due Date */}
                <div className="mb-4">
                  <span className="text-sm text-gray-600">Due Date:</span>
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    {invoiceData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>

                {/* Line Items */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <span className="text-sm font-semibold text-gray-900 block mb-3">Line Items:</span>
                  <div className="space-y-3">
                    {(invoiceData.items || invoiceData.lineItems || [
                      { description: 'Web Development Services', quantity: 40, rate: 250, amount: 10000 },
                      { description: 'UI/UX Design', quantity: 20, rate: 125, amount: 2500 }
                    ]).map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-start pb-2 border-b border-gray-100 last:border-0">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{item.description || item.name}</div>
                          {item.quantity && item.rate && (
                            <div className="text-xs text-gray-500 mt-1">
                              {item.quantity} × {item.currency || 'SAR'} {item.rate.toLocaleString()}
                            </div>
                          )}
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.currency || 'SAR'} {(item.amount || item.price || 0).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total Amount */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-gray-900">Total Amount:</span>
                    <span className="text-2xl font-bold text-[#8000ff]">
                      {invoiceData.currency || 'SAR'} {(invoiceData.amount || invoiceData.total || invoiceData.totalAmount || 12500).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Show raw data if available for debugging */}
                {process.env.NODE_ENV === 'development' && (
                  <details className="mt-6 pt-4 border-t border-gray-200">
                    <summary className="text-xs text-gray-500 cursor-pointer mb-2">Debug: View raw data</summary>
                    <pre className="text-xs bg-white p-3 rounded border border-gray-200 overflow-auto">
                      {JSON.stringify(invoiceData, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        ) : showReport ? (
          <div className="h-full flex flex-col overflow-visible">
            {/* Header Section */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Profit & Loss</h2>
                <div className="text-4xl font-semibold text-[#8000ff] mb-1">
                  {currentProfit.toLocaleString()}
                </div>
                <div className="text-sm font-medium text-[#8000ff]">
                  {profitChange >= 0 ? '+' : ''}{profitChange.toFixed(1)}% vs {previousMonth.month} 2025
                </div>
              </div>
              <div className="px-3 py-1.5 rounded-full bg-gray-100 text-sm text-gray-700">
                Dec 2025
              </div>
            </div>

            {/* Chart Section */}
            <div className="flex-1 min-h-0 mb-6" style={{ marginLeft: '-1.5rem', marginRight: '-1.5rem', width: 'calc(100% + 3rem)' }}>
              <ResponsiveContainer width="100%" height="100%" style={{ padding: 0, margin: 0 }}>
                <AreaChart
                  data={profitLossData}
                  margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8000ff" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#8000ff" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={true} vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={false}
                  />
                  <YAxis 
                    width={0}
                    axisLine={false}
                    tickLine={false}
                    tick={false}
                    domain={[0, 'auto']}
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="#8000ff"
                    strokeWidth={2.5}
                    fill="url(#profitGradient)"
                    baseValue={0}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Footer Section */}
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">Revenue</span>
                <span className="text-sm font-medium text-gray-900">
                  SAR {currentRevenue.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Expenses</span>
                <span className="text-sm font-medium text-gray-900">
                  SAR {currentExpenses.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            <p className="text-lg">Generate a report or create an invoice to view data</p>
          </div>
        )}
      </div>
    </div>
  );
}
