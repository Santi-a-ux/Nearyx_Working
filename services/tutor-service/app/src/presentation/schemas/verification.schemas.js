import { z } from 'zod';
import { uuid, pagination } from './common.schemas.js';

const year = z.number().int().min(1900).max(2100).nullish();

const educationItem = z.object({
  degree: z.string().max(150),
  institution: z.string().max(150),
  field: z.string().max(150).nullish(),
  start_year: year,
  end_year: year,
});

const certificationItem = z.object({
  name: z.string().max(150),
  issuer: z.string().max(150).nullish(),
  year,
});

const experienceItem = z.object({
  role: z.string().max(150),
  organization: z.string().max(150).nullish(),
  start_year: year,
  end_year: year,
  description: z.string().max(1000).nullish(),
});

const documentItem = z.object({
  file_url: z.string().max(500),
  file_name: z.string().max(255).nullish(),
  doc_type: z.string().max(50).nullish(),
});

export const submitVerificationSchema = z.object({
  summary: z.string().max(2000).nullish(),
  education: z.array(educationItem).min(1),
  certifications: z.array(certificationItem).default([]),
  experience: z.array(experienceItem).default([]),
  skills: z.array(z.string()).default([]),
  documents: z.array(documentItem).min(1),
});

export const listVerificationQuerySchema = z.object({
  status: z.string().optional(),
  ...pagination(50),
});

export const reviewVerificationSchema = z.object({
  status: z.string(),
  review_notes: z.string().max(1000).nullish(),
});

export const requestIdParamSchema = z.object({ request_id: uuid });
