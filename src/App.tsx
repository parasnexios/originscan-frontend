import React, { useState, useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  HelpCircle,
  Building2,
  MapPin,
  Calendar,
  Phone,
  QrCode,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  ExternalLink
} from 'lucide-react'

interface ProductData {
  id: number
  name: string
  slug: string
  sku?: string
  net_weight?: string
  description?: string
  image_url?: string
}

interface BrandData {
  name: string
  logo_url?: string
  primary_color?: string
}

interface VerificationResult {
  status: 'valid' | 'not_found' | 'deactivated' | 'recalled' | 'blocked'
  company_name?: string
  address?: string
  fssai_license?: string
  contact_phone?: string
  product_name?: string
  batch_status?: string
  mfg_date?: string
  expiry_date?: string
  expired?: boolean
  message?: string
}

export default function App() {
  const [productSlug, setProductSlug] = useState('panipuri-classic')
  const [productData, setProductData] = useState<ProductData | null>(null)
  const [brandData, setBrandData] = useState<BrandData | null>(null)
  const [loadingProduct, setLoadingProduct] = useState(true)

  // 3-box code input state
  const [chars, setChars] = useState(['', '', ''])
  const inputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]

  // Full batch mode state
  const [isFullBatchMode, setIsFullBatchMode] = useState(false)
  const [fullBatchCode, setFullBatchCode] = useState('')

  // Verification state
  const [verifying, setVerifying] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  // Read product slug from URL path (e.g. /v/:slug or ?product=:slug)
  useEffect(() => {
    const pathParts = window.location.pathname.split('/').filter(Boolean)
    let slug = 'panipuri-classic'
    if (pathParts.length >= 2 && pathParts[0] === 'v') {
      slug = pathParts[1]
    } else {
      const urlParams = new URLSearchParams(window.location.search)
      const p = urlParams.get('product')
      if (p) slug = p
    }
    setProductSlug(slug)
    fetchProductInfo(slug)
  }, [])

  const fetchProductInfo = async (slug: string) => {
    try {
      setLoadingProduct(true)
      const res = await fetch(`/api/public/product/${slug}`)
      if (res.ok) {
        const json = await res.json()
        const payloadData = json.payload?.data || json.data
        if (payloadData) {
          setProductData(payloadData.product)
          setBrandData(payloadData.brand)
        }
      }
    } catch (err) {
      console.error('Failed to load product info:', err)
    } finally {
      setLoadingProduct(false)
    }
  }

  // Handle auto-focus and auto-advance
  const handleCharChange = (index: number, value: string) => {
    const val = value.slice(-1).toUpperCase()
    const nextChars = [...chars]
    nextChars[index] = val
    setChars(nextChars)
    setErrorMessage('')

    if (val && index < 2) {
      inputRefs[index + 1].current?.focus()
    }

    // Auto verify if all 3 characters filled
    if (val && index === 2 && nextChars[0] && nextChars[1]) {
      verifyCode(`${nextChars[0]}${nextChars[1]}${val}`)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !chars[index] && index > 0) {
      inputRefs[index - 1].current?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasteData = e.clipboardData.getData('text').trim().toUpperCase()
    if (!pasteData) return

    if (pasteData.length > 3) {
      setIsFullBatchMode(true)
      setFullBatchCode(pasteData)
      verifyCode(pasteData)
    } else {
      const next = [pasteData[0] || '', pasteData[1] || '', pasteData[2] || '']
      setChars(next)
      if (next.every(Boolean)) {
        verifyCode(next.join(''))
      } else {
        inputRefs[Math.min(pasteData.length, 2)].current?.focus()
      }
    }
  }

  const verifyCode = async (codeToVerify?: string) => {
    const code = codeToVerify || (isFullBatchMode ? fullBatchCode : chars.join(''))
    if (!code || code.length < 3) {
      setErrorMessage('Please enter at least 3 characters')
      return
    }

    setVerifying(true)
    setErrorMessage('')
    setResult(null)

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: productSlug,
          code
        })
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
        if (data.status === 'valid') {
          // Trigger celebratory confetti
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 }
          })
        }
      } else {
        setResult(data)
      }
    } catch (err) {
      setErrorMessage('Network connection error. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  const handleReset = () => {
    setChars(['', '', ''])
    setFullBatchCode('')
    setResult(null)
    setErrorMessage('')
    setTimeout(() => {
      inputRefs[0].current?.focus()
    }, 100)
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', width: '100%', padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Brand Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {brandData?.logo_url ? (
            <img
              src={brandData.logo_url}
              alt="Brand Logo"
              style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.15)' }}
            />
          ) : (
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #059669, #10b981)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.4)'
              }}
            >
              <ShieldCheck color="#fff" size={26} />
            </div>
          )}
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
              {brandData?.name || 'OriginScan'}
            </h1>
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle2 size={12} /> Official Brand Authenticator
            </span>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: '4px 10px', fontSize: '0.75rem', color: '#94a3b8' }}>
          Batch Lookup
        </div>
      </header>

      {/* Product Highlight Banner */}
      {productData && (
        <div className="glass-panel" style={{ padding: '14px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
          {productData.image_url ? (
            <img src={productData.image_url} alt={productData.name} style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 48, height: 48, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QrCode size={24} color="#10b981" />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {productData.name}
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              {productData.net_weight ? `Pack Size: ${productData.net_weight}` : 'Authentic Panipuri Product'}
            </p>
          </div>
        </div>
      )}

      {/* Main Verification Card */}
      {!result ? (
        <div className="glass-panel" style={{ padding: '24px 20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          {verifying && <div className="scan-line" />}

          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(5, 150, 105, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}
          >
            <QrCode size={28} color="#10b981" />
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 6 }}>Enter Batch Code</h3>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 24 }}>
            Enter the <strong>first 3 characters</strong> of the Batch No. printed on your pack
          </p>

          {!isFullBatchMode ? (
            /* 3-Box Character Input */
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 20 }} onPaste={handlePaste}>
              {chars.map((char, i) => (
                <input
                  key={i}
                  ref={inputRefs[i]}
                  type="text"
                  maxLength={1}
                  value={char}
                  autoCapitalize="characters"
                  onChange={(e) => handleCharChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="code-input-box"
                  autoFocus={i === 0}
                  placeholder="•"
                />
              ))}
            </div>
          ) : (
            /* Full Batch Mode Input */
            <div style={{ marginBottom: 20 }}>
              <input
                type="text"
                value={fullBatchCode}
                onChange={(e) => {
                  setFullBatchCode(e.target.value.toUpperCase())
                  setErrorMessage('')
                }}
                placeholder="e.g. KRL26101501"
                style={{
                  width: '100%',
                  height: 60,
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '2px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 14,
                  color: '#fff',
                  outline: 'none'
                }}
              />
            </div>
          )}

          {errorMessage && (
            <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <AlertTriangle size={16} /> {errorMessage}
            </div>
          )}

          {/* Action Buttons */}
          <button
            onClick={() => verifyCode()}
            disabled={verifying}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '1rem',
              fontWeight: 700,
              color: '#fff',
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              border: 'none',
              borderRadius: 14,
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(5, 150, 105, 0.4)',
              transition: 'all 0.2s',
              opacity: verifying ? 0.7 : 1
            }}
          >
            {verifying ? 'Verifying Origin...' : 'Verify Product'}
          </button>

          {/* Toggle Full Batch mode */}
          <div style={{ marginTop: 18 }}>
            <button
              onClick={() => {
                setIsFullBatchMode(!isFullBatchMode)
                setErrorMessage('')
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#10b981',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              {isFullBatchMode ? 'Switch to 3-letter Unit Code' : 'Have full Batch No.? Click here'}
            </button>
          </div>
        </div>
      ) : (
        /* Verification Results Presentation */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {result.status === 'valid' && (
            <div className="glass-panel glow-success" style={{ padding: '24px 20px', borderTop: '4px solid #10b981' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={28} color="#10b981" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>Verified Genuine Product</h3>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Official Manufacturing Origin Confirmed</span>
                </div>
              </div>

              {/* Manufacturer Information */}
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: 14, padding: '16px', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                  <Building2 size={20} color="#10b981" style={{ marginTop: 2 }} />
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Manufactured By</span>
                    <p style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>{result.company_name}</p>
                  </div>
                </div>

                {result.fssai_license && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 8, padding: '4px 10px', fontSize: '0.8rem', fontWeight: 700, color: '#34d399', marginBottom: 12 }}>
                    <span>FSSAI Lic No:</span> {result.fssai_license}
                  </div>
                )}

                {result.address && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10, fontSize: '0.85rem', color: '#cbd5e1' }}>
                    <MapPin size={18} color="#94a3b8" style={{ marginTop: 2 }} />
                    <p>{result.address}</p>
                  </div>
                )}

                {result.contact_phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', color: '#cbd5e1' }}>
                    <Phone size={18} color="#94a3b8" />
                    <p>{result.contact_phone}</p>
                  </div>
                )}
              </div>

              {/* Batch-level info if enabled */}
              {(result.mfg_date || result.expiry_date) && (
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    {result.mfg_date && (
                      <div>
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Mfg Date</span>
                        <p style={{ fontWeight: 700 }}>{result.mfg_date}</p>
                      </div>
                    )}
                    {result.expiry_date && (
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Expiry Date</span>
                        <p style={{ fontWeight: 700, color: result.expired ? '#f59e0b' : '#34d399' }}>{result.expiry_date}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={handleReset}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 12,
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                <RotateCcw size={16} /> Verify Another Pack
              </button>
            </div>
          )}

          {/* Recalled / Blocked State */}
          {(result.status === 'recalled' || result.status === 'blocked') && (
            <div className="glass-panel glow-danger" style={{ padding: '24px 20px', borderTop: '4px solid #ef4444' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <ShieldAlert size={36} color="#ef4444" />
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ef4444' }}>Batch Advisory Warning</h3>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Important Consumer Notice</span>
                </div>
              </div>
              <p style={{ fontSize: '0.95rem', color: '#f8fafc', marginBottom: 18, lineHeight: 1.5 }}>
                {result.message}
              </p>
              <button
                onClick={handleReset}
                style={{ width: '100%', padding: '14px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 12, color: '#fff', fontWeight: 600 }}
              >
                Back to Code Input
              </button>
            </div>
          )}

          {/* Not Found State */}
          {(result.status === 'not_found' || result.status === 'deactivated') && (
            <div className="glass-panel" style={{ padding: '24px 20px', borderTop: '4px solid #f59e0b' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <AlertTriangle size={36} color="#f59e0b" />
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f59e0b' }}>Verification Notice</h3>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Code Lookup Result</span>
                </div>
              </div>
              <p style={{ fontSize: '0.95rem', color: '#f8fafc', marginBottom: 18, lineHeight: 1.5 }}>
                {result.message}
              </p>
              <button
                onClick={handleReset}
                style={{ width: '100%', padding: '14px', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 12, color: '#fff', fontWeight: 600 }}
              >
                Re-enter Batch Code
              </button>
            </div>
          )}
        </div>
      )}

      {/* Guide Card */}
      <div className="glass-panel" style={{ padding: '18px 20px', marginTop: 24 }}>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <HelpCircle size={16} /> Where to find your code
        </h4>
        <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5 }}>
          Look at the printed batch block near the manufacturing date on your pack. For example: if batch says{' '}
          <strong style={{ color: '#10b981' }}>KRL26101501</strong>, the first 3 letters are <strong style={{ color: '#10b981' }}>KRL</strong>.
        </p>
      </div>

      {/* Footer */}
      <footer style={{ marginTop: 'auto', padding: '24px 0 12px', textAlign: 'center', fontSize: '0.75rem', color: '#64748b' }}>
        Powered by OriginScan™ Product Verification Platform &copy; 2026
      </footer>
    </div>
  )
}
