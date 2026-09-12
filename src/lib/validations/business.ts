import { z } from 'zod';
import { SLUG_PATTERN } from '@/lib/utils/slug';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : null));

export const createBusinessSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome da empresa.').max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'O link deve ter no minimo 3 caracteres.')
    .max(60)
    .regex(SLUG_PATTERN, 'Use apenas letras minusculas, numeros e hifens (ex: ponto-de-encontro).'),
  phone: optionalText(30),
  address: optionalText(255),
  description: optionalText(500),
});

export const updateBusinessSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome da empresa.').max(120),
  phone: optionalText(30),
  address: optionalText(255),
  description: optionalText(500),
});

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;

export const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2 MB
export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

export const imageFileSchema = z
  .instanceof(File)
  .refine((file) => file.size > 0, 'Arquivo vazio.')
  .refine((file) => file.size <= MAX_IMAGE_SIZE, 'A imagem deve ter no maximo 2 MB.')
  .refine(
    (file) => (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type),
    'Formatos aceitos: PNG, JPG ou WEBP.',
  );
