'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { createProduct, updateProduct } from '@/app/actions/product';
import { useRouter } from 'next/navigation';

const RichTextEditor = dynamic(() => import('./RichTextEditor'), { ssr: false });

type Spec = { id: string; label: string; value: string };
type Doc = { id: string; name: string; file: File | null; url?: string };
type GalleryItem = { id: string; file: File | null; url?: string };

interface ProductFormProps {
    initialData?: any;
    categories: any[];
    brands: any[];
}

export default function ProductForm({ initialData, categories, brands }: ProductFormProps) {
    const router = useRouter();
    const isEditMode = !!initialData;
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Basic Fields
    const [name, setName] = useState(initialData?.name || '');
    const [article, setArticle] = useState(initialData?.article || '');
    const [slug, setSlug] = useState(initialData?.slug || '');
    const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
    const [brandId, setBrandId] = useState(initialData?.brandId || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [applicability, setApplicability] = useState(initialData?.applicability || '');

    // Dynamic Lists
    const [specs, setSpecs] = useState<Spec[]>([]);
    const [docs, setDocs] = useState<Doc[]>([]);
    const [gallery, setGallery] = useState<GalleryItem[]>([]);
    const [mainImage, setMainImage] = useState<string | File | null>(initialData?.image || null);

    // Init Data parsing
    useEffect(() => {
        if (initialData) {
            try {
                const parsedSpecs = JSON.parse(initialData.specs || '[]');
                setSpecs(parsedSpecs.map((s: any) => ({ ...s, id: Math.random().toString(36).substr(2, 9) })));
            } catch (e) { setSpecs([]); }

            try {
                const parsedDocs = JSON.parse(initialData.documents || '[]');
                setDocs(parsedDocs.map((d: any) => ({ ...d, id: Math.random().toString(36).substr(2, 9) })));
            } catch (e) { setDocs([]); }

            try {
                const parsedGallery = JSON.parse(initialData.gallery || '[]');
                setGallery(parsedGallery.map((url: string) => ({
                    id: Math.random().toString(36).substr(2, 9),
                    url,
                    file: null
                })));
            } catch (e) { setGallery([]); }
        }
    }, [initialData]);

    const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) setMainImage(e.target.files[0]);
    };

    // Lists Handlers
    const addSpec = () => setSpecs([...specs, { id: Math.random().toString(), label: '', value: '' }]);
    const removeSpec = (id: string) => setSpecs(specs.filter(s => s.id !== id));
    const updateSpec = (id: string, field: 'label' | 'value', val: string) => {
        setSpecs(specs.map(s => s.id === id ? { ...s, [field]: val } : s));
    };

    const addDoc = () => setDocs([...docs, { id: Math.random().toString(), name: '', file: null }]);
    const removeDoc = (id: string) => setDocs(docs.filter(d => d.id !== id));
    const updateDocName = (id: string, val: string) => setDocs(docs.map(d => d.id === id ? { ...d, name: val } : d));
    const updateDocFile = (id: string, file: File) => setDocs(docs.map(d => d.id === id ? { ...d, file } : d));

    const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newItems = Array.from(e.target.files).map(file => ({
                id: Math.random().toString(),
                file,
                url: URL.createObjectURL(file)
            }));
            setGallery([...gallery, ...newItems]);
        }
    };
    const removeGalleryItem = (id: string) => setGallery(gallery.filter(i => i.id !== id));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPending(true);
        setError(null);

        const formData = new FormData();
        if (isEditMode) formData.append('id', initialData.id.toString());

        formData.append('name', name);
        formData.append('article', article);
        formData.append('slug', slug);
        formData.append('categoryId', categoryId.toString());
        formData.append('brandId', brandId.toString());
        formData.append('description', description);
        formData.append('applicability', applicability);

        if (mainImage instanceof File) formData.append('image', mainImage);

        const validSpecs = specs.filter(s => s.label.trim() && s.value.trim()).map(({ label, value }) => ({ label, value }));
        formData.append('specs', JSON.stringify(validSpecs));

        const docsMeta = docs.map(d => ({
            id: d.id, name: d.name, originalUrl: d.url || null, hasNewFile: !!d.file
        }));
        formData.append('documents_meta', JSON.stringify(docsMeta));
        docs.forEach(d => { if (d.file) formData.append(`doc_file_${d.id}`, d.file); });

        const galleryMeta = gallery.map(g => ({
            id: g.id, originalUrl: g.url || null, hasNewFile: !!g.file
        }));
        formData.append('gallery_meta', JSON.stringify(galleryMeta));
        gallery.forEach(g => { if (g.file) formData.append(`gallery_file_${g.id}`, g.file); });

        try {
            const result = isEditMode ? await updateProduct(formData) : await createProduct(formData);
            if (result && !result.success) {
                setError(result.error);
                setIsPending(false);
            } else {
                router.refresh();
                router.push('/admin/products');
            }
        } catch (err) {
            console.error(err);
            setError('Произошла ошибка при сохранении');
            setIsPending(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Название товара</label>
                    <input
                        value={name} onChange={e => setName(e.target.value)}
                        required className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-kulanBlue transition"
                        placeholder="Название"
                    />
                </div>
                <div className="md:col-span-3">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Артикул</label>
                    <input
                        value={article} onChange={e => setArticle(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-kulanBlue transition"
                        placeholder="Артикул"
                    />
                </div>
                <div className="md:col-span-3">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Slug</label>
                    <input
                        value={slug} onChange={e => setSlug(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-kulanBlue transition"
                        placeholder="auto"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Категория</label>
                    <select
                        value={categoryId} onChange={e => setCategoryId(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-kulanBlue transition bg-white"
                    >
                        <option value="">Без категории</option>
                        {categories.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Бренд</label>
                    <select
                        value={brandId} onChange={e => setBrandId(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-kulanBlue transition bg-white"
                    >
                        <option value="">Без бренда</option>
                        {brands.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Images */}
            <div className="p-6 bg-white border border-gray-100 rounded-2xl">
                <label className="block text-sm font-bold text-gray-700 mb-4">Основное фото</label>
                <div className="flex items-start gap-6 flex-wrap">
                    {(mainImage && typeof mainImage === 'string') && (
                        <div className="relative w-32 h-32 bg-white rounded-lg border border-gray-200 p-2">
                            <Image src={mainImage} alt="Main" fill className="object-contain" />
                        </div>
                    )}
                    {(mainImage && mainImage instanceof File) && (
                        <div className="relative w-32 h-32 bg-white rounded-lg border border-gray-200 p-2">
                            <img src={URL.createObjectURL(mainImage)} alt="Preview" className="w-full h-full object-contain" />
                        </div>
                    )}
                    <div className="flex-1 min-w-[200px]">
                        <input
                            type="file"
                            onChange={handleMainImageChange}
                            accept="image/*"
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-kulanBlue file:text-white hover:file:bg-blue-900 cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            <div className="p-6 bg-white border border-gray-100 rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-bold text-gray-700">Галерея</label>
                    <label className="cursor-pointer bg-white text-kulanBlue border border-kulanBlue px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-50 transition">
                        <i className="fas fa-plus mr-2"></i> Добавить фото
                        <input type="file" multiple onChange={handleGalleryUpload} className="hidden" accept="image/*" />
                    </label>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    {gallery.map(item => (
                        <div key={item.id} className="relative group w-full aspect-square bg-white rounded-lg border border-gray-200 p-2 overflow-hidden flex items-center justify-center">
                            {(item.file || item.url) && (
                                <Image
                                    src={item.file ? item.url! : item.url!}
                                    alt="" fill className="object-contain p-2"
                                    unoptimized={!!item.file}
                                />
                            )}
                            <button type="button" onClick={() => removeGalleryItem(item.id)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm z-10">
                                <i className="fas fa-times text-xs"></i>
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Описание</label>
                <div className="h-64 mb-12">
                    <RichTextEditor value={description} onChange={setDescription} />
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 mt-8">Применимость</label>
                <div className="h-48 mb-12">
                    <RichTextEditor value={applicability} onChange={setApplicability} />
                </div>
            </div>

            {/* Specs */}
            <div className="p-6 bg-white border border-gray-100 rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-bold text-gray-700">Характеристики</label>
                    <button type="button" onClick={addSpec} className="text-kulanBlue text-sm font-bold hover:underline">Добавить</button>
                </div>
                <div className="space-y-2">
                    {specs.map(spec => (
                        <div key={spec.id} className="flex gap-2 items-center">
                            <input
                                value={spec.label} onChange={e => updateSpec(spec.id, 'label', e.target.value)}
                                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm"
                                placeholder="Название"
                            />
                            <input
                                value={spec.value} onChange={e => updateSpec(spec.id, 'value', e.target.value)}
                                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm"
                                placeholder="Значение"
                            />
                            <button type="button" onClick={() => removeSpec(spec.id)} className="text-red-400 hover:text-red-600"><i className="fas fa-trash"></i></button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Docs */}
            <div className="p-6 bg-white border border-gray-100 rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-bold text-gray-700">Документы</label>
                    <button type="button" onClick={addDoc} className="text-kulanBlue text-sm font-bold hover:underline">Добавить</button>
                </div>
                <div className="space-y-4">
                    {docs.map(doc => (
                        <div key={doc.id} className="flex items-center gap-2">
                            <input
                                value={doc.name} onChange={e => updateDocName(doc.id, e.target.value)}
                                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm"
                                placeholder="Название"
                            />
                            <input
                                type="file"
                                onChange={e => e.target.files && updateDocFile(doc.id, e.target.files[0])}
                                className="text-xs text-gray-500"
                            />
                            <button type="button" onClick={() => removeDoc(doc.id)} className="text-red-400"><i className="fas fa-trash"></i></button>
                        </div>
                    ))}
                </div>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl font-bold">{error}</div>}

            <div className="flex justify-end gap-4 border-t border-gray-100 pt-6">
                <button type="button" onClick={() => router.back()} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition">Отмена</button>
                <button type="submit" disabled={isPending} className="bg-kulanBlue text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-900 transition flex items-center gap-2 shadow-lg shadow-blue-500/30">
                    {isPending ? 'Сохранение...' : (isEditMode ? 'Сохранить' : 'Создать')}
                </button>
            </div>
        </form>
    );
}
