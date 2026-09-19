import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Colors, Typography, Radii } from '../theme/colors';
import { MobileUser } from '../auth/authService';
import { listComments, saveComment, Comment } from '../data/contentRepository';
import { ContentItem } from '../types/domain';
import { Ionicons } from '@expo/vector-icons';

export function TestimonyCard({ testimony, profile }: { testimony: ContentItem; profile: MobileUser | null }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (showComments) setComments(listComments(testimony.id));
  }, [showComments, testimony.id]);

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>TESTIMONY</Text>
      <Text style={styles.cardTitle}>{testimony.title}</Text>
      <Text style={styles.cardBody}>{testimony.body}</Text>

      <Pressable style={styles.commentsToggle} onPress={() => setShowComments(!showComments)}>
        <Ionicons name={showComments ? 'chatbubble' : 'chatbubble-outline'} size={14} color={Colors.gold} />
        <Text style={styles.commentsToggleText}>{showComments ? 'Hide Comments' : 'View Comments'}</Text>
      </Pressable>

      {showComments && (
        <View style={styles.commentsSection}>
          {comments.length === 0 && (
            <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
          )}
          {comments.map(c => (
            <View key={c.id} style={styles.commentRow}>
              <View style={styles.commentDot} />
              <Text style={styles.commentText}>{c.body}</Text>
            </View>
          ))}
          {profile ? (
            <View style={styles.commentInputRow}>
              <TextInput
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Add a comment..."
                placeholderTextColor={Colors.textMuted}
                style={[styles.input, { flex: 1 }]}
              />
              <Pressable
                style={styles.sendBtn}
                onPress={() => {
                  if (newComment.trim()) {
                    saveComment(testimony.id, profile.id, newComment.trim());
                    setNewComment('');
                    setComments(listComments(testimony.id));
                  }
                }}
              >
                <Ionicons name="send" size={16} color={Colors.textInverse} />
              </Pressable>
            </View>
          ) : (
            <Text style={styles.emptyText}>Sign in to comment.</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  eyebrow: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  cardTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 17,
  },
  cardBody: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },
  commentsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  commentsToggleText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.gold,
    fontSize: 13,
  },
  commentsSection: {
    marginTop: 14,
    gap: 10,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  commentDot: {
    width: 6,
    height: 6,
    borderRadius: Radii.full,
    backgroundColor: Colors.gold,
    marginTop: 6,
  },
  commentText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  emptyText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
  commentInputRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  input: {
    fontFamily: Typography.fontRegular,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    color: Colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  sendBtn: {
    backgroundColor: Colors.gold,
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
