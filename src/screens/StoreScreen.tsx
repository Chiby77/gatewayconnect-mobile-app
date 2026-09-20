import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Image, TextInput, ScrollView, Modal, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radii } from '../theme/colors';
import { listProducts, getProductCategories, Product } from '../data/productRepository';
import { MobileUser } from '../auth/authService';

interface StoreScreenProps {
  profile: MobileUser | null;
}

const PRESET_AMOUNTS = [10, 20, 50, 100, 250];
const GIVING_FUNDS = [
  { id: 'tithe', name: 'Tithe', desc: '10% dedicated to the storehouse of God' },
  { id: 'offering', name: 'Sunday Offering', desc: 'Freewill celebration of gratitude' },
  { id: 'partner', name: 'Covenant Partner', desc: 'Monthly apostolic partnership' },
  { id: 'building', name: 'Cathedral Building', desc: 'Roofing and sanctuary construction' },
  { id: 'honorarium', name: 'Apostolic Honorarium', desc: 'Honoring the prophetic mantle' },
];

export function StoreScreen({ profile }: StoreScreenProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [tab, setTab] = useState<'shop' | 'give'>('shop');

  // Shop item details modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('L');

  // Giving state
  const [selectedFund, setSelectedFund] = useState<string>('tithe');
  const [selectedAmount, setSelectedAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [currency, setCurrency] = useState<'USD' | 'ZiG'>('USD');
  const [paymentMethod, setPaymentMethod] = useState<'EcoCash' | 'OneMoney' | 'Card'>('EcoCash');
  const [donorPhone, setDonorPhone] = useState<string>('');
  const [receiptModal, setReceiptModal] = useState<{ id: string; amount: number; fund: string } | null>(null);

  useEffect(() => {
    const cats = getProductCategories();
    setCategories(cats);
    setProducts(listProducts(selectedCategory ?? undefined));
  }, [selectedCategory]);

  const filtered = selectedCategory
    ? products.filter(p => p.category === selectedCategory)
    : products;

  const handleOrderWhatsApp = (product: Product, size: string) => {
    const phone = '263780699988';
    const msg = encodeURIComponent(
      `Grace & Peace! I want to order from Gateway Connect Store:\n\n• Item: ${product.name}\n• Size: ${size}\n• Price: ${product.currency} ${product.price}\n• Name: ${profile?.name || 'Church Member'}`
    );
    void Linking.openURL(`https://wa.me/${phone}?text=${msg}`);
  };

  const handleGive = () => {
    const finalAmount = customAmount ? parseFloat(customAmount) : selectedAmount;
    if (!finalAmount || finalAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    if ((paymentMethod === 'EcoCash' || paymentMethod === 'OneMoney') && !donorPhone.trim()) {
      Alert.alert('Phone Required', `Please enter your ${paymentMethod} mobile number.`);
      return;
    }

    const receiptId = `GCZ-GIVE-${Date.now().toString().slice(-6)}`;
    const fundObj = GIVING_FUNDS.find(f => f.id === selectedFund) || GIVING_FUNDS[0];

    setReceiptModal({
      id: receiptId,
      amount: finalAmount,
      fund: fundObj.name,
    });
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
          <Text style={[styles.subTabText, tab === 'shop' && styles.subTabTextActive]}>Shop (Apparel & Books)</Text>
        </Pressable>
        <Pressable
          style={[styles.subTab, tab === 'give' && styles.subTabActive]}
          onPress={() => setTab('give')}
        >
          <Ionicons name="heart-outline" size={16} color={tab === 'give' ? Colors.textInverse : Colors.textMuted} />
          <Text style={[styles.subTabText, tab === 'give' && styles.subTabTextActive]}>Give & Partner</Text>
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
                <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>All Items</Text>
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
                <Pressable
                  key={product.id}
                  style={styles.productCard}
                  onPress={() => {
                    setSelectedProduct(product);
                    setSelectedSize('L');
                  }}
                >
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
                    <Text style={styles.eyebrow}>{product.category?.toUpperCase() || 'KINGDOM APPAREL'}</Text>
                    <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.productPrice}>
                        ${product.price.toFixed(2)}
                      </Text>
                      <Text style={styles.productPriceZig}>
                        / ZiG {Math.round(product.price * 14.8)}
                      </Text>
                    </View>
                    <Pressable
                      style={styles.btnOrder}
                      onPress={() => {
                        setSelectedProduct(product);
                        setSelectedSize('L');
                      }}
                    >
                      <Text style={styles.btnOrderText}>View & Order</Text>
                    </Pressable>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </>
      ) : (
        /* Give & Partnership Tab */
        <View style={styles.giveContainer}>
          <View style={styles.giveHero}>
            <Ionicons name="heart" size={32} color={Colors.gold} />
            <Text style={styles.giveTitle}>Kingdom Stewardship & Partnership</Text>
            <Text style={styles.giveSubtitle}>
              Honor the LORD with thy substance, and with the firstfruits of all thine increase — Proverbs 3:9
            </Text>
          </View>

          {/* Giving Fund Selector */}
          <Text style={styles.subTitle}>Select Giving Purpose</Text>
          <View style={styles.fundsList}>
            {GIVING_FUNDS.map(fund => (
              <Pressable
                key={fund.id}
                style={[styles.fundCard, selectedFund === fund.id && styles.fundCardActive]}
                onPress={() => setSelectedFund(fund.id)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fundName, selectedFund === fund.id && styles.fundNameActive]}>
                    {fund.name}
                  </Text>
                  <Text style={styles.fundDesc}>{fund.desc}</Text>
                </View>
                {selectedFund === fund.id && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.gold} />
                )}
              </Pressable>
            ))}
          </View>

          {/* Currency Toggle */}
          <Text style={styles.subTitle}>Currency</Text>
          <View style={styles.currencyRow}>
            {(['USD', 'ZiG'] as const).map(c => (
              <Pressable
                key={c}
                style={[styles.currencyBtn, currency === c && styles.currencyBtnActive]}
                onPress={() => setCurrency(c)}
              >
                <Text style={[styles.currencyBtnText, currency === c && styles.currencyBtnTextActive]}>
                  {c === 'USD' ? 'United States Dollar (USD $)' : 'Zimbabwe Gold (ZiG)'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Preset Amounts */}
          <Text style={styles.subTitle}>Select Amount</Text>
          <View style={styles.amountsGrid}>
            {PRESET_AMOUNTS.map(amt => {
              const displayAmt = currency === 'ZiG' ? Math.round(amt * 14.8) : amt;
              const isSelected = selectedAmount === amt && !customAmount;
              return (
                <Pressable
                  key={amt}
                  style={[styles.amountCard, isSelected && styles.amountCardActive]}
                  onPress={() => {
                    setSelectedAmount(amt);
                    setCustomAmount('');
                  }}
                >
                  <Text style={[styles.amountValue, isSelected && styles.amountValueActive]}>
                    {currency === 'USD' ? `$${amt}` : `ZiG ${displayAmt}`}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Custom Amount */}
          <TextInput
            value={customAmount}
            onChangeText={t => {
              setCustomAmount(t);
              setSelectedAmount(0);
            }}
            placeholder={`Or enter custom amount in ${currency}...`}
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            style={styles.input}
          />

          {/* Payment Method */}
          <Text style={styles.subTitle}>Payment Method</Text>
          <View style={styles.methodRow}>
            {(['EcoCash', 'OneMoney', 'Card'] as const).map(m => (
              <Pressable
                key={m}
                style={[styles.methodCard, paymentMethod === m && styles.methodCardActive]}
                onPress={() => setPaymentMethod(m)}
              >
                <Ionicons
                  name={m === 'Card' ? 'card-outline' : 'phone-portrait-outline'}
                  size={18}
                  color={paymentMethod === m ? Colors.gold : Colors.textMuted}
                />
                <Text style={[styles.methodName, paymentMethod === m && styles.methodNameActive]}>{m}</Text>
              </Pressable>
            ))}
          </View>

          {paymentMethod !== 'Card' && (
            <TextInput
              value={donorPhone}
              onChangeText={setDonorPhone}
              placeholder={`Enter ${paymentMethod} mobile number (e.g. 077... / 078...)`}
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
              style={styles.input}
            />
          )}

          {/* Submit Give */}
          <Pressable style={styles.giveActionBtn} onPress={handleGive}>
            <Ionicons name="heart" size={18} color={Colors.textInverse} />
            <Text style={styles.giveActionBtnText}>
              Give {currency === 'USD' ? `$${customAmount || selectedAmount}` : `ZiG ${customAmount ? customAmount : Math.round(selectedAmount * 14.8)}`} Now
            </Text>
          </Pressable>
        </View>
      )}

      {/* Product Detail Modal */}
      <Modal visible={!!selectedProduct} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Item Details</Text>
              <Pressable onPress={() => setSelectedProduct(null)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </Pressable>
            </View>

            {selectedProduct?.image_url ? (
              <Image source={{ uri: selectedProduct.image_url }} style={styles.detailImage} resizeMode="cover" />
            ) : null}

            <Text style={styles.eyebrow}>{selectedProduct?.category?.toUpperCase() || 'APPAREL'}</Text>
            <Text style={styles.detailTitle}>{selectedProduct?.name}</Text>
            <Text style={styles.detailPrice}>${selectedProduct?.price.toFixed(2)} USD • ZiG {Math.round((selectedProduct?.price || 0) * 14.8)}</Text>
            <Text style={styles.detailDesc}>{selectedProduct?.description}</Text>

            {/* Sizes */}
            {selectedProduct?.category === 'Apparel' && (
              <View style={styles.sizesSection}>
                <Text style={styles.sizesTitle}>Select Size:</Text>
                <View style={styles.sizesRow}>
                  {['S', 'M', 'L', 'XL', 'XXL'].map(sz => (
                    <Pressable
                      key={sz}
                      style={[styles.sizeBox, selectedSize === sz && styles.sizeBoxActive]}
                      onPress={() => setSelectedSize(sz)}
                    >
                      <Text style={[styles.sizeText, selectedSize === sz && styles.sizeTextActive]}>{sz}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            <Pressable
              style={styles.orderWhatsAppBtn}
              onPress={() => {
                if (selectedProduct) {
                  handleOrderWhatsApp(selectedProduct, selectedSize);
                  setSelectedProduct(null);
                }
              }}
            >
              <Ionicons name="logo-whatsapp" size={18} color={Colors.textInverse} />
              <Text style={styles.orderWhatsAppBtnText}>Order via WhatsApp</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Giving Receipt Modal */}
      <Modal visible={!!receiptModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.receiptCard}>
            <Ionicons name="checkmark-circle" size={54} color={Colors.gold} />
            <Text style={styles.receiptTitle}>Covenant Giving Received!</Text>
            <Text style={styles.receiptDesc}>
              Thank you for sowing into the Kingdom of God. May the Lord multiply your seed and bless your home abundantly!
            </Text>

            <View style={styles.receiptDetails}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Purpose:</Text>
                <Text style={styles.receiptValue}>{receiptModal?.fund}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Amount:</Text>
                <Text style={styles.receiptValue}>{currency} {receiptModal?.amount}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Method:</Text>
                <Text style={styles.receiptValue}>{paymentMethod}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Receipt No:</Text>
                <Text style={styles.receiptValue}>{receiptModal?.id}</Text>
              </View>
            </View>

            <Pressable style={styles.receiptCloseBtn} onPress={() => setReceiptModal(null)}>
              <Text style={styles.receiptCloseBtnText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pageHeader: {
    marginTop: 4,
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 26,
  },
  subTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 16,
    marginTop: 14,
    marginBottom: 8,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
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
    fontSize: 12,
  },
  subTabTextActive: {
    color: Colors.textInverse,
  },
  categoryRow: {
    gap: 8,
    marginBottom: 14,
  },
  categoryChip: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
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
    fontSize: 12,
  },
  categoryChipTextActive: {
    color: Colors.textInverse,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productCard: {
    width: '48%',
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  productImage: {
    width: '100%',
    height: 150,
  },
  productImagePlaceholder: {
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productBody: {
    padding: 10,
    gap: 4,
  },
  eyebrow: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  productName: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 13,
    lineHeight: 17,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  productPrice: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 14,
  },
  productPriceZig: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 10,
    marginLeft: 4,
  },
  btnOrder: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radii.sm,
    paddingVertical: 6,
    alignItems: 'center',
    marginTop: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnOrderText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.gold,
    fontSize: 11,
  },
  emptyState: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
    marginTop: 20,
  },
  emptyTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 17,
  },
  emptyBody: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  giveContainer: {
    gap: 10,
    paddingBottom: 20,
  },
  giveHero: {
    backgroundColor: Colors.forestGreen,
    borderRadius: Radii.xl,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  giveTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 18,
    textAlign: 'center',
  },
  giveSubtitle: {
    fontFamily: Typography.fontRegular,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  fundsList: {
    gap: 8,
  },
  fundCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fundCardActive: {
    borderColor: Colors.gold,
    backgroundColor: 'rgba(245,158,11,0.08)',
  },
  fundName: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  fundNameActive: {
    color: Colors.gold,
  },
  fundDesc: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  currencyBtn: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  currencyBtnActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  currencyBtnText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  currencyBtnTextActive: {
    color: Colors.textInverse,
  },
  amountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amountCard: {
    width: '31%',
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  amountCardActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  amountValue: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  amountValueActive: {
    color: Colors.textInverse,
  },
  input: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontFamily: Typography.fontRegular,
    fontSize: 13,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  methodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  methodCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  methodCardActive: {
    borderColor: Colors.gold,
    backgroundColor: 'rgba(245,158,11,0.08)',
  },
  methodName: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  methodNameActive: {
    color: Colors.gold,
  },
  giveActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.gold,
    borderRadius: Radii.md,
    paddingVertical: 14,
    marginTop: 6,
  },
  giveActionBtnText: {
    fontFamily: Typography.fontBold,
    color: Colors.textInverse,
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 18,
  },
  detailImage: {
    width: '100%',
    height: 180,
    borderRadius: Radii.md,
    marginBottom: 12,
  },
  detailTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 18,
    marginTop: 2,
  },
  detailPrice: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 15,
    marginTop: 4,
  },
  detailDesc: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  sizesSection: {
    marginTop: 14,
  },
  sizesTitle: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textPrimary,
    fontSize: 13,
    marginBottom: 8,
  },
  sizesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sizeBox: {
    width: 44,
    height: 40,
    borderRadius: Radii.md,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sizeBoxActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  sizeText: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  sizeTextActive: {
    color: Colors.textInverse,
  },
  orderWhatsAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.gold,
    borderRadius: Radii.md,
    paddingVertical: 14,
    marginTop: 18,
  },
  orderWhatsAppBtnText: {
    fontFamily: Typography.fontBold,
    color: Colors.textInverse,
    fontSize: 14,
  },
  receiptCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.xl,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  receiptTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 20,
    marginTop: 12,
    textAlign: 'center',
  },
  receiptDesc: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 8,
    marginBottom: 16,
  },
  receiptDetails: {
    width: '100%',
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radii.md,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  receiptLabel: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 12,
  },
  receiptValue: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 12,
  },
  receiptCloseBtn: {
    backgroundColor: Colors.gold,
    borderRadius: Radii.md,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  receiptCloseBtnText: {
    fontFamily: Typography.fontBold,
    color: Colors.textInverse,
    fontSize: 14,
  },
});
