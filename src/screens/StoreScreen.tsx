import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Image, Linking, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radii } from '../theme/colors';
import { listProducts, getProductCategories, Product } from '../data/productRepository';
import { MobileUser } from '../auth/authService';

interface StoreScreenProps {
  profile: MobileUser | null;
}

const DONATION_AMOUNTS = [5, 10, 20, 50, 100];
const CHURCH_PHONE = 'https://wa.me/263780000000'; // WhatsApp contact for orders

export function StoreScreen({ profile }: StoreScreenProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [tab, setTab] = useState<'shop' | 'give'>('shop');

  useEffect(() => {
    const cats = getProductCategories();
    setCategories(cats);
    setProducts(listProducts(selectedCategory ?? undefined));
  }, [selectedCategory]);

  const filtered = selectedCategory
    ? products.filter(p => p.category === selectedCategory)
    : products;

  const openOrder = (product: Product) => {
    const msg = encodeURIComponent(`Hi! I'd like to order: ${product.name} — ${product.currency} ${product.price}`);
    void Linking.openURL(`${CHURCH_PHONE}?text=${msg}`);
  };

  const openDonation = (amount: number) => {
    const msg = encodeURIComponent(`I'd like to give ${amount} USD to Gateway Church.`);
    void Linking.openURL(`${CHURCH_PHONE}?text=${msg}`);
  };

  return (
    <>
      {/* Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.sectionTitle}>Store & Giving</Text>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        <Pressable
          style={[styles.subTab, tab === 'shop' && styles.subTabActive]}
          onPress={() => setTab('shop')}
        >
          <Ionicons name="bag-outline" size={16} color={tab === 'shop' ? Colors.textInverse : Colors.textMuted} />
          <Text style={[styles.subTabText, tab === 'shop' && styles.subTabTextActive]}>Shop</Text>
        </Pressable>
        <Pressable
          style={[styles.subTab, tab === 'give' && styles.subTabActive]}
          onPress={() => setTab('give')}
        >
          <Ionicons name="heart-outline" size={16} color={tab === 'give' ? Colors.textInverse : Colors.textMuted} />
          <Text style={[styles.subTabText, tab === 'give' && styles.subTabTextActive]}>Give</Text>
        </Pressable>
      </View>

      {tab === 'shop' ? (
        <>
          {/* Category filter */}
          {categories.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
              <Pressable
                style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(null)}
              >
                <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>All</Text>
              </Pressable>
              {categories.map(cat => (
                <Pressable
                  key={cat}
                  style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextActive]}>{cat}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="bag-outline" size={52} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No products yet</Text>
              <Text style={styles.emptyBody}>
                Church items, books, and merchandise will appear here when available.
              </Text>
            </View>
          ) : (
            <View style={styles.productGrid}>
              {filtered.map(product => (
                <View key={product.id} style={styles.productCard}>
                  {product.image_url ? (
                    <Image
                      source={{ uri: product.image_url }}
                      style={styles.productImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.productImage, styles.productImagePlaceholder]}>
                      <Ionicons name="shirt-outline" size={36} color={Colors.textMuted} />
                    </View>
                  )}
                  <View style={styles.productBody}>
                    {product.category && <Text style={styles.eyebrow}>{product.category.toUpperCase()}</Text>}
                    <Text style={styles.productName}>{product.name}</Text>
                    {product.description ? (
                      <Text style={styles.productDesc} numberOfLines={2}>{product.description}</Text>
                    ) : null}
                    <View style={styles.productFooter}>
                      <Text style={styles.productPrice}>
                        {product.currency} {product.price.toFixed(2)}
                      </Text>
                      <Pressable style={styles.orderBtn} onPress={() => openOrder(product)}>
                        <Ionicons name="logo-whatsapp" size={14} color={Colors.textInverse} />
                        <Text style={styles.orderBtnText}>Order</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      ) : (
        <>
          {/* Giving section */}
          <View style={styles.giveHero}>
            <Ionicons name="heart" size={36} color={Colors.gold} />
            <Text style={styles.giveTitle}>Give to Gateway Church</Text>
            <Text style={styles.giveSubtitle}>Your generosity powers the mission. Every gift makes a difference.</Text>
          </View>

          <Text style={styles.subTitle}>Quick Amounts</Text>
          <View style={styles.amountsGrid}>
            {DONATION_AMOUNTS.map(amount => (
              <Pressable key={amount} style={styles.amountCard} onPress={() => openDonation(amount)}>
                <Text style={styles.amountValue}>USD {amount}</Text>
                <Ionicons name="arrow-forward" size={14} color={Colors.gold} />
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.customGiveBtn} onPress={() => void Linking.openURL(CHURCH_PHONE)}>
            <Ionicons name="logo-whatsapp" size={18} color={Colors.textInverse} />
            <Text style={styles.customGiveBtnText}>Custom Amount via WhatsApp</Text>
          </Pressable>

          <View style={styles.card}>
            <Text style={styles.eyebrow}>TITHE & OFFERING</Text>
            <Text style={styles.cardTitle}>Give securely, anytime</Text>
            <Text style={styles.cardBody}>
              All giving is handled securely. Contact the church office to set up recurring giving or electronic funds transfer.
            </Text>
            {!profile && (
              <Text style={[styles.cardBody, { color: Colors.gold, marginTop: 12 }]}>
                Sign in to track your giving history.
              </Text>
            )}
          </View>
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 26,
    marginTop: 8,
  },
  subTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 18,
    marginTop: 8,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 0,
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  subTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radii.md,
  },
  subTabActive: {
    backgroundColor: Colors.gold,
  },
  subTabText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textMuted,
    fontSize: 14,
  },
  subTabTextActive: {
    color: Colors.textInverse,
  },
  categoryRow: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radii.full,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  categoryChipText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  categoryChipTextActive: {
    color: Colors.textInverse,
  },
  productGrid: {
    gap: 12,
  },
  productCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  productImage: {
    width: '100%',
    height: 180,
    backgroundColor: Colors.bgSecondary,
  },
  productImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  productBody: {
    padding: 16,
  },
  eyebrow: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  productName: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 17,
  },
  productDesc: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  productFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  productPrice: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 20,
  },
  orderBtn: {
    backgroundColor: Colors.gold,
    borderRadius: Radii.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderBtnText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textInverse,
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textSecondary,
    fontSize: 18,
  },
  emptyBody: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  giveHero: {
    backgroundColor: Colors.forestGreen,
    borderRadius: Radii.xl,
    padding: 28,
    alignItems: 'center',
    gap: 10,
  },
  giveTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 24,
    textAlign: 'center',
  },
  giveSubtitle: {
    fontFamily: Typography.fontRegular,
    color: 'rgba(255,255,255,0.72)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  amountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  amountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    flex: 1,
    minWidth: '45%',
    justifyContent: 'space-between',
  },
  amountValue: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  customGiveBtn: {
    backgroundColor: '#25D366', // WhatsApp green
    borderRadius: Radii.md,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  customGiveBtnText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
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
});
