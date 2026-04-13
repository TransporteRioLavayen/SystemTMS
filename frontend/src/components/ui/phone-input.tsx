import * as React from "react"
import { cn } from "@/lib/utils"

interface PhoneInputProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  required?: boolean
}

export function PhoneInput({ value, onChange, placeholder, className, required }: PhoneInputProps) {
  // El valor puede venir como "54XXXXXXXXXX" (10 dígitos sin el 54)
  // o vacío. Solo guardamos los 10 dígitos.
  const phoneNumber = value?.replace(/^54/, '').slice(0, 10) || ''

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = e.target.value.replace(/\D/g, '').slice(0, 10)
    onChange?.(num) // Se guarda sin el 54, se agrega al enviar a BD
  }

  return (
    <div className={cn("flex items-center", className)}>
      <span className="px-3 py-3 bg-gray-100 border border-gray-200 rounded-l-xl text-gray-500 font-medium text-sm whitespace-nowrap">
        +54
      </span>
      <input
        type="text"
        value={phoneNumber}
        onChange={handleChange}
        placeholder={placeholder || "11 1234 5678"}
        maxLength={10}
        className="w-33 px-3 py-3 rounded-r-xl bg-gray-50 border border-gray-200 text-gray-900 font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all"
        required={required}
      />
    </div>
  )
}

// Helper para formatear el valor final (para enviar a la base de datos)
export function formatPhoneForDB(phone: string): string {
  // Elimina todo lo que no sea dígito y agrega el 54
  // Ej: "1112345678" -> "541112345678"
  const cleanPhone = phone.replace(/\D/g, '')
  return `54${cleanPhone}`
}