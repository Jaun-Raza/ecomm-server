import express from "express";
import mongoose from "mongoose";
import 'dotenv/config';
import cookieParser from "cookie-parser";
import { body, validationResult } from "express-validator";
import bcrypt from 'bcrypt'

const app = express();
const port = 5000;
const dbName = "ecommDB";
const url = "mongodb://127.0.0.1:27017/";

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "https://client-kappa-rouge-53.vercel.app");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
})
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

mongoose.connect(url + dbName, { useNewUrlParser: true });

const userSchema = new mongoose.Schema({
    username: String,
    number: Number,
    address: String,
    email: String,
    password: String,
    googleId: String,
    orders: [{
        userID: String,
        order: {},
        name: String,
        email: String,
        number: String,
        address: String,
        instructions: String,
        paymentMethod: String,
        isReturn: Boolean,
        isDelivered: Boolean,
        date: String,
        submissionDate: String
    }]
});


const User = mongoose.model("User", userSchema);

const producrSchema = new mongoose.Schema({
    id: String,
    name: String,
    company: String,
    price: Number,
    colors: [String],
    description: String,
    category: String,
    featured: Boolean,
    shipping: Boolean,
    stock: Number,
    reviews: Number,
    stars: Number,
    image: {},
})

const Product = mongoose.model("products", producrSchema);

const orderSchema = new mongoose.Schema({
    userID: String,
    order: {},
    name: String,
    email: String,
    number: String,
    address: String,
    instructions: String,
    paymentMethod: String,
    isReturn: Boolean,
    isDelivered: Boolean,
    date: String,
    submissionDate: String
})

const Order = mongoose.model("orders", orderSchema);


// app.get('/auth/google',
//     passport.authenticate('google', { scope: ['profile', 'email'] })
// );

// app.get('/auth/google/callback',
//     passport.authenticate('google', { failureRedirect: 'http:localhost:3000/signup', successRedirect: "http:localhost:3000/"}),
// );


app.get('/', (req, res) => {
    res.send("Hello World!");
})

app.post('/signin', [
    body('email', 'Incorrect details!').isEmail(),
    body('password', 'Password must be 8 characters!').isLength({ min: 8 })
], async (req, res) => {

    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json({ errors: result.array() });
    }

    try {

        const { username, number, address, email, password } = req.body;

        const saltRounds = await bcrypt.genSalt(10);
        const setPassword = await bcrypt.hash(password, saltRounds)

        
        const user = new User({
            username,
            number,
            address,
            email,
            password: setPassword
        });

        const isEmailExisted = await User.findOne({ email: email })

        if (!isEmailExisted) {
            await user.save().then((foundUser) => {
                return res.status(200).json({ success: true, data: foundUser })
            })
        } else {
            return res.status(400).json({ success: false, message: "This Email already exists, try to Login." });
        }

    } catch (error) {
        return res.status(401).json({ success: false });
    }


})

app.post('/login', [
    body('email', 'Incorrect details!').isEmail(),
    body('password', 'Password must be 8 characters!').isLength({ min: 8 })
], async (req, res) => {

    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json({ errors: result.array() });
    }

    try {

        const { email, password } = req.body;

        const userData = await User.findOne({ email: email })

        if (userData) {
            const match = await bcrypt.compare(password, userData.password);

            if (!match) {
                return res.status(400).json({ success: false, message: "Incorrect Password" });
            }

            return res.status(200).json({ success: true, data: userData });

        } else {
            return res.status(400).json({ success: false, message: "This User is not exists, try to Signup." });
        }

    } catch (error) {
        return res.status(401).json({ success: false });
    }

})



app.post('/ordersData', (req, res) => {
    const { userID, order, name, email, number, address, instructions, paymentMethod } = req.body;
    // Create a new Date object
    const currentDate = new Date();

    // Adjust for Pakistan Standard Time (UTC+5)
    const pstOffset = 5 * 60 * 60 * 1000; // 5 hours in milliseconds
    const pstDate = new Date(currentDate.getTime() + pstOffset);

    // Extract the components of the date and time
    const year = pstDate.getFullYear();
    const month = pstDate.getMonth() + 1; // Months are 0-based, so add 1
    const day = pstDate.getDate();
    const hours = pstDate.getHours();
    const minutes = pstDate.getMinutes();
    const seconds = pstDate.getSeconds();

    // Format the date and time in the "YYYY-MM-DD HH:MM:SS" format
    const formattedDateTime = `${year}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day} ${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    const newOrder = new Order({
        userID: userID,
        order: order,
        name: name,
        email: email,
        number: number,
        address: address,
        instructions: instructions,
        paymentMethod: paymentMethod,
        isReturn: false,
        isDelivered: false,
        date: formattedDateTime,
        submissionDate: ""
    })

    newOrder.save();

    User.find({ email: email }).then((foundUser) => {
        foundUser[0].orders.push(newOrder)
        foundUser[0].save().then(() => {
            res.status(200)
        })
    })


})

app.get('/myOrders', (req, res) => {
    User.find({}).then((foundOrder) => {
        res.send(foundOrder)
    })
})


app.get('/productsData', (req, res) => {
    console.log("prod");
    try {
        Product.find({}).then((foundData) => {
            res.send(foundData)
        })
    } catch (error) {
        console.log(error);
    }
})

app.get('/productsData/:id', (req, res) => {
    try {
        Product.find({ id: req.params.id }).then((foundData) => {
            res.send(foundData[0])
        })
    } catch (error) {
        console.log(error);
    }
})

app.get("/logout", (req, res) => {
    res.status(200).json({message : "Logout"});
})

app.get('/allOrders132', (req, res) => {
    Order.find({}).then((order) => {
        res.send(order);
    }).catch(err => {
        console.log(err);
    })
})

app.get('/orders/:id', (req, res) => {
    User.find({}).then((foundUser) => {
        res.send(foundUser);
    }).catch(err => {
        console.log(err);
    })
})

app.get('/allOrders/:id', (req, res) => {
    Order.find({ userID: req.params.id }).then((order) => {
        res.send(order[0]);
    }).catch(err => {
        console.log(err);
    })
})

app.post('/postAction', (req, res) => {
    const { email, userID, isReturn, isDelivered } = req.body;

    if (isReturn) {

        Order.find({ userID: userID }).then((order) => {
            const getOrder = order[0];
            getOrder.isReturn = true;

            // Create a new Date object
            const currentDate = new Date();

            // Adjust for Pakistan Standard Time (UTC+5)
            const pstOffset = 5 * 60 * 60 * 1000; // 5 hours in milliseconds
            const pstDate = new Date(currentDate.getTime() + pstOffset);

            // Extract the components of the date and time
            const year = pstDate.getFullYear();
            const month = pstDate.getMonth() + 1; // Months are 0-based, so add 1
            const day = pstDate.getDate();
            const hours = pstDate.getHours();
            const minutes = pstDate.getMinutes();
            const seconds = pstDate.getSeconds();

            // Format the date and time in the "YYYY-MM-DD HH:MM:SS" format
            const formattedDateTime = `${year}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day} ${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;


            getOrder.submissionDate = formattedDateTime;
            getOrder.save();
        })

        User.find({ email: email }).then((foundUsers) => {
            if (foundUsers.length > 0) {
                const foundUser = foundUsers[0];
                const getUser = foundUser.orders;

                // Find the specific order within the user's orders
                const order = getUser.find((order) => order.userID === userID);

                if (order) {
                    // Update the isReturn property
                    order.isReturn = true;

                    // Create a new Date object
                    const currentDate = new Date();

                    // Adjust for Pakistan Standard Time (UTC+5)
                    const pstOffset = 5 * 60 * 60 * 1000; // 5 hours in milliseconds
                    const pstDate = new Date(currentDate.getTime() + pstOffset);

                    // Extract the components of the date and time
                    const year = pstDate.getFullYear();
                    const month = pstDate.getMonth() + 1; // Months are 0-based, so add 1
                    const day = pstDate.getDate();
                    const hours = pstDate.getHours();
                    const minutes = pstDate.getMinutes();
                    const seconds = pstDate.getSeconds();

                    // Format the date and time in the "YYYY-MM-DD HH:MM:SS" format
                    const formattedDateTime = `${year}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day} ${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;


                    order.submissionDate = formattedDateTime;

                    // Save the foundUser document
                    foundUser.save().then((updatedUser) => {
                        console.log("User data saved with updated isReturn");

                    }).catch((err) => {
                        console.log(err);
                    });
                } else {
                    console.log("Order not found");
                }
            } else {
                console.log("User not found");
            }
        }).catch((err) => {
            console.log(err);
        });
    }

    if (isDelivered) {
        Order.find({ userID: userID }).then((order) => {
            const getOrder = order[0];
            getOrder.isDelivered = true;

            // Create a new Date object
            const currentDate = new Date();

            // Adjust for Pakistan Standard Time (UTC+5)
            const pstOffset = 5 * 60 * 60 * 1000; // 5 hours in milliseconds
            const pstDate = new Date(currentDate.getTime() + pstOffset);

            // Extract the components of the date and time
            const year = pstDate.getFullYear();
            const month = pstDate.getMonth() + 1; // Months are 0-based, so add 1
            const day = pstDate.getDate();
            const hours = pstDate.getHours();
            const minutes = pstDate.getMinutes();
            const seconds = pstDate.getSeconds();

            // Format the date and time in the "YYYY-MM-DD HH:MM:SS" format
            const formattedDateTime = `${year}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day} ${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;


            getOrder.submissionDate = formattedDateTime;
            getOrder.save()
        })

        User.find({ email: email }).then((foundUsers) => {
            if (foundUsers.length > 0) {
                const foundUser = foundUsers[0];
                const getUser = foundUser.orders;

                // Find the specific order within the user's orders
                const order = getUser.find((order) => order.userID === userID);

                if (order) {
                    // Update the isReturn property
                    order.isDelivered = true;

                    // Create a new Date object
                    const currentDate = new Date();

                    // Adjust for Pakistan Standard Time (UTC+5)
                    const pstOffset = 5 * 60 * 60 * 1000; // 5 hours in milliseconds
                    const pstDate = new Date(currentDate.getTime() + pstOffset);

                    // Extract the components of the date and time
                    const year = pstDate.getFullYear();
                    const month = pstDate.getMonth() + 1; // Months are 0-based, so add 1
                    const day = pstDate.getDate();
                    const hours = pstDate.getHours();
                    const minutes = pstDate.getMinutes();
                    const seconds = pstDate.getSeconds();

                    // Format the date and time in the "YYYY-MM-DD HH:MM:SS" format
                    const formattedDateTime = `${year}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day} ${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;


                    order.submissionDate = formattedDateTime;

                    // Save the foundUser document
                    foundUser.save().then((updatedUser) => {
                        console.log("User data saved with updated isReturn");
                    }).catch((err) => {
                        console.log(err);
                    });
                } else {
                    console.log("Order not found");
                }
            } else {
                console.log("User not found");
            }
        }).catch((err) => {
            console.log(err);
        });
    }
})

app.listen(port, () => {
    console.log(`Server is running on ${port}`);
})
