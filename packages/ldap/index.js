/* eslint-disable prefer-promise-reject-errors */
const LDAP = require('ldapjs');
// import { format as StringFormat } from 'util';

const getProperObject = (entry) => {
  const obj = {
    dn: entry.dn.toString(),
    controls: [],
  };
  entry.attributes.forEach((a) => {
    const { buffers, vals, type } = a;
    const buf = buffers;
    const val = vals;
    let item;
    if (type === 'thumbnailPhoto') item = buf;
    else item = val;
    if (item && item.length) {
      if (item.length > 1) {
        obj[type] = item.slice();
      } else {
        // eslint-disable-next-line prefer-destructuring
        obj[type] = item[0];
      }
    } else {
      obj[type] = [];
    }
  });
  entry.controls.forEach((element) => {
    obj.controls.push(element.json);
  });
  return obj;
};

/**
 * Authenticates the user using LDAP
 * @param {Object} input- Information about the user to be authenticated.
 * @param {string} input.username- User's username.
 * @param {string} input.password- User's password.
 * @returns {Promise<Object>}
 */
const Login = (input) => {
  const { username, password, needAdmin } = input;
  const postUser = `SMEBANK\\${username}`;

  // const ldapcfg = config.sso;
  // const userDN = ldapcfg['base-dn'];
  const userDN = process.env.SSO_BASE_DN;
  const searchOpts = {
    filter: `(sAMAccountName=${username})`,
    scope: 'sub',
    attributes: ['cn', 'mail', 'thumbnailPhoto', 'telephoneNumber', 'mobile', 'department'],
  };
  // const client = LDAP.createClient({ url: ldapcfg.url });
  const client = LDAP.createClient({ url: process.env.SSO_URL });

  return new Promise((resolve, reject) => {
    client
      .on('error', (ex) => {
        // console.error('ex:', ex);
        reject(ex);
      });

    // 1) Connect to the LDAP server
    client
      .on('connect', () => {
        // console.log('connected');
        // 2) Authenticate to the LDAP server
        new Promise((resolve, reject) => {
          // console.log('binding');
          if (needAdmin) {
            const { dn, password: pass } = ldapcfg.credential;
            client.bind(dn, pass, (err1) => {
              if (err1) { return reject(err1); }
              return resolve();
            });
          } else {
            client.bind(postUser, password, (err1) => {
              // console.log('err1', err1);
              if (err1) { return reject(err1); }
              return resolve();
            });
          }
        })
          .then(() => new Promise((resolve, reject) => {
            // console.log('test password');
            // 3) Test password
            if (needAdmin) {
              const attribute = 'userPassword';
              client.compare(
                userDN,
                attribute,
                password,
                (err, matched) => (matched === true ? resolve() : reject({ code: 49 })),
              );
            } else {
              resolve();
            }
          }))
          .then(() => new Promise((resolve, reject) => {
            // 4) Search user in the LDAP Server
            let searchresult;
            // console.log('searching');
            client.search(
              userDN,
              searchOpts,
              (err, res) => {
                res.on('searchEntry', (entry) => {
                  // console.log(entry.object);
                  const ob = getProperObject(entry);
                  searchresult = entry.object;
                  searchresult.thumbnailPhoto = ob.thumbnailPhoto;
                });
                // res.on('searchReference', (referral) => {
                //   console.log(`referral: ${referral.uris.join()}`);
                // });
                res.on('error', (errx) => {
                  // console.log(errx);
                  reject(errx);
                });
                res.on('end', () => {
                  client.unbind();
                  client.destroy();

                  if (!searchresult) return null;
                  resolve(searchresult);
                });
              },
            );
          }))
          .then((result) => {
            resolve(result);
          })
          .catch((ex) => {
            if (client.connected) { client.unbind(); }
            client.destroy();
            if (ex.code === 49) { return reject('401 Unauthorized'); }
            if (ex.error && ex.error.code) {
              return reject(`${ex.error.code} ${ex.error.message}`);
            } if (ex.code && ex.message) {
              return reject(`${ex.code} ${ex.message}`);
            }

            reject(ex);
          });
      });
  });
};

module.exports = Login;
