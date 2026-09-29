import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { env } from '../config/env.js';
import {
  User,
  UserRole,
  SellerProfile,
  SellerStatus,
  Category,
  Craft,
  Product,
  CulturalStory,
  ProductStatus,
  Cart,
  Wishlist,
} from './models/index.js';

async function seed() {
  console.log('🌱 Starting comprehensive Utkal Nari database seed...');
  await connectDatabase();

  // ─── 1. Admin Bootstrap ───────────────────────────────────────────────────
  const adminEmail = env.ADMIN_EMAIL || 'admin@utkalnari.com';
  const adminPassword = env.ADMIN_PASSWORD || 'Admin@123456';
  let admin = await User.findOne({ email: adminEmail });

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  if (!admin) {
    admin = await User.create({
      name: env.ADMIN_NAME || 'Super Admin',
      email: adminEmail,
      phone: '9876543210',
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
    });
    console.log(`✅ Admin account created: ${adminEmail} (password: ${adminPassword})`);
  } else {
    admin.passwordHash = passwordHash;
    admin.role = UserRole.ADMIN;
    admin.isActive = true;
    admin.deletedAt = undefined as any;
    await admin.save();
    console.log(`✅ Admin account synced & password updated: ${adminEmail} (password: ${adminPassword})`);
  }

  // ─── 2. Test Customer User ─────────────────────────────────────────────────
  const testCustomerEmail = 'customer@utkalnari.com';
  const testCustomerPassword = 'Customer@123456';
  let testCustomer = await User.findOne({ email: testCustomerEmail });
  const customerHash = await bcrypt.hash(testCustomerPassword, 12);

  if (!testCustomer) {
    testCustomer = await User.create({
      name: 'Priyanka Dash',
      email: testCustomerEmail,
      phone: '9861000001',
      passwordHash: customerHash,
      role: UserRole.CUSTOMER,
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
    });

    await Promise.all([
      Cart.create({ userId: testCustomer._id, items: [] }),
      Wishlist.create({ userId: testCustomer._id, items: [] }),
    ]);
    console.log(`✅ Test customer created: ${testCustomerEmail} (password: ${testCustomerPassword})`);
  } else {
    testCustomer.passwordHash = customerHash;
    testCustomer.isActive = true;
    testCustomer.deletedAt = undefined as any;
    await testCustomer.save();
    console.log(`✅ Test customer synced & password updated: ${testCustomerEmail} (password: ${testCustomerPassword})`);
  }

  // ─── 3. Categories ─────────────────────────────────────────────────────────
  const categoriesData = [
    {
      name: 'Handloom & Textiles',
      slug: 'handloom',
      description: 'World-renowned Sambalpuri, Kotpad, Berhampuri, and Khandua weaves handcrafted on pit looms.',
      sortOrder: 1,
    },
    {
      name: 'Traditional Sarees',
      slug: 'sarees',
      description: 'Heirloom Odia sarees featuring sacred Bandha Kala ikat and temple borders.',
      sortOrder: 2,
    },
    {
      name: 'Tarakasi Jewellery',
      slug: 'jewellery',
      description: 'Centuries-old delicate silver filigree lacework and tribal brass ornaments.',
      sortOrder: 3,
    },
    {
      name: 'Pattachitra & Folk Art',
      slug: 'paintings',
      description: 'Sacred cloth paintings and etched palm-leaf engravings made with natural mineral pigments.',
      sortOrder: 4,
    },
    {
      name: 'Home & Living Decor',
      slug: 'home-decor',
      description: 'Dhokra non-ferrous lost-wax sculptures, terracotta pots, and Pipili appliqué accents.',
      sortOrder: 5,
    },
    {
      name: 'Cultural Gifts & Souvenirs',
      slug: 'gifts',
      description: 'Authentic miniature idols, brass bells, and ritual artifacts preserving Odia heritage.',
      sortOrder: 6,
    },
  ];

  const categoryMap = new Map<string, any>();
  for (const cat of categoriesData) {
    let doc = await Category.findOne({ slug: cat.slug });
    if (!doc) {
      doc = await Category.create(cat);
      console.log(`✅ Category created: ${cat.name}`);
    }
    categoryMap.set(cat.slug, doc._id);
  }

  // ─── 4. Traditional Odia Crafts ───────────────────────────────────────────
  const craftsData = [
    {
      name: 'Sambalpuri Ikat (Bandha Kala)',
      slug: 'sambalpuri',
      description: 'Legendary tie-dye technique where warp and weft threads are precisely dyed prior to weaving on traditional pit-looms.',
      origin: 'Bargarh, Sonepur, Sambalpur',
      technique: 'Double Ikat (Bandha Kala) weaving with natural dyes and mathematical alignment.',
      materials: ['Pure Mulberry Silk', 'Fine Combed Cotton', 'Natural Madder & Indigo'],
      sortOrder: 1,
    },
    {
      name: 'Pattachitra Painting',
      slug: 'pattachitra',
      description: 'Cloth scroll painting originating in Raghurajpur heritage village, traditionally used as sacred offerings in Jagannath temple.',
      origin: 'Raghurajpur, Puri',
      technique: 'Chitrakara scroll painting prepared with tamarind seed glue, conch shell white, and river stone mineral pigments.',
      materials: ['Tussar Silk Canvas', 'Conch Shell Powder', 'Hartal Mineral', 'Lamp Soot'],
      sortOrder: 2,
    },
    {
      name: 'Dhokra Metal Craft',
      slug: 'dhokra',
      description: '4,000-year-old primitive lost-wax non-ferrous metal casting practiced by tribal guilds of Odisha.',
      origin: 'Mayurbhanj, Dhenkanal, Rayagada',
      technique: 'Cire perdue (lost-wax casting) with hand-drawn beeswax threads shaped over baked clay cores.',
      materials: ['Recycled Brass', 'Natural Beeswax', 'Clay', 'Rice Husk'],
      sortOrder: 3,
    },
    {
      name: 'Tarakasi (Silver Filigree)',
      slug: 'tarakasi',
      description: 'Extremely intricate silver wire lacework originating from the silver city of Cuttack, famed for Durga Puja medhas and crowns.',
      origin: 'Cuttack',
      technique: 'Drawing high-purity silver wire through steel dies and curling into microscopic filigree lacework.',
      materials: ['92.5% Sterling Silver', 'Natural Semi-precious Stones'],
      sortOrder: 4,
    },
    {
      name: 'Pipili Appliqué Work',
      slug: 'pipili-applique',
      description: 'Vibrant cloth-on-cloth stitching heritage created to decorate Lord Jagannath’s chariots during the grand Rath Yatra.',
      origin: 'Pipili, Puri',
      technique: 'Layered fabric cut-out motifs hand-embroidered with mirror embellishments and decorative chain stitch.',
      materials: ['Cotton Fabric', 'Glass Mirrors', 'Metallic Thread', 'Tassels'],
      sortOrder: 5,
    },
    {
      name: 'Kotpad Organic Dye Weave',
      slug: 'kotpad',
      description: 'Tribal cotton textile dyed naturally using the roots of the Aal (Indian Madder) tree by the Mirgan community.',
      origin: 'Koraput',
      technique: 'Vegetable extraction dyeing with unbleached organic cotton on pit looms.',
      materials: ['Indigenous Cotton', 'Aal Tree Bark Extract', 'Castor Oil'],
      sortOrder: 6,
    },
  ];

  const craftMap = new Map<string, any>();
  for (const craft of craftsData) {
    let doc = await Craft.findOne({ slug: craft.slug });
    if (!doc) {
      doc = await Craft.create(craft);
      console.log(`✅ Craft created: ${craft.name}`);
    }
    craftMap.set(craft.slug, doc._id);
  }

  // ─── 5. Women Master Artisans ──────────────────────────────────────────────
  const artisansData = [
    {
      name: 'Malati Meher',
      email: 'malati.meher@artisan.utkalnari.com',
      phone: '9861011223',
      craftType: 'Sambalpuri Ikat Weaving',
      slug: 'malati-meher',
      district: 'Bargarh',
      yearsOfExperience: 24,
      artisanStory:
        'For 24 years, I have dyed threads and woven tales of our folklore into each Sambalpuri saree. Through Utkal Nari, my daughter and I send our handwoven sarees directly to conscious homes, earning fair livelihood with dignity.',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Sanju Chitrakar',
      email: 'sanju.chitrakar@artisan.utkalnari.com',
      phone: '9861022334',
      craftType: 'Pattachitra Painting',
      slug: 'sanju-chitrakar',
      district: 'Puri',
      yearsOfExperience: 18,
      artisanStory:
        'Inheriting the sacred craft from my grandmother in the heritage village of Raghurajpur, I paint epic legends using mineral colours ground by hand from river pebbles and conch shells.',
      photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Kamala Nayak',
      email: 'kamala.nayak@artisan.utkalnari.com',
      phone: '9861033445',
      craftType: 'Dhokra Brass Metalwork',
      slug: 'kamala-nayak',
      district: 'Dhenkanal',
      yearsOfExperience: 15,
      artisanStory:
        'Our women artisan guild shapes beeswax threads around baked clay cores, continuing an unbroken casting tradition older than the Indus Valley civilization.',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Bishnupriya Sahoo',
      email: 'bishnupriya.sahoo@artisan.utkalnari.com',
      phone: '9861044556',
      craftType: 'Tarakasi Silver Filigree',
      slug: 'bishnupriya-sahoo',
      district: 'Cuttack',
      yearsOfExperience: 21,
      artisanStory:
        'Drawing pure silver into delicate gossamer webs thinner than hair has been our family worship for four generations. We infuse eternal Odia devotion into every silver filigree pendant and brooch.',
      photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Sabita Mohapatra',
      email: 'sabita.mohapatra@artisan.utkalnari.com',
      phone: '9861055667',
      craftType: 'Pipili Appliqué Craft',
      slug: 'sabita-mohapatra',
      district: 'Puri',
      yearsOfExperience: 16,
      artisanStory:
        'From stitching the divine canopies of Lord Jagannath’s Rath Yatra to crafting vibrant wall hangings, our cooperative brings auspicious color and sacred light to homes worldwide.',
      photo: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=800&q=80',
    },
  ];

  const sellerMap = new Map<string, any>();
  for (const artisan of artisansData) {
    let user = await User.findOne({ email: artisan.email });
    const hash = await bcrypt.hash('Artisan@123456', 12);
    if (!user) {
      user = await User.create({
        name: artisan.name,
        email: artisan.email,
        phone: artisan.phone,
        passwordHash: hash,
        role: UserRole.SELLER,
        isActive: true,
        isEmailVerified: true,
      });
      console.log(`✅ Artisan user account created: ${artisan.email}`);
    } else {
      user.passwordHash = hash;
      user.role = UserRole.SELLER;
      user.isActive = true;
      user.deletedAt = undefined as any;
      await user.save();
    }

    let profile = await SellerProfile.findOne({ userId: user._id });
    if (!profile) {
      profile = await SellerProfile.create({
        userId: user._id,
        craftType: artisan.craftType,
        yearsOfExperience: artisan.yearsOfExperience,
        artisanStory: artisan.artisanStory,
        slug: artisan.slug,
        district: artisan.district,
        state: 'Odisha',
        photo: artisan.photo,
        status: SellerStatus.APPROVED,
        rating: 4.9,
        reviewCount: 18,
        totalProducts: 5,
      });
      console.log(`✅ Artisan profile ready: ${artisan.name}`);
    }
    sellerMap.set(artisan.slug, profile._id);
  }

  // ─── 6. Comprehensive Product Catalog ─────────────────────────────────────
  const productsData = [
    {
      name: 'Sambalpuri Bomkai Silk Saree with Temple Border',
      slug: 'sambalpuri-bomkai-silk-saree',
      shortDescription: 'Pure handwoven Mulberry silk saree featuring iconic temple border motifs and traditional double ikat aanchal.',
      description:
        'Woven completely on traditional pit-looms by master artisan Malati Meher in Bargarh, this Sambalpuri Bomkai Silk Saree embodies the revered Bandha Kala technique. The deep crimson and madder hues are derived from sustainable natural dyes, complemented by intricate fish and conch border designs.',
      sellerSlug: 'malati-meher',
      categorySlug: 'sarees',
      craftSlug: 'sambalpuri',
      district: 'Bargarh',
      materials: ['100% Pure Mulberry Silk', 'Zari Threads'],
      dimensions: '6.3 meters (includes running blouse piece)',
      weight: '620 grams',
      color: 'Crimson & Raw Silk Gold',
      sku: 'UN-BOMKAI-001',
      basePrice: 6500,
      sellingPrice: 7999,
      images: [
        { url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80', isPrimary: true, sortOrder: 0 },
        { url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80', isPrimary: false, sortOrder: 1 },
      ],
      isHandmade: true,
      isFeatured: true,
      isBestseller: true,
      isNewArrival: false,
      status: ProductStatus.PUBLISHED,
      publishedAt: new Date(),
      stockQuantity: 5,
      rating: 5.0,
      reviewCount: 12,
    },
    {
      name: 'Handwoven Sambalpuri Cotton Saree with Pasapalli Chess Motif',
      slug: 'sambalpuri-cotton-pasapalli-saree',
      shortDescription: 'Breathable organic cotton saree boasting the iconic Pasapalli black-and-white checkered weaving tradition.',
      description:
        'Symbolizing the sacred game of dice played in the Mahabharata, the Pasapalli check weave demands master-level alignment of pre-dyed threads. Woven with organic combed cotton, providing sublime comfort in all seasons.',
      sellerSlug: 'malati-meher',
      categorySlug: 'handloom',
      craftSlug: 'sambalpuri',
      district: 'Bargarh',
      materials: ['100% Organic Handloom Cotton', 'Vegetable Dyes'],
      dimensions: '5.5 meters',
      weight: '480 grams',
      color: 'Ebony Black & Ivory White',
      sku: 'UN-PASA-002',
      basePrice: 3800,
      sellingPrice: 4600,
      images: [
        { url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80', isPrimary: true, sortOrder: 0 },
      ],
      isHandmade: true,
      isFeatured: true,
      isBestseller: true,
      isNewArrival: true,
      status: ProductStatus.PUBLISHED,
      publishedAt: new Date(),
      stockQuantity: 8,
      rating: 4.9,
      reviewCount: 9,
    },
    {
      name: 'Tree of Life Sacred Pattachitra Canvas',
      slug: 'tree-of-life-pattachitra-canvas',
      shortDescription: 'Hand-painted Pattachitra painting on prepared tussar silk canvas using pure organic mineral colours.',
      description:
        'Sanju Chitrakar of Raghurajpur hand-crafts this spiritual Tree of Life (Kalpavriksha) scroll over four weeks. Using conch-shell white, volcanic lamp black, and river-stone yellows mixed with wood apple gum, every fine line tells an eternal sacred Odia allegory.',
      sellerSlug: 'sanju-chitrakar',
      categorySlug: 'paintings',
      craftSlug: 'pattachitra',
      district: 'Puri',
      materials: ['Tussar Silk Cloth', 'Conch White', 'Stone Minerals', 'Tamarind Seed Gum'],
      dimensions: '24 x 18 inches (Unframed)',
      weight: '180 grams',
      color: 'Natural Earth Pigments',
      sku: 'UN-PATTA-003',
      basePrice: 3200,
      sellingPrice: 4200,
      images: [
        { url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80', isPrimary: true, sortOrder: 0 },
      ],
      isHandmade: true,
      isFeatured: true,
      isBestseller: false,
      isNewArrival: true,
      status: ProductStatus.PUBLISHED,
      publishedAt: new Date(),
      stockQuantity: 4,
      rating: 4.8,
      reviewCount: 7,
    },
    {
      name: 'Lord Jagannath Sacred Tala Pattachitra (Palm Leaf Etching)',
      slug: 'jagannath-tala-pattachitra-etching',
      shortDescription: 'Ancient iron stylus etching on sun-cured palm leaf ribbons depicting Lord Jagannath, Balabhadra & Subhadra.',
      description:
        'Created strictly on hand-cured and dried palm fronds bonded with indigenous cotton threads. The artisan incises delicate micro-lines with a sharp iron stylus before rubbing natural black carbon ink across the grooves.',
      sellerSlug: 'sanju-chitrakar',
      categorySlug: 'paintings',
      craftSlug: 'pattachitra',
      district: 'Puri',
      materials: ['Sun-cured Palm Leaves', 'Natural Lamp Soot', 'Wood Apple Resin'],
      dimensions: '16 x 10 inches folding scroll',
      weight: '120 grams',
      color: 'Natural Ochre & Lamp Black',
      sku: 'UN-TALAPAT-004',
      basePrice: 1900,
      sellingPrice: 2500,
      images: [
        { url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80', isPrimary: true, sortOrder: 0 },
      ],
      isHandmade: true,
      isFeatured: false,
      isBestseller: true,
      isNewArrival: false,
      status: ProductStatus.PUBLISHED,
      publishedAt: new Date(),
      stockQuantity: 6,
      rating: 5.0,
      reviewCount: 14,
    },
    {
      name: 'Tribal Odia Musician Dhokra Brass Sculpture',
      slug: 'tribal-odia-musician-dhokra-brass',
      shortDescription: 'Lost-wax non-ferrous cast brass sculpture crafted by Kamala Nayak using ancient wax-thread coils.',
      description:
        'This 4,000-year-old craft is brought to life in an expressive figurine of an Odia tribal horn player. The rustic patinated finish and organic wax lines make each cast uniquely one-of-a-kind, impossible to replicate industrially.',
      sellerSlug: 'kamala-nayak',
      categorySlug: 'home-decor',
      craftSlug: 'dhokra',
      district: 'Dhenkanal',
      materials: ['Reclaimed Brass', 'Beeswax Clay Casting'],
      dimensions: '8 x 4 x 3.5 inches',
      weight: '850 grams',
      color: 'Antique Brass & Verdigris highlights',
      sku: 'UN-DHOKRA-005',
      basePrice: 1600,
      sellingPrice: 2250,
      images: [
        { url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80', isPrimary: true, sortOrder: 0 },
      ],
      isHandmade: true,
      isFeatured: false,
      isBestseller: true,
      isNewArrival: false,
      status: ProductStatus.PUBLISHED,
      publishedAt: new Date(),
      stockQuantity: 7,
      rating: 4.9,
      reviewCount: 11,
    },
    {
      name: 'Sacred Dhokra Brass Temple Bell with Nandi Figurine',
      slug: 'dhokra-brass-temple-bell-nandi',
      shortDescription: 'Resonant lost-wax cast bell crowned with a hand-sculpted Nandi bull guardian figurine.',
      description:
        'Cast using indigenous clay kilns by Kamala Nayak in Dhenkanal. Produces an authentic, clear acoustic reverberation for home meditation, puja altars, or as an heirloom cultural conversation piece.',
      sellerSlug: 'kamala-nayak',
      categorySlug: 'gifts',
      craftSlug: 'dhokra',
      district: 'Dhenkanal',
      materials: ['Bell Metal Brass Alloy', 'Clay Lost-Wax Core'],
      dimensions: '7.5 inches height, 3.5 inches base diameter',
      weight: '650 grams',
      color: 'Burnished Gold-Brass',
      sku: 'UN-BELL-006',
      basePrice: 1200,
      sellingPrice: 1699,
      images: [
        { url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80', isPrimary: true, sortOrder: 0 },
      ],
      isHandmade: true,
      isFeatured: true,
      isBestseller: false,
      isNewArrival: true,
      status: ProductStatus.PUBLISHED,
      publishedAt: new Date(),
      stockQuantity: 5,
      rating: 4.7,
      reviewCount: 6,
    },
    {
      name: 'Tarakasi (Silver Filigree) Mayur Floral Pendant',
      slug: 'tarakasi-silver-filigree-mayur-pendant',
      shortDescription: 'Hallmarked 925 sterling silver filigree peacock pendant handcrafted from twisted silver wire threads in Cuttack.',
      description:
        'Every single feather of the royal peacock (Mayur) is woven from hair-thin pure silver wires drawn and soldered by master artisan Bishnupriya Sahoo. A timeless jewel of Odia refinement.',
      sellerSlug: 'bishnupriya-sahoo',
      categorySlug: 'jewellery',
      craftSlug: 'tarakasi',
      district: 'Cuttack',
      materials: ['925 Sterling Silver', 'Anti-tarnish Organic Finish'],
      dimensions: '2.2 x 1.4 inches',
      weight: '14 grams',
      color: 'Brilliant Silver',
      sku: 'UN-FILIGREE-007',
      basePrice: 2800,
      sellingPrice: 3499,
      images: [
        { url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80', isPrimary: true, sortOrder: 0 },
      ],
      isHandmade: true,
      isFeatured: true,
      isBestseller: true,
      isNewArrival: true,
      status: ProductStatus.PUBLISHED,
      publishedAt: new Date(),
      stockQuantity: 4,
      rating: 5.0,
      reviewCount: 16,
    },
    {
      name: 'Pipili Appliqué Decorative Temple Wall Hanging',
      slug: 'pipili-applique-temple-wall-hanging',
      shortDescription: 'Vibrant hand-stitched cloth tapestry with geometric flower petals and mirror work from Pipili.',
      description:
        'Using centuries-old cut-and-stitch techniques developed for the sacred chariots of Puri, Sabita Mohapatra stitches brilliant scarlet, turquoise, and mustard cotton layers, accented by real glass mirrors that ward off negative energies.',
      sellerSlug: 'sabita-mohapatra',
      categorySlug: 'home-decor',
      craftSlug: 'pipili-applique',
      district: 'Puri',
      materials: ['Pure Cotton Twill', 'Glass Mirrors', 'Cotton Tassels'],
      dimensions: '36 x 24 inches',
      weight: '420 grams',
      color: 'Festive Red, Yellow & Indigo',
      sku: 'UN-PIPI-008',
      basePrice: 1400,
      sellingPrice: 1899,
      images: [
        { url: 'https://images.unsplash.com/photo-1606744837616-56c9a5c6a6eb?auto=format&fit=crop&w=800&q=80', isPrimary: true, sortOrder: 0 },
      ],
      isHandmade: true,
      isFeatured: false,
      isBestseller: true,
      isNewArrival: false,
      status: ProductStatus.PUBLISHED,
      publishedAt: new Date(),
      stockQuantity: 9,
      rating: 4.8,
      reviewCount: 10,
    },
  ];

  for (const prod of productsData) {
    let exists = await Product.findOne({ slug: prod.slug });
    const sellerId = sellerMap.get(prod.sellerSlug);
    const categoryId = categoryMap.get(prod.categorySlug);
    const craftId = craftMap.get(prod.craftSlug);

    if (!exists) {
      await Product.create({
        ...prod,
        sellerId,
        categoryId,
        craftId,
      });
      console.log(`✅ Product created: ${prod.name}`);
    } else {
      await Product.updateOne(
        { slug: prod.slug },
        { $set: { sellerId, categoryId, craftId, status: ProductStatus.PUBLISHED, isNewArrival: prod.isNewArrival } }
      );
    }
  }

  // ─── 7. Cultural Stories & Craft Journal ───────────────────────────────────
  const storiesData = [
    {
      title: 'The Sacred Art of Pattachitra: Painting with Earth and Shell',
      slug: 'sacred-art-pattachitra',
      category: 'craft-stories',
      excerpt: 'How master women painters extract organic pigments from conch shells and volcanic minerals to preserve the Jagannath tradition in Raghurajpur.',
      content:
        'Walking down the painted lanes of Raghurajpur in Puri district, one is greeted not by storefronts, but by verandas where three generations of women sit side by side with fine brushes in hand.\n\nPattachitra — literally "cloth painting" — has been practiced here for over a millennium as an essential ritual offering for Lord Jagannath during the Anasara seclusion period. What separates authentic Pattachitra from commercial art is its fierce commitment to natural chemistry.\n\nThe canvas is painstakingly prepared by bonding two layers of cotton with tamarind seed paste, burnished with river pebbles until smooth as parchment. The white pigment comes from ground conch shells, the vibrant yellow from Hartal stones, and deep black from camphor soot. Nothing synthetic touches the surface.\n\nEvery stroke is an act of prayer, connecting the painter\'s soul with the eternal myths of Odisha.',
      heroImage: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80',
      readTimeMinutes: 6,
      isFeatured: true,
      isPublished: true,
      publishedAt: new Date(),
      tags: ['pattachitra', 'raghurajpur', 'puri', 'natural-dyes', 'jagannath'],
    },
    {
      title: 'Bandha Kala: The Ancient Mathematics of Odisha Handloom',
      slug: 'bandha-kala-weaving',
      category: 'artisan-stories',
      excerpt: 'The intricate tie-and-dye geometry behind Western Odisha’s celebrated handlooms, counted thread by thread on pit looms.',
      content:
        'In the weaving hamlets of Bargarh and Sonepur, poetry is written in grid math. Long before any loom is threaded, women artisans measure and tie minute knots across bundles of silk and cotton threads.\n\nEach bundle is dipped into natural vats of indigo, madder, or marigold extract. When untied, crisp resisting patterns appear. Only when both warp and weft meet on the loom does the hidden iconography — the conch (sankha), wheel (chakra), and lotus (padma) — magically align.\n\nA single Sambalpuri Bomkai saree takes up to 30 days of unyielding focus, where a single miscalculation ruins weeks of arduous preparation. Through Utkal Nari, these master weavers preserve an unbroken mathematical heritage.',
      heroImage: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1200&q=80',
      readTimeMinutes: 8,
      isFeatured: true,
      isPublished: true,
      publishedAt: new Date(),
      tags: ['sambalpuri', 'bargarh', 'handloom', 'ikat', 'weaving'],
    },
    {
      title: 'Dhokra: Whispers of the Lost-Wax Fire from 4,000 Years Ago',
      slug: 'dhokra-ancient-lost-wax-tradition',
      category: 'odisha-culture',
      excerpt: 'In the tribal heartlands of Dhenkanal and Mayurbhanj, women artisans still cast brass sculptures using beeswax strings and open-pit fire pits.',
      content:
        'Long before industrial metalwork emerged, the indigenous artisans of Odisha perfected the art of non-ferrous lost-wax casting (cire perdue). Archaeologists trace this exact method directly to the famed Dancing Girl of Mohenjo-daro.\n\nFirst, a core of river clay and rice husk is sculpted and sun-dried. Next, purified beeswax is pushed through wooden presses to produce thin, pliable wax threads. These threads are wound meticulously around the clay body to form expressive details — tribal headgear, horns, and ornaments.\n\nA secondary heavy clay envelope is applied, leaving narrow channels. When fired in red-hot charcoal pits, the wax melts away into the earth, and molten brass is poured to occupy the hollow cavity. Because the clay mold must be broken to reveal the sculpture, every single Dhokra piece is an unrepeatable original.',
      heroImage: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80',
      readTimeMinutes: 7,
      isFeatured: true,
      isPublished: true,
      publishedAt: new Date(),
      tags: ['dhokra', 'dhenkanal', 'tribal-craft', 'brass', 'lost-wax'],
    },
    {
      title: 'Tarakasi: How Cuttack’s Silver Lace Adorns the Gods',
      slug: 'tarakasi-cuttack-silver-filigree',
      category: 'craft-stories',
      excerpt: 'Delicate silver wires drawn finer than a hair string are welded to create radiant crowns, jewelry, and the silver tableaus of Durga Puja.',
      content:
        'Along the banks of the Mahanadi river in Cuttack, the soft clinking of small hammers and the hissing of blowpipes have echoed for more than 500 years. This is the domain of Tarakasi, silver filigree craft at its zenith.\n\nPure silver ingots are alloyed with a tiny fraction of copper for rigidity, melted, and pulled through progressively smaller steel holes until drawn into delicate filaments. Two of these filaments are spun together like twisted thread, flattened, and bent into intricate zigzag ribbons.\n\nDuring Durga Puja, entire tableaus (Chandi Medha) made of hundreds of kilograms of filigree work dazzle the streets of Cuttack. In daily life, Odia women wear delicate Tarakasi earrings and pendants as symbols of auspiciousness and unmatched elegance.',
      heroImage: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80',
      readTimeMinutes: 5,
      isFeatured: false,
      isPublished: true,
      publishedAt: new Date(),
      tags: ['tarakasi', 'cuttack', 'silver-filigree', 'jewellery'],
    },
  ];

  for (const story of storiesData) {
    let exists = await CulturalStory.findOne({ slug: story.slug });
    if (!exists) {
      await CulturalStory.create(story);
      console.log(`✅ Cultural story created: ${story.title}`);
    } else {
      await CulturalStory.updateOne(
        { slug: story.slug },
        { $set: { ...story, isPublished: true } }
      );
    }
  }

  console.log('─────────────────────────────────────────────────────────────');
  console.log('🎉 Utkal Nari seed completed successfully!');
  console.log(`🔑 ADMIN Credentials:`);
  console.log(`   Email:    ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log(`🔑 TEST CUSTOMER Credentials:`);
  console.log(`   Email:    ${testCustomerEmail}`);
  console.log(`   Password: ${testCustomerPassword}`);
  console.log(`🔑 TEST ARTISAN Credentials:`);
  console.log(`   Email:    malati.meher@artisan.utkalnari.com`);
  console.log(`   Password: Artisan@123456`);
  console.log('─────────────────────────────────────────────────────────────');
}

seed()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectDatabase();
  });
