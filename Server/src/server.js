import express from 'express';
import mongoose from 'mongoose';
import { tenantResolver } from './middlewares/tenantResolver';
const app = express();
const PORT = process.env.PORT || 5000;
app.use(tenantResolver);
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/multitenant', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const productSchema = new mongoose.Schema({
    title: String,
    price: Number,
    tenantId: String,
});

const Product = mongoose.model('Product', productSchema);

// Middleware to extract tenantId from headers
const getTenantId = (host) => {
    return host.split('.')[0]; // Assuming tenantId is the subdomain
};

//routes
app.get('/', (req, res) => {
    res.send('Multitenant Product Service is running');
});

app.post('/api/products', async (req, res) => {
    const tenant = getTenantId(req.headers.host);
    const product = await Product.create({ ...req.body, tenantId: tenant });
    res.status(201).send(product);
});



app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
