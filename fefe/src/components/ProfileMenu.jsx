import { useState, useEffect, useRef } from "react"

export default function ProfileMenu({ userData, onLogout }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  const toggleMenu = () => setOpen(prev => !prev)

  const getAvatarUrl = () => {
    return userData?.user_metadata?.avatar_url ||
      `https://ui-avatars.com/api/?name=${userData?.user_metadata?.full_name || "U"}&background=0a0a0a&color=fff`
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={toggleMenu}
        className="w-10 h-10 rounded-full overflow-hidden border border-[#333] focus:outline-none cursor-pointer"
      >
        <img
          src={getAvatarUrl()}
          alt="User avatar"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null
            e.target.src = `https://ui-avatars.com/api/?name=U&background=0a0a0a&color=fff`
          }}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-lg z-50 p-4">
          <div className="mb-3">
            <p className="text-sm font-medium text-white truncate">
              {userData?.user_metadata?.full_name || userData?.email?.split('@')[0] || "User"}
            </p>
            <p className="text-xs text-[#888] truncate">
              {userData?.email || "user@example.com"}
            </p>
          </div>
          <button
            onClick={() => {
              setOpen(false)
              onLogout?.()
            }}
            className="w-full text-left text-sm text-[#f87171] hover:underline cursor-pointer"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  )
}
