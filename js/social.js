// ============================================
// CineVerso AI - Social System
// ============================================

import { getCurrentUser, getUserById, createNotification, incrementUserStat, decrementUserStat, getFollowing } from './auth.js';

// Generate UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// ============================================
// Posts Management
// ============================================

// Get all posts data
export function getPostsData() {
    const data = localStorage.getItem('cineverso_posts');
    return data ? JSON.parse(data) : { posts: {}, byUser: {}, byHashtag: {} };
}

// Save posts data
function savePostsData(data) {
    localStorage.setItem('cineverso_posts', JSON.stringify(data));
}

// Create a new post
export function createPost({ type = 'recommendation', text, media = [], linkedContent = null, rating = null, spoilerWarning = false }) {
    const user = getCurrentUser();
    if (!user) return { success: false, error: 'Debes iniciar sesión para publicar' };

    if (!text || text.trim().length === 0) {
        return { success: false, error: 'El texto es requerido' };
    }

    if (text.length > 500) {
        return { success: false, error: 'Máximo 500 caracteres' };
    }

    const postId = generateUUID();
    const now = new Date().toISOString();

    // Extract hashtags
    const hashtags = extractHashtags(text);

    // Extract mentions
    const mentions = extractMentions(text);

    const post = {
        id: postId,
        authorId: user.id,
        type,
        content: {
            text: text.trim(),
            media,
            linkedContent,
            rating: type === 'review' ? rating : null,
            spoilerWarning
        },
        hashtags,
        mentions,
        visibility: 'public',
        createdAt: now,
        editedAt: null,
        stats: {
            likes: 0,
            comments: 0,
            reposts: 0,
            saves: 0,
            views: 0
        },
        engagement: {
            likedBy: [],
            repostedBy: [],
            savedBy: []
        }
    };

    // Save post
    const data = getPostsData();
    data.posts[postId] = post;

    // Index by user
    if (!data.byUser[user.id]) {
        data.byUser[user.id] = [];
    }
    data.byUser[user.id].unshift(postId);

    // Index by hashtags
    for (const tag of hashtags) {
        if (!data.byHashtag[tag]) {
            data.byHashtag[tag] = [];
        }
        data.byHashtag[tag].unshift(postId);
    }

    savePostsData(data);

    // Update user stats
    incrementUserStat(user.id, 'posts');

    // Update trending
    updateTrending(hashtags);

    // Notify mentioned users
    for (const mention of mentions) {
        const mentionedUser = getUserByUsername(mention.replace('@', ''));
        if (mentionedUser) {
            createNotification({
                userId: mentionedUser.id,
                type: 'mention',
                actorId: user.id,
                targetType: 'post',
                targetId: postId
            });
        }
    }

    return { success: true, post };
}

// Get user by username helper
function getUserByUsername(username) {
    const usersData = localStorage.getItem('cineverso_users');
    if (!usersData) return null;
    const data = JSON.parse(usersData);
    const userId = data.usernames[username.toLowerCase()];
    return userId ? data.users[userId] : null;
}

// Extract hashtags from text
function extractHashtags(text) {
    const regex = /#(\w+)/g;
    const matches = text.match(regex);
    return matches ? matches.map(tag => tag.slice(1).toLowerCase()) : [];
}

// Extract mentions from text
function extractMentions(text) {
    const regex = /@(\w+)/g;
    const matches = text.match(regex);
    return matches ? [...new Set(matches)] : [];
}

// Get post by ID
export function getPostById(postId) {
    const data = getPostsData();
    const post = data.posts[postId];
    if (!post) return null;

    // Increment views
    post.stats.views++;
    savePostsData(data);

    return post;
}

// Get posts by user
export function getPostsByUser(userId, limit = 20, offset = 0) {
    const data = getPostsData();
    const postIds = data.byUser[userId] || [];

    return postIds
        .slice(offset, offset + limit)
        .map(id => data.posts[id])
        .filter(Boolean);
}

// Get posts by hashtag
export function getPostsByHashtag(hashtag, limit = 20, offset = 0) {
    const data = getPostsData();
    const postIds = data.byHashtag[hashtag.toLowerCase()] || [];

    return postIds
        .slice(offset, offset + limit)
        .map(id => data.posts[id])
        .filter(Boolean);
}

// Delete post
export function deletePost(postId) {
    const user = getCurrentUser();
    if (!user) return { success: false, error: 'No autenticado' };

    const data = getPostsData();
    const post = data.posts[postId];

    if (!post) return { success: false, error: 'Post no encontrado' };
    if (post.authorId !== user.id) return { success: false, error: 'No tienes permiso' };

    // Remove from indices
    if (data.byUser[user.id]) {
        data.byUser[user.id] = data.byUser[user.id].filter(id => id !== postId);
    }

    for (const tag of post.hashtags) {
        if (data.byHashtag[tag]) {
            data.byHashtag[tag] = data.byHashtag[tag].filter(id => id !== postId);
        }
    }

    // Delete post
    delete data.posts[postId];
    savePostsData(data);

    // Update stats
    decrementUserStat(user.id, 'posts');

    return { success: true };
}

// Edit post
export function editPost(postId, updates) {
    const user = getCurrentUser();
    if (!user) return { success: false, error: 'No autenticado' };

    const data = getPostsData();
    const post = data.posts[postId];

    if (!post) return { success: false, error: 'Post no encontrado' };
    if (post.authorId !== user.id) return { success: false, error: 'No tienes permiso' };

    // Update allowed fields
    if (updates.text !== undefined) {
        post.content.text = updates.text.trim();
        post.hashtags = extractHashtags(updates.text);
        post.mentions = extractMentions(updates.text);
    }
    if (updates.spoilerWarning !== undefined) {
        post.content.spoilerWarning = updates.spoilerWarning;
    }

    post.editedAt = new Date().toISOString();

    data.posts[postId] = post;
    savePostsData(data);

    return { success: true, post };
}

// ============================================
// Interactions
// ============================================

// Like a post
export function likePost(postId) {
    const user = getCurrentUser();
    if (!user) return { success: false, error: 'Debes iniciar sesión' };

    const data = getPostsData();
    const post = data.posts[postId];

    if (!post) return { success: false, error: 'Post no encontrado' };

    if (post.engagement.likedBy.includes(user.id)) {
        return { success: false, error: 'Ya diste like' };
    }

    post.engagement.likedBy.push(user.id);
    post.stats.likes++;

    data.posts[postId] = post;
    savePostsData(data);

    // Notify post author
    if (post.authorId !== user.id) {
        createNotification({
            userId: post.authorId,
            type: 'like',
            actorId: user.id,
            targetType: 'post',
            targetId: postId
        });
    }

    // Update author's stats
    incrementUserStat(post.authorId, 'likes');

    return { success: true, likes: post.stats.likes };
}

// Unlike a post
export function unlikePost(postId) {
    const user = getCurrentUser();
    if (!user) return { success: false, error: 'Debes iniciar sesión' };

    const data = getPostsData();
    const post = data.posts[postId];

    if (!post) return { success: false, error: 'Post no encontrado' };

    const index = post.engagement.likedBy.indexOf(user.id);
    if (index === -1) return { success: false, error: 'No has dado like' };

    post.engagement.likedBy.splice(index, 1);
    post.stats.likes--;

    data.posts[postId] = post;
    savePostsData(data);

    decrementUserStat(post.authorId, 'likes');

    return { success: true, likes: post.stats.likes };
}

// Toggle like
export function toggleLike(postId) {
    const user = getCurrentUser();
    if (!user) return { success: false, error: 'Debes iniciar sesión' };

    const data = getPostsData();
    const post = data.posts[postId];

    if (!post) return { success: false, error: 'Post no encontrado' };

    if (post.engagement.likedBy.includes(user.id)) {
        return unlikePost(postId);
    } else {
        return likePost(postId);
    }
}

// Check if user liked post
export function hasLiked(postId) {
    const user = getCurrentUser();
    if (!user) return false;

    const data = getPostsData();
    const post = data.posts[postId];

    return post ? post.engagement.likedBy.includes(user.id) : false;
}

// Save/bookmark a post
export function savePost(postId) {
    const user = getCurrentUser();
    if (!user) return { success: false, error: 'Debes iniciar sesión' };

    const data = getPostsData();
    const post = data.posts[postId];

    if (!post) return { success: false, error: 'Post no encontrado' };

    if (post.engagement.savedBy.includes(user.id)) {
        // Unsave
        post.engagement.savedBy = post.engagement.savedBy.filter(id => id !== user.id);
        post.stats.saves--;
    } else {
        // Save
        post.engagement.savedBy.push(user.id);
        post.stats.saves++;
    }

    data.posts[postId] = post;
    savePostsData(data);

    return { success: true, saved: post.engagement.savedBy.includes(user.id) };
}

// Check if user saved post
export function hasSaved(postId) {
    const user = getCurrentUser();
    if (!user) return false;

    const data = getPostsData();
    const post = data.posts[postId];

    return post ? post.engagement.savedBy.includes(user.id) : false;
}

// Get saved posts
export function getSavedPosts(userId) {
    const data = getPostsData();
    const posts = Object.values(data.posts);

    return posts
        .filter(post => post.engagement.savedBy.includes(userId))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// Repost
export function repost(postId) {
    const user = getCurrentUser();
    if (!user) return { success: false, error: 'Debes iniciar sesión' };

    const data = getPostsData();
    const post = data.posts[postId];

    if (!post) return { success: false, error: 'Post no encontrado' };

    if (post.engagement.repostedBy.includes(user.id)) {
        return { success: false, error: 'Ya compartiste este post' };
    }

    post.engagement.repostedBy.push(user.id);
    post.stats.reposts++;

    data.posts[postId] = post;
    savePostsData(data);

    // Notify
    if (post.authorId !== user.id) {
        createNotification({
            userId: post.authorId,
            type: 'repost',
            actorId: user.id,
            targetType: 'post',
            targetId: postId
        });
    }

    return { success: true };
}

// ============================================
// Comments
// ============================================

// Get comments data
function getCommentsData() {
    const data = localStorage.getItem('cineverso_comments');
    return data ? JSON.parse(data) : { comments: {}, byPost: {} };
}

// Save comments data
function saveCommentsData(data) {
    localStorage.setItem('cineverso_comments', JSON.stringify(data));
}

// Add comment
export function addComment(postId, text, parentCommentId = null) {
    const user = getCurrentUser();
    if (!user) return { success: false, error: 'Debes iniciar sesión' };

    if (!text || text.trim().length === 0) {
        return { success: false, error: 'El comentario es requerido' };
    }

    const commentId = generateUUID();
    const now = new Date().toISOString();

    const comment = {
        id: commentId,
        postId,
        authorId: user.id,
        parentCommentId,
        content: text.trim(),
        mentions: extractMentions(text),
        createdAt: now,
        editedAt: null,
        likes: 0,
        likedBy: []
    };

    const commentsData = getCommentsData();
    commentsData.comments[commentId] = comment;

    if (!commentsData.byPost[postId]) {
        commentsData.byPost[postId] = [];
    }
    commentsData.byPost[postId].push(commentId);

    saveCommentsData(commentsData);

    // Update post stats
    const postsData = getPostsData();
    if (postsData.posts[postId]) {
        postsData.posts[postId].stats.comments++;
        savePostsData(postsData);

        // Notify post author
        const post = postsData.posts[postId];
        if (post.authorId !== user.id) {
            createNotification({
                userId: post.authorId,
                type: 'comment',
                actorId: user.id,
                targetType: 'post',
                targetId: postId,
                content: { preview: text.substring(0, 50) }
            });
        }
    }

    // If replying to a comment, notify the comment author
    if (parentCommentId) {
        const parentComment = commentsData.comments[parentCommentId];
        if (parentComment && parentComment.authorId !== user.id) {
            createNotification({
                userId: parentComment.authorId,
                type: 'reply',
                actorId: user.id,
                targetType: 'comment',
                targetId: parentCommentId,
                content: { preview: text.substring(0, 50) }
            });
        }
    }

    return { success: true, comment };
}

// Get comments for post
export function getComments(postId) {
    const commentsData = getCommentsData();
    const commentIds = commentsData.byPost[postId] || [];

    const comments = commentIds
        .map(id => commentsData.comments[id])
        .filter(Boolean)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // Organize into threads
    const rootComments = comments.filter(c => !c.parentCommentId);
    const replies = comments.filter(c => c.parentCommentId);

    return rootComments.map(comment => ({
        ...comment,
        replies: replies.filter(r => r.parentCommentId === comment.id)
    }));
}

// Like comment
export function likeComment(commentId) {
    const user = getCurrentUser();
    if (!user) return { success: false, error: 'Debes iniciar sesión' };

    const data = getCommentsData();
    const comment = data.comments[commentId];

    if (!comment) return { success: false, error: 'Comentario no encontrado' };

    if (comment.likedBy.includes(user.id)) {
        // Unlike
        comment.likedBy = comment.likedBy.filter(id => id !== user.id);
        comment.likes--;
    } else {
        // Like
        comment.likedBy.push(user.id);
        comment.likes++;
    }

    data.comments[commentId] = comment;
    saveCommentsData(data);

    return { success: true, likes: comment.likes };
}

// Delete comment
export function deleteComment(commentId) {
    const user = getCurrentUser();
    if (!user) return { success: false, error: 'No autenticado' };

    const data = getCommentsData();
    const comment = data.comments[commentId];

    if (!comment) return { success: false, error: 'Comentario no encontrado' };
    if (comment.authorId !== user.id) return { success: false, error: 'No tienes permiso' };

    // Remove from post index
    if (data.byPost[comment.postId]) {
        data.byPost[comment.postId] = data.byPost[comment.postId].filter(id => id !== commentId);
    }

    // Delete comment
    delete data.comments[commentId];
    saveCommentsData(data);

    // Update post stats
    const postsData = getPostsData();
    if (postsData.posts[comment.postId]) {
        postsData.posts[comment.postId].stats.comments--;
        savePostsData(postsData);
    }

    return { success: true };
}

// ============================================
// Feed
// ============================================

// Get "For You" feed (algorithmic)
export function getForYouFeed(limit = 20, offset = 0) {
    const user = getCurrentUser();
    const data = getPostsData();
    let posts = Object.values(data.posts);

    // Sort by engagement and recency
    posts.sort((a, b) => {
        const scoreA = a.stats.likes * 2 + a.stats.comments * 3 + a.stats.reposts * 4;
        const scoreB = b.stats.likes * 2 + b.stats.comments * 3 + b.stats.reposts * 4;

        const ageA = (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60);
        const ageB = (Date.now() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60);

        const finalScoreA = scoreA / Math.pow(ageA + 1, 0.5);
        const finalScoreB = scoreB / Math.pow(ageB + 1, 0.5);

        return finalScoreB - finalScoreA;
    });

    return posts.slice(offset, offset + limit);
}

// Get "Following" feed
export function getFollowingFeed(limit = 20, offset = 0) {
    const user = getCurrentUser();
    if (!user) return [];

    const following = getFollowing(user.id);
    const followingIds = following.map(f => f.id);
    followingIds.push(user.id); // Include own posts

    const data = getPostsData();
    let posts = Object.values(data.posts)
        .filter(post => followingIds.includes(post.authorId))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return posts.slice(offset, offset + limit);
}

// Get recent feed (chronological)
export function getRecentFeed(limit = 20, offset = 0) {
    const data = getPostsData();
    let posts = Object.values(data.posts)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return posts.slice(offset, offset + limit);
}

// ============================================
// Trending
// ============================================

function getTrendingData() {
    const data = localStorage.getItem('cineverso_trending');
    return data ? JSON.parse(data) : { hashtags: [], updatedAt: null };
}

function saveTrendingData(data) {
    localStorage.setItem('cineverso_trending', JSON.stringify(data));
}

function updateTrending(hashtags) {
    const data = getTrendingData();

    for (const tag of hashtags) {
        const existing = data.hashtags.find(h => h.tag === tag);
        if (existing) {
            existing.count++;
            existing.recentPosts++;
        } else {
            data.hashtags.push({
                tag,
                count: 1,
                recentPosts: 1
            });
        }
    }

    // Sort by count
    data.hashtags.sort((a, b) => b.count - a.count);

    // Keep top 50
    data.hashtags = data.hashtags.slice(0, 50);

    data.updatedAt = new Date().toISOString();
    saveTrendingData(data);
}

export function getTrending(limit = 10) {
    const data = getTrendingData();
    return data.hashtags.slice(0, limit);
}

// ============================================
// Search
// ============================================

export function searchPosts(query, limit = 20) {
    const data = getPostsData();
    const lowerQuery = query.toLowerCase();

    return Object.values(data.posts)
        .filter(post =>
            post.content.text.toLowerCase().includes(lowerQuery) ||
            post.hashtags.some(tag => tag.includes(lowerQuery))
        )
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit);
}

export function searchUsers(query, limit = 20) {
    const usersData = localStorage.getItem('cineverso_users');
    if (!usersData) return [];

    const data = JSON.parse(usersData);
    const lowerQuery = query.toLowerCase();

    return Object.values(data.users)
        .filter(user =>
            user.username.toLowerCase().includes(lowerQuery) ||
            user.displayName.toLowerCase().includes(lowerQuery)
        )
        .slice(0, limit);
}

// Demo posts removed - only real user posts will appear
