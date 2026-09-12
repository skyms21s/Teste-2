import { z } from 'zod';

const email = z.string().trim().min(1, 'Informe o e-mail.').email('E-mail invalido.');
const password = z.string().min(8, 'A senha deve ter no minimo 8 caracteres.').max(72);

export const signInSchema = z.object({
  email,
  password: z.string().min(1, 'Informe a senha.'),
});

export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(3, 'Informe seu nome completo.').max(120),
    email,
    password,
    confirmPassword: z.string().min(1, 'Confirme a senha.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas nao conferem.',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({ email });

export const newPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string().min(1, 'Confirme a senha.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas nao conferem.',
    path: ['confirmPassword'],
  });

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type NewPasswordInput = z.infer<typeof newPasswordSchema>;
