import { z } from 'zod';

export const ComplaintCategorySchema = z.enum([
  'Pothole / Road',
  'Garbage / Waste',
  'Water Leakage',
  'Streetlight',
  'Traffic',
  'Infrastructure',
  'Other',
]);

export const PriorityLevelSchema = z.enum(['Low', 'Medium', 'High']);

export const DepartmentNameSchema = z.enum([
  'Public Works Department',
  'Sanitation Department',
  'Water Supply Department',
  'Electrical Department',
  'Traffic & Transit Department',
  'Urban Infrastructure Division',
  'General Municipal Administration',
]);

export const ComplaintStatusSchema = z.enum([
  'submitted',
  'assigned',
  'in_progress',
  'resolved',
]);

// Request payload schema for POST /api/ai/analyze
export const AnalyzeRequestSchema = z.object({
  description: z.string().min(1, 'Description is required').max(3000, 'Description exceeds 3000 characters limit'),
  userCategory: ComplaintCategorySchema.optional(),
  userSeverity: PriorityLevelSchema.optional(),
  location: z
    .object({
      latitude: z.number().min(-90).max(90).optional(),
      longitude: z.number().min(-180).max(180).optional(),
      lat: z.number().min(-90).max(90).optional(),
      lng: z.number().min(-180).max(180).optional(),
      address: z.string().max(300).optional(),
      landmark: z.string().max(150).optional(),
      district: z.string().max(100).optional(),
    })
    .optional(),
  existingComplaintsCount: z.number().int().min(0).max(10000).optional(),
});

// Gemini output verification schema - strictly validated!
export const GeminiOutputSchema = z.object({
  category: ComplaintCategorySchema,
  priority: PriorityLevelSchema,
  department: DepartmentNameSchema,
  confidence: z.number().min(0).max(1),
  reasoning: z.string().min(10, 'Reasoning must be at least 10 characters').max(1000),
  factors: z.array(z.string().min(2).max(200)).min(1).max(10),
  publicImpactScore: z.number().min(1).max(10),
  urgencyIndicators: z.array(z.string().max(200)).default([]),
});

// Insights request & output schema
export const InsightsRequestSchema = z.object({
  complaints: z
    .array(
      z.object({
        id: z.string().max(50),
        category: z.string().max(100),
        severity: z.string().max(50),
        status: z.string().max(50),
        location: z.string().max(300).optional(),
        description: z.string().max(1000).optional(),
      })
    )
    .max(50),
});

export const GeminiInsightItemSchema = z.object({
  title: z.string().min(3).max(200),
  detectedPattern: z.string().min(5).max(1000),
  recommendation: z.string().min(5).max(1000),
  priority: PriorityLevelSchema,
  suggestedDepartment: DepartmentNameSchema,
  department: DepartmentNameSchema.optional(),
  location: z.string().max(200),
  relatedComplaintIds: z.array(z.string().max(50)).default([]),
  potentialCauseHypothesis: z.string().min(5).max(1000),
  estimatedImpact: z.string().max(500).default(''),
  disclaimer: z.string().default('AI-generated hypothesis — requires administrative validation.'),
});

export const GeminiInsightsSchema = z.object({
  insights: z.array(GeminiInsightItemSchema),
});
