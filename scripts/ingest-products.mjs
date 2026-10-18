import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@supabase/supabase-js';

// Cloudinary config
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL,
  });
} else {
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// Supabase config
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

// Map filenames to product metadata
const productDefinitions = [
  {
    pattern: '15.55.26 (1)',
    name: 'Hashmi Kajal Tube',
    categorySlug: 'islamic-gifts',
    description: 'Traditional Hashmi kajal tube crafted for smooth application and classic eye enhancement.',
    price: 120,
    compareAtPrice: 150,
    badge: 'Popular',
  },
  {
    pattern: '15.55.26 (2)',
    name: 'Al-Haramain Attar Oil Assortment',
    categorySlug: 'ittars-perfumes',
    description: 'A premium assortment of concentrated non-alcoholic attar fragrance oils with long-lasting scent notes.',
    price: 350,
    compareAtPrice: 450,
    badge: 'Bestseller',
  },
  {
    pattern: '15.55.26.',
    name: 'Al-Nuaim Concentrated Perfume Oil 6ml',
    categorySlug: 'ittars-perfumes',
    description: 'Delightful oriental and fresh fragrances by Al-Nuaim in a handy 6ml roll-on bottle.',
    price: 180,
    compareAtPrice: 220,
    badge: 'New',
  },
  {
    pattern: '15.55.27 (1)',
    name: 'Luxury Velvet Embossed Janamaz',
    categorySlug: 'prayer-mats',
    description: 'High-density velvet Islamic prayer rug featuring detailed mihrab motifs and gold fringe finishing.',
    price: 750,
    compareAtPrice: 999,
    badge: 'Featured',
  },
  {
    pattern: '15.55.27 (2)',
    name: 'Ottoman Mihrab Velvet Prayer Rug',
    categorySlug: 'prayer-mats',
    description: 'Exquisitely woven prayer mat with traditional floral motifs and comfortable padding for daily prayers.',
    price: 850,
    compareAtPrice: 1100,
    badge: 'Luxury',
  },
  {
    pattern: '15.55.27 (3)',
    name: 'Royal Velvet Floral Janamaz',
    categorySlug: 'prayer-mats',
    description: 'Beautiful prayer rug with intricate floral borders and plush pile for maximum comfort during prayer.',
    price: 799,
    compareAtPrice: 1050,
    badge: 'Popular',
  },
  {
    pattern: '15.55.27.',
    name: 'Classic Heritage Mihrab Prayer Mat',
    categorySlug: 'prayer-mats',
    description: 'Durable, richly colored prayer rug designed with timeless arch architecture and detailed borders.',
    price: 699,
    compareAtPrice: 899,
  },
  {
    pattern: '15.55.28 (1)',
    name: 'Deluxe Velvet Musalla Mat',
    categorySlug: 'prayer-mats',
    description: 'Plush velvet musalla providing support and serenity during namaz at home or in the mosque.',
    price: 899,
    compareAtPrice: 1200,
  },
  {
    pattern: '15.55.28 (2)',
    name: 'Embroidered Velvet Mihrab Janamaz',
    categorySlug: 'prayer-mats',
    description: 'Features ornate dome and pillar motifs in a rich color palette, finished with decorative tassels.',
    price: 850,
    compareAtPrice: 1150,
  },
  {
    pattern: '15.55.28.',
    name: 'Aroma Diffuser Air Freshener Spray',
    categorySlug: 'ittars-perfumes',
    description: 'Long-lasting atmospheric air freshener with oriental aromatic notes for rooms, prayer spaces, and cars.',
    price: 250,
    compareAtPrice: 320,
  },
  {
    pattern: '15.55.29 (1)',
    name: 'Hashmi Special Surma Kohl Set',
    categorySlug: 'islamic-gifts',
    description: 'Authentic Hashmi Surma in iconic decorative dispenser bottles, trusted for eye soothing and tradition.',
    price: 199,
    compareAtPrice: 260,
  },
  {
    pattern: '15.55.29 (2)',
    name: 'Luminous Green Glow Dhikr Tasbih 100 Beads',
    categorySlug: 'tasbih-misbaha',
    description: 'Vibrant luminous green prayer beads for daily zikr and remembrance, crafted with durable thread.',
    price: 220,
    compareAtPrice: 290,
  },
  {
    pattern: '15.55.29.',
    name: 'Majestic Velvet Arch Prayer Rug',
    categorySlug: 'prayer-mats',
    description: 'Premium prayer carpet with embossed pattern and reinforced stitched edges.',
    price: 799,
    compareAtPrice: 999,
  },
  {
    pattern: '15.55.30.',
    name: 'Faceted Black Crystal Tasbih 100 Beads',
    categorySlug: 'tasbih-misbaha',
    description: 'Sparkling faceted black crystal prayer beads separated by gold-tone spacer beads and a silk tassel.',
    price: 299,
    compareAtPrice: 399,
  },
  {
    pattern: '15.55.31.',
    name: 'Plastic Prayer / Wudu Stool',
    categorySlug: 'islamic-gifts',
    description: 'Sturdy molded low-height seating stool ideal for wudu ablution and comfortable floor prayer support.',
    price: 350,
    compareAtPrice: 450,
  },
  {
    pattern: '15.55.32 (1)',
    name: 'Ornate Red Velvet Quran Cover (Ghilaf)',
    categorySlug: 'quran-tafsir',
    description: 'Protective and dignified velvet cover with golden tassel fringe for safeguarding the Holy Quran.',
    price: 320,
    compareAtPrice: 420,
  },
  {
    pattern: '15.55.32.',
    name: 'Multicolor Velvet Arch Prayer Rug Collection',
    categorySlug: 'prayer-mats',
    description: 'A spectrum of colorful velvet prayer mats suitable for family sets and blessed gift giving.',
    price: 750,
    compareAtPrice: 950,
  },
  {
    pattern: '15.55.33 (1)',
    name: 'Traditional Woven Saf Prayer Runner Dual Mihrab',
    categorySlug: 'prayer-mats',
    description: 'Authentic handwoven striped prayer runner with red and blue twin mihrab design for home or prayer hall.',
    price: 650,
    compareAtPrice: 850,
  },
  {
    pattern: '15.55.33.',
    name: 'Classic Cotton Flatweave Mihrab Rug',
    categorySlug: 'prayer-mats',
    description: 'Woven durable prayer rug in deep navy and grey hues with centered prayer arch motif.',
    price: 550,
    compareAtPrice: 700,
  },
  {
    pattern: '15.55.34 (1)',
    name: 'Velvet Quran Gift Box with Calligraphy',
    categorySlug: 'quran-tafsir',
    description: 'Stack of luxury red velvet gift boxes adorned with golden calligraphy for Quran presentations and nikah gifts.',
    price: 1200,
    compareAtPrice: 1600,
  },
  {
    pattern: '15.55.34.',
    name: 'Flocked Velvet Mihrab Prayer Mat Assortment',
    categorySlug: 'prayer-mats',
    description: 'Soft-touch velvet prayer mats featuring mosque silhouette arches and intricate vine borders.',
    price: 750,
    compareAtPrice: 950,
  },
  {
    pattern: '15.55.35.',
    name: 'Floral Table Dastarkhan Sheet',
    categorySlug: 'islamic-gifts',
    description: 'Traditional printed cotton-poly dastarkhan cloth with spoon and floral motifs for communal meals.',
    price: 280,
    compareAtPrice: 350,
  },
  {
    pattern: '15.55.36 (1)',
    name: 'Plush Royal Blue Arch Prayer Rug',
    categorySlug: 'prayer-mats',
    description: 'Deep royal blue velvet prayer mat with gold arched mihrab and quilted floral borders with fringe.',
    price: 850,
    compareAtPrice: 1100,
  },
  {
    pattern: '15.55.36 (2)',
    name: 'Zamzam Empty Gift Bottles (Pack of 12)',
    categorySlug: 'islamic-gifts',
    description: 'Pack of food-grade miniature bottles with green caps and labels designed for distributing holy Zamzam water.',
    price: 180,
    compareAtPrice: 240,
  },
  {
    pattern: '15.55.36.',
    name: 'Natural Peelu Miswak Twigs (Bulk Bundle)',
    categorySlug: 'islamic-gifts',
    description: 'Bundle of fresh natural Peelu miswak sticks for natural dental care and Sunnah observance.',
    price: 350,
    compareAtPrice: 480,
  },
  {
    pattern: '15.55.37 (1)',
    name: 'Carved Sheesham Wood Quran Rihal (Pair)',
    categorySlug: 'quran-tafsir',
    description: 'Traditional folding wooden Quran rehal with brass star inlays and handcrafted latticework.',
    price: 650,
    compareAtPrice: 850,
  },
  {
    pattern: '15.55.37 (2)',
    name: 'Holy Zamzam Water Bottle 5 Liters',
    categorySlug: 'islamic-gifts',
    description: 'Sealed 5L Zamzam water container certified by the National Water Company for air travel and family consumption.',
    price: 1450,
    compareAtPrice: 1800,
  },
  {
    pattern: '15.55.37.',
    name: 'Stackable Mosque / Namaz Plastic Stools',
    categorySlug: 'islamic-gifts',
    description: 'Stackable high-grade plastic stools designed for mosques, elders, and extended prayer seating support.',
    price: 420,
    compareAtPrice: 550,
  },
  {
    pattern: '15.55.38 (1)',
    name: 'Classic White Keffiyeh Shemagh Scarf',
    categorySlug: 'islamic-gifts',
    description: 'Soft, breathable white keffiyeh scarf with decorative border and tasseled edges.',
    price: 350,
    compareAtPrice: 450,
  },
  {
    pattern: '15.55.38 (2)',
    name: 'White Skullcap Topi with Embroidery',
    categorySlug: 'islamic-gifts',
    description: 'Lightweight, breathable cotton prayer namaz cap featuring fine white embroidery.',
    price: 120,
    compareAtPrice: 180,
  },
  {
    pattern: '15.55.38.',
    name: 'Premium Leather Khuffain Prayer Socks',
    categorySlug: 'islamic-gifts',
    description: 'Soft genuine leather khuffain socks with side zipper for easy wudu masah and cold weather protection.',
    price: 499,
    compareAtPrice: 650,
  },
  {
    pattern: '15.55.39 (1)',
    name: 'Digital Finger Tally Tasbih Counter',
    categorySlug: 'tasbih-misbaha',
    description: 'Portable digital finger counter with soft strap and LCD screen for accurate zikr counting.',
    price: 99,
    compareAtPrice: 150,
  },
  {
    pattern: '15.55.39 (2)',
    name: 'Crystal Floral Tasbih 99 Beads',
    categorySlug: 'tasbih-misbaha',
    description: 'Elegant shimmering crystal prayer beads designed for heartfelt dhikr, meditation, and gifting.',
    price: 240,
    compareAtPrice: 320,
  },
  {
    pattern: '15.55.39.',
    name: 'Traditional Wooden Oudh Incense Burner Mabkhara',
    categorySlug: 'islamic-gifts',
    description: 'Classic wooden bakhoor burner with brass tray for burning bakhoor, frankincense, and oud wood.',
    price: 450,
    compareAtPrice: 599,
  },
  {
    pattern: '15.55.40 (1)',
    name: 'Deluxe Velvet Quran Box with Metallic Lock',
    categorySlug: 'quran-tafsir',
    description: 'Handcrafted velvet storage case with ornate brass corners and secure lock to preserve holy books.',
    price: 950,
    compareAtPrice: 1250,
  },
  {
    pattern: '15.55.40.',
    name: 'Emerald Green Velvet Mihrab Prayer Mat',
    categorySlug: 'prayer-mats',
    description: 'Deep emerald velvet prayer mat embellished with Islamic architectural arches and soft woven fringe.',
    price: 799,
    compareAtPrice: 1050,
  },
];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

async function uploadToCloudinary(filePath, publicId) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      filePath,
      {
        folder: 'maqbool_products',
        public_id: publicId,
        overwrite: true,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
  });
}

async function run() {
  console.log('--- Starting Cloudinary Upload & Supabase Ingestion ---');
  const dirPath = path.join(process.cwd(), 'public', 'product images');
  const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.jpeg') || f.endsWith('.jpg') || f.endsWith('.png'));

  console.log(`Found ${files.length} images to process.`);

  // Load categories
  const { data: categories, error: catErr } = await supabase.from('categories').select('*');
  if (catErr) {
    console.error('Category load error:', catErr);
    return;
  }
  const categoryMap = new Map(categories.map((c) => [c.slug, c.id]));

  // Pre-fetch existing products to avoid duplicating
  const { data: existingProducts } = await supabase.from('products').select('slug');
  const existingSlugs = new Set((existingProducts || []).map((p) => p.slug));

  let successCount = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(dirPath, file);

    const def = productDefinitions.find((d) => file.includes(d.pattern)) || {
      name: `Maqbool Islamic Product ${i + 1}`,
      categorySlug: 'islamic-gifts',
      description: 'Authentic Islamic merchandise sourced with highest care and blessed quality.',
      price: 499,
      compareAtPrice: 650,
    };

    let slug = slugify(def.name);
    if (existingSlugs.has(slug)) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }
    existingSlugs.add(slug);

    const categoryId = categoryMap.get(def.categorySlug) || categories[0].id;

    console.log(`[${i + 1}/${files.length}] Uploading: ${file} -> ${def.name}`);

    try {
      const uploadRes = await uploadToCloudinary(filePath, `prod_${slug}_${i}`);
      const imageUrl = uploadRes.secure_url;
      const publicId = uploadRes.public_id;

      // 1. Insert product matching exact schema
      const { data: product, error: prodErr } = await supabase
        .from('products')
        .insert({
          name: def.name,
          slug: slug,
          category_id: categoryId,
          description: def.description,
          price: def.price,
          compare_at_price: def.compareAtPrice,
          badge: def.badge || null,
          is_featured: i < 6,
          is_active: true,
          display_order: i,
          rating: 4.8,
          review_count: 15 + (i * 3) % 40,
          seo_title: `${def.name} | Maqbool Islamic Products`,
          seo_description: def.description,
        })
        .select()
        .single();

      if (prodErr) {
        console.error(`Error inserting product for ${file}:`, prodErr);
        continue;
      }

      // 2. Insert variant matching exact schema
      const { data: variant, error: varErr } = await supabase
        .from('product_variants')
        .insert({
          product_id: product.id,
          sku: `SKU-${slug.toUpperCase().slice(0, 8)}-${100 + i}`,
          name: 'Standard',
          value: 'Default',
          price: def.price,
          compare_at_price: def.compareAtPrice,
          stock: 50,
          image_url: imageUrl,
          is_active: true,
          display_order: 0,
        })
        .select()
        .single();

      if (varErr) {
        console.error(`Error inserting variant for ${file}:`, varErr);
      }

      // 3. Insert product image matching exact schema
      const { error: imgErr } = await supabase.from('product_images').insert({
        product_id: product.id,
        secure_url: imageUrl,
        public_id: publicId,
        resource_type: uploadRes.resource_type || 'image',
        format: uploadRes.format || 'jpg',
        width: uploadRes.width || 800,
        height: uploadRes.height || 800,
        bytes: uploadRes.bytes || 0,
        alt_text: def.name,
        is_featured: true,
        is_active: true,
        display_order: 0,
      });

      if (imgErr) {
        console.error(`Error inserting image for ${file}:`, imgErr);
      }

      // 4. Insert FAQ
      await supabase.from('product_faqs').insert([
        {
          product_id: product.id,
          question: 'Is this product authentic and high quality?',
          answer: 'Yes, all our products are strictly verified for authenticity and crafted with devotion by Maqbool Islamic Products.',
          is_active: true,
          display_order: 0,
        },
      ]);

      successCount++;
      console.log(` Successfully added [${successCount}/${files.length}]: ${def.name}`);
    } catch (err) {
      console.error(` Failed processing ${file}:`, err);
    }
  }

  console.log(`\n🎉 Finished! Successfully uploaded to Cloudinary & inserted to Supabase: ${successCount}/${files.length}`);
}

run();
