function _respond(res, data, http_code) {
    var response = {
        'error': data.error,
        'code':http_code,
        'data':data.response,
        'message':data.message
    };
    res.writeHead(http_code);
    res.end(JSON.stringify(response));
}

module.exports.success = function success(res, data, status=200){
    data.error = false;
    _respond(res, data, status);
};

module.exports.failure = function failure(res, data, http_code){
    data.error = true;    
    _respond(res, data, http_code);
};