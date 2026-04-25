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

  // ── Step 2: Fetch Clerk user profile ────────────────────────────────
  let clerkUser;
  try {
    clerkUser = await getClerkUser(clerkUserId);
  } catch (err) {
    console.error('[auth] Failed to fetch Clerk user:', err.message || err.toString() || 'Unknown Clerk Error');
    return res.status(502).json({ message: 'Unable to verify user identity with Clerk', details: err.message || 'Check Clerk Secret Key' });
  }

  const primaryEmailObj = clerkUser.emailAddresses.find(
    (email) => email.id === clerkUser.primaryEmailAddressId
  );
  const email = primaryEmailObj?.emailAddress;

  if (!email) {
    return res.status(400).json({ message: 'Clerk user has no primary email' });
  }

  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || clerkUser.username || 'User';

  // ── Step 3: Upsert user in local DB ─────────────────────────────────
  let dbUser;
  let isNewUser = false;
  try {
    const existingUser = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
    isNewUser = !existingUser;

    // Check whitelist table to see if this user should be a coordinator
    const isWhitelisted = await prisma.coordinatorEmail.findUnique({
      where: { email },
    });
    
    // Automatically determine role
    const assignedRole = isWhitelisted ? 'coordinator' : 'volunteer';

    dbUser = await prisma.user.upsert({
      where: { clerkId: clerkUserId },
      create: {
        clerkId: clerkUserId,
        name,
        email,
        passwordHash: '',
        role: assignedRole,
      },
      update: {
        name,
        email,
        role: assignedRole, // Enforce role based on whitelist every time
      },
      select: { id: true, role: true, email: true, name: true },
    });
  } catch (err) {
    console.error('[auth] Database error during user upsert:', err.message);
    return res.status(503).json({
      message: 'Database connection error',
      details: err.message,
    });
  }

  // ── Step 4: Ensure volunteer record exists if role is volunteer ─────
  if (dbUser.role === 'volunteer') {
    try {
      await prisma.volunteer.upsert({
        where: { userId: dbUser.id },
        create: { userId: dbUser.id, skills: [] },
        update: {},
      });
    } catch (err) {
      console.error('[auth] Failed to upsert volunteer record:', err.message);
    }
  }

  req.user = {
    id: dbUser.id,
    role: dbUser.role,
    email: dbUser.email,
    name: dbUser.name,
    clerkId: clerkUserId,
    isNewUser,
  };
  next();
};
