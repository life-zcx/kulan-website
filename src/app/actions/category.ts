'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createCategory(formData: FormData) {
    const title = formData.get('title') as string;
    const parentIdStr = formData.get('parentId') as string;
    const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + '-' + Date.now().toString().slice(-4);
    const parentId = parentIdStr ? parseInt(parentIdStr) : null;
    const { getSession } = require('@/lib/auth');
    const session = await getSession();

    await prisma.category.create({
        data: {
            title,
            slug,
            parentId: parentId,
            createdById: session?.user?.id ? session.user.id : null,
        },
    });

    revalidatePath('/admin/categories');
    redirect('/admin/categories');
}

export async function updateCategory(formData: FormData) {
    const id = formData.get('id') as string;
    const title = formData.get('title') as string;
    const parentIdStr = formData.get('parentId') as string;

    // Optional: update slug or keep it? Let's keep update simple for now. 
    // Usually slug is updated if title changes significantly or user requests it. 
    // Here we won't auto-update slug to avoid breaking links.

    const parentId = parentIdStr ? parseInt(parentIdStr) : null;

    if (!id || !title) return;

    await prisma.category.update({
        where: { id: parseInt(id) },
        data: {
            title,
            parentId: parentId
        }
    });

    revalidatePath('/admin/categories');
    redirect('/admin/categories');
}

export async function deleteCategory(id: number) {
    try {
        // Optional: Check for children or products before delete? 
        // Prisma will throw error if foreign key constraints exist constraints (Product -> Category, Category -> Parent).
        // Let's assume on delete cascade or restrict. If restrict, this will fail if products exist.

        // Let's manual check usually safer
        const productsCount = await prisma.product.count({ where: { categoryId: id } });
        if (productsCount > 0) return { error: 'Нельзя удалить: в категории есть товары' };

        const childrenCount = await prisma.category.count({ where: { parentId: id } });
        if (childrenCount > 0) return { error: 'Нельзя удалить: есть подкатегории' };

        await prisma.category.delete({ where: { id } });

        revalidatePath('/admin/categories');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: 'Ошибка удаления' };
    }
}
