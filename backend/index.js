const port = 4000;
const express = require("express");
const app = express();
const mongoose= require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const exp = require("constants");
const { get } = require("http");

app.use(express.json());
app.use(cors());


mongoose.connect("mongodb+srv://brijkalola:Brij%231375Kalola@cluster0.ykbehhb.mongodb.net/Online_Clothing_Shopping_Website"); 


app.get("/",(req,res)=>{
    res.send("Express is running ")
})


const storage = multer.diskStorage({
    destination:'./upload/images',
    filename:(req,file,cb)=>{
        return cb(null,`${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})

const upload = multer({storage:storage})


app.use('/images',express.static('upload/images'))

app.post("/upload",upload.single('product'),(req,res)=>{
    res.json({
        success:1,
        image_url:`http://localhost:${port}/images/${req.file.filename}`
    })
})


const Product = mongoose.model("Product",{
    id:{
        type:Number,
        required:true,
    },
    name:{
        type:String,
        required:true,
    },
    image: {
        type: String,
        required: true,
    },
    category:{
        type:String,
        required:true,
    },
    new_price:{
        type:Number,
        required:true,
    },
    old_price:{
        type:Number,
        required:true,
    },
    date:{
        type:Date,
        default:Date.now,
    },
    available:{
        type:Boolean,
        default:true,
    },
})

app.post('/addproduct',async(req,res)=>{
    let products = await Product.find({});
    let id;
    if (products.length>0){
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id = last_product.id+1;
    }
    else{
        id=1;
    }
    const product = new Product({
        id:id,
        name:req.body.name,
        image:req.body.image,
        category:req.body.category,
        new_price:req.body.new_price,
        old_price:req.body.old_price,
    });
    console.log(product);
    await product.save();
    console.log("Saved");
    res.json({
        success:true,
        name:req.body.name,
    })
})


app.post('/removeproduct', async (req, res) => {
    await Product.findOneAndDelete({id:req.body.id});
    console.log("Removed");
    res.json({
        success:true,
        name:req.body.name
    })   
})


app.get('/allproducts',async(req,res)=>{
    let products = await Product.find({});
    console.log("All Products Featched");
    res.send(products);
})


const User = mongoose.model('User',{
    name:{
        type:String,
    },
    email:{
        type:String,
        unique:true,
    },
    password:{
        type:String,
    },
    cartData:{
        type:Object,
    },
    date:{
        type:Date,
        default:Date.now,
    }
})

app.post('/signup', async (req, res) => {
    try {
       
        let check = await User.findOne({ email: req.body.email });
        if (check) {
            return res.status(400).json({ success: false, error: "A user with the same email address already exists" });
        }
    
        let cart = {};
        for (let i = 0; i < 300; i++) {
            cart[i] = 0;
        }

        const user = new User({
            name: req.body.username,
            email: req.body.email,
            password: req.body.password,
            cartData: cart,
        });

       
        await user.save();

        const token = jwt.sign({ userId: user._id }, 'secret_ecom');

     
        res.json({ success: true, token });
    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});


app.post('/login',async(req,res)=>{
    let user = await User.findOne({email:req.body.email});
    if(user){
        const passCompare = req.body.password === user.password;
        if(passCompare){
            const data={
                user:{
                    id:user.id
                }
            }
            const token = jwt.sign({ userId: user._id },'secret_ecom');
            res.json({success:true,token});
        }
        else{
            res.json({success:false,error:"wrong password"});
        }
    }
    else{
        res.json({success:false,error:"wrong email id"});
    }
})


app.get('/newcollections',async(req,res)=>{
    let products = await Product.find({});
    let newcollection = products.slice(1).slice(-8);
    console.log("New Collection Fetched");
    res.send(newcollection);
})

/*
//featch user cart

const fetchUser = async (req,res,next)=>{
    const token = req.header('auth-token');
    if (!token){
     //   res.status(401).send({errors:"Please authenticate using valid token"});
    }
    else{
        try {
            const data = jwt.verify(token,'secret_ecom');
            req.user = data.user;
            next();
        } catch (error) {
           // res.status(401).send({errors:"Please authenticate using valid token"});
        }
    }
}
//
//add to cart

app.post('/addtocart',fetchUser,async(req,res)=>{
    console.log(req.body,req.user);
})
*/

const fetchUser = async (req, res, next) => {
    const token = req.header('auth-token');
    console.log("Token:", token); 
    if (!token) {
        console.log("Token not found"); 
        res.status(401).send({ errors: "Please authenticate using valid token" });
    } else {
        try {
            const data = jwt.verify(token, 'secret_ecom');
            console.log("Decoded User Data:", data); 
            req.user = { id: data.userId }; 
            next();
        } catch (error) {
            console.log("Token verification failed:", error);
            res.status(401).send({ errors: "Please authenticate using valid token" });
        }
    }
};

app.post('/addtocart', fetchUser, async (req, res) => {

     let userData = await User.findOne({_id:req.user.id});
     userData.cartData[req.body.itemId]+=1;
     await User.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData}); 
  res.send("Added")
});



app.post('/removefromcart', fetchUser, async (req, res) => {
    try {
        // Find the user data
        let userData = await User.findOne({ _id: req.user.id });
        
        // Check if the item exists in the cart
        if (userData.cartData[req.body.itemId] > 0) {
            // If the item exists, decrement its count
            userData.cartData[req.body.itemId] -= 1;

            // Update the user's cart data in the database
            await User.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });

            // Send success response
            res.send("Removed");
        } else {
            // If the item doesn't exist in the cart, send a failure response
            res.status(400).send("Item not found in cart");
        }
    } catch (error) {
        // Handle any errors that occur during the process
        console.error("Error removing item from cart:", error);
        res.status(500).send("Internal server error");
    }
});



app.post('/getcart', fetchUser, async (req, res) => {
    try {
        console.log('Get Cart');
        const userData = await User.findOne({ _id: req.user.id });
        res.json(userData.cartData);
    } catch (error) {
        console.error('Error retrieving cart:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(port,(error)=>{
    if(!error){
        console.log("Server is running on port " +port)
    }
    else{
        console("Error:"+error)
    }
})