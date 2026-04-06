import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs,
  limit,
  increment,
  getDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { CommunityPost, IslandCode } from '../../types';

const COLLECTION = 'community_posts';
const COMMENTS_COLLECTION = 'community_comments';

export interface PostComment {
  id?: string;
  postId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  content: string;
  createdAt: number;
}

export async function getPostsByIsland(island: IslandCode): Promise<CommunityPost[]> {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('islandCode', '==', island),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommunityPost));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION);
    return [];
  }
}

export async function getPostsByEstate(estateSlug: string): Promise<CommunityPost[]> {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('estateSlug', '==', estateSlug),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommunityPost));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION);
    return [];
  }
}

export async function createPost(post: Omit<CommunityPost, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'commentsCount'>): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...post,
      likes: 0,
      commentsCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTION);
    return null;
  }
}

export function subscribeToIslandPosts(island: IslandCode, callback: (posts: CommunityPost[]) => void) {
  const q = query(
    collection(db, COLLECTION),
    where('islandCode', '==', island),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  
  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommunityPost));
    callback(posts);
  }, (error) => handleFirestoreError(error, OperationType.LIST, COLLECTION));
}

export async function likePost(postId: string) {
  try {
    const postRef = doc(db, COLLECTION, postId);
    await updateDoc(postRef, {
      likes: increment(1),
      updatedAt: Date.now()
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION}/${postId}`);
    return false;
  }
}

export async function addComment(comment: Omit<PostComment, 'id' | 'createdAt'>) {
  try {
    const commentData = {
      ...comment,
      createdAt: Date.now()
    };
    await addDoc(collection(db, COMMENTS_COLLECTION), commentData);
    
    // Update comment count on post
    const postRef = doc(db, COLLECTION, comment.postId);
    await updateDoc(postRef, {
      commentsCount: increment(1),
      updatedAt: Date.now()
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COMMENTS_COLLECTION);
    return false;
  }
}

export function subscribeToComments(postId: string, callback: (comments: PostComment[]) => void) {
  const q = query(
    collection(db, COMMENTS_COLLECTION),
    where('postId', '==', postId),
    orderBy('createdAt', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PostComment));
    callback(comments);
  }, (error) => handleFirestoreError(error, OperationType.LIST, COMMENTS_COLLECTION));
}
