const prisma = require('../db');
const { getClerkUser, verifyClerkJwt } = require('../services/clerkService');

/**
 * Authentication Middleware
 * Validates Clerk session token from Authorization header.
 * Upserts user in local DB and attaches the DB user identity to req.user.
 *
 * IMPORTANT: This middleware NEVER overwrites the user's role if they
 * already exist in the database. Role is only set on first creation
 * (defaults to 'volunteer') and can only be changed via /api/auth/set-role.
 */
module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided, authorization denied' });
  }

  const token = authHeader.split(' ')[1];

  // ── Step 1: Verify the Clerk JWT ────────────────────────────────────
  let decoded;
  try {
    decoded = await verifyClerkJwt(token);
  } catch (err) {
    console.error('[auth] JWT verification failed:', err.message);
    return res.status(401).json({ message: 'Token is not valid', details: err.message });
  }

  const clerkUserId = decoded.sub;
  if (!clerkUserId) {
    return res.status(401).json({ message: 'Invalid Clerk token payload' });
  }

  // ── Step 2: Optimized DB Lookup ─────────────────────────────────────
  // Fast path: If user exists in DB, skip Clerk API calls and redundant writes.
  try {
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { 
        id: true, 
        role: true, 
        email: true, 
        name: true,
        volunteer: { select: { updatedAt: true } }
      },
    });

    if (dbUser) {
      // ── Step 2.5: Throttled Heartbeat ───────────────────────────────
      // If volunteer, update their 'last seen' timestamp at most every 15 mins.
      // This ensures they show up as "Active" on the dashboard even if just polling.
      if (dbUser.role === 'volunteer' && dbUser.volunteer) {
        const lastSeen = new Date(dbUser.volunteer.updatedAt);
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
        
        if (lastSeen < fifteenMinsAgo) {
          // Fire-and-forget update to keep the request response time low
          prisma.volunteer.update({
            where: { userId: dbUser.id },
            data: { updatedAt: new Date() }
          }).catch(err => console.error('[auth] Heartbeat failed:', err.message));
        }
      }

      req.user = {
        id: dbUser.id,
        role: dbUser.role,
        email: dbUser.email,
        name: dbUser.name,
        clerkId: clerkUserId,
      };
      return next();
    }

    // ── Step 3: Fetch Clerk profile (ONLY for new users) ──────────────
    console.log(`[auth] New user detected (${clerkUserId}), syncing with Clerk...`);
    const clerkUser = await getClerkUser(clerkUserId);
    const primaryEmailObj = clerkUser.emailAddresses.find(
      (email) => email.id === clerkUser.primaryEmailAddressId
    );
    const email = primaryEmailObj?.emailAddress;

    if (!email) {
      return res.status(400).json({ message: 'Clerk user has no primary email' });
    }

    const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || clerkUser.username || 'User';

    // Check whitelist table
    const isWhitelisted = await prisma.coordinatorEmail.findUnique({
      where: { email },
    });
    
    const assignedRole = isWhitelisted ? 'coordinator' : 'volunteer';

    dbUser = await prisma.user.create({
      data: {
        clerkId: clerkUserId,
        name,
        email,
        passwordHash: '',
        role: assignedRole,
      },
      select: { id: true, role: true, email: true, name: true },
    });

    if (dbUser.role === 'volunteer') {
      await prisma.volunteer.upsert({
        where: { userId: dbUser.id },
        create: { userId: dbUser.id, skills: [] },
        update: {},
      });
    }

    req.user = {
      id: dbUser.id,
      role: dbUser.role,
      email: dbUser.email,
      name: dbUser.name,
      clerkId: clerkUserId,
      isNewUser: true,
    };
    next();
  } catch (err) {
    console.error('[auth] Middleware error:', err.message);
    return res.status(500).json({ message: 'Internal server error during authentication' });
  }
};
