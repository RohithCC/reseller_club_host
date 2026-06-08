import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || ""

function imgUrl(src) {
  if (!src) return null
  if (src.startsWith("http")) return src
  return BACKEND_URL + src
}

export default function CTASection() {
  const [banners, setBanners] = useState([])
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const navigate = useNavigate()
  const timerRef = useRef(null)
  const touchStartRef = useRef(null)

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/showcase/banners`).then(({ data }) => {
      if (data.success && Array.isArray(data.banners)) {
        const cta = data.banners.filter(
          b => Array.isArray(b.buttons) && b.buttons.length > 0
        )
        if (cta.length > 0) setBanners(cta)
      }
    }).catch(() => {})
  }, [])

  const startTimer = useCallback(() => {
    clearInterval(timerRef.current)
    if (banners.length > 1 && !paused) {
      timerRef.current = setInterval(
        () => setCurrent(c => (c + 1) % banners.length),
        5000
      )
    }
  }, [banners.length, paused])

  useEffect(() => {
    startTimer()
    return () => clearInterval(timerRef.current)
  }, [startTimer])

  const goTo = (idx) => {
    setCurrent((idx + banners.length) % banners.length)
    startTimer()
  }

  const onTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientX
  }

  const onTouchEnd = (e) => {
    const diff = touchStartRef.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      goTo(current + (diff > 0 ? 1 : -1))
    }
    touchStartRef.current = null
  }

  const multi = banners.length > 1

  if (banners.length === 0) return null

  const banner = banners[current]
  const src = imgUrl(banner.image)
  const btn = banner.buttons?.[0]

  return (
    <section className="mt-12 md:mt-20 px-3 sm:px-4 md:px-8"
      onMouseEnter={() => { if (multi) setPaused(true) }}
      onMouseLeave={() => { if (multi) setPaused(false) }}
      onTouchStart={multi ? onTouchStart : undefined}
      onTouchEnd={multi ? onTouchEnd : undefined}>
      <div className="max-w-2xl lg:max-w-7xl mx-auto relative">
        <div className="bg-cyan-100 border border-slate-200 px-4 sm:px-6 min-[1200px]:!px-16 w-full rounded-2xl sm:rounded-3xl">
          <div key={banner._id} className="grid lg:grid-cols-5 gap-3 sm:gap-4 items-center animate-fadeIn h-[320px] sm:h-[360px] lg:h-[400px] overflow-hidden">
            <div className="max-lg:py-3 lg:py-14 lg:col-span-2 text-center lg:text-left max-lg:self-center">
              <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-2 sm:mb-4 leading-tight">
                {banner.title}
              </h2>
              {banner.description && (
                <p className="text-xs sm:text-base text-slate-600 leading-relaxed max-w-md mx-auto lg:mx-0 line-clamp-3 sm:line-clamp-none">
                  {banner.description}
                </p>
              )}

              {btn?.label && (
                <div className="flex gap-3 flex-wrap max-lg:justify-center mt-3 sm:mt-6">
                  <button onClick={() => navigate(btn.link)}
                    className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 inline-flex items-center justify-center rounded-lg text-white text-sm sm:text-base bg-black tracking-wider cursor-pointer hover:bg-[#111] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 font-semibold transition-all">
                    {btn.label}
                  </button>
                </div>
              )}
            </div>

            <div className="lg:col-span-3 flex justify-center items-center max-lg:-order-1 max-lg:pt-2">
              {src ? (
                <img src={src} alt={banner.title}
                  className="w-full max-w-xs sm:max-w-md lg:max-w-none h-36 sm:h-52 lg:h-72 xl:h-80 object-contain" />
              ) : (
                <div className="w-full h-36 sm:h-52 lg:h-72 xl:h-80 bg-cyan-200/50 rounded-2xl" />
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mt-4 sm:mt-6">
          <button onClick={() => goTo(current - 1)}
            className={`flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 rounded-full text-sm sm:text-base font-bold transition-all touch-manipulation ${multi ? "bg-white/80 hover:bg-white text-gray-700 shadow-sm active:scale-95" : "bg-gray-100 text-gray-300 cursor-default"}`}
            aria-label="Previous">
            ‹
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {banners.map((_, i) => (
              <button key={i} onClick={() => multi && goTo(i)}
                className={`h-2 rounded-full transition-all duration-300 ${i === current ? "bg-cyan-600 w-6 sm:w-8" : multi ? "bg-cyan-300 w-2 hover:bg-cyan-400 cursor-pointer" : "bg-cyan-300 w-2"}`}
                aria-label={`Slide ${i + 1}`} />
            ))}
          </div>

          <button onClick={() => goTo(current + 1)}
            className={`flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 rounded-full text-sm sm:text-base font-bold transition-all touch-manipulation ${multi ? "bg-white/80 hover:bg-white text-gray-700 shadow-sm active:scale-95" : "bg-gray-100 text-gray-300 cursor-default"}`}
            aria-label="Next">
            ›
          </button>

          {multi && (
            <span className="hidden sm:inline text-[10px] text-cyan-500 font-mono ml-1">
              {current + 1}/{banners.length}
            </span>
          )}
        </div>
      </div>
    </section>
  )
}
