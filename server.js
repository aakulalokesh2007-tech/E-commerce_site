const { MongoClient, ServerApiVersion } = require('mongodb');
const DB_Server_Link = "mongodb://aakulalokesh2007_db_user:pass@ac-tg6v67q-shard-00-00.tnabgr9.mongodb.net:27017,ac-tg6v67q-shard-00-01.tnabgr9.mongodb.net:27017,ac-tg6v67q-shard-00-02.tnabgr9.mongodb.net:27017/?ssl=true&replicaSet=atlas-ab8lh9-shard-0&authSource=admin&appName=Cluster0";



const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); //  Built-in Node module to handle file paths

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(DB_Server_Link, 
    {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});






const app = express();

// Middleware
app.use(cors());
app.use(express.json());


// ---  MongoDB connection and API routes go below here ---

mongoose.connect(DB_Server_Link)
    .then(() => console.log('✅ Connected to MongoDB successfully!'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));







// load main.html
app.get('/', (req, res) => { 
    res.sendFile(path.join(__dirname, 'main.html'));
});


// --- 10. Get Single Product Route ---
app.get('/api/products/:id', async (req, res) => {
    try {
        // Find the product by its unique database ID
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        
        res.status(200).json(product);
    } catch (error) {
        console.error('Fetch Single Product Error:', error);
        res.status(500).json({ message: 'Server error while fetching product details.' });
    }
});


// 2. Give public access to the 'admin_' folder so your buttons and links work
app.use('/admin_', express.static(path.join(__dirname, 'admin_')));
app.use('/user_', express.static(path.join(__dirname, 'user_')));



// ... (Keep your User schema and app.post('/api/login') route here) ...
// 1. Create the Admin Schema
const adminSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, 
    role: { type: String, default: 'admin' }
});

// --- 1. Create the Product Schema ---
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    stock: { type: Number, required: true },
    description: { type: String }
});

// Create the Model
const Product = mongoose.model('Product', productSchema);




// --- 2. Create the Add Product Route ---
app.post('/api/products', async (req, res) => {
    try {
        const { name, price, category, stock, description } = req.body;

        // Strict Check: Ensure required fields aren't empty
        if (!name || !price || !category || !stock) {
            return res.status(400).json({ message: 'Please fill out all required fields.' });
        }

        // Create a new product document
        const newProduct = new Product({
            name: name,
            price: price,
            category: category,
            stock: stock,
            description: description
        });

        // Save it to MongoDB
        await newProduct.save();

        res.status(201).json({ message: 'Product added successfully!' });

    } catch (error) {
        console.error('Add Product Error:', error);
        res.status(500).json({ message: 'Server error while adding product.' });
    }
});

// Create the Model
const Admin = mongoose.model('Admin', adminSchema);

// 2. Create the Signup Route
app.post('/api/signup', async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        // 👇 NEW STRICT CHECK 👇
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: 'All fields are required and cannot be empty.' });
        }

        // Check if an admin with this email already exists
        const existingAdmin = await Admin.findOne({ email: email });
        // ... (the rest of your saving logic stays the same)
        if (existingAdmin) {
            return res.status(400).json({ message: 'An account with this email already exists.' });
        }

        // Create a new admin document
        const newAdmin = new Admin({
            fullName: fullName,
            email: email,
            password: password, // Note: In a real-world app, you should hash this!
            role: 'admin'
        });

        // Save it to MongoDB
        await newAdmin.save();

        res.status(201).json({ message: 'Admin account created successfully!' });

    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({ message: 'Server error while saving account.' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Strict check: Are fields empty?
        if (!email || !password) {
            return res.status(400).json({ message: 'Please enter both email and password.' });
        }

        // 2. Search the Admin database for a match
        const adminUser = await Admin.findOne({ email: email });
        
        // 3. Check if user exists AND password matches
        if (adminUser && adminUser.password === password) {
            // Success! 
            res.status(200).json({ message: "Login successful", user: adminUser });
        } else {
            // Failed!
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: "Server error during login" });
    }
});



// --- 4. Create the Order Schema ---
const orderSchema = new mongoose.Schema({
    customerName: { type: String, required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    status: { type: String, default: 'Pending' },
    orderDate: { type: Date, default: Date.now },
    
   
    address: { type: String, default: 'Not Provided' },
    paymentMethod: { type: String, default: 'Cash on Delivery' }
});

const Order = mongoose.model('Order', orderSchema);

// --- 5. View Orders Route ---
app.get('/api/orders', async (req, res) => {
    try {
        // Fetch all orders and sort them by date (newest orders at the top)
        const orders = await Order.find().sort({ orderDate: -1 }); 
        res.status(200).json(orders);
    } catch (error) {
        console.error('Fetch Orders Error:', error);
        res.status(500).json({ message: 'Server error while fetching orders.' });
    }
});








// ==========================================
//          USER (CUSTOMER) ROUTES
// ==========================================

// --- 7. Create the User Schema ---
const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },    
    address: { type: String, required: true },
    
    password: { type: String, required: true }, 
    role: { type: String, default: 'customer' }
});

const User = mongoose.model('User', userSchema);

// --- 8. User Signup Route ---
app.post('/api/user/signup', async (req, res) => {
    try {
        const { fullName, email, phone, address, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use.' });
        }

        const newUser = new User({ fullName, email, phone, address, password });
        await newUser.save();

        res.status(201).json({ message: 'User account created successfully!' });
    } catch (error) {
        console.error('User Signup Error:', error);
        res.status(500).json({ message: 'Server error while saving account.' });
    }
});

// --- 9. User Login Route ---
app.post('/api/user/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please enter both email and password.' });
        }

        const customer = await User.findOne({ email: email });
        
        if (customer && customer.password === password) {
            res.status(200).json({ message: "Login successful", user: customer });
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (error) {
        console.error('User Login Error:', error);
        res.status(500).json({ error: "Server error during login" });
    }
});

// --- 12. Submit New Order(s) Route ---
app.post('/api/orders', async (req, res) => {
    try {
        // We expect the frontend to send an array of order items
        const ordersData = req.body;

        if (!ordersData || ordersData.length === 0) {
            return res.status(400).json({ message: 'No items in the order.' });
        }

        // Save all the items to the database at the same time
        await Order.insertMany(ordersData);

        res.status(201).json({ message: 'Order placed successfully!' });
    } catch (error) {
        console.error('Checkout Error:', error);
        res.status(500).json({ message: 'Server error while placing order.' });
    }
});


// --- 3. View Customers (Fetch Admins & Users) Route ---
app.get('/api/customers', async (req, res) => {
    try {
        // 1. Fetch all Admins (excluding passwords)
        const admins = await Admin.find({}, '-password'); 
        
        // 2. Fetch all regular Users/Customers (excluding passwords)
        const customers = await User.find({}, '-password');

        // 3. Combine both lists together into one big array
        const everyone = [...admins, ...customers];
        
        // 4. Send the combined list back to the frontend
        res.status(200).json(everyone);

    } catch (error) {
        console.error('Fetch Customers Error:', error);
        res.status(500).json({ message: 'Server error while fetching directory.' });
    }
});



app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find(); 
        res.status(200).json(products);
    } catch (error) {
        console.error('Fetch Products Error:', error);
        res.status(500).json({ message: 'Server error while fetching products.' });
    }
});

// --- 11. View Specific User's Orders Route ---
app.get('/api/user/orders/:customerName', async (req, res) => {
    try {
        // Grab the name from the URL address
        const nameToSearch = req.params.customerName;
        
        // Find orders matching ONLY this name, sorted newest first
        const userOrders = await Order.find({ customerName: nameToSearch }).sort({ orderDate: -1 });
        
        res.status(200).json(userOrders);
    } catch (error) {
        console.error('Fetch User Orders Error:', error);
        res.status(500).json({ message: 'Server error while fetching your orders.' });
    }
});



// ==========================================
//        ADMIN MANAGE PRODUCT ROUTES
// ==========================================

// 1. Update an Existing Product
app.put('/api/products/:id', async (req, res) => {
    try {
        // Find the product by ID and update it with the new data sent in the request
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true } // This tells MongoDB to return the newly updated item
        );
        
        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        
        res.status(200).json({ message: 'Product updated successfully!', product: updatedProduct });
    } catch (error) {
        console.error('Update Product Error:', error);
        res.status(500).json({ message: 'Failed to update product.' });
    }
});

// 2. Delete a Product
app.delete('/api/products/:id', async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        
        if (!deletedProduct) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        
        res.status(200).json({ message: 'Product deleted successfully.' });
    } catch (error) {
        console.error('Delete Product Error:', error);
        res.status(500).json({ message: 'Failed to delete product.' });
    }
});



const PORT = 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});