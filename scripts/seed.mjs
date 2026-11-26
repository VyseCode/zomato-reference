import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/zomato_ref";
const dbName = new URL(URI).pathname.replace(/^\//, "").split("?")[0];

if (dbName !== "zomato_ref") {
  throw new Error(
    `Refusing to seed database "${dbName || "(none)"}" — MONGODB_URI must point at zomato_ref`,
  );
}

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true },
    password: { type: String, select: false },
    roles: { type: [String], enum: ["customer", "partner"], default: ["customer"] },
    phone: String,
    avatarUrl: String,
  },
  { timestamps: true },
);

const restaurantSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    name: String,
    cuisines: [String],
    area: String,
    address: String,
    description: String,
    imageUrl: String,
    etaMinutes: Number,
    deliveryFee: Number,
    minimumOrder: Number,
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
restaurantSchema.index({ name: "text", cuisines: "text", area: "text" });
restaurantSchema.index({ area: 1, isActive: 1, ratingAvg: -1 });

const menuItemSchema = new mongoose.Schema(
  {
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", index: true },
    name: String,
    description: String,
    category: String,
    price: Number,
    isVeg: Boolean,
    isAvailable: { type: Boolean, default: true },
    imageUrl: String,
  },
  { timestamps: true },
);
menuItemSchema.index({ restaurant: 1, name: 1 }, { unique: true });
menuItemSchema.index({ restaurant: 1, category: 1, isAvailable: 1 });

const cartItemSchema = new mongoose.Schema(
  { menuItem: mongoose.Schema.Types.ObjectId, name: String, price: Number, qty: Number, isVeg: Boolean },
  { _id: true },
);
const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", default: null },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true },
);

const addressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    label: String,
    line1: String,
    line2: String,
    city: String,
    pincode: String,
    phone: String,
    isDefault: Boolean,
  },
  { timestamps: true },
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", index: true },
    address: mongoose.Schema.Types.ObjectId,
    addressSnapshot: {
      label: String,
      line1: String,
      line2: String,
      city: String,
      pincode: String,
      phone: String,
    },
    items: [
      { menuItem: mongoose.Schema.Types.ObjectId, name: String, price: Number, qty: Number },
    ],
    subtotal: Number,
    deliveryFee: Number,
    total: Number,
    status: { type: String, default: "placed", index: true },
    timeline: [{ status: String, at: { type: Date, default: Date.now }, note: String }],
    cancelReason: String,
    placedAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: false, updatedAt: true } },
);
orderSchema.index({ user: 1, placedAt: -1 });
orderSchema.index({ restaurant: 1, placedAt: -1 });

const reviewSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", index: true },
    rating: Number,
    text: String,
  },
  { timestamps: true },
);
reviewSchema.index({ restaurant: 1, createdAt: -1 });

const favoriteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
favoriteSchema.index({ user: 1, restaurant: 1 }, { unique: true });

const User = mongoose.model("User", userSchema);
const Restaurant = mongoose.model("Restaurant", restaurantSchema);
const MenuItem = mongoose.model("MenuItem", menuItemSchema);
const Cart = mongoose.model("Cart", cartSchema);
const Address = mongoose.model("Address", addressSchema);
const Order = mongoose.model("Order", orderSchema);
const Review = mongoose.model("Review", reviewSchema);
const Favorite = mongoose.model("Favorite", favoriteSchema);

const people = [
  { email: "priya@example.com", name: "Priya Sharma", roles: ["customer", "partner"], phone: "9876500001" },
  { email: "marcus@example.com", name: "Marcus Lee", roles: ["partner"], phone: "9876500002" },
  { email: "alex@example.com", name: "Alex Morgan", roles: ["customer"], phone: "9876500003" },
  { email: "sofia@example.com", name: "Sofia Rodriguez", roles: ["customer", "partner"], phone: "9876500004" },
  { email: "rahul@example.com", name: "Rahul Verma", roles: ["customer"], phone: "9876500005" },
];

const restaurantSeeds = [
  {
    key: "spice", name: "Spice Route", cuisines: ["North Indian", "Mughlai", "Biryani"],
    area: "Indiranagar", address: "12th Main, Indiranagar, Bengaluru", etaMinutes: 30,
    deliveryFee: 29, minimumOrder: 199, ratingAvg: 4.3, ratingCount: 12, owner: 0,
    description: "Slow-cooked North Indian classics and fragrant biryanis.",
  },
  {
    key: "green", name: "Green Bowl", cuisines: ["Healthy Food", "Salads", "Vegan"],
    area: "Koramangala", address: "80 Feet Road, Koramangala, Bengaluru", etaMinutes: 25,
    deliveryFee: 19, minimumOrder: 149, ratingAvg: 4.6, ratingCount: 24, owner: 0,
    description: "Fresh, wholesome bowls made to order.",
  },
  {
    key: "nonna", name: "Nonna's Kitchen", cuisines: ["Italian", "Pizza", "Pasta"],
    area: "Jayanagar", address: "4th Block, Jayanagar, Bengaluru", etaMinutes: 40,
    deliveryFee: 35, minimumOrder: 249, ratingAvg: 4.2, ratingCount: 31, owner: 1,
    description: "Wood-fired pizza and handmade pasta from scratch.",
  },
  {
    key: "wok", name: "Wok & Roll", cuisines: ["Chinese", "Asian", "Momos"],
    area: "Indiranagar", address: "100 Feet Road, Indiranagar, Bengaluru", etaMinutes: 35,
    deliveryFee: 25, minimumOrder: 199, ratingAvg: 3.9, ratingCount: 8, owner: 1,
    description: "Wok-tossed noodles, dim sum and spicy momos.",
  },
  {
    key: "sunrise", name: "Sunrise Diner", cuisines: ["Breakfast", "Cafe", "Bakery"],
    area: "HSR Layout", address: "27th Main, HSR Layout, Bengaluru", etaMinutes: 20,
    deliveryFee: 15, minimumOrder: 99, ratingAvg: 4.7, ratingCount: 56, owner: 3,
    description: "All-day breakfast, great coffee and fresh bakes.",
  },
  {
    key: "tandoor", name: "Tandoor Express", cuisines: ["Indian", "Kebabs", "Rolls"],
    area: "Whitefield", address: "ITPL Main Road, Whitefield, Bengaluru", etaMinutes: 45,
    deliveryFee: 39, minimumOrder: 299, ratingAvg: 0, ratingCount: 0, owner: 0,
    description: "Charcoal-grilled kebabs and piping hot rolls. New on the platform.",
  },
  {
    key: "burger", name: "Burger Bunker", cuisines: ["Burgers", "Fast Food", "Fries"],
    area: "Koramangala", address: "5th Block, Koramangala, Bengaluru", etaMinutes: 28,
    deliveryFee: 22, minimumOrder: 149, ratingAvg: 4.0, ratingCount: 17, owner: 3,
    description: "Juicy smash burgers and crispy fries.",
  },
  {
    key: "midnight", name: "Midnight Grill", cuisines: ["BBQ", "Grill", "Kebabs"],
    area: "Electronic City", address: "Phase 1, Electronic City, Bengaluru", etaMinutes: 55,
    deliveryFee: 45, minimumOrder: 399, ratingAvg: 3.5, ratingCount: 6, owner: 1,
    isActive: false,
    description: "Late-night grills — currently closed for renovations.",
  },
];

const menuSeeds = {
  spice: [
    ["Chicken Biryani", "Biryani", 289, false, true],
    ["Paneer Butter Masala", "Curries", 249, true, true],
    ["Butter Chicken", "Curries", 329, false, true],
    ["Garlic Naan", "Breads", 59, true, true],
    ["Paneer Tikka", "Starters", 219, true, false],
    ["Gulab Jamun", "Desserts", 99, true, true],
  ],
  green: [
    ["Quinoa Power Bowl", "Bowls", 299, true, true],
    ["Grilled Chicken Salad", "Bowls", 329, false, true],
    ["Avocado Toast", "Breakfast", 219, true, true],
    ["Detox Smoothie", "Drinks", 179, true, false],
    ["Vegan Wrap", "Wraps", 249, true, true],
  ],
  nonna: [
    ["Margherita Pizza", "Pizza", 349, true, true],
    ["Pepperoni Pizza", "Pizza", 429, false, true],
    ["Alfredo Pasta", "Pasta", 319, true, true],
    ["Garlic Bread", "Starters", 129, true, true],
    ["Tiramisu", "Desserts", 189, true, true],
  ],
  wok: [
    ["Chilli Chicken", "Starters", 279, false, true],
    ["Veg Hakka Noodles", "Noodles", 219, true, true],
    ["Chicken Momos", "Momos", 189, false, true],
    ["Veg Momos", "Momos", 169, true, true],
    ["Szechuan Sauce", "Extras", 39, true, false],
  ],
  sunrise: [
    ["Masala Dosa", "Breakfast", 149, true, true],
    ["Egg Sandwich", "Breakfast", 129, false, true],
    ["Cappuccino", "Drinks", 99, true, true],
    ["Blueberry Muffin", "Bakery", 119, true, true],
    ["Pancake Stack", "Breakfast", 179, true, true],
  ],
  tandoor: [
    ["Chicken Tikka", "Kebabs", 319, false, true],
    ["Paneer Tikka Roll", "Rolls", 229, true, true],
    ["Seekh Kebab", "Kebabs", 299, false, true],
    ["Aloo Paratha", "Breads", 149, true, true],
  ],
  burger: [
    ["Classic Smash Burger", "Burgers", 219, false, true],
    ["Veg Cheese Burger", "Burgers", 199, true, true],
    ["Peri Peri Fries", "Sides", 129, true, true],
    ["Chocolate Shake", "Drinks", 149, true, true],
  ],
  midnight: [
    ["BBQ Chicken Platter", "Grills", 499, false, true],
    ["Tandoori Mushroom", "Grills", 349, true, true],
    ["Grilled Paneer", "Grills", 379, true, true],
  ],
};

async function main() {
  await mongoose.connect(URI);
  const db = mongoose.connection.db;
  await db.dropDatabase();

  await Promise.all([
    User.createIndexes(),
    Restaurant.createIndexes(),
    MenuItem.createIndexes(),
    Cart.createIndexes(),
    Address.createIndexes(),
    Order.createIndexes(),
    Review.createIndexes(),
    Favorite.createIndexes(),
  ]);

  const password = await bcrypt.hash("password123", 12);
  const users = await User.create(
    people.map((person) => ({ ...person, password, avatarUrl: "" })),
  );
  const [priya, marcus, alex, sofia, rahul] = users;

  const restaurants = await Restaurant.create(
    restaurantSeeds.map(({ owner, ...rest }) => ({
      ...rest,
      owner: [priya, marcus, alex, sofia, rahul][owner]._id,
      imageUrl: "",
      isActive: rest.isActive ?? true,
    })),
  );
  const byKey = Object.fromEntries(
    restaurants.map((restaurant, index) => [restaurantSeeds[index].key, restaurant]),
  );

  const menuItems = [];
  for (const [key, items] of Object.entries(menuSeeds)) {
    for (const [name, category, price, isVeg, isAvailable] of items) {
      menuItems.push({
        restaurant: byKey[key]._id,
        name,
        description: `${name} — freshly prepared at ${byKey[key].name}.`,
        category,
        price,
        isVeg,
        isAvailable,
        imageUrl: "",
      });
    }
  }
  const menu = await MenuItem.create(menuItems);
  const menuOf = (restaurantKey, itemName) =>
    menu.find(
      (item) =>
        item.restaurant.toString() === byKey[restaurantKey]._id.toString() &&
        item.name === itemName,
    );

  const addresses = await Address.create([
    { user: alex._id, label: "Home", line1: "221 Baker Street", line2: "Apt 4", city: "Bengaluru", pincode: "560001", phone: "9876500003", isDefault: true },
    { user: alex._id, label: "Work", line1: "Tower B, Tech Park", line2: "", city: "Bengaluru", pincode: "560066", phone: "9876500003", isDefault: false },
    { user: sofia._id, label: "Home", line1: "18 Palm Grove", line2: "", city: "Bengaluru", pincode: "560034", phone: "9876500004", isDefault: true },
    { user: rahul._id, label: "Home", line1: "9 Lake View", line2: "", city: "Bengaluru", pincode: "560103", phone: "9876500005", isDefault: true },
    { user: priya._id, label: "Home", line1: "5 Rosewood Lane", line2: "", city: "Bengaluru", pincode: "560038", phone: "9876500001", isDefault: true },
  ]);

  const snapshot = (address) => ({
    label: address.label,
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    pincode: address.pincode,
    phone: address.phone,
  });

  const makeItems = (pairs) =>
    pairs.map(([restaurantKey, itemName, qty]) => {
      const item = menuOf(restaurantKey, itemName);
      return { menuItem: item._id, name: item.name, price: item.price, qty };
    });

  const buildOrder = ({ user, restaurantKey, address, itemPairs, status, steps, reason }) => {
    const items = makeItems(itemPairs);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const deliveryFee = byKey[restaurantKey].deliveryFee;
    return {
      user: user._id,
      restaurant: byKey[restaurantKey]._id,
      address: address._id,
      addressSnapshot: snapshot(address),
      items,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      status,
      cancelReason: reason ?? "",
      timeline: steps.map(([stepStatus, note]) => ({ status: stepStatus, note })),
    };
  };

  const orders = await Order.create([
    buildOrder({
      user: alex, restaurantKey: "spice", address: addresses[0], status: "delivered",
      itemPairs: [["spice", "Chicken Biryani", 1], ["spice", "Garlic Naan", 2]],
      steps: [["placed", "Order placed"], ["confirmed", "Restaurant accepted"], ["preparing", "Kitchen started"], ["out_for_delivery", "Rider picked up"], ["delivered", "Delivered"]],
    }),
    buildOrder({
      user: alex, restaurantKey: "green", address: addresses[0], status: "out_for_delivery",
      itemPairs: [["green", "Quinoa Power Bowl", 1], ["green", "Avocado Toast", 1]],
      steps: [["placed", "Order placed"], ["confirmed", "Restaurant accepted"], ["preparing", "Kitchen started"], ["out_for_delivery", "Rider picked up"]],
    }),
    buildOrder({
      user: sofia, restaurantKey: "nonna", address: addresses[2], status: "preparing",
      itemPairs: [["nonna", "Margherita Pizza", 1], ["nonna", "Garlic Bread", 1]],
      steps: [["placed", "Order placed"], ["confirmed", "Restaurant accepted"], ["preparing", "Kitchen started"]],
    }),
    buildOrder({
      user: rahul, restaurantKey: "wok", address: addresses[3], status: "confirmed",
      itemPairs: [["wok", "Veg Hakka Noodles", 1], ["wok", "Chicken Momos", 1]],
      steps: [["placed", "Order placed"], ["confirmed", "Restaurant accepted"]],
    }),
    buildOrder({
      user: priya, restaurantKey: "sunrise", address: addresses[4], status: "placed",
      itemPairs: [["sunrise", "Masala Dosa", 2]],
      steps: [["placed", "Order placed"]],
    }),
    buildOrder({
      user: rahul, restaurantKey: "burger", address: addresses[3], status: "cancelled",
      itemPairs: [["burger", "Classic Smash Burger", 1]],
      steps: [["placed", "Order placed"], ["cancelled", "Cancelled by customer"]],
      reason: "Changed my mind",
    }),
    buildOrder({
      user: alex, restaurantKey: "tandoor", address: addresses[0], status: "delivered",
      itemPairs: [["tandoor", "Paneer Tikka Roll", 1], ["tandoor", "Aloo Paratha", 1]],
      steps: [["placed", "Order placed"], ["confirmed", "Restaurant accepted"], ["preparing", "Kitchen started"], ["out_for_delivery", "Rider picked up"], ["delivered", "Delivered"]],
    }),
    buildOrder({
      user: sofia, restaurantKey: "spice", address: addresses[2], status: "delivered",
      itemPairs: [["spice", "Butter Chicken", 1], ["spice", "Butter Chicken", 1], ["spice", "Garlic Naan", 1]],
      steps: [["placed", "Order placed"], ["confirmed", "Restaurant accepted"], ["preparing", "Kitchen started"], ["out_for_delivery", "Rider picked up"], ["delivered", "Delivered"]],
    }),
  ]);

  const reviewSeeds = [
    { order: orders[0], user: alex, restaurantKey: "spice", rating: 5, text: "Biryani was aromatic and arrived hot. Excellent!" },
    { order: orders[6], user: alex, restaurantKey: "tandoor", rating: 4, text: "Great rolls, a little late but tasty." },
    { order: orders[7], user: sofia, restaurantKey: "spice", rating: 4, text: "Butter chicken was rich and creamy." },
  ];
  await Review.create(
    reviewSeeds.map(({ order, user, restaurantKey, rating, text }) => ({
      order: order._id,
      user: user._id,
      restaurant: byKey[restaurantKey]._id,
      rating,
      text,
    })),
  );
  for (const { restaurantKey, rating } of reviewSeeds) {
    const restaurant = byKey[restaurantKey];
    await Restaurant.updateOne(
      { _id: restaurant._id },
      {
        $set: {
          ratingAvg:
            Math.round(
              (((restaurant.ratingAvg * restaurant.ratingCount + rating) /
                (restaurant.ratingCount + 1)) * 10),
            ) / 10,
        },
        $inc: { ratingCount: 1 },
      },
    );
  }

  await Cart.create([
    {
      user: alex._id,
      restaurant: byKey.spice._id,
      items: makeItems([["spice", "Chicken Biryani", 1], ["spice", "Garlic Naan", 2]]),
    },
    {
      user: rahul._id,
      restaurant: byKey.green._id,
      items: makeItems([["green", "Avocado Toast", 1]]),
    },
    {
      user: sofia._id,
      restaurant: byKey.sunrise._id,
      items: makeItems([["sunrise", "Cappuccino", 2], ["sunrise", "Blueberry Muffin", 1]]),
    },
    { user: priya._id, restaurant: null, items: [] },
  ]);

  await Favorite.create([
    { user: alex._id, restaurant: byKey.spice._id },
    { user: alex._id, restaurant: byKey.green._id },
    { user: sofia._id, restaurant: byKey.spice._id },
    { user: rahul._id, restaurant: byKey.sunrise._id },
  ]);

  const counts = {
    users: await User.countDocuments(),
    restaurants: await Restaurant.countDocuments(),
    menuItems: await MenuItem.countDocuments(),
    addresses: await Address.countDocuments(),
    carts: await Cart.countDocuments(),
    orders: await Order.countDocuments(),
    reviews: await Review.countDocuments(),
    favorites: await Favorite.countDocuments(),
  };
  console.log("Seeded zomato_ref:", JSON.stringify(counts));
  console.log("Demo accounts (password123): alex@example.com (customer), priya@example.com (partner), marcus@example.com (partner), sofia@example.com (both), rahul@example.com (customer)");
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
