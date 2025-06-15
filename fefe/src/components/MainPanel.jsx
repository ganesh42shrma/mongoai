import PromptInput from "./PromptInput";
import ResultPanel from "./ResultPanel";
import ProfileMenu from "./ProfileMenu";

export default function MainPanel({
  query,
  setQuery,
  handleAsk,
  result,
  summary,
  cleanedQuery,
  loading,
  selectedCollection,
  dbConfig,
  user,
  onLogout,
}) {
  const hasResults = result || summary || cleanedQuery;
  const isConnected = dbConfig.dbUri && dbConfig.dbName;
  return (
    <main className="flex-1 flex flex-col relative bg-[#0a0a0a]">
      {/* Header */}
      <div className="border-b border-[#1a1a1a] bg-[#0a0a0a]/95 backdrop-blur-sm">
        <div className="mx-auto px-2 py-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-medium text-white">
                Prompt your way to insights
              </h1>
              {selectedCollection && (
                <p className="text-sm text-[#888888] mt-1">
                  Connected to:{" "}
                  <span className="text-[#0ea5e9] font-medium">
                    {selectedCollection}
                  </span>
                </p>
              )}
            </div>
            {/*Profile Section */}
            <div>
              {/* Profile Section */}
              <ProfileMenu
                userData={user}
                onLogout={onLogout}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {!hasResults ? (
            // Welcome State
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="mb-8">
                <div className="w-16 h-16 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <svg
                    className="w-8 h-8 text-[#888888]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-medium text-white mb-3">
                  What can I help you discover?
                </h2>
                <p className="text-[#888888] text-base max-w-md mx-auto leading-relaxed">
                  Ask questions about your data and get intelligent insights
                  powered by AI.
                </p>
              </div>

              {!isConnected && (
                <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-lg p-4 mb-8 max-w-md">
                  <p className="text-[#f59e0b] text-sm">
                    Please enter MongoDB connection details in the sidebar to
                    get started.
                  </p>
                </div>
              )}

              {isConnected && !selectedCollection && (
                <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-lg p-4 mb-8 max-w-md">
                  <p className="text-[#f59e0b] text-sm">
                    Please select a collection from the sidebar to get started.
                  </p>
                </div>
              )}

              {/* Example queries */}
              {isConnected && selectedCollection && (
                <div className="mt-8 max-w-2xl">
                  <h3 className="text-[#888888] text-sm font-medium mb-4">
                    Try asking questions like:
                  </h3>
                  <div className="grid gap-3">
                    {[
                      "What are the most common patterns in this collection?",
                      "Show me the distribution of values in this dataset",
                      "Find unusual or outlier records in this collection",
                      "What insights can you provide about this data?",
                    ].map((example, i) => (
                      <button
                        key={i}
                        onClick={() => setQuery(example)}
                        className="text-left p-3 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#2a2a2a] rounded-lg transition-colors"
                      >
                        <p className="text-[#cccccc] text-sm">{example}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Results State
            <ResultPanel
              result={result}
              summary={summary}
              cleanedQuery={cleanedQuery}
            />
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-[#1a1a1a] bg-[#0a0a0a]/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <PromptInput
            value={query}
            onChange={setQuery}
            onSubmit={handleAsk}
            loading={loading}
            disabled={!isConnected || !selectedCollection}
            placeholder={
              !isConnected
                ? "Enter MongoDB connection details to start..."
                : "Ask a question..."
            }
          />
        </div>
      </div>
    </main>
  );
}
