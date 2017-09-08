exports.DATABASE_URL = process.env.DATABASE_URL ||
                       global.DATABASE_URL ||
                      'mongodb://localhost/thinkful-acronym-finder';
exports.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ||
                       global.TEST_DATABASE_URL ||
							         'mongodb://localhost/test-thinkful-acronym-finder';
exports.PORT = process.env.PORT || 8080;
exports.JWT_SECRET = process.env.JWT_SECRET;
exports.JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';
exports.BCRYPT_HASH_LENGTH = +process.env.BCRYPT_HASH_LENGTH || 10;
