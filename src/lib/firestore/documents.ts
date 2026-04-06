import { collection, doc, setDoc, getDoc, getDocs, query, where, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { AIDocument } from '../../types';

const COLLECTION = 'documents';

export async function createDocument(docData: Omit<AIDocument, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<string> {
  try {
    const docRef = doc(collection(db, COLLECTION));
    const newDoc: AIDocument = {
      ...docData,
      id: docRef.id,
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await setDoc(docRef, newDoc);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTION);
    throw error;
  }
}

export async function getDocument(id: string): Promise<AIDocument | null> {
  try {
    const snap = await getDoc(doc(db, COLLECTION, id));
    return snap.exists() ? (snap.data() as AIDocument) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${COLLECTION}/${id}`);
    return null;
  }
}

export async function getUserDocuments(userId: string): Promise<AIDocument[]> {
  try {
    const q = query(
      collection(db, COLLECTION), 
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as AIDocument);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION);
    return [];
  }
}

export async function updateDocumentContent(id: string, content: string, title?: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION, id);
    const update: any = {
      content,
      updatedAt: Date.now()
    };
    if (title) update.title = title;
    
    await updateDoc(docRef, update);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION}/${id}`);
  }
}

export async function shareDocument(id: string, sharedWith: string[]): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      sharedWith,
      updatedAt: Date.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION}/${id}`);
  }
}
