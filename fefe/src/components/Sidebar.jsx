export default function Sidebar({ collections = [], onSelect, selectedCollection, dbConfig, onDbConfigChange }) {
  const handleConnect = () => {
    if (dbConfig.dbUri && dbConfig.dbName) {
      onDbConfigChange({ ...dbConfig, shouldConnect: true });
    }
  };

  const handleInputChange = (field, value) => {
    onDbConfigChange({ ...dbConfig, [field]: value, shouldConnect: false });
  };

  return (
    <aside className="w-64 h-full bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-[#888888]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-medium text-white">askQL</h2>
            <p className="text-xs text-[#888888]">Prompt your way to insights</p>
          </div>
        </div>
      </div>

      {/* MongoDB Connection */}
      <div className="p-4 border-b border-[#1a1a1a]">
        <div className="space-y-3">
          <div>
            <label htmlFor="dbUri" className="block text-xs font-medium text-[#888888] mb-1">
              MongoDB URI
            </label>
            <input
              id="dbUri"
              type="text"
              value={dbConfig.dbUri}
              onChange={(e) => handleInputChange('dbUri', e.target.value)}
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-white placeholder-[#666666] focus:outline-none focus:border-[#0ea5e9] transition-colors"
              placeholder="mongodb://localhost:27017"
            />
          </div>
          <div>
            <label htmlFor="dbName" className="block text-xs font-medium text-[#888888] mb-1">
              Database Name
            </label>
            <input
              id="dbName"
              type="text"
              value={dbConfig.dbName}
              onChange={(e) => handleInputChange('dbName', e.target.value)}
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-white placeholder-[#666666] focus:outline-none focus:border-[#0ea5e9] transition-colors"
              placeholder="mydb"
            />
          </div>
          <button
            onClick={handleConnect}
            disabled={!dbConfig.dbUri || !dbConfig.dbName}
            className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${dbConfig.dbUri && dbConfig.dbName
              ? 'bg-[#0ea5e9] hover:bg-[#0ea5e9]/90 text-white'
              : 'bg-[#1a1a1a] text-[#666666] cursor-not-allowed'}`}
          >
            Connect
          </button>
        </div>
      </div>

      {/* Collections */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="mb-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-[#888888] uppercase tracking-wider">Collections</h3>
          </div>

          {collections.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-[#666666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <p className="text-sm text-[#666666]">
                {!dbConfig.dbUri || !dbConfig.dbName
                  ? "Enter connection details above"
                  : !dbConfig.shouldConnect
                  ? "Click Connect to load collections"
                  : "Loading collections..."}
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
              {collections.map((col, i) => (
                <li key={i}>
                  <button
                    onClick={() => onSelect(col)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 group text-sm ${
                      selectedCollection === col
                        ? "bg-[#0ea5e9]/10 text-[#0ea5e9] border border-[#0ea5e9]/20"
                        : "text-[#cccccc] hover:bg-[#1a1a1a] hover:text-white border border-transparent hover:border-[#2a2a2a]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          selectedCollection === col ? "bg-[#0ea5e9]" : "bg-[#666666] group-hover:bg-[#888888]"
                        }`}
                      ></div>
                      <span className="font-medium truncate">{col}</span>
                      {selectedCollection === col && (
                        <svg
                          className="w-3 h-3 text-[#0ea5e9] ml-auto"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[#1a1a1a]">
        <div className="text-xs text-[#666666] text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                dbConfig.shouldConnect ? "bg-[#10b981]" : "bg-[#666666]"
              }`}
            ></div>
            <p>{dbConfig.shouldConnect ? "Connected" : "Not Connected"}</p>
          </div>
          <p>
            {collections.length} collection{collections.length !== 1 ? "s" : ""} available
          </p>
        </div>
      </div>
    </aside>
  );
}
