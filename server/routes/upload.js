/**
 * Created by pranavram on 11/7/15.
 */
var UploadController = require('../controllers/upload');

module.exports = [
    {
        method: 'POST',
        path: '/upload',
        config: {
            payload: {
                maxBytes: 209715200,
                output: 'stream',
                parse: false
            },
            timeout: {
                socket: false
            }
        },
        handler: UploadController.uploadDocuments
    }
];