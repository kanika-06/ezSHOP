const express = require("express");
const router = express.Router();
const productModel = require("../models/product"); //load product model - allows us to perform CRUD
const path = require("path");
const isAuthenticated = require("../middleware/authentication");

//Route for Products
router.get("/product-list", (req, res) => {
  let filter = {};

  if (req.query.category && req.query.category != "All") {
    filter.category = req.query.category;
  }

  if (req.query.search) {
    filter.productName = new RegExp(req.query.search, "i");
  }

  productModel
    .find(filter)
    .then((products) => {
      const mappedProducts = products.map((product) => {
        return {
          id: product._id,
          productName: product.productName,
          description: product.description,
          quantity: product.quantity,
          productImage: product.productImage,
          category: product.category,
          price: product.price,
          isBestSeller: product.isBestSeller,
        };
      });

      res.render("products/product-list", {
        title: "ezSHOP | Products",
        data: mappedProducts,
      });
    })
    .catch((err) =>
      console.log(`Error occured when pulling from the database :${err}`)
    );
});

router.get("/view/:id", (req, res) => {
  productModel
    .findById(req.params.id)
    .then((product) => {
      const {
        _id,
        productName,
        description,
        price,
        category,
        quantity,
        productImage,
        isBestSeller,
      } = product;

      res.render("products/productDescription", {
        _id,
        productName,
        description,
        price,
        category,
        quantity,
        productImage,
        isBestSeller,
      });
    })
    .catch((err) => console.log(`Error occured: ${err}`));
});

/******************************   ADD PRODUCTS   ****************************************/

//Route to direct inventory to Add products
router.get("/add", isAuthenticated, (req, res) => {
  res.render("/clerkDashboard");
});

//Route to process inventory clerk's request and  add data when the he/she submits the add product form
router.post("/add", isAuthenticated, (req, res) => {
  /*
Rules for inserting into a MongoDB database *USING MONGOOSE* is to do the following :

1. Create an instance of the model - you *MUST* pass data that you want inserted in the 
form of an object(object literal)
2. From the instance, you call the save method
*/
  //Object
  const newProduct = {
    productName: req.body.productName,
    productImage: JSON.stringify(req.files.productImage), // turn file object into string
    price: req.body.price,
    description: req.body.description,
    category: req.body.category,
    quantity: req.body.quantity,
    isBestSeller: req.body.isBestSeller,
  };

  //Instance - creating instance means using the NEW keeyword
  const product = new productModel(newProduct);
  product
    .save()
    .then((product) => {
      req.files.productImage.name = `pic_${product._id}${
        path.parse(req.files.productImage.name).ext
      }`;
      req.files.productImage
        .mv(`public/uploads/${req.files.productImage.name}`)

        .then(() => {
          productModel
            .updateOne(
              { _id: product._id },
              {
                productImage: req.files.productImage.name,
              }
            )
            .then(() => {
              res.redirect("/product/product-list");
            });
        });
    })
    .catch((err) =>
      console.log(`Error happened when inserting in the database :${err}`)
    );
});

/******************************   EDIT PRODUCTS   ****************************************/

router.get("/edit", isAuthenticated, (req, res) => {
  res.redirect("/products/editProductForm");
});

router.get("/edit/:id", isAuthenticated, (req, res) => {
  productModel
    .findById(req.params.id)
    .then((product) => {
      const {
        _id,
        productName,
        description,
        price,
        category,
        quantity,
        productImage,
        isBestSeller,
      } = product;

      res.render("products/editProductForm", {
        _id,
        productName,
        description,
        price,
        category,
        quantity,
        productImage,
        isBestSeller,
      });
    })
    .catch((err) => console.log(`Error occured: ${err}`));
});

router.put("/update/:id", (req, res) => {
  const product = {
    productName: req.body.productName,
    description: req.body.description,
    price: req.body.price,
    category: req.body.category,
    quantity: req.body.quantity,
    isBestSeller: req.body.isBestSeller,
  };

  productModel
    .updateOne({ _id: req.params.id }, product)
    .then(() => {
      res.redirect("/product/product-list");
    })
    .catch((err) => console.log(`Error occurred: ${err}`));
});

router.delete("/delete/:id", (req, res) => {
  productModel
    .deleteOne({ _id: req.params.id })
    .then(() => {
      res.redirect("/product/product-list");
    })
    .catch((err) => console.log(`Error occurred: ${err}`));
});

/******************************   SEARCH PRODUCTS   ****************************************/
router.post("/search", (req, res) => {
  let filter = "";

  if (req.body.category) {
    filter += "?category=" + req.body.category;
  }

  if (req.body.search.length > 0) {
    filter += "&search=" + req.body.search;
  }

  res.redirect(`/product/product-list${filter}`);
});

module.exports = router;
