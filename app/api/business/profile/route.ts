import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedBusiness } from "@/lib/business-guard";

/**
 * GET /api/business/profile
 * Returns authenticated business organization profile with real verificationStatus
 */
export async function GET(request: NextRequest) {
  try {
    const biz = await getAuthenticatedBusiness(request);

    const organization = await db.organization.findUnique({
      where: { id: biz.businessId },
      select: {
        id: true,
        legalName: true,
        industry: true, hqAddress: true, contactEmail: true, contactPhone: true, website: true,
        tradingName: true,
        tin: true,
        registrationNumber: true,
        countryCode: true,
        verificationStatus: true,
        createdAt: true,
        updatedAt: true,
        members: {
          select: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        {
          success: false,
          error: "Business organization not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: organization,
    });
  } catch (error: any) {
    console.error("GET /api/business/profile error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unauthorized",
      },
      { status: error.statusCode || error.status || 401 }
    );
  }
}

/**
 * PUT /api/business/profile
 * Updates authenticated business profile details (legalName, tradingName, tin, registrationNumber)
 */
export async function PUT(request: NextRequest) {
  try {
    const biz = await getAuthenticatedBusiness(request);
    const body = await request.json();

    const { legalName, tradingName, tin, registrationNumber, countryCode } = body;

    if (!['OWNER', 'ADMIN'].includes(biz.businessRole)) return NextResponse.json({ error: 'Business administrator access required.' }, { status: 403 });
    const details: Record<string, string | null> = {};
    for (const key of ['industry', 'hqAddress', 'contactEmail', 'contactPhone', 'website']) {
      if (body[key] !== undefined) {
        if (typeof body[key] !== 'string' || body[key].length > 500) return NextResponse.json({ error: 'Invalid profile details.' }, { status: 400 });
        details[key] = body[key].trim() || null;
      }
    }
    const updated = await db.organization.update({
      where: { id: biz.businessId },
      data: {
        ...details,
        ...(legalName !== undefined && { legalName: String(legalName).trim() }),
        ...(tradingName !== undefined && { tradingName: String(tradingName).trim() }),
        ...(tin !== undefined && { tin: String(tin).trim() }),
        ...(registrationNumber !== undefined && { registrationNumber: String(registrationNumber).trim() }),
        ...(countryCode !== undefined && { countryCode: String(countryCode).trim().toUpperCase() }),
      },
      select: {
        id: true,
        legalName: true,
        industry: true, hqAddress: true, contactEmail: true, contactPhone: true, website: true,
        tradingName: true,
        tin: true,
        registrationNumber: true,
        countryCode: true,
        verificationStatus: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error("PUT /api/business/profile error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update business profile",
      },
      { status: error.statusCode || error.status || 400 }
    );
  }
}
