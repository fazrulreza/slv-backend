const fs = require('fs');
const path = require('path');

const whereFilter = (object, where) => object.filter((z) => {
  // eslint-disable-next-line no-restricted-syntax
  for (const key in where) {
    if (z[key] !== where[key]) return false;
  }
  return true;
});

const whereNotFilter = (object, where) => object.filter((z) => {
  // eslint-disable-next-line no-restricted-syntax
  for (const key in where) {
    if (z[key] === where[key]) return false;
  }
  return true;
});

class FileModel {
  constructor(fileName) {
    this.location = path.join(__dirname, '..', '..', 'data', fileName);
    const rawdata = fs.readFileSync(this.location);
    this.model = JSON.parse(rawdata);
  }

  findAll({ where }) {
    if (where) {
      // return this.model.filter((y) => y[Object.keys(where)[0]] === Object.values(where)[0]);
      return whereFilter(this.model, where);
    }
    return this.model;
  }

  findOne({ where }) {
    return whereFilter(this.model, where)[0];
  }

  findById(ID) {
    return this.model.filter((y) => y.ID === ID)[0];
  }

  bulkCreate(object) {
    console.log(this.model.length);
    // console.log(object);
    this.model = [
      ...this.model,
      ...object,
    ];
    console.log(this.model.length);

    const data = JSON.stringify(this.model);
    fs.writeFileSync(this.location, data);

    return object;
  }

  create(object) {
    this.model = [
      ...this.model,
      object,
    ];

    const data = JSON.stringify(this.model);
    fs.writeFileSync(this.location, data);

    return object;
  }

  update({ object, where }) {
    const remain = whereNotFilter(this.model, where);
    const changed = whereFilter(this.model, where);

    const applyChange = changed.map((ch) => ({
      ...ch,
      ...object,
    }));

    this.model = [
      ...remain,
      ...applyChange,
    ];
    const data = JSON.stringify(this.model);
    fs.writeFileSync(this.location, data);

    return {
      ID: '1',
      added: '1',
    };
  }

  delete({ where }) {
    this.model = whereFilter(this.model, where);

    const data = JSON.stringify(this.model);
    fs.writeFileSync(this.location, data);
    return {
      ID: '1',
      deleted: '1',
    };
  }
}

module.exports = FileModel;
