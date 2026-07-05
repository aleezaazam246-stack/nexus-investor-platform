import { Router, Request, Response, NextFunction } from 'express';
import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, Product, Order, Meeting, Document, Transaction, UserRole } from './src/types';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'nexus_super_secret_key_1337';

// ==========================================
// 1. MONGOOSE SCHEMA DEFINITIONS
// ==========================================

const MongooseUserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Investor', 'Entrepreneur'], required: true },
  profile: {
    companyName: String,
    bio: String,
    website: String,
    sector: String,
    stage: String,
    fundingTarget: Number,
    investmentThesis: String,
    preferredStages: [String],
    preferredSectors: [String]
  },
  balance: { type: Number, default: 100000 },
  twoFactorEnabled: { type: Boolean, default: true },
  twoFactorSecret: { type: String, default: '123456' },
  createdAt: { type: Date, default: Date.now }
});

const MongooseProductSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  imageUrl: String,
  category: { type: String, required: true },
  stock: { type: Number, required: true },
  creatorId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const MongooseOrderSchema = new Schema({
  buyerId: { type: String, required: true },
  buyerEmail: { type: String, required: true },
  items: [{
    productId: { type: String, required: true },
    productTitle: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Paid', 'Cancelled'], default: 'Paid' },
  createdAt: { type: Date, default: Date.now }
});

const MongooseMeetingSchema = new Schema({
  title: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  hostId: { type: String, required: true },
  hostName: { type: String, required: true },
  hostEmail: { type: String, required: true },
  guestId: { type: String, required: true },
  guestName: { type: String, required: true },
  guestEmail: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

const MongooseDocumentSchema = new Schema({
  name: { type: String, required: true },
  creatorId: { type: String, required: true },
  creatorName: { type: String, required: true },
  version: { type: Number, default: 1 },
  signatureData: String,
  status: { type: String, enum: ['Pending', 'Signed'], default: 'Pending' },
  signedAt: String,
  createdAt: { type: Date, default: Date.now }
});

const MongooseTransactionSchema = new Schema({
  userId: { type: String, required: true },
  userEmail: { type: String, required: true },
  type: { type: String, enum: ['Deposit', 'Withdraw', 'Transfer'], required: true },
  amount: { type: Number, required: true },
  details: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Completed' },
  recipientId: String,
  recipientName: String,
  createdAt: { type: Date, default: Date.now }
});

// Create Mongoose models conditionally (to avoid overwriting if hot-reloaded) and cast to any
const UserModel = (mongoose.models.User || mongoose.model('User', MongooseUserSchema)) as any;
const ProductModel = (mongoose.models.Product || mongoose.model('Product', MongooseProductSchema)) as any;
const OrderModel = (mongoose.models.Order || mongoose.model('Order', MongooseOrderSchema)) as any;
const MeetingModel = (mongoose.models.Meeting || mongoose.model('Meeting', MongooseMeetingSchema)) as any;
const DocumentModel = (mongoose.models.Document || mongoose.model('Document', MongooseDocumentSchema)) as any;
const TransactionModel = (mongoose.models.Transaction || mongoose.model('Transaction', MongooseTransactionSchema)) as any;

// ==========================================
// 2. IN-MEMORY STABLE FALLBACK DB ENGINE
// ==========================================
// Automatically populates pre-configured beautiful startups, documents, meetings, and users.

let usersMem: User[] = [];
let productsMem: Product[] = [];
let ordersMem: Order[] = [];
let meetingsMem: Meeting[] = [];
let documentsMem: Document[] = [];
let transactionsMem: Transaction[] = [];

// Seed memory database with rich mock data
function seedMemoryDb() {
  const salt = bcrypt.genSaltSync(10);
  const hashedPass = bcrypt.hashSync('password123', salt);

  const ent1: User = {
    id: 'ent-1',
    email: 'alice@nexus.io',
    role: 'Entrepreneur',
    profile: {
      companyName: 'Aether Renewable Fusion',
      bio: 'Pioneering clean helium-3 energy reactors to generate endless low-cost grid electricity.',
      website: 'https://aetherfusion.io',
      sector: 'Energy & Greentech',
      stage: 'Seed',
      fundingTarget: 1500000
    },
    balance: 45000,
    twoFactorEnabled: true,
    twoFactorSecret: '123456',
    createdAt: new Date('2026-01-10').toISOString()
  };

  const ent2: User = {
    id: 'ent-2',
    email: 'bob@nexus.io',
    role: 'Entrepreneur',
    profile: {
      companyName: 'Cortex Neural Prosthetics',
      bio: 'Non-invasive brain-machine hardware restoring motor skills through localized ultrasonic pulses.',
      website: 'https://cortexneuro.io',
      sector: 'Medtech & AI',
      stage: 'Pre-seed',
      fundingTarget: 750000
    },
    balance: 15000,
    twoFactorEnabled: true,
    twoFactorSecret: '123456',
    createdAt: new Date('2026-02-15').toISOString()
  };

  const inv1: User = {
    id: 'inv-1',
    email: 'clara@nexus.io',
    role: 'Investor',
    profile: {
      companyName: 'Genesis Capital Group',
      bio: 'Early-stage hardtech investor with a 15-year history of taking deeptech startups from zero to IPO.',
      website: 'https://genesiscap.io',
      investmentThesis: 'Backing revolutionary physical technology solving global resource limits.',
      preferredStages: ['Pre-seed', 'Seed'],
      preferredSectors: ['Energy & Greentech', 'Medtech & AI', 'Deeptech']
    },
    balance: 850000,
    twoFactorEnabled: true,
    twoFactorSecret: '123456',
    createdAt: new Date('2026-03-01').toISOString()
  };

  usersMem = [ent1, ent2, inv1];

  // Helper dictionary to store credentials for mock login
  (global as any).credentialsStore = (global as any).credentialsStore || {};
  (global as any).credentialsStore['alice@nexus.io'] = hashedPass;
  (global as any).credentialsStore['bob@nexus.io'] = hashedPass;
  (global as any).credentialsStore['clara@nexus.io'] = hashedPass;

  productsMem = [
    {
      id: 'prod-1',
      title: 'Aether Fusion Token A',
      description: 'Investment fractionalized equity block representing 0.1% ownership in Aether Renewable Fusion.',
      price: 5000,
      imageUrl: '',
      category: 'Equity Token',
      stock: 50,
      creatorId: 'ent-1',
      createdAt: new Date('2026-04-01').toISOString()
    },
    {
      id: 'prod-2',
      title: 'Cortex Developer Kit v1',
      description: 'Exclusive hardware access token containing prototype non-invasive neural interface band + SDK.',
      price: 1500,
      imageUrl: '',
      category: 'Hardware Access',
      stock: 10,
      creatorId: 'ent-2',
      createdAt: new Date('2026-04-10').toISOString()
    },
    {
      id: 'prod-3',
      title: 'Aether Consulting License',
      description: 'Corporate pass granting 10 hours of high-temperature plasma fusion feasibility modeling.',
      price: 12000,
      imageUrl: '',
      category: 'Consulting',
      stock: 5,
      creatorId: 'ent-1',
      createdAt: new Date('2026-04-15').toISOString()
    }
  ];

  meetingsMem = [
    {
      id: 'meet-1',
      title: 'Initial Aether Pitch Deck Review',
      date: '2026-07-15',
      time: '14:00',
      hostId: 'ent-1',
      hostName: 'Aether Renewable Fusion',
      hostEmail: 'alice@nexus.io',
      guestId: 'inv-1',
      guestName: 'Genesis Capital Group',
      guestEmail: 'clara@nexus.io',
      status: 'Accepted',
      createdAt: new Date('2026-05-10').toISOString()
    },
    {
      id: 'meet-2',
      title: 'Cortex Ultrasonic Tech Q&A',
      date: '2026-07-20',
      time: '10:00',
      hostId: 'ent-2',
      hostName: 'Cortex Neural Prosthetics',
      hostEmail: 'bob@nexus.io',
      guestId: 'inv-1',
      guestName: 'Genesis Capital Group',
      guestEmail: 'clara@nexus.io',
      status: 'Pending',
      createdAt: new Date('2026-05-12').toISOString()
    }
  ];

  documentsMem = [
    {
      id: 'doc-1',
      name: 'Aether Fusion Convertible Note Term Sheet.pdf',
      creatorId: 'ent-1',
      creatorName: 'Aether Renewable Fusion',
      version: 1,
      status: 'Pending',
      createdAt: new Date('2026-05-01').toISOString()
    },
    {
      id: 'doc-2',
      name: 'Cortex Mutual Non-Disclosure Agreement.pdf',
      creatorId: 'ent-2',
      creatorName: 'Cortex Neural Prosthetics',
      version: 1,
      status: 'Pending',
      createdAt: new Date('2026-05-05').toISOString()
    }
  ];

  transactionsMem = [
    {
      id: 'tx-1',
      userId: 'inv-1',
      userEmail: 'clara@nexus.io',
      type: 'Deposit',
      amount: 1000000,
      details: 'Wire Deposit from external banking account (Stripe Sandbox)',
      status: 'Completed',
      createdAt: new Date('2026-03-02').toISOString()
    },
    {
      id: 'tx-2',
      userId: 'inv-1',
      userEmail: 'clara@nexus.io',
      type: 'Transfer',
      amount: 150000,
      details: 'Seed Allocation Round for Aether Fusion',
      status: 'Completed',
      recipientId: 'ent-1',
      recipientName: 'Aether Renewable Fusion',
      createdAt: new Date('2026-04-05').toISOString()
    }
  ];
}

// Seed upon module initialization
seedMemoryDb();

// Is Mongo connected? Helper
const isMongoConnected = () => mongoose.connection.readyState === 1;

// ==========================================
// 3. MIDDLEWARES
// ==========================================

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }
    req.user = decoded as { id: string; email: string; role: UserRole };
    next();
  });
}

// ==========================================
// 4. API ENDPOINTS - AUTH
// ==========================================

// Auth: Sign Up
router.post('/auth/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, role, profile } = req.body;

    if (!email || !password || !role) {
      res.status(400).json({ error: 'Email, password, and role are required' });
      return;
    }

    // Check duplicate
    let existingUser = null;
    if (isMongoConnected()) {
      existingUser = await UserModel.findOne({ email });
    } else {
      existingUser = usersMem.find(u => u.email.toLowerCase() === email.toLowerCase());
    }

    if (existingUser) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const newUserObj = {
      email,
      role: role as UserRole,
      profile: profile || {},
      balance: role === 'Investor' ? 500000 : 10000, // Starter funds
      twoFactorEnabled: true,
      twoFactorSecret: '123456' // Static OTP for mock 2FA
    };

    let userCreated: User;

    if (isMongoConnected()) {
      const dbUser = new UserModel({
        ...newUserObj,
        password: hashedPassword
      });
      const saved = await dbUser.save();
      userCreated = {
        id: saved._id.toString(),
        email: saved.email,
        role: saved.role as UserRole,
        profile: saved.profile || {},
        balance: saved.balance,
        twoFactorEnabled: saved.twoFactorEnabled,
        createdAt: saved.createdAt.toISOString()
      };
    } else {
      const generatedId = `user-${Date.now()}`;
      userCreated = {
        id: generatedId,
        ...newUserObj,
        createdAt: new Date().toISOString()
      };
      usersMem.push(userCreated);
      (global as any).credentialsStore = (global as any).credentialsStore || {};
      (global as any).credentialsStore[email.toLowerCase()] = hashedPassword;
    }

    // Auth flows with Mock 2FA:
    // Generate an OTP and token
    const tempToken = jwt.sign(
      { id: userCreated.id, email: userCreated.email, role: userCreated.role, isTemp: true },
      JWT_SECRET,
      { expiresIn: '10m' }
    );

    res.status(201).json({
      message: 'Account created. Please verify 2FA to complete registration.',
      require2FA: true,
      tempToken,
      debugOtp: '123456' // Exposing mock code for direct UX sandbox entry
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Auth: Login
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    let user: any = null;
    let storedHashedPassword = '';

    if (isMongoConnected()) {
      user = await UserModel.findOne({ email });
      if (user) {
        storedHashedPassword = user.password;
      }
    } else {
      user = usersMem.find(u => u.email.toLowerCase() === email.toLowerCase());
      storedHashedPassword = (global as any).credentialsStore?.[email.toLowerCase()] || '';
    }

    if (!user || !storedHashedPassword) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const match = bcrypt.compareSync(password, storedHashedPassword);
    if (!match) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const userId = isMongoConnected() ? user._id.toString() : user.id;

    if (user.twoFactorEnabled) {
      const tempToken = jwt.sign(
        { id: userId, email: user.email, role: user.role, isTemp: true },
        JWT_SECRET,
        { expiresIn: '10m' }
      );

      res.json({
        message: 'Password correct. Please provide your 2FA OTP.',
        require2FA: true,
        tempToken,
        debugOtp: user.twoFactorSecret || '123456'
      });
    } else {
      const token = jwt.sign(
        { id: userId, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: {
          id: userId,
          email: user.email,
          role: user.role,
          profile: user.profile,
          balance: user.balance,
          twoFactorEnabled: user.twoFactorEnabled,
          createdAt: user.createdAt
        }
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Auth: Verify 2FA
router.post('/auth/verify-2fa', async (req: Request, res: Response) => {
  try {
    const { code, tempToken } = req.body;

    if (!code || !tempToken) {
      res.status(400).json({ error: 'Verification OTP and session tempToken are required' });
      return;
    }

    let decoded: any;
    try {
      decoded = jwt.verify(tempToken, JWT_SECRET);
    } catch {
      res.status(403).json({ error: 'Session expired or invalid token' });
      return;
    }

    if (!decoded.isTemp) {
      res.status(400).json({ error: 'Invalid authentication flow state' });
      return;
    }

    let user: any = null;
    if (isMongoConnected()) {
      user = await UserModel.findById(decoded.id);
    } else {
      user = usersMem.find(u => u.id === decoded.id);
    }

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Compare mock OTP (default 123456)
    const expectedOtp = user.twoFactorSecret || '123456';
    if (code !== expectedOtp) {
      res.status(400).json({ error: 'Invalid 2FA code. Hint: Use 123456' });
      return;
    }

    const userId = isMongoConnected() ? user._id.toString() : user.id;

    // Issue permanent auth token
    const token = jwt.sign(
      { id: userId, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: userId,
        email: user.email,
        role: user.role,
        profile: user.profile,
        balance: user.balance,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: user.createdAt
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 5. API ENDPOINTS - E-COMMERCE (STARTUP CATALOG)
// ==========================================

// Get all products / startup assets
router.get('/products', async (req: Request, res: Response) => {
  try {
    if (isMongoConnected()) {
      const dbProducts = await ProductModel.find({});
      res.json(dbProducts);
    } else {
      res.json(productsMem);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create product (Entrepreneur catalog addition)
router.post('/products', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, price, imageUrl, category, stock } = req.body;
    const creatorId = req.user?.id || '';

    if (!title || !description || price === undefined || !category || stock === undefined) {
      res.status(400).json({ error: 'All product details are required' });
      return;
    }

    const newProdObj = {
      title,
      description,
      price: Number(price),
      imageUrl: imageUrl || '',
      category,
      stock: Number(stock),
      creatorId
    };

    let productCreated;
    if (isMongoConnected()) {
      const dbProduct = new ProductModel(newProdObj);
      productCreated = await dbProduct.save();
    } else {
      productCreated = {
        id: `prod-${Date.now()}`,
        ...newProdObj,
        createdAt: new Date().toISOString()
      };
      productsMem.push(productCreated);
    }

    res.status(201).json(productCreated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update product
router.put('/products/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, price, imageUrl, category, stock } = req.body;
    const { id } = req.params;

    if (isMongoConnected()) {
      const p = await ProductModel.findById(id);
      if (!p) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      if (p.creatorId !== req.user?.id) {
        res.status(403).json({ error: 'Not authorized to modify this listing' });
        return;
      }
      p.title = title || p.title;
      p.description = description || p.description;
      p.price = price !== undefined ? Number(price) : p.price;
      p.imageUrl = imageUrl || p.imageUrl;
      p.category = category || p.category;
      p.stock = stock !== undefined ? Number(stock) : p.stock;
      const updated = await p.save();
      res.json(updated);
    } else {
      const pIndex = productsMem.findIndex(p => p.id === id);
      if (pIndex === -1) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      if (productsMem[pIndex].creatorId !== req.user?.id) {
        res.status(403).json({ error: 'Not authorized to modify this listing' });
        return;
      }
      productsMem[pIndex] = {
        ...productsMem[pIndex],
        title: title || productsMem[pIndex].title,
        description: description || productsMem[pIndex].description,
        price: price !== undefined ? Number(price) : productsMem[pIndex].price,
        imageUrl: imageUrl || productsMem[pIndex].imageUrl,
        category: category || productsMem[pIndex].category,
        stock: stock !== undefined ? Number(stock) : productsMem[pIndex].stock
      };
      res.json(productsMem[pIndex]);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete product
router.delete('/products/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (isMongoConnected()) {
      const p = await ProductModel.findById(id);
      if (!p) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      if (p.creatorId !== req.user?.id) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }
      await ProductModel.findByIdAndDelete(id);
      res.json({ message: 'Product deleted' });
    } else {
      const pIndex = productsMem.findIndex(p => p.id === id);
      if (pIndex === -1) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      if (productsMem[pIndex].creatorId !== req.user?.id) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }
      productsMem.splice(pIndex, 1);
      res.json({ message: 'Product deleted' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create Order (Investment checkout / purchase)
router.post('/orders', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { items, totalAmount } = req.body;
    const buyerId = req.user?.id || '';
    const buyerEmail = req.user?.email || '';

    if (!items || !items.length || !totalAmount) {
      res.status(400).json({ error: 'Order items and total amount are required' });
      return;
    }

    // 1. Fetch user balance & verify
    let buyerUser: any;
    if (isMongoConnected()) {
      buyerUser = await UserModel.findById(buyerId);
    } else {
      buyerUser = usersMem.find(u => u.id === buyerId);
    }

    if (!buyerUser) {
      res.status(404).json({ error: 'Buyer account not found' });
      return;
    }

    if (buyerUser.balance < totalAmount) {
      res.status(400).json({ error: 'Insufficient sandbox funds for investment purchase. Please deposit via sandbox ledger.' });
      return;
    }

    // 2. Decrement stock, increment seller's ledger balances, record ledger movements
    const verifiedItems = [];
    for (const item of items) {
      let prod: any;
      if (isMongoConnected()) {
        prod = await ProductModel.findById(item.productId);
      } else {
        prod = productsMem.find(p => p.id === item.productId);
      }

      if (!prod) {
        res.status(404).json({ error: `Product ${item.productId} not found` });
        return;
      }

      if (prod.stock < item.quantity) {
        res.status(400).json({ error: `Not enough stock for ${prod.title}. Only ${prod.stock} left.` });
        return;
      }

      // Deduct stock
      if (isMongoConnected()) {
        prod.stock -= item.quantity;
        await prod.save();
      } else {
        prod.stock -= item.quantity;
      }

      // Record transaction transfer from investor to seller
      let seller: any;
      if (isMongoConnected()) {
        seller = await UserModel.findById(prod.creatorId);
        if (seller) {
          seller.balance += item.price * item.quantity;
          await seller.save();
        }
      } else {
        seller = usersMem.find(u => u.id === prod.creatorId);
        if (seller) {
          seller.balance += item.price * item.quantity;
        }
      }

      verifiedItems.push({
        productId: item.productId,
        productTitle: prod.title,
        quantity: item.quantity,
        price: item.price
      });

      // Log sub-transaction representing the investment transfer
      const txObj = {
        userId: buyerId,
        userEmail: buyerEmail,
        type: 'Transfer' as const,
        amount: item.price * item.quantity,
        details: `Investment Allocation Purchase: ${prod.title}`,
        status: 'Completed' as const,
        recipientId: prod.creatorId,
        recipientName: seller?.profile?.companyName || seller?.email || 'Entrepreneur Startup'
      };

      if (isMongoConnected()) {
        const dbTx = new TransactionModel(txObj);
        await dbTx.save();
      } else {
        transactionsMem.push({
          id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          ...txObj,
          createdAt: new Date().toISOString()
        });
      }
    }

    // 3. Subtract from buyer
    if (isMongoConnected()) {
      buyerUser.balance -= totalAmount;
      await buyerUser.save();
    } else {
      buyerUser.balance -= totalAmount;
    }

    // 4. Create Order
    const orderData = {
      buyerId,
      buyerEmail,
      items: verifiedItems,
      totalAmount,
      status: 'Paid' as const
    };

    let orderCreated;
    if (isMongoConnected()) {
      const dbOrder = new OrderModel(orderData);
      orderCreated = await dbOrder.save();
    } else {
      orderCreated = {
        id: `ord-${Date.now()}`,
        ...orderData,
        createdAt: new Date().toISOString()
      };
      ordersMem.push(orderCreated);
    }

    res.status(201).json({
      message: 'Checkout complete. Investment allocation processed successfully.',
      order: orderCreated,
      newBalance: buyerUser.balance
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Order History
router.get('/orders', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id || '';
    if (isMongoConnected()) {
      const dbOrders = await OrderModel.find({ buyerId: userId });
      res.json(dbOrders);
    } else {
      const orders = ordersMem.filter(o => o.buyerId === userId);
      res.json(orders);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 6. API ENDPOINTS - MEETINGS (SCHEDULER WITH CONFLICT DETECTION)
// ==========================================

// Get scheduled meetings
router.get('/meetings', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id || '';
    if (isMongoConnected()) {
      const meetings = await MeetingModel.find({
        $or: [{ hostId: userId }, { guestId: userId }]
      });
      res.json(meetings);
    } else {
      const meetings = meetingsMem.filter(m => m.hostId === userId || m.guestId === userId);
      res.json(meetings);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Schedule a meeting with strict conflict detection
router.post('/meetings', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, date, time, guestId } = req.body;
    const hostId = req.user?.id || '';
    const hostEmail = req.user?.email || '';

    if (!title || !date || !time || !guestId) {
      res.status(400).json({ error: 'Title, date, time, and entrepreneur/guest ID are required' });
      return;
    }

    // Strict conflict detection to prevent double booking.
    // Query existing accepted or pending meetings on the exact same date and time involving host or guest.
    let conflictExists = false;

    if (isMongoConnected()) {
      const duplicate = await MeetingModel.findOne({
        date,
        time,
        status: { $in: ['Pending', 'Accepted'] },
        $or: [
          { hostId: hostId },
          { guestId: hostId },
          { hostId: guestId },
          { guestId: guestId }
        ]
      });
      if (duplicate) {
        conflictExists = true;
      }
    } else {
      const duplicate = meetingsMem.find(m =>
        m.date === date &&
        m.time === time &&
        (m.status === 'Pending' || m.status === 'Accepted') &&
        (m.hostId === hostId || m.guestId === hostId || m.hostId === guestId || m.guestId === guestId)
      );
      if (duplicate) {
        conflictExists = true;
      }
    }

    if (conflictExists) {
      res.status(400).json({ error: `Scheduling Conflict: Double-booking detected for ${date} at ${time}. One of the users already has a meeting scheduled at this slot.` });
      return;
    }

    // Fetch names for metadata record
    let hostUser: any;
    let guestUser: any;

    if (isMongoConnected()) {
      hostUser = await UserModel.findById(hostId);
      guestUser = await UserModel.findById(guestId);
    } else {
      hostUser = usersMem.find(u => u.id === hostId);
      guestUser = usersMem.find(u => u.id === guestId);
    }

    const hostName = hostUser?.profile?.companyName || hostUser?.email || 'Investor';
    const guestName = guestUser?.profile?.companyName || guestUser?.email || 'Entrepreneur Startup';
    const guestEmail = guestUser?.email || '';

    const meetingData = {
      title,
      date,
      time,
      hostId,
      hostName,
      hostEmail,
      guestId,
      guestName,
      guestEmail,
      status: 'Pending' as const
    };

    let meetingCreated;
    if (isMongoConnected()) {
      const dbMeeting = new MeetingModel(meetingData);
      meetingCreated = await dbMeeting.save();
    } else {
      meetingCreated = {
        id: `meet-${Date.now()}`,
        ...meetingData,
        createdAt: new Date().toISOString()
      };
      meetingsMem.push(meetingCreated);
    }

    res.status(201).json(meetingCreated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update meeting status (accept/reject)
router.put('/meetings/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!status || !['Accepted', 'Rejected'].includes(status)) {
      res.status(400).json({ error: 'Valid status is required (Accepted or Rejected)' });
      return;
    }

    if (isMongoConnected()) {
      const meeting = await MeetingModel.findById(id);
      if (!meeting) {
        res.status(404).json({ error: 'Meeting not found' });
        return;
      }
      meeting.status = status;
      const updated = await meeting.save();
      res.json(updated);
    } else {
      const mIndex = meetingsMem.findIndex(m => m.id === id);
      if (mIndex === -1) {
        res.status(404).json({ error: 'Meeting not found' });
        return;
      }
      meetingsMem[mIndex].status = status;
      res.json(meetingsMem[mIndex]);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 7. API ENDPOINTS - DOCUMENT CHAMBER (WITH SIGNATURE ATTACHMENTS)
// ==========================================

// Get user documents
router.get('/documents', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id || '';
    if (isMongoConnected()) {
      const docs = await DocumentModel.find({ creatorId: userId });
      res.json(docs);
    } else {
      const docs = documentsMem.filter(d => d.creatorId === userId);
      res.json(docs);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Upload a document (Initiate Term sheet / Agreement entry)
router.post('/documents/upload', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name } = req.body;
    const creatorId = req.user?.id || '';

    if (!name) {
      res.status(400).json({ error: 'Document name is required' });
      return;
    }

    let user: any;
    if (isMongoConnected()) {
      user = await UserModel.findById(creatorId);
    } else {
      user = usersMem.find(u => u.id === creatorId);
    }

    const creatorName = user?.profile?.companyName || user?.email || 'Entrepreneur';

    const docObj = {
      name,
      creatorId,
      creatorName,
      version: 1,
      status: 'Pending' as const
    };

    let docCreated;
    if (isMongoConnected()) {
      const dbDoc = new DocumentModel(docObj);
      docCreated = await dbDoc.save();
    } else {
      docCreated = {
        id: `doc-${Date.now()}`,
        ...docObj,
        createdAt: new Date().toISOString()
      };
      documentsMem.push(docCreated);
    }

    res.status(201).json(docCreated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// E-Sign Document (with drawing coordinate base64 signature)
router.put('/documents/sign', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { documentId, signatureData } = req.body;

    if (!documentId || !signatureData) {
      res.status(400).json({ error: 'Document ID and base64 drawing data are required' });
      return;
    }

    if (isMongoConnected()) {
      const doc = await DocumentModel.findById(documentId);
      if (!doc) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }
      doc.signatureData = signatureData;
      doc.status = 'Signed';
      doc.signedAt = new Date().toISOString();
      doc.version += 1; // version increments on signature binding
      const updated = await doc.save();
      res.json(updated);
    } else {
      const dIndex = documentsMem.findIndex(d => d.id === documentId);
      if (dIndex === -1) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }
      documentsMem[dIndex].signatureData = signatureData;
      documentsMem[dIndex].status = 'Signed';
      documentsMem[dIndex].signedAt = new Date().toISOString();
      documentsMem[dIndex].version += 1;
      res.json(documentsMem[dIndex]);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 8. API ENDPOINTS - PAYMENTS & SANDBOX LEDGER
// ==========================================

// Get user ledger logs & balance
router.get('/payments/transactions', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id || '';
    if (isMongoConnected()) {
      const txs = await TransactionModel.find({
        $or: [{ userId: userId }, { recipientId: userId }]
      }).sort({ createdAt: -1 });
      res.json(txs);
    } else {
      const txs = transactionsMem
        .filter(t => t.userId === userId || t.recipientId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json(txs);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Deposit funds (Sandbox Stripe simulation ledger)
router.post('/payments/deposit', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { amount } = req.body;
    const userId = req.user?.id || '';
    const userEmail = req.user?.email || '';

    if (!amount || Number(amount) <= 0) {
      res.status(400).json({ error: 'Deposit amount must be positive' });
      return;
    }

    let user: any;
    if (isMongoConnected()) {
      user = await UserModel.findById(userId);
    } else {
      user = usersMem.find(u => u.id === userId);
    }

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const depAmount = Number(amount);

    if (isMongoConnected()) {
      user.balance += depAmount;
      await user.save();
    } else {
      user.balance += depAmount;
    }

    const txObj = {
      userId,
      userEmail,
      type: 'Deposit' as const,
      amount: depAmount,
      details: 'Wire Deposit processed successfully via Stripe sandbox integration.',
      status: 'Completed' as const
    };

    let txCreated;
    if (isMongoConnected()) {
      const dbTx = new TransactionModel(txObj);
      txCreated = await dbTx.save();
    } else {
      txCreated = {
        id: `tx-${Date.now()}`,
        ...txObj,
        createdAt: new Date().toISOString()
      };
      transactionsMem.push(txCreated);
    }

    res.json({
      message: 'Deposit successful',
      newBalance: user.balance,
      transaction: txCreated
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Withdraw funds
router.post('/payments/withdraw', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { amount } = req.body;
    const userId = req.user?.id || '';
    const userEmail = req.user?.email || '';

    if (!amount || Number(amount) <= 0) {
      res.status(400).json({ error: 'Withdrawal amount must be positive' });
      return;
    }

    let user: any;
    if (isMongoConnected()) {
      user = await UserModel.findById(userId);
    } else {
      user = usersMem.find(u => u.id === userId);
    }

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const withdrawAmount = Number(amount);
    if (user.balance < withdrawAmount) {
      res.status(400).json({ error: 'Insufficient ledger balance' });
      return;
    }

    if (isMongoConnected()) {
      user.balance -= withdrawAmount;
      await user.save();
    } else {
      user.balance -= withdrawAmount;
    }

    const txObj = {
      userId,
      userEmail,
      type: 'Withdraw' as const,
      amount: withdrawAmount,
      details: 'Withdrawal to registered business bank account processed.',
      status: 'Completed' as const
    };

    let txCreated;
    if (isMongoConnected()) {
      const dbTx = new TransactionModel(txObj);
      txCreated = await dbTx.save();
    } else {
      txCreated = {
        id: `tx-${Date.now()}`,
        ...txObj,
        createdAt: new Date().toISOString()
      };
      transactionsMem.push(txCreated);
    }

    res.json({
      message: 'Withdrawal successful',
      newBalance: user.balance,
      transaction: txCreated
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Transfer funds between users directly
router.post('/payments/transfer', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { amount, recipientId } = req.body;
    const senderId = req.user?.id || '';
    const senderEmail = req.user?.email || '';

    if (!amount || Number(amount) <= 0 || !recipientId) {
      res.status(400).json({ error: 'Transfer amount must be positive and recipient specified' });
      return;
    }

    if (senderId === recipientId) {
      res.status(400).json({ error: 'Cannot transfer funds to yourself' });
      return;
    }

    let sender: any;
    let recipient: any;

    if (isMongoConnected()) {
      sender = await UserModel.findById(senderId);
      recipient = await UserModel.findById(recipientId);
    } else {
      sender = usersMem.find(u => u.id === senderId);
      recipient = usersMem.find(u => u.id === recipientId);
    }

    if (!sender || !recipient) {
      res.status(404).json({ error: 'Sender or recipient account not found' });
      return;
    }

    const xferAmount = Number(amount);
    if (sender.balance < xferAmount) {
      res.status(400).json({ error: 'Insufficient balance for direct ledger transfer' });
      return;
    }

    // Process dual transfer
    if (isMongoConnected()) {
      sender.balance -= xferAmount;
      recipient.balance += xferAmount;
      await sender.save();
      await recipient.save();
    } else {
      sender.balance -= xferAmount;
      recipient.balance += xferAmount;
    }

    const recName = recipient.profile?.companyName || recipient.email;

    const txObj = {
      userId: senderId,
      userEmail: senderEmail,
      type: 'Transfer' as const,
      amount: xferAmount,
      details: `Direct Ledger Platform Transfer to ${recName}`,
      status: 'Completed' as const,
      recipientId,
      recipientName: recName
    };

    let txCreated;
    if (isMongoConnected()) {
      const dbTx = new TransactionModel(txObj);
      txCreated = await dbTx.save();
    } else {
      txCreated = {
        id: `tx-${Date.now()}`,
        ...txObj,
        createdAt: new Date().toISOString()
      };
      transactionsMem.push(txCreated);
    }

    res.json({
      message: 'Direct transfer completed successfully.',
      newBalance: sender.balance,
      transaction: txCreated
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to fetch potential matching users for scheduler list or transfers
router.get('/users/all', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUserId = req.user?.id || '';
    if (isMongoConnected()) {
      const users = await UserModel.find({ _id: { $ne: currentUserId } }, '-password');
      res.json(users.map((u: any) => ({
        id: u._id.toString(),
        email: u.email,
        role: u.role,
        profile: u.profile,
        balance: u.balance
      })));
    } else {
      const users = usersMem
        .filter(u => u.id !== currentUserId)
        .map(u => ({
          id: u.id,
          email: u.email,
          role: u.role,
          profile: u.profile,
          balance: u.balance
        }));
      res.json(users);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
