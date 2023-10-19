import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import passport from 'passport';
import passportLocalMongoose from "passport-local-mongoose";
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import findOrCreate from 'mongoose-findorcreate';
import 'dotenv/config';
import cookieParser from "cookie-parser";
import cors from "cors";

app.use(cors());
const app = express();
const port = 1000;
const dbName = "ecommDB";
const url = "mongodb+srv://jaundev768:DevOps123@cluster-1.szlfag2.mongodb.net/";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'Thisisoursecret.',
    resave: false,
    saveUninitialized: false,
    domain: false, // or remove this line
    secure: false, // or remove this line
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // Set your desired expiration time
    },
}));

app.use(cookieParser());


mongoose.connect(url + dbName, { useNewUrlParser: true });

const userSchema = new mongoose.Schema({
    username: String,
    email: {
        type: String,
        // required: true
    },
    password: {
        type: String,
        // required: true
    },
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
        date: String
    }]
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


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
    date: String
})

const Order = mongoose.model("orders", orderSchema);

const clientID = "671933914286-55bai5tjfalm9oob0lrt6tj2a2vbjkj5.apps.googleusercontent.com";
const secretID = "OCSPX-f89EifM-uLYHMLzpBZ_gUPCjjgrP";
var isAuthenticated = false;
var userName = "";
var isEmail = "";

passport.use(new GoogleStrategy({
    clientID: clientID,
    clientSecret: secretID,
    callbackURL: "/auth/google/callback"
},
    function (accessToken, refreshToken, profile, cb) {
        userName = profile.displayName;
        isEmail = profile._json.email
        isAuthenticated = true;

        User.findOrCreate({ googleId: profile.id, username: profile._json.email }, function (err, user) {
            return cb(null, profile)
        });
    }
));

passport.serializeUser(function (user, cb) {
    cb(null, user);
});

passport.deserializeUser(function (user, cb) {
    cb(null, user);
});

app.use(passport.initialize());
app.use(passport.session());


app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: 'https://client-kappa-rouge-53.vercel.app/signup', successRedirect: "https://client-kappa-rouge-53.vercel.app/" })
);

app.get('/', (req, res) => {

    const userData = {
        isAuthenticated: isAuthenticated,
        email: isEmail,
    }

    console.log(userData);
    console.log(req.isAuthenticated());
    
    res.send(userData);
})

app.post('/signin', (req, res) => {

    const { email, password } = req.body;

    User.register({ username: email }, password, function (err, user) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, () => {
                isAuthenticated = true;
                isEmail = user.username
            })
        }
    })


})

app.post('/login', async (req, res) => {

    const { email, password } = req.body;

    const user = new User({
        username: email,
        password: password
    })

    if (email !== "" && password !== "") {
        req.login(user, function (err) {
            if (err) {
                console.log(err);
            } else {
                passport.authenticate("local")(req, res, () => {
                    isAuthenticated = req.isAuthenticated();
                    isEmail = email;
                })
            }
        })
    }
})




app.post('/ordersData', (req, res) => {
    const { userID, order, name, email, number, address, instructions, paymentMethod } = req.body;
    const date = JSON.stringify(new Date())
    const rawDate = new Date()

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
        date: date.slice(1, 11) + " " + rawDate.getHours() + ":" + rawDate.getMinutes() + ":" + rawDate.getMilliseconds()
    })

    newOrder.save();

    User.find({ username: email }).then((foundUser) => {
        foundUser[0].orders.push(newOrder)
        foundUser[0].save().then(() => {
            res.status(200)
        })
    })


})

app.get('/myOrders', (req, res) => {
    if (isEmail) {
        User.find({ username: isEmail }).then((foundOrder) => {
            res.send(foundOrder[0].orders)
        })
    }
})


app.get('/productsData', (req, res) => {
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
    req.logout((err) => {
        if (err) {
            console.log(err);
        } else {
            res.status(200);
        }
    });

    console.log('run');

    isAuthenticated = req.isAuthenticated();
    userName = "";
    isEmail = "";
})

app.get('/allOrders132', (req, res) => {
    Order.find({}).then((order) => {
        res.send(order);
    }).catch(err => {
        console.log(err);
    })
})

app.get('/orders/:id', (req, res) => {
    if (isEmail) {
        User.find({ username: isEmail }).then((foundUser) => {
            const userOrders = foundUser[0].orders;
            const order = userOrders.find((order) => order.userID === req.params.id);

            res.send(order);
        }).catch(err => {
            console.log(err);
        })
    }
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
            getOrder.save();
        })

        User.find({ username: email }).then((foundUsers) => {
            if (foundUsers.length > 0) {
                const foundUser = foundUsers[0];
                const getUser = foundUser.orders;

                // Find the specific order within the user's orders
                const order = getUser.find((order) => order.userID === userID);

                if (order) {
                    // Update the isReturn property
                    order.isReturn = true;

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
            getOrder.save()
        })

        User.find({ username: email }).then((foundUsers) => {
            if (foundUsers.length > 0) {
                const foundUser = foundUsers[0];
                const getUser = foundUser.orders;

                // Find the specific order within the user's orders
                const order = getUser.find((order) => order.userID === userID);

                if (order) {
                    // Update the isReturn property
                    order.isDelivered = true;

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
