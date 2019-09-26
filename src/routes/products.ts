import  {productsController} from '../controllers/products';

module.exports.routes = (app) => {
    app.post('/products', (req, res) => {
        productsController.createProduct(req, res);
    })
    app.get('/products', (req, res) => {
        productsController.getProducts(req, res);
    })
    app.get('/product/:productId', (req, res) => {
        productsController.getProductByID(req, res);
    })
    app.put('/product/:productId', (req, res) => {
        productsController.updateProductByID(req, res);
    })
    app.delete('/products/:productId', (req, res) => {
        productsController.deleteProductByID(req, res);
    })
    app.post('/productTypes', (req, res) => {
        productsController.addproductType(req, res);
    })
    app.get('/productTypes', (req, res) => {
        productsController.getProductType(req, res);
    })

}