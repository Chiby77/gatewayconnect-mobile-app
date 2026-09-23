import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Image, TextInput, ScrollView, Modal, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radii } from '../theme/colors';
import { listProducts, getProductCategories, Product } from '../data/productRepository';
import { MobileUser } from '../auth/authService';

interface StoreScreenProps {
  profile: MobileUser | null;
}

const LOCAL_STORE_IMAGES: Record<string, any> = {
  prod_jd_white_heaven: require('../../assets/store/jd_white_heaven.jpg'),
  prod_jd_orange_child: require('../../assets/store/jd_orange_child.jpg'),
  prod_jd_green_faith: require('../../assets/store/jd_green_faith.jpg'),
  prod_jd_pink_finished: require('../../assets/store/jd_pink_finished.jpg'),
  prod_jd_cream_butgod: require('../../assets/store/jd_cream_butgod.jpg'),
  prod_jd_maroon_construction: require('../../assets/store/jd_maroon_construction.jpg'),
  prod_book_covenant_wealth: require('../../assets/store/jd_white_heaven.jpg'),
  prod_book_supernatural_dominion: require('../../assets/store/jd_green_faith.jpg'),
};

const PRESET_AMOUNTS = [10, 25, 50, 100, 250];

const GIVING_FUNDS = [
  { id: 'tithe', name: 'Tithe', desc: 'Ministry operations, broadcast satellites & pastoral sustenance' },
  { id: 'offering', name: 'Sunday Offering', desc: 'Freewill celebration of gratitude' },
  { id: 'firstfruits', name: 'Firstfruits', desc: 'Altar dedication and new territory advancement in 2026' },
  { id: 'partner', name: 'Covenant Partner', desc: 'Monthly apostolic partnership' },
  { id: 'seed_faith', name: 'Seed Faith', desc: 'Harare Evangelistic Crusade & Souls outreach' },
  { id: 'building', name: 'Cathedral Building', desc: 'Roofing and sanctuary construction in Belvedere' },
  { id: 'honorarium', name: 'Apostolic Honorarium', desc: 'Direct apostolic blessing and prophetic mantle honoring' },
];

type Currency = 'USD' | 'ZiG' | 'GBP' | 'ZAR';

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
  const [currency, setCurrency] = useState<Currency>('USD');
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

  const formatPrice = (usd: number) => {
    if (currency === 'ZiG') return `ZiG ${Math.round(usd * 14.8)}`;
    if (currency === 'GBP') return `£${Math.round(usd * 0.78)}`;
    if (currency === 'ZAR') return `R${Math.round(usd * 18.5)}`;
    return `$${usd.toFixed(2)}`;
  };

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
    <View style={styles.container}>
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
          <Ionicons name="bag-outline" size={14} color={tab === 'shop' ? Colors.textInverse : Colors.textMuted} />
          <Text style={[styles.subTabText, tab === 'shop' && styles.subTabTextActive]}>Shop Collection</Text>
        </Pressable>
        <Pressable
          style={[styles.subTab, tab === 'give' && styles.subTabActive]}
          onPress={() => setTab('give')}
        >
          <Ionicons name="heart-outline" size={14} color={tab === 'give' ? Colors.textInverse : Colors.textMuted} />
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
              <Ionicons name="bag-outline" size={44} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptyBody}>
                Official Joe Daniels Collection apparel and books will sync here.
              </Text>
            </View>
          ) : (
            <View style={styles.productGrid}>
              {filtered.map(product => {
                const localImg = LOCAL_STORE_IMAGES[product.id];
                return (
                  <Pressable
                    key={product.id}
                    style={styles.productCard}
                    onPress={() => {
                      setSelectedProduct(product);
                      setSelectedSize('L');
                    }}
                  >
                    {localImg ? (
                      <Image source={localImg} style={styles.productImage} resizeMode="cover" />
                    ) : product.image_url ? (
                      <Image source={{ uri: product.image_url }} style={styles.productImage} resizeMode="cover" />
                    ) : (
                      <View style={[styles.productImage, styles.productImagePlaceholder]}>
                        <Ionicons name="shirt-outline" size={32} color={Colors.textMuted} />
                      </View>
                    )}
                    <View style={styles.productBody}>
                      <Text style={styles.eyebrow}>{product.category?.toUpperCase() || 'APPAREL'}</Text>
                      <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                      <View style={styles.priceRow}>
                        <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
                        <Text style={styles.productPriceZig}>• ZiG {Math.round(product.price * 14.8)}</Text>
                      </View>
                      <Pressable
                        style={styles.btnOrder}
                        onPress={() => {
                          setSelectedProduct(product);
                          setSelectedSize('L');
                        }}
                      >
                        <Text style={styles.btnOrderText}>Order via WhatsApp</Text>
                      </Pressable>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </>
      ) : (
        /* Give & Partnership Tab */
        <View style={styles.giveContainer}>
          <View style={styles.giveHero}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="heart" size={18} color={Colors.gold} />
              <Text style={styles.giveHeroEyebrow}>COVENANT STEWARDSHIP</Text>
            </View>
            <Text style={styles.giveTitle}>Honor God With Thy Substance</Text>
            <Text style={styles.giveSubtitle}>
              "Honor the LORD with thy substance, and with the firstfruits of all thine increase" — Proverbs 3:9
            </Text>
          </View>

          {/* Giving Fund Selector */}
          <Text style={styles.subTitle}>Select Giving Fund</Text>
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
                  <Text style={styles.fundDesc} numberOfLines={1}>{fund.desc}</Text>
                </View>
                {selectedFund === fund.id && (
                  <Ionicons name="checkmark-circle" size={18} color={Colors.gold} />
                )}
              </Pressable>
            ))}
          </View>

          {/* Currency Toggle */}
          <Text style={styles.subTitle}>Currency</Text>
          <View style={styles.currencyRow}>
            {(['USD', 'ZiG', 'GBP', 'ZAR'] as const).map(c => (
              <Pressable
                key={c}
                style={[styles.currencyBtn, currency === c && styles.currencyBtnActive]}
                onPress={() => setCurrency(c)}
              >
                <Text style={[styles.currencyBtnText, currency === c && styles.currencyBtnTextActive]}>
                  {c}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Preset Amounts */}
          <Text style={styles.subTitle}>Select Amount</Text>
          <View style={styles.amountsGrid}>
            {PRESET_AMOUNTS.map(amt => {
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
                    {formatPrice(amt)}
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
          <Text style={styles.subTitle}>Payment Gateway</Text>
          <View style={styles.methodRow}>
            {(['EcoCash', 'OneMoney', 'Card'] as const).map(m => (
              <Pressable
                key={m}
                style={[styles.methodCard, paymentMethod === m && styles.methodCardActive]}
                onPress={() => setPaymentMethod(m)}
              >
                <Ionicons
                  name={m === 'Card' ? 'card-outline' : 'phone-portrait-outline'}
                  size={15}
                  color={paymentMethod === m ? Colors.gold : Colors.textMuted}
                />
                <Text style={[styles.methodName, paymentMethod === m && styles.methodNameActive]}>{m}</Text>
              </Pressable>
            ))}
          </View>

          {paymentMethod !== 'Card' ? (
            <View style={styles.phoneSection}>
              <View style={styles.accountInfoBanner}>
                <Ionicons name="information-circle-outline" size={16} color={Colors.gold} />
                <Text style={styles.accountInfoText}>
                  Gateway Church Account: <Text style={{ color: Colors.gold, fontFamily: Typography.fontBold }}>0771445642</Text> / +263780699988
                </Text>
              </View>
              <TextInput
                value={donorPhone}
                onChangeText={setDonorPhone}
                placeholder={`Enter your ${paymentMethod} mobile number (e.g. 077... / 078...)`}
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
                style={styles.input}
              />
            </View>
          ) : (
            <View style={styles.accountInfoBanner}>
              <Ionicons name="shield-checkmark-outline" size={16} color={Colors.gold} />
              <Text style={styles.accountInfoText}>
                Encrypted international VISA / MasterCard payment gateway.
              </Text>
            </View>
          )}

          {/* Submit Give */}
          <Pressable style={styles.giveActionBtn} onPress={handleGive}>
            <Ionicons name="heart" size={16} color={Colors.textInverse} />
            <Text style={styles.giveActionBtnText}>
              Give {currency === 'USD' ? `$${customAmount || selectedAmount}` : `${currency} ${customAmount || (currency === 'ZiG' ? Math.round(selectedAmount * 14.8) : selectedAmount)}`} Now
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
              <Pressable onPress={() => setSelectedProduct(null)} style={{ padding: 4 }}>
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </Pressable>
            </View>

            {selectedProduct && LOCAL_STORE_IMAGES[selectedProduct.id] ? (
              <Image source={LOCAL_STORE_IMAGES[selectedProduct.id]} style={styles.detailImage} resizeMode="cover" />
            ) : selectedProduct?.image_url ? (
              <Image source={{ uri: selectedProduct.image_url }} style={styles.detailImage} resizeMode="cover" />
            ) : null}

            <Text style={styles.eyebrow}>{selectedProduct?.category?.toUpperCase() || 'APPAREL'}</Text>
            <Text style={styles.detailTitle}>{selectedProduct?.name}</Text>
            <Text style={styles.detailPrice}>${selectedProduct?.price.toFixed(2)} USD • ZiG {Math.round((selectedProduct?.price || 0) * 14.8)}</Text>
            <Text style={styles.detailDesc}>{selectedProduct?.description}</Text>

            {/* Sizes */}
            {selectedProduct?.category === 'Kingdom Apparel' && (
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
              <Text style={styles.orderWhatsAppBtnText}>Order via WhatsApp (+263 780 699 988)</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Giving Receipt Modal */}
      <Modal visible={!!receiptModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.receiptCard}>
            <Ionicons name="checkmark-circle" size={48} color={Colors.gold} />
            <Text style={styles.receiptTitle}>Covenant Giving Received</Text>
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
                <Text style={styles.receiptLabel}>Gateway:</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  pageHeader: {
    marginTop: 2,
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 19,
  },
  subTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 13,
    marginTop: 10,
    marginBottom: 6,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#121216',
    borderRadius: Radii.md,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  subTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: Radii.sm,
  },
  subTabActive: {
    backgroundColor: Colors.gold,
  },
  subTabText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textMuted,
    fontSize: 11,
  },
  subTabTextActive: {
    color: Colors.textInverse,
  },
  categoryRow: {
    gap: 6,
    paddingBottom: 2,
  },
  categoryChip: {
    backgroundColor: '#121216',
    borderRadius: Radii.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
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
    fontSize: 11,
  },
  categoryChipTextActive: {
    color: Colors.textInverse,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: '#121216',
    borderRadius: Radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  productImage: {
    width: '100%',
    height: 145,
  },
  productImagePlaceholder: {
    backgroundColor: '#1a1a20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productBody: {
    padding: 9,
    gap: 3,
  },
  eyebrow: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 8,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  productName: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 12,
    lineHeight: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  productPrice: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 13,
  },
  productPriceZig: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 9,
    marginLeft: 3,
  },
  btnOrder: {
    backgroundColor: '#1c1c24',
    borderRadius: Radii.sm,
    paddingVertical: 6,
    alignItems: 'center',
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.3)',
  },
  btnOrderText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.gold,
    fontSize: 10,
  },
  emptyState: {
    backgroundColor: '#121216',
    borderRadius: Radii.md,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
    marginTop: 12,
  },
  emptyTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  emptyBody: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  giveContainer: {
    gap: 8,
    paddingBottom: 16,
  },
  giveHero: {
    backgroundColor: '#0c1a14',
    borderRadius: Radii.lg,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  giveHeroEyebrow: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 9,
    letterSpacing: 1.4,
  },
  giveTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 15,
    textAlign: 'center',
  },
  giveSubtitle: {
    fontFamily: Typography.fontRegular,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
  fundsList: {
    gap: 6,
  },
  fundCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121216',
    borderRadius: Radii.sm,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fundCardActive: {
    borderColor: Colors.gold,
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
  },
  fundName: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 12,
  },
  fundNameActive: {
    color: Colors.gold,
  },
  fundDesc: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 6,
  },
  currencyBtn: {
    flex: 1,
    backgroundColor: '#121216',
    borderRadius: Radii.sm,
    paddingVertical: 7,
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
    fontSize: 11,
  },
  currencyBtnTextActive: {
    color: Colors.textInverse,
  },
  amountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  amountCard: {
    width: '31%',
    backgroundColor: '#121216',
    borderRadius: Radii.sm,
    paddingVertical: 9,
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
    fontSize: 12,
  },
  amountValueActive: {
    color: Colors.textInverse,
  },
  input: {
    backgroundColor: '#121216',
    borderRadius: Radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontFamily: Typography.fontRegular,
    fontSize: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  methodRow: {
    flexDirection: 'row',
    gap: 6,
  },
  methodCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#121216',
    borderRadius: Radii.sm,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  methodCardActive: {
    borderColor: Colors.gold,
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
  },
  methodName: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  methodNameActive: {
    color: Colors.gold,
  },
  phoneSection: {
    gap: 6,
  },
  accountInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.25)',
    borderRadius: Radii.sm,
    padding: 8,
  },
  accountInfoText: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 10,
    flex: 1,
  },
  giveActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.gold,
    borderRadius: Radii.sm,
    paddingVertical: 12,
    marginTop: 4,
  },
  giveActionBtnText: {
    fontFamily: Typography.fontBold,
    color: Colors.textInverse,
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#121216',
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  detailImage: {
    width: '100%',
    height: 190,
    borderRadius: Radii.md,
    marginBottom: 10,
  },
  detailTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 16,
    marginTop: 2,
  },
  detailPrice: {
    fontFamily: Typography.fontBold,
    color: Colors.gold,
    fontSize: 14,
    marginTop: 3,
  },
  detailDesc: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
  },
  sizesSection: {
    marginTop: 10,
  },
  sizesTitle: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.textPrimary,
    fontSize: 12,
    marginBottom: 6,
  },
  sizesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  sizeBox: {
    width: 38,
    height: 34,
    borderRadius: Radii.sm,
    backgroundColor: '#1c1c24',
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
    fontSize: 11,
  },
  sizeTextActive: {
    color: Colors.textInverse,
  },
  orderWhatsAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#dfa732',
    borderRadius: Radii.md,
    paddingVertical: 12,
    marginTop: 14,
  },
  orderWhatsAppBtnText: {
    fontFamily: Typography.fontBold,
    color: '#ffffff',
    fontSize: 13,
  },
  receiptCard: {
    backgroundColor: '#121216',
    borderRadius: Radii.lg,
    padding: 20,
    margin: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  receiptTitle: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 17,
    marginTop: 8,
    textAlign: 'center',
  },
  receiptDesc: {
    fontFamily: Typography.fontRegular,
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 6,
    marginBottom: 12,
  },
  receiptDetails: {
    width: '100%',
    backgroundColor: '#18181f',
    borderRadius: Radii.sm,
    padding: 10,
    gap: 6,
    marginBottom: 14,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  receiptLabel: {
    fontFamily: Typography.fontRegular,
    color: Colors.textMuted,
    fontSize: 11,
  },
  receiptValue: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    fontSize: 11,
  },
  receiptCloseBtn: {
    backgroundColor: Colors.gold,
    borderRadius: Radii.sm,
    paddingVertical: 10,
    paddingHorizontal: 28,
  },
  receiptCloseBtnText: {
    fontFamily: Typography.fontBold,
    color: Colors.textInverse,
    fontSize: 13,
  },
});
