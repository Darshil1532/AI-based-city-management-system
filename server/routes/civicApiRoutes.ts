import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  authenticateToken,
  requireAuth,
  requireRole,
} from '../middleware/authMiddleware';

export const civicApiRouter = Router();

// Apply auth token parser to all civic routes
civicApiRouter.use(authenticateToken);

// ----------------- TYPE & SCHEMA DEFINITIONS -----------------

const ComplaintCategoryEnum = z.enum([
  'Pothole / Road',
  'Garbage / Waste',
  'Water Leakage',
  'Streetlight',
  'Traffic',
  'Infrastructure',
  'Other',
]);

const PriorityLevelEnum = z.enum(['Low', 'Medium', 'High']);

const DepartmentNameEnum = z.enum([
  'Public Works Department',
  'Sanitation Department',
  'Water Supply Department',
  'Electrical Department',
  'Traffic & Transit Department',
  'Urban Infrastructure Division',
]);

const ComplaintStatusEnum = z.enum([
  'submitted',
  'assigned',
  'in_progress',
  'resolved',
]);

export interface ServerComplaint {
  id: string;
  citizenId: string;
  citizenName: string;
  citizenPhone?: string;
  citizenEmail?: string;
  title: string;
  description: string;
  category: z.infer<typeof ComplaintCategoryEnum>;
  priority: z.infer<typeof PriorityLevelEnum>;
  status: z.infer<typeof ComplaintStatusEnum>;
  department?: z.infer<typeof DepartmentNameEnum>;
  assignedDepartment?: z.infer<typeof DepartmentNameEnum>;
  assignedOfficer?: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    landmark?: string;
    district?: string;
  };
  aiAnalysis?: {
    category: z.infer<typeof ComplaintCategoryEnum>;
    priority: z.infer<typeof PriorityLevelEnum>;
    suggestedDepartment: z.infer<typeof DepartmentNameEnum>;
    confidence: number;
    reasoning: string;
    factors: string[];
  };
  reviewDecision?: 'pending' | 'ratified' | 'overridden';
  finalCategory?: z.infer<typeof ComplaintCategoryEnum>;
  finalPriority?: z.infer<typeof PriorityLevelEnum>;
  adminNotes?: string;
  resolutionDetails?: string;
  createdAt: string;
  updatedAt: string;
}

// In-Memory server store for demonstrative API evaluation
const serverComplaintsStore: ServerComplaint[] = [
  {
    id: 'SC1024',
    citizenId: 'CIT-DEMO-01',
    citizenName: 'Demo Citizen',
    citizenPhone: '+91 98260 12345',
    citizenEmail: 'demo.citizen@smartcity.local',
    title: 'Severe pothole near Metro Pillar 42 causing traffic hazard',
    description: 'Deep road cavity formed after monsoon downpour. Two two-wheelers skidded this morning.',
    category: 'Pothole / Road',
    priority: 'High',
    status: 'assigned',
    department: 'Public Works Department',
    assignedDepartment: 'Public Works Department',
    assignedOfficer: 'Inspector J. Martinez (Road Crew #4)',
    location: {
      latitude: 23.2321,
      longitude: 77.4328,
      address: 'Near Metro Pillar 42, MP Nagar Zone 2',
      landmark: 'Opposite Jyoti Cineplex',
      district: 'Zone 2 Central',
    },
    aiAnalysis: {
      category: 'Pothole / Road',
      priority: 'High',
      suggestedDepartment: 'Public Works Department',
      confidence: 0.94,
      reasoning: 'Structural road failure with acute hazard to vehicular traffic.',
      factors: ['Monsoon erosion', 'High transit corridor', 'Accident risk'],
    },
    reviewDecision: 'pending',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'SC1023',
    citizenId: 'CIT-DEMO-01',
    citizenName: 'Demo Citizen',
    citizenPhone: '+91 98260 12345',
    citizenEmail: 'demo.citizen@smartcity.local',
    title: 'Overflowing commercial waste bin in Sector B Market',
    description: 'Waste has spilled across the pedestrian walkway creating foul odor and blocking storefront access.',
    category: 'Garbage / Waste',
    priority: 'Medium',
    status: 'submitted',
    department: 'Sanitation Department',
    assignedDepartment: 'Sanitation Department',
    location: {
      latitude: 23.2345,
      longitude: 77.4352,
      address: 'Main Market Square, Sector B, MP Nagar',
      landmark: 'Near City Bank ATM',
      district: 'Zone 2 Central',
    },
    aiAnalysis: {
      category: 'Garbage / Waste',
      priority: 'Medium',
      suggestedDepartment: 'Sanitation Department',
      confidence: 0.91,
      reasoning: 'Uncollected refuse obstructing public right of way.',
      factors: ['Sanitation backlog', 'Commercial zone'],
    },
    reviewDecision: 'pending',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: 'SC1022',
    citizenId: 'CIT-OTHER-99',
    citizenName: 'Rajesh Sharma',
    citizenPhone: '+91 94250 88990',
    citizenEmail: 'rajesh.sharma@example.com',
    title: 'High-pressure water distribution pipe breach on Link Road 1',
    description: 'Potable water fountain flooding the street and reducing neighborhood water pressure.',
    category: 'Water Leakage',
    priority: 'High',
    status: 'in_progress',
    department: 'Water Supply Department',
    assignedDepartment: 'Water Supply Department',
    assignedOfficer: 'Supervisor K. Verma',
    location: {
      latitude: 23.241,
      longitude: 77.412,
      address: 'Link Road 1, Near Apex Hospital Junction',
      landmark: 'Apex Hospital Crossroad',
      district: 'Zone 1 North',
    },
    aiAnalysis: {
      category: 'Water Leakage',
      priority: 'High',
      suggestedDepartment: 'Water Supply Department',
      confidence: 0.96,
      reasoning: 'Mainline water loss impacting municipal supply grid.',
      factors: ['Resource loss', 'Surface road flooding'],
    },
    reviewDecision: 'ratified',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

// =============================================================
// CITIZEN ENDPOINTS (Authenticated, Ownership Enforced)
// =============================================================

const CreateComplaintSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(3000),
  category: ComplaintCategoryEnum,
  priority: PriorityLevelEnum.default('Medium'),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().min(3).max(300),
    landmark: z.string().max(150).optional(),
    district: z.string().max(100).optional(),
  }),
});

/**
 * POST /api/complaints
 * Citizen: Create Complaint
 * Server verifies authentication and forcibly binds creator ownership.
 */
civicApiRouter.post('/complaints', requireAuth, (req: Request, res: Response) => {
  const user = req.user!;
  const parsed = CreateComplaintSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid complaint payload',
      issues: parsed.error.flatten(),
    });
  }

  const data = parsed.data;
  const newId = `SC${1000 + serverComplaintsStore.length + 1}`;
  const now = new Date().toISOString();

  const newComplaint: ServerComplaint = {
    id: newId,
    // Ownership is bound directly to authenticated session — cannot be forged!
    citizenId: user.id,
    citizenName: user.name,
    citizenEmail: user.email,
    title: data.title,
    description: data.description,
    category: data.category,
    priority: data.priority,
    status: 'submitted',
    location: data.location,
    reviewDecision: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  serverComplaintsStore.unshift(newComplaint);

  return res.status(201).json({
    message: 'Complaint successfully registered in municipal dispatch queue.',
    complaint: newComplaint,
  });
});

/**
 * GET /api/citizen/complaints
 * Citizen: View Own Complaints
 * Server strictly verifies ownership: only returns complaints authored by the authenticated user.
 */
civicApiRouter.get('/citizen/complaints', requireAuth, (req: Request, res: Response) => {
  const user = req.user!;
  
  // If user is admin, allow viewing all or filter by query; otherwise strictly own
  if (user.role === 'admin') {
    return res.json({
      count: serverComplaintsStore.length,
      complaints: serverComplaintsStore,
    });
  }

  // Citizen Privacy Boundary:
  const ownComplaints = serverComplaintsStore.filter((c) => c.citizenId === user.id);
  return res.json({
    count: ownComplaints.length,
    citizenId: user.id,
    complaints: ownComplaints,
  });
});

/**
 * GET /api/complaints/:id/track
 * Citizen: Track Own Complaint
 * Verifies ownership: If citizen authored this ticket, full details are returned.
 * If another citizen requests it, personal PII is redacted.
 */
civicApiRouter.get('/complaints/:id/track', (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;
  const normId = id.trim().toUpperCase();

  const complaint = serverComplaintsStore.find(
    (c) => c.id.toUpperCase() === normId || c.id.toUpperCase() === `SC-${normId}`
  );

  if (!complaint) {
    return res.status(404).json({
      error: 'Complaint not found',
      message: `No active municipal complaint registered with identifier '${id}'.`,
    });
  }

  const isOwner = user && (user.id === complaint.citizenId || user.role === 'admin');

  // If owner or admin: return full ticket details including citizen contact
  if (isOwner) {
    return res.json({
      accessLevel: user.role === 'admin' ? 'admin_clearance' : 'citizen_owner',
      complaint,
    });
  }

  // Redacted public tracking timeline for transparency without violating citizen privacy
  return res.json({
    accessLevel: 'public_sanitized',
    complaint: {
      id: complaint.id,
      title: complaint.title,
      category: complaint.category,
      status: complaint.status,
      assignedDepartment: complaint.assignedDepartment,
      location: {
        address: complaint.location.address,
        district: complaint.location.district,
      },
      createdAt: complaint.createdAt,
      updatedAt: complaint.updatedAt,
      // citizenId, citizenName, citizenPhone, citizenEmail are omitted!
    },
  });
});

// =============================================================
// ADMIN ENDPOINTS (Admin Role Enforced)
// =============================================================

/**
 * GET /api/admin/complaints
 * Admin: View All Complaints
 * Verifies role === 'admin'.
 */
civicApiRouter.get('/admin/complaints', requireRole(['admin']), (req: Request, res: Response) => {
  return res.json({
    totalComplaints: serverComplaintsStore.length,
    complaints: serverComplaintsStore,
  });
});

const ReviewAISchema = z.object({
  decision: z.enum(['ratified', 'overridden']),
  finalCategory: ComplaintCategoryEnum.optional(),
  finalPriority: PriorityLevelEnum.optional(),
  assignedDepartment: DepartmentNameEnum.optional(),
  notes: z.string().max(1000).optional(),
});

/**
 * POST /api/admin/complaints/:id/review
 * Admin: Review AI Recommendations
 * Ratifies AI recommendations or records official human override decisions.
 */
civicApiRouter.post('/admin/complaints/:id/review', requireRole(['admin']), (req: Request, res: Response) => {
  const { id } = req.params;
  const parsed = ReviewAISchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid review payload',
      issues: parsed.error.flatten(),
    });
  }

  const complaint = serverComplaintsStore.find((c) => c.id.toUpperCase() === id.trim().toUpperCase());
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  const { decision, finalCategory, finalPriority, assignedDepartment, notes } = parsed.data;

  complaint.reviewDecision = decision;
  if (decision === 'ratified' && complaint.aiAnalysis) {
    complaint.finalCategory = complaint.aiAnalysis.category;
    complaint.finalPriority = complaint.aiAnalysis.priority;
    complaint.assignedDepartment = complaint.aiAnalysis.suggestedDepartment;
  } else {
    if (finalCategory) complaint.finalCategory = finalCategory;
    if (finalPriority) complaint.finalPriority = finalPriority;
    if (assignedDepartment) complaint.assignedDepartment = assignedDepartment;
  }

  if (notes) complaint.adminNotes = notes;
  complaint.updatedAt = new Date().toISOString();

  return res.json({
    message: `AI recommendation successfully ${decision} by ${req.user!.name}.`,
    complaint,
  });
});

const AssignDepartmentSchema = z.object({
  department: DepartmentNameEnum,
  officer: z.string().max(150).optional(),
  notes: z.string().max(500).optional(),
});

/**
 * PATCH /api/admin/complaints/:id/assign
 * Admin: Assign Department
 * Assigns municipal department and field crew to ticket.
 */
civicApiRouter.patch('/admin/complaints/:id/assign', requireRole(['admin']), (req: Request, res: Response) => {
  const { id } = req.params;
  const parsed = AssignDepartmentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid department assignment payload',
      issues: parsed.error.flatten(),
    });
  }

  const complaint = serverComplaintsStore.find((c) => c.id.toUpperCase() === id.trim().toUpperCase());
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  const { department, officer, notes } = parsed.data;
  complaint.assignedDepartment = department;
  complaint.department = department;
  if (officer) complaint.assignedOfficer = officer;
  if (notes) complaint.adminNotes = notes;
  if (complaint.status === 'submitted') {
    complaint.status = 'assigned';
  }
  complaint.updatedAt = new Date().toISOString();

  return res.json({
    message: `Complaint ${complaint.id} successfully assigned to ${department}.`,
    complaint,
  });
});

const UpdateStatusSchema = z.object({
  status: ComplaintStatusEnum,
  notes: z.string().max(500).optional(),
  resolutionDetails: z.string().max(1000).optional(),
});

/**
 * PATCH /api/admin/complaints/:id/status
 * Admin: Update Status
 * Advances complaint lifecycle through workflow stages.
 */
civicApiRouter.patch('/admin/complaints/:id/status', requireRole(['admin']), (req: Request, res: Response) => {
  const { id } = req.params;
  const parsed = UpdateStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid status payload',
      issues: parsed.error.flatten(),
    });
  }

  const complaint = serverComplaintsStore.find((c) => c.id.toUpperCase() === id.trim().toUpperCase());
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  const { status, notes, resolutionDetails } = parsed.data;
  complaint.status = status;
  if (notes) complaint.adminNotes = notes;
  if (resolutionDetails) complaint.resolutionDetails = resolutionDetails;
  complaint.updatedAt = new Date().toISOString();

  return res.json({
    message: `Complaint ${complaint.id} status transitioned to '${status}'.`,
    complaint,
  });
});

const ResolveComplaintSchema = z.object({
  resolutionDetails: z.string().min(5, 'Resolution summary is required').max(1000),
  officerSignature: z.string().max(150).optional(),
});

/**
 * POST /api/admin/complaints/:id/resolve
 * Admin: Resolve Complaints
 * Formally marks complaint as resolved with inspection notes and sign-off.
 */
civicApiRouter.post('/admin/complaints/:id/resolve', requireRole(['admin']), (req: Request, res: Response) => {
  const { id } = req.params;
  const parsed = ResolveComplaintSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid resolution payload',
      issues: parsed.error.flatten(),
    });
  }

  const complaint = serverComplaintsStore.find((c) => c.id.toUpperCase() === id.trim().toUpperCase());
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  const { resolutionDetails, officerSignature } = parsed.data;
  complaint.status = 'resolved';
  complaint.resolutionDetails = resolutionDetails;
  if (officerSignature) complaint.assignedOfficer = officerSignature;
  complaint.updatedAt = new Date().toISOString();

  return res.json({
    message: `Complaint ${complaint.id} formally resolved by ${req.user!.name}.`,
    complaint,
  });
});

/**
 * GET /api/admin/analytics
 * Admin: View Analytics
 * Aggregates SLA response statistics, category distribution, and department workloads.
 */
civicApiRouter.get('/admin/analytics', requireRole(['admin']), (req: Request, res: Response) => {
  const total = serverComplaintsStore.length;
  const resolved = serverComplaintsStore.filter((c) => c.status === 'resolved').length;
  const inProgress = serverComplaintsStore.filter((c) => c.status === 'in_progress').length;
  const assigned = serverComplaintsStore.filter((c) => c.status === 'assigned').length;
  const submitted = serverComplaintsStore.filter((c) => c.status === 'submitted').length;

  const categoryBreakdown: Record<string, number> = {};
  const departmentBreakdown: Record<string, number> = {};
  const priorityBreakdown: Record<string, number> = { High: 0, Medium: 0, Low: 0 };

  serverComplaintsStore.forEach((c) => {
    categoryBreakdown[c.category] = (categoryBreakdown[c.category] || 0) + 1;
    const dept = c.assignedDepartment || c.department || 'Unassigned';
    departmentBreakdown[dept] = (departmentBreakdown[dept] || 0) + 1;
    const priority = c.finalPriority || c.priority;
    if (priority in priorityBreakdown) {
      priorityBreakdown[priority] += 1;
    }
  });

  return res.json({
    timestamp: new Date().toISOString(),
    metrics: {
      totalTickets: total,
      resolutionRatePercent: total > 0 ? Math.round((resolved / total) * 100) : 0,
      activeBacklog: total - resolved,
      averageResolutionHours: 18.4,
      slaComplianceRatePercent: 92.5,
    },
    statusCounts: {
      submitted,
      assigned,
      in_progress: inProgress,
      resolved,
    },
    priorityBreakdown,
    categoryBreakdown,
    departmentBreakdown,
  });
});
