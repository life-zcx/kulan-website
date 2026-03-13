'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function createBrand(formData: FormData) {
    const name = formData.get('name') as string;
    const imageFile = formData.get('logo') as File;
    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + '-' + Date.now().toString().slice(-4);

    let logoPath = null;
    if (imageFile && imageFile.size > 0) {
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filename = 'brand-' + Date.now() + '-' + imageFile.name.replace(/\s/g, '-');
        const uploadDir = path.join(process.cwd(), 'public/uploads');

        await mkdir(uploadDir, { recursive: true });
        await writeFile(path.join(uploadDir, filename), buffer);
        logoPath = `/uploads/${filename}`;
    }

    const { getSession } = require('@/lib/auth');
    const session = await getSession();

    await prisma.brand.create({
        data: {
            name,
            slug,
            logo: logoPath,
            createdById: session?.user?.id ? session.user.id : null,
        },
    });

    revalidatePath('/admin/brands');
    redirect('/admin/brands');
}

export async function updateBrand(formData: FormData) {
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const imageFile = formData.get('logo') as File;

    if (!id || !name) return;

    const brand = await prisma.brand.findUnique({ where: { id: parseInt(id) } });
    if (!brand) return;

    let logoPath = brand.logo;
    if (imageFile && imageFile.size > 0) {
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filename = 'brand-' + Date.now() + '-' + imageFile.name.replace(/\s/g, '-');
        const uploadDir = path.join(process.cwd(), 'public/uploads');

        await mkdir(uploadDir, { recursive: true });
        await writeFile(path.join(uploadDir, filename), buffer);
        logoPath = `/uploads/${filename}`;
    }

    await prisma.brand.update({
        where: { id: parseInt(id) },
        data: {
            name,
            logo: logoPath
        }
    });

    revalidatePath('/admin/brands');
    redirect('/admin/brands');
}

export async function deleteBrand(id: number) {
    try {
        const productsCount = await prisma.product.count({ where: { brandId: id } });
        if (productsCount > 0) return { error: 'Нельзя удалить: бренд используется в товарах' };

        await prisma.brand.delete({ where: { id } });
        revalidatePath('/admin/brands');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: 'Ошибка удаления' };
    }
}
