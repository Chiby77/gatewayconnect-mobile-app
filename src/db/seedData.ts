import * as SQLite from 'expo-sqlite';

export function seedInitialData(db: SQLite.SQLiteDatabase): void {
  const now = new Date().toISOString();

  // 1. Seed Products (T-shirts, Apparel, Books)
  const productCount = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM products')?.count || 0;
  if (productCount === 0) {
    const products = [
      {
        id: 'prod_jd_white_heaven',
        name: 'JD Collection "Make Heaven Crowded" Velvet Print T-Shirt',
        description: 'White Theme: 100% premium soft cotton t-shirt with signature black suede velvet print "MAKE HEAVEN CROWDED" across the chest. Reverse showcases Apostle Joe Daniels silhouette.',
        price: 34.99,
        currency: 'USD',
        image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80',
        category: 'Apparel',
        in_stock: 1
      },
      {
        id: 'prod_jd_orange_child',
        name: 'JD Collection "Child of God" Limited Edition T-Shirt',
        description: 'Kingdom Orange Theme: Vibrant luxury tee with bold black "CHILD OF GOD" chest print incorporating the covenant cross. Reverse highlights Apostle silhouette.',
        price: 34.99,
        currency: 'USD',
        image_url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500&auto=format&fit=crop&q=80',
        category: 'Apparel',
        in_stock: 1
      },
      {
        id: 'prod_jd_green_faith',
        name: 'JD Collection "Step In Faith" 2 Corinthians 5:7 T-Shirt',
        description: 'Emerald Green Theme: Rich emerald green apparel with yellow and white "STEP IN FAITH" graphic and 2 Corinthians 5:7 scripture.',
        price: 34.99,
        currency: 'USD',
        image_url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&auto=format&fit=crop&q=80',
        category: 'Apparel',
        in_stock: 1
      },
      {
        id: 'prod_jd_pink_finished',
        name: 'JD Collection "It Is Finished" John 19:28-30 T-Shirt',
        description: 'Hot Pink Theme: Distressed vertical Calvary cross and bold "IT IS FINISHED" lettering with John 19:28-30 reference.',
        price: 34.99,
        currency: 'USD',
        image_url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500&auto=format&fit=crop&q=80',
        category: 'Apparel',
        in_stock: 1
      },
      {
        id: 'prod_jd_cream_butgod',
        name: 'JD Collection "There Was No Way But God" Baggy T-Shirt',
        description: 'Vanilla Cream Theme: Off-white luxury streetwear silhouette with dark royal navy script "but God" and "There was no way But God made a way."',
        price: 34.99,
        currency: 'USD',
        image_url: 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=500&auto=format&fit=crop&q=80',
        category: 'Apparel',
        in_stock: 1
      },
      {
        id: 'prod_jd_maroon_construction',
        name: 'JD Collection "Christian Under Construction" T-Shirt',
        description: 'Deep Maroon Theme: Deep burgundy apparel with caution hazard stripe badge reading "I AM A CHRISTIAN UNDER CONSTRUCTION - GOD\'S NOT DONE WITH ME YET! ⚠️".',
        price: 34.99,
        currency: 'USD',
        image_url: 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=500&auto=format&fit=crop&q=80',
        category: 'Apparel',
        in_stock: 1
      },
      {
        id: 'prod_book_apostolic_grace',
        name: 'The Mystery of Apostolic Governance — Book',
        description: 'Comprehensive manual on kingdom order, church administration, and the manifestation of apostolic power by Apostle Joe Daniels.',
        price: 15.00,
        currency: 'USD',
        image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80',
        category: 'Books',
        in_stock: 1
      }
    ];

    for (const p of products) {
      db.runSync(
        `INSERT OR IGNORE INTO products (id, name, description, price, currency, image_url, category, in_stock, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        p.id, p.name, p.description, p.price, p.currency, p.image_url, p.category, p.in_stock, now
      );
    }
  }

  // 2. Seed Devotionals
  const devotionalCount = db.getFirstSync<{ count: number }>("SELECT COUNT(*) as count FROM content_items WHERE type = 'devotional'")?.count || 0;
  if (devotionalCount === 0) {
    const devotionals = [
      {
        id: 'dev_today',
        type: 'devotional',
        title: 'Divine Remembrance: God Has Not Forgotten You',
        body: 'Beloved, when delay seems prolonged, the enemy whispers that heaven is silent. But God says your name is engraved upon His palms. Every prayer you prayed over your family, your health, and your career in Zimbabwe or across the nations is before the altar of incense. Today, step out with high expectation!\n\nScripture: Isaiah 49:15-16\n"See, I have engraved you on the palms of my hands; your walls are continually before me."\n\nPrayer: Heavenly Father, I thank You that You are mindful of me. I rebuke every spirit of discouragement. Your promises over my destiny are YES and AMEN in Christ Jesus.\n\nDeclaration: I declare that this day marks the beginning of unusual favor, open doors, and restored peace in Jesus name!',
        metadata: JSON.stringify({
          speaker: 'Apostle Joe Daniels',
          scripture: 'Isaiah 49:15-16',
          date: 'Today'
        })
      },
      {
        id: 'dev_yesterday',
        type: 'devotional',
        title: 'The Atmosphere of Gratitude',
        body: 'Gratitude is not a reaction to good news; it is the generator of supernatural victory. Praise God in the hallway before the door opens. When Paul and Silas prayed and sang praises at midnight in prison, the foundations shook and every chain was loosed.\n\nScripture: 1 Thessalonians 5:18\n"In everything give thanks; for this is the will of God in Christ Jesus for you."\n\nPrayer: Lord, I choose thanksgiving over anxiety today. Fill my heart with songs of deliverance.\n\nDeclaration: My praise confuses the enemy and unlocks my breakthrough!',
        metadata: JSON.stringify({
          speaker: 'Apostle Joe Daniels',
          scripture: '1 Thessalonians 5:18',
          date: 'Yesterday'
        })
      }
    ];

    for (const d of devotionals) {
      db.runSync(
        `INSERT OR IGNORE INTO content_items (id, type, title, body, metadata, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        d.id, d.type, d.title, d.body, d.metadata, now, now
      );
    }
  }

  // 3. Seed Sermons
  const sermonCount = db.getFirstSync<{ count: number }>("SELECT COUNT(*) as count FROM content_items WHERE type = 'sermon'")?.count || 0;
  if (sermonCount === 0) {
    const sermons = [
      {
        id: 'sermon_church_politics',
        type: 'sermon',
        title: 'Church & Politics (Controversial Issues)',
        body: 'Apostle Joe Daniels unpacks controversial issues regarding church, state, and kingdom governance with apostolic depth. Believers are called to be salt and light in every sector of society.',
        metadata: JSON.stringify({
          speaker: 'Apostle Joe Daniels',
          series: 'Apostolic Word',
          duration: '42m',
          youtube_id: '-CibsaxijIk',
          thumbnail_url: 'https://img.youtube.com/vi/-CibsaxijIk/hqdefault.jpg'
        })
      },
      {
        id: 'sermon_1',
        type: 'sermon',
        title: 'Bring Change From Within',
        body: 'Powerful apostolic message by Apostle Joe Daniels on spiritual authority, internal transformation, and the power of kingdom mind renewal.',
        metadata: JSON.stringify({
          speaker: 'Apostle Joe Daniels',
          series: 'Apostolic Revelations',
          duration: '35m',
          youtube_id: 'upeY03DKvTo',
          thumbnail_url: 'https://img.youtube.com/vi/upeY03DKvTo/hqdefault.jpg'
        })
      },
      {
        id: 'sermon_2',
        type: 'sermon',
        title: 'God Changes Your Circle Before He Changes Your Life',
        body: 'Walk with those who carry your future. Divine relationships and covenant circles determine your spiritual altitude and kingdom acceleration.',
        metadata: JSON.stringify({
          speaker: 'Apostle Joe Daniels',
          series: 'Divine Wisdom',
          duration: '48m',
          youtube_id: 'Im5BmoPwSHI',
          thumbnail_url: 'https://img.youtube.com/vi/Im5BmoPwSHI/hqdefault.jpg'
        })
      },
      {
        id: 'sermon_4',
        type: 'sermon',
        title: 'Varume Izvi Ndizvinoda Vakadzi Vedu',
        body: 'Biblical marital wisdom, love, mutual honor, and kingdom foundation for couples and families.',
        metadata: JSON.stringify({
          speaker: 'Apostle Joe Daniels',
          series: 'Family & Marriage',
          duration: '28m',
          youtube_id: 'iaHCBW8XDGU',
          thumbnail_url: 'https://img.youtube.com/vi/iaHCBW8XDGU/hqdefault.jpg'
        })
      },
      {
        id: 'sermon_5',
        type: 'sermon',
        title: 'Mwari Ngaakubvisirewo Nhamo Inokutadzisa',
        body: 'Deliverance decree breaking ancestral hardship, poverty cycles, and spiritual stagnation in the name of Jesus Christ.',
        metadata: JSON.stringify({
          speaker: 'Apostle Joe Daniels',
          series: 'Deliverance & Freedom',
          duration: '52m',
          youtube_id: '6STJ8Hv4RE8',
          thumbnail_url: 'https://img.youtube.com/vi/6STJ8Hv4RE8/hqdefault.jpg'
        })
      },
      {
        id: 'sermon_masterclass_1',
        type: 'sermon',
        title: 'Apostolic Masterclass: The Mystery of Kingdom Wealth & Acceleration',
        body: 'Advanced kingdom financial dominion, altar covenants, and supernatural acceleration for ministers and marketplace leaders.',
        metadata: JSON.stringify({
          speaker: 'Apostle Joe Daniels',
          series: 'Apostolic Masterclass',
          duration: '1h 15m',
          youtube_id: '-CibsaxijIk',
          thumbnail_url: 'https://img.youtube.com/vi/-CibsaxijIk/hqdefault.jpg',
          is_paid: true,
          price_usd: 30
        })
      },
      {
        id: 'sermon_mentorship_1',
        type: 'sermon',
        title: 'International School of Mentorship: Prophetic Governance & Spiritual Warfare',
        body: 'Intensive discipleship module on high-level spiritual warfare, territorial gates, and kingdom alignment across the nations.',
        metadata: JSON.stringify({
          speaker: 'Apostle Joe Daniels',
          series: 'Mentorship Academy',
          duration: '1h 04m',
          youtube_id: 'upeY03DKvTo',
          thumbnail_url: 'https://img.youtube.com/vi/upeY03DKvTo/hqdefault.jpg',
          is_paid: true,
          price_usd: 50
        })
      }
    ];

    for (const s of sermons) {
      db.runSync(
        `INSERT OR IGNORE INTO content_items (id, type, title, body, metadata, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        s.id, s.type, s.title, s.body, s.metadata, now, now
      );
    }
  }

  // 4. Seed Fellowship Groups (4 Free + 2 Paid from Web App)
  const groupCount = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM groups')?.count || 0;
  if (groupCount === 0) {
    const groups = [
      {
        id: 'group_ignite_worship',
        name: 'Ignite Worship Team',
        description: 'About worship and awakening the consciousness of God. Connects people together in atmospheric praise.',
        location: 'Sanctuary & Online (Fridays @ 6:00 PM CAT)'
      },
      {
        id: 'group_pride_of_lions',
        name: 'Pride Of Lions (Men of Valor)',
        description: "Men's Worship team & ministry where men are groomed and trained in the way of God to be godly husbands, fathers, and leaders.",
        location: 'Belvedere Hub & Virtual (Saturdays @ 7:00 AM CAT)'
      },
      {
        id: 'group_passion_ladies',
        name: 'Passion Ladies Ministry',
        description: 'Women of prayer, prophetic empowerment, family building, and virtuous grace led by Prophetess Melinda Daniels.',
        location: 'Gateway Center & Virtual'
      },
      {
        id: 'group_gymstars_foundation',
        name: 'Gymstars Foundation',
        description: 'Foundation for youth and juniors where we groom and teach the youth to find God at an early age, build character, and excel.',
        location: 'Youth Arena & Harare West (Saturdays @ 2:00 PM CAT)'
      },
      {
        id: 'group_foundation_school',
        name: 'Foundation School (Paid Covenant Pass)',
        description: 'Enroll to learn about Christ, discipleship, spiritual foundation, and how to mature in the Kingdom. ($150 / 3 Months)',
        location: 'Apostolic Academy & Online Portal'
      },
      {
        id: 'group_international_school_of_mentorship',
        name: 'International School of Mentorship (Paid)',
        description: 'Intensive apostolic mentorship, prophetic impartation, and global kingdom leadership academy. ($150 / 3 Months)',
        location: 'Global Apostolic Portal'
      }
    ];

    for (const g of groups) {
      db.runSync(
        `INSERT OR IGNORE INTO groups (id, name, description, location, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        g.id, g.name, g.description, g.location, now
      );
    }
  }

  // 5. Seed Events
  const eventCount = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM events')?.count || 0;
  if (eventCount === 0) {
    const events = [
      {
        id: 'evt_sunday',
        title: 'Sunday Glorious Service',
        event_date: 'Every Sunday',
        event_time: '08:00 - 13:00 CAT',
        location: 'Fantasyland Cinema Number 3 / Samora Machel Ave West, Harare',
        description: 'Atmospheric praise, explosive apostolic revelations, prophetic ministry, and communion with Apostle Joe Daniels.',
        category: 'Sunday Service'
      },
      {
        id: 'evt_wednesday',
        title: 'Wednesday Midweek Dominion Service',
        event_date: 'Every Wednesday',
        event_time: '17:00 - 20:00 CAT',
        location: 'Fantasyland Cinema Number 3 / Samora Machel Ave West, Harare',
        description: 'Deep scriptural study, targeted intercessory warfare, prophetic alignment, and spiritual deliverance.',
        category: 'Wednesday Service'
      },
      {
        id: 'evt_seminar',
        title: 'Pastors and Leaders Apostolic Seminar',
        event_date: 'Upcoming Saturday',
        event_time: '13:00 - 17:00 CAT',
        location: 'Chitungwiza Center',
        description: 'Apostolic impartation, church leadership governance, ministerial ethics, and pastoral acceleration with Apostle Joe Daniels.',
        category: 'Seminar'
      }
    ];

    for (const e of events) {
      db.runSync(
        `INSERT OR IGNORE INTO events (id, title, event_date, event_time, location, description, banner_url, category, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        e.id, e.title, e.event_date, e.event_time, e.location, e.description, '', e.category, now
      );
    }
  }

  // 6. Seed Testimonies
  const testimonyCount = db.getFirstSync<{ count: number }>("SELECT COUNT(*) as count FROM content_items WHERE type = 'post'")?.count || 0;
  if (testimonyCount === 0) {
    const testimonies = [
      {
        id: 'test_1',
        type: 'post',
        title: 'Miraculous Healing from Tumor',
        body: 'Praise the Lord saints! After Apostle Joe Daniels laid hands and decreed healing during Sunday service, the doctors in Bulawayo ran confirmatory tests before surgery and the tumor was completely gone! Jesus is alive!',
        metadata: JSON.stringify({
          author: 'Sister Chiedza M.',
          likes: 24,
          category: 'Healing'
        })
      },
      {
        id: 'test_2',
        type: 'post',
        title: 'Supernatural Debt Cancellation & Job Breakthrough',
        body: 'I stood on the altar word of covenant wealth and within 2 weeks received an international employment offer with double my expected salary! Give glory to God!',
        metadata: JSON.stringify({
          author: 'Brother Tinashe C.',
          likes: 19,
          category: 'Financial Miracle'
        })
      }
    ];

    for (const t of testimonies) {
      db.runSync(
        `INSERT OR IGNORE INTO content_items (id, type, title, body, metadata, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        t.id, t.type, t.title, t.body, t.metadata, now, now
      );
    }
  }

  // 7. Seed Store Products (Joe Daniels Collection & Books in sync with web app)
  const products = [
    {
      id: 'prod_jd_white_heaven',
      name: 'JD Collection "Make Heaven Crowded" Velvet Print T-Shirt',
      description: 'White Theme: 100% premium soft cotton t-shirt with signature black suede velvet print "MAKE HEAVEN CROWDED" across the chest. Reverse showcases Apostle Joe Daniels silhouette, QR connection hub, and "SPIRIT. LOVE. GRACE" manifesto.',
      price: 34.99,
      currency: 'USD',
      category: 'Kingdom Apparel',
      image_url: 'https://gatewayconnect.joedaniels.org/assets/store/jd_white_heaven.jpg',
    },
    {
      id: 'prod_jd_orange_child',
      name: 'JD Collection "Child of God" Limited Edition T-Shirt',
      description: 'Kingdom Orange Theme: Vibrant high-voltage orange luxury tee with bold black "CHILD OF GOD" chest print incorporating the covenant cross inside the H.',
      price: 34.99,
      currency: 'USD',
      category: 'Kingdom Apparel',
      image_url: 'https://gatewayconnect.joedaniels.org/assets/store/jd_orange_child.jpg',
    },
    {
      id: 'prod_jd_green_faith',
      name: 'JD Collection "Step In Faith" 2 Corinthians 5:7 T-Shirt',
      description: 'Emerald Green Theme: Rich emerald green unisex apparel with yellow and white "STEP IN FAITH" chest graphic, iconic retro sneaker motif, and "2 CORINTHIANS 5:7".',
      price: 34.99,
      currency: 'USD',
      category: 'Kingdom Apparel',
      image_url: 'https://gatewayconnect.joedaniels.org/assets/store/jd_green_faith.jpg',
    },
    {
      id: 'prod_jd_pink_finished',
      name: 'JD Collection "It Is Finished" John 19:28-30 T-Shirt',
      description: 'Hot Pink Theme: High-energy magenta streetwear release featuring distressed vertical Calvary cross and bold "IT IS FINISHED" lettering with John 19:28-30 reference.',
      price: 34.99,
      currency: 'USD',
      category: 'Kingdom Apparel',
      image_url: 'https://gatewayconnect.joedaniels.org/assets/store/jd_pink_finished.jpg',
    },
    {
      id: 'prod_jd_cream_butgod',
      name: 'JD Collection "There Was No Way But God" Baggy T-Shirt',
      description: 'Vanilla Cream Theme: Off-white luxury streetwear silhouette with dark royal blue brush script "but God" and prophetic subtitle "There was no way But God made a way."',
      price: 34.99,
      currency: 'USD',
      category: 'Kingdom Apparel',
      image_url: 'https://gatewayconnect.joedaniels.org/assets/store/jd_cream_butgod.jpg',
    },
    {
      id: 'prod_jd_maroon_construction',
      name: 'JD Collection "Christian Under Construction" T-Shirt',
      description: 'Deep Maroon Theme: Deep burgundy apparel with caution hazard stripe badge reading "I AM A CHRISTIAN UNDER CONSTRUCTION - GOD\'S NOT DONE WITH ME YET! ⚠️".',
      price: 34.99,
      currency: 'USD',
      category: 'Kingdom Apparel',
      image_url: 'https://gatewayconnect.joedaniels.org/assets/store/jd_maroon_construction.jpg',
    },
    {
      id: 'prod_book_covenant_wealth',
      name: 'The Mystery of Covenant Wealth',
      description: 'Foundational apostolic handbook unlocking financial dominion, divine favor, and kingdom prosperity principles through covenant fidelity.',
      price: 15.00,
      currency: 'USD',
      category: 'Books & Manuals',
      image_url: 'https://gatewayconnect.joedaniels.org/assets/store/jd_white_heaven.jpg',
    },
    {
      id: 'prod_book_supernatural_dominion',
      name: 'Supernatural Dominion & Apostolic Authority',
      description: 'Step into unprecedented spiritual authority. A comprehensive guide to walking in kingdom dominion and territorial impact.',
      price: 18.00,
      currency: 'USD',
      category: 'Books & Manuals',
      image_url: 'https://gatewayconnect.joedaniels.org/assets/store/jd_green_faith.jpg',
    },
  ];

  for (const p of products) {
    db.runSync(
      `INSERT OR REPLACE INTO products (id, name, description, price, currency, image_url, category, in_stock, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      p.id, p.name, p.description, p.price, p.currency, p.image_url, p.category, now
    );
  }
}
