'use server';

import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { CreateUserSchema, UpdateUserSchema } from '@/lib/validations';
import type { FormState } from '@/types';


export async function createUser(formData: FormData): Promise<void | never> {
    const validatedFields = CreateUserSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        role: formData.get('role') || 'admin',
    });

    if (!validatedFields.success) {
        return;
    }

    const { name, email, password, role } = validatedFields.data;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
            },
        });
    } catch (error) {
        console.error('Error creating user:', error);
    }

    revalidatePath('/admin/users');
    redirect('/admin/users');
}

export async function updateUser(formData: FormData): Promise<void | never> {
    const validatedFields = UpdateUserSchema.safeParse({
        id: formData.get('id'),
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        role: formData.get('role'),
    });

    if (!validatedFields.success) {
        return;
    }

    const { id, name, email, password, role } = validatedFields.data;

    try {
        const updateData: any = {
            name,
            email,
            role,
        };

        // Update password only if provided
        if (password && password.trim().length > 0) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        await prisma.user.update({
            where: { id },
            data: updateData
        });

    } catch (error) {
        console.error('Error updating user:', error);
    }

    revalidatePath('/admin/users');
    redirect('/admin/users');
}

export async function deleteUser(id: number): Promise<{ success: boolean } | { error: string }> {
    try {
        await prisma.user.delete({ where: { id } });
        revalidatePath('/admin/users');
        return { success: true };
    } catch (error) {
        console.error('Error deleting user:', error);
        return { error: 'Ошибка удаления пользователя' };
    }
}
