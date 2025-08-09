'use client'
import { 
  ClipboardCheck, 
  Tags, 
  Printer, 
  Snowflake, 
  Thermometer, 
  SprayCan,
  Home,
  ChevronRight,
  Menu,
  X
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

export function Sidebar() {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  
  const menuItems = [
    { href: "/", icon: Home, label: "Accueil" },
    { href: "/controle-reception", icon: ClipboardCheck, label: "Contrôle à réception" },
    { href: "/etiquettes", icon: Tags, label: "Enregistrement des étiquettes" },
    { href: "/impression-dlc", icon: Printer, label: "Impression des DLC secondaires" },
    { href: "/enceintes-froides", icon: Snowflake, label: "Enceintes froides" },
    { href: "/suivi-refroidissement", icon: Thermometer, label: "Suivi de refroidissement" },
    { href: "/plan-nettoyage", icon: SprayCan, label: "Plan de nettoyage" },
  ]

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 bg-white rounded-lg shadow-lg border"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl border-r transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:shadow-none md:border-r-gray-200
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <ClipboardCheck className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-white">
                <h1 className="font-bold text-lg">HACCP Manager</h1>
                <p className="text-blue-100 text-xs">Gestion Qualité</p>
              </div>
            </Link>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden p-1 text-white hover:bg-white/20 rounded"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 py-6 overflow-y-auto">
            <nav className="px-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`
                      group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                      ${isActive 
                        ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-200' 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon className={`h-5 w-5 transition-colors ${
                      isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                    }`} />
                    <span className="flex-1">{item.label}</span>
                    {isActive && (
                      <ChevronRight className="h-4 w-4 text-blue-600" />
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="text-xs text-gray-500 text-center">
              <p className="font-medium">Version 1.0</p>
              <p>Système HACCP</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}