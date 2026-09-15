import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import manifestFn from '@/../app/manifest'

describe('Progressive Web App (PWA) Verification Suite', () => {
  const rootDir = path.resolve(__dirname, '../..')
  const publicDir = path.join(rootDir, 'public')

  describe('1. Web App Manifest Configuration', () => {
    it('app/manifest.ts returns valid specification-compliant manifest', () => {
      const manifest = manifestFn()
      expect(manifest.name).toBe('Lumo Dealers')
      expect(manifest.short_name).toBe('Lumo')
      expect(manifest.start_url).toBe('/?source=pwa')
      expect(manifest.id).toBe('/?source=pwa')
      expect(manifest.display).toBe('standalone')
      expect(manifest.background_color).toBe('#0B132B')
      expect(manifest.theme_color).toBe('#FF6A00')
      expect(manifest.scope).toBe('/')

      // Icons validation
      expect(manifest.icons).toBeDefined()
      expect(manifest.icons!.length).toBeGreaterThanOrEqual(4)

      const has192Any = manifest.icons!.some(i => i.sizes === '192x192' && i.purpose === 'any')
      const has512Any = manifest.icons!.some(i => i.sizes === '512x512' && i.purpose === 'any')
      const has192Maskable = manifest.icons!.some(i => i.sizes === '192x192' && i.purpose === 'maskable')
      const has512Maskable = manifest.icons!.some(i => i.sizes === '512x512' && i.purpose === 'maskable')

      expect(has192Any).toBe(true)
      expect(has512Any).toBe(true)
      expect(has192Maskable).toBe(true)
      expect(has512Maskable).toBe(true)
    })

    it('public/manifest.webmanifest matches manifest specification', () => {
      const manifestPath = path.join(publicDir, 'manifest.webmanifest')
      expect(fs.existsSync(manifestPath)).toBe(true)

      const content = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
      expect(content.name).toBe('Lumo Dealers')
      expect(content.short_name).toBe('Lumo')
      expect(content.display).toBe('standalone')
      expect(content.start_url).toBe('/?source=pwa')
      expect(content.id).toBe('/?source=pwa')
      expect(content.theme_color).toBe('#FF6A00')
      expect(content.background_color).toBe('#0B132B')
    })
  })

  describe('2. PWA Brand Icon Assets & Maskable Support', () => {
    it('contains all required standard and maskable icon PNGs', () => {
      const requiredIcons = [
        'icons/icon-192x192.png',
        'icons/icon-512x512.png',
        'icons/maskable-icon-192x192.png',
        'icons/maskable-icon-512x512.png',
        'icons/icon.svg',
        'icons/maskable-icon.svg',
        'apple-touch-icon.png',
        'favicon-32x32.png',
        'favicon-16x16.png',
        'favicon.ico',
      ]

      for (const iconRelPath of requiredIcons) {
        const fullPath = path.join(publicDir, iconRelPath)
        expect(fs.existsSync(fullPath), `Icon missing: ${iconRelPath}`).toBe(true)
        const stat = fs.statSync(fullPath)
        expect(stat.size, `Icon is empty: ${iconRelPath}`).toBeGreaterThan(100)
      }
    })

    it('maskable icon uses safe space margin to avoid Android circular cropping clipping', () => {
      const maskableSvgPath = path.join(publicDir, 'icons/maskable-icon.svg')
      const svgContent = fs.readFileSync(maskableSvgPath, 'utf8')
      // Standard is scale(1), maskable is scaled down to fit within central 80% safe zone
      expect(svgContent).toContain('scale(0.75)')
    })
  })

  describe('3. Safe Service Worker Behaviour & Security Restrictions', () => {
    const swPath = path.join(publicDir, 'sw.js')

    it('service worker file exists and contains versioned cache naming', () => {
      expect(fs.existsSync(swPath)).toBe(true)
      const swContent = fs.readFileSync(swPath, 'utf8')
      expect(swContent).toContain('STATIC_CACHE_NAME')
      expect(swContent).toContain('SKIP_WAITING')
      expect(swContent).toContain('caches.delete')
    })

    it('strict caching policy blocks all sensitive endpoints, auth, and mutations', () => {
      const swContent = fs.readFileSync(swPath, 'utf8')

      // Must never cache API endpoints
      expect(swContent).toContain("url.includes('/api/')")

      // Must explicitly guard against OTP, auth, subscriptions, referrals, payouts, admin
      expect(swContent).toContain('\\/api\\/identity\\/')
      expect(swContent).toContain('\\/api\\/auth\\/')
      expect(swContent).toContain('\\/api\\/otp\\/')
      expect(swContent).toContain('\\/api\\/subscriptions\\/')
      expect(swContent).toContain('\\/api\\/payments\\/')
      expect(swContent).toContain('\\/api\\/referrals\\/')
      expect(swContent).toContain('\\/api\\/deals\\/protected')
      expect(swContent).toContain('\\/api\\/admin\\/')

      // RSC/server actions must not be cached
      expect(swContent).toContain('_rsc=')
    })

    it('navigation requests fall back to bilingual /offline.html on network failure', () => {
      const swContent = fs.readFileSync(swPath, 'utf8')
      expect(swContent).toContain("request.mode === 'navigate'")
      expect(swContent).toContain("caches.match('/offline.html')")
    })
  })

  describe('4. Bilingual Offline Screen', () => {
    const offlinePath = path.join(publicDir, 'offline.html')

    it('offline.html exists with required English and Kiswahili messages', () => {
      expect(fs.existsSync(offlinePath)).toBe(true)
      const html = fs.readFileSync(offlinePath, 'utf8')

      // English exact requirement
      expect(html).toContain('You are offline. Reconnect to view current opportunities and update referrals.')

      // Kiswahili translation
      expect(html).toContain('Huna mtandao. Unganisha tena ili kuona fursa za sasa na kusasisha rufaa zako.')

      // Retry mechanism
      expect(html).toContain('window.location.reload()')
      expect(html).toContain("addEventListener('online'")
    })
  })

  describe('5. Installation Flow & Bilingual Invitation Strings', () => {
    it('FirstVisitInstallPrompt source contains required bilingual text and buttons', () => {
      const promptPath = path.join(rootDir, 'src/components/pwa/FirstVisitInstallPrompt.tsx')
      expect(fs.existsSync(promptPath)).toBe(true)
      const promptCode = fs.readFileSync(promptPath, 'utf8')

      // English strings
      expect(promptCode).toContain('Install Lumo Dealers')
      expect(promptCode).toContain('Access opportunities and track your referrals directly from your home screen.')
      expect(promptCode).toContain('Install App')
      expect(promptCode).toContain('Not Now')

      // Kiswahili strings
      expect(promptCode).toContain('Sakinisha Lumo Dealers')
      expect(promptCode).toContain('Fikia fursa na fuatilia rufaa zako moja kwa moja kutoka kwenye skrini ya mwanzo.')
      expect(promptCode).toContain('Sakinisha Programu')
      expect(promptCode).toContain('Si Sasa')
    })

    it('PwaInstallInstructionsModal provides iOS Safari Share -> Add to Home Screen instructions', () => {
      const modalPath = path.join(rootDir, 'src/components/pwa/PwaInstallInstructionsModal.tsx')
      expect(fs.existsSync(modalPath)).toBe(true)
      const modalCode = fs.readFileSync(modalPath, 'utf8')

      // Safari instructions
      expect(modalCode).toContain('Safari')
      expect(modalCode).toContain('Add to Home Screen')
      expect(modalCode).toContain('Share')
    })

    it('AppUpdateBanner exists and offers safe user-initiated update', () => {
      const bannerPath = path.join(rootDir, 'src/components/pwa/AppUpdateBanner.tsx')
      expect(fs.existsSync(bannerPath)).toBe(true)
      const bannerCode = fs.readFileSync(bannerPath, 'utf8')

      expect(bannerCode).toContain('Update Available')
      expect(bannerCode).toContain('Sasisho Linapatikana')
      expect(bannerCode).toContain('Update Now')
      expect(bannerCode).toContain('Sasisha Sasa')
    })
  })
})
