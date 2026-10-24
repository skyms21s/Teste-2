import { z } from 'zod';
import { parsePrice } from '@/lib/utils/currency';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : null));

export const categorySchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome da categoria.').max(60),
  description: optionalText(300),
  position: z.coerce.number().int().min(0).max(999).default(0),
  isActive: z.boolean().default(true),
});

export const productSchema = z.object({
  categoryId: z.string().uuid('Escolha uma categoria.'),
  name: z.string().trim().min(2, 'Informe o nome do produto.').max(120),
  description: optionalText(500),
  price: z
    .string()
    .trim()
    .min(1, 'Informe o preco.')
    .transform((value, ctx) => {
      const parsed = parsePrice(value);
      if (parsed === null) {
        ctx.addIssue({ code: 'custom', message: 'Preco invalido. Use o formato 24,90.' });
        return z.NEVER;
      }
      if (parsed < 0) {
        ctx.addIssue({ code: 'custom', message: 'O preco nao pode ser negativo.' });
        return z.NEVER;
      }
      if (parsed > 99999999) {
        ctx.addIssue({ code: 'custom', message: 'Preco acima do limite.' });
        return z.NEVER;
      }
      return parsed;
    }),
  position: z.coerce.number().int().min(0).max(999).default(0),
  isActive: z.boolean().default(true),
});

export type CategoryInput = z.infer<typeof categorySchema>;
export type ProductInput = z.infer<typeof productSchema>;
