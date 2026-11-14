/** One instruction at a time for a fixed, student-paced science park tour. */
export const parkStops = [
  {
    key: 'entrance',
    name: '公園入口',
    shortName: '入口',
    icon: 'leaf',
    intro: '一起認識花、樹和草。',
    title: '歡迎來到科學小公園',
    description: '按「開始遊覽」，一起出發。',
    voice: '歡迎來到科學小公園。按開始遊覽，我們會一起看看花、樹和草，再觀察植物怎樣長大。',
    fact: '公園裏有不同的植物。',
    task: null
  },
  {
    key: 'flower',
    name: '繽紛花圃',
    shortName: '花圃',
    icon: 'flower',
    intro: '第一站，看看小花。',
    title: '認識開花植物',
    description: '點一下植物的部位。',
    voice: '第一站，花圃。這是一棵開花植物。點一下植物的部位，看看花瓣、葉和莖。',
    fact: '這棵開花植物有根、莖、葉和花。',
    task: {
      prompt: '請找一找花瓣。',
      options: [
        { key: 'flower.petals', label: '花瓣' },
        { key: 'flower.leaf', label: '葉' },
        { key: 'flower.stem', label: '莖' }
      ],
      answer: 'flower.petals',
      success: '找到了！這是花瓣。',
      hint: '再看看花朵周圍的花瓣。'
    }
  },
  {
    key: 'tree',
    name: '大樹觀察站',
    shortName: '大樹',
    icon: 'tree',
    intro: '第二站，看看大樹。',
    title: '樹也有根、莖和葉',
    description: '旁邊的泥土剖面，讓我們看見根。',
    voice: '第二站，大樹。樹幹是樹的莖。點一下樹的部位。旁邊的泥土剖面，讓我們看見通常藏在地下的根。',
    fact: '樹幹是樹木的莖，支撐着樹枝和葉。',
    task: {
      prompt: '請找一找樹幹。',
      options: [
        { key: 'tree.leaf', label: '樹葉' },
        { key: 'tree.trunk', label: '樹幹' },
        { key: 'tree.root', label: '根' }
      ],
      answer: 'tree.trunk',
      success: '找到了！樹幹是樹木的莖。',
      hint: '找找中間粗粗的樹幹。'
    }
  },
  {
    key: 'grass',
    name: '草地探索區',
    shortName: '草地',
    icon: 'grass',
    intro: '第三站，看看小草。',
    title: '草也是植物',
    description: '點一下草葉，近看小草。',
    voice: '第三站，草地。草也是植物。點一下草葉，看看它的形狀。',
    fact: '這叢草的葉子細細長長。',
    task: {
      prompt: '哪一個是植物？',
      options: [
        { key: 'stone', label: '石頭' },
        { key: 'grass.leaf', label: '草' },
        { key: 'bench', label: '長椅' }
      ],
      answer: 'grass.leaf',
      success: '答對了！草也是植物。',
      hint: '找找有綠色葉子的小草。'
    }
  },
  {
    key: 'growth',
    name: '小苗成長園',
    shortName: '育苗區',
    icon: 'sprout',
    intro: '第四站，看看小花怎樣長大。',
    title: '小花怎樣長大？',
    description: '按「下一個階段」，看看變化。',
    voice: '第四站，小花怎樣長大。按下一個階段，從種子開始，看看發芽、小苗、植株長大和開花。這是生長示意，真正生長需要較長時間。',
    fact: '這棵小花先由種子開始生長。',
    task: {
      prompt: '哪個階段先出現？',
      options: [
        { key: 'seed', label: '種子' },
        { key: 'flowering', label: '開花' },
        { key: 'toy', label: '玩具' }
      ],
      answer: 'seed',
      success: '答對了！這棵小花先由種子開始生長。',
      hint: '再看看第一個階段：種子。'
    }
  },
  {
    key: 'conditions',
    name: '植物照顧區',
    shortName: '生長需要',
    icon: 'sun',
    intro: '第五站，認識植物的生長需要。',
    title: '植物長大需要甚麼？',
    description: '點一下陽光、水分或空氣。',
    voice: '第五站，植物長大需要甚麼。點一下陽光、水分或空氣，認識它們的作用。也可以幫植物澆水，適量就好。',
    fact: '小苗長大，需要適當的光、水和空氣。',
    task: {
      prompt: '植物生長需要哪一樣？',
      options: [
        { key: 'toy', label: '玩具' },
        { key: 'candy', label: '糖果' },
        { key: 'water', label: '水分' }
      ],
      answer: 'water',
      success: '答對了！植物需要適量水分，也需要陽光和空氣。',
      hint: '想一想：我們會用甚麼幫植物澆水？'
    }
  }
];

/** One example flowering plant; these are observations, not a universal lifecycle. */
export const growthStages = [
  {
    key: 'seed',
    name: '種子',
    description: '合適條件下，種子可以長成小苗。',
    voice: '第一步，種子。合適條件下，這粒種子可以長成小苗。'
  },
  {
    key: 'germinating',
    name: '發芽',
    description: '種子吸收水分，小根開始長出。',
    voice: '第二步，發芽。種子吸收水分，小根開始長出。發芽也需要空氣和合適溫度。'
  },
  {
    key: 'seedling',
    name: '小苗',
    description: '小苗長出莖和葉。',
    voice: '第三步，小苗。小苗長出莖和葉，需要適當的光、水和空氣。'
  },
  {
    key: 'mature',
    name: '植株長大',
    description: '根、莖和葉慢慢長大。',
    voice: '第四步，植株長大。根、莖和葉慢慢長大。'
  },
  {
    key: 'flowering',
    name: '開花',
    description: '這棵植物長出花朵。',
    voice: '第五步，開花。這棵植物長出花朵。這個示意用了很短的時間，真正生長需要較長時間。'
  }
];

export const plantConditions = [
  {
    key: 'sun',
    name: '陽光',
    description: '綠葉利用光，製造生長所需的食物。',
    voice: '陽光。綠葉利用光，製造生長所需的食物。不同植物需要的光照並不一樣。'
  },
  {
    key: 'water',
    name: '水分',
    description: '植物需要適量的水。',
    voice: '水分。植物需要適量的水。水太多或太少，都可能影響生長。'
  },
  {
    key: 'air',
    name: '空氣',
    description: '植物也需要空氣。',
    voice: '空氣。植物也需要空氣，幫助呼吸和生長。'
  }
];

export const partFacts = {
  'flower.petals': {
    name: '花瓣',
    text: '花瓣是花的一部分。',
    voice: '這是花瓣。花瓣是花的一部分。'
  },
  'flower.leaf': {
    name: '葉',
    text: '綠葉利用光，製造生長所需的食物。',
    voice: '這是葉。綠葉利用光，製造生長所需的食物。'
  },
  'flower.stem': {
    name: '莖',
    text: '莖支撐植物，也會輸送水分。',
    voice: '這是莖。莖支撐植物，也會輸送水分。'
  },
  'tree.leaf': {
    name: '樹葉',
    text: '樹葉利用光，製造生長所需的食物。',
    voice: '這是樹葉。樹葉利用光，製造生長所需的食物。'
  },
  'tree.trunk': {
    name: '樹幹',
    text: '樹幹是樹的莖，支撐樹枝和葉。',
    voice: '這是樹幹。樹幹是樹的莖，支撐樹枝和葉。'
  },
  'tree.root': {
    name: '根',
    text: '剖面裏的根，會吸收水分和養分。',
    voice: '這是根。這個地下剖面讓我們看見樹根。根會吸收水分和養分，也能固定植物。'
  },
  'grass.leaf': {
    name: '草葉',
    text: '這些細長的草葉，也是植物的葉。',
    voice: '這是草葉。這些細長的草葉，也是植物的葉。草也是植物。'
  }
};

export const teacherScienceNotes = [
  '生長五階段以一棵開花植物為例：種子、發芽、小苗、植株長大、開花；不同植物的形態、速度及生長歷程可以不同，並非所有植物都會開花。',
  '一般種子發芽需要適量水分、氧氣和合適溫度；不同植物的種子對光的需求不同，不宜把陽光說成所有種子發芽的必需條件。',
  '小苗長大需要合適的光、水、空氣、溫度、養分及空間。畫面先聚焦陽光、水分和空氣三項，並不表示植物只有這三項需要。',
  '畫面中的生長、澆水及環境轉換都是概念示意，並非實際生長速度。調整一個條件不會使真實植物立即長大、開花或死亡。',
  '泥土可幫助固定根部，並提供水分和礦物質養分；植物也可在其他合適介質或水耕環境中生長，不宜說所有植物必須有泥土。',
  '大樹旁的泥土剖面是示意，讓學生看見通常被泥土遮蓋的根部。文字説明放在觀察區，避免在模型前擺放牌子。',
  '草也是植物，許多草會開花，只是花朵可能細小或不顯眼。畫面只描述這叢草的葉形，不代表所有草都完全一樣。',
  '「花」是植物的器官；花圃以開花植物作生活中的認識例子，與樹、草作外觀比較，並非把三者當成嚴格的同一層分類。',
  '葉利用光能，把水和二氧化碳製造成糖；根吸收的礦物質養分與葉製造的食物並非相同概念，可按學生程度補充。',
  '澆水應適量；需要量會因植物種類、天氣及介質而變化。澆水後不會立即進入下一個生長階段。',
  '公園按固定次序逐站觀察。每站任務可按學生需要選用，不以答對作為前往下一站的條件。'
];
