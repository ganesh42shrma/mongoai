export default function PromptInput({ value, onChange, onSubmit, loading, disabled, placeholder }) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (!disabled && value.trim()) {
        onSubmit()
      }
    }
  }

  return (
    <div className="relative">
      <div className="flex items-end gap-3 p-3 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] focus-within:border-[#0ea5e9]/50 transition-all duration-200">
        <div className="flex-1">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || "Ask about your data..."}
            disabled={disabled}
            className="w-full bg-transparent text-white placeholder-[#666666] resize-none outline-none min-h-[24px] max-h-32 disabled:opacity-50 text-sm leading-relaxed"
            rows={1}
            style={{
              height: "auto",
              minHeight: "24px",
            }}
            onInput={(e) => {
              e.target.style.height = "auto"
              e.target.style.height = e.target.scrollHeight + "px"
            }}
          />
        </div>

        <button
          onClick={onSubmit}
          disabled={loading || disabled || !value.trim()}
          className="flex items-center justify-center w-8 h-8 bg-white hover:bg-[#f5f5f5] disabled:bg-[#333333] text-black disabled:text-[#666666] rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {loading ? (
            <div className="w-3 h-3 border border-[#666666] border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg
              className="w-4 h-4 group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>

      <div className="flex items-center justify-between mt-2 px-1">
        <p className="text-xs text-[#666666]">Press Enter to send, Shift + Enter for new line</p>
        {value.length > 0 && <p className="text-xs text-[#666666]">{value.length} characters</p>}
      </div>
    </div>
  )
}
