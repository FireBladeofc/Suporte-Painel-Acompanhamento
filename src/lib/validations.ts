import { z } from 'zod';

// === Collaborator Validation ===
export const collaboratorNameSchema = z
  .string()
  .trim()
  .min(1, 'Nome é obrigatório')
  .max(100, 'Nome deve ter no máximo 100 caracteres');

export const collaboratorRoleSchema = z.enum(
  ['N1', 'N2', 'implantador', 'financeiro', 'cs', 'tecnico_treinamento'],
  { errorMap: () => ({ message: 'Cargo inválido' }) }
);

export const addCollaboratorSchema = z.object({
  name: collaboratorNameSchema,
  role: collaboratorRoleSchema,
});

// === Warning Validation ===
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (formato esperado: AAAA-MM-DD)');

export const warningTypeSchema = z.enum(['verbal', 'escrita', 'suspensao'], {
  errorMap: () => ({ message: 'Tipo de advertência inválido' }),
});

export const addWarningSchema = z.object({
  warning_date: dateSchema,
  type: warningTypeSchema,
  reason: z
    .string()
    .trim()
    .min(1, 'Motivo é obrigatório')
    .max(500, 'Motivo deve ter no máximo 500 caracteres'),
  details: z
    .string()
    .max(2000, 'Detalhes devem ter no máximo 2000 caracteres')
    .optional(),
});

// === Attention Flag Validation ===
export const attentionFlagSeveritySchema = z.enum(['baixa', 'media', 'alta', 'critica'], {
  errorMap: () => ({ message: 'Severidade inválida' }),
});

export const addAttentionFlagSchema = z.object({
  flag_date: dateSchema,
  severity: attentionFlagSeveritySchema,
  description: z
    .string()
    .trim()
    .min(1, 'Descrição é obrigatória')
    .max(2000, 'Descrição deve ter no máximo 2000 caracteres'),
});

// === Manual Feedback Validation ===
export const manualFeedbackStatusSchema = z.enum(['pending', 'completed', 'cancelled'], {
  errorMap: () => ({ message: 'Status inválido' }),
});

export const manualFeedbackCategorySchema = z.enum(
  ['performance', 'behavior', 'recognition', 'other'],
  { errorMap: () => ({ message: 'Categoria inválida' }) }
).nullable();

export const addManualFeedbackSchema = z.object({
  feedback_date: dateSchema,
  status: manualFeedbackStatusSchema,
  category: manualFeedbackCategorySchema,
  observations: z
    .string()
    .max(5000, 'Observações devem ter no máximo 5000 caracteres')
    .nullable(),
});

// === Profile Validation ===
export const profileSchema = z.object({
  work_start_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Horário inválido (formato HH:MM)')
    .nullable()
    .optional(),
  work_end_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Horário inválido (formato HH:MM)')
    .nullable()
    .optional(),
  technical_level: z
    .number()
    .int()
    .min(1, 'Nível técnico deve ser entre 1 e 5')
    .max(5, 'Nível técnico deve ser entre 1 e 5')
    .nullable()
    .optional(),
  communication_level: z
    .number()
    .int()
    .min(1, 'Nível de comunicação deve ser entre 1 e 5')
    .max(5, 'Nível de comunicação deve ser entre 1 e 5')
    .nullable()
    .optional(),
  main_difficulties: z
    .array(z.string().max(200, 'Cada dificuldade deve ter no máximo 200 caracteres'))
    .max(20, 'Máximo de 20 dificuldades')
    .nullable()
    .optional(),
  work_days: z
    .array(z.string())
    .nullable()
    .optional(),
});

// Helper to extract first error message from ZodError
export function getFirstZodError(error: z.ZodError): string {
  return error.errors[0]?.message || 'Dados inválidos';
}
