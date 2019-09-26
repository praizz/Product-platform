import {productListControllers} from '../controllers/productList';

module.exports.routes = (app) => {
    app.get('/getproductList', (req, res) => {
        productListControllers.getAllproduct(req, res);
    })
    app.get('/getproductList/:productId', (req, res) => {
        productListControllers.getproductByID(req, res);
    })
    app.put('/updateproductList/:productId', (req, res) => {
        productListControllers.updateproductByID(req, res);
    })
    app.delete('/deleteproductList/:productId', (req, res) => {
        productListControllers.deleteproductbyID(req, res);
    })
}