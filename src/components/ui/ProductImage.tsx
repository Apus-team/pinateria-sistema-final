import { useState } from 'react'
import { Package } from 'lucide-react'

interface ProductImageProps {
  src?: string | null
  alt: string
  className?: string
  width?: number
  height?: number
}

export default function ProductImage({ src, alt, className = '', width = 80, height = 80 }: ProductImageProps) {
  const [error, setError] = useState(false)

  if (!src || error) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-gradient-to-br from-fucsia-50 to-morado-50 ${className}`}
        style={{ width, height }}
      >
        <Package className="h-6 w-6 text-fucsia-300" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`rounded-lg object-cover ${className}`}
      style={{ width, height }}
      onError={() => setError(true)}
    />
  )
}
