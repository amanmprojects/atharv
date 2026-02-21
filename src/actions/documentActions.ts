'use server';

import { db } from '@/lib/gcp/firestore';
import { revalidatePath } from 'next/cache';

export interface DocumentData {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

const docsCollection = db.collection('documents');

export async function createDocument(title: string): Promise<DocumentData> {
    const docRef = docsCollection.doc();
    const now = new Date().toISOString();

    const docData = {
        title,
        content: '<p></p>',
        createdAt: now,
        updatedAt: now,
    };

    await docRef.set(docData);

    revalidatePath('/');

    return {
        id: docRef.id,
        ...docData,
    };
}

export async function listDocuments(): Promise<DocumentData[]> {
    try {
        const snapshot = await docsCollection.orderBy('updatedAt', 'desc').get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as Omit<DocumentData, 'id'>)
        }));
    } catch (error) {
        console.error('Error fetching documents:', error);
        return [];
    }
}

export async function getDocument(id: string): Promise<DocumentData | null> {
    try {
        const docRef = docsCollection.doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return null;
        }

        return {
            id: docSnap.id,
            ...(docSnap.data() as Omit<DocumentData, 'id'>)
        };
    } catch (error) {
        console.error(`Error fetching document ${id}:`, error);
        return null;
    }
}

export async function updateDocument(id: string, content: string): Promise<void> {
    const docRef = docsCollection.doc(id);
    const now = new Date().toISOString();

    await docRef.update({
        content,
        updatedAt: now,
    });

    revalidatePath(`/document/${id}`);
}
