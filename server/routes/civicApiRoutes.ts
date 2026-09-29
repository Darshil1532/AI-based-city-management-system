import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  authenticateToken,
  requireAuth,
  requireRole,
} from '../middleware/authMiddleware';
import { complaintService, DatabasePersistenceError } from '../services/complaintService';
import { notificationService } from '../services/notificationService';
import { insightService } from '../services/insightService';
import { hotspotService } from '../services/hotspotService';
import {
  ComplaintCategorySchema,
  PriorityLevelSchema,
  DepartmentNameSchema,
  ComplaintStatusSchema,
} from '../ai/schemas';

export const civicApiRouter = Router();

// Apply auth token parser to all civic routes
civicApiRouter.use(authenticateToken);

// =============================================================
// SCHEMAS
// =============================================================

const CreateComplaintSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(3000),
  category: ComplaintCategorySchema,
  severity: PriorityLevelSchema.default('Medium'),
  priority: PriorityLevelSchema.optional(),
  citizenPhone: z.string().max(25).optional(),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().min(3).max(300),
    landmark: z.string().max(150).optional(),
    district: z.string().max(100).optional(),
  }),
  aiAnalysis: z
    .object({
      category: ComplaintCategorySchema,
      priority: PriorityLevelSchema,
      department: DepartmentNameSchema,
      confidence: z.number().optional(),
      reasoning: z.string(),
      factors: z.array(z.string()),
      provider: z.enum(['Gemini', 'Demo AI']).optional(),
      providerLabel: z.string().optional(),
    })
    .optional(),
});

const ReviewAISchema = z.object({
  decision: z.enum(['ratified', 'overridden']),
  finalCategory: ComplaintCategorySchema.optional(),
  finalPriority: PriorityLevelSchema.optional(),
  assignedDepartment: DepartmentNameSchema.optional(),
  notes: z.string().max(1000).optional(),
});

const AssignDepartmentSchema = z.object({
  department: DepartmentNameSchema,
  officer: z.string().max(150).optional(),
  notes: z.string().max(500).optional(),
});

const UpdateStatusSchema = z.object({
  status: ComplaintStatusSchema,
  notes: z.string().max(500).optional(),
  overrideRationale: z.string().max(1000).optional(),
  resolutionDetails: z.string().max(1000).optional(),
  officerSignature: z.string().max(150).optional(),
});

const ResolveComplaintSchema = z.object({
  resolutionDetails: z.string().min(5, 'Resolution summary is required (min 5 chars)').max(1000),
  officerSignature: z.string().max(150).optional(),
  overrideRationale: z.string().max(1000).optional(),
});

const CreateNotificationSchema = z.object({
  userId: z.string().min(1).max(100),
  title: z.string().min(2).max(200),
  message: z.string().min(2).max(1000),
  type: z.enum([
    'submission',
    'ai_alert',
    'admin_action',
    'hotspot',
    'assigned',
    'in_progress',
    'resolved',
  ]),
  link: z.string().max(300).optional(),
});

// Helper for handling persistence failures
function handleRouteError(res: Response, err: any) {
  if (err instanceof DatabasePersistenceError || err?.name === 'DatabasePersistenceError') {
    return res.status(503).json({
      error: 'Authoritative database persistence failed',
      code: 'PERSISTENCE_FAILURE',
      message: err.message,
    });
  }
  console.error('[CivicApiRouter] Route error:', err);
  return res.status(500).json({
    error: 'Internal server error',
    code: 'SERVER_ERROR',
  });
}

// =============================================================
// CITIZEN & PUBLIC ENDPOINTS (Authenticated & Publicly Accessible)
// =============================================================

/**
 * GET /api/complaints
 * Unified Municipal Complaint Feed
 * Returns public-sanitized complaints for anonymous/citizens, full complaints for admin.
 */
civicApiRouter.get('/complaints', (req: Request, res: Response) => {
  const user = req.user;
  const list = complaintService.getAllPublic(user);

  return res.json({
    count: list.length,
    complaints: list,
  });
});

/**
 * POST /api/complaints
 * Citizen: Create Complaint
 * Server verifies authentication and forcibly binds creator ownership.
 */
civicApiRouter.post('/complaints', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const parsed = CreateComplaintSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid complaint payload',
        code: 'INVALID_REQUEST',
        issues: parsed.error.flatten(),
      });
    }

    const newComplaint = await complaintService.createComplaint(parsed.data, user);

    return res.status(201).json({
      message: 'Complaint successfully registered in municipal dispatch queue.',
      complaint: newComplaint,
    });
  } catch (err: any) {
    return handleRouteError(res, err);
  }
});

/**
 * GET /api/citizen/complaints
 * Citizen: View Own Complaints
 * Server strictly verifies ownership: returns only complaints authored by user (or all if admin).
 */
civicApiRouter.get('/citizen/complaints', requireAuth, (req: Request, res: Response) => {
  const user = req.user!;
  const list = complaintService.getAll(user);

  return res.json({
    count: list.length,
    citizenId: user.id,
    complaints: list,
  });
});

/**
 * GET /api/complaints/:id/track
 * Citizen / Public: Track Complaint
 * Verifies ownership: returns full record for owner/admin; sanitized PII-redacted for public.
 */
civicApiRouter.get('/complaints/:id/track', (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;

  const tracking = complaintService.getPublicTracking(id, user);
  if (!tracking) {
    return res.status(404).json({
      error: 'Complaint not found',
      code: 'NOT_FOUND',
      message: `No active municipal complaint registered with identifier '${id}'.`,
    });
  }

  return res.json(tracking);
});

// =============================================================
// NOTIFICATION ENDPOINTS
// =============================================================

/**
 * GET /api/notifications
 * Get notifications for current user (or all for admin)
 */
civicApiRouter.get('/notifications', requireAuth, (req: Request, res: Response) => {
  const user = req.user!;
  const list = notificationService.getForUser(user);
  return res.json({
    count: list.length,
    notifications: list,
  });
});

/**
 * POST /api/notifications
 * Dispatch notification: Citizens may only target themselves. Admins can target any citizen.
 */
civicApiRouter.post('/notifications', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const parsed = CreateNotificationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid notification payload',
        code: 'INVALID_REQUEST',
        issues: parsed.error.flatten(),
      });
    }

    const result = await notificationService.createNotification(parsed.data, user);
    if (!result.success) {
      const statusCode = result.code === 'FORBIDDEN' ? 403 : 400;
      return res.status(statusCode).json({
        error: result.error,
        code: result.code || 'BAD_REQUEST',
      });
    }

    return res.status(201).json({
      message: 'Notification successfully created.',
      notification: result.notification,
    });
  } catch (err: any) {
    return handleRouteError(res, err);
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
civicApiRouter.patch('/notifications/:id/read', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const success = await notificationService.markAsRead(id, user);
    if (!success) {
      return res.status(404).json({
        error: 'Notification not found or access denied.',
        code: 'NOT_FOUND',
      });
    }
    return res.json({ success: true, message: `Notification ${id} marked as read.` });
  } catch (err: any) {
    return handleRouteError(res, err);
  }
});

/**
 * DELETE /api/notifications
 * Clear user notifications
 */
civicApiRouter.delete('/notifications', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    await notificationService.clearAll(user);
    return res.json({ success: true, message: 'Notifications cleared.' });
  } catch (err: any) {
    return handleRouteError(res, err);
  }
});

// =============================================================
// HOTSPOTS ENDPOINTS
// =============================================================

/**
 * GET /api/hotspots
 * View active detected clusters
 */
civicApiRouter.get('/hotspots', (_req: Request, res: Response) => {
  const list = hotspotService.getAll();
  return res.json({
    count: list.length,
    hotspots: list,
  });
});

/**
 * POST /api/admin/hotspots/recalculate
 * Admin: Recalculate DBSCAN clusters
 */
civicApiRouter.post('/admin/hotspots/recalculate', requireRole(['admin']), (req: Request, res: Response) => {
  const all = complaintService.getAll(req.user);
  const updated = hotspotService.detectClusters(all);
  return res.json({
    message: 'Hotspots recalculation complete.',
    count: updated.length,
    hotspots: updated,
  });
});

// =============================================================
// ADMIN ENDPOINTS (Admin Role Enforced)
// =============================================================

/**
 * GET /api/admin/insights
 * Admin-Only: Access systemic AI municipal intelligence
 */
civicApiRouter.get('/admin/insights', requireRole(['admin']), (req: Request, res: Response) => {
  try {
    const list = insightService.getAll(req.user!);
    return res.json({
      count: list.length,
      insights: list,
    });
  } catch (err: any) {
    return handleRouteError(res, err);
  }
});

/**
 * PATCH /api/admin/insights/:id
 * Admin-Only: Update AI insight status or action note
 */
civicApiRouter.patch('/admin/insights/:id', requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, actionNote } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required.', code: 'INVALID_REQUEST' });
    }
    const result = await insightService.updateStatus(id, status, req.user!, actionNote);
    if (!result.success) {
      return res.status(404).json({ error: result.error, code: 'NOT_FOUND' });
    }
    return res.json({
      message: `Insight ${id} updated.`,
      insight: result.insight,
    });
  } catch (err: any) {
    return handleRouteError(res, err);
  }
});

/**
 * GET /api/admin/complaints
 * Admin: View All Complaints
 */
civicApiRouter.get('/admin/complaints', requireRole(['admin']), (req: Request, res: Response) => {
  const all = complaintService.getAll(req.user);
  return res.json({
    totalComplaints: all.length,
    complaints: all,
  });
});

/**
 * POST /api/admin/complaints/:id/review
 * Admin: Review AI Recommendations (Human-in-the-Loop)
 */
civicApiRouter.post('/admin/complaints/:id/review', requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const parsed = ReviewAISchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid review payload',
        code: 'INVALID_REQUEST',
        issues: parsed.error.flatten(),
      });
    }

    const result = await complaintService.reviewAIRecommendation(id, parsed.data, req.user!);
    if (!result.success) {
      return res.status(404).json({ error: result.error || 'Complaint not found', code: 'NOT_FOUND' });
    }

    return res.json({
      message: `AI recommendation successfully ${parsed.data.decision} by ${req.user!.name}.`,
      complaint: result.complaint,
    });
  } catch (err: any) {
    return handleRouteError(res, err);
  }
});

/**
 * PATCH /api/admin/complaints/:id/assign
 * Admin: Assign Department
 */
civicApiRouter.patch('/admin/complaints/:id/assign', requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const parsed = AssignDepartmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid department assignment payload',
        code: 'INVALID_REQUEST',
        issues: parsed.error.flatten(),
      });
    }

    const result = await complaintService.assignDepartment(id, parsed.data, req.user!);
    if (!result.success) {
      return res.status(404).json({ error: result.error || 'Complaint not found', code: 'NOT_FOUND' });
    }

    return res.json({
      message: `Complaint ${result.complaint!.id} successfully assigned to ${parsed.data.department}.`,
      complaint: result.complaint,
    });
  } catch (err: any) {
    return handleRouteError(res, err);
  }
});

/**
 * PATCH /api/admin/complaints/:id/status
 * Admin: Advance Status
 */
civicApiRouter.patch('/admin/complaints/:id/status', requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const parsed = UpdateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid status payload',
        code: 'INVALID_REQUEST',
        issues: parsed.error.flatten(),
      });
    }

    const result = await complaintService.updateStatus(id, parsed.data, req.user!);
    if (!result.success) {
      const statusCode = result.code === 'INVALID_STATE_TRANSITION' ? 409 : result.code === 'NOT_FOUND' ? 404 : 400;
      return res.status(statusCode).json({
        error: result.error,
        code: result.code || 'INVALID_REQUEST',
      });
    }

    return res.json({
      message: `Complaint ${result.complaint!.id} status transitioned to '${parsed.data.status}'.`,
      complaint: result.complaint,
    });
  } catch (err: any) {
    return handleRouteError(res, err);
  }
});

/**
 * POST /api/admin/complaints/:id/resolve
 * Admin: Formal Resolution
 */
civicApiRouter.post('/admin/complaints/:id/resolve', requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const parsed = ResolveComplaintSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid resolution payload',
        code: 'INVALID_REQUEST',
        issues: parsed.error.flatten(),
      });
    }

    const result = await complaintService.resolveComplaint(id, parsed.data, req.user!);
    if (!result.success) {
      const statusCode = result.code === 'INVALID_STATE_TRANSITION' ? 409 : result.code === 'NOT_FOUND' ? 404 : 400;
      return res.status(statusCode).json({
        error: result.error,
        code: result.code || 'INVALID_REQUEST',
      });
    }

    return res.json({
      message: `Complaint ${result.complaint!.id} formally resolved by ${req.user!.name}.`,
      complaint: result.complaint,
    });
  } catch (err: any) {
    return handleRouteError(res, err);
  }
});

/**
 * GET /api/admin/analytics
 * Admin: View Analytics
 */
civicApiRouter.get('/admin/analytics', requireRole(['admin']), (_req: Request, res: Response) => {
  return res.json(complaintService.getAnalytics());
});

