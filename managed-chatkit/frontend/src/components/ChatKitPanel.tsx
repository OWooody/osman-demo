import { useMemo, useRef, useState, useEffect } from "react";
import { ChatKit, useChatKit } from "@openai/chatkit-react";
import type { ChatKitOptions } from "@openai/chatkit-react";
import { createClientSecretFetcher, workflowId } from "../lib/chatkitSession";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

// Helper functions for localStorage persistence
const STORAGE_KEYS = {
  INVOICE_DATA: 'chatkit_invoice_data',
  SHOW_REPORT: 'chatkit_show_report',
};

function loadStoredState() {
  try {
    const storedInvoice = localStorage.getItem(STORAGE_KEYS.INVOICE_DATA);
    const storedShowReport = localStorage.getItem(STORAGE_KEYS.SHOW_REPORT);
    
    return {
      invoiceData: storedInvoice ? JSON.parse(storedInvoice) : null,
      showReport: storedShowReport === 'true',
    };
  } catch (error) {
    console.error('Error loading stored state:', error);
    return { invoiceData: null, showReport: false };
  }
}

function saveState(invoiceData: any, showReport: boolean) {
  try {
    if (invoiceData) {
      localStorage.setItem(STORAGE_KEYS.INVOICE_DATA, JSON.stringify(invoiceData));
    } else {
      localStorage.removeItem(STORAGE_KEYS.INVOICE_DATA);
    }
    localStorage.setItem(STORAGE_KEYS.SHOW_REPORT, String(showReport));
  } catch (error) {
    console.error('Error saving state:', error);
  }
}

export function ChatKitPanel() {
  // Initialize state from localStorage if available
  const initialState = loadStoredState();
  const [showReport, setShowReport] = useState(initialState.showReport);
  const [invoiceData, setInvoiceData] = useState<any>(initialState.invoiceData);

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
          saveState(null, true); // Save report state
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
                    saveState(invoice, false); // Save invoice state
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
            saveState(null, showReport); // Update storage
            console.log("Invoice data cleared");
          }
        },
      },
    }),
    [getClientSecret]
  );

  const chatkit = useChatKit(options);
  chatkitRef.current = chatkit;

  // Sync state to localStorage whenever it changes
  useEffect(() => {
    saveState(invoiceData, showReport);
  }, [invoiceData, showReport]);

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
      <div className="flex-1 bg-white shadow-sm transition-colors p-6 overflow-visible" style={{ fontFamily: '"OpenAI Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
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
            {/* Invoice Details - Realistic Invoice Design */}
            <div className="invoice-container flex-1 p-8 bg-white my-4">
              <div className="max-w-2xl mx-auto">
                {/* Invoice Header Section */}
                <div className="mb-8 pb-6 border-b-2 border-gray-300">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
                      <div className="text-sm text-gray-600">
                        <div>Invoice Number: <span className="font-semibold text-gray-900">{invoiceData.invoiceNumber || 'INV-2025-001'}</span></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600 mb-1">Date:</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {invoiceData.date || invoiceData.invoiceDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <div className="text-xs uppercase text-gray-500 mb-2">Bill From</div>
                      <div className="text-sm text-gray-900 font-semibold">Your Company Name</div>
                      <div className="text-sm text-gray-600">123 Business Street</div>
                      <div className="text-sm text-gray-600">City, State 12345</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase text-gray-500 mb-2">Bill To</div>
                      <div className="text-sm text-gray-900 font-semibold">{invoiceData.client || invoiceData.clientName || 'Acme Corporation'}</div>
                      <div className="text-sm text-gray-600">Client Address</div>
                      <div className="text-sm text-gray-600">City, State ZIP</div>
                    </div>
                  </div>
                </div>
                
                {/* Line Items Table */}
                <div className="mb-8">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-300">
                        <th className="text-left py-3 px-4 text-xs uppercase text-gray-600 font-semibold">Description</th>
                        <th className="text-center py-3 px-4 text-xs uppercase text-gray-600 font-semibold">Quantity</th>
                        <th className="text-right py-3 px-4 text-xs uppercase text-gray-600 font-semibold">Rate</th>
                        <th className="text-right py-3 px-4 text-xs uppercase text-gray-600 font-semibold">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(invoiceData.items || invoiceData.lineItems || [
                        { description: 'Web Development Services', quantity: 40, rate: 250, amount: 10000 },
                        { description: 'UI/UX Design', quantity: 20, rate: 125, amount: 2500 }
                      ]).map((item: any, index: number) => (
                        <tr key={index} className="border-b border-gray-200">
                          <td className="py-4 px-4 text-sm text-gray-900">{item.description || item.name}</td>
                          <td className="py-4 px-4 text-sm text-gray-600 text-center">{item.quantity || '-'}</td>
                          <td className="py-4 px-4 text-sm text-gray-600 text-right">{item.currency || 'SAR'} {(item.rate || 0).toLocaleString()}</td>
                          <td className="py-4 px-4 text-sm font-semibold text-gray-900 text-right">{item.currency || 'SAR'} {(item.amount || item.price || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Section */}
                <div className="flex justify-end mb-8">
                  <div className="w-64">
                    <div className="flex justify-between py-2 text-sm text-gray-600">
                      <span>Subtotal:</span>
                      <span>{invoiceData.currency || 'SAR'} {((invoiceData.amount || invoiceData.total || invoiceData.totalAmount || 12500) * 0.95).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2 text-sm text-gray-600">
                      <span>Tax (5%):</span>
                      <span>{invoiceData.currency || 'SAR'} {((invoiceData.amount || invoiceData.total || invoiceData.totalAmount || 12500) * 0.05).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-4 border-t-2 border-gray-300 mt-2">
                      <span className="text-lg font-bold text-gray-900">Total:</span>
                      <span className="text-2xl font-bold text-[#8000ff]">
                        {invoiceData.currency || 'SAR'} {(invoiceData.amount || invoiceData.total || invoiceData.totalAmount || 12500).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Terms */}
                <div className="pt-6 border-t border-gray-200">
                  <div className="text-xs text-gray-500 mb-2">Payment Terms:</div>
                  <div className="text-sm text-gray-700">
                    Payment due by: <span className="font-semibold">{invoiceData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-4">
                    Thank you for your business!
                  </div>
                </div>
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
          <div className="h-full flex flex-col items-center justify-center text-gray-600">
            {/* Welcome Dashboard View */}
            <div className="max-w-md text-center space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-gray-900">Welcome to Your Dashboard</h2>
                <p className="text-sm text-gray-500">Get started by asking me to create an invoice or generate a report</p>
              </div>
              
              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3 mt-8">
                <div 
                  className="p-4 rounded-lg border border-gray-200 hover:border-[#8000ff] hover:bg-[#8000ff]/5 transition-all cursor-pointer group"
                  onClick={() => {
                    const chatkit = chatkitRef.current;
                    if (chatkit && "sendUserMessage" in chatkit && typeof chatkit.sendUserMessage === "function") {
                      chatkit.sendUserMessage({ text: "Create an invoice for a client" });
                    }
                  }}
                >
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">📄</div>
                  <div className="text-sm font-medium text-gray-900">Create Invoice</div>
                  <div className="text-xs text-gray-500 mt-1">Start here</div>
                </div>
                
                <div 
                  className="p-4 rounded-lg border border-gray-200 hover:border-[#8000ff] hover:bg-[#8000ff]/5 transition-all cursor-pointer group"
                  onClick={() => {
                    const chatkit = chatkitRef.current;
                    if (chatkit && "sendUserMessage" in chatkit && typeof chatkit.sendUserMessage === "function") {
                      chatkit.sendUserMessage({ text: "Generate a profit and loss report" });
                    }
                  }}
                >
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">📊</div>
                  <div className="text-sm font-medium text-gray-900">View Report</div>
                  <div className="text-xs text-gray-500 mt-1">Get insights</div>
                </div>
              </div>

              {/* Feature List */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-3">Available Actions:</p>
                <div className="space-y-2 text-left">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span>✓</span>
                    <span>Create and manage invoices</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span>✓</span>
                    <span>Generate profit & loss reports</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span>✓</span>
                    <span>Reconcile bank accounts</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span>✓</span>
                    <span>Categorize business expenses</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
