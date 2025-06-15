import { useState, useEffect, useRef } from "react"

export default function ProfileMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  const toggleMenu = () => setOpen(prev => !prev)

  // Close when clicking outside
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
        className="w-10 h-10 rounded-full overflow-hidden border border-[#333] focus:outline-none"
      >
        <img
          src={
            user?.avatar ||
            `https://ui-avatars.com/api/?name=${user?.name || "U"}&background=0a0a0a&color=fff`
          }
          alt="User avatar"
          className="w-full h-full object-cover"
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-lg z-50 p-4">
          <div className="mb-3">
            <p className="text-sm font-medium text-white">{user?.name || "User"}</p>
            <p className="text-xs text-[#888]">{user?.email || "user@example.com"}</p>
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
