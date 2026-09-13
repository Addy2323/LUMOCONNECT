import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const roles = await db.role.findMany({
      include: {
        _count: {
          select: {
            assignments: true,
          },
        },
      },
    })

    const formattedRoles = roles.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      description: r.description || `${r.name} access role`,
      userCount: r._count.assignments,
    }))

    return NextResponse.json({ roles: formattedRoles })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
