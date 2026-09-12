'use client';

import { useState } from 'react';
import { FormField } from '@/components/ui/label';
import { cn } from '@/lib/utils/cn';

export function ImageUploadField({
  name,
  label,
  hint,
  currentUrl,
  errors,
  aspect = 'square',
}: {
  name: 'logo' | 'cover';
  label: string;
  hint?: string;
  currentUrl: string | null;
  errors?: string[];
  aspect?: 'square' | 'wide';
}) {
  const [preview, setPreview] = useState<string | null>(currentUrl);

  return (
    <FormField label={label} htmlFor={name} hint={hint} errors={errors}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className={cn(
            'flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400',
            aspect === 'square' ? 'h-20 w-20' : 'h-20 w-40',
          )}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt={label} className="h-full w-full object-cover" />
          ) : (
            'Sem imagem'
          )}
        </div>

        <input
          id={name}
          name={name}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(event) => {
            const file = event.target.files?.[0];
            setPreview(file ? URL.createObjectURL(file) : currentUrl);
          }}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
        />
      </div>
    </FormField>
  );
}
