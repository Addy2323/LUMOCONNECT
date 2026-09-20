import { prisma } from "@/lib/prisma";

export interface InternationalAccessStatus {
  hasAccess: boolean;
  reason: string;
  isExpired: boolean;
  expiresAt: Date | null;
  subscriptionStatus: string;
}

export async function checkInternationalAccess(
  userId: string | null | undefined
): Promise<InternationalAccessStatus> {
  if (!userId) {
    return {
      hasAccess: false,
      reason: "UNAUTHENTICATED",
      isExpired: false,
      expiresAt: null,
      subscriptionStatus: "NONE",
    };
  }

  try {
    // Check if user has active UserSubscription with INTERNATIONAL_PRIVATE_ACCESS entitlement or plan
    const activeSub = await prisma.userSubscription.findFirst({
      where: {
        userId,
        status: "ACTIVE",
        expiresAt: {
          gte: new Date(),
        },
        plan: {
          code: {
            contains: "INT",
          },
        },
      },
      include: {
        plan: true,
      },
      orderBy: {
        expiresAt: "desc",
      },
    });

    if (activeSub) {
      return {
        hasAccess: true,
        reason: "ACTIVE_INTERNATIONAL_MEMBERSHIP",
        isExpired: false,
        expiresAt: activeSub.expiresAt,
        subscriptionStatus: "ACTIVE",
      };
    }

    // Check if user is platform admin or superuser
    const adminAssignment = await prisma.roleAssignment.findFirst({
      where: {
        userId,
        role: {
          code: {
            in: ["SUPER_ADMIN", "PLATFORM_ADMIN", "LUMO_ADMIN"],
          },
        },
      },
    });

    if (adminAssignment) {
      return {
        hasAccess: true,
        reason: "ADMIN_OVERRIDE",
        isExpired: false,
        expiresAt: null,
        subscriptionStatus: "ADMIN",
      };
    }

    // Check for expired subscription
    const expiredSub = await prisma.userSubscription.findFirst({
      where: {
        userId,
        plan: {
          code: {
            contains: "INT",
          },
        },
      },
      orderBy: {
        expiresAt: "desc",
      },
    });

    if (expiredSub) {
      return {
        hasAccess: false,
        reason: "MEMBERSHIP_EXPIRED",
        isExpired: true,
        expiresAt: expiredSub.expiresAt,
        subscriptionStatus: "EXPIRED",
      };
    }

    return {
      hasAccess: false,
      reason: "MEMBERSHIP_REQUIRED",
      isExpired: false,
      expiresAt: null,
      subscriptionStatus: "NONE",
    };
  } catch (error) {
    console.error("Error checking international access:", error);
    return {
      hasAccess: false,
      reason: "ERROR_CHECKING_ACCESS",
      isExpired: false,
      expiresAt: null,
      subscriptionStatus: "ERROR",
    };
  }
}
