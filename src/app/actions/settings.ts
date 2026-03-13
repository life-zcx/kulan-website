'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateSiteSettings(formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());

    // We iterate over known keys or all submitted keys
    const keys = ['stat_years', 'stat_clients', 'stat_brands', 'stat_branches', 'stat_employees'];

    try {
        for (const key of keys) {
            if (rawData[key] !== undefined) {
                await prisma.siteSetting.upsert({
                    where: { key },
                    update: { value: rawData[key] as string },
                    create: { key, value: rawData[key] as string }
                });
            }
        }
        revalidatePath('/');
        revalidatePath('/admin/stats');
    } catch (error) {
        console.error("Failed to update settings:", error);
    }
}

// Branch actions moved to src/app/actions/branches.ts
