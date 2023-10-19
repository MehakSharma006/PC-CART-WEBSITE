var express = require('express');
const session = require("express-session");
var router = express.Router();
const connection = require("../connection");


router.get("/cancel-order", (req, res) => {
    let {id} = req.query;
    let updateSQL = `UPDATE orders SET order_status="Cancelled" WHERE id=${id}`;
    connection.query(updateSQL, (err) => {
        if (err) {
            return res.send("error");
        }
        res.send("success");
    });
});

router.get("/fetch-my-order", (req, res) => {
    let username = session.userName;
    // console.log(username);
    var pendingOrders = `SELECT *, DATE_FORMAT(date_time, "%W %M %e %Y %r") as date_time  FROM orders WHERE username = "${username}"`;
    connection.query(pendingOrders, (error, data) => {
        if (error) {
            res.send("error");
        } else {
            res.send(data);
        }
    });
});

router.get("/my-orders", (req, res) => {
    if (session.userName !== undefined) {
        res.render("users/my_orders", {title: "My Orders", text: "My Orders"});
    } else {
        res.redirect("/user-login")
    }
});

router.get("/get-order-details", (req, res) => {
    console.log(req.query);

    let {id} = req.query;
    let orderDetail = `SELECT order_details.*, products.product_name, products.photo FROM order_details INNER JOIN products ON order_details.product_id=products.id WHERE order_details.order_id=${id};`;
    connection.query(orderDetail, (e, data) => {
        if(e) {
            return res.send("error");
        }

        res.send(data);
    })
})

router.get("/thank-you", (req, res) => {
    res.render("users/thank_you", {title: "Thank You", text: "Thank You"});
});

router.get("/order-details", (req, res) => {
    res.render("users/order_details", {title: "Orders Details", text: "Orders Details"});
});

router.post("/place-new-order", (req, res) => {
    console.log(req.body);
    var city = req.body.city;
    var pincode = req.body.pincode;
    var address = req.body.address;
    var remarks = req.body.remarks;
    var payment_mode = req.body.payment_mode;
    var grandTotal = req.body.grandTotal;
    var ref_id = req.body.ref_id;
    var username = session.userName;

    var remarks_2 = "";

    if (remarks == "") {
        remarks_2 = null;
    } else {
        remarks_2 = `"${remarks}"`;
    }

    var payment_status = "";

    if (payment_mode == "COD") {
        payment_status = "Pending";
    } else {
        payment_status = "Complete";
    }

    let reference_id = ``;
    if (ref_id === null) {
        reference_id = null;
    } else {
        reference_id = `${ref_id}`;
    }

    var orderSQL = `INSERT INTO orders(grand_total, payment_mode, city, pincode, address, remarks, order_status, username, ref_id, payment_status) 
                    VALUES("${grandTotal}", "${payment_mode}","${city}", "${pincode}", "${address}", ${remarks_2}, "Pending", "${username}", ${reference_id}, "${payment_status}")`;
    // console.log(orderSQL);
    connection.query(orderSQL, (error, row) => {
        if (error) {
            res.send("error");
        } else {
            // console.log(row);
            var lastInserted_id = row.insertId;
            // console.log(session.cart);
            var cart = session.cart;

            for (var i = 0; i < cart.length; i++) {
                // console.log(cart[i]);
                var id = cart[i].id;
                var p_name = cart[i].product_name;
                var price = cart[i].price;
                var discount = cart[i].discount;
                var discountPrice = cart[i].discountPrice;
                var quantity = cart[i].quantity;
                var detailsSQL = `INSERT INTO order_details(price, discount, discounted_price, quantity, product_id, order_id)
                                  VALUES("${price}", "${discount}", "${discountPrice}", "${quantity}", ${id}, ${lastInserted_id})`;
                connection.query(detailsSQL, (err) => {
                    if (err) {
                        console.log(err);
                        // res.send("error");
                    }
                });
            }
            session.cart = undefined;
            res.send("success");
        }
    });
});

router.get("/user-logout", (req, res) => {
    session.userName = undefined;
    session.fullname = undefined;
    res.send("success")
});

router.post("/change-password", (req, res) => {
    const current = req.body.current;
    const newPassword = req.body.newPassword;
    const confirm = req.body.confirmPassword;
    const username = session.userName;

    const checkOldPassword = `SELECT * FROM users WHERE username="${username}"`;
    connection.query(checkOldPassword, (error, row) => {
        if (error) {
            res.send("error");
        } else {
            // console.log(row);
            var password = row[0].password;
            // console.log(password);
            if (password !== current) {
                res.send("invalid");
            } else {
                var updateSQL = `UPDATE users SET password="${newPassword}" WHERE username="${username}"`;
                connection.query(updateSQL, (error) => {
                    if (error) {
                        res.send("error");
                    } else {
                        res.send("updated");
                    }
                });
            }
        }
    });
});

router.get("/change-password", (req, res) => {
    if (session.userName !== undefined) {
        res.render('users/change_password', {title: "Change Password", text: "Change Password"});
    } else {
        res.redirect("/user-login")
    }
});

router.get('/', function (req, res, next) {
    if (session.userName != undefined) {
        res.render('users/user_home', {username: session.fullname, title: "", text: ""});
    } else {
        res.redirect("/user-login")
    }
});

module.exports = router;
