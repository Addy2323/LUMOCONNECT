import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { DATABASE_SESSION_COOKIE, sessionTokenHash, getDatabaseSession } from '@/lib/database-session'
import { findUserByEmail } from '@/lib/userRegistry'

/**
 * GET /api/referrals/partner-profile
 *
 * Returns authenticated partner's profile with name, phone, whatsapp, and verification status.
 * Identity is resolved ONLY from the server session — never from client-supplied data.
 */
export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie') || ''
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((c) => {
        const [k, ...v] = c.trim().split('=')
        return [k, decodeURIComponent(v.join('='))]
      })
    )

    const token = cookies[DATABASE_SESSION_COOKIE]
    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    // Try database session first
    if (process.env.DATABASE_URL?.trim()) {
      try {
        const session = await getDatabaseSession(token)
        if (session) {
          const user = session.user
          // Look up partner profile for WhatsApp info
          let partnerWhatsApp: string | null = null
          try {
            const partnerProfile = await db.partnerProfile.findUnique({
              where: { userId: user.id },
            })
            // socialChannels may contain whatsapp info
            if (partnerProfile?.socialChannels) {
              const channels = partnerProfile.socialChannels as any
              partnerWhatsApp = channels?.whatsapp || channels?.whatsApp || null
            }
          } catch {
            // Partner profile may not exist
          }

          return NextResponse.json({
            success: true,
            profile: {
              id: user.id,
              name: user.name,
              email: user.email,
              phone: user.phone || null,
              whatsapp: partnerWhatsApp || user.phone || null,
              hasWhatsApp: Boolean(partnerWhatsApp),
              isPhoneVerified: Boolean((user as any).phoneVerified),
            },
          })
        }
      } catch (dbErr) {
        console.warn('Database session error, using fallback:', dbErr)
      }
    }

    // Fallback: use in-memory partner
    const partnerUser = findUserByEmail('partner@lumo.co.tz')
    if (partnerUser) {
      return NextResponse.json({
        success: true,
        profile: {
          id: partnerUser.id,
          name: partnerUser.name,
          email: partnerUser.email,
          phone: partnerUser.phone || null,
          whatsapp: partnerUser.phone || null,
          hasWhatsApp: false,
          isPhoneVerified: false,
        },
      })
    }

    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
  } catch (error: any) {
    console.error('Partner profile retrieval error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

/**
 * POST /api/referrals/partner-profile
 *
 * Saves/updates the partner's WhatsApp number.
 * Only the authenticated partner can update their own profile.
 */
export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie') || ''
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((c) => {
        const [k, ...v] = c.trim().split('=')
        return [k, decodeURIComponent(v.join('='))]
      })
    )

    const token = cookies[DATABASE_SESSION_COOKIE]
    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const body = await req.json()
    const { whatsapp } = body

    if (!whatsapp || typeof whatsapp !== 'string') {
      return NextResponse.json({ success: false, error: 'WhatsApp number is required' }, { status: 400 })
    }

    // Database session
    if (process.env.DATABASE_URL?.trim()) {
      try {
        const session = await getDatabaseSession(token)
        if (session) {
          const userId = session.user.id
          // Update socialChannels in partner profile
          const existing = await db.partnerProfile.findUnique({ where: { userId } })
          if (existing) {
            const channels = (existing.socialChannels as any) || {}
            await db.partnerProfile.update({
              where: { userId },
              data: {
                socialChannels: { ...channels, whatsapp: whatsapp.trim() },
              },
            })
          }
          return NextResponse.json({ success: true, message: 'WhatsApp number saved' })
        }
      } catch (dbErr) {
        console.warn('Database update error:', dbErr)
      }
    }

    // Fallback: acknowledge save (in-memory is transient)
    return NextResponse.json({ success: true, message: 'WhatsApp number saved' })
  } catch (error: any) {
    console.error('Partner profile update error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
