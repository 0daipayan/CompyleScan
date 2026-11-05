import Storage from './Storage';
import { MAIN_BASE_URL } from './EnvVariables';
// import RNFetchBlob from 'rn-fetch-blob';
import RNFS from 'react-native-fs';

const BASE_URL = MAIN_BASE_URL;


// ============================================================
// GET TOKEN
// ============================================================

async function getToken() {
    return await Storage.get('token');
}


// ============================================================
// BASIC HTTP METHODS
// ============================================================

function get(endpoint, params) {
    return request(endpoint, params);
}

function post(endpoint, params) {
    return request(endpoint, params, 'POST');
}

function put(endpoint, params) {
    return request(endpoint, params, 'PUT');
}

function Delete(endpoint, params) {
    return request(endpoint, params, 'DELETE');
}


// ============================================================
// COMMON REQUEST
// ============================================================

async function request(endpoint, params = null, method = 'GET') {

    const token = await getToken();

    const xmlRequest = new XMLHttpRequest();

    const url = BASE_URL + endpoint;

    console.log('HTTP Request:', method, url);

    return new Promise((resolve, reject) => {

        xmlRequest.open(method, url, true);

        xmlRequest.setRequestHeader('Accept', '*/*');
        xmlRequest.setRequestHeader('Content-Type', 'application/json');

        // IMPORTANT:
        // Backend expects:
        // Authorization: Bearer <token>
        if (token) {
            xmlRequest.setRequestHeader(
                'Authorization',
                `Bearer ${token}`
            );
        }

        if (method === 'GET') {
            xmlRequest.send();
        } else {
            xmlRequest.send(JSON.stringify(params));
        }

        xmlRequest.onreadystatechange = function () {

            if (xmlRequest.readyState === XMLHttpRequest.DONE) {

                console.log(
                    'HTTP Status:',
                    xmlRequest.status
                );

                console.log(
                    'HTTP Response:',
                    xmlRequest.responseText
                );

                if (
                    xmlRequest.status >= 200 &&
                    xmlRequest.status < 300
                ) {

                    try {

                        resolve(
                            JSON.parse(xmlRequest.responseText)
                        );

                    } catch (err) {

                        resolve(
                            xmlRequest.responseText
                        );
                    }

                } else {

                    try {

                        reject(
                            JSON.parse(xmlRequest.responseText)
                        );

                    } catch (err) {

                        reject({
                            error:
                                'Server Error Please try again later !!!',
                            status: xmlRequest.status,
                            actError: err,
                        });

                    }

                }

            }

        };

        xmlRequest.onerror = function () {

            reject({
                error: 'Network error',
                message: 'Could not connect to backend.',
            });

        };

    });

}


// ============================================================
// FILE UPLOAD
// ============================================================

const FileUpload = async (
    url,
    file,
    object_get = {}
) => {

    return new Promise(async function (resolve, reject) {

        try {

            const token = await getToken();

            const apiUrl = BASE_URL + url;

            console.log('File Upload URL:', apiUrl);

            const data = new FormData();

            const objArray = Object.keys(object_get);

            objArray.forEach((element) => {

                data.append(
                    element,
                    object_get[element]
                );

            });

            if (file && file.path !== '') {

                const originalName =
                    await getOriginalname(file.path);

                console.log(
                    'Original name:',
                    originalName
                );

                data.append('video', {
                    uri: file.path,
                    type: file.mime || 'video/mp4',
                    name: originalName,
                });

            }

            const xhr = new XMLHttpRequest();

            xhr.withCredentials = true;

            xhr.onreadystatechange = function () {

                console.log(
                    'File upload response:',
                    xhr.response
                );

                if (
                    xhr.readyState === XMLHttpRequest.DONE
                ) {

                    if (
                        xhr.status >= 200 &&
                        xhr.status < 300
                    ) {

                        try {

                            resolve(
                                JSON.parse(xhr.response)
                            );

                        } catch (error) {

                            resolve(xhr.response);

                        }

                    } else {

                        try {

                            reject(
                                JSON.parse(xhr.response)
                            );

                        } catch (error) {

                            reject({
                                error: 'File upload failed',
                                status: xhr.status,
                                response: xhr.response,
                            });

                        }

                    }

                }

            };

            xhr.onerror = function () {

                reject({
                    error: 'Network error',
                    message: 'Could not connect to backend.',
                });

            };

            xhr.open('POST', apiUrl, true);

            xhr.setRequestHeader(
                'Content-Type',
                'multipart/form-data'
            );

            xhr.setRequestHeader(
                'cache-control',
                'no-cache'
            );

            // IMPORTANT:
            // Send Bearer token
            if (token) {

                xhr.setRequestHeader(
                    'Authorization',
                    `Bearer ${token}`
                );

            }

            xhr.send(data);

        } catch (error) {

            reject(error);

        }

    });

};


// ============================================================
// NEW FILE UPLOAD
// ============================================================

const newFileUpload = async (
    url,
    file,
    object_get = {}
) => {

    return new Promise(async function (resolve, reject) {

        try {

            const token = await getToken();

            const apiUrl = BASE_URL + url;

            console.log(
                'New File Upload URL:',
                apiUrl
            );

            const data = new FormData();

            Object.keys(object_get).forEach((element) => {

                data.append(
                    element,
                    object_get[element]
                );

            });

            if (file && file.path) {

                const originalName =
                    await getOriginalname(file.path);

                data.append('file', {
                    uri: file.path,
                    type: file.mime || 'application/octet-stream',
                    name: originalName,
                });

            }

            const xhr = new XMLHttpRequest();

            xhr.onreadystatechange = function () {

                if (
                    xhr.readyState === XMLHttpRequest.DONE
                ) {

                    console.log(
                        'New file upload status:',
                        xhr.status
                    );

                    console.log(
                        'New file upload response:',
                        xhr.responseText
                    );

                    if (
                        xhr.status >= 200 &&
                        xhr.status < 300
                    ) {

                        try {

                            resolve(
                                JSON.parse(xhr.responseText)
                            );

                        } catch (error) {

                            resolve(
                                xhr.responseText
                            );

                        }

                    } else {

                        try {

                            reject(
                                JSON.parse(xhr.responseText)
                            );

                        } catch (error) {

                            reject({
                                error: 'File upload failed',
                                status: xhr.status,
                                response:
                                    xhr.responseText,
                            });

                        }

                    }

                }

            };

            xhr.onerror = function () {

                reject({
                    error: 'Network error',
                    message: 'Could not connect to backend.',
                });

            };

            xhr.open('POST', apiUrl, true);

            xhr.setRequestHeader(
                'Accept',
                'application/json'
            );

            xhr.setRequestHeader(
                'cache-control',
                'no-cache'
            );

            if (token) {

                xhr.setRequestHeader(
                    'Authorization',
                    `Bearer ${token}`
                );

            }

            xhr.send(data);

        } catch (error) {

            reject(error);

        }

    });

};


// ============================================================
// MULTI UPLOAD
// ============================================================

const multiupload = async (
    url,
    files = [],
    object_get = {}
) => {

    return new Promise(async (resolve, reject) => {

        try {

            const token = await getToken();

            const apiUrl = BASE_URL + url;

            console.log(
                'Multi Upload URL:',
                apiUrl
            );

            const data = new FormData();

            Object.keys(object_get).forEach((key) => {

                data.append(
                    key,
                    object_get[key]
                );

            });

            for (const file of files) {

                if (file && file.path) {

                    const originalName =
                        await getOriginalname(file.path);

                    data.append('files', {
                        uri: file.path,
                        type:
                            file.mime ||
                            'application/octet-stream',
                        name: originalName,
                    });

                }

            }

            const xhr = new XMLHttpRequest();

            xhr.onreadystatechange = function () {

                if (
                    xhr.readyState === XMLHttpRequest.DONE
                ) {

                    console.log(
                        'Multi upload status:',
                        xhr.status
                    );

                    console.log(
                        'Multi upload response:',
                        xhr.responseText
                    );

                    if (
                        xhr.status >= 200 &&
                        xhr.status < 300
                    ) {

                        try {

                            resolve(
                                JSON.parse(
                                    xhr.responseText
                                )
                            );

                        } catch (error) {

                            resolve(
                                xhr.responseText
                            );

                        }

                    } else {

                        try {

                            reject(
                                JSON.parse(
                                    xhr.responseText
                                )
                            );

                        } catch (error) {

                            reject({
                                error: 'Upload failed',
                                status: xhr.status,
                                response:
                                    xhr.responseText,
                            });

                        }

                    }

                }

            };

            xhr.onerror = function () {

                reject({
                    error: 'Network error',
                    message: 'Could not connect to backend.',
                });

            };

            xhr.open('POST', apiUrl, true);

            xhr.setRequestHeader(
                'Accept',
                'application/json'
            );

            if (token) {

                xhr.setRequestHeader(
                    'Authorization',
                    `Bearer ${token}`
                );

            }

            xhr.send(data);

        } catch (error) {

            reject(error);

        }

    });

};


// ============================================================
// MUSIC FILE UPLOAD
// ============================================================

const musicFileUpload = async (
    url,
    file,
    object_get = {}
) => {

    return new Promise(async (resolve, reject) => {

        try {

            const token = await getToken();

            const apiUrl = BASE_URL + url;

            console.log(
                'Music Upload URL:',
                apiUrl
            );

            const data = new FormData();

            Object.keys(object_get).forEach((key) => {

                data.append(
                    key,
                    object_get[key]
                );

            });

            if (file && file.path) {

                const originalName =
                    await getOriginalname(file.path);

                data.append('music', {
                    uri: file.path,
                    type:
                        file.mime ||
                        'audio/mpeg',
                    name: originalName,
                });

            }

            const xhr = new XMLHttpRequest();

            xhr.onreadystatechange = function () {

                if (
                    xhr.readyState === XMLHttpRequest.DONE
                ) {

                    console.log(
                        'Music upload status:',
                        xhr.status
                    );

                    console.log(
                        'Music upload response:',
                        xhr.responseText
                    );

                    if (
                        xhr.status >= 200 &&
                        xhr.status < 300
                    ) {

                        try {

                            resolve(
                                JSON.parse(
                                    xhr.responseText
                                )
                            );

                        } catch (error) {

                            resolve(
                                xhr.responseText
                            );

                        }

                    } else {

                        try {

                            reject(
                                JSON.parse(
                                    xhr.responseText
                                )
                            );

                        } catch (error) {

                            reject({
                                error:
                                    'Music upload failed',
                                status: xhr.status,
                                response:
                                    xhr.responseText,
                            });

                        }

                    }

                }

            };

            xhr.onerror = function () {

                reject({
                    error: 'Network error',
                    message:
                        'Could not connect to backend.',
                });

            };

            xhr.open(
                'POST',
                apiUrl,
                true
            );

            xhr.setRequestHeader(
                'Accept',
                'application/json'
            );

            if (token) {

                xhr.setRequestHeader(
                    'Authorization',
                    `Bearer ${token}`
                );

            }

            xhr.send(data);

        } catch (error) {

            reject(error);

        }

    });

};


// ============================================================
// GET ORIGINAL FILE NAME
// ============================================================

async function getOriginalname(data) {

    console.log('File path:', data);

    const arr = data.split('/');

    const lent = Number(arr.length - 1);

    return arr[lent];

}


// ============================================================
// EVALUATE PACKAGE
// ============================================================
// This is the important function used by the inspection flow.
// It sends the captured images using:
//
// packageImages
//
// and sends the JWT as:
//
// Authorization: Bearer <token>
// ============================================================

const evaluatePackage = async (
    url,
    files,
    object_get = {}
) => {

    const token = await getToken();

    const apiUrl = BASE_URL + url;

    console.log(
        'Evaluation API:',
        apiUrl
    );

    console.log(
        'Images:',
        files
    );

    console.log(
        'Token available:',
        !!token
    );

    return new Promise(async (resolve, reject) => {

        try {

            const data = new FormData();


            // Add normal form fields
            Object.keys(object_get).forEach((key) => {

                data.append(
                    key,
                    object_get[key]
                );

            });


            // Add captured images
            for (const file of files || []) {

                if (file?.path) {

                    const originalName =
                        await getOriginalname(
                            file.path
                        );

                    console.log(
                        'Adding package image:',
                        originalName
                    );

                    data.append(
                        'packageImages',
                        {
                            uri: file.path,
                            type:
                                file.mime ||
                                'image/jpeg',
                            name: originalName,
                        }
                    );

                }

            }


            const xhr =
                new XMLHttpRequest();


            xhr.onreadystatechange =
                function () {

                    if (
                        xhr.readyState ===
                        XMLHttpRequest.DONE
                    ) {

                        console.log(
                            'Evaluation status:',
                            xhr.status
                        );

                        console.log(
                            'Evaluation response:',
                            xhr.responseText
                        );


                        if (
                            xhr.status >= 200 &&
                            xhr.status < 300
                        ) {

                            try {

                                resolve(
                                    JSON.parse(
                                        xhr.responseText
                                    )
                                );

                            } catch (error) {

                                reject({
                                    error:
                                        'Invalid server response',
                                    response:
                                        xhr.responseText,
                                });

                            }

                        } else {

                            try {

                                reject(
                                    JSON.parse(
                                        xhr.responseText
                                    )
                                );

                            } catch (error) {

                                reject({
                                    error:
                                        'Server Error',
                                    status:
                                        xhr.status,
                                    response:
                                        xhr.responseText,
                                });

                            }

                        }

                    }

                };


            xhr.onerror = function () {

                reject({
                    error:
                        'Network error',
                    message:
                        'Could not connect to backend.',
                });

            };


            xhr.open(
                'POST',
                apiUrl,
                true
            );


            xhr.setRequestHeader(
                'Accept',
                'application/json'
            );


            // IMPORTANT:
            // Backend protect middleware expects
            // "Bearer <JWT>"
            if (token) {

                xhr.setRequestHeader('Authorization', `Bearer ${token}`);

            }


            // DO NOT manually set Content-Type here.
            //
            // React Native will automatically generate:
            // multipart/form-data; boundary=...
            //
            // This is important for FormData.
            xhr.send(data);

        } catch (error) {

            reject(error);

        }

    });

};


// ============================================================
// EXPORT
// ============================================================

const HttpClient = {

    get,
    post,
    put,
    Delete,

    multiupload,
    newFileUpload,
    FileUpload,
    musicFileUpload,

    evaluatePackage,

};

export default HttpClient;